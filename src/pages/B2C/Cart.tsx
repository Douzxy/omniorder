import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Trash2, Plus, Minus, FileText, CheckCircle2, User, Phone, Mail, ShoppingBag, Edit2, MapPin, Navigation } from "lucide-react";
import OfflineBanner from "@/components/OfflineBanner";

export default function CartPage() {
  const { brandCode: rawBrandCode, outletId } = useParams<{ brandCode: string; outletId: string }>();
  const brandCode = rawBrandCode?.toLowerCase() ?? "";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    orderType,
    tableNumber,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    generalNote,
    setGeneralNote,
    sendReceipt,
    setSendReceipt,
    isTaxEnabled,
    taxPercentage,
    cartSubtotal,
    cartTax,
    cartTotal,
    updateNotes,
    showToast,
    deliveryAddress,
    setDeliveryAddress,
    deliveryNote,
    setDeliveryNote,
  } = useCart();

  const { user, profile } = useAuth();

  const [outlet, setOutlet] = useState<any>(null);
  const [outletError, setOutletError] = useState("");

  // Auto-fill customer info from logged-in user
  useEffect(() => {
    if (user && profile) {
      if (profile.name && !customerName) setCustomerName(profile.name);
      if (profile.phone && !customerPhone) setCustomerPhone(profile.phone);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
    }
  }, [user, profile]);

  useEffect(() => {
    async function fetchOutlet() {
      if (!outletId) return;
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(outletId);
        const { data, error } = await (isUuid
          ? supabase.from("outlets").select("*").eq("id", outletId).single()
          : supabase.from("outlets").select("*").eq("slug", outletId).single());

        if (data && !error) {
          setOutlet(data);
        } else {
          const cachedCatalogStr = localStorage.getItem(`omniorder_catalog_${outletId}`);
          if (cachedCatalogStr) {
            const cachedCatalog = JSON.parse(cachedCatalogStr);
            if (cachedCatalog?.outlet) {
              setOutlet(cachedCatalog.outlet);
              return;
            }
          }
          setOutletError("Outlet tidak ditemukan.");
        }
      } catch (e) {
        const cachedCatalogStr = localStorage.getItem(`omniorder_catalog_${outletId}`);
        if (cachedCatalogStr) {
          try {
            const cachedCatalog = JSON.parse(cachedCatalogStr);
            if (cachedCatalog?.outlet) {
              setOutlet(cachedCatalog.outlet);
              return;
            }
          } catch (_) {}
        }
        setOutletError("Gagal memuat data outlet.");
        showToast("Gagal memuat data: " + String(e), "error");
      }
    }
    fetchOutlet();
  }, [outletId]);

  const handleCheckout = () => {
    if (!customerName.trim()) {
      showToast(t("cart.validation_name"), "error");
      return;
    }
    if (!customerPhone.trim()) {
      showToast(t("cart.validation_phone"), "error");
      return;
    }
    if (orderType === "dinein" && !tableNumber) {
      showToast(t("cart.validation_table"), "error");
      return;
    }
    if (!customerEmail.trim()) {
      showToast(t("cart.validation_email"), "error");
      return;
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      showToast(t("cart.validation_address"), "error");
      return;
    }

    navigate(`/${brandCode}/${outletId}/payment`);
  };

  const brandColor = outlet?.brand_color || "#2563eb";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  return (
    <div
      className="flex-1 bg-[#fafafa] text-[#171717] min-h-screen pb-28 relative flex flex-col font-sans"
      style={
        {
          "--color-brand": brandColor,
          "--color-brand-hover": brandColorHover,
          "--color-brand-light": brandColorLight,
        } as React.CSSProperties
      }
    >
      <OfflineBanner />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/50 px-4 py-4 flex items-center gap-4">
        <Link
          to={`/${brandCode}/${outletId}/order`}
          className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-800" />
        </Link>
        <h1 className="font-extrabold text-neutral-900 text-lg">
          {t("cart.title")}
        </h1>
      </header>

      {/* Progress Bar */}
      <div className="max-w-md w-full mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-8 px-6">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
              1
            </div>
            <span className="text-[10px] font-bold text-brand mt-1">{t("cart.step_select")}</span>
          </div>
          <div className="flex-1 h-[2px] bg-brand mx-2 -translate-y-2"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shadow-md shadow-brand/10">
              2
            </div>
            <span className="text-[10px] font-bold text-neutral-800 mt-1">
              {t("cart.step_review")}
            </span>
          </div>
          <div className="flex-1 h-[2px] bg-neutral-200 mx-2 -translate-y-2"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-450 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <span className="text-[10px] font-medium text-neutral-500 mt-1">
              {t("cart.step_pay")}
            </span>
          </div>
        </div>

        {/* 1. Customer Information Form */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/60 shadow-sm mb-6 space-y-4">
          <h2 className="font-extrabold text-neutral-850 text-sm pb-2 border-b border-neutral-100 flex items-center gap-1.5">
            <User className="w-4 h-4 text-brand" />
            {t("cart.customer_info")}
          </h2>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                {t("cart.name_label")}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t("cart.name_placeholder")}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>{t("cart.email_label")}</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  placeholder={t("cart.email_placeholder")}
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>{t("cart.phone_label")}</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="tel"
                  placeholder={t("cart.phone_placeholder")}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                {t("cart.order_mode_title")}
              </label>
              <div className="bg-brand/5 border border-brand/10 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand" />
                  <span className="text-xs font-black text-neutral-800">
                    {orderType === "dinein"
                      ? `${t("order.type.dinein")} (${t("order.table_number", { number: tableNumber || "-" })})`
                      : orderType === "takeaway"
                        ? t("order.type.takeaway")
                        : t("order.type.delivery")}
                  </span>
                </div>
                <span className="text-[9px] bg-brand/10 text-brand px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                  {t("cart.active")}
                </span>
              </div>
            </div>

            {/* Email Receipt Toggle */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand" />
                <div>
                  <span className="text-[11px] font-bold text-neutral-800 block">{t("cart.send_receipt_label")}</span>
                  <span className="text-[9px] text-neutral-400">Dapatkan bukti pemesanan di email</span>
                </div>
              </div>
              <button
                onClick={() => setSendReceipt(!sendReceipt)}
                className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                  sendReceipt ? "bg-brand" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    sendReceipt ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Address — only shown for delivery orders */}
        {orderType === "delivery" && (
          <div className="bg-white p-5 rounded-3xl border border-brand/20 shadow-sm mb-6 space-y-4">
            <h2 className="font-extrabold text-neutral-850 text-sm pb-2 border-b border-neutral-100 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand" />
              {t("cart.delivery_info")}
              <span className="ml-auto text-[9px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-black uppercase">{t("common.required")}</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                  {t("cart.address_label")}
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                  <textarea
                    placeholder={t("cart.address_placeholder")}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850 resize-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                  {t("cart.notes_label")} <span className="text-neutral-400 normal-case font-medium">{t("common.optional")}</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={t("cart.notes_placeholder")}
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                  />
                </div>
              </div>
              {deliveryAddress && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">{deliveryAddress}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Cart Items Section */}
        <h2 className="font-extrabold text-neutral-800 text-xs mb-3 px-1 tracking-wider uppercase">
          {t("cart.title")} ({cart.reduce((sum, item) => sum + item.quantity, 0)} {t("order.items")})
        </h2>

        <div className="space-y-3 mb-6">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-white p-4 rounded-3xl border border-neutral-200/60 shadow-sm flex flex-col gap-3"
              >
                <div className="flex gap-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-neutral-100"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-extrabold text-neutral-850 text-xs leading-snug">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/${brandCode}/${outletId}/order?editCartItem=${item.cartItemId}`}
                          className="text-neutral-450 hover:text-brand p-1.5 cursor-pointer hover:bg-brand/5 rounded-lg transition-colors"
                          title="Edit Varian/Pilihan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-neutral-450 hover:text-red-500 p-1.5 cursor-pointer hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <span className="font-black text-brand text-xs block mt-1">
                      Rp {((item.price + (item.modifiers || []).reduce((acc, mod) => acc + mod.options.reduce((sum, opt) => sum + Number(opt.price_adjustment), 0), 0))).toLocaleString("id-ID")}
                    </span>

                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.modifiers.map((mod) => (
                          <div
                            key={mod.id}
                            className="text-[10px] text-neutral-500"
                          >
                            <span className="font-bold text-neutral-700">
                              {mod.name}:{" "}
                            </span>
                            {mod.options.map((opt) => opt.name).join(", ")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-neutral-100">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-neutral-450 uppercase tracking-wider">
                      {t("cart.notes_item_label")}
                    </label>
                    <div className="relative flex items-center">
                      <FileText className="absolute left-3 w-3.5 h-3.5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder={t("cart.notes_item_placeholder")}
                        value={item.notes || ""}
                        onChange={(e) =>
                          updateNotes(item.cartItemId, e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-xl text-[10px] focus:outline-none focus:ring-1 focus:ring-brand/15 text-neutral-850 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] font-black text-neutral-400 tracking-wider">
                      {t("cart.quantity", { count: item.quantity })}
                    </span>
                    <div className="flex items-center gap-3 bg-neutral-100/80 p-1 rounded-xl">
                      <button
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity - 1)
                        }
                        className="p-1.5 text-neutral-550 hover:text-neutral-800 cursor-pointer active:scale-90 hover:bg-white rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black w-4 text-center text-neutral-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity + 1)
                        }
                        className="p-1.5 text-neutral-550 hover:text-neutral-800 cursor-pointer active:scale-90 hover:bg-white rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200/50">
              <CheckCircle2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-xs text-neutral-500 font-bold">
                {t("cart.empty")}
              </p>
              <Link
                to={`/${brandCode}/${outletId}/order`}
                className="inline-block mt-4 text-xs font-extrabold text-brand hover:underline cursor-pointer"
              >
                ← {t("cart.back_to_menu")}
              </Link>
            </div>
          )}
        </div>

        {/* 3. General Order Notes */}
        {cart.length > 0 && (
          <div className="bg-white p-5 rounded-3xl border border-neutral-200/60 shadow-sm mb-6">
            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand" />
              {t("cart.notes_label")}
            </label>
            <textarea
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder={t("cart.notes_placeholder")}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none h-16 placeholder:text-neutral-400"
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-neutral-200/60 z-30 flex justify-center">
          <div className="w-full max-w-md space-y-3">
            {isTaxEnabled && (
              <>
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-neutral-500 font-bold">
                    {t("cart.subtotal")}
                  </span>
                  <span className="text-sm font-bold text-neutral-700">
                    Rp {cartSubtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] text-neutral-450 font-bold">
                    {t("cart.tax", { percent: taxPercentage })}
                  </span>
                  <span className="text-xs font-bold text-neutral-500">
                    Rp {cartTax.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="h-[1px] w-full bg-neutral-200/60 my-1" />
              </>
            )}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-neutral-500 font-extrabold">
                {t("cart.total")}
              </span>
              <span className="text-lg font-black text-neutral-900">
                Rp {cartTotal.toLocaleString("id-ID")}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-brand hover:bg-brand-hover active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-xl shadow-brand/20 transition-all cursor-pointer text-sm"
            >
              {t("cart.btn_checkout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
