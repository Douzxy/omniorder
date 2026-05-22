import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Loader2, ArrowRight, Building2, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Logo from "@/components/Logo";

interface Outlet {
  id: string;
  name: string;
  brand_code: string;
  slug: string;
  logo_url: string;
  brand_color: string;
  is_dine_in_enabled: boolean;
  is_takeaway_enabled: boolean;
  is_delivery_enabled: boolean;
}

export default function Home() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOutlets() {
      try {
        const { data, error } = await supabase
          .from("outlets")
          .select("*")
          .order("name");
        if (data && !error) {
          setOutlets(data);
        }
      } catch (err) {
        toast.error("Gagal mengambil data outlet");
      } finally {
        setLoading(false);
      }
    }
    fetchOutlets();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link
            to="/admin/login"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Portal Admin →
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl w-full mx-auto px-4 md:px-8 py-12 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 leading-snug">
              Pemesanan Meja<br />Mudah & Terintegrasi
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
              Solusi pemesanan QR-Code untuk restoran modern. Pelanggan memindai QR, memilih menu, dan langsung membayar via QRIS atau tunai di kasir.
            </p>
          </div>

          <Link
            to="/admin/login"
            className="group border border-neutral-200 bg-white p-5 rounded-xl hover:border-neutral-300 transition-all text-left block"
          >
            <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center mb-3">
              <LayoutDashboard className="w-4 h-4 text-neutral-600" />
            </div>
            <h3 className="font-semibold text-neutral-800 flex items-center gap-1.5 text-sm">
              Portal Kelola Restoran
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Kelola outlet, menu, stok, dan pantau pesanan masuk secara real-time.
            </p>
          </Link>
        </div>

        {/* Right: Outlet list */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col space-y-4">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-sm font-semibold text-neutral-700 flex items-center gap-2 uppercase tracking-wide">
              <Store className="w-4 h-4" />
              Demo Menu Pelanggan
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Pilih outlet untuk mensimulasikan alur pemesanan pelanggan.
            </p>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100 animate-pulse">
                  <div className="w-10 h-8 bg-neutral-200 rounded" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3 bg-neutral-200 rounded w-1/3" />
                    <div className="h-2 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : outlets.length > 0 ? (
              outlets.map((outlet) => (
                <Link
                  key={outlet.id}
                  to={`/${outlet.brand_code}/${outlet.id}/order?mode=dinein&tableNumber=1`}
                  className="group flex items-center justify-between p-3 bg-neutral-50 hover:bg-white rounded-lg border border-neutral-100 hover:border-neutral-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 border border-neutral-200 rounded bg-white flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {outlet.logo_url ? (
                        <img src={outlet.logo_url} alt={outlet.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-neutral-800 text-sm leading-none">{outlet.name}</p>
                      <div className="flex gap-1.5 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-500 uppercase font-medium border border-neutral-200">
                          {outlet.brand_code}
                        </span>
                        {outlet.is_dine_in_enabled && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-500 uppercase font-medium border border-neutral-200">
                            Dine-In
                          </span>
                        )}
                        {outlet.is_takeaway_enabled && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-500 uppercase font-medium border border-neutral-200">
                            Takeaway
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))
            ) : (
              <div className="text-center py-10 border border-dashed border-neutral-200 rounded-lg">
                <Store className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Belum ada outlet terdaftar.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400">
          <div className="flex gap-4 uppercase tracking-wider font-medium">
            <span>QRIS Dinamis</span>
            <span>·</span>
            <span>Real-time Orders</span>
            <span>·</span>
            <span>Multi-Tenant</span>
          </div>
          <span>OmniOrder © 2026</span>
        </div>
      </footer>
    </div>
  );
}
