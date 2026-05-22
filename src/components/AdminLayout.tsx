import { LogOut, ShieldCheck, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  onRefresh?: () => void;
  onLogout: () => void;
  isSuperAdmin?: boolean;
  outletName?: string;
}

export default function AdminLayout({ children, title, onBack, onRefresh, onLogout, isSuperAdmin, outletName }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <header className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1.5 hover:bg-neutral-100 rounded-xl cursor-pointer text-neutral-500 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Logo size="sm" />
          {outletName && (
            <div className="hidden sm:flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-extrabold text-neutral-700">{outletName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <span className="hidden sm:flex items-center gap-1.5 bg-brand/5 border border-zinc-200 px-2.5 py-1 rounded-full text-[10px] font-bold text-brand uppercase">
              <ShieldCheck className="w-3 h-3" /> Super Admin
            </span>
          )}
          {onRefresh && (
            <button onClick={onRefresh} className="p-2 hover:bg-neutral-100 rounded-xl cursor-pointer text-neutral-500 transition-all" title="Refresh">
              {/* simplistic refresh icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          )}
          <button onClick={onLogout} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
