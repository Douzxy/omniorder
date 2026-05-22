import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

/**
 * AuthCallback — handles magic link / email confirmation redirects from Supabase.
 *
 * Supabase appends the session tokens as URL hash fragments after the user
 * clicks the confirmation link. This page:
 *  1. Lets Supabase SDK exchange the hash for a real session.
 *  2. Reads the `next` query param (set by Register/Login pages) to know
 *     where to redirect the user — typically back to the brand's order page.
 *  3. Falls back to `/` if no `next` param is present.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // Supabase puts the tokens in the URL hash (#access_token=...&type=signup)
        // getSession() will automatically exchange them if present.
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session) {
          // Sometimes the hash hasn't been processed yet — wait briefly and retry.
          await new Promise((r) => setTimeout(r, 800));
          const { data: retryData, error: retryErr } = await supabase.auth.getSession();
          if (retryErr) throw retryErr;
          if (!retryData.session) throw new Error("Sesi tidak ditemukan. Tautan mungkin sudah kedaluwarsa.");
        }

        if (cancelled) return;
        setStatus("success");

        // Determine where to redirect after confirmation.
        // `next` is set by Register/Login as the `emailRedirectTo` query param.
        const next = searchParams.get("next") || "/";

        // Short delay so user sees the success state.
        setTimeout(() => {
          if (!cancelled) navigate(next, { replace: true });
        }, 1500);
      } catch (err: any) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(err.message || "Terjadi kesalahan saat konfirmasi.");
        }
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
            <h2 className="font-extrabold text-neutral-900 text-lg">Memverifikasi...</h2>
            <p className="text-xs text-neutral-500">Sedang mengkonfirmasi akun Anda, mohon tunggu.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-extrabold text-neutral-900 text-lg">Akun Terkonfirmasi!</h2>
            <p className="text-xs text-neutral-500">Anda berhasil masuk. Mengalihkan ke halaman tujuan...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="font-extrabold text-neutral-900 text-lg">Konfirmasi Gagal</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => navigate("/customer/login", { replace: true })}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer"
            >
              Kembali ke Halaman Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
