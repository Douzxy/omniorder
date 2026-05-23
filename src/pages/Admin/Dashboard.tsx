import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  LogOut, Plus, QrCode, Settings, Trash2, Edit2, Check, X,
  TrendingUp, CircleDollarSign, ClipboardList, Store, Search,
  Sliders, ChevronDown, Loader2, Building2, ArrowLeft,
  RefreshCw, Users, ShieldCheck, UserPlus, Eye, EyeOff,
  ToggleLeft, ToggleRight, Package, Layers, Copy, ExternalLink
} from "lucide-react";
import Logo from "@/components/Logo";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Outlet {
  id: string; name: string; slug: string; brand_code: string;
  logo_url: string; brand_color: string; table_count: number;
  is_dine_in_enabled: boolean; is_takeaway_enabled: boolean; is_delivery_enabled: boolean;
}
interface Category { id: string; outlet_id: string; name: string; }
interface Product {
  id: string; outlet_id: string; category_id: string | null;
  name: string; price: number; description: string;
  image_url: string; is_recommended: boolean; is_available: boolean;
}
interface Order {
  id: string; outlet_id: string; order_type: string; table_number: string | null;
  customer_name: string; customer_phone: string; status: string;
  payment_method: string; payment_status: string; total_amount: number; created_at: string;
  customer_email?: string; send_receipt?: boolean;
}
interface Profile { id: string; outlet_id: string | null; role: string; brand_code?: string; }
interface UserRecord { id: string; email: string; profile: Profile | null; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: "Menunggu",  color: "bg-zinc-100 text-zinc-600" },
  preparing: { label: "Diproses", color: "bg-zinc-100 text-zinc-700" },
  completed: { label: "Selesai",  color: "bg-zinc-100 text-zinc-700" },
  cancelled: { label: "Batal",    color: "bg-zinc-100 text-zinc-700" },
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = profile?.role === "super_admin";

  // ── Navigation state
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");
  const activeTab = (searchParams.get("tab") as any) || "orders";
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { prev.set("tab", tab); return prev; }, { replace: true });
  };

  // ── Data state
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // ── Filters
  const [menuSearch, setMenuSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");

  // ── Product modal
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({ name: "", price: 0, description: "", image_url: "", category_id: "", is_recommended: false, is_available: true });

  // ── Category inline edit
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newModalCatName, setNewModalCatName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // ── Outlet modal
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [outletForm, setOutletForm] = useState({ name: "", slug: "", logo_url: "", brand_color: "#f97316", brand_code: "APP", table_count: 10, is_dine_in_enabled: true, is_takeaway_enabled: true, is_delivery_enabled: true });

  // ── QR
  const [qrMode, setQrMode] = useState<"dinein" | "takeaway" | "delivery">("dinein");
  const [qrTable, setQrTable] = useState("1");
  const [qrUrl, setQrUrl] = useState("");
  const [qrImg, setQrImg] = useState("");

  // ── User management modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", outlet_id: "", role: "manager" });
  const [showUserPass, setShowUserPass] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");

  const activeOutlet = outlets.find((o) => o.id === selectedOutletId) ?? null;

  // ─── On mount: decide which outlet to load ──────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    fetchOutlets();
  }, [profile]);

  useEffect(() => {
    if (!selectedOutletId) return;
    loadOutletData(selectedOutletId);
    setQrImg("");
  }, [selectedOutletId]);

  // ─── Real-time orders subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedOutletId) return;
    const channel = supabase
      .channel(`orders-${selectedOutletId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `outlet_id=eq.${selectedOutletId}` },
        (payload) => setOrders((prev) => [payload.new as Order, ...prev])
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `outlet_id=eq.${selectedOutletId}` },
        (payload) => setOrders((prev) => prev.map((o) => o.id === payload.new.id ? payload.new as Order : o))
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedOutletId]);

  // Real-time catalog updates for admin dashboard (products, categories)
  useEffect(() => {
    if (!selectedOutletId) return;
    const catalogCh = supabase
      .channel(`catalog-updates-admin-${selectedOutletId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `outlet_id=eq.${selectedOutletId}` },
        () => loadOutletData(selectedOutletId)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `outlet_id=eq.${selectedOutletId}` },
        () => loadOutletData(selectedOutletId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(catalogCh);
    };
  }, [selectedOutletId]);

  // ─── Fetch Outlets ───────────────────────────────────────────────────────────
  const fetchOutlets = useCallback(async () => {
    setLoadingData(true);
    try {
      let query = supabase.from("outlets").select("*").order("name");
      // Managers only see their own outlet, Admins see their brand
      if (!isSuperAdmin && profile) {
        if (profile.role === "brand_admin" && profile.brand_code) {
          query = supabase.from("outlets").select("*").eq("brand_code", profile.brand_code).order("name");
        } else if (profile.outlet_id) {
          query = supabase.from("outlets").select("*").eq("id", profile.outlet_id);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      const list = data ?? [];
      setOutlets(list);
      // Auto-select outlet for manager
      if (!isSuperAdmin && list.length === 1) {
        setSelectedOutletId(list[0].id);
      }
    } catch (e) {
      toast("Gagal memuat outlet: " + String(e), "error");
    } finally {
      setLoadingData(false);
    }
  }, [isSuperAdmin, profile]);

  // ─── Load outlet-specific data ───────────────────────────────────────────────
  const loadOutletData = async (outletId: string) => {
    setLoadingData(true);
    try {
      const [{ data: cats }, { data: prods }, { data: ords }] = await Promise.all([
        supabase.from("categories").select("*").eq("outlet_id", outletId).order("name"),
        supabase.from("products").select("*").eq("outlet_id", outletId).order("name"),
        supabase.from("orders").select("*").eq("outlet_id", outletId).order("created_at", { ascending: false }).limit(200),
      ]);
      setCategories(cats ?? []);
      setProducts(prods ?? []);
      setOrders(ords ?? []);
    } catch (e) {
      toast("Gagal memuat data outlet: " + String(e), "error");
    } finally {
      setLoadingData(false);
    }
  };

  // ─── Fetch users (super_admin only) ─────────────────────────────────────────
  const fetchUsers = async () => {
    setLoadingData(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, outlet_id, role");
      if (error) throw error;

      // Get auth user emails via admin API isn't possible with anon key
      // We join with a view or use the email stored in metadata
      // Use supabase admin users listing via Edge Function or use emails from identities
      const { data: identities } = await supabase.rpc("get_users_with_email");

      const list: UserRecord[] = (identities ?? []).map((u: any) => ({
        id: u.id,
        email: u.email,
        profile: profiles?.find((p) => p.id === u.id) ?? null,
      }));
      setUsers(list);
    } catch (e) {
      toast("Gagal memuat daftar pengguna", "error");
      // Fallback: just show profiles with IDs
      const { data: profiles } = await supabase.from("profiles").select("id, outlet_id, role");
      setUsers((profiles ?? []).map((p) => ({ id: p.id, email: `${p.id.slice(0, 8)}...`, profile: p })));
    } finally {
      setLoadingData(false);
    }
  };

  // ─── Orders ─────────────────────────────────────────────────────────────────
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  const handleConfirmCashPaid = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    await supabase.from("orders").update({ payment_status: "paid", status: "preparing" }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, payment_status: "paid", status: "preparing" } : o));

    if (order && order.send_receipt && order.customer_email) {
      supabase.functions.invoke("send-order-email", {
        body: { orderId },
      }).catch((err) => console.error("Email send failed:", err));
    }
  };

  // ─── Categories ─────────────────────────────────────────────────────────────
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const { data, error } = await supabase.from("categories").insert({ outlet_id: selectedOutletId, name: newCatName.trim() }).select().single();
    if (!error && data) { setCategories((p) => [...p, data]); setNewCatName(""); }
  };

  const handleUpdateCategory = async (catId: string) => {
    if (!editCatName.trim()) return;
    await supabase.from("categories").update({ name: editCatName.trim() }).eq("id", catId);
    setCategories((p) => p.map((c) => c.id === catId ? { ...c, name: editCatName.trim() } : c));
    setEditingCatId(null);
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Hapus kategori ini?")) return;
    await supabase.from("categories").delete().eq("id", catId);
    setCategories((p) => p.filter((c) => c.id !== catId));
    setProducts((p) => p.map((pr) => pr.category_id === catId ? { ...pr, category_id: null } : pr));
  };

  // ─── Products ────────────────────────────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProduct(null);
    setProdForm({ name: "", price: 0, description: "", image_url: "", category_id: categories[0]?.id ?? "", is_recommended: false, is_available: true });
    setIsProdModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdForm({ name: p.name, price: p.price, description: p.description ?? "", image_url: p.image_url ?? "", category_id: p.category_id ?? "", is_recommended: p.is_recommended, is_available: p.is_available });
    setIsProdModalOpen(true);
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingOutletLogo, setIsUploadingOutletLogo] = useState(false);

  const handleOutletLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingOutletLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `outlet-logos/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      setOutletForm((p) => ({ ...p, logo_url: data.publicUrl }));
    } catch (err: any) {
      alert("Gagal mengupload logo: " + err.message);
    } finally {
      setIsUploadingOutletLogo(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${selectedOutletId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setProdForm((p) => ({ ...p, image_url: data.publicUrl }));
    } catch (err: any) {
      alert("Gagal mengupload gambar: " + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...prodForm, outlet_id: selectedOutletId, price: Number(prodForm.price), category_id: prodForm.category_id || null };
    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (!error) { setProducts((p) => p.map((pr) => pr.id === editingProduct.id ? { ...pr, ...payload } : pr)); }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (!error && data) { setProducts((p) => [...p, data]); }
    }
    setIsProdModalOpen(false);
  };

  const handleToggleAvailable = async (productId: string, current: boolean) => {
    await supabase.from("products").update({ is_available: !current }).eq("id", productId);
    setProducts((p) => p.map((pr) => pr.id === productId ? { ...pr, is_available: !current } : pr));
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", productId);
    setProducts((p) => p.filter((pr) => pr.id !== productId));
  };

  // ─── Outlets ─────────────────────────────────────────────────────────────────
  const openAddOutlet = () => {
    setEditingOutlet(null);
    setOutletForm({ name: "", slug: "", logo_url: "", brand_color: "#f97316", brand_code: "APP", table_count: 10, is_dine_in_enabled: true, is_takeaway_enabled: true, is_delivery_enabled: true });
    setIsOutletModalOpen(true);
  };

  const openEditOutlet = (o: Outlet) => {
    setEditingOutlet(o);
    setOutletForm({ name: o.name, slug: o.slug, logo_url: o.logo_url ?? "", brand_color: o.brand_color, brand_code: o.brand_code, table_count: o.table_count, is_dine_in_enabled: o.is_dine_in_enabled, is_takeaway_enabled: o.is_takeaway_enabled, is_delivery_enabled: o.is_delivery_enabled });
    setIsOutletModalOpen(true);
  };

  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...outletForm, slug: outletForm.slug.toLowerCase().replace(/[^a-z0-9-_]/g, ""), table_count: Number(outletForm.table_count) };
    if (editingOutlet) {
      const { error } = await supabase.from("outlets").update(payload).eq("id", editingOutlet.id);
      if (error) { alert(error.message); return; }
      setOutlets((p) => p.map((o) => o.id === editingOutlet.id ? { ...o, ...payload } : o));
    } else {
      const { data, error } = await supabase.from("outlets").insert(payload).select().single();
      if (error) { alert(error.message); return; }
      setOutlets((p) => [...p, data]);
      setSelectedOutletId(data.id);
    }
    setIsOutletModalOpen(false);
    fetchOutlets();
  };

  const handleDeleteOutlet = async (outletId: string) => {
    if (!confirm("Hapus outlet ini? Semua data akan ikut terhapus.")) return;
    await supabase.from("outlets").delete().eq("id", outletId);
    setOutlets((p) => p.filter((o) => o.id !== outletId));
    setSelectedOutletId("");
  };

  // ─── QR ─────────────────────────────────────────────────────────────────────
  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOutlet) return;

    if (qrMode === "dinein" && qrTable) {
      const tableNum = Number(qrTable);
      const maxTable = activeOutlet.table_count || 99;
      if (tableNum > maxTable || tableNum < 1) {
        alert(`Nomor meja maksimal ${maxTable}`);
        return;
      }
    }

    const origin = window.location.origin;
    let url = `${origin}/${activeOutlet.brand_code.toLowerCase()}/${activeOutlet.slug}/order?mode=${qrMode}`;
    if (qrMode === "dinein" && qrTable) url += `&tableNumber=${qrTable}`;
    setQrUrl(url);
    setQrImg(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`);
  };

  // ─── User Management ─────────────────────────────────────────────────────────
  const openAddUser = () => {
    setUserForm({ email: "", password: "", outlet_id: selectedOutletId || (outlets[0]?.id ?? ""), role: "manager" });
    setUserError("");
    setShowUserPass(false);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSaving(true);
    setUserError("");
    try {
      // Create user via Supabase Admin using the Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email: userForm.email, password: userForm.password, outlet_id: userForm.outlet_id, role: userForm.role }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat akun");
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error("Gagal menghapus pengguna");
      setUsers((p) => p.filter((u) => u.id !== userId));
      toast("Akun berhasil dihapus", "success");
    } catch (err: any) {
      toast(err.message || "Gagal menghapus pengguna", "error");
    }
  };

  // ─── Computed Values ─────────────────────────────────────────────────────────
  const totalRevenue = orders.filter((o) => o.payment_status === "paid" && o.status !== "cancelled").reduce((s, o) => s + o.total_amount, 0);
  const pendingCash = orders.filter((o) => o.payment_method === "cash" && o.payment_status === "pending").length;
  const filteredProducts = products
    .filter((p) => !menuSearch || p.name.toLowerCase().includes(menuSearch.toLowerCase()))
    .sort((a, b) => (a.is_available === b.is_available ? 0 : a.is_available ? -1 : 1));
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "unpaid") return o.payment_status === "pending" && o.payment_method === "cash";
    return o.status === orderFilter;
  });

  const brandColor = activeOutlet?.brand_color ?? "#f97316";
  const brandColorHover = `${brandColor}d5`;
  const brandLight = `${brandColor}15`;

  // ─── STEP 1: Outlet Selection (super_admin only) ─────────────────────────────
  if (isSuperAdmin && !selectedOutletId) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200/70 px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[11px] font-black text-zinc-700 uppercase tracking-wider">Super Admin</span>
            </div>
            <button onClick={signOut} className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-500 cursor-pointer transition-all" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-neutral-850">Semua Outlet</h1>
              <p className="text-xs text-neutral-500 mt-1">Pilih outlet untuk membuka workspace manajemen.</p>
            </div>
            <button onClick={openAddOutlet} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" /> Tambah Outlet
            </button>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : outlets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200/60">
              <Store className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-500">Belum ada outlet terdaftar</p>
              <button onClick={openAddOutlet} className="mt-4 text-xs font-bold text-zinc-900 hover:underline cursor-pointer">+ Tambah outlet pertama</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {outlets.map((outlet) => (
                <button
                  key={outlet.id}
                  onClick={() => setSelectedOutletId(outlet.id)}
                  className="group bg-white border border-neutral-200/70 rounded-3xl p-5 text-left hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-8 rounded-lg overflow-hidden border border-neutral-100 flex-shrink-0 bg-neutral-50">
                      <img src={outlet.logo_url} alt={outlet.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-neutral-800 truncate group-hover:text-zinc-900 transition-colors">{outlet.name}</h3>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{outlet.brand_code} · {outlet.slug}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider pt-3 border-t border-neutral-100">
                    <span>{outlet.table_count} Meja</span>
                    <div className="flex gap-1">
                      {outlet.is_dine_in_enabled && <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">Dine-in</span>}
                      {outlet.is_takeaway_enabled && <span className="bg-zinc-100 text-zinc-900 px-1.5 py-0.5 rounded-full">Takeaway</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP 2: Main Workspace Dashboard ────────────────────────────────────────
  const TABS = [
    { key: "orders", label: "Pesanan", icon: ClipboardList },
    { key: "menu", label: "Menu", icon: Package },
    { key: "categories", label: "Kategori", icon: Layers },
    { key: "qr", label: "QR Code", icon: QrCode },
    { key: "settings", label: "Outlet", icon: Settings },
    ...(isSuperAdmin ? [{ key: "users", label: "Akun", icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans" style={{
"--color-brand": brandColor,
"--color-brand-hover": brandColorHover,
"--color-brand-light": brandLight,
} as React.CSSProperties}>
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-neutral-200/70 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button onClick={() => setSelectedOutletId("")} className="p-1.5 hover:bg-neutral-100 rounded-xl cursor-pointer text-neutral-500 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Logo size="sm" />
          {activeOutlet && (
            <div className="hidden sm:flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: brandColor }} />
              <span className="text-xs font-extrabold text-neutral-700">{activeOutlet.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <span className="hidden sm:flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3 text-zinc-600" />
              <span className="text-[10px] font-black text-zinc-700 uppercase">Super Admin</span>
            </span>
          )}
          <button onClick={() => loadOutletData(selectedOutletId)} className="p-2 hover:bg-neutral-100 rounded-xl cursor-pointer text-neutral-500 transition-all" title="Refresh data">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={signOut} className="p-2 hover:bg-red-50 rounded-xl cursor-pointer text-neutral-500 hover:text-red-500 transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200/70 px-4 overflow-x-auto">
        <div className="flex gap-1 max-w-5xl mx-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key as any);
                if (key === "users") fetchUsers();
              }}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === key
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-5">

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Pendapatan", value: fmt(totalRevenue), icon: CircleDollarSign, color: "text-green-600 bg-green-50" },
                { label: "Total Pesanan", value: orders.length, icon: ClipboardList, color: "text-zinc-900 bg-zinc-100" },
                { label: "Menunggu Bayar Tunai", value: pendingCash, icon: TrendingUp, color: "text-yellow-600 bg-yellow-50" },
                { label: "Selesai Hari Ini", value: orders.filter((o) => o.status === "completed").length, icon: Check, color: "text-zinc-600 bg-emerald-50" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-neutral-200/60 p-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${color}`}><Icon className="w-4 h-4" /></div>
                  <div className="text-lg font-black text-neutral-850">{value}</div>
                  <div className="text-[10px] text-neutral-400 font-bold mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[["all","Semua"],["pending","Menunggu"],["preparing","Diproses"],["completed","Selesai"],["cancelled","Batal"],["unpaid","Tagih Tunai"]].map(([v, l]) => (
                <button key={v} onClick={() => setOrderFilter(v)} className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${orderFilter === v ? "bg-zinc-900 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>{l}</button>
              ))}
            </div>

            {/* Orders List */}
            <div className="space-y-3">
              {loadingData ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-neutral-200/60 animate-pulse" />)
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200/60">
                  <ClipboardList className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-500">Tidak ada pesanan</p>
                </div>
              ) : filteredOrders.map((order) => {
                const st = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-neutral-100 text-neutral-600" };
                return (
                  <div key={order.id} className="bg-white border border-neutral-200/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-neutral-850">{order.customer_name || "Tamu"}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                          {order.payment_method === "cash" && order.payment_status === "pending" && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Tagih Tunai</span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-0.5 font-medium">
                          {order.order_type === "dinein" ? `Meja ${order.table_number}` : order.order_type === "takeaway" ? "Takeaway" : "Delivery"} · {fmtDate(order.created_at)}
                        </p>
                      </div>
                      <span className="font-black text-sm text-neutral-800">{fmt(order.total_amount)}</span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {order.payment_method === "cash" && order.payment_status === "pending" && (
                        <button onClick={() => handleConfirmCashPaid(order.id)} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 cursor-pointer transition-all">
                          Konfirmasi Bayar Tunai
                        </button>
                      )}
                      {order.status === "pending" && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, "preparing")} className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 cursor-pointer transition-all">
                          Mulai Proses
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, "completed")} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer transition-all">
                          Selesai
                        </button>
                      )}
                      {(order.status === "pending" || order.status === "preparing") && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, "cancelled")} className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-600 cursor-pointer transition-all">
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── MENU TAB ── */}
        {activeTab === "menu" && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="Cari produk..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
              </div>
              <button onClick={openAddProduct} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 cursor-pointer transition-all shadow-sm">
                <Plus className="w-4 h-4" /> Tambah Produk
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loadingData ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-neutral-200/60 animate-pulse" />)
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center py-16 bg-white rounded-3xl border border-neutral-200/60">
                  <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-500">Belum ada produk</p>
                </div>
              ) : filteredProducts.map((p) => (
                <div key={p.id} className={`bg-white border rounded-2xl p-4 flex gap-3 transition-all ${!p.is_available ? "opacity-60" : "border-neutral-200/60"}`}>
                  <img src={p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"} alt={p.name} className="w-16 h-16 rounded-xl object-cover border border-neutral-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-neutral-850 truncate">{p.name}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEditProduct(p)} className="p-1.5 hover:bg-neutral-100 rounded-lg cursor-pointer text-neutral-500 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer text-neutral-500 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{p.description?.slice(0, 60)}{p.description?.length > 60 ? "..." : ""}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-sm text-neutral-850">{fmt(p.price)}</span>
                      <button onClick={() => handleToggleAvailable(p.id, p.is_available)} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer transition-all ${p.is_available ? "bg-green-50 text-zinc-700 hover:bg-zinc-100" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>
                        {p.is_available ? <><ToggleRight className="w-3.5 h-3.5" /> Tersedia</> : <><ToggleLeft className="w-3.5 h-3.5" /> Habis</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── CATEGORIES TAB ── */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nama kategori baru..." className="flex-1 py-2.5 px-4 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
              <button type="submit" className="px-4 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 cursor-pointer transition-all flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </form>

            <div className="space-y-2">
              {categories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-neutral-200/60">
                  <Layers className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-500">Belum ada kategori</p>
                </div>
              ) : categories.map((cat) => (
                <div key={cat.id} className="bg-white border border-neutral-200/60 rounded-xl px-4 py-3 flex items-center gap-3">
                  {editingCatId === cat.id ? (
                    <>
                      <input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} autoFocus className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
                      <button onClick={() => handleUpdateCategory(cat.id)} className="p-1.5 bg-green-50 text-green-600 rounded-lg cursor-pointer hover:bg-zinc-100"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingCatId(null)} className="p-1.5 bg-neutral-50 text-neutral-500 rounded-lg cursor-pointer hover:bg-neutral-100"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-bold text-sm text-neutral-800">{cat.name}</span>
                      <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }} className="p-1.5 hover:bg-neutral-100 rounded-lg cursor-pointer text-neutral-500 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer text-neutral-500 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── QR TAB ── */}
        {activeTab === "qr" && (
          <div className="max-w-md mx-auto space-y-5">
            <form onSubmit={handleGenerateQR} className="bg-white border border-neutral-200/60 rounded-3xl p-6 space-y-4">
              <h2 className="font-extrabold text-neutral-850 text-sm">Generate QR Code</h2>
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">Tipe Pesanan</label>
                <select value={qrMode} onChange={(e) => setQrMode(e.target.value as any)} className="w-full py-2.5 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none">
                  {activeOutlet?.is_dine_in_enabled && <option value="dinein">Makan di Tempat (Dine-in)</option>}
                  {activeOutlet?.is_takeaway_enabled && <option value="takeaway">Bawa Pulang (Takeaway)</option>}
                  {activeOutlet?.is_delivery_enabled && <option value="delivery">Pesan Antar (Delivery)</option>}
                </select>
              </div>
              {qrMode === "dinein" && (
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">Nomor Meja</label>
                  <input value={qrTable} onChange={(e) => {
                      const val = e.target.value;
                      const max = activeOutlet?.table_count ?? 99;
                      if (Number(val) > max) {
                        alert(`Nomor meja maksimal ${max}`);
                        setQrTable(max.toString());
                      } else {
                        setQrTable(val);
                      }
                    }} type="number" min={1} className="w-full py-2.5 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none" />
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 cursor-pointer transition-all flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" /> Generate QR
              </button>
            </form>

            {qrImg && (
              <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 flex flex-col items-center gap-4">
                <img src={qrImg} alt="QR Code" className="w-48 h-48 rounded-xl border border-neutral-100" />
                <p className="text-[10px] text-neutral-400 font-mono text-center break-all">{qrUrl}</p>
                <a href={qrImg} download={`qr-${activeOutlet?.slug}-${qrMode}.png`} className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer transition-all">
                  Unduh QR Code
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && activeOutlet && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-neutral-850 text-sm">Pengaturan Outlet</h2>
                <div className="flex gap-2">
                  <button onClick={() => openEditOutlet(activeOutlet)} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 text-zinc-900 text-xs font-bold rounded-xl hover:bg-zinc-100 cursor-pointer transition-all">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {isSuperAdmin && (
                    <button onClick={() => handleDeleteOutlet(activeOutlet.id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-zinc-100 cursor-pointer transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {[
                  ["Nama Outlet", activeOutlet.name],
                  ["Slug / ID URL", activeOutlet.slug],
                  ["Kode Brand", activeOutlet.brand_code],
                  ["Jumlah Meja", activeOutlet.table_count],
                  ["Warna Brand", activeOutlet.brand_color],
                  ["Dine-in", activeOutlet.is_dine_in_enabled ? "Aktif" : "Nonaktif"],
                  ["Takeaway", activeOutlet.is_takeaway_enabled ? "Aktif" : "Nonaktif"],
                  ["Delivery", activeOutlet.is_delivery_enabled ? "Aktif" : "Nonaktif"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">{k}</span>
                    <span className="font-bold text-neutral-850 text-xs">{String(v)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-neutral-850 mb-2">Takeaway URL</h3>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-neutral-300 transition-all">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-mono text-neutral-600 truncate">
                        {window.location.origin}/{activeOutlet.brand_code.toLowerCase()}/{activeOutlet.slug}/order
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/${activeOutlet.brand_code.toLowerCase()}/${activeOutlet.slug}/order`
                          );
                          toast("URL Takeaway disalin", "success");
                        }}
                        className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-brand hover:border-brand/35 hover:bg-brand/5 transition-all cursor-pointer border-solid"
                        title="Salin URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`${window.location.origin}/${activeOutlet.brand_code.toLowerCase()}/${activeOutlet.slug}/order`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-brand hover:border-brand/35 hover:bg-brand/5 transition-all border-solid"
                        title="Buka Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-neutral-850">Dine-In URLs</h3>
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-semibold">
                      {activeOutlet.table_count ?? 0} Meja
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mb-2">
                    Daftar tautan untuk masing-masing nomor meja. Pelanggan yang memindai tautan ini akan langsung diarahkan ke menu pemesanan meja terkait.
                  </p>

                  <div className="bg-neutral-50/50 border border-neutral-200/80 rounded-xl divide-y divide-neutral-150/70 max-h-60 overflow-y-auto custom-scrollbar">
                    {Array.from({ length: activeOutlet.table_count ?? 0 }).map((_, idx) => {
                      const tableNum = idx + 1;
                      const tableUrl = `${window.location.origin}/${activeOutlet.brand_code.toLowerCase()}/${activeOutlet.slug}/order?mode=dinein&tableNumber=${tableNum}`;
                      return (
                        <div key={tableNum} className="flex items-center justify-between p-3 gap-3 hover:bg-neutral-50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-neutral-700">Meja ${tableNum}</p>
                            <p className="text-[10px] font-mono text-neutral-450 truncate mt-0.5">
                              ${tableUrl}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(tableUrl);
                                toast(`URL Meja ${tableNum} disalin`, "success");
                              }}
                              className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-brand hover:border-brand/35 hover:bg-brand/5 transition-all cursor-pointer border-solid"
                              title={`Salin URL Meja ${tableNum}`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toast("Fitur QR Code generator segera hadir!", "info")}
                              className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-400 hover:text-brand hover:border-brand/35 hover:bg-brand/5 transition-all cursor-pointer border-solid"
                              title="Generate QR (Segera)"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(activeOutlet.table_count ?? 0) === 0 && (
                      <div className="p-4 text-center text-xs text-neutral-450">
                        Belum ada meja dikonfigurasi. Edit outlet untuk menambah meja.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB (super_admin only) ── */}
        {activeTab === "users" && isSuperAdmin && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-neutral-850 text-base">Manajemen Akun</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Kelola akun manager untuk setiap outlet.</p>
              </div>
              <button onClick={openAddUser} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 cursor-pointer transition-all shadow-sm">
                <UserPlus className="w-4 h-4" /> Tambah Manager
              </button>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
            ) : (
              <div className="space-y-3">
                {users.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200/60">
                    <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-neutral-500">Belum ada akun terdaftar</p>
                  </div>
                ) : users.map((u) => {
                  const outletName = outlets.find((o) => o.id === u.profile?.outlet_id)?.name ?? "—";
                  return (
                    <div key={u.id} className="bg-white border border-neutral-200/60 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${u.profile?.role === "super_admin" ? "bg-purple-100 text-zinc-700" : "bg-zinc-100 text-zinc-700"}`}>
                          {u.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-neutral-850">{u.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${u.profile?.role === "super_admin" ? "bg-purple-100 text-zinc-700" : "bg-zinc-100 text-zinc-700"}`}>
                              {u.profile?.role ?? "no profile"}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">{outletName}</span>
                          </div>
                        </div>
                      </div>
                      {u.id !== user?.id && u.profile?.role !== "super_admin" && (
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-red-50 rounded-xl cursor-pointer text-neutral-400 hover:text-red-500 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── PRODUCT MODAL ── */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-neutral-850">{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</h3>
              <button onClick={() => setIsProdModalOpen(false)} className="p-1.5 hover:bg-neutral-100 rounded-xl cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              {[
                { label: "Nama Produk", field: "name", type: "text", placeholder: "Nama menu..." },
                { label: "Harga (Rp)", field: "price", type: "number", placeholder: "15000" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">{label}</label>
                  <input type={type} required={field === "name"} value={(prodForm as any)[field]} onChange={(e) => setProdForm((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder} className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
                </div>
              ))}
              
              {/* Custom Image Upload Field */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">URL Gambar</label>
                  <input type="url" value={prodForm.image_url} onChange={(e) => setProdForm((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://..." className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
                </div>
                <div className="relative flex-shrink-0">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploadingImage} />
                  <button type="button" disabled={isUploadingImage} className="px-4 py-2.5 bg-neutral-100 text-neutral-600 border border-neutral-200 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer transition-all whitespace-nowrap">
                    {isUploadingImage ? "Mengupload..." : "Upload File"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Deskripsi</label>
                <textarea value={prodForm.description} onChange={(e) => setProdForm((p) => ({ ...p, description: e.target.value }))} rows={3}
                  placeholder="Deskripsi singkat produk..." className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Kategori</label>
                <div className="flex gap-2">
                  <select value={prodForm.category_id} onChange={(e) => setProdForm((p) => ({ ...p, category_id: e.target.value }))} className="flex-1 py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none font-medium bg-white cursor-pointer">
                    <option value="">— Tanpa Kategori —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryModalOpen(true)}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 border border-neutral-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={prodForm.is_recommended} onChange={(e) => setProdForm((p) => ({ ...p, is_recommended: e.target.checked }))} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  <span className="text-xs font-bold text-neutral-700">Rekomendasi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={prodForm.is_available} onChange={(e) => setProdForm((p) => ({ ...p, is_available: e.target.checked }))} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  <span className="text-xs font-bold text-neutral-700">Tersedia</span>
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsProdModalOpen(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-200 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-zinc-800 transition-all">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── OUTLET MODAL ── */}
      {isOutletModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-neutral-850">{editingOutlet ? "Edit Outlet" : "Tambah Outlet Baru"}</h3>
              <button onClick={() => setIsOutletModalOpen(false)} className="p-1.5 hover:bg-neutral-100 rounded-xl cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            <form onSubmit={handleSaveOutlet} className="space-y-3">
              {[
                { label: "Nama Outlet", field: "name", type: "text", placeholder: "Mie Gacoan Depok" },
                { label: "Slug (URL ID)", field: "slug", type: "text", placeholder: "gacoan-depok" },
                { label: "Kode Brand", field: "brand_code", type: "text", placeholder: "APP" },
                { label: "Warna Brand (hex)", field: "brand_color", type: "color" },
                { label: "Jumlah Meja", field: "table_count", type: "number", placeholder: "10" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">{label}</label>
                  <input type={type} required={["name","slug"].includes(field)} value={(outletForm as any)[field]} onChange={(e) => setOutletForm((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder} className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
                </div>
              ))}
              {/* Logo with upload + URL */}
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Logo</label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex items-center justify-center flex-shrink-0">
                    {outletForm.logo_url ? (
                      <img src={outletForm.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>
                  <label className="cursor-pointer flex-shrink-0 h-[38px] flex items-center">
                    <span className={`text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-100 text-brand hover:bg-neutral-200 transition-all whitespace-nowrap ${isUploadingOutletLogo ? "opacity-50" : ""}`}>
                      {isUploadingOutletLogo ? "Upload..." : "Upload"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleOutletLogoUpload} disabled={isUploadingOutletLogo} />
                  </label>
                </div>
                <input type="text" value={outletForm.logo_url} onChange={(e) => setOutletForm((p) => ({ ...p, logo_url: e.target.value }))}
                  placeholder="Atau masukkan URL logo..." className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
              </div>
              <div className="flex gap-4">
                {[["is_dine_in_enabled", "Dine-in"], ["is_takeaway_enabled", "Takeaway"], ["is_delivery_enabled", "Delivery"]].map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(outletForm as any)[field]} onChange={(e) => setOutletForm((p) => ({ ...p, [field]: e.target.checked }))} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    <span className="text-xs font-bold text-neutral-700">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsOutletModalOpen(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-200 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-zinc-800 transition-all">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD USER MODAL ── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-neutral-850">Tambah Akun Manager</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1.5 hover:bg-neutral-100 rounded-xl cursor-pointer"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>

            {userError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-xl font-medium">{userError}</div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} placeholder="manager@outlet.com" className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <input type={showUserPass ? "text" : "password"} required minLength={6} value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min. 6 karakter" className="w-full py-2.5 pl-3.5 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium" />
                  <button type="button" onClick={() => setShowUserPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 cursor-pointer">
                    {showUserPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Outlet</label>
                <select value={userForm.outlet_id} onChange={(e) => setUserForm((p) => ({ ...p, outlet_id: e.target.value }))} required className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none font-medium">
                  <option value="">— Pilih Outlet —</option>
                  {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Role</label>
                <select value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))} className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none font-medium">
                  <option value="manager">Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-200 transition-all">Batal</button>
                <button type="submit" disabled={userSaving} className="flex-1 py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {userSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Membuat...</> : <><UserPlus className="w-3.5 h-3.5" /> Buat Akun</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD CATEGORY MODAL ── */}
      {isAddCategoryModalOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAddCategoryModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h3 className="font-extrabold text-sm text-neutral-850">Tambah Kategori Baru</h3>
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl cursor-pointer transition-all"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newModalCatName.trim() || !selectedOutletId) return;
                setIsAddingCategory(true);
                const nextSortOrder = categories.length;
                const { data, error } = await supabase
                  .from("categories")
                  .insert({
                    outlet_id: selectedOutletId,
                    name: newModalCatName.trim(),
                    sort_order: nextSortOrder,
                  })
                  .select()
                  .single();
                setIsAddingCategory(false);
                if (error) {
                  toast("Gagal menambahkan kategori: " + error.message, "error");
                  return;
                }
                if (data) {
                  setCategories((p) => [...p, data]);
                  setProdForm((p) => ({ ...p, category_id: data.id }));
                  setNewModalCatName("");
                  setIsAddCategoryModalOpen(false);
                  toast("Kategori ditambahkan", "success");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={newModalCatName}
                  onChange={(e) => setNewModalCatName(e.target.value)}
                  placeholder="Contoh: Makanan Utama, Minuman..."
                  className="w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium bg-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAddingCategory}
                  className="flex-1 py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isAddingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

