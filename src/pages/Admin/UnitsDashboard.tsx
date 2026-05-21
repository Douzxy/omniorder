import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import Logo from "@/components/Logo";
import {
  LogOut, Plus, Trash2, Edit2, X, Loader2,
  Building2, ShieldCheck, Users, Store, Check,
  Eye, EyeOff, UserPlus
} from "lucide-react";

interface Unit {
  brand_code: string;
  name: string; // derived from first outlet name or brand_code
  outlet_count: number;
}

interface Outlet {
  id: string; name: string; slug: string; brand_code: string;
  logo_url: string; brand_color: string; table_count: number;
}

interface Profile { id: string; outlet_id: string | null; role: string; brand_code?: string; }
interface UserRecord { id: string; email: string; profile: Profile | null; }

export default function UnitsDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"units" | "users">("units");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Unit (brand) CRUD
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandForm, setBrandForm] = useState({ brand_code: "", display_name: "" });

  // User management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", outlet_id: "", role: "admin" });
  const [showPass, setShowPass] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{ type: "brand" | "user"; id: string; label: string } | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: outletData }, { data: profileData }] = await Promise.all([
        supabase.from("outlets").select("*").order("brand_code"),
        supabase.from("profiles").select("id, outlet_id, role, brand_code"),
      ]);
      setOutlets(outletData ?? []);

      // Fetch emails via edge function
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list: UserRecord[] = (data ?? []).map((u: any) => ({
            id: u.id, email: u.email,
            profile: profileData?.find(p => p.id === u.id) ?? null,
          }));
          setUsers(list);
        } else {
          throw new Error("edge fn failed");
        }
      } catch {
        // fallback
        const list: UserRecord[] = (profileData ?? []).map(p => ({
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

  // Group outlets by brand_code
  const brands = React.useMemo(() => {
    const map: Record<string, { brand_code: string; outlets: Outlet[] }> = {};
    outlets.forEach(o => {
      if (!map[o.brand_code]) map[o.brand_code] = { brand_code: o.brand_code, outlets: [] };
      map[o.brand_code].outlets.push(o);
    });
    return Object.values(map);
  }, [outlets]);

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.brand_code.trim()) return;
    // Creating a brand = creating a placeholder outlet
    const { error } = await supabase.from("outlets").insert({
      name: brandForm.display_name || brandForm.brand_code,
      slug: brandForm.brand_code.toLowerCase() + "-main",
      brand_code: brandForm.brand_code.toUpperCase(),
      brand_color: "#f97316",
      table_count: 1,
    });
    if (error) { toast(error.message, "error"); return; }
    toast("Brand berhasil ditambahkan", "success");
    setIsBrandModalOpen(false);
    setBrandForm({ brand_code: "", display_name: "" });
    fetchAll();
  };

  const handleDeleteBrand = async (brand_code: string) => {
    const { error } = await supabase.from("outlets").delete().eq("brand_code", brand_code);
    if (error) { toast(error.message, "error"); return; }
    toast("Brand dihapus", "success");
    fetchAll();
    setConfirmDelete(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSaving(true);
    setUserError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email: userForm.email, password: userForm.password, outlet_id: userForm.outlet_id || null, role: userForm.role }),
      });
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
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ user_id: userId }),
      });
      toast("Akun dihapus", "success");
      setConfirmDelete(null);
      fetchAll();
    } catch (err) {
      toast("Gagal menghapus akun", "error");
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
          <button onClick={signOut} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-200 px-4 md:px-6">
        <div className="flex gap-1 max-w-4xl mx-auto">
          {([["units", "Brands & Outlet", Building2], ["users", "Manajemen Akun", Users]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${tab === key ? "border-brand text-brand" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 py-6">
        {/* ── UNITS TAB ── */}
        {tab === "units" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-neutral-900">Dashboard Super Admin</h1>
                <p className="text-xs text-neutral-500 mt-0.5">Kelola seluruh ekosistem OmniOrder.</p>
              </div>
              <button onClick={() => setIsBrandModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-all cursor-pointer shadow-md shadow-brand/20">
                <Plus className="w-4 h-4" /> Tambah Brand
              </button>
            </div>

            {/* Dashboard Stats */}
            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Brand</p>
                    <p className="font-extrabold text-xl text-neutral-900">{brands.length}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Outlet</p>
                    <p className="font-extrabold text-xl text-neutral-900">{outlets.length}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Akun Aktif</p>
                    <p className="font-extrabold text-xl text-neutral-900">{users.length}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-2">
              <h2 className="text-sm font-bold text-neutral-800 mb-3">Daftar Brand</h2>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
            ) : brands.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
                <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Belum ada brand terdaftar</p>
                <button onClick={() => setIsBrandModalOpen(true)} className="mt-3 text-xs font-semibold text-brand hover:underline cursor-pointer">+ Tambah brand pertama</button>
              </div>
            ) : (
              <div className="space-y-4">
                {brands.map(brand => (
                  <div key={brand.brand_code} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    {/* Brand header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand/5 rounded-lg flex items-center justify-center">
                          <Building2 className="w-3.5 h-3.5 text-brand/70" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-neutral-900">{brand.brand_code}</p>
                          <p className="text-[10px] text-neutral-500">{brand.outlets.length} outlet</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/admin/units/${brand.brand_code}`)}
                          className="px-3 py-1.5 text-xs font-semibold bg-brand/5 rounded-lg hover:bg-brand/10 text-brand cursor-pointer transition-all">
                          Kelola Outlet
                        </button>
                        <button onClick={() => setConfirmDelete({ type: "brand", id: brand.brand_code, label: brand.brand_code })}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-red-500 cursor-pointer transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Outlets list under brand */}
                    <div className="divide-y divide-neutral-50">
                      {brand.outlets.map(outlet => {
                        const managerProfile = users.find(u => u.profile?.outlet_id === outlet.id);
                        return (
                          <div key={outlet.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-6 rounded border border-neutral-200 overflow-hidden bg-neutral-50 flex-shrink-0">
                                {outlet.logo_url ? (
                                  <img src={outlet.logo_url} alt={outlet.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Store className="w-3 h-3 text-neutral-400 m-auto mt-1" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-800">{outlet.name}</p>
                                <p className="text-[10px] text-neutral-400">{outlet.slug} · {outlet.table_count} meja · {managerProfile ? managerProfile.email : "Belum ada manager"}</p>
                              </div>
                            </div>
                            <button onClick={() => navigate(`/admin/outlets/${outlet.id}`)}
                              className="text-[11px] font-semibold text-brand hover:text-brand hover:underline cursor-pointer transition-all">
                              Buka →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-neutral-900">Manajemen Akun</h1>
                <p className="text-xs text-neutral-500 mt-0.5">Kelola akun manager untuk setiap outlet.</p>
              </div>
              <button onClick={() => { setIsUserModalOpen(true); setUserForm({ email: "", password: "", outlet_id: "", role: "admin" }); setUserError(""); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-all cursor-pointer">
                <UserPlus className="w-4 h-4" /> Tambah Akun
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
                {users.filter(u => u.profile?.role === "admin" || u.profile?.role === "super_admin").length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">Belum ada akun admin</p>
                  </div>
                ) : users.filter(u => u.profile?.role === "admin" || u.profile?.role === "super_admin").map(u => {
                  const outletName = outlets.find(o => o.id === u.profile?.outlet_id)?.name ?? "—";
                  const isSelf = u.id === user?.id;
                  return (
                    <div key={u.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand/5 rounded-full flex items-center justify-center font-bold text-sm text-brand">
                          {u.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800 flex items-center gap-1.5">
                            {u.email}
                            {isSelf && <span className="text-[10px] bg-brand/5 text-brand/70 px-1.5 py-0.5 rounded font-semibold">Anda</span>}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{u.profile?.role ?? "—"} · {outletName}</p>
                        </div>
                      </div>
                      {!isSelf && u.profile?.role !== "super_admin" && (
                        <button onClick={() => setConfirmDelete({ type: "user", id: u.id, label: u.email })}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-red-500 cursor-pointer transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Brand Modal ── */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsBrandModalOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">Tambah Brand Baru</h3>
              <button onClick={() => setIsBrandModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            <form onSubmit={handleAddBrand} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kode Brand *</label>
                <input required value={brandForm.brand_code} onChange={e => setBrandForm(p => ({ ...p, brand_code: e.target.value.toUpperCase() }))}
                  placeholder="MIE, APP, BOBA..." className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nama Brand</label>
                <input value={brandForm.display_name} onChange={e => setBrandForm(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="Mie Gacoan, dsb..." className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── User Modal ── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsUserModalOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">Tambah Akun</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            {userError && <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">{userError}</div>}
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Email *</label>
                <input type="email" required value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="manager@outlet.com" className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Password *</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} required minLength={6} value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min. 6 karakter" className="w-full py-2 pl-3 pr-9 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10" />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 cursor-pointer">
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Outlet</label>
                <select value={userForm.outlet_id} onChange={e => setUserForm(p => ({ ...p, outlet_id: e.target.value }))} className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none">
                  <option value="">— Pilih Outlet —</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name} ({o.brand_code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Role</label>
                <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))} className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none">
                  <option value="admin">Admin Brand</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
                <button type="submit" disabled={userSaving} className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {userSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Membuat...</> : <><UserPlus className="w-3.5 h-3.5" /> Buat Akun</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm text-neutral-900 mb-1">Konfirmasi Hapus</h3>
            <p className="text-sm text-neutral-500 mb-4">Hapus <strong>{confirmDelete.label}</strong>? Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer">Batal</button>
              <button onClick={() => confirmDelete.type === "brand" ? handleDeleteBrand(confirmDelete.id) : handleDeleteUser(confirmDelete.id)}
                className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
