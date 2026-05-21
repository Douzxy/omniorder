import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, Loader2, ShieldAlert } from "lucide-react";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      setErrorMsg(
        err.message === "Invalid login credentials"
          ? "Email atau password salah. Silakan coba lagi."
          : err.message || "Gagal masuk. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-[#171717] flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md space-y-7 bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-xl shadow-neutral-200/50">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <Logo size="lg" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-neutral-850">
              Portal Administrasi
            </h1>
            <p className="text-[11px] text-neutral-450 mt-1 font-bold uppercase tracking-wider">
              Kelola outlet, menu &amp; pesanan restoran Anda
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-neutral-450 uppercase tracking-widest mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pengelola@restoran.com"
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 text-neutral-800 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-neutral-450 uppercase tracking-widest mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 text-neutral-800 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="login-submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/20 transition-all text-xs flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk ke Dashboard →"
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-neutral-100">
          <p className="text-[10px] text-neutral-400 font-medium">
            Butuh akun? Hubungi Super Admin OmniOrder untuk mendapatkan akses.
          </p>
        </div>
      </div>
    </div>
  );
}
