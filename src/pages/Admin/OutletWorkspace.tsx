import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import Logo from "@/components/Logo";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Layers,
  ListPlus,
  Loader2,
  LogOut,
  Package,
  QrCode,
  RefreshCw,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

import ModifiersManager from "./ModifiersManager";
import WorkspaceOrdersTab from "./WorkspaceOrdersTab";
import WorkspaceReportsTab from "./WorkspaceReportsTab";
import WorkspaceMenuTab from "./WorkspaceMenuTab";
import WorkspaceCategoriesTab from "./WorkspaceCategoriesTab";
import WorkspaceQRTab from "./WorkspaceQRTab";
import WorkspaceSettingsTab from "./WorkspaceSettingsTab";

// ─── Types ───
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
interface Category {
  id: string;
  outlet_id: string;
  name: string;
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
}
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  product?: Product;
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
interface Profile {
  id: string;
  outlet_id: string | null;
  role: string;
  brand_code?: string;
}

// ─── Helpers ───
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

const TABS = [
  { key: "orders", label: "Pesanan Masuk", icon: ClipboardList },
  { key: "menu", label: "Menu Produk", icon: Package },
  { key: "categories", label: "Kategori", icon: Layers },
  { key: "reports", label: "Laporan", icon: BarChart3 },
  { key: "qr", label: "Generator QR", icon: QrCode },
  { key: "settings", label: "Pengaturan", icon: Settings },
];


export default function OutletWorkspace() {
  const { outletId } = useParams<{ outletId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = profile?.role === "super_admin";
  const isAdmin =
    profile?.role === "brand_admin" || profile?.role === "outlet_admin";

  // ── Core state
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get("tab") || "orders";
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        prev.set("tab", tab);
        return prev;
      },
      { replace: true },
    );
  };

  // ── Orders
  const [orderFilter, setOrderFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ── Menu
  const [menuSearch, setMenuSearch] = useState("");
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    price: "",
    description: "",
    image_url: "",
    category_id: "",
    is_recommended: false,
    is_available: true,
  });
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [managingModifiersFor, setManagingModifiersFor] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ── Clock
  // ── Confirm
  const [confirm, setConfirm] = useState<{
    label: string;
    onConfirm: () => void;
  } | null>(null);

  // ─── Fetch data ───
  const fetchWorkspace = useCallback(async () => {
    if (!outletId) return;
    setLoading(true);
    try {
      const out = await supabase
        .from("outlets")
        .select("*")
        .eq("id", outletId)
        .single();
      if (out.data) {
        setOutlet(out.data);
      }

      const [{ data: cats }, { data: prods }, { data: ords }] =
        await Promise.all([
          supabase
            .from("categories")
            .select("*")
            .eq("outlet_id", outletId)
            .order("name"),
          supabase
            .from("products")
            .select("*")
            .eq("outlet_id", outletId)
            .order("name"),
          supabase
            .from("orders")
            .select("*, items:order_items(*, product:products(*))")
            .eq("outlet_id", outletId)
            .order("created_at", { ascending: false })
            .limit(200),
        ]);

      setCategories(cats ?? []);
      setProducts(prods ?? []);

      // Fetch modifiers separately
      const orderList = (ords ?? []) as Order[];
      const itemIds = orderList.flatMap((o) => o.items?.map((i) => i.id) || []);
      if (itemIds.length > 0) {
        const { data: mods } = await supabase
          .from("order_item_modifiers")
          .select("*")
          .in("order_item_id", itemIds);
        if (mods) {
          orderList.forEach((order) => {
            order.items?.forEach((item) => {
              item.modifiers = mods.filter((m) => m.order_item_id === item.id);
            });
          });
        }
      }
      setOrders(orderList);
    } catch (err) {
      toast("Gagal memuat data: " + String(err), "error");
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  // ─── Real-time orders ───
  useEffect(() => {
    if (!outletId) return;
    const ch = supabase
      .channel(`orders-${outletId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `outlet_id=eq.${outletId}`,
        },
        (payload) => setOrders((prev) => [payload.new as Order, ...prev]),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `outlet_id=eq.${outletId}`,
        },
        (payload) =>
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...payload.new } : o,
            ),
          ),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [outletId]);

  // ─── Orders handlers ───
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
    if (selectedOrder?.id === orderId)
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    toast("Status diperbarui", "success");
  };

  const handleConfirmCashPaid = async (orderId: string) => {
    await supabase
      .from("orders")
      .update({ payment_status: "paid", status: "preparing" })
      .eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, payment_status: "paid", status: "preparing" }
          : o,
      ),
    );
    toast("Pembayaran dikonfirmasi", "success");
  };

  // ─── Product handlers ───
  const openAddProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: "",
      price: "",
      description: "",
      image_url: "",
      category_id: categories[0]?.id ?? "",
      is_recommended: false,
      is_available: true,
    });
    setIsProdModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      price: p.price.toString(),
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      category_id: p.category_id ?? "",
      is_recommended: p.is_recommended,
      is_available: p.is_available,
    });
    setIsProdModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !outletId) return;
    setIsUploadingImg(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${outletId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("images")
        .upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      setProdForm((p) => ({ ...p, image_url: data.publicUrl }));
      toast("Gambar berhasil diupload", "success");
    } catch (err: any) {
      toast("Gagal upload: " + err.message, "error");
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(prodForm.price.toString().replace(/\D/g, ""));
    const payload = {
      ...prodForm,
      outlet_id: outletId!,
      price: numericPrice,
      category_id: prodForm.category_id || null,
    };
    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id);
      if (!error) {
        setProducts((p) =>
          p.map((pr) =>
            pr.id === editingProduct.id ? { ...pr, ...payload } : pr,
          ),
        );
        toast("Produk diperbarui", "success");
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        setProducts((p) => [...p, data]);
        toast("Produk ditambahkan", "success");
      }
    }
    setIsProdModalOpen(false);
  };

  const handleToggleAvailable = async (productId: string, current: boolean) => {
    await supabase
      .from("products")
      .update({ is_available: !current })
      .eq("id", productId);
    setProducts((p) =>
      p.map((pr) =>
        pr.id === productId ? { ...pr, is_available: !current } : pr,
      ),
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    await supabase.from("products").delete().eq("id", productId);
    setProducts((p) => p.filter((pr) => pr.id !== productId));
    toast("Produk dihapus", "success");
    setConfirm(null);
  };

  // ─── Computed ───
  const filteredProducts = products
    .filter(
      (p) =>
        !menuSearch || p.name.toLowerCase().includes(menuSearch.toLowerCase()),
    )
    .sort((a, b) =>
      a.is_available === b.is_available ? 0 : a.is_available ? -1 : 1,
    );

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "unpaid")
      return o.payment_status === "pending" && o.payment_method === "cash";
    return o.status === orderFilter;
  });

  const allTabs = TABS;

  const backUrl = isSuperAdmin
    ? `/admin/units/${outlet?.brand_code}`
    : profile?.role === "brand_admin"
      ? `/admin/units/${profile.brand_code}`
      : "/admin";

  const brandColor = outlet?.brand_color ?? "#f97316";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );

  return (
    <div
      className="min-h-screen bg-neutral-50 flex flex-col font-sans"
      style={{
"--color-brand": brandColor,
    "--color-brand-hover": brandColorHover,
    "--color-brand-light": brandColorLight,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(backUrl)}
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Logo size="sm" />
          {outlet && (
            <div className="hidden sm:flex items-center gap-1.5 bg-brand/5 border border-zinc-200 px-2.5 py-1 rounded-full">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: outlet.brand_color }}
              />
              <span className="text-[11px] font-semibold text-brand">
                {outlet.name}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchWorkspace}
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 cursor-pointer transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={signOut}
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 cursor-pointer transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200 overflow-x-auto custom-scrollbar">
        <div className="flex md:justify-center px-4 min-w-max md:min-w-full">
          {allTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === key ? "border-brand text-brand" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 space-y-4">
        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <WorkspaceOrdersTab
            orders={filteredOrders as any}
            orderFilter={orderFilter}
            selectedOrder={selectedOrder as any}
            onOrderFilterChange={setOrderFilter}
            onSelectOrder={(order) => setSelectedOrder(order as any)}
            onConfirmCashPaid={handleConfirmCashPaid}
            onUpdateStatus={handleUpdateOrderStatus}
            onCancelOrder={(orderCode, orderId) =>
              setConfirm({
                label: `Batalkan pesanan ${orderCode}?`,
                onConfirm: () => handleUpdateOrderStatus(orderId, "cancelled"),
              })
            }
          />
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === "reports" && (
          <WorkspaceReportsTab orders={orders} />
        )}

        {/* ── MENU TAB ── */}
        {activeTab === "menu" && (
          <WorkspaceMenuTab
            products={filteredProducts}
            menuSearch={menuSearch}
            onMenuSearchChange={setMenuSearch}
            onAddProduct={openAddProduct}
            onEditProduct={openEditProduct}
            onToggleAvailable={handleToggleAvailable}
            onDeleteProduct={(p) =>
              setConfirm({
                label: `Hapus produk "${p.name}"?`,
                onConfirm: () => handleDeleteProduct(p.id),
              })
            }
          />
        )}

        {/* ── CATEGORIES TAB ── */}
        {activeTab === "categories" && (
          <WorkspaceCategoriesTab
            categories={categories}
            onAddCategory={async (name) => {
              if (!outletId) return;
              const { data, error } = await supabase
                .from("categories")
                .insert({ outlet_id: outletId, name: name.trim() })
                .select()
                .single();
              if (!error && data) {
                setCategories((p) => [...p, data]);
                toast("Kategori ditambahkan", "success");
              }
            }}
            onUpdateCategory={async (catId, name) => {
              await supabase.from("categories").update({ name: name.trim() }).eq("id", catId);
              setCategories((p) => p.map((c) => c.id === catId ? { ...c, name: name.trim() } : c));
              toast("Kategori diperbarui", "success");
            }}
            onDeleteCategory={(cat) =>
              setConfirm({
                label: `Hapus kategori "${cat.name}"?`,
                onConfirm: async () => {
                  await supabase.from("categories").delete().eq("id", cat.id);
                  setCategories((p) => p.filter((c) => c.id !== cat.id));
                  toast("Kategori dihapus", "success");
                  setConfirm(null);
                },
              })
            }
          />
        )}

        {/* ── QR TAB ── */}
        {activeTab === "qr" && outlet && (
          <WorkspaceQRTab outlet={outlet} />
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && outlet && (
          <WorkspaceSettingsTab outlet={outlet} />
        )}

      </main>

      {/* ── Product Modal ── */}
      {isProdModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setIsProdModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">
                {editingProduct ? "Edit Produk" : "Tambah Produk"}
              </h3>
              <button
                onClick={() => setIsProdModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              {[
                {
                  label: "Nama Produk *",
                  field: "name",
                  type: "text",
                  placeholder: "Nama menu...",
                },
                {
                  label: "Harga (Rp) *",
                  field: "price",
                  type: "text",
                  placeholder: "15.000",
                },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    required
                    value={
                      field === "price" && prodForm.price
                        ? Number(
                            prodForm.price.toString().replace(/\D/g, ""),
                          ).toLocaleString("id-ID")
                        : (prodForm as any)[field]
                    }
                    onChange={(e) => {
                      if (field === "price") {
                        const val = e.target.value.replace(/\D/g, "");
                        setProdForm((p) => ({ ...p, price: val }));
                      } else {
                        setProdForm((p) => ({ ...p, [field]: e.target.value }));
                      }
                    }}
                    placeholder={placeholder}
                    className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                  />
                </div>
              ))}

              {/* Image */}
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Gambar
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={prodForm.image_url}
                    onChange={(e) =>
                      setProdForm((p) => ({ ...p, image_url: e.target.value }))
                    }
                    placeholder="https://..."
                    className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                  />
                  <label className="cursor-pointer flex-shrink-0 h-[38px] flex items-center">
                    <span
                      className={`text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-100 text-brand hover:bg-neutral-200 transition-all whitespace-nowrap ${isUploadingImg ? "opacity-50" : ""}`}
                    >
                      {isUploadingImg ? "Upload..." : "Upload"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImg}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={prodForm.description}
                  onChange={(e) =>
                    setProdForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Deskripsi singkat..."
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <select
                  value={prodForm.category_id}
                  onChange={(e) =>
                    setProdForm((p) => ({ ...p, category_id: e.target.value }))
                  }
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                >
                  <option value="">— Tanpa Kategori —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                {(["is_recommended", "is_available"] as const).map((field) => (
                  <label
                    key={field}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={prodForm[field]}
                      onChange={(e) =>
                        setProdForm((p) => ({
                          ...p,
                          [field]: e.target.checked,
                        }))
                      }
                      className="w-3.5 h-3.5 accent-brand cursor-pointer"
                    />
                    <span className="text-xs font-medium text-neutral-700">
                      {field === "is_recommended" ? "Rekomendasi" : "Tersedia"}
                    </span>
                  </label>
                ))}
              </div>

              {editingProduct && (
                <div className="pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() =>
                      setManagingModifiersFor({
                        id: editingProduct.id,
                        name: editingProduct.name,
                      })
                    }
                    className="w-full py-2.5 bg-neutral-100 text-neutral-700 font-bold text-sm rounded-lg hover:bg-neutral-200 cursor-pointer flex justify-center items-center gap-2"
                  >
                    <ListPlus className="w-4 h-4" /> Atur Pilihan (Modifiers)
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsProdModalOpen(false)}
                  className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setConfirm(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-sm text-neutral-900 mb-1">
              Konfirmasi
            </h3>
            <p className="text-sm text-neutral-500 mb-4">{confirm.label}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirm.onConfirm}
                className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {managingModifiersFor && (
        <ModifiersManager
          productId={managingModifiersFor.id}
          productName={managingModifiersFor.name}
          onClose={() => setManagingModifiersFor(null)}
        />
      )}
    </div>
  );
}
