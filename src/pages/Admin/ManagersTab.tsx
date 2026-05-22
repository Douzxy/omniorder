import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import {
  UserPlus, Trash2, Edit2, X, Loader2, Check,
  Users, Eye, EyeOff,
} from "lucide-react";

interface Outlet {
  id: string; name: string; slug: string; brand_code: string; logo_url: string | null;
  brand_color: string; table_count: number; is_dine_in_enabled: boolean;
  is_takeaway_enabled: boolean; is_delivery_enabled: boolean;
}

interface ManagersTabProps {
  brandCode: string;
  outlets: Outlet[];
  outletAdmins: { id: string; outlet_id: string; email: string }[];
  onRefresh: () => void;
}

export default function ManagersTab({ brandCode, outlets, outletAdmins, onRefresh }: ManagersTabProps) {
  const { toast } = useToast();

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", outlet_id: "" });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<{ id: string; email: string; outlet_id: string } | null>(null);
  const [editAdminForm, setEditAdminForm] = useState({ outlet_id: "" });
  const [editAdminSaving, setEditAdminSaving] = useState(false);
  const [editAdminError, setEditAdminError] = useState("");

  const [resetPassTarget, setResetPassTarget] = useState<{ id: string; email: string } | null>(null);
  const [resetPassNew, setResetPassNew] = useState("");
  const [resetPassShow, setResetPassShow] = useState(false);
  const [resetPassSaving, setResetPassSaving] = useState(false);
  const [resetPassError, setResetPassError] = useState("");

  const [deleteAdminTarget, setDeleteAdminTarget] = useState<{ id: string; email: string } | null>(null);

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
      onRefresh();
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminSaving(false);
    }
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
      onRefresh();
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
      onRefresh();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  return (
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
    </div>
  );
}
