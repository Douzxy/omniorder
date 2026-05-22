import React, { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { QrCode, Download } from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  slug: string;
  brand_code: string;
  logo_url: string | null;
  brand_color: string;
  table_count: number;
  is_dine_in_enabled: boolean;
  is_takeaway_enabled: boolean;
  is_delivery_enabled: boolean;
  tax_percentage?: number;
  is_tax_enabled?: boolean;
  open_time?: string;
  close_time?: string;
}

interface WorkspaceQRTabProps {
  outlet: Outlet;
}

const fmt = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`;

export default function WorkspaceQRTab({ outlet }: WorkspaceQRTabProps) {
  const { toast } = useToast();

  const [qrMode, setQrMode] = useState<"dinein" | "takeaway" | "delivery">(
    "dinein",
  );
  const [qrTable, setQrTable] = useState("1");
  const [qrUrl, setQrUrl] = useState("");
  const [qrImg, setQrImg] = useState("");

  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();

    if (qrMode === "dinein" && qrTable) {
      const tableNum = Number(qrTable);
      const maxTable = outlet.table_count || 99;
      if (tableNum > maxTable || tableNum < 1) {
        toast(`Nomor meja maksimal ${maxTable}`, "error");
        return;
      }
    }

    const origin = window.location.origin;
    let url = `${origin}/${outlet.brand_code.toLowerCase()}/${outlet.slug}/order?mode=${qrMode}`;
    if (qrMode === "dinein" && qrTable) url += `&tableNumber=${qrTable}`;
    setQrUrl(url);
    setQrImg(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`,
    );
  };

  const handleDownloadQR = async () => {
    if (!qrImg) return;
    const res = await fetch(qrImg);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${outlet?.slug ?? "outlet"}-${qrMode}${qrMode === "dinein" ? `-meja${qrTable}` : ""}.png`;
    a.click();
  };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <form
        onSubmit={handleGenerateQR}
        className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4"
      >
        <h2 className="font-semibold text-sm text-neutral-900">
          Generate QR Code
        </h2>
        <div>
          <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Tipe Pesanan
          </label>
          <select
            value={qrMode}
            onChange={(e) => setQrMode(e.target.value as any)}
            className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
          >
            {outlet?.is_dine_in_enabled && (
              <option value="dinein">Makan di Tempat (Dine-in)</option>
            )}
            {outlet?.is_takeaway_enabled && (
              <option value="takeaway">Bawa Pulang (Takeaway)</option>
            )}
            {outlet?.is_delivery_enabled && (
              <option value="delivery">Pesan Antar (Delivery)</option>
            )}
          </select>
        </div>
        {qrMode === "dinein" && (
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Nomor Meja (1–{outlet?.table_count ?? 99})
            </label>
            <input
              value={qrTable}
              onChange={(e) => {
                const val = e.target.value;
                const max = outlet?.table_count ?? 99;
                if (Number(val) > max) {
                  toast(`Nomor meja maksimal ${max}`, "error");
                  setQrTable(max.toString());
                } else {
                  setQrTable(val);
                }
              }}
              type="number"
              min={1}
              className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
        )}
        <button
          type="submit"
          className="w-full py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4" /> Generate QR
        </button>
      </form>

      {qrImg && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col items-center gap-3">
          <img
            src={qrImg}
            alt="QR Code"
            className="w-48 h-48 rounded-lg border border-neutral-100"
          />
          <p className="text-[10px] font-mono text-neutral-400 text-center break-all">
            {qrUrl}
          </p>
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download QR Code
          </button>
        </div>
      )}
    </div>
  );
}
