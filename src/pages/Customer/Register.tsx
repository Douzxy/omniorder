import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Mail, User, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useTranslation } from "@/context/I18nContext";

export default function CustomerRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // `redirect` is where the user should land after confirming their email.
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t("auth.login.email_required"));
      return;
    }

    setLoading(true);
    try {
      // Build callback URL: /auth/callback?next=<destination>
      const nextPath = redirectTo.startsWith("http") ? redirectTo : `${window.location.origin}${redirectTo}`;
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error: signInErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: { name: name.trim() || email.trim().split("@")[0] },
          shouldCreateUser: true,
          emailRedirectTo: callbackUrl,
        },
      });
      if (signInErr) throw signInErr;

      setSent(true);
    } catch (err: any) {
      setError(err.message || t("auth.login.send_error"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/50 px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-neutral-800" />
          </button>
          <h1 className="font-extrabold text-neutral-900 text-lg">{t("auth.login.check_email")}</h1>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-extrabold text-neutral-900 text-lg">{t("auth.register.sent_title")}</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {t("auth.register.sent_desc", { email })}
            </p>
            <p className="text-[10px] text-neutral-400">
              {t("auth.register.no_received")}{" "}
              <button onClick={() => { setSent(false); setLoading(false); }} className="text-brand font-bold hover:underline cursor-pointer">
                {t("auth.login.resend")}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/50 px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-neutral-800" />
        </button>
        <h1 className="font-extrabold text-neutral-900 text-lg">{t("auth.register.title")}</h1>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-brand" />
            </div>
            <h2 className="font-extrabold text-neutral-900 text-xl">{t("auth.register.create_title")}</h2>
            <p className="text-xs text-neutral-500 mt-1">
              {t("auth.register.create_desc")}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                {t("auth.register.name_label")}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t("auth.register.name_placeholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                {t("auth.register.email_label")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  placeholder={t("cart.email_placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <p className="text-[11px] text-rose-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand hover:bg-brand-hover disabled:bg-neutral-300 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-brand/10"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t("auth.login.sending")}</>
              ) : (
                t("auth.register.btn_register")
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-[11px] text-neutral-500">
              {t("auth.register.already_account")}{" "}
              <Link to={`/customer/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} className="text-brand font-bold hover:underline">
                {t("auth.register.login_link")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
