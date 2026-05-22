import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { api, Brand } from "@/services/api";
import Logo from "@/components/Logo";
import {
  LogOut, Building2, ArrowLeft, Store, BarChart3, Users, Loader2
} from "lucide-react";
import BrandDashboardTab from "./BrandDashboardTab";
import OutletsListTab from "./OutletsListTab";
import ManagersTab from "./ManagersTab";

interface Outlet {
  id: string; name: string; slug: string; brand_code: string;
  logo_url: string | null; brand_color: string; table_count: number;
  is_dine_in_enabled: boolean; is_takeaway_enabled: boolean; is_delivery_enabled: boolean;
}

export default function OutletsDashboard() {
  const { unitId: brandCode } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletAdmins, setOutletAdmins] = useState<{ id: string; outlet_id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "outlets";
  const setTab = (t: string) => setSearchParams({ tab: t }, { replace: true });

  const isSuperAdmin = profile?.role === "super_admin";

  const fetchData = useCallback(async () => {
    if (!brandCode) return;
    setLoading(true);
    try {
      const [brandData, { data: outletData }] = await Promise.all([
        api.brands.fetchByCode(brandCode).catch(() => null),
        supabase.from("outlets").select("*").eq("brand_code", brandCode).order("name"),
      ]);
      setBrand(brandData);
      setOutlets(outletData ?? []);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const adminList = data
            .filter((u: any) => u.profile?.role === "outlet_admin" && u.profile?.outlet_id)
            .map((u: any) => ({
              id: u.id,
              outlet_id: u.profile.outlet_id,
              email: u.email
            }));
          setOutletAdmins(adminList);
        } else {
          throw new Error("Failed to fetch users");
        }
      } catch {
        setOutletAdmins([]);
      }
    } finally {
      setLoading(false);
    }
  }, [brandCode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const brandColor = outlets[0]?.brand_color ?? "#f97316";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  return (
    <div
      className="min-h-screen bg-neutral-50 flex flex-col font-sans"
      style={{
        "--color-brand": brandColor,
        "--color-brand-hover": brandColorHover,
        "--color-brand-light": brandColorLight,
      } as React.CSSProperties}
    >
      <header className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button onClick={() => navigate("/admin/units")} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 cursor-pointer transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Logo size="sm" />
          {brandCode && (
            <div className="flex items-center gap-1.5 bg-brand/5 border border-zinc-200 px-2.5 py-1 rounded-full">
              <Building2 className="w-3 h-3 text-brand/70" />
              <span className="text-[11px] font-semibold text-brand uppercase">{brand?.name ?? brandCode}</span>
            </div>
          )}
        </div>
        <button onClick={signOut} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-all" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="bg-white border-b border-neutral-200 px-4 md:px-6">
        <div className="flex gap-1 max-w-4xl mx-auto overflow-x-auto">
          {[
            { key: "dashboard", label: "Dashboard", icon: BarChart3 },
            { key: "outlets", label: "Daftar Outlet", icon: Store },
            { key: "managers", label: "Staf & Admin", icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${tab === key ? "border-brand text-brand" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 py-6 space-y-5">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
        ) : (
          <>
            {tab === "dashboard" && (
              <BrandDashboardTab
                brandName={brand?.name ?? brandCode ?? ""}
                outletCount={outlets.length}
                staffCount={outletAdmins.length}
              />
            )}
            {tab === "outlets" && (
              <OutletsListTab
                brand={brand}
                outlets={outlets}
                outletAdmins={outletAdmins}
                onRefresh={fetchData}
                onNavigateOutlet={(id) => navigate(`/admin/outlets/${id}`)}
              />
            )}
            {tab === "managers" && (
              <ManagersTab
                brandCode={brandCode ?? ""}
                outlets={outlets}
                outletAdmins={outletAdmins}
                onRefresh={fetchData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
