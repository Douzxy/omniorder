import React, { useState } from "react";
import { ClipboardList, Info, MapPin, FileText, Edit, Plus, Trash2, Save, X, PlusCircle, MinusCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  tax_amount?: number;
  created_at: string;
  delivery_address?: string | null;
  delivery_note?: string | null;
  items?: OrderItem[];
}

interface Outlet {
  id: string;
  name: string;
  slug: string;
  brand_code: string;
  logo_url: string | null;
  brand_color: string;
  table_count: number;
  is_dine_in_enabled: boolean;
  is_takeaway_enabled: boolean;
  is_delivery_enabled: boolean;
  tax_percentage?: number;
  is_tax_enabled?: boolean;
  open_time?: string;
  close_time?: string;
}

interface Product {
  id: string;
  outlet_id: string;
  category_id: string | null;
  name: string;
  price: number;
  description: string;
  image_url: string;
  is_recommended: boolean;
  is_available: boolean;
  sort_order?: number;
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
  outlet: Outlet | null;
  products: Product[];
  onEditOrder: (
    orderId: string,
    updatedFields: any,
    itemsToSave: any[],
    itemIdsToDelete: string[]
  ) => Promise<void>;
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
  outlet,
  products,
  onEditOrder,
}: WorkspaceOrdersTabProps) {
  // Modal Edit States
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [orderType, setOrderType] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [editItems, setEditItems] = useState<any[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // States for Add Item
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [selectedProdMods, setSelectedProdMods] = useState<any[]>([]);
  const [selectedModSelections, setSelectedModSelections] = useState<Record<string, any>>({});
  const [addQty, setAddQty] = useState(1);
  const [addItemNotes, setAddItemNotes] = useState("");
  const [loadingMods, setLoadingMods] = useState(false);

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "unpaid")
      return o.payment_status === "pending" && o.payment_method === "cash";
    return o.status === orderFilter;
  });

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder(order);
    setCustomerName(order.customer_name || "");
    setCustomerPhone(order.customer_phone || "");
    setCustomerNotes((order as any).customer_notes || "");
    setOrderType(order.order_type || "dinein");
    setTableNumber(order.table_number || "");
    setDeliveryAddress(order.delivery_address || "");
    setDeliveryNote(order.delivery_note || "");
    // Clone items list
    setEditItems(
      (order.items || []).map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        notes: item.notes || "",
        product: item.product,
        modifiers: item.modifiers || [],
      }))
    );
    setDeletedItemIds([]);
    setShowAddProduct(false);
    setSelectedProd(null);
    setSelectedProdMods([]);
    setSelectedModSelections({});
    setAddQty(1);
    setAddItemNotes("");
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setEditItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            quantity: newQty,
            total_price: item.unit_price * newQty,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    const item = editItems[index];
    if (item.id) {
      setDeletedItemIds((prev) => [...prev, item.id]);
    }
    setEditItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemNote = (index: number, note: string) => {
    setEditItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, notes: note };
        }
        return item;
      })
    );
  };

  const handleSelectProductToAdd = async (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setSelectedProd(prod);
    setLoadingMods(true);
    try {
      const { data: mods, error } = await supabase
        .from("product_modifiers")
        .select("*, options:product_modifier_options(*)")
        .eq("product_id", productId);
      if (error) throw error;
      setSelectedProdMods(mods || []);
      setSelectedModSelections({});
    } catch (err: any) {
      console.error("Gagal memuat modifier:", err.message);
    } finally {
      setLoadingMods(false);
    }
  };

  const handleAddProductToItems = () => {
    if (!selectedProd) return;

    const chosenModifiers: any[] = [];
    Object.keys(selectedModSelections).forEach((modId) => {
      const selection = selectedModSelections[modId];
      if (Array.isArray(selection)) {
        selection.forEach((s) => {
          chosenModifiers.push({
            modifier_name: s.modifier_name,
            option_name: s.option_name,
            price_adjustment: Number(s.price_adjustment),
          });
        });
      } else if (selection) {
        chosenModifiers.push({
          modifier_name: selection.modifier_name,
          option_name: selection.option_name,
          price_adjustment: Number(selection.price_adjustment),
        });
      }
    });

    const modifiersPriceTotal = chosenModifiers.reduce(
      (acc, m) => acc + m.price_adjustment,
      0
    );
    const unitPrice = selectedProd.price + modifiersPriceTotal;
    const totalPrice = unitPrice * addQty;

    const newEditItem = {
      product_id: selectedProd.id,
      quantity: addQty,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: addItemNotes,
      product: { name: selectedProd.name, price: selectedProd.price },
      modifiers: chosenModifiers,
    };

    setEditItems((prev) => [...prev, newEditItem]);

    // Reset fields
    setShowAddProduct(false);
    setSelectedProd(null);
    setSelectedProdMods([]);
    setSelectedModSelections({});
    setAddQty(1);
    setAddItemNotes("");
  };

  const calculateTotals = () => {
    const subtotal = editItems.reduce((acc, item) => acc + item.total_price, 0);
    const isTaxEnabled = outlet?.is_tax_enabled || false;
    const taxPercentage = outlet?.tax_percentage || 0;
    const taxAmount = isTaxEnabled
      ? Math.round((subtotal * taxPercentage) / 100)
      : 0;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const handleSaveEdit = async () => {
    if (editItems.length === 0) {
      alert("Pesanan harus memiliki minimal 1 produk.");
      return;
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      alert("Alamat pengiriman wajib diisi untuk pesanan Delivery.");
      return;
    }

    setIsSaving(true);
    try {
      const { taxAmount, totalAmount } = calculateTotals();
      const updatedFields = {
        customer_name: customerName.trim() || "Tamu",
        customer_phone: customerPhone.trim() || null,
        customer_notes: customerNotes.trim() || null,
        order_type: orderType,
        table_number: orderType === "dinein" ? tableNumber || null : null,
        delivery_address:
          orderType === "delivery" ? deliveryAddress.trim() || null : null,
        delivery_note:
          orderType === "delivery" ? deliveryNote.trim() || null : null,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      };

      await onEditOrder(
        editingOrder!.id,
        updatedFields,
        editItems,
        deletedItemIds
      );
      setEditingOrder(null);
    } catch (err: any) {
      alert("Gagal menyimpan perubahan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

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
                o.payment_method === "cash" && o.payment_status === "pending"
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
                          selectedOrder?.id === order.id ? null : order
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
                  {(order.status === "pending" ||
                    order.status === "preparing") && (
                    <button
                      onClick={() => handleOpenEditModal(order)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>

                {/* Order items detail */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3">
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-2">
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
                                          `${m.option_name}${m.price_adjustment > 0 ? ` (+${fmt(m.price_adjustment)})` : ""}`
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

                        {order.tax_amount && Number(order.tax_amount) > 0 && (
                          <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                            <div className="flex justify-between text-xs text-neutral-500">
                              <span>Subtotal</span>
                              <span>
                                {fmt(order.total_amount - order.tax_amount)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-neutral-500">
                              <span>Pajak (PPN)</span>
                              <span>{fmt(order.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold text-neutral-800 pt-0.5">
                              <span>Total Tagihan</span>
                              <span>{fmt(order.total_amount)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {order.order_type === "delivery" && (
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 space-y-1.5">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand" />
                          Alamat Pengiriman
                        </p>
                        <p className="text-xs font-semibold text-neutral-800 leading-relaxed">
                          {order.delivery_address || "Tidak ada alamat"}
                        </p>
                        {order.delivery_note && (
                          <p className="text-[10px] text-neutral-500 flex items-start gap-1">
                            <FileText className="w-3 h-3 text-neutral-400 mt-0.5" />
                            <span>Catatan: {order.delivery_note}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900">
                  Edit Pesanan
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Kode Pesanan: {editingOrder.order_code}
                </p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-2 hover:bg-neutral-200 rounded-xl cursor-pointer text-neutral-500 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50">
              {/* Customer Details & Order Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Card */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">
                    Detail Pelanggan
                  </h4>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                      Nama Pelanggan
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                      Nomor Telepon
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                      Catatan Pesanan
                    </label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      rows={2}
                      className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Order Type Card */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">
                    Tipe Pesanan
                  </h4>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                      Pilih Tipe
                    </label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 font-medium"
                    >
                      <option value="dinein">Dine In (Makan di Tempat)</option>
                      <option value="takeaway">Takeaway (Bawa Pulang)</option>
                      <option value="delivery">Delivery (Pesan Antar)</option>
                    </select>
                  </div>

                  {orderType === "dinein" && (
                    <div className="animate-in fade-in duration-250">
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                        Nomor Meja
                      </label>
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Contoh: 12"
                        className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 font-medium"
                      />
                    </div>
                  )}

                  {orderType === "delivery" && (
                    <div className="space-y-3 animate-in fade-in duration-250">
                      <div>
                        <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                          Alamat Pengiriman *
                        </label>
                        <textarea
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Alamat lengkap..."
                          rows={2}
                          className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 font-medium resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                          Catatan Pengiriman
                        </label>
                        <input
                          type="text"
                          value={deliveryNote}
                          onChange={(e) => setDeliveryNote(e.target.value)}
                          placeholder="Cth: Titip di satpam"
                          className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Card */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                  <h4 className="text-xs font-bold text-neutral-800">
                    Daftar Item Pesanan
                  </h4>
                  {!showAddProduct && (
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(true)}
                      className="text-[11px] font-bold text-brand hover:text-brand-hover flex items-center gap-1 cursor-pointer bg-brand/5 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Item
                    </button>
                  )}
                </div>

                {/* Add New Item Panel */}
                {showAddProduct && (
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3 animate-in slide-in-from-top-4 duration-250">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-extrabold text-neutral-700">
                        Tambah Item Baru
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddProduct(false);
                          setSelectedProd(null);
                          setSelectedProdMods([]);
                          setSelectedModSelections({});
                          setAddQty(1);
                          setAddItemNotes("");
                        }}
                        className="text-[10px] text-neutral-400 hover:text-neutral-600 font-bold"
                      >
                        Batal
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                        Pilih Produk
                      </label>
                      <select
                        onChange={(e) =>
                          handleSelectProductToAdd(e.target.value)
                        }
                        defaultValue=""
                        className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none font-medium"
                      >
                        <option value="" disabled>
                          -- Pilih Produk --
                        </option>
                        {products
                          .filter((p) => p.is_available)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({fmt(p.price)})
                            </option>
                          ))}
                      </select>
                    </div>

                    {loadingMods && (
                      <div className="flex items-center gap-2 text-xs text-neutral-500 py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-brand" />
                        <span>Memuat pilihan menu...</span>
                      </div>
                    )}

                    {selectedProd && !loadingMods && (
                      <div className="space-y-3">
                        {/* Modifier Options Selector */}
                        {selectedProdMods.map((mod) => {
                          const max = mod.max_selections || 1;
                          const isRequired = mod.is_required;
                          return (
                            <div
                              key={mod.id}
                              className="border-t border-neutral-200/60 pt-2"
                            >
                              <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                                {mod.name}{" "}
                                {isRequired && (
                                  <span className="text-brand text-[8px] bg-brand/5 px-1 py-0.5 rounded font-black">
                                    Wajib
                                  </span>
                                )}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                                {mod.options.map((opt: any) => {
                                  if (max === 1) {
                                    // Radio style
                                    const isChecked =
                                      selectedModSelections[mod.id]
                                        ?.option_name === opt.name;
                                    return (
                                      <label
                                        key={opt.id}
                                        className="flex items-center gap-2 text-xs font-semibold text-neutral-700 bg-white p-2 rounded-lg border border-neutral-200/80 cursor-pointer hover:bg-neutral-50"
                                      >
                                        <input
                                          type="radio"
                                          name={`mod-${mod.id}`}
                                          checked={isChecked}
                                          onChange={() => {
                                            setSelectedModSelections(
                                              (prev) => ({
                                                ...prev,
                                                [mod.id]: {
                                                  modifier_name: mod.name,
                                                  option_name: opt.name,
                                                  price_adjustment: Number(
                                                    opt.price_adjustment
                                                  ),
                                                },
                                              })
                                            );
                                          }}
                                          className="accent-brand w-3.5 h-3.5"
                                        />
                                        <span className="flex-1">
                                          {opt.name}
                                        </span>
                                        {Number(opt.price_adjustment) > 0 && (
                                          <span className="text-[10px] text-emerald-600 font-bold">
                                            +{fmt(opt.price_adjustment)}
                                          </span>
                                        )}
                                      </label>
                                    );
                                  } else {
                                    // Checkbox style
                                    const currentList =
                                      selectedModSelections[mod.id] || [];
                                    const isChecked = currentList.some(
                                      (s: any) => s.option_name === opt.name
                                    );
                                    return (
                                      <label
                                        key={opt.id}
                                        className="flex items-center gap-2 text-xs font-semibold text-neutral-700 bg-white p-2 rounded-lg border border-neutral-200/80 cursor-pointer hover:bg-neutral-50"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {
                                            setSelectedModSelections(
                                              (prev) => {
                                                const list = prev[mod.id] || [];
                                                const exists = list.some(
                                                  (s: any) =>
                                                    s.option_name === opt.name
                                                );
                                                let updatedList;
                                                if (exists) {
                                                  updatedList = list.filter(
                                                    (s: any) =>
                                                      s.option_name !== opt.name
                                                  );
                                                } else {
                                                  updatedList = [
                                                    ...list,
                                                    {
                                                      modifier_name: mod.name,
                                                      option_name: opt.name,
                                                      price_adjustment: Number(
                                                        opt.price_adjustment
                                                      ),
                                                    },
                                                  ];
                                                }
                                                return {
                                                  ...prev,
                                                  [mod.id]: updatedList,
                                                };
                                              }
                                            );
                                          }}
                                          className="accent-brand w-3.5 h-3.5"
                                        />
                                        <span className="flex-1">
                                          {opt.name}
                                        </span>
                                        {Number(opt.price_adjustment) > 0 && (
                                          <span className="text-[10px] text-emerald-600 font-bold">
                                            +{fmt(opt.price_adjustment)}
                                          </span>
                                        )}
                                      </label>
                                    );
                                  }
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Qty & Note */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-200/60 pt-3">
                          <div>
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                              Jumlah Item
                            </label>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setAddQty((q) => Math.max(1, q - 1))
                                }
                                className="p-1 hover:bg-neutral-200 rounded text-neutral-600 border border-neutral-300 bg-white"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </button>
                              <span className="font-bold text-sm w-6 text-center">
                                {addQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => setAddQty((q) => q + 1)}
                                className="p-1 hover:bg-neutral-200 rounded text-neutral-600 border border-neutral-300 bg-white"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                              Catatan Item (Cth: level 5)
                            </label>
                            <input
                              type="text"
                              value={addItemNotes}
                              onChange={(e) => setAddItemNotes(e.target.value)}
                              placeholder="Keterangan..."
                              className="w-full py-1.5 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddProductToItems}
                          className="w-full py-2 bg-brand text-white font-bold text-xs rounded-lg hover:bg-brand-hover transition-all"
                        >
                          Tambahkan Item Ke Pesanan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {editItems.length === 0 ? (
                    <div className="text-center py-6 text-xs text-neutral-400">
                      Belum ada item pesanan. Klik "Tambah Item" untuk
                      menambahkan.
                    </div>
                  ) : (
                    editItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 p-3 bg-neutral-50/50 rounded-xl border border-neutral-200/80"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-neutral-900 block">
                              {item.product?.name || "Produk"}
                            </span>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                                {item.modifiers
                                  .map(
                                    (m: any) =>
                                      `${m.option_name}${m.price_adjustment > 0 ? ` (+${fmt(m.price_adjustment)})` : ""}`
                                  )
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs font-bold text-neutral-700">
                              {fmt(item.total_price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-neutral-400 hover:text-red-500 rounded hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-neutral-200/40 pt-2 flex-wrap sm:flex-nowrap">
                          {/* Qty edit buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemQty(idx, item.quantity - 1)
                              }
                              className="p-0.5 hover:bg-neutral-200 rounded text-neutral-500 border border-neutral-200 bg-white"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-xs w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemQty(idx, item.quantity + 1)
                              }
                              className="p-0.5 hover:bg-neutral-200 rounded text-neutral-500 border border-neutral-200 bg-white"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Notes field */}
                          <div className="flex-1 min-w-[150px]">
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) =>
                                handleUpdateItemNote(idx, e.target.value)
                              }
                              placeholder="Catatan item (opsional)..."
                              className="w-full px-2.5 py-1 border border-neutral-200 rounded-lg text-[11px] font-medium focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rincian Tagihan */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2 mb-1">
                  Rincian Pembayaran (Live Preview)
                </h4>
                {(() => {
                  const { subtotal, taxAmount, totalAmount } =
                    calculateTotals();
                  return (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-neutral-500 font-medium">
                        <span>Subtotal</span>
                        <span>{fmt(subtotal)}</span>
                      </div>
                      {outlet?.is_tax_enabled && (
                        <div className="flex justify-between text-xs text-neutral-500 font-medium">
                          <span>Pajak (PPN {outlet.tax_percentage}%)</span>
                          <span>{fmt(taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-extrabold text-neutral-800 pt-1 border-t border-neutral-100">
                        <span>Total Tagihan Baru</span>
                        <span>{fmt(totalAmount)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                disabled={isSaving}
                className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 font-bold text-xs rounded-xl hover:bg-neutral-100 cursor-pointer transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-hover cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-brand/20"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
