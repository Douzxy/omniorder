import React from "react";
import { ClipboardList, Info } from "lucide-react";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  product?: { id: string; name: string; image_url: string; price: number };
  modifiers?: {
    modifier_name: string;
    option_name: string;
    price_adjustment: number;
  }[];
}

interface Order {
  id: string;
  outlet_id: string;
  order_code: string;
  order_type: string;
  table_number: string | null;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

interface WorkspaceOrdersTabProps {
  orders: Order[];
  orderFilter: string;
  selectedOrder: Order | null;
  onOrderFilterChange: (filter: string) => void;
  onSelectOrder: (order: Order | null) => void;
  onConfirmCashPaid: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onCancelOrder: (orderCode: string, orderId: string) => void;
}

const fmt = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-brand/5 text-brand/70",
  preparing: "bg-brand/10 text-brand",
  completed: "bg-brand/5 text-brand",
  cancelled: "bg-brand/5 text-neutral-500",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  preparing: "Diproses",
  completed: "Selesai",
  cancelled: "Batal",
};

export default function WorkspaceOrdersTab({
  orders,
  orderFilter,
  selectedOrder,
  onOrderFilterChange,
  onSelectOrder,
  onConfirmCashPaid,
  onUpdateStatus,
  onCancelOrder,
}: WorkspaceOrdersTabProps) {
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "unpaid")
      return o.payment_status === "pending" && o.payment_method === "cash";
    return o.status === orderFilter;
  });

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Pesanan", value: orders.length },
          {
            label: "Menunggu",
            value: orders.filter((o) => o.status === "pending").length,
          },
          {
            label: "Diproses",
            value: orders.filter((o) => o.status === "preparing").length,
          },
          {
            label: "Tagih Tunai",
            value: orders.filter(
              (o) =>
                o.payment_method === "cash" && o.payment_status === "pending",
            ).length,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-neutral-200 rounded-xl p-3 text-center"
          >
            <div className="text-2xl font-bold text-neutral-900">{value}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ["all", "Semua"],
          ["pending", "Menunggu"],
          ["preparing", "Diproses"],
          ["completed", "Selesai"],
          ["cancelled", "Batal"],
          ["unpaid", "Tagih Tunai"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => onOrderFilterChange(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${orderFilter === v ? "bg-brand text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
            <ClipboardList className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Tidak ada pesanan</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-neutral-900">
                        {order.customer_name || "Tamu"}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status] ?? "bg-brand/5 text-brand/70"}`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      {order.payment_method === "cash" &&
                        order.payment_status === "pending" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                            Tagih Tunai
                          </span>
                        )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {order.order_code} ·{" "}
                      {order.order_type === "dinein"
                        ? `Meja ${order.table_number}`
                        : order.order_type === "takeaway"
                          ? "Takeaway"
                          : "Delivery"}{" "}
                      · {fmtDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-sm text-neutral-900">
                      {fmt(order.total_amount)}
                    </span>
                    <button
                      onClick={() =>
                        onSelectOrder(
                          selectedOrder?.id === order.id ? null : order,
                        )
                      }
                      className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer text-neutral-400 transition-all"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap mt-3">
                  {order.payment_method === "cash" &&
                    order.payment_status === "pending" && (
                      <button
                        onClick={() => onConfirmCashPaid(order.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
                      >
                        Konfirmasi Bayar Tunai
                      </button>
                    )}
                  {order.status === "pending" && (
                    <button
                      onClick={() => onUpdateStatus(order.id, "preparing")}
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 cursor-pointer transition-all"
                    >
                      Mulai Proses
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      onClick={() => onUpdateStatus(order.id, "completed")}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
                    >
                      Tandai Selesai
                    </button>
                  )}
                  {(order.status === "pending" ||
                    order.status === "preparing") && (
                    <button
                      onClick={() => onCancelOrder(order.order_code, order.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer transition-all"
                    >
                      Batalkan
                    </button>
                  )}
                </div>

                {/* Order items detail */}
                {selectedOrder?.id === order.id &&
                  order.items &&
                  order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Detail Pesanan
                      </p>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-800 text-xs">
                              {item.quantity}×{" "}
                              {(item.product as any)?.name ?? "Produk"}
                            </p>
                            {item.modifiers &&
                              item.modifiers.length > 0 && (
                                <p className="text-[10px] text-neutral-400 mt-0.5">
                                  {item.modifiers
                                    .map(
                                      (m) =>
                                        `${m.option_name}${m.price_adjustment > 0 ? ` (+${fmt(m.price_adjustment)})` : ""}`,
                                    )
                                    .join(", ")}
                                </p>
                              )}
                            {item.notes && (
                              <p className="text-[10px] text-neutral-400 italic">
                                Catatan: {item.notes}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-neutral-700 flex-shrink-0">
                            {fmt(item.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
