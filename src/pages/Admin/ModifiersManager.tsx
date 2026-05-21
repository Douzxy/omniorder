import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { X, Plus, Edit2, Trash2, Loader2, Save, Check } from "lucide-react";

interface ModifierOption {
  id: string; modifier_id: string; name: string; price_adjustment: number; is_available: boolean;
}
interface Modifier {
  id: string; product_id: string; name: string; is_required: boolean; min_selections: number; max_selections: number;
}
interface ModifiersManagerProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function ModifiersManager({ productId, productName, onClose }: ModifiersManagerProps) {
  const { toast } = useToast();
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [options, setOptions] = useState<ModifierOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Active modifier being edited/added
  const [activeMod, setActiveMod] = useState<Partial<Modifier> | null>(null);
  // Options for the active modifier (local state before saving)
  const [activeModOptions, setActiveModOptions] = useState<Partial<ModifierOption>[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);

  const fetchModifiers = useCallback(async () => {
    setLoading(true);
    const { data: mods } = await supabase.from("product_modifiers").select("*").eq("product_id", productId).order("created_at");
    setModifiers(mods ?? []);
    if (mods && mods.length > 0) {
      const { data: opts } = await supabase.from("product_modifier_options").select("*").in("modifier_id", mods.map(m => m.id)).order("created_at");
      setOptions(opts ?? []);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => { fetchModifiers(); }, [fetchModifiers]);

  const handleOpenAdd = () => {
    setActiveMod({ product_id: productId, name: "", is_required: false, min_selections: 0, max_selections: 1 });
    setActiveModOptions([]);
  };

  const handleOpenEdit = (mod: Modifier) => {
    setActiveMod(mod);
    setActiveModOptions(options.filter(o => o.modifier_id === mod.id));
  };

  const handleAddOption = () => {
    setActiveModOptions(prev => [...prev, { name: "", price_adjustment: 0, is_available: true }]);
  };

  const handleRemoveOption = (index: number) => {
    setActiveModOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (index: number, field: string, value: any) => {
    setActiveModOptions(prev => prev.map((opt, i) => i === index ? { ...opt, [field]: value } : opt));
  };

  const handleSaveModifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMod?.name) { toast("Nama grup wajib diisi", "error"); return; }
    if (activeModOptions.length === 0) { toast("Minimal harus ada 1 pilihan", "error"); return; }
    
    setSaving(true);
    try {
      let modId = activeMod.id;
      
      // 1. Save or Update Modifier
      const modPayload = {
        product_id: productId,
        name: activeMod.name,
        is_required: activeMod.is_required ?? false,
        min_selections: Number(activeMod.min_selections ?? 0),
        max_selections: Number(activeMod.max_selections ?? 1)
      };

      if (modId) {
        await supabase.from("product_modifiers").update(modPayload).eq("id", modId);
      } else {
        const { data, error } = await supabase.from("product_modifiers").insert(modPayload).select().single();
        if (error) throw error;
        modId = data.id;
      }

      // 2. Save Options (Delete old ones not in list, insert/update new ones)
      // For simplicity, since options don't have deep relations, we can delete all existing and re-insert,
      // OR we do a smart upsert. Let's do delete-and-insert for simplicity if we are editing, 
      // but wait, deleting might break order_item_modifiers if they reference it by foreign key? 
      // No, order_item_modifiers usually copy the values or reference without strict FK constraint for history.
      // But to be safe, we upsert.
      
      for (const opt of activeModOptions) {
        if (!opt.name) continue;
        const optPayload = {
          modifier_id: modId,
          name: opt.name,
          price_adjustment: Number(opt.price_adjustment ?? 0),
          is_available: opt.is_available ?? true
        };
        if (opt.id) {
          await supabase.from("product_modifier_options").update(optPayload).eq("id", opt.id);
        } else {
          await supabase.from("product_modifier_options").insert(optPayload);
        }
      }
      // Delete removed options
      if (modId) {
        const currentOptIds = activeModOptions.filter(o => o.id).map(o => o.id);
        const originalOptIds = options.filter(o => o.modifier_id === modId).map(o => o.id);
        const toDelete = originalOptIds.filter(id => !currentOptIds.includes(id));
        if (toDelete.length > 0) {
          await supabase.from("product_modifier_options").delete().in("id", toDelete);
        }
      }

      toast("Grup pilihan berhasil disimpan", "success");
      setActiveMod(null);
      fetchModifiers();
    } catch (err: any) {
      toast("Gagal menyimpan: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModifier = async (modId: string) => {
    const { error } = await supabase.from("product_modifiers").delete().eq("id", modId);
    if (error) { toast("Gagal menghapus: " + error.message, "error"); return; }
    toast("Grup pilihan dihapus", "success");
    setConfirmDelete(null);
    fetchModifiers();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h3 className="font-extrabold text-base text-neutral-900">Atur Pilihan (Modifiers)</h3>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">Produk: {productName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-xl cursor-pointer text-neutral-500 transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
          ) : activeMod ? (
            <form onSubmit={handleSaveModifier} className="space-y-6 bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h4 className="font-bold text-sm text-neutral-800">{activeMod.id ? "Edit Grup Pilihan" : "Tambah Grup Pilihan Baru"}</h4>
                <button type="button" onClick={() => setActiveMod(null)} className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer">Kembali</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Nama Grup (Cth: Potongan Ayam)</label>
                  <input required value={activeMod.name} onChange={e => setActiveMod(p => ({...p, name: e.target.value}))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Min Pilih</label>
                  <input type="number" min={0} required value={activeMod.min_selections} onChange={e => setActiveMod(p => ({...p, min_selections: Number(e.target.value)}))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Max Pilih</label>
                  <input type="number" min={1} required value={activeMod.max_selections} onChange={e => setActiveMod(p => ({...p, max_selections: Number(e.target.value)}))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                  <input type="checkbox" id="isRequired" checked={activeMod.is_required} onChange={e => setActiveMod(p => ({...p, is_required: e.target.checked}))} 
                    className="w-4 h-4 accent-brand cursor-pointer" />
                  <label htmlFor="isRequired" className="text-sm font-bold text-neutral-700 cursor-pointer select-none">Wajib Dipilih</label>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Daftar Pilihan (Opsi)</label>
                  <button type="button" onClick={handleAddOption} className="text-[11px] font-bold text-brand hover:text-brand-hover flex items-center gap-1 cursor-pointer bg-brand/5 px-2 py-1 rounded-lg">
                    <Plus className="w-3 h-3" /> Tambah Opsi
                  </button>
                </div>
                
                <div className="space-y-2.5">
                  {activeModOptions.length === 0 ? (
                    <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                      <p className="text-xs font-medium text-neutral-400">Belum ada opsi. Klik "Tambah Opsi" di atas.</p>
                    </div>
                  ) : activeModOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-neutral-50 p-2 rounded-xl border border-neutral-200">
                      <div className="flex-1">
                        <input placeholder="Nama opsi (Cth: Dada)" value={opt.name} onChange={e => handleUpdateOption(idx, "name", e.target.value)} required
                          className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium" />
                      </div>
                      <div className="w-32">
                        <input type="number" placeholder="Harga (+Rp)" value={opt.price_adjustment} onChange={e => handleUpdateOption(idx, "price_adjustment", e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium" />
                      </div>
                      <button type="button" onClick={() => handleRemoveOption(idx)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveMod(null)} className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 font-bold text-sm rounded-xl hover:bg-neutral-200 cursor-pointer transition-all">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-brand text-white font-bold text-sm rounded-xl hover:bg-brand-hover cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-brand/20">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Grup
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <button onClick={handleOpenAdd} className="w-full py-4 bg-white border border-dashed border-neutral-300 rounded-2xl hover:border-brand hover:bg-brand/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-brand group">
                <div className="w-10 h-10 rounded-full bg-neutral-100 group-hover:bg-brand/10 flex items-center justify-center transition-all">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">Tambah Grup Pilihan Baru</span>
              </button>

              <div className="space-y-3">
                {modifiers.map(mod => (
                  <div key={mod.id} className="bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3 border-b border-neutral-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                          {mod.name}
                          {mod.is_required && <span className="bg-brand/10 text-brand text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Wajib</span>}
                        </h4>
                        <p className="text-[11px] text-neutral-500 font-medium mt-1">Min: {mod.min_selections} • Max: {mod.max_selections}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenEdit(mod)} className="p-1.5 text-neutral-400 hover:text-brand hover:bg-brand/10 rounded-lg cursor-pointer transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDelete({ id: mod.id, name: mod.name })} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {options.filter(o => o.modifier_id === mod.id).map(opt => (
                        <div key={opt.id} className="bg-neutral-50 border border-neutral-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                          {opt.name} 
                          {Number(opt.price_adjustment) > 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">+Rp {Number(opt.price_adjustment).toLocaleString("id-ID")}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-base text-neutral-900 mb-2">Hapus Grup Pilihan?</h3>
            <p className="text-xs text-neutral-500 font-medium mb-6 leading-relaxed">Grup <strong>{confirmDelete.name}</strong> beserta semua opsinya akan dihapus permanen dari produk ini.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 font-bold text-sm rounded-xl hover:bg-neutral-200 cursor-pointer transition-all">Batal</button>
              <button onClick={() => handleDeleteModifier(confirmDelete.id)} className="flex-1 py-2.5 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 cursor-pointer transition-all shadow-md shadow-red-500/20">Hapus Permanen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
