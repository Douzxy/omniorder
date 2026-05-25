import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, AlertCircle, HelpCircle } from "lucide-react";
import Logo from "@/components/Logo";

export default function NotFound() {
  const navigate = useNavigate();

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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 text-center space-y-6 relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand" />

          {/* Icon Decoration */}
          <div className="relative mx-auto w-24 h-24 bg-brand/10 text-brand rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-12 h-12" />
            <HelpCircle className="absolute -top-1 -right-1 w-6 h-6 text-orange-400 bg-white rounded-full p-1 border border-neutral-200 shadow-sm" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-950">404</h1>
            <h2 className="text-xl font-bold text-neutral-800">Halaman Tidak Ditemukan</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Maaf, halaman yang Anda cari tidak dapat ditemukan. Tautan mungkin rusak, salah memasukkan alamat URL, atau halaman telah dipindahkan.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2 border border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm shadow-brand/10 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Beranda
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400">
          <div className="flex gap-4 uppercase tracking-wider font-medium">
            <span>Pemesanan QR</span>
            <span>·</span>
            <span>Real-time</span>
            <span>·</span>
            <span>Multi-Tenant</span>
          </div>
          <span>OmniOrder © 2026</span>
        </div>
      </footer>
    </div>
  );
}
