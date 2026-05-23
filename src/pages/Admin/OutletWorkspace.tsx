import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useAuditLog } from "@/hooks/useAuditLog";
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
  Plus,
  QrCode,
  RefreshCw,
  Settings,
  ShieldCheck,
  Activity,
  X,
} from "lucide-react";

import ModifiersManager from "./ModifiersManager";
import WorkspaceOrdersTab from "./WorkspaceOrdersTab";
import WorkspaceReportsTab from "./WorkspaceReportsTab";
import WorkspaceMenuTab from "./WorkspaceMenuTab";
import WorkspaceCategoriesTab from "./WorkspaceCategoriesTab";
import WorkspaceQRTab from "./WorkspaceQRTab";
import WorkspaceSettingsTab from "./WorkspaceSettingsTab";
import WorkspaceAuditLogsTab from "./WorkspaceAuditLogsTab";

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
  sort_order?: number;
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
  stock?: number;
  sku?: string | null;
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
  tax_amount?: number;
  created_at: string;
  delivery_address?: string | null;
  delivery_note?: string | null;
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
  { key: "audit_logs", label: "Audit Log", icon: ShieldCheck },
];


export default function OutletWorkspace() {
  const { outletId } = useParams<{ outletId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { log } = useAuditLog();

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
    stock: "0",
    sku: "",
  });
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [managingModifiersFor, setManagingModifiersFor] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [isCreatingCategoryInline, setIsCreatingCategoryInline] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // ── Clock
  // ── Confirm
  const [confirm, setConfirm] = useState<{
    label: string;
    onConfirm: () => void;
  } | null>(null);

  // ─── Fetch data ───
  const fetchWorkspace = useCallback(async () => {
    if (!outletId) return [];
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
            .order("sort_order", { ascending: true })
            .order("name"),
          supabase
            .from("products")
            .select("*")
            .eq("outlet_id", outletId)
            .order("sort_order", { ascending: true })
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
      return orderList;
    } catch (err) {
      toast("Gagal memuat data: " + String(err), "error");
      return [];
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
    const order = orders.find((o) => o.id === orderId);
    const oldData = order ? { ...order } : null;
    
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
    if (selectedOrder?.id === orderId)
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    toast("Status diperbarui", "success");
    
    // Audit log
    if (oldData) {
      await log({
        outlet_id: outletId!,
        action: "update",
        entity_type: "order",
        entity_id: orderId,
        old_data: oldData,
        new_data: { ...oldData, status },
      });
    }
  };

  const handleConfirmCashPaid = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const oldData = order ? { ...order } : null;
    
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
    
    // Audit log
    if (oldData) {
      await log({
        outlet_id: outletId!,
        action: "update",
        entity_type: "order",
        entity_id: orderId,
        old_data: oldData,
        new_data: { ...oldData, payment_status: "paid", status: "preparing" },
      });
    }
    toast("Pembayaran dikonfirmasi", "success");
  };

  const handleEditOrder = async (
    orderId: string,
    updatedFields: any,
    itemsToSave: any[],
    itemIdsToDelete: string[]
  ) => {
    const oldOrder = orders.find((o) => o.id === orderId);
    const oldData = oldOrder ? JSON.parse(JSON.stringify(oldOrder)) : null;
    try {
      setLoading(true);
      // 1. Update order fields in orders table
      const { error: orderErr } = await supabase
        .from("orders")
        .update(updatedFields)
        .eq("id", orderId);

      if (orderErr) throw orderErr;

      // 2. Delete removed items (and their modifiers cascade deletes them)
      if (itemIdsToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from("order_items")
          .delete()
          .in("id", itemIdsToDelete);
        if (delErr) throw delErr;
      }

      // 3. Upsert items
      for (const item of itemsToSave) {
        if (item.id) {
          // Update existing item
          const { error: itemErr } = await supabase
            .from("order_items")
            .update({
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              notes: item.notes || null,
            })
            .eq("id", item.id);
          if (itemErr) throw itemErr;

          // For simplicity, delete and re-insert modifiers for this updated item
          const { error: modDelErr } = await supabase
            .from("order_item_modifiers")
            .delete()
            .eq("order_item_id", item.id);
          if (modDelErr) throw modDelErr;

          if (item.modifiers && item.modifiers.length > 0) {
            const modsPayload = item.modifiers.map((m: any) => ({
              order_item_id: item.id,
              modifier_name: m.modifier_name,
              option_name: m.option_name,
              price_adjustment: m.price_adjustment,
            }));
            const { error: modInsErr } = await supabase
              .from("order_item_modifiers")
              .insert(modsPayload);
            if (modInsErr) throw modInsErr;
          }
        } else {
          // Insert new item
          const { data: newItemData, error: itemErr } = await supabase
            .from("order_items")
            .insert({
              order_id: orderId,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              notes: item.notes || null,
            })
            .select()
            .single();
          if (itemErr) throw itemErr;

          if (item.modifiers && item.modifiers.length > 0) {
            const modsPayload = item.modifiers.map((m: any) => ({
              order_item_id: newItemData.id,
              modifier_name: m.modifier_name,
              option_name: m.option_name,
              price_adjustment: m.price_adjustment,
            }));
            const { error: modInsErr } = await supabase
              .from("order_item_modifiers")
              .insert(modsPayload);
            if (modInsErr) throw modInsErr;
          }
        }
      }

      toast("Pesanan berhasil diperbarui", "success");
      const refreshedOrders = await fetchWorkspace();
      const updated = refreshedOrders.find((o) => o.id === orderId);
      if (updated) {
        setSelectedOrder(updated);
      }
      if (oldData && updated) {
        await log({
          outlet_id: outletId!,
          action: "update",
          entity_type: "order",
          entity_id: orderId,
          old_data: oldData,
          new_data: updated,
        });
      }
    } catch (err: any) {
      toast("Gagal mengedit pesanan: " + err.message, "error");
    } finally {
      setLoading(false);
    }
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
      stock: "0",
      sku: "",
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
      stock: (p.stock ?? 0).toString(),
      sku: p.sku ?? "",
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
    const numericStock = Number(prodForm.stock.toString().replace(/\D/g, ""));
    const payload = {
      outlet_id: outletId!,
      category_id: prodForm.category_id || null,
      name: prodForm.name.trim(),
      price: numericPrice,
      description: prodForm.description.trim(),
      image_url: prodForm.image_url.trim(),
      is_recommended: prodForm.is_recommended,
      is_available: prodForm.is_available,
      stock: numericStock,
      sku: prodForm.sku ? prodForm.sku.trim() : null,
    };
    if (editingProduct) {
      const oldData = { ...editingProduct };
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
        // Audit log
        await log({
          outlet_id: outletId!,
          action: "update",
          entity_type: "product",
          entity_id: editingProduct.id,
          old_data: oldData,
          new_data: { ...editingProduct, ...payload },
        });
      }
    } else {
      // Find all products in the same category and get the max sort_order
      const targetCatId = prodForm.category_id || null;
      const catProds = products.filter((p) => p.category_id === targetCatId);
      const maxSortOrder = catProds.reduce((max, p) => {
        const so = p.sort_order ?? 0;
        return so > max ? so : max;
      }, -1);
      const nextSortOrder = maxSortOrder + 1;

      const { data, error } = await supabase
        .from("products")
        .insert({ ...payload, sort_order: nextSortOrder })
        .select()
        .single();
      if (!error && data) {
        setProducts((p) => [...p, data]);
        toast("Produk ditambahkan", "success");
        // Audit log
        await log({
          outlet_id: outletId!,
          action: "create",
          entity_type: "product",
          entity_id: data.id,
          new_data: data,
        });
      }
    }
    setIsProdModalOpen(false);
  };

  const handleCreateCategoryInline = async () => {
    if (!newCatName.trim() || !outletId) return;
    setIsAddingCategory(true);
    const nextSortOrder = categories.length;
    const { data, error } = await supabase
      .from("categories")
      .insert({
        outlet_id: outletId,
        name: newCatName.trim(),
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
      setNewCatName("");
      setIsCreatingCategoryInline(false);
      toast("Kategori ditambahkan", "success");
      // Audit log
      await log({
        outlet_id: outletId,
        action: "create",
        entity_type: "category",
        entity_id: data.id,
        new_data: data,
      });
    }
  };

  const handleToggleAvailable = async (productId: string, current: boolean) => {
    const product = products.find((p) => p.id === productId);
    const oldData = product ? { ...product } : null;
    
    await supabase
      .from("products")
      .update({ is_available: !current })
      .eq("id", productId);
    setProducts((p) =>
      p.map((pr) =>
        pr.id === productId ? { ...pr, is_available: !current } : pr,
      ),
    );
    
    // Audit log
    if (oldData) {
      await log({
        outlet_id: outletId!,
        action: "update",
        entity_type: "product",
        entity_id: productId,
        old_data: oldData,
        new_data: { ...oldData, is_available: !current },
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const oldData = product ? { ...product } : null;
    
    await supabase.from("products").delete().eq("id", productId);
    setProducts((p) => p.filter((pr) => pr.id !== productId));
    toast("Produk dihapus", "success");
    
    // Audit log
    if (oldData) {
      await log({
        outlet_id: outletId!,
        action: "delete",
        entity_type: "product",
        entity_id: productId,
        old_data: oldData,
      });
    }
    
    setConfirm(null);
  };

  const handleImportProducts = async (importedRows: any[]) => {
    if (!outletId) return;
    setLoading(true);
    try {
      const uniqueCategoryNames = Array.from(
        new Set(
          importedRows
            .map((r) => r.categoryName?.trim())
            .filter((name) => name !== undefined && name !== "")
        )
      ) as string[];

      const existingCategoriesMap = new Map<string, string>();
      categories.forEach((cat) => {
        existingCategoriesMap.set(cat.name.toLowerCase().trim(), cat.id);
      });

      const categoriesToCreate = uniqueCategoryNames.filter(
        (name) => !existingCategoriesMap.has(name.toLowerCase().trim())
      );

      let updatedCategories = [...categories];

      if (categoriesToCreate.length > 0) {
        let currentSortOrder = categories.length;
        const insertPayload = categoriesToCreate.map((name) => ({
          outlet_id: outletId,
          name,
          sort_order: currentSortOrder++,
        }));

        const { data: newCats, error: catError } = await supabase
          .from("categories")
          .insert(insertPayload)
          .select();

        if (catError) {
          throw new Error("Gagal membuat kategori baru: " + catError.message);
        }

        if (newCats && newCats.length > 0) {
          updatedCategories = [...updatedCategories, ...newCats];
          setCategories(updatedCategories);
        }
      }

      const finalCategoriesMap = new Map<string, string>();
      updatedCategories.forEach((cat) => {
        finalCategoriesMap.set(cat.name.toLowerCase().trim(), cat.id);
      });

      const categorySortOrders = new Map<string | null, number>();
      
      products.forEach((p) => {
        const catId = p.category_id;
        const currentMax = categorySortOrders.get(catId) ?? -1;
        if ((p.sort_order ?? 0) > currentMax) {
          categorySortOrders.set(catId, p.sort_order ?? 0);
        }
      });

      const productsPayload = importedRows.map((row) => {
        const catNameTrimmed = row.categoryName?.trim().toLowerCase() || "";
        const categoryId = catNameTrimmed ? (finalCategoriesMap.get(catNameTrimmed) || null) : null;
        
        const currentMax = categorySortOrders.get(categoryId) ?? -1;
        const nextSort = currentMax + 1;
        categorySortOrders.set(categoryId, nextSort);

        return {
          outlet_id: outletId,
          category_id: categoryId,
          name: row.name,
          price: row.price,
          description: row.description,
          image_url: row.imageUrl,
          is_recommended: row.isRecommended,
          is_available: row.isAvailable,
          sort_order: nextSort,
          stock: row.stock ?? 0,
          sku: row.sku ? row.sku.trim() : null,
        };
      });

      const { data: newProds, error: prodError } = await supabase
        .from("products")
        .insert(productsPayload)
        .select();

      if (prodError) {
        throw new Error("Gagal mengimpor produk: " + prodError.message);
      }

      if (newProds && newProds.length > 0) {
        setProducts((prev) => [...prev, ...newProds]);
        toast(`Berhasil mengimpor ${newProds.length} produk`, "success");
        await log({
          outlet_id: outletId,
          action: "bulk_import",
          entity_type: "product",
          entity_id: null,
          new_data: newProds,
        });
      }

    } catch (err: any) {
      toast("Gagal impor produk: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReorderCategories = async (updatedCategories: Category[]) => {
    const oldData = categories.map((c) => ({ id: c.id, name: c.name, sort_order: c.sort_order }));
    const reordered = updatedCategories.map((cat, index) => ({
      ...cat,
      sort_order: index,
    }));
    setCategories(reordered);

    try {
      const changedCategories = reordered.filter((cat) => {
        const original = categories.find((oc) => oc.id === cat.id);
        return original?.sort_order !== cat.sort_order;
      });

      if (changedCategories.length > 0) {
        const updates = changedCategories.map((cat) =>
          supabase
            .from("categories")
            .update({ sort_order: cat.sort_order })
            .eq("id", cat.id)
        );
        const results = await Promise.all(updates);
        const firstError = results.find((r) => r.error);
        if (firstError) throw firstError.error;

        await log({
          outlet_id: outletId!,
          action: "reorder",
          entity_type: "category",
          old_data: oldData,
          new_data: reordered.map((c) => ({ id: c.id, name: c.name, sort_order: c.sort_order })),
        });
      }
    } catch (err) {
      toast("Gagal menyimpan urutan kategori: " + String(err), "error");
      fetchWorkspace();
    }
  };

  const handleReorderProducts = async (updatedProducts: Product[]) => {
    const oldData = products.map((p) => ({ id: p.id, name: p.name, sort_order: p.sort_order }));
    setProducts(updatedProducts);

    try {
      const changedProducts = updatedProducts.filter((p) => {
        const original = products.find((op) => op.id === p.id);
        return original?.sort_order !== p.sort_order;
      });

      if (changedProducts.length > 0) {
        const updates = changedProducts.map((p) =>
          supabase
            .from("products")
            .update({ sort_order: p.sort_order })
            .eq("id", p.id)
        );
        const results = await Promise.all(updates);
        const firstError = results.find((r) => r.error);
        if (firstError) throw firstError.error;

        await log({
          outlet_id: outletId!,
          action: "reorder",
          entity_type: "product",
          old_data: oldData,
          new_data: updatedProducts.map((p) => ({ id: p.id, name: p.name, sort_order: p.sort_order })),
        });
      }
    } catch (err) {
      toast("Gagal menyimpan urutan produk: " + String(err), "error");
      fetchWorkspace();
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
            outlet={outlet}
            products={products}
            onEditOrder={handleEditOrder}
          />
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === "reports" && (
          <WorkspaceReportsTab
            orders={orders}
            products={products}
            categories={categories}
          />
        )}

        {/* ── MENU TAB ── */}
        {activeTab === "menu" && (
          <WorkspaceMenuTab
            products={products}
            categories={categories}
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
            onReorderProducts={handleReorderProducts}
            onImportProducts={handleImportProducts}
          />
        )}

        {/* ── CATEGORIES TAB ── */}
        {activeTab === "categories" && (
          <WorkspaceCategoriesTab
            categories={categories}
            onAddCategory={async (name) => {
              if (!outletId) return;
              const nextSortOrder = categories.length;
              const { data, error } = await supabase
                .from("categories")
                .insert({ outlet_id: outletId, name: name.trim(), sort_order: nextSortOrder })
                .select()
                .single();
              if (error) {
                toast("Gagal menambahkan kategori: " + error.message, "error");
                return;
              }
              if (data) {
                setCategories((p) => [...p, data]);
                toast("Kategori ditambahkan", "success");
                // Audit log
                await log({
                  outlet_id: outletId,
                  action: "create",
                  entity_type: "category",
                  entity_id: data.id,
                  new_data: data,
                });
              }
            }}
            onUpdateCategory={async (catId, name) => {
              const oldData = categories.find((c) => c.id === catId);
              const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", catId);
              if (error) {
                toast("Gagal memperbarui kategori: " + error.message, "error");
                return;
              }
              setCategories((p) => p.map((c) => c.id === catId ? { ...c, name: name.trim() } : c));
              toast("Kategori diperbarui", "success");
              // Audit log
              if (oldData) {
                await log({
                  outlet_id: outletId!,
                  action: "update",
                  entity_type: "category",
                  entity_id: catId,
                  old_data: oldData,
                  new_data: { ...oldData, name: name.trim() },
                });
              }
            }}
            onDeleteCategory={(cat) =>
              setConfirm({
                label: `Hapus kategori "${cat.name}"?`,
                onConfirm: async () => {
                  const { error } = await supabase.from("categories").delete().eq("id", cat.id);
                  if (error) {
                    toast("Gagal menghapus kategori: " + error.message, "error");
                    return;
                  }
                  setCategories((p) => p.filter((c) => c.id !== cat.id));
                  toast("Kategori dihapus", "success");
                  // Audit log
                  await log({
                    outlet_id: outletId!,
                    action: "delete",
                    entity_type: "category",
                    entity_id: cat.id,
                    old_data: cat,
                  });
                  setConfirm(null);
                },
              })
            }
            onReorderCategories={handleReorderCategories}
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

        {/* ── AUDIT LOGS TAB ── */}
        {activeTab === "audit_logs" && outletId && (
          <WorkspaceAuditLogsTab
            outletId={outletId}
            categories={categories}
            products={products}
          />
        )}

      </main>

      {/* ── Product Modal ── */}
      {isProdModalOpen && (
        <>
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
                {isCreatingCategoryInline ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateCategoryInline();
                        }
                      }}
                      placeholder="Nama kategori baru..."
                      className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 bg-white"
                    />
                    <button
                      type="button"
                      disabled={isAddingCategory}
                      onClick={handleCreateCategoryInline}
                      className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isAddingCategory ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Tambah
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategoryInline(false);
                        setNewCatName("");
                      }}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg cursor-pointer transition-all border border-neutral-200"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={prodForm.category_id}
                      onChange={(e) =>
                        setProdForm((p) => ({ ...p, category_id: e.target.value }))
                      }
                      className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none bg-white cursor-pointer"
                    >
                      <option value="">— Tanpa Kategori —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategoryInline(true)}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg cursor-pointer transition-all flex items-center gap-1 border border-neutral-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                )}
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
      </>
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
