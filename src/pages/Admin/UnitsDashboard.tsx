import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { api, Brand } from "@/services/api";
import Logo from "@/components/Logo";
import BrandsTab from "./BrandsTab";
import UsersTab from "./UsersTab";
import {
  LogOut,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  Building2,
  ShieldCheck,
  Users,
  Store,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  Image,
} from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  slug: string;
  brand_code: string;
  logo_url: string;
  brand_color: string;
  table_count: number;
}

interface Profile {
  id: string;
  outlet_id: string | null;
  role: string;
  brand_code?: string;
}
interface UserRecord {
  id: string;
  email: string;
  profile: Profile | null;
}

export default function UnitsDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const tab = searchParams.get("tab") === "users" ? "users" : "units";
  const setTab = (t: "units" | "users") => {
    if (t === "units") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: "users" }, { replace: true });
    }
  };
  const [brands, setBrands] = useState<Brand[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Unit (brand) CRUD
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({
    code: "",
    name: "",
    logo_url: "",
    brand_color: "#f97316",
  });
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBrandLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `brand-logos/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      setBrandForm((p) => ({ ...p, logo_url: data.publicUrl }));
    } catch (err: any) {
      toast("Gagal upload logo: " + err.message, "error");
    } finally {
      setIsUploadingBrandLogo(false);
    }
  };

  // User management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "omniorder1!",
    brand_code: "",
  });
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Reset password modal
  const [resetPassTarget, setResetPassTarget] = useState<UserRecord | null>(
    null,
  );
  const [resetPassNew, setResetPassNew] = useState("");
  const [resetPassShow, setResetPassShow] = useState(false);
  const [resetPassSaving, setResetPassSaving] = useState(false);
  const [resetPassError, setResetPassError] = useState("");

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "brand" | "user";
    id: string;
    label: string;
    code?: string;
  } | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [brandData, { data: outletData }, { data: profileData }] =
        await Promise.all([
          api.brands.fetchAll(),
          supabase.from("outlets").select("*").order("brand_code"),
          supabase.from("profiles").select("id, outlet_id, role, brand_code"),
        ]);
      setBrands(brandData);
      setOutlets(outletData ?? []);

      // Fetch emails via edge function
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${session?.access_token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          throw new Error("edge fn failed");
        }
      } catch {
        // fallback
        const list: UserRecord[] = (profileData ?? []).map((p) => ({
          id: p.id,
          email: `${p.id.slice(0, 8)}...`,
          profile: p,
        }));
        setUsers(list);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenAddBrand = () => {
    setEditingBrand(null);
    setBrandForm({ code: "", name: "", logo_url: "", brand_color: "#f97316" });
    setIsBrandModalOpen(true);
  };

  const handleOpenEditBrand = (b: Brand) => {
    setEditingBrand(b);
    setBrandForm({
      code: b.code,
      name: b.name,
      logo_url: b.logo_url ?? "",
      brand_color: b.brand_color,
    });
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.code.trim()) return;
    const code = brandForm.code.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    try {
      if (editingBrand) {
        await api.brands.update(editingBrand.id, {
          name: brandForm.name || code,
          logo_url: brandForm.logo_url || null,
          brand_color: brandForm.brand_color,
        });
        // Also update all outlets of this brand to use the new brand color
        const { error: outletsErr } = await supabase
          .from("outlets")
          .update({ brand_color: brandForm.brand_color })
          .eq("brand_code", editingBrand.code);
        if (outletsErr) throw outletsErr;

        // Clear local storage catalog caches to force refetch of new brand color
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("omniorder_catalog_")) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.error(e);
        }

        toast("Brand diperbarui", "success");
      } else {
        await api.brands.create({
          code,
          name: brandForm.name || code,
          logo_url: brandForm.logo_url || null,
          brand_color: brandForm.brand_color,
        });
        // Create a placeholder outlet so brand shows up in outlet listings
        const { error } = await supabase.from("outlets").insert({
          name: brandForm.name || code,
          slug: code + "-main",
          brand_code: code,
          brand_color: brandForm.brand_color || "#f97316",
          table_count: 1,
        });
        if (error) {
          toast(error.message, "error");
          return;
        }
        toast("Brand berhasil ditambahkan", "success");
      }
      setIsBrandModalOpen(false);
      fetchAll();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleDeleteBrand = async (brandId: string, brandCode: string) => {
    await supabase.from("outlets").delete().eq("brand_code", brandCode);
    await api.brands.delete(brandId);
    toast("Brand dihapus", "success");
    fetchAll();
    setConfirmDelete(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSaving(true);
    setUserError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email: userForm.email,
            password: userForm.password || "omniorder1!",
            brand_code: userForm.brand_code || null,
            role: "brand_admin",
          }),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat akun");
      toast("Akun berhasil dibuat", "success");
      setIsUserModalOpen(false);
      fetchAll();
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        },
      );
      toast("Akun dihapus", "success");
      setConfirmDelete(null);
      fetchAll();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassTarget || !resetPassNew) return;
    setResetPassSaving(true);
    setResetPassError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            target_user_id: resetPassTarget.id,
            new_password: resetPassNew,
          }),
        },
      );
      if (!res.ok) throw new Error("Gagal reset password");
      toast("Password berhasil direset", "success");
      setResetPassTarget(null);
      setResetPassNew("");
    } catch (err: any) {
      setResetPassError(err.message);
    } finally {
      setResetPassSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserSaving(true);
    setUserError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            user_id: editingUser.id,
            email: userForm.email,
            brand_code: userForm.brand_code || null,
          }),
        },
      );
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Gagal memperbarui akun");
      }
      toast("Akun berhasil diperbarui", "success");
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchAll();
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 bg-brand/5 border border-zinc-200 px-2.5 py-1 rounded-full text-[10px] font-bold text-brand uppercase">
            <ShieldCheck className="w-3 h-3" /> Super Admin
          </span>
          <button
            onClick={signOut}
            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-200 px-4 md:px-6">
        <div className="flex gap-1 max-w-4xl mx-auto">
          {(
            [
              ["units", "Brands & Outlet", Building2],
              ["users", "Manajemen Akun", Users],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${tab === key ? "border-brand text-brand" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 py-6">
        {/* ── UNITS TAB ── */}
        {tab === "units" && (
          <BrandsTab
            brands={brands}
            outlets={outlets}
            users={users}
            loading={loading}
            onRefresh={fetchAll}
            onAddBrand={() => setIsBrandModalOpen(true)}
            onEditBrand={handleOpenEditBrand}
            onDeleteBrand={(b) => setConfirmDelete(b)}
            onNavigateOutlet={(code) => navigate(`/admin/units/${code}`)}
            onOpenOutlet={(id) => navigate(`/admin/outlets/${id}`)}
          />
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <UsersTab
            users={users}
            brands={brands}
            loading={loading}
            currentUserId={user?.id}
            onAddUser={() => {
              setEditingUser(null);
              setUserForm({ email: "", password: "omniorder1!", brand_code: "" });
              setUserError("");
              setIsUserModalOpen(true);
            }}
            onEditUser={(u) => {
              setEditingUser(u);
              setUserForm({
                email: u.email,
                password: "",
                brand_code: u.profile?.brand_code ?? "",
              });
              setUserError("");
              setIsUserModalOpen(true);
            }}
            onDeleteUser={(id) => setConfirmDelete({ type: "user", id, label: "Akun" })}
            onResetPassword={(u) => {
              setResetPassTarget(u);
              setResetPassNew("");
              setResetPassError("");
            }}
          />
        )}
      </main>

      {/* ── Brand Modal ── */}
      {isBrandModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setIsBrandModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">
                {editingBrand ? "Edit Brand" : "Tambah Brand Baru"}
              </h3>
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <form onSubmit={handleSaveBrand} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Kode Brand *
                </label>
                <input
                  required
                  value={brandForm.code}
                  onChange={(e) =>
                    setBrandForm((p) => ({
                      ...p,
                      code: e.target.value.toLowerCase(),
                    }))
                  }
                  disabled={!!editingBrand}
                  placeholder="gacoan, kenangan, bakso..."
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Nama Brand
                </label>
                <input
                  value={brandForm.name}
                  onChange={(e) =>
                    setBrandForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Mie Gacoan, Kopi Kenangan..."
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Logo
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex items-center justify-center flex-shrink-0">
                    {brandForm.logo_url ? (
                      <img src={brandForm.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>
                  <label className="cursor-pointer flex-shrink-0 h-[38px] flex items-center">
                    <span className={`text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-100 text-brand hover:bg-neutral-200 transition-all whitespace-nowrap ${isUploadingBrandLogo ? "opacity-50" : ""}`}>
                      {isUploadingBrandLogo ? "Upload..." : "Upload"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBrandLogoUpload} disabled={isUploadingBrandLogo} />
                  </label>
                </div>
                <input
                  value={brandForm.logo_url}
                  onChange={(e) => setBrandForm((p) => ({ ...p, logo_url: e.target.value }))}
                  placeholder="Atau masukkan URL logo..."
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Warna Brand
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandForm.brand_color}
                    onChange={(e) =>
                      setBrandForm((p) => ({
                        ...p,
                        brand_color: e.target.value,
                      }))
                    }
                    className="w-9 h-9 rounded border border-neutral-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandForm.brand_color}
                    onChange={(e) =>
                      setBrandForm((p) => ({
                        ...p,
                        brand_color: e.target.value,
                      }))
                    }
                    className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer"
                >
                  {editingBrand ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── User Modal ── */}
      {isUserModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            setIsUserModalOpen(false);
            setEditingUser(null);
          }}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">
                {editingUser ? "Edit Akun" : "Tambah Akun"}
              </h3>
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            {userError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">
                {userError}
              </div>
            )}
            <form
              onSubmit={editingUser ? handleUpdateUser : handleSaveUser}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="admin@brand.com"
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Brand *
                </label>
                <select
                  value={userForm.brand_code}
                  onChange={(e) =>
                    setUserForm((p) => ({ ...p, brand_code: e.target.value }))
                  }
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                >
                  <option value="">— Pilih Brand —</option>
                  {brands.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {userSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                      Menyimpan...
                    </>
                  ) : editingUser ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Simpan
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Buat Akun
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetPassTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            setResetPassTarget(null);
            setResetPassNew("");
            setResetPassError("");
          }}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">
                Reset Password
              </h3>
              <button
                onClick={() => {
                  setResetPassTarget(null);
                  setResetPassNew("");
                  setResetPassError("");
                }}
                className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            {resetPassError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">
                {resetPassError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleResetPassword();
              }}
              className="space-y-3"
            >
              <p className="text-sm text-neutral-600">
                Masukkan password baru untuk{" "}
                <strong>{resetPassTarget.email}</strong>
              </p>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={resetPassShow ? "text" : "password"}
                    required
                    minLength={6}
                    value={resetPassNew}
                    onChange={(e) => setResetPassNew(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full py-2 pl-3 pr-9 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                  />
                  <button
                    type="button"
                    onClick={() => setResetPassShow((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 cursor-pointer"
                  >
                    {resetPassShow ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResetPassTarget(null);
                    setResetPassNew("");
                    setResetPassError("");
                  }}
                  className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetPassSaving}
                  className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {resetPassSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-sm text-neutral-900 mb-1">
              Konfirmasi Hapus
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Hapus <strong>{confirmDelete.label}</strong>? Tindakan ini tidak
              bisa dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  confirmDelete.type === "brand"
                    ? handleDeleteBrand(confirmDelete.id, confirmDelete.code!)
                    : handleDeleteUser(confirmDelete.id)
                }
                className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
