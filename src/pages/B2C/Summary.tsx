import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Copy, AlertCircle, ShoppingBag, Phone, Mail, Clock, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/useToast";

interface OrderDetails {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  order_type: string;
  table_number: string | null;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

export default function OrderSummaryCashPage() {
  const { brandCode, outletId } = useParams<{ brandCode: string; outletId: string }>();
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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(outletId);
      const { data } = await (isUuid
        ? supabase.from("outlets").select("*").eq("id", outletId).single()
        : supabase.from("outlets").select("*").eq("slug", outletId).single());
      if (data) setOutlet(data);
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
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
            order_type: data.order_type,
            table_number: data.table_number,
            total_amount: data.total_amount,
            payment_method: data.payment_method,
            payment_status: data.payment_status,
            created_at: data.created_at,
          });
        }
      } catch (err) {
        toast("Gagal memuat order: " + String(err), "error");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const copyOrderId = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayId = orderId ? orderId.substring(0, 8).toUpperCase() : "?";
  const confirmationCode = orderId ? orderId.substring(orderId.length - 4).toUpperCase() : "????";
  const brandColor = outlet?.brand_color ?? "#2563eb";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  // Translate Order Mode (Kamu pesan dari)
  const getOrderSource = (type: string) => {
    switch (type?.toLowerCase()) {
      case "dinein":
        return "Makan di Tempat (Dine-In)";
      case "takeaway":
        return "Bawa Pulang (Takeaway)";
      case "delivery":
        return "Pesan Antar (Delivery)";
      default:
        return "Makan di Tempat";
    }
  };

  // Translate Payment Method
  const getPaymentMethodLabel = (method: string) => {
    switch (method?.toLowerCase()) {
      case "qris":
        return "QRIS Dinamis (Verified Online)";
      case "cash":
        return "Tunai / EDC di Kasir";
      default:
        return "QRIS";
    }
  };

  return (
    <div
      className="flex-1 bg-[#fafafa] text-[#171717] min-h-screen flex flex-col justify-between py-12 px-4 font-sans"
      style={{
        "--brand-color": brandColor,
        "--brand-color-hover": brandColorHover,
        "--brand-color-light": brandColorLight,
      } as React.CSSProperties}
    >
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        {/* SVG Logo OmniOrder */}
        <div className="flex justify-center mb-2">
          <Logo size="lg" />
        </div>

        {/* Success Icon or Confirmation Code */}
        {isPaid || order?.payment_status === "paid" ? (
          <div className="bg-emerald-500 text-white rounded-3xl p-6 shadow-xl shadow-emerald-500/20 inline-block w-full">
            <span className="text-[10px] font-black tracking-widest uppercase opacity-90 block mb-1">
              KODE KONFIRMASI KASIR
            </span>
            <span className="text-4xl font-black tracking-widest block">
              {confirmationCode}
            </span>
            <p className="text-[11px] font-bold opacity-90 mt-3 mx-auto leading-relaxed">
              Tunjukkan kode ini ke kasir untuk konfirmasi pesanan Anda.
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
              ? "Pembayaran Diterima!"
              : "Pesanan Berhasil Dikirim"}
          </h1>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            {isPaid || order?.payment_status === "paid"
              ? "Transaksi Anda telah terverifikasi. Makanan sedang diproses di dapur."
              : "Menunggu pembayaran kasir untuk memulai proses masak."}
          </p>
        </div>

        {/* Order Card Receipt */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/60 shadow-sm text-left">
          {/* Order ID */}
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
            <div>
              <span className="text-[10px] text-neutral-400 font-black block tracking-wider uppercase">ID PESANAN</span>
              <span className="font-mono font-bold text-neutral-800 text-sm tracking-wide">
                {displayId}
              </span>
            </div>
            {orderId && (
              <button
                onClick={copyOrderId}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 rounded-lg text-xs font-bold text-neutral-600 transition-colors cursor-pointer active:scale-95"
              >
                {copied ? "Tercopy" : "Salin ID"}
              </button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3.5 pt-4">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500 font-medium">Nama Pelanggan</span>
              <span className="font-bold text-neutral-800">
                {order ? order.customer_name : "Tamu"}
              </span>
            </div>
            {order?.customer_phone && (
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  No. Telepon Promo
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
                  Struk Email
                </span>
                <span className="font-bold text-neutral-850 truncate max-w-[180px]">
                  {order.customer_email}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500 font-medium">Kamu Pesan Dari</span>
              <span className="font-bold text-neutral-800">
                {order ? getOrderSource(order.order_type) : getOrderSource(orderType)}
              </span>
            </div>
            {(order?.table_number || tableNumber) && (
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Nomor Meja</span>
                <span className="font-bold text-brand">
                  Meja Nomor {order ? order.table_number : tableNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500 font-medium">Metode Pembayaran</span>
              <span className="font-bold text-neutral-800">
                {order ? getPaymentMethodLabel(order.payment_method) : getPaymentMethodLabel(paymentMethod)}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-3.5 border-t border-neutral-100">
              <span className="text-neutral-500 font-bold">Total Pembayaran</span>
              <span className="font-black text-brand text-sm">
                Rp {order ? order.total_amount.toLocaleString("id-ID") : cartTotal.toLocaleString("id-ID")}
              </span>
            </div>
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
            Langkah Selanjutnya
          </h3>
          <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
            {isPaid || order?.payment_status === "paid" ? (
              <span>
                Pembayaran Anda telah diterima secara online. <strong>Segera tunjukkan KODE KONFIRMASI di atas ke kasir</strong> agar dapur mulai menyiapkan pesanan Anda.
              </span>
            ) : (
              <span>
                Silakan menuju konter kasir terdekat, sebutkan <strong>ID Pesanan ({displayId})</strong> Anda, lalu selesaikan pembayaran. Proses memasak menu makanan akan dimulai sesaat setelah kasir mengonfirmasi transaksi pembayaran Anda.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="max-w-md w-full mx-auto px-4 mt-8 text-center flex flex-col gap-3">
        <Link
          to={`/${brandCode}/${outletId}/order`}
          className="inline-flex items-center justify-center w-full py-4 bg-brand hover:bg-brand-hover active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-xl shadow-brand/20 transition-all text-sm gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          Pesan Menu Lainnya
        </Link>
        <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-450 font-bold tracking-wide uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-brand" />
          Enkripsi Pembayaran Terjamin
        </div>
      </div>
    </div>
  );
}
