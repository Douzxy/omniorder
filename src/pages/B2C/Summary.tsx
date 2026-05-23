import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Copy, AlertCircle, ShoppingBag, Phone, Mail, Clock, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/context/I18nContext";
import OfflineBanner from "@/components/OfflineBanner";

interface OrderDetails {
  id: string;
  order_code?: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  order_type: string;
  table_number: string | null;
  total_amount: number;
  tax_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  delivery_address?: string | null;
  delivery_note?: string | null;
}

export default function OrderSummaryCashPage() {
  const { t } = useTranslation();
  const { brandCode: rawBrandCode, outletId } = useParams<{ brandCode: string; outletId: string }>();
  const brandCode = rawBrandCode?.toLowerCase() ?? "";
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [outlet, setOutlet] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const orderId = searchParams.get("orderId");
  const isPaid = searchParams.get("paid") === "true";
  const tableNumber = searchParams.get("tableNumber");
  const orderType = searchParams.get("mode") || "dinein";
  const paymentMethod = isPaid ? "qris" : "cash";
  const cartTotal = 0;

  useEffect(() => {
    async function fetchOutlet() {
      if (!outletId) return;
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(outletId);
        const { data } = await (isUuid
          ? supabase.from("outlets").select("*").eq("id", outletId).single()
          : supabase.from("outlets").select("*").eq("slug", outletId).single());
        if (data) {
          setOutlet(data);
        } else {
          const cachedCatalogStr = localStorage.getItem(`omniorder_catalog_${outletId}`);
          if (cachedCatalogStr) {
            const cachedCatalog = JSON.parse(cachedCatalogStr);
            if (cachedCatalog?.outlet) setOutlet(cachedCatalog.outlet);
          }
        }
      } catch (_) {
        const cachedCatalogStr = localStorage.getItem(`omniorder_catalog_${outletId}`);
        if (cachedCatalogStr) {
          try {
            const cachedCatalog = JSON.parse(cachedCatalogStr);
            if (cachedCatalog?.outlet) setOutlet(cachedCatalog.outlet);
          } catch (err) {}
        }
      }
    }
    fetchOutlet();
  }, [outletId]);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (data && !error) {
          setOrder({
            id: data.id,
            order_code: data.order_code,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
            order_type: data.order_type,
            table_number: data.table_number,
            total_amount: data.total_amount,
            tax_amount: data.tax_amount || 0,
            payment_method: data.payment_method,
            payment_status: data.payment_status,
            created_at: data.created_at,
            delivery_address: data.delivery_address,
            delivery_note: data.delivery_note,
          });
          localStorage.setItem(`omniorder_order_${orderId}`, JSON.stringify(data));
        } else {
          const cachedStr = localStorage.getItem(`omniorder_order_${orderId}`);
          if (cachedStr) {
            setOrder(JSON.parse(cachedStr));
          } else {
            toast(t("common.error"), "error");
          }
        }
      } catch (err) {
        const cachedStr = localStorage.getItem(`omniorder_order_${orderId}`);
        if (cachedStr) {
          try {
            setOrder(JSON.parse(cachedStr));
          } catch (_) {
            toast(t("common.error") + ": " + String(err), "error");
          }
        } else {
          toast(t("common.error") + ": " + String(err), "error");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-realtime-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as any;
          setOrder((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              payment_status: updatedOrder.payment_status,
              status: updatedOrder.status,
            };
          });
          // Update cached local storage order
          try {
            const cachedStr = localStorage.getItem(`omniorder_order_${orderId}`);
            if (cachedStr) {
              const cached = JSON.parse(cachedStr);
              cached.payment_status = updatedOrder.payment_status;
              cached.status = updatedOrder.status;
              localStorage.setItem(`omniorder_order_${orderId}`, JSON.stringify(cached));
            }
          } catch (e) {
            console.error("Failed to update cache:", e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const copyOrderId = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayId = order?.order_code || (orderId ? orderId.substring(0, 8).toUpperCase() : "?");
  const confirmationCode = orderId ? orderId.substring(orderId.length - 4).toUpperCase() : "????";
  const brandColor = outlet?.brand_color ?? "#f97316";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  // Translate Order Mode (Kamu pesan dari)
  const getOrderSource = (type: string) => {
    switch (type?.toLowerCase()) {
      case "dinein":
        return t("order.type.dinein");
      case "takeaway":
        return t("order.type.takeaway");
      case "delivery":
        return t("order.type.delivery");
      default:
        return t("order.type.dinein");
    }
  };

  // Translate Payment Method
  const getPaymentMethodLabel = (method: string) => {
    switch (method?.toLowerCase()) {
      case "qris":
        return t("payment.qris_title");
      case "cash":
        return t("payment.cash_title");
      default:
        return "QRIS";
    }
  };

  return (
    <div
      className="flex-1 bg-[#fafafa] text-[#171717] min-h-screen flex flex-col justify-between py-12 px-4 font-sans"
      style={{
        "--color-brand": brandColor,
        "--color-brand-hover": brandColorHover,
        "--color-brand-light": brandColorLight,
      } as React.CSSProperties}
    >
      <OfflineBanner />
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        {/* SVG Logo OmniOrder */}
        <div className="flex justify-center mb-2">
          <Logo size="lg" />
        </div>

        {/* Success Icon or Confirmation Code */}
        {isPaid || order?.payment_status === "paid" ? (
          <div className="bg-emerald-500 text-white rounded-3xl p-6 shadow-xl shadow-emerald-500/20 inline-block w-full">
            <span className="text-[10px] font-black tracking-widest uppercase opacity-90 block mb-1">
              {t("summary.cashier_confirm_code")}
            </span>
            <span className="text-4xl font-black tracking-widest block">
              {confirmationCode}
            </span>
            <p className="text-[11px] font-bold opacity-90 mt-3 mx-auto leading-relaxed">
              {t("summary.show_code_to_cashier")}
            </p>
          </div>
        ) : (
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-md shadow-emerald-500/5">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        )}

        {/* Dynamic Title based on payment status */}
        <div>
          <h1 className="font-extrabold text-neutral-900 text-xl leading-tight">
            {isPaid || order?.payment_status === "paid"
              ? t("summary.payment_received")
              : t("summary.order_sent")}
          </h1>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            {isPaid || order?.payment_status === "paid"
              ? t("summary.payment_verified_desc")
              : t("summary.waiting_cashier_desc")}
          </p>
        </div>

        {/* Order Card Receipt */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/60 shadow-sm text-left">
          {/* Order ID */}
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
            <div>
              <span className="text-[10px] text-neutral-400 font-black block tracking-wider uppercase">{t("summary.order_id")}</span>
              <span className="font-mono font-bold text-neutral-800 text-sm tracking-wide">
                {displayId}
              </span>
            </div>
            {orderId && (
              <button
                onClick={copyOrderId}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 rounded-lg text-xs font-bold text-neutral-600 transition-colors cursor-pointer active:scale-95"
              >
                {copied ? t("summary.copied") : t("summary.copy_id")}
              </button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3.5 pt-4">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500 font-medium">{t("summary.customer_name")}</span>
              <span className="font-bold text-neutral-800">
                {order ? order.customer_name : "Tamu"}
              </span>
            </div>
            {order?.customer_phone && (
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  {t("summary.promo_phone")}
                </span>
                <span className="font-bold text-neutral-850">
                  {order.customer_phone}
                </span>
              </div>
            )}
            {order?.customer_email && (
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-400" />
                  {t("summary.email_receipt")}
                </span>
                <span className="font-bold text-neutral-850 truncate max-w-[180px]">
                  {order.customer_email}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500 font-medium">{t("summary.order_from")}</span>
              <span className="font-bold text-neutral-800">
                {order ? getOrderSource(order.order_type) : getOrderSource(orderType)}
              </span>
            </div>
            {(order?.table_number || tableNumber) && (
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">{t("summary.table_number_label")}</span>
                <span className="font-bold text-brand">
                  {t("summary.table_number_value", { number: order ? order.table_number || "" : tableNumber || "" })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500 font-medium">{t("summary.payment_method_label")}</span>
              <span className="font-bold text-neutral-800">
                {order ? getPaymentMethodLabel(order.payment_method) : getPaymentMethodLabel(paymentMethod)}
              </span>
            </div>
            {order?.order_type?.toLowerCase() === "delivery" && order.delivery_address && (
              <div className="pt-3.5 border-t border-neutral-100 space-y-1">
                <span className="text-[10px] text-neutral-400 font-black block tracking-wider uppercase">{t("summary.delivery_address")}</span>
                <span className="font-bold text-neutral-800 text-xs block leading-relaxed">
                  {order.delivery_address}
                </span>
                {order.delivery_note && (
                  <span className="text-[10px] text-neutral-450 italic block mt-0.5">
                    {t("history.notes_heading")}: {order.delivery_note}
                  </span>
                )}
              </div>
            )}
            {order && order.tax_amount > 0 ? (
              <>
                <div className="flex justify-between text-xs pt-3.5 border-t border-neutral-100">
                  <span className="text-neutral-500 font-medium">{t("cart.subtotal")}</span>
                  <span className="font-bold text-neutral-800">
                    Rp {(order.total_amount - order.tax_amount).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500 font-medium">{t("summary.tax")}</span>
                  <span className="font-bold text-neutral-800">
                    Rp {order.tax_amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-3.5 border-t border-neutral-100">
                  <span className="text-neutral-500 font-bold">{t("cart.total")}</span>
                  <span className="font-black text-brand text-sm">
                    Rp {order.total_amount.toLocaleString("id-ID")}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-xs pt-3.5 border-t border-neutral-100">
                <span className="text-neutral-500 font-bold">{t("cart.total")}</span>
                <span className="font-black text-brand text-sm">
                  Rp {order ? order.total_amount.toLocaleString("id-ID") : cartTotal.toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-neutral-100 p-5 rounded-2xl border border-neutral-200/40 text-left max-w-sm mx-auto space-y-2">
          <h3 className="font-bold text-xs text-neutral-800 flex items-center gap-1.5 uppercase tracking-wider">
            {isPaid || order?.payment_status === "paid" ? (
              <Clock className="w-4 h-4 text-brand" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
            {t("summary.next_steps")}
          </h3>
          <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
            {isPaid || order?.payment_status === "paid" ? (
              <span>
                {t("summary.next_step_paid")}
              </span>
            ) : (
              <span>
                {t("summary.next_step_unpaid", { id: displayId })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="max-w-md w-full mx-auto px-4 mt-8 text-center flex flex-col gap-3">
        <Link
          to={`/${brandCode}/${outletId}/order?mode=${order?.order_type || orderType}&tableNumber=${order?.table_number || tableNumber || ""}`}
          className="inline-flex items-center justify-center w-full py-4 bg-brand hover:bg-brand-hover active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-xl shadow-brand/20 transition-all text-sm gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          {t("summary.btn_menu")}
        </Link>
        <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-450 font-bold tracking-wide uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-brand" />
          {t("summary.secure_payment")}
        </div>
      </div>
    </div>
  );
}
