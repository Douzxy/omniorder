import { TrendingUp } from "lucide-react";

interface OrderItem {
  id: string; order_id: string; product_id: string; quantity: number;
  unit_price: number; total_price: number;
  product?: { id: string; name: string; image_url: string; price: number };
  modifiers?: { modifier_name: string; option_name: string; price_adjustment: number }[];
}
interface Order {
  id: string; outlet_id: string; order_code: string; order_type: string;
  table_number: string | null; customer_name: string; customer_phone: string;
  status: string; payment_method: string; payment_status: string;
  total_amount: number; created_at: string; items?: OrderItem[];
}
interface WorkspaceReportsTabProps {
  orders: Order[];
}

const fmt = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`;

export default function WorkspaceReportsTab({ orders }: WorkspaceReportsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-sm text-neutral-900">
        Laporan Penjualan (Pesanan Selesai)
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Total Pendapatan
          </p>
          <p className="font-bold text-lg text-neutral-900">
            {fmt(
              orders
                .filter((o) => o.status === "completed")
                .reduce((sum, o) => sum + o.total_amount, 0),
            )}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Total Pesanan
          </p>
          <p className="font-bold text-lg text-neutral-900">
            {orders.filter((o) => o.status === "completed").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            QRIS / Online
          </p>
          <p className="font-bold text-lg text-neutral-900">
            {
              orders.filter(
                (o) =>
                  o.status === "completed" && o.payment_method !== "cash",
              ).length
            }
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Tunai (Cash)
          </p>
          <p className="font-bold text-lg text-neutral-900">
            {
              orders.filter(
                (o) =>
                  o.status === "completed" && o.payment_method === "cash",
              ).length
            }
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-neutral-200 mt-4">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-4 h-4 text-neutral-400" />
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Item Terlaris (Pesanan Selesai)
          </p>
        </div>
        <div className="space-y-3">
          {(() => {
            const itemsMap: Record<
              string,
              { name: string; qty: number; rev: number }
            > = {};
            orders
              .filter((o) => o.status === "completed")
              .forEach((o) => {
                o.items?.forEach((i) => {
                  const pName =
                    (i.product as any)?.name ?? "Produk Terhapus";
                  if (!itemsMap[pName])
                    itemsMap[pName] = { name: pName, qty: 0, rev: 0 };
                  itemsMap[pName].qty += i.quantity;
                  itemsMap[pName].rev += i.total_price;
                });
              });
            const topItems = Object.values(itemsMap)
              .sort((a, b) => b.qty - a.qty)
              .slice(0, 5);
            if (topItems.length === 0)
              return (
                <p className="text-xs text-neutral-400 text-center py-4">
                  Belum ada data penjualan
                </p>
              );
            return topItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm border-b border-neutral-50 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-neutral-100 rounded flex items-center justify-center text-[10px] font-bold text-neutral-500">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-neutral-800">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">
                    {item.qty}x
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {fmt(item.rev)}
                  </p>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
