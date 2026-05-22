import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import Logo from "@/components/Logo";
import {
  LogOut, Plus, Trash2, Edit2, X, Loader2, Check,
  Building2, ArrowLeft, Store, ChevronRight, Users, BarChart3, TrendingUp,
  ShieldCheck, UserPlus, Eye, EyeOff
} from "lucide-react";

interface Outlet {
  id: string; name: string; slug: string; brand_code: string;
  logo_url: string | null; brand_color: string; table_count: number;
  is_dine_in_enabled: boolean; is_takeaway_enabled: boolean; is_delivery_enabled: boolean;
}

interface Profile { id: string; outlet_id: string | null; role: string; brand_code?: string; }

export default function OutletsDashboard() {
  const { unitId: brandCode } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletAdmins, setOutletAdmins] = useState<{ id: string; outlet_id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "outlets";
  const setTab = (t: string) => setSearchParams({ tab: t }, { replace: true });

  // Outlet modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", brand_code: brandCode ?? "", brand_color: "#f97316",
    table_count: 10, is_dine_in_enabled: true, is_takeaway_enabled: true, is_delivery_enabled: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Outlet | null>(null);

  // Admin outlet creation
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", outlet_id: "" });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);

  const [deleteAdminTarget, setDeleteAdminTarget] = useState<{ id: string; email: string } | null>(null);

  // Edit admin
  const [editingAdmin, setEditingAdmin] = useState<{ id: string; email: string; outlet_id: string } | null>(null);
  const [editAdminForm, setEditAdminForm] = useState({ outlet_id: "" });
  const [editAdminSaving, setEditAdminSaving] = useState(false);
  const [editAdminError, setEditAdminError] = useState("");

  // Reset password for outlet admin
  const [resetPassTarget, setResetPassTarget] = useState<{ id: string; email: string } | null>(null);
  const [resetPassNew, setResetPassNew] = useState("");
  const [resetPassShow, setResetPassShow] = useState(false);
  const [resetPassSaving, setResetPassSaving] = useState(false);
  const [resetPassError, setResetPassError] = useState("");

  const isSuperAdmin = profile?.role === "super_admin";

  const fetchData = useCallback(async () => {
    if (!brandCode) return;
    setLoading(true);
    try {
      const { data: outletData } = await supabase.from("outlets").select("*")
        .eq("brand_code", brandCode).order("name");
      setOutlets(outletData ?? []);

      // Fetch outlet admins via edge function
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const adminList = data
            .filter((u: any) => u.profile?.role === "outlet_admin" && u.profile?.outlet_id)
            .map((u: any) => ({
              id: u.id,
              outlet_id: u.profile.outlet_id,
              email: u.email
            }));
          setOutletAdmins(adminList);
        } else {
          throw new Error("Failed to fetch users");
        }
      } catch (err) {
        setOutletAdmins([]);
      }
    } finally {
      setLoading(false);
    }
  }, [brandCode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditingOutlet(null);
    setForm({ name: "", slug: "", brand_code: brandCode ?? "", brand_color: "#f97316", table_count: 10, is_dine_in_enabled: true, is_takeaway_enabled: true, is_delivery_enabled: true });
    setLogoFile(null);
    setLogoPreview("");
    setIsModalOpen(true);
  };

  const openEdit = (o: Outlet) => {
    setEditingOutlet(o);
    setForm({ name: o.name, slug: o.slug, brand_code: o.brand_code, brand_color: o.brand_color, table_count: o.table_count, is_dine_in_enabled: o.is_dine_in_enabled, is_takeaway_enabled: o.is_takeaway_enabled, is_delivery_enabled: o.is_delivery_enabled });
    setLogoPreview(o.logo_url ?? "");
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (outletId: string): Promise<string | null> => {
    if (!logoFile) return logoPreview || null;
    setUploadingLogo(true);
    try {
      const ext = logoFile.name.split(".").pop();
      const path = `logos/${outletId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(path, logoFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      toast("Gagal upload logo: " + err.message, "error");
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = form.slug.toLowerCase().replace(/[^a-z0-9-_]/g, "");
      if (editingOutlet) {
        const logoUrl = await uploadLogo(editingOutlet.id);
        const payload = { ...form, slug, logo_url: logoUrl };
        const { error } = await supabase.from("outlets").update(payload).eq("id", editingOutlet.id);
        if (error) throw error;
        toast("Outlet diperbarui", "success");
      } else {
        const { data, error } = await supabase.from("outlets").insert({ ...form, slug }).select().single();
        if (error) throw error;
        if (logoFile && data) {
          const logoUrl = await uploadLogo(data.id);
          if (logoUrl) await supabase.from("outlets").update({ logo_url: logoUrl }).eq("id", data.id);
        }
        toast("Outlet berhasil ditambahkan", "success");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true);
    setAdminError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          email: adminForm.email,
          password: adminForm.password,
          outlet_id: adminForm.outlet_id || null,
          brand_code: brandCode,
          role: "outlet_admin",
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat akun");
      toast("Admin outlet berhasil dibuat", "success");
      setIsAdminModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleDelete = async (outlet: Outlet) => {
    const { error } = await supabase.from("outlets").delete().eq("id", outlet.id);
    if (error) { toast(error.message, "error"); return; }
    toast("Outlet dihapus", "success");
    setConfirmDelete(null);
    fetchData();
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setEditAdminSaving(true);
    setEditAdminError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          user_id: editingAdmin.id,
          outlet_id: editAdminForm.outlet_id || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui admin");
      toast("Admin outlet berhasil diperbarui", "success");
      setEditingAdmin(null);
      fetchData();
    } catch (err: any) {
      setEditAdminError(err.message);
    } finally {
      setEditAdminSaving(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteAdminTarget) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ user_id: deleteAdminTarget.id }),
      });
      if (!res.ok) throw new Error("Gagal menghapus admin");
      toast("Admin outlet berhasil dihapus", "success");
      setDeleteAdminTarget(null);
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const brandColor = outlets[0]?.brand_color ?? "#f97316";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  return (
    <div
      className="min-h-screen bg-neutral-50 flex flex-col font-sans"
      style={{
        "--color-brand": brandColor,
        "--color-brand-hover": brandColorHover,
        "--color-brand-light": brandColorLight,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button onClick={() => navigate("/admin/units")} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 cursor-pointer transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Logo size="sm" />
          {brandCode && (
            <div className="flex items-center gap-1.5 bg-brand/5 border border-zinc-200 px-2.5 py-1 rounded-full">
              <Building2 className="w-3 h-3 text-brand/70" />
              <span className="text-[11px] font-semibold text-brand uppercase">{brandCode}</span>
            </div>
          )}
        </div>
        <button onClick={signOut} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-all" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-200 px-4 md:px-6">
        <div className="flex gap-1 max-w-4xl mx-auto overflow-x-auto">
          {[
            { key: "dashboard", label: "Dashboard", icon: BarChart3 },
            { key: "outlets", label: "Daftar Outlet", icon: Store },
            { key: "managers", label: "Staf & Admin", icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${tab === key ? "border-brand text-brand" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* ── DASHBOARD TAB ── */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Performa Brand {brandCode}</h1>
              <p className="text-xs text-neutral-500 mt-0.5">Ringkasan performa untuk seluruh outlet.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Outlet</p>
                  <p className="font-extrabold text-xl text-neutral-900">{outlets.length}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Staf</p>
                  <p className="font-extrabold text-xl text-neutral-900">{outletAdmins.length}</p>
                </div>
              </div>
            </div>
            
            <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 border-dashed">
              <TrendingUp className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-600">Integrasi Analitik Penjualan</p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">Laporan omzet mingguan seluruh outlet akan hadir di pembaruan selanjutnya.</p>
            </div>
          </div>
        )}

        {/* ── OUTLETS TAB ── */}
        {tab === "outlets" && (
          <>
            <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Outlet Brand {brandCode}</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Kelola semua outlet dalam brand ini.</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> Tambah Outlet
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
        ) : outlets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
            <Store className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Belum ada outlet</p>
            <button onClick={openAdd} className="mt-3 text-xs font-semibold text-brand hover:underline cursor-pointer">+ Tambah outlet pertama</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {outlets.map(outlet => {
              const adminOutlet = outletAdmins.find(a => a.outlet_id === outlet.id);
              return (
                <div key={outlet.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-300 transition-all">
                  {/* Color bar */}
                  <div className="h-1" style={{ background: outlet.brand_color }} />
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-8 rounded border border-neutral-200 overflow-hidden bg-neutral-50 flex-shrink-0 flex items-center justify-center">
                        {outlet.logo_url ? (
                          <img src={outlet.logo_url} alt={outlet.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-neutral-900 truncate">{outlet.name}</p>
                        <p className="text-[10px] text-neutral-400">{outlet.slug}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {outlet.is_dine_in_enabled && <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded font-medium border border-neutral-200">Dine-in</span>}
                      {outlet.is_takeaway_enabled && <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded font-medium border border-neutral-200">Takeaway</span>}
                      {outlet.is_delivery_enabled && <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded font-medium border border-neutral-200">Delivery</span>}
                      <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded font-medium border border-neutral-200">{outlet.table_count} meja</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-3">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Admin Outlet: {adminOutlet ? adminOutlet.email : "—"}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                      <button onClick={() => navigate(`/admin/outlets/${outlet.id}`)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer transition-all">
                        Buka Workspace <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(outlet)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 cursor-pointer transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(outlet)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-red-500 cursor-pointer transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
      )}

        {/* ── MANAGERS TAB ── */}
        {tab === "managers" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-neutral-900">Admin Outlet</h1>
                <p className="text-xs text-neutral-500 mt-0.5">Daftar admin outlet di brand {brandCode}.</p>
              </div>
              <button onClick={() => { setIsAdminModalOpen(true); setAdminForm({ email: "", password: "", outlet_id: "" }); setAdminError(""); setShowAdminPass(false); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all">
                <UserPlus className="w-4 h-4" /> Tambah Admin Outlet
              </button>
            </div>
            {outletAdmins.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
                <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Belum ada admin outlet terdaftar.</p>
              </div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
                {outletAdmins.map((m, idx) => {
                  const outlet = outlets.find(o => o.id === m.outlet_id);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <p className="font-semibold text-sm text-neutral-900">
                          {m.email}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {outlet
                            ? `Ditempatkan di ${outlet.name}`
                            : "Outlet tidak ditemukan"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full border border-purple-100">
                          Admin Outlet
                        </span>
                        <button
                          onClick={() => {
                            setResetPassTarget(m);
                            setResetPassNew("");
                            setResetPassError("");
                          }}
                          className="px-2 py-1 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-all cursor-pointer"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => {
                            setEditingAdmin(m);
                            setEditAdminForm({ outlet_id: m.outlet_id });
                            setEditAdminError("");
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-neutral-400 hover:text-blue-500 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteAdminTarget(m)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Outlet Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">{editingOutlet ? "Edit Outlet" : "Tambah Outlet"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              {/* Logo upload */}
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Logo Outlet</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex items-center justify-center flex-shrink-0">
                    {logoPreview ? <img src={logoPreview} alt="preview" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-neutral-300" />}
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-xs font-medium text-brand bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition-all">
                      {uploadingLogo ? "Mengupload..." : "Pilih File"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                </div>
              </div>

              {[
                { label: "Nama Outlet *", field: "name", type: "text", placeholder: "Mie Gacoan Depok" },
                { label: "Slug (URL ID) *", field: "slug", type: "text", placeholder: "gacoan-depok" },
                { label: "Kode Brand", field: "brand_code", type: "text", placeholder: "APP" },
                { label: "Jumlah Meja", field: "table_count", type: "number", placeholder: "10" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">{label}</label>
                  <input type={type} required={label.includes("*")} value={(form as any)[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder} className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10" />
                </div>
              ))}

              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Warna Brand</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.brand_color} onChange={e => setForm(p => ({ ...p, brand_color: e.target.value }))} className="w-9 h-9 rounded border border-neutral-200 cursor-pointer" />
                  <input type="text" value={form.brand_color} onChange={e => setForm(p => ({ ...p, brand_color: e.target.value }))} className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none" />
                </div>
              </div>

              <div className="flex gap-4">
                {(["is_dine_in_enabled", "is_takeaway_enabled", "is_delivery_enabled"] as const).map(field => (
                  <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.checked }))} className="w-3.5 h-3.5 cursor-pointer accent-brand" />
                    <span className="text-xs font-medium text-neutral-700">{field === "is_dine_in_enabled" ? "Dine-in" : field === "is_takeaway_enabled" ? "Takeaway" : "Delivery"}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Menyimpan...</> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Admin Outlet Modal ── */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsAdminModalOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">Tambah Admin Outlet</h3>
              <button onClick={() => setIsAdminModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            {adminError && <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">{adminError}</div>}
            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Email *</label>
                <input type="email" required value={adminForm.email} onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@outlet.com" className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Password *</label>
                <div className="relative">
                  <input type={showAdminPass ? "text" : "password"} required minLength={6} value={adminForm.password} onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min. 6 karakter" className="w-full py-2 pl-3 pr-9 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10" />
                  <button type="button" onClick={() => setShowAdminPass(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 cursor-pointer">
                    {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Outlet *</label>
                <select value={adminForm.outlet_id} onChange={e => setAdminForm(p => ({ ...p, outlet_id: e.target.value }))} className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none">
                  <option value="">— Pilih Outlet —</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsAdminModalOpen(false)} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
                <button type="submit" disabled={adminSaving} className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {adminSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Membuat...</> : <><UserPlus className="w-3.5 h-3.5" /> Buat Akun</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Admin Modal ── */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditingAdmin(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">Edit Admin Outlet</h3>
              <button onClick={() => setEditingAdmin(null)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            {editAdminError && <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">{editAdminError}</div>}
            <form onSubmit={handleEditAdmin} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Email</label>
                <input type="email" value={editingAdmin.email} disabled
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-500" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Outlet *</label>
                <select value={editAdminForm.outlet_id} onChange={e => setEditAdminForm(p => ({ ...p, outlet_id: e.target.value }))} className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none">
                  <option value="">— Pilih Outlet —</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingAdmin(null)} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
                <button type="submit" disabled={editAdminSaving} className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {editAdminSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</> : <><Check className="w-3.5 h-3.5" /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm text-neutral-900 mb-1">Hapus Outlet</h3>
            <p className="text-sm text-neutral-500 mb-4">Hapus <strong>{confirmDelete.name}</strong>? Semua data (produk, pesanan) akan ikut terhapus.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetPassTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setResetPassTarget(null); setResetPassNew(""); setResetPassError(""); }}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">Reset Password</h3>
              <button onClick={() => { setResetPassTarget(null); setResetPassNew(""); setResetPassError(""); }} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            {resetPassError && <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">{resetPassError}</div>}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!resetPassTarget || !resetPassNew) return;
              setResetPassSaving(true);
              setResetPassError("");
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                  body: JSON.stringify({ target_user_id: resetPassTarget.id, new_password: resetPassNew }),
                });
                if (!res.ok) throw new Error("Gagal reset password");
                toast("Password berhasil direset", "success");
                setResetPassTarget(null);
                setResetPassNew("");
              } catch (err: any) {
                setResetPassError(err.message);
              } finally {
                setResetPassSaving(false);
              }
            }} className="space-y-3">
              <p className="text-sm text-neutral-600">Masukkan password baru untuk <strong>{resetPassTarget.email}</strong></p>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Password Baru *</label>
                <div className="relative">
                  <input type={resetPassShow ? "text" : "password"} required minLength={6} value={resetPassNew} onChange={e => setResetPassNew(e.target.value)}
                    placeholder="Min. 6 karakter" className="w-full py-2 pl-3 pr-9 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10" />
                  <button type="button" onClick={() => setResetPassShow(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 cursor-pointer">
                    {resetPassShow ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setResetPassTarget(null); setResetPassNew(""); setResetPassError(""); }} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
                <button type="submit" disabled={resetPassSaving} className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {resetPassSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</> : <><Check className="w-3.5 h-3.5" /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Admin ── */}
      {deleteAdminTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDeleteAdminTarget(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm text-neutral-900 mb-1">Hapus Admin Outlet</h3>
            <p className="text-sm text-neutral-500 mb-4">Hapus admin <strong>{deleteAdminTarget.email}</strong>? Akun ini akan dihapus permanen.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteAdminTarget(null)} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
              <button onClick={handleDeleteAdmin} className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
