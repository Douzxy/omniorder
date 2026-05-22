import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import Logo from "@/components/Logo";
import {
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  ClipboardList,
  Package,
  Layers,
  QrCode,
  Settings,
  Check,
  Search,
  Store,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Info,
  Clock,
  ListPlus,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import ModifiersManager from "./ModifiersManager";

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
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Categories
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  // ── QR
  const [qrMode, setQrMode] = useState<"dinein" | "takeaway" | "delivery">(
    "dinein",
  );
  const [qrTable, setQrTable] = useState("1");
  const [qrUrl, setQrUrl] = useState("");
  const [qrImg, setQrImg] = useState("");

  // ── Settings
  const [outletForm, setOutletForm] = useState<Partial<Outlet>>({});
  const [settingsLogoFile, setSettingsLogoFile] = useState<File | null>(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string>("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        setOutletForm(out.data);
        setSettingsLogoPreview(out.data.logo_url ?? "");
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

  // ─── Category handlers ───
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !outletId) return;
    const { data, error } = await supabase
      .from("categories")
      .insert({ outlet_id: outletId, name: newCatName.trim() })
      .select()
      .single();
    if (!error && data) {
      setCategories((p) => [...p, data]);
      setNewCatName("");
      toast("Kategori ditambahkan", "success");
    }
  };

  const handleUpdateCategory = async (catId: string) => {
    if (!editCatName.trim()) return;
    await supabase
      .from("categories")
      .update({ name: editCatName.trim() })
      .eq("id", catId);
    setCategories((p) =>
      p.map((c) => (c.id === catId ? { ...c, name: editCatName.trim() } : c)),
    );
    setEditingCatId(null);
    toast("Kategori diperbarui", "success");
  };

  const handleDeleteCategory = async (catId: string) => {
    await supabase.from("categories").delete().eq("id", catId);
    setCategories((p) => p.filter((c) => c.id !== catId));
    toast("Kategori dihapus", "success");
    setConfirm(null);
  };

  // ─── QR handler ───
  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlet) return;

    if (qrMode === "dinein" && qrTable) {
      const tableNum = Number(qrTable);
      const maxTable = outlet.table_count || 99;
      if (tableNum > maxTable || tableNum < 1) {
        toast(`Nomor meja maksimal ${maxTable}`, "error");
        return;
      }
    }

    const origin = window.location.origin;
    let url = `${origin}/${outlet.brand_code}/${outlet.slug}/order?mode=${qrMode}`;
    if (qrMode === "dinein" && qrTable) url += `&tableNumber=${qrTable}`;
    setQrUrl(url);
    setQrImg(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`,
    );
  };

  const handleDownloadQR = async () => {
    if (!qrImg) return;
    const res = await fetch(qrImg);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${outlet?.slug ?? "outlet"}-${qrMode}${qrMode === "dinein" ? `-meja${qrTable}` : ""}.png`;
    a.click();
  };

  // ─── Settings handler ───
  const handleSettingsLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSettingsLogoFile(file);
    setSettingsLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletId) return;
    setSavingSettings(true);
    try {
      let logo_url = outlet?.logo_url ?? null;
      if (settingsLogoFile) {
        setUploadingLogo(true);
        const ext = settingsLogoFile.name.split(".").pop();
        const path = `logos/${outletId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("images")
          .upload(path, settingsLogoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        logo_url = data.publicUrl;
        setUploadingLogo(false);
      }
      const payload = {
        ...outletForm,
        logo_url,
        table_count: Number(outletForm.table_count),
      };
      const { data, error } = await supabase
        .from("outlets")
        .update(payload)
        .eq("id", outletId)
        .select()
        .single();
      if (error) throw error;
      setOutlet(data);
      setSettingsLogoFile(null);
      toast("Pengaturan disimpan", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSavingSettings(false);
    }
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
                      o.payment_method === "cash" &&
                      o.payment_status === "pending",
                  ).length,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white border border-neutral-200 rounded-xl p-3 text-center"
                >
                  <div className="text-2xl font-bold text-neutral-900">
                    {value}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {label}
                  </div>
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
                  onClick={() => setOrderFilter(v)}
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
                              setSelectedOrder(
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
                              onClick={() => handleConfirmCashPaid(order.id)}
                              className="px-3 py-1.5 text-xs font-semibold bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
                            >
                              Konfirmasi Bayar Tunai
                            </button>
                          )}
                        {order.status === "pending" && (
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "preparing")
                            }
                            className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 cursor-pointer transition-all"
                          >
                            Mulai Proses
                          </button>
                        )}
                        {order.status === "preparing" && (
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "completed")
                            }
                            className="px-3 py-1.5 text-xs font-semibold bg-brand text-white rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
                          >
                            Tandai Selesai
                          </button>
                        )}
                        {(order.status === "pending" ||
                          order.status === "preparing") && (
                          <button
                            onClick={() =>
                              setConfirm({
                                label: `Batalkan pesanan ${order.order_code}?`,
                                onConfirm: () =>
                                  handleUpdateOrderStatus(
                                    order.id,
                                    "cancelled",
                                  ),
                              })
                            }
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
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === "reports" && (
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
        )}

        {/* ── MENU TAB ── */}
        {activeTab === "menu" && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 bg-white"
                />
              </div>
              <button
                onClick={openAddProduct}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Produk
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-neutral-200">
                  <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">Belum ada produk</p>
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-xl p-3 flex gap-3 ${!p.is_available ? "opacity-60 border-neutral-200" : "border-neutral-200"}`}
                  >
                    <img
                      src={
                        p.image_url ||
                        `https://placehold.co/64x64/f5f5f5/999?text=${encodeURIComponent(p.name[0])}`
                      }
                      alt={p.name}
                      className="w-14 h-14 rounded-lg object-cover border border-neutral-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-sm text-neutral-900 truncate">
                          {p.name}
                        </p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditProduct(p)}
                            className="p-1 hover:bg-neutral-100 rounded cursor-pointer text-neutral-400 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirm({
                                label: `Hapus produk "${p.name}"?`,
                                onConfirm: () => handleDeleteProduct(p.id),
                              })
                            }
                            className="p-1 hover:bg-red-50 rounded cursor-pointer text-neutral-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-sm text-neutral-900 mr-auto">
                          {fmt(p.price)}
                        </span>
                        {p.is_recommended && (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                            ★ Rekomendasi
                          </span>
                        )}
                        <button
                          onClick={() =>
                            handleToggleAvailable(p.id, p.is_available)
                          }
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full cursor-pointer transition-all ${p.is_available ? "bg-brand/5 text-brand hover:bg-brand/10" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}
                        >
                          {p.is_available ? (
                            <><ToggleRight className="w-3.5 h-3.5" /> Tersedia</>
                          ) : (
                            <><ToggleLeft className="w-3.5 h-3.5" /> Habis</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── CATEGORIES TAB ── */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 bg-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </form>

            <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {categories.length === 0 ? (
                <div className="text-center py-10">
                  <Layers className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">Belum ada kategori</p>
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {editingCatId === cat.id ? (
                      <>
                        <input
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          autoFocus
                          className="flex-1 px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                        />
                        <button
                          onClick={() => handleUpdateCategory(cat.id)}
                          className="p-1.5 bg-brand/5 text-brand rounded-lg cursor-pointer hover:bg-brand/10"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="p-1.5 bg-neutral-100 text-neutral-500 rounded-lg cursor-pointer hover:bg-neutral-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-medium text-sm text-neutral-800">
                          {cat.name}
                        </span>
                        <button
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setEditCatName(cat.name);
                          }}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg cursor-pointer text-neutral-400 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirm({
                              label: `Hapus kategori "${cat.name}"?`,
                              onConfirm: () => handleDeleteCategory(cat.id),
                            })
                          }
                          className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer text-neutral-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── QR TAB ── */}
        {activeTab === "qr" && (
          <div className="max-w-sm mx-auto space-y-4">
            <form
              onSubmit={handleGenerateQR}
              className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4"
            >
              <h2 className="font-semibold text-sm text-neutral-900">
                Generate QR Code
              </h2>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Tipe Pesanan
                </label>
                <select
                  value={qrMode}
                  onChange={(e) => setQrMode(e.target.value as any)}
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                >
                  {outlet?.is_dine_in_enabled && (
                    <option value="dinein">Makan di Tempat (Dine-in)</option>
                  )}
                  {outlet?.is_takeaway_enabled && (
                    <option value="takeaway">Bawa Pulang (Takeaway)</option>
                  )}
                  {outlet?.is_delivery_enabled && (
                    <option value="delivery">Pesan Antar (Delivery)</option>
                  )}
                </select>
              </div>
              {qrMode === "dinein" && (
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Nomor Meja (1–{outlet?.table_count ?? 99})
                  </label>
                  <input
                    value={qrTable}
                    onChange={(e) => {
                      const val = e.target.value;
                      const max = outlet?.table_count ?? 99;
                      if (Number(val) > max) {
                        toast(`Nomor meja maksimal ${max}`, "error");
                        setQrTable(max.toString());
                      } else {
                        setQrTable(val);
                      }
                    }}
                    type="number"
                    min={1}
                    className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" /> Generate QR
              </button>
            </form>

            {qrImg && (
              <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col items-center gap-3">
                <img
                  src={qrImg}
                  alt="QR Code"
                  className="w-48 h-48 rounded-lg border border-neutral-100"
                />
                <p className="text-[10px] font-mono text-neutral-400 text-center break-all">
                  {qrUrl}
                </p>
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download QR Code
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && outlet && (
          <div className="max-w-lg mx-auto">
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4"
            >
              <h2 className="font-semibold text-sm text-neutral-900">
                Pengaturan Outlet
              </h2>

              {/* Logo */}
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex items-center justify-center flex-shrink-0">
                    {settingsLogoPreview ? (
                      <img
                        src={settingsLogoPreview}
                        alt="logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-xs font-medium text-brand bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition-all">
                      {uploadingLogo ? "Mengupload..." : "Ganti Logo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSettingsLogoChange}
                    />
                  </label>
                </div>
              </div>

              {[
                { label: "Nama Outlet", field: "name" as const, type: "text" },
                {
                  label: "Slug (URL ID)",
                  field: "slug" as const,
                  type: "text",
                },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={(outletForm as any)[field] ?? ""}
                    onChange={(e) =>
                      setOutletForm((p) => ({ ...p, [field]: e.target.value }))
                    }
                    className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Jumlah Meja
                </label>
                <input
                  type="number"
                  min={1}
                  value={outletForm.table_count ?? 1}
                  onChange={(e) =>
                    setOutletForm((p) => ({
                      ...p,
                      table_count: Number(e.target.value),
                    }))
                  }
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Warna Brand
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={outletForm.brand_color ?? "#f97316"}
                    onChange={(e) =>
                      setOutletForm((p) => ({
                        ...p,
                        brand_color: e.target.value,
                      }))
                    }
                    className="w-9 h-9 rounded border border-neutral-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={outletForm.brand_color ?? ""}
                    onChange={(e) =>
                      setOutletForm((p) => ({
                        ...p,
                        brand_color: e.target.value,
                      }))
                    }
                    className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Jam Buka
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={outletForm.open_time ?? "08:00:00"}
                    onChange={(e) =>
                      setOutletForm((p) => ({
                        ...p,
                        open_time: e.target.value,
                      }))
                    }
                    className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Jam Tutup
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={outletForm.close_time ?? "22:00:00"}
                    onChange={(e) =>
                      setOutletForm((p) => ({
                        ...p,
                        close_time: e.target.value,
                      }))
                    }
                    className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Mode Pemesanan
                </label>
                {(
                  [
                    "is_dine_in_enabled",
                    "is_takeaway_enabled",
                    "is_delivery_enabled",
                  ] as const
                ).map((field) => (
                  <label
                    key={field}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0 cursor-pointer"
                  >
                    <span className="text-sm text-neutral-700">
                      {field === "is_dine_in_enabled"
                        ? "Dine-in"
                        : field === "is_takeaway_enabled"
                          ? "Takeaway"
                          : "Delivery"}
                    </span>
                    <div
                      className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${outletForm[field] ? "bg-brand" : "bg-neutral-200"}`}
                      onClick={() =>
                        setOutletForm((p) => ({ ...p, [field]: !p[field] }))
                      }
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${outletForm[field] ? "left-5" : "left-0.5"}`}
                      />
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  URL Menu Pelanggan
                </p>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-600 truncate flex-1">
                    {window.location.origin}/{outlet.brand_code}/{outlet.slug}
                    /order
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${outlet.brand_code}/${outlet.slug}/order`,
                      );
                      toast("URL disalin", "success");
                    }}
                    className="text-[10px] font-semibold text-brand hover:underline cursor-pointer flex-shrink-0"
                  >
                    Salin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Pengaturan"
                )}
              </button>
            </form>
          </div>
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
