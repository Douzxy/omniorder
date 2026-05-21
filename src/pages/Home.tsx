import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles, LayoutDashboard, Loader2, ArrowRight, Building2, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
        console.error("Gagal mengambil data outlet:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOutlets();
  }, []);

  return (
    <div className="flex-1 bg-[#fcfcfc] text-[#171717] min-h-screen flex flex-col justify-between py-12 px-4 md:px-8 font-sans">
      {/* Upper Brand Section */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-8 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Logo size="md" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/5 border border-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3 h-3 text-brand" />
          OmniOrder Platform v1.2
        </div>
      </div>

      {/* Main Responsive Split Layout */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 my-auto py-8">
        {/* Left Column: Brand Hero + B2B Portal card */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-neutral-900">
              Pemesanan Meja <br />
              <span className="text-brand bg-gradient-to-r from-brand to-blue-600 bg-clip-text text-transparent">
                Mudah &amp; Terintegrasi
              </span>
            </h1>
            <p className="text-xs text-neutral-500 max-w-lg leading-relaxed font-semibold">
              Solusi pemesanan QR-Code premium untuk restoran modern. Pelanggan memindai QR, memilih menu, dan langsung membayar via QRIS Dinamis atau bayar tunai di Kasir.
            </p>
          </div>

          {/* Premium Admin/B2B portal link */}
          <Link
            to="/admin/login"
            className="group bg-white border border-neutral-200/80 p-6 rounded-3xl hover:border-emerald-500/40 text-left transition-all hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer block relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/40 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-emerald-100/50">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-neutral-800 group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
              Portal Kelola Restoran (B2B)
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed font-medium">
              Masuk untuk kelola cabang outlet, kategori menu, atur ketersediaan stok, serta pantau pesanan masuk secara real-time.
            </p>
          </Link>
        </div>

        {/* Right Column: Dynamic Cabang Outlet B2C Selector */}
        <div className="lg:col-span-7 bg-white border border-neutral-200/60 p-6 md:p-8 rounded-[32px] shadow-sm flex flex-col space-y-5">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-sm font-black text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
              <Store className="w-4 h-4 text-brand" />
              Demo Menu Pelanggan (B2C)
            </h2>
            <p className="text-[11px] text-neutral-400 mt-1 font-semibold">
              Pilih salah satu outlet aktif di bawah ini untuk mensimulasikan alur pemesanan pelanggan:
            </p>
          </div>

          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {loading ? (
              // Skeletal Loader Shimmer
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-[#fafafa] rounded-2xl border border-neutral-100 animate-pulse">
                  <div className="w-14 h-10 bg-neutral-200 rounded-lg" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3.5 bg-neutral-200 rounded w-1/3" />
                    <div className="h-2.5 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : outlets.length > 0 ? (
              outlets.map((outlet) => (
                <Link
                  key={outlet.id}
                  to={`/${outlet.brand_code}/${outlet.id}/order?mode=dinein&tableNumber=${Math.floor(Math.random() * 20) + 1}`}
                  className="group flex items-center justify-between p-4 bg-[#fafafa] hover:bg-white rounded-2xl border border-neutral-100 hover:border-brand/40 shadow-sm hover:shadow-md transition-all duration-200"
                  style={{ "--brand-accent": outlet.brand_color } as React.CSSProperties}
                >
                  <div className="flex items-center gap-4">
                    {/* Outlet logo */}
                    <div className="w-14 h-10 border border-neutral-200 rounded-lg overflow-hidden bg-white flex-shrink-0 flex items-center justify-center shadow-xs">
                      {outlet.logo_url ? (
                        <img
                          src={outlet.logo_url}
                          alt={outlet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-neutral-350" />
                      )}
                    </div>
                    {/* Branch Info */}
                    <div className="text-left space-y-1">
                      <h3 className="font-extrabold text-neutral-800 group-hover:text-brand text-xs leading-none transition-colors">
                        {outlet.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="text-[8px] px-1.5 py-0.5 bg-neutral-200/60 rounded font-black text-neutral-500 uppercase">
                          {outlet.brand_code}
                        </span>
                        {outlet.is_dine_in_enabled && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-brand/5 text-brand rounded font-black uppercase">
                            Dine-In
                          </span>
                        )}
                        {outlet.is_takeaway_enabled && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/5 text-amber-600 rounded font-black uppercase">
                            Takeaway
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Link icon */}
                  <div
                    className="p-2 bg-neutral-200/50 group-hover:bg-brand text-neutral-500 group-hover:text-white rounded-xl transition-all active:scale-90"
                    style={{
                      backgroundColor: "var(--brand-accent)08",
                      color: outlet.brand_color,
                    }}
                  >
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50">
                <Store className="w-8 h-8 text-neutral-350 mx-auto mb-2" />
                <p className="text-xs text-neutral-500 font-bold">Belum ada cabang outlet terdaftar.</p>
                <p className="text-[10px] text-neutral-400 mt-1 max-w-xs mx-auto">
                  Silakan jalankan seed query database atau tambah outlet dari super admin panel.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Info details */}
      <footer className="max-w-6xl w-full mx-auto pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
        <div className="flex gap-4 items-center text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
          <div>PAYMENT: <span className="text-neutral-500">QRIS Dinamis</span></div>
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-200"></div>
          <div>SYNC: <span className="text-neutral-500">Real-time Orders</span></div>
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-200"></div>
          <div>OUTLETS: <span className="text-neutral-500">Multi-Tenant B2B</span></div>
        </div>
        <div className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider">
          OmniOrder © 2026 • Premium Light Experience.
        </div>
      </footer>
    </div>
  );
}
