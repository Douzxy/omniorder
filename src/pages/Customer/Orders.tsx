import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { ArrowLeft, Package, Clock, ShieldCheck, LogOut, User, Mail, Bell, MapPin, FileText } from "lucide-react";
import { useTranslation } from "@/context/I18nContext";

export default function CustomerOrders() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const uid: string = user.id;
    async function load() {
      try {
        const [ordersData, profileData] = await Promise.all([
          api.customers.getOrders(uid),
          api.customers.getProfile(uid),
        ]);
        setOrders(ordersData);
        setCustomerProfile(profileData);
      } catch (err) {
        console.error("Failed to load customer data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 text-neutral-300 mx-auto" />
          <p className="text-sm font-bold text-neutral-500">{t("history.login_first")}</p>
          <Link to="/customer/login" className="inline-block px-6 py-3 bg-brand text-white font-extrabold rounded-2xl text-xs">
            {t("auth.login.title")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/50 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-neutral-800" />
          </button>
          <h1 className="font-extrabold text-neutral-900 text-lg">{t("history.title")}</h1>
        </div>
        <button onClick={handleSignOut} className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-md w-full mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/60 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-brand" />
            </div>
            <div>
              <p className="font-extrabold text-neutral-900 text-sm">
                {customerProfile?.name || user.email?.split("@")[0] || t("history.guest")}
              </p>
              <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
            </div>
          </div>
          {customerProfile?.phone && (
            <p className="text-[11px] text-neutral-500 font-medium">📞 {customerProfile.phone}</p>
          )}
          <div className="flex items-center gap-2 text-[10px] text-neutral-400">
            <Bell className="w-3 h-3" />
            {t("history.email_notif")}: {customerProfile?.email_notifications ? t("history.email_active") : t("history.email_inactive")}
          </div>
        </div>

        {/* Orders History */}
        <div>
          <h2 className="font-extrabold text-neutral-800 text-xs mb-3 px-1 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-brand" />
            {t("history.orders_heading")}
          </h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-3xl border border-neutral-200/60 animate-pulse space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-1/3" />
                  <div className="h-3 bg-neutral-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/${order.outlet_id ? "order" : "#"}`}
                  className="block bg-white p-4 rounded-3xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-xs text-neutral-700">
                      #{order.order_code || order.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      order.payment_status === "paid"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : order.payment_status === "failed"
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {order.payment_status === "paid" ? t("history.status_lunas")
                        : order.payment_status === "failed" ? t("history.status_gagal")
                        : t("history.status_menunggu")}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-neutral-500 font-medium">
                        {order.order_type === "dinein" ? t("order.type.dinein")
                          : order.order_type === "takeaway" ? t("order.type.takeaway")
                          : t("order.type.delivery")}
                      </p>
                      <p className="text-[9px] text-neutral-400">
                        {new Date(order.created_at).toLocaleDateString(locale === "id" ? "id-ID" : "en-GB", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <span className="font-black text-brand text-xs">
                      Rp {Number(order.total_amount).toLocaleString("id-ID")}
                    </span>
                  </div>
                  {order.order_type === "delivery" && order.delivery_address && (
                    <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
                      <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand" />
                        {t("history.delivery_address_heading")}
                      </p>
                      <p className="text-[11px] font-semibold text-neutral-700 leading-relaxed truncate">
                        {order.delivery_address}
                      </p>
                      {order.delivery_note && (
                        <p className="text-[9px] text-neutral-500 italic flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5 text-neutral-400" />
                          <span>{t("history.notes_heading")}: {order.delivery_note}</span>
                        </p>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-neutral-200/60 text-center">
              <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-neutral-500">{t("history.no_orders")}</p>
              <p className="text-[10px] text-neutral-400 mt-1">{t("history.no_orders_desc")}</p>
              <Link
                to="/"
                className="inline-block mt-4 px-5 py-2.5 bg-brand text-white font-extrabold rounded-2xl text-xs"
              >
                {t("history.start_order")}
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-450 font-bold tracking-wide uppercase pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-brand" />
          {t("history.secure_data")}
        </div>
      </div>
    </div>
  );
}
