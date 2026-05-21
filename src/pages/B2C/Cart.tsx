import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Trash2, Plus, Minus, FileText, CheckCircle2, User, Phone, Mail, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { brandCode, outletId } = useParams<{ brandCode: string; outletId: string }>();
  const navigate = useNavigate();
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
  } = useCart();

  const [outlet, setOutlet] = useState<any>(null);
  const [outletError, setOutletError] = useState("");

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
          setOutletError("Outlet tidak ditemukan.");
        }
      } catch (e) {
        setOutletError("Gagal memuat data outlet.");
        console.error(e);
      }
    }
    fetchOutlet();
  }, [outletId]);



  const handleCheckout = () => {
    if (!customerName.trim()) {
      showToast("Mohon masukkan Nama Lengkap Anda.", "error");
      return;
    }
    if (!customerPhone.trim()) {
      showToast("Mohon masukkan Nomor Telepon Anda untuk info promo.", "error");
      return;
    }
    if (orderType === "dinein" && !tableNumber) {
      showToast("Nomor meja tidak terdeteksi. Silakan scan QR code meja Anda kembali.", "error");
      return;
    }
    if (sendReceipt && !customerEmail.trim()) {
      showToast("Mohon masukkan alamat Email untuk pengiriman struk.", "error");
      return;
    }

    // Proceed to payment page
    navigate(`/${brandCode}/${outletId}/payment`);
  };

  const brandColor = outlet?.brand_color || "#2563eb";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  return (
    <div
      className="flex-1 bg-[#fafafa] text-[#171717] min-h-screen pb-28 relative flex flex-col font-sans"
      style={{
        "--brand-color": brandColor,
        "--brand-color-hover": brandColorHover,
        "--brand-color-light": brandColorLight,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/50 px-4 py-4 flex items-center gap-4">
        <Link to={`/${brandCode}/${outletId}/order`} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-neutral-800" />
        </Link>
        <h1 className="font-extrabold text-neutral-900 text-lg">Detail Keranjang</h1>
      </header>

      {/* Progress Bar (UX Psychology - Progress Illusion) */}
      <div className="max-w-md w-full mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-8 px-6">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
              1
            </div>
            <span className="text-[10px] font-bold text-brand mt-1">Pilih</span>
          </div>
          <div className="flex-1 h-[2px] bg-brand mx-2 -translate-y-2"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shadow-md shadow-brand/10">
              2
            </div>
            <span className="text-[10px] font-bold text-neutral-800 mt-1">Review</span>
          </div>
          <div className="flex-1 h-[2px] bg-neutral-200 mx-2 -translate-y-2"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-450 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <span className="text-[10px] font-medium text-neutral-500 mt-1">Bayar</span>
          </div>
        </div>

        {/* Cart Items Section */}
        <h2 className="font-extrabold text-neutral-800 text-xs mb-3 px-1 tracking-wider uppercase">
          Daftar Pesanan ({cart.reduce((sum, item) => sum + item.quantity, 0)} item)
        </h2>

        <div className="space-y-3 mb-8">
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
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-neutral-450 hover:text-red-500 p-1.5 cursor-pointer hover:bg-neutral-50 rounded-lg transition-all active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-black text-brand text-xs block mt-1">
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                    
                    {/* Render Modifiers */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.modifiers.map(mod => (
                          <div key={mod.id} className="text-[10px] text-neutral-500">
                            <span className="font-bold text-neutral-700">{mod.name}: </span>
                            {mod.options.map(opt => opt.name).join(", ")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes and Quantity controls */}
                <div className="flex flex-col gap-3 pt-3 border-t border-neutral-100">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-neutral-450 uppercase tracking-wider">
                      Catatan Khusus Product
                    </label>
                    <div className="relative flex items-center">
                      <FileText className="absolute left-3 w-3.5 h-3.5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Contoh: Tanpa bawang, Level 3..."
                        value={item.notes || ""}
                        onChange={(e) => updateNotes(item.cartItemId, e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-xl text-[10px] focus:outline-none focus:ring-1 focus:ring-brand/15 text-neutral-800 font-medium transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] font-black text-neutral-400 tracking-wider">KAPS: {item.quantity}x</span>
                    <div className="flex items-center gap-3 bg-neutral-100/80 p-1 rounded-xl">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="p-1.5 text-neutral-550 hover:text-neutral-800 cursor-pointer active:scale-90 hover:bg-white rounded-lg transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black w-4 text-center text-neutral-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="p-1.5 text-neutral-550 hover:text-neutral-800 cursor-pointer active:scale-90 hover:bg-white rounded-lg transition-all"
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
              <p className="text-xs text-neutral-500 font-bold">Keranjang belanja Anda kosong.</p>
              <Link
                to={`/${brandCode}/${outletId}/order`}
                className="inline-block mt-4 text-xs font-extrabold text-brand hover:underline cursor-pointer"
              >
                ← Kembali ke Menu
              </Link>
            </div>
          )}
        </div>

        {/* Customer Information Form */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/60 shadow-sm mb-6 space-y-4">
          <h2 className="font-extrabold text-neutral-850 text-sm pb-2 border-b border-neutral-100 flex items-center gap-1.5">
            <User className="w-4 h-4 text-brand" />
            Informasi Pelanggan
          </h2>

          <div className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap Anda..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>Nomor Telepon</span>
                <span className="text-[9px] text-brand lowercase">untuk info promo</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                />
              </div>
            </div>

            {/* Order Mode / Kamu Pesan Dari (Static Service Type Banner) */}
            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                Kamu Pesan Dari (Tipe Pelayanan)
              </label>
              <div className="bg-brand/5 border border-brand/10 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand" />
                  <span className="text-xs font-black text-neutral-800">
                    {orderType === "dinein"
                      ? `Makan di Tempat (Meja ${tableNumber || "-"})`
                      : orderType === "takeaway"
                      ? "Bawa Pulang (Takeaway)"
                      : "Pesan Antar (Delivery)"}
                  </span>
                </div>
                <span className="text-[9px] bg-brand/10 text-brand px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                  Aktif
                </span>
              </div>
            </div>

            {/* Send Receipt to Email */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendReceipt}
                  onChange={(e) => setSendReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-brand accent-brand cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-700">Kirim Struk Digital ke Email</span>
              </label>

              {sendReceipt && (
                <div className="relative mt-2.5 animate-in slide-in-from-top-2 duration-150">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="Masukkan alamat email Anda..."
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850"
                  />
                </div>
              )}
            </div>
            
            {/* General Order Notes */}
            <div className="pt-2 border-t border-neutral-100">
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand" />
                Catatan Pesanan Keseluruhan
              </label>
              <textarea
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder="Contoh: Mohon disiapkan cepat, dsb..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none h-16 placeholder:text-neutral-400"
              />
            </div>
          </div>
        </div>


      </div>

      {/* Sticky Bottom Actions */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-neutral-200/60 z-30 flex justify-center">
          <div className="w-full max-w-md space-y-3">
            {isTaxEnabled && (
              <>
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-neutral-500 font-bold">Subtotal</span>
                  <span className="text-sm font-bold text-neutral-700">
                    Rp {cartSubtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] text-neutral-400 font-bold">PPN ({taxPercentage}%)</span>
                  <span className="text-xs font-bold text-neutral-500">
                    Rp {cartTax.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="h-[1px] w-full bg-neutral-200/60 my-1" />
              </>
            )}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-neutral-500 font-extrabold">Total Tagihan</span>
              <span className="text-lg font-black text-neutral-900">
                Rp {cartTotal.toLocaleString("id-ID")}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-brand hover:bg-brand-hover active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-xl shadow-brand/20 transition-all cursor-pointer text-sm"
            >
              Lanjutkan ke Pembayaran
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
