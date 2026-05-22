import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useTranslation } from "@/context/I18nContext";

export default function OfflineBanner() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [shouldRender, setShouldRender] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Give a brief delay before removing the banner to allow smooth transition
      setTimeout(() => {
        setShouldRender(false);
      }, 1000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShouldRender(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm bg-amber-50/90 backdrop-blur-md border border-amber-200 shadow-xl rounded-2xl p-3.5 flex items-center gap-3 transition-all duration-300 transform ${
        isOnline
          ? "translate-y-[-150%] opacity-0 scale-95"
          : "translate-y-0 opacity-100 scale-100 animate-in slide-in-from-top-6 duration-300"
      }`}
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
        <WifiOff className="w-4.5 h-4.5 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-extrabold text-[11px] text-amber-800 leading-tight mb-0.5">
          {t("offline.banner_title")}
        </h4>
        <p className="text-[10px] text-amber-600 font-bold leading-normal">
          {t("offline.banner_desc")}
        </p>
      </div>
    </div>
  );
}
