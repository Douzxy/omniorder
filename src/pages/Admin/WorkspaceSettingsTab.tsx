import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Store, Loader2, Copy, QrCode, ExternalLink } from "lucide-react";

interface Outlet {
  id: string; name: string; slug: string; brand_code: string;
  logo_url: string | null; brand_color: string; table_count: number;
  is_dine_in_enabled: boolean; is_takeaway_enabled: boolean; is_delivery_enabled: boolean;
  tax_percentage?: number; is_tax_enabled?: boolean; open_time?: string; close_time?: string;
}

interface WorkspaceSettingsTabProps {
  outlet: Outlet;
}

export default function WorkspaceSettingsTab({ outlet }: WorkspaceSettingsTabProps) {
  const { toast } = useToast();
  const { log } = useAuditLog();

  const isSupabaseUrl = (url: string) => url.includes("supabase.co/storage");

  const [outletForm, setOutletForm] = useState<Partial<Outlet>>(outlet);
  const [settingsLogoFile, setSettingsLogoFile] = useState<File | null>(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string>(outlet.logo_url ?? "");
  const [settingsLogoUrlInput, setSettingsLogoUrlInput] = useState<string>(
    outlet.logo_url && !isSupabaseUrl(outlet.logo_url) ? outlet.logo_url : ""
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  React.useEffect(() => {
    setOutletForm(outlet);
    setSettingsLogoFile(null);
    setSettingsLogoPreview(outlet.logo_url ?? "");
    setSettingsLogoUrlInput(
      outlet.logo_url && !isSupabaseUrl(outlet.logo_url) ? outlet.logo_url : ""
    );

    if (outlet.brand_code) {
      supabase
        .from("brands")
        .select("brand_color")
        .eq("code", outlet.brand_code)
        .single()
        .then(({ data }) => {
          if (data?.brand_color) {
            setOutletForm((prev) => ({
              ...prev,
              brand_color: data.brand_color,
            }));
          }
        });
    }
  }, [outlet]);

  const handleSettingsLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSettingsLogoFile(file);
    setSettingsLogoPreview(URL.createObjectURL(file));
    setSettingsLogoUrlInput("");
  };

  const handleSettingsLogoUrlChange = (url: string) => {
    setSettingsLogoUrlInput(url);
    setSettingsLogoFile(null);
    setSettingsLogoPreview(url);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlet.id) return;
    setSavingSettings(true);
    try {
      const oldData = { ...outlet };
      let logo_url = outlet.logo_url ?? null;
      if (settingsLogoFile) {
        setUploadingLogo(true);
        const ext = settingsLogoFile.name.split(".").pop();
        const path = `logos/${outlet.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
            .from("images")
            .upload(path, settingsLogoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        logo_url = data.publicUrl;
        setUploadingLogo(false);
      } else if (settingsLogoUrlInput) {
        logo_url = settingsLogoUrlInput;
      }
      const payload = {
        ...outletForm,
        logo_url,
        table_count: Number(outletForm.table_count),
        is_tax_enabled: !!outletForm.is_tax_enabled,
        tax_percentage: outletForm.is_tax_enabled ? Number(outletForm.tax_percentage ?? 0) : 0,
      };
      const { data, error } = await supabase
        .from("outlets")
        .update(payload)
        .eq("id", outlet.id)
        .select()
        .single();
      if (error) throw error;
      setSettingsLogoFile(null);

      // Clear local storage catalog caches to force refetch of new settings
      try {
        localStorage.removeItem(`omniorder_catalog_${outlet.id}`);
        localStorage.removeItem(`omniorder_catalog_${outlet.slug}`);
      } catch (e) {
        console.error(e);
      }

      toast("Pengaturan disimpan", "success");
      // Audit log
      await log({
        outlet_id: outlet.id,
        action: "update",
        entity_type: "settings",
        entity_id: outlet.id,
        old_data: oldData,
        new_data: data,
      });
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <form
        onSubmit={handleSaveSettings}
        className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4"
      >
        <h2 className="font-semibold text-sm text-neutral-900">
          Pengaturan Outlet
        </h2>

        {/* Logo — upload file atau URL */}
        <div>
          <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Logo
          </label>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-10 border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex items-center justify-center flex-shrink-0">
              {settingsLogoPreview ? (
                <img
                  src={settingsLogoPreview}
                  alt="logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-5 h-5 text-neutral-300" />
              )}
            </div>
            <label className="cursor-pointer flex-shrink-0 h-[38px] flex items-center">
              <span className={`text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-100 text-brand hover:bg-neutral-200 transition-all whitespace-nowrap ${uploadingLogo ? "opacity-50" : ""}`}>
                {uploadingLogo ? "Upload..." : "Upload"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSettingsLogoChange}
                disabled={uploadingLogo}
              />
            </label>
          </div>
          <input
            type="text"
            value={settingsLogoUrlInput}
            onChange={e => handleSettingsLogoUrlChange(e.target.value)}
            placeholder="Atau masukkan URL logo..."
            className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
          />
        </div>

        {[
          { label: "Nama Outlet", field: "name" as const, type: "text" },
          {
            label: "Slug (URL ID)",
            field: "slug" as const,
            type: "text",
          },
        ].map(({ label, field, type }) => (
          <div key={field}>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              {label}
            </label>
            <input
              type={type}
              value={(outletForm as any)[field] ?? ""}
              onChange={(e) =>
                setOutletForm((p) => ({ ...p, [field]: e.target.value }))
              }
              className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
        ))}

        <div>
          <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Jumlah Meja
          </label>
          <input
            type="number"
            min={1}
            value={outletForm.table_count ?? 1}
            onWheel={(e) => e.currentTarget.blur()}
            onChange={(e) =>
              setOutletForm((p) => ({
                ...p,
                table_count: Number(e.target.value),
              }))
            }
            className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
          />
        </div>

        {/* Warna Brand — disabled, diatur dari brands table */}
        <div>
          <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Warna Brand
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={outletForm.brand_color ?? "#f97316"}
              disabled
              className="w-9 h-9 rounded border border-neutral-200 opacity-60 cursor-not-allowed"
            />
            <input
              type="text"
              value={outletForm.brand_color ?? ""}
              disabled
              className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Jam Buka
            </label>
            <input
              type="time"
              step="1"
              value={outletForm.open_time ?? "08:00:00"}
              onChange={(e) =>
                setOutletForm((p) => ({
                  ...p,
                  open_time: e.target.value,
                }))
              }
              className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Jam Tutup
            </label>
            <input
              type="time"
              step="1"
              value={outletForm.close_time ?? "22:00:00"}
              onChange={(e) =>
                setOutletForm((p) => ({
                  ...p,
                  close_time: e.target.value,
                }))
              }
              className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Mode Pemesanan
          </label>
          {(
            [
              "is_dine_in_enabled",
              "is_takeaway_enabled",
              "is_delivery_enabled",
            ] as const
          ).map((field) => (
            <label
              key={field}
              className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0 cursor-pointer"
            >
              <span className="text-sm text-neutral-700">
                {field === "is_dine_in_enabled"
                  ? "Dine-in"
                  : field === "is_takeaway_enabled"
                    ? "Takeaway"
                    : "Delivery"}
              </span>
              <div
                className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${outletForm[field] ? "bg-brand" : "bg-neutral-200"}`}
                onClick={() =>
                  setOutletForm((p) => ({ ...p, [field]: !p[field] }))
                }
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${outletForm[field] ? "left-5" : "left-0.5"}`}
                />
              </div>
            </label>
          ))}
        </div>

        {/* Konfigurasi Pajak (PPN) */}
        <div className="pt-3 border-t border-neutral-100 space-y-3">
          <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Konfigurasi Pajak (PPN)
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-neutral-700 font-medium">
              Aktifkan Pajak (PPN)
            </span>
            <div
              className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${outletForm.is_tax_enabled ? "bg-brand" : "bg-neutral-200"}`}
              onClick={() =>
                setOutletForm((p) => ({ ...p, is_tax_enabled: !p.is_tax_enabled }))
              }
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${outletForm.is_tax_enabled ? "left-5" : "left-0.5"}`}
              />
            </div>
          </label>

          {outletForm.is_tax_enabled && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Persentase Pajak (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={outletForm.tax_percentage ?? 0}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) =>
                    setOutletForm((p) => ({
                      ...p,
                      tax_percentage: Math.max(0, Math.min(100, Number(e.target.value))),
                    }))
                  }
                  className="w-full py-2 pl-3 pr-8 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                  placeholder="Contoh: 10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">%</span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-100 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-850 mb-2">Takeaway URL</h3>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-neutral-300 transition-all">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-mono text-neutral-600 truncate">
                  {window.location.origin}/{outlet.brand_code.toLowerCase()}/{outlet.slug}/order
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/${outlet.brand_code.toLowerCase()}/${outlet.slug}/order`
                    );
                    toast("URL Takeaway disalin", "success");
                  }}
                  className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-brand hover:border-brand/35 hover:bg-brand/5 transition-all cursor-pointer"
                  title="Salin URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`${window.location.origin}/${outlet.brand_code.toLowerCase()}/${outlet.slug}/order`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-brand hover:border-brand/35 hover:bg-brand/5 transition-all"
                  title="Buka Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-neutral-850">Dine-In URLs</h3>
              <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-semibold">
                {outletForm.table_count ?? 0} Meja
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mb-2">
              Daftar tautan untuk masing-masing nomor meja. Pelanggan yang memindai tautan ini akan langsung diarahkan ke menu pemesanan meja terkait.
            </p>

            <div className="bg-neutral-50/50 border border-neutral-200/80 rounded-xl divide-y divide-neutral-150/70 max-h-60 overflow-y-auto custom-scrollbar">
              {Array.from({ length: outletForm.table_count ?? 0 }).map((_, idx) => {
                const tableNum = idx + 1;
                const tableUrl = `${window.location.origin}/${outlet.brand_code.toLowerCase()}/{outlet.slug}/order?mode=dinein&tableNumber=${tableNum}`;
                return (
                  <div
                    key={tableNum}
                    className="flex items-center justify-between p-3 gap-3 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-neutral-700">
                        Meja {tableNum}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-450 truncate mt-0.5">
                        {tableUrl}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(tableUrl);
                          toast(`URL Meja ${tableNum} disalin`, "success");
                        }}
                        className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-brand hover:border-brand/35 hover:bg-brand/5 transition-all cursor-pointer"
                        title={`Salin URL Meja ${tableNum}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`${window.location.origin}/${outlet.brand_code.toLowerCase()}/${outlet.slug}/order?mode=dinein&tableNumber=${tableNum}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-brand hover:border-brand/35 hover:bg-brand/5 transition-all"
                        title="Buka Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
              {(outletForm.table_count ?? 0) === 0 && (
                <div className="p-4 text-center text-xs text-neutral-450">
                  Belum ada meja dikonfigurasi. Atur "Jumlah Meja" di atas.
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="w-full py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {savingSettings ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            "Simpan Pengaturan"
          )}
        </button>
      </form>
    </div>
  );
}
