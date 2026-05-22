import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminHub() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (loading || !profile) return;
    if (profile.role === "super_admin") {
      navigate("/admin/units", { replace: true });
    } else if (profile.role === "brand_admin" && profile.brand_code) {
      navigate(`/admin/units/${profile.brand_code}`, { replace: true });
    } else if (profile.role === "outlet_admin" && profile.outlet_id) {
      navigate(`/admin/outlets/${profile.outlet_id}`, { replace: true });
    } else if (profile.outlet_id) {
      navigate(`/admin/outlets/${profile.outlet_id}`, { replace: true });
    } else {
      navigate("/admin/login", { replace: true });
    }
  }, [profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
    </div>
  );
}
