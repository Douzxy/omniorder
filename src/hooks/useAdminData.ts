import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api, Outlet, Category, Product, Order, Profile, ProductModifier, ProductModifierOption } from "@/services/api";

export function useOutlets(brandCode?: string) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOutlets = useCallback(async () => {
    setLoading(true);
    try {
      const data = brandCode ? await api.outlets.fetchByBrand(brandCode) : await api.outlets.fetchAll();
      setOutlets(data);
    } catch (error) {
      toast.error("Gagal memuat outlet");
    } finally {
      setLoading(false);
    }
  }, [brandCode]);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  return { outlets, loading, refetch: fetchOutlets };
}

export function useOutletWorkspace(outletId: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!outletId) return;
    setLoading(true);
    try {
      const [cats, prods, ords] = await Promise.all([
        api.categories.fetchByOutlet(outletId),
        api.products.fetchByOutlet(outletId),
        api.orders.fetchByOutlet(outletId, 200)
      ]);
      setCategories(cats);
      setProducts(prods);
      setOrders(ords);
    } catch (error) {
      toast.error("Gagal memuat data workspace");
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { categories, products, orders, setCategories, setProducts, setOrders, loading, refetch: loadData };
}

export function useProductModifiers(productId: string | null) {
  const [modifiers, setModifiers] = useState<ProductModifier[]>([]);
  const [options, setOptions] = useState<ProductModifierOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchModifiers = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const mods = await api.modifiers.fetchByProduct(productId);
      setModifiers(mods);
      
      if (mods.length > 0) {
        const modIds = mods.map(m => m.id);
        const opts = await api.modifierOptions.fetchByModifiers(modIds);
        setOptions(opts);
      } else {
        setOptions([]);
      }
    } catch (error) {
      toast.error("Gagal memuat modifier produk");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchModifiers();
  }, [fetchModifiers]);

  return { modifiers, options, setModifiers, setOptions, loading, refetch: fetchModifiers };
}
