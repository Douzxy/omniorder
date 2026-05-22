import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Wallet, ShieldCheck, DollarSign, Loader2, CheckCircle, AlertCircle, RefreshCw, Image } from "lucide-react";
import OfflineBanner from "@/components/OfflineBanner";

export default function PaymentPage() {
  const { brandCode: rawBrandCode, outletId } = useParams<{ brandCode: string; outletId: string }>();
  const brandCode = rawBrandCode?.toLowerCase() ?? "";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    cart,
    orderType,
    tableNumber,
    customerName,
    customerPhone,
    customerEmail,
    generalNote,
    sendReceipt,
    cartTax,
    cartTotal,
    clearCart,
    showToast,
    deliveryAddress,
    deliveryNote,
  } = useCart();

  const [outlet, setOutlet] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash" | "qris_static">("qris");
  const [loading, setLoading] = useState<boolean>(false);

  // QRIS Screen states
  const [showQrisScreen, setShowQrisScreen] = useState<boolean>(false);
  const [qrisUrl, setQrisUrl] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [createdOrderId, setCreatedOrderId] = useState<string>("");
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(false);

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

  // Realtime subscription for payment confirmation
  useEffect(() => {
    if (!createdOrderId) return;

    const channel = supabase
      .channel(`payment-${createdOrderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${createdOrderId}`,
        },
        (payload) => {
          const newStatus = payload.new as any;
          if (newStatus.payment_status === "paid" && !paymentConfirmed) {
            setPaymentConfirmed(true);
            showToast(t("payment.confirm_success"), "success");

            // Update local cached order and history status to paid
            try {
              const cachedOrderStr = localStorage.getItem(`omniorder_order_${createdOrderId}`);
              if (cachedOrderStr) {
                const cachedOrder = JSON.parse(cachedOrderStr);
                cachedOrder.payment_status = "paid";
                localStorage.setItem(`omniorder_order_${createdOrderId}`, JSON.stringify(cachedOrder));
              }
              const storedHistory = localStorage.getItem("omniorder_history");
              if (storedHistory) {
                const history = JSON.parse(storedHistory);
                const updatedHistory = history.map((h: any) =>
                  h.id === createdOrderId ? { ...h, payment_status: "paid" } : h
                );
                localStorage.setItem("omniorder_history", JSON.stringify(updatedHistory));
              }
            } catch (err) {
              console.error("Failed to update status in localStorage:", err);
            }

            // Send email receipt if opted in
            if (newStatus.send_receipt && newStatus.customer_email) {
              supabase.functions.invoke("send-order-email", {
                body: { orderId: createdOrderId },
              }).catch((err) => console.error("Email send failed:", err));
            }

            clearCart();
            navigate(`/${brandCode}/${outletId}/order-summary-cash?orderId=${createdOrderId}&paid=true`);
          } else if (newStatus.payment_status === "failed" || newStatus.status === "cancelled") {
            showToast(t("payment.confirm_failed"), "error");
            setShowQrisScreen(false);
            setCreatedOrderId("");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [createdOrderId, paymentConfirmed, navigate, brandCode, outletId, showToast, clearCart]);

  // QRIS Countdown Timer logic
  useEffect(() => {
    if (!showQrisScreen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showQrisScreen, timeLeft]);

  // Handle expiration
  useEffect(() => {
    if (showQrisScreen && timeLeft <= 0 && createdOrderId && !paymentConfirmed) {
      supabase.from("orders").update({ status: "cancelled", payment_status: "failed" }).eq("id", createdOrderId).then(() => {
        showToast(t("payment.qris_expired"), "error");
        setShowQrisScreen(false);
        navigate(`/${brandCode}/${outletId}/order`);
      });
    }
  }, [showQrisScreen, timeLeft, createdOrderId, paymentConfirmed, navigate, brandCode, outletId, showToast, t]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const navigateToSuccess = useCallback((orderId: string) => {
    clearCart();
    navigate(`/${brandCode}/${outletId}/order-summary-cash?orderId=${orderId}&paid=true`);
  }, [clearCart, navigate, brandCode, outletId]);

  const handleProcessPayment = async () => {
    if (!outlet) return;
    try {
      setLoading(true);

      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .insert({
          outlet_id: outlet.id,
          order_type: orderType,
          table_number: tableNumber || null,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          customer_email: customerEmail,
          customer_notes: generalNote || null,
          user_id: user?.id || null,
          send_receipt: sendReceipt,
          status: "pending",
          payment_method: paymentMethod,
          payment_status: "pending",
          total_amount: cartTotal,
          tax_amount: cartTax,
          delivery_address: orderType === "delivery" ? deliveryAddress || null : null,
          delivery_note: orderType === "delivery" ? deliveryNote || null : null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;
      const generatedId = orderData.id;
      setCreatedOrderId(generatedId);

      // Save order detail and summary to local storage for offline retrieval
      try {
        const fullOrderCache = {
          id: generatedId,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          customer_email: customerEmail,
          order_type: orderType,
          table_number: tableNumber || null,
          total_amount: cartTotal,
          tax_amount: cartTax,
          payment_method: paymentMethod,
          payment_status: "pending",
          created_at: new Date().toISOString(),
          delivery_address: orderType === "delivery" ? deliveryAddress || null : null,
          delivery_note: orderType === "delivery" ? deliveryNote || null : null,
        };
        localStorage.setItem(`omniorder_order_${generatedId}`, JSON.stringify(fullOrderCache));

        const storedHistory = localStorage.getItem("omniorder_history");
        let history: any[] = [];
        if (storedHistory) {
          history = JSON.parse(storedHistory);
        }
        history.unshift({
          id: generatedId,
          order_type: orderType,
          created_at: fullOrderCache.created_at,
          total_amount: cartTotal,
          payment_status: "pending",
        });
        localStorage.setItem("omniorder_history", JSON.stringify(history));
      } catch (cacheErr) {
        console.error("Failed to save order cache locally:", cacheErr);
      }

      for (const item of cart) {
        const itemModsTotal = (item.modifiers || []).reduce((acc, mod) => {
          return acc + mod.options.reduce((s, o) => s + Number(o.price_adjustment), 0);
        }, 0);
        const unitPrice = Number(item.price) + itemModsTotal;
        const totalPrice = unitPrice * item.quantity;

        const { data: orderItem, error: itemErr } = await supabase
          .from("order_items")
          .insert({
            order_id: generatedId,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            notes: item.notes || null,
          })
          .select()
          .single();

        if (itemErr) throw itemErr;

        if (item.modifiers && item.modifiers.length > 0) {
          const modsPayload = [];
          for (const mod of item.modifiers) {
            for (const opt of mod.options) {
              modsPayload.push({
                order_item_id: orderItem.id,
                modifier_name: mod.name,
                option_name: opt.name,
                price_adjustment: Number(opt.price_adjustment),
              });
            }
          }
          if (modsPayload.length > 0) {
            const { error: modsErr } = await supabase.from("order_item_modifiers").insert(modsPayload);
            if (modsErr) throw modsErr;
          }
        }
      }

      if (paymentMethod === "cash" || paymentMethod === "qris_static") {
        clearCart();
        navigate(
          `/${brandCode}/${outletId}/order-summary-cash?orderId=${generatedId}&mode=${orderType}&tableNumber=${tableNumber || ""}`
        );
      } else {
        try {
          const { data: qrisData, error: qrisErr } = await supabase.functions.invoke("midtrans-qris", {
            body: { orderId: generatedId, grossAmount: cartTotal, outletName: outlet.name }
          });

          if (qrisErr) throw qrisErr;

          if (qrisData && qrisData.qrUrl) {
            setQrisUrl(qrisData.qrUrl);
            setTimeLeft(900);
            setShowQrisScreen(true);
          } else {
            throw new Error("Gagal generate QRIS");
          }
        } catch (e: any) {
          showToast(t("payment.midtrans_error", { error: String(e) }), "error");
          showToast(t("payment.midtrans_fallback"), "error");
          await supabase.from("orders").update({ payment_method: "cash" }).eq("id", generatedId);
          clearCart();
          navigate(
            `/${brandCode}/${outletId}/order-summary-cash?orderId=${generatedId}&mode=${orderType}&tableNumber=${tableNumber || ""}`
          );
        }
      }
    } catch (error) {
      showToast(t("payment.order_failed", { error: String(error) }), "error");
      showToast(t("payment.process_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const brandColor = outlet?.brand_color ?? "#2563eb";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  return (
    <div
      className="flex-1 bg-[#fafafa] text-[#171717] min-h-screen pb-28 relative flex flex-col font-sans"
      style={{
        "--color-brand": brandColor,
        "--color-brand-hover": brandColorHover,
        "--color-brand-light": brandColorLight,
      } as React.CSSProperties}
    >
      <OfflineBanner />
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/50 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => {
            if (showQrisScreen) {
              setShowQrisScreen(false);
            } else {
              navigate(`/${brandCode}/${outletId}/view-order`);
            }
          }}
          className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-800" />
        </button>
        <h1 className="font-extrabold text-neutral-900 text-lg">
          {showQrisScreen ? t("payment.title_qris") : t("payment.title_methods")}
        </h1>
      </header>

      <div className="max-w-md w-full mx-auto px-4 mt-6 flex-1">
        {!showQrisScreen ? (
          <>
            <div className="flex items-center justify-between mb-8 px-6">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs">1</div>
                <span className="text-[10px] font-bold text-brand mt-1">{t("cart.step_select")}</span>
              </div>
              <div className="flex-1 h-[2px] bg-brand mx-2 -translate-y-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs">2</div>
                <span className="text-[10px] font-bold text-brand mt-1">{t("cart.step_review")}</span>
              </div>
              <div className="flex-1 h-[2px] bg-brand mx-2 -translate-y-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shadow-md shadow-brand/10">3</div>
                <span className="text-[10px] font-bold text-neutral-800 mt-1">{t("cart.step_pay")}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/60 shadow-sm mb-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                <span className="text-xs text-neutral-450 font-bold">{t("cart.summary_title").toUpperCase()}</span>
                <span className="text-lg font-black text-brand">Rp {cartTotal.toLocaleString("id-ID")}</span>
              </div>
              <h2 className="font-extrabold text-neutral-800 text-xs tracking-wider uppercase">{t("payment.select_method")}</h2>
              <div className="space-y-3 pt-1">
                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "qris" ? "border-brand bg-brand-light" : "border-neutral-200/80 hover:bg-neutral-50"}`}>
                  <input type="radio" name="payment" value="qris" checked={paymentMethod === "qris"} onChange={() => setPaymentMethod("qris")} className="mt-1.5 accent-brand cursor-pointer" />
                  <div className="flex-1 flex gap-3">
                    <div className="bg-brand/10 p-2.5 rounded-xl text-brand self-start"><Wallet className="w-5 h-5" /></div>
                    <div>
                      <span className="font-extrabold text-xs block text-neutral-800">{t("payment.qris_title")}</span>
                      <span className="text-[10px] text-neutral-450 mt-1 block leading-relaxed font-medium">{t("payment.qris_subtitle")}</span>
                    </div>
                  </div>
                </label>
                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "cash" ? "border-brand bg-brand-light" : "border-neutral-200/80 hover:bg-neutral-50"}`}>
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="mt-1.5 accent-brand cursor-pointer" />
                  <div className="flex-1 flex gap-3">
                    <div className="bg-neutral-100 p-2.5 rounded-xl text-neutral-500 self-start"><DollarSign className="w-5 h-5" /></div>
                    <div>
                      <span className="font-extrabold text-xs block text-neutral-800">{t("payment.cash_title")}</span>
                      <span className="text-[10px] text-neutral-450 mt-1 block leading-relaxed font-medium">{t("payment.cash_subtitle")}</span>
                    </div>
                  </div>
                </label>

                {outlet?.qris_static_url && (
                  <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "qris_static" ? "border-brand bg-brand-light" : "border-neutral-200/80 hover:bg-neutral-50"}`}>
                    <input type="radio" name="payment" value="qris_static" checked={paymentMethod === "qris_static"} onChange={() => setPaymentMethod("qris_static")} className="mt-1.5 accent-brand cursor-pointer" />
                    <div className="flex-1 flex gap-3">
                      <div className="bg-brand/10 p-2.5 rounded-xl text-brand self-start"><Image className="w-5 h-5" /></div>
                      <div>
                        <span className="font-extrabold text-xs block text-neutral-800">{t("payment.qris_static_title")}</span>
                        <span className="text-[10px] text-neutral-450 mt-1 block leading-relaxed font-medium">{t("payment.qris_static_subtitle")}</span>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 text-neutral-450 justify-center mb-8">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
              <span className="text-[10px] font-black tracking-wider uppercase">{t("payment.secure_badge")}</span>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-neutral-200/60 z-30 flex justify-center">
              <button
                onClick={handleProcessPayment}
                disabled={loading || cart.length === 0}
                className="w-full max-w-md py-4 bg-brand hover:bg-brand-hover disabled:bg-neutral-200 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-xl shadow-brand/20 transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4.5 h-4.5 animate-spin" /> {t("payment.processing")}</>
                ) : paymentMethod === "qris" ? (
                  t("payment.btn_pay_qris")
                ) : paymentMethod === "qris_static" ? (
                  t("payment.btn_pay_qris_static")
                ) : (
                  t("payment.btn_pay_cash")
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/60 shadow-sm text-center space-y-5">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-widest">{t("payment.scan_to_pay")}</span>
                <span className="text-xl font-black text-neutral-900 block mt-1">Rp {cartTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="relative w-64 h-64 mx-auto p-3 bg-white border border-neutral-200 rounded-3xl shadow-md flex items-center justify-center">
                {paymentMethod === "qris_static" && outlet?.qris_static_url ? (
                  <img src={outlet.qris_static_url} alt="QRIS Static" className="w-full h-full object-contain" />
                ) : qrisUrl ? (
                  <img src={qrisUrl} alt="QRIS Dinamis" className="w-full h-full object-contain" />
                ) : (
                  <Loader2 className="w-10 h-10 animate-spin text-brand" />
                )}
              </div>
              <div className="flex justify-center items-center gap-1.5 pb-2">
                <span className="font-extrabold text-neutral-800 text-xs tracking-tight">QRIS</span>
                <span className="text-[9px] text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded font-bold uppercase">
                  {paymentMethod === "qris_static" ? t("payment.qris_gpn_static") : t("payment.qris_gpn_dynamic")}
                </span>
              </div>
              {paymentMethod !== "qris_static" && (
                <div className="bg-brand-light p-3.5 rounded-2xl border border-brand/10 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-bold">{t("payment.timer_label")}</span>
                  <span className="font-mono font-black text-brand text-sm tracking-wide animate-pulse">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>

            {/* Payment status indicator */}
            {paymentMethod === "qris_static" ? (
              <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-3xl space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-extrabold text-xs text-amber-800 uppercase tracking-wider">{t("payment.manual_confirm_title")}</h3>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                  {t("payment.manual_confirm_desc")}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50/50 border border-blue-200/60 p-4 rounded-3xl space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <h3 className="font-extrabold text-xs text-blue-800 uppercase tracking-wider">{t("payment.waiting_title")}</h3>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                  {t("payment.waiting_desc")}
                </p>
              </div>
            )}

            {/* Dev-only simulate button */}
            {import.meta.env.DEV && (
              <DevPaymentSimulator orderId={createdOrderId} onSuccess={navigateToSuccess} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DevPaymentSimulator({ orderId, onSuccess }: { orderId: string; onSuccess: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSimulate = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      await supabase
        .from("orders")
        .update({ payment_status: "paid", status: "preparing", payment_settled_at: new Date().toISOString() })
        .eq("id", orderId);
      onSuccess(orderId);
    } catch (e) {
      console.error("Simulate error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-3xl space-y-3 text-left">
      <h3 className="font-extrabold text-xs text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
        <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
        {t("payment.sim_title")}
      </h3>
      <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
        {t("payment.sim_desc")}
      </p>
      <button
        onClick={handleSimulate}
        disabled={loading}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {t("payment.sim_btn")}
      </button>
    </div>
  );
}
