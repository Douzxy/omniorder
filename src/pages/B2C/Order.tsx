import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import {
  ShoppingBag,
  Search,
  Sparkles,
  AlertCircle,
  ShoppingCart,
  Menu,
  X,
  User,
  LogIn,
  History,
  Globe,
  Shield,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Plus
} from "lucide-react";
import HighlightText from "@/components/HighlightText";
import ProductDetailModal, { Modifier, ModifierOption } from "@/components/ProductDetailModal";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  is_recommended: boolean;
  is_available: boolean;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface Outlet {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  brand_color: string;
  table_count: number;
  is_dine_in_enabled: boolean;
  is_takeaway_enabled: boolean;
  is_delivery_enabled: boolean;
  open_time: string;
  close_time: string;
}

// No mock data — all data is fetched from Supabase

export default function OrderPage() {
  const { brandCode, outletId } = useParams<{ brandCode: string; outletId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    cart,
    cartOutletId,
    setCartOutletId,
    addToCart,
    removeFromCart,
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    cartTotal,
    setTaxConfig,
    showToast,
  } = useCart();

  // Outlet, Catalog and State management
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [modifierOptions, setModifierOptions] = useState<ModifierOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<any>(null);
  
  const [loadError, setLoadError] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("cat1");
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Side Navigation & Dialog Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<"login" | "history" | "lang" | "privacy" | null>(null);
  // isSearchOpen removed - search is now inline
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);

  // Inline search filter - applied to catalog categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return null; // null means show all
    const q = searchQuery.toLowerCase();
    return categories.map(cat => {
      const catProducts = products.filter(p => {
        const matchesCat = cat.id === "cat1" ? p.is_recommended : p.category_id === cat.id;
        if (!matchesCat) return false;
        return p.name.toLowerCase().includes(q);
      }).sort((a, b) => {
        if (a.is_available && !b.is_available) return -1;
        if (!a.is_available && b.is_available) return 1;
        return 0;
      });
      return { ...cat, filteredProducts: catProducts };
    }).filter(cat => cat.filteredProducts.length > 0);
  }, [products, categories, searchQuery]);

  // Scrollspy logic - uses offsetTop for reliable detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 175; // Offset to align with thicker sticky header group
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;

      const activeList = filteredCategories || categories;

      // If near bottom, highlight the last visible category
      if (isAtBottom && activeList.length > 0) {
        const lastCat = [...activeList].reverse().find(cat => {
          const el = document.getElementById(cat.id);
          return !!el;
        });
        if (lastCat && activeCategory !== lastCat.id) {
          setActiveCategory(lastCat.id);
        }
        return; // Skip normal check
      }

      // Normal check based on current scroll position
      let currentActiveCatId = activeList[0]?.id || "";

      for (const cat of activeList) {
        const element = document.getElementById(cat.id);
        if (element) {
          if (element.offsetTop <= scrollPosition) {
            currentActiveCatId = cat.id;
          } else {
            break; // Since categories are ordered, we can break early
          }
        }
      }

      if (currentActiveCatId !== activeCategory) {
        setActiveCategory(currentActiveCatId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories, activeCategory, filteredCategories]);

  // Sync horizontal scroll of categories navigation with active category
  useEffect(() => {
    if (activeCategory && categoriesContainerRef.current) {
      const container = categoriesContainerRef.current;
      const activeBtn = container.querySelector(`[data-category-id="${activeCategory}"]`) as HTMLElement;
      
      if (activeBtn) {
        const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeCategory]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      const y = element.offsetTop - 165; // Adjust offset for thicker sticky header
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // 1. Sync & Validate Outlet ID: Automatically resets cart if switching outlets
  useEffect(() => {
    if (outletId) {
      setCartOutletId(outletId);
    }
  }, [outletId, setCartOutletId]);

  // Initialize order mode and table from URL search params
  useEffect(() => {
    const mode = searchParams.get("mode")?.toLowerCase();
    if (mode === "dinein" || mode === "takeaway" || mode === "delivery") {
      setOrderType(mode as any);
    }
    const tbl = searchParams.get("tableNumber");
    if (tbl) {
      setTableNumber(tbl);
    }
  }, [searchParams, setOrderType, setTableNumber]);

  // Fetch all data from Supabase
  useEffect(() => {
    async function fetchData() {
      if (!outletId) return;
      setLoading(true);
      setLoadError("");
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(outletId);

        // 1. Fetch Outlet
        const { data: dbOutlet, error: outletErr } = await (isUuid
          ? supabase.from("outlets").select("*").eq("id", outletId).single()
          : supabase.from("outlets").select("*").eq("slug", outletId).single());

        if (outletErr || !dbOutlet) {
          setLoadError("Outlet tidak ditemukan. Pastikan QR Code yang Anda scan sudah benar.");
          setLoading(false);
          return;
        }
        setOutlet(dbOutlet);

        // 2. Fetch Categories
        const { data: dbCats } = await supabase
          .from("categories").select("*").eq("outlet_id", dbOutlet.id).order("name");
        const cats = [{ id: "cat1", name: "Rekomendasi" }, ...(dbCats ?? [])];
        setCategories(cats);
        setActiveCategory("cat1");

        // 3. Fetch Products
        const { data: dbProds } = await supabase
          .from("products").select("*").eq("outlet_id", dbOutlet.id);
        setProducts(dbProds ?? []);

        // 4. Fetch Modifiers & Options
        if (dbProds && dbProds.length > 0) {
          const productIds = dbProds.map(p => p.id);
          const { data: dbMods } = await supabase
            .from("product_modifiers").select("*").in("product_id", productIds);
          setModifiers(dbMods ?? []);

          if (dbMods && dbMods.length > 0) {
            const modIds = dbMods.map(m => m.id);
            const { data: dbOpts } = await supabase
              .from("product_modifier_options").select("*").in("modifier_id", modIds);
            setModifierOptions(dbOpts ?? []);
          }
        }
        
        // 5. Set Tax Config in Cart Context
        setTaxConfig(dbOutlet.is_tax_enabled, dbOutlet.tax_percentage);

      } catch (err: any) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [outletId, brandCode]);

  // Handle editing cart item from Cart page
  useEffect(() => {
    const editCartItemId = searchParams.get("editCartItem");
    if (editCartItemId && products.length > 0 && !editingCartItem) {
      const itemToEdit = cart.find(c => c.cartItemId === editCartItemId);
      if (itemToEdit) {
        const p = products.find(prod => prod.id === itemToEdit.id);
        if (p) {
          setEditingCartItem(itemToEdit);
          setSelectedProduct(p);
        }
      }
    }
  }, [searchParams, products, cart, editingCartItem]);

  // Load Order History from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("omniorder_history");
    if (stored) {
      try {
        setOrdersHistory(JSON.parse(stored));
      } catch (e) {
        showToast("Gagal memuat history: " + String(e), "error");
      }
    }
  }, [activeModal]);


  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamic Hex brand variables
  const brandColor = outlet?.brand_color ?? "#2563eb";
  const brandColorHover = `${brandColor}d5`;
  const brandColorLight = `${brandColor}14`;

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="font-bold text-neutral-700">{loadError}</p>
        </div>
      </div>
    );
  }

  // Loading / outlet not yet fetched
  if (!outlet && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex-1 bg-[#f4f4f5] text-[#171717] min-h-screen pb-28 relative flex flex-col font-sans selection:bg-brand selection:text-white"
      style={{
        "--brand-color": brandColor,
        "--brand-color-hover": brandColorHover,
        "--brand-color-light": brandColorLight,
      } as React.CSSProperties}
    >
      {/* Hero Header with Outlet Image */}
      <div className="relative h-40 sm:h-48 w-full shrink-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
          alt="Restaurant Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/75" />
        
        {/* Top actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
           <button onClick={() => setIsDrawerOpen(true)} className="p-2 bg-black/40 hover:bg-black/50 backdrop-blur-md rounded-xl text-white transition-all shadow-sm cursor-pointer">
              <Menu className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Sticky Header Group: Outlet Info, Search, Categories */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-sm w-full pt-5 pb-3 px-4 flex flex-col gap-3 -mt-6 rounded-t-3xl transition-all">
        {/* Outlet Info */}
        <div className="max-w-md w-full mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0 text-left">
            <h1 className="font-extrabold text-xl text-neutral-900 leading-tight mb-0.5 truncate">
              {outlet?.name}
            </h1>
            <div className="text-xs text-neutral-600 font-bold flex items-center gap-2 flex-wrap">
              <span>Jam Buka: {outlet?.open_time?.substring(0, 5) || "08:00"} - {outlet?.close_time?.substring(0, 5) || "22:00"}</span>
              <span className="text-neutral-300">•</span>
              <span className="text-brand">
                {orderType === "dinein" ? `Meja ${tableNumber || "-"}` : orderType === "takeaway" ? "Bawa Pulang (Takeaway)" : "Pesan Antar (Delivery)"}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md w-full mx-auto">
          <div className="relative flex items-center bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-brand/15">
            <Search className="absolute left-3.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari menu favoritmu disini..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-transparent text-xs font-semibold rounded-xl border-none focus:outline-none focus:ring-0 text-neutral-800 cursor-text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer transition-colors"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Navigation */}
        <div ref={categoriesContainerRef} className="relative flex gap-2 overflow-x-auto w-full max-w-md mx-auto scrollbar-hide pb-0.5 scroll-smooth">
          {(filteredCategories || categories).map((cat) => (
            <button
              key={cat.id}
              data-category-id={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all duration-300 cursor-pointer active:scale-95 border ${
                activeCategory === cat.id
                  ? "bg-brand border-brand text-white shadow-md shadow-brand/10"
                  : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {cat.id === "cat1" && <Sparkles className="w-3 h-3 inline mr-1 -translate-y-0.5" />}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Catalog View */}
      <div className="max-w-md w-full mx-auto px-4 mt-5 flex-1">

        {/* Product Grid / Rows */}
        <div className="space-y-6">
          {loading ? (
            // Skeleton list loaders
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 bg-white p-3.5 rounded-3xl border border-neutral-200/50 animate-pulse">
                <div className="w-24 h-24 bg-neutral-200 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-neutral-200 rounded w-2/3" />
                  <div className="h-3 bg-neutral-200 rounded w-full" />
                  <div className="h-4 bg-neutral-200 rounded w-1/4 mt-4" />
                </div>
              </div>
            ))
          ) : filteredCategories !== null ? (
            // --- Inline search results mode ---
            filteredCategories.length > 0 ? (
              filteredCategories.map(cat => (
                <div key={cat.id}>
                  <h2 className="font-extrabold text-neutral-800 text-base mb-3.5 flex items-center gap-2 px-1">
                    {cat.id === "cat1" && <Sparkles className="w-4 h-4 text-brand" />}
                    {cat.name}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {cat.filteredProducts.map((product: Product) => {
                      const isAvailable = product.is_available;
                      return (
                        <div
                          key={product.id}
                          onClick={() => { if (isAvailable) setSelectedProduct(product); }}
                          className={`flex justify-between items-center gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200/60 shadow-sm transition-all relative ${
                            !isAvailable ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:shadow-md hover:border-brand/35 active:scale-[0.99]"
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2 text-left">
                            <h3 className="font-extrabold text-neutral-800 text-sm leading-snug mb-1">
                              <HighlightText text={product.name} query={searchQuery} />
                            </h3>
                            <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed mb-3 font-medium">
                              {product.description || "Hidangan spesial buatan koki terbaik kami."}
                            </p>
                            <div className="font-black text-brand text-sm">
                              Rp {product.price.toLocaleString("id-ID")}
                            </div>
                          </div>
                          <div className="relative w-24 h-24 flex-shrink-0 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/50 shadow-inner">
                              <img
                                src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {!isAvailable && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                                <span className="text-[9px] bg-neutral-900/90 text-white font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">Habis</span>
                              </div>
                            )}
                            {isAvailable && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                                className="absolute -bottom-2 bg-brand hover:bg-brand-hover text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-md shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Tambah
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 px-6">
                <Search className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-neutral-500">Menu tidak ditemukan</p>
                <p className="text-[10px] text-neutral-400 mt-1 max-w-xs mx-auto">
                  Tidak ada menu "{searchQuery}" di outlet ini. Coba kata kunci lain.
                </p>
              </div>
            )
          ) : (
            // --- Normal catalog mode ---
            categories.map(cat => {
              const catProducts = products.filter(p => {
                if (cat.id === "cat1") return p.is_recommended;
                return p.category_id === cat.id;
              }).sort((a, b) => {
                if (a.is_available && !b.is_available) return -1;
                if (!a.is_available && b.is_available) return 1;
                return 0;
              });

              if (catProducts.length === 0) return null;

              return (
                <div key={cat.id} id={cat.id} className="scroll-mt-[170px]">
                  <h2 className="font-extrabold text-neutral-800 text-base mb-3.5 flex items-center gap-2 px-1">
                    {cat.id === "cat1" && <Sparkles className="w-4 h-4 text-brand" />}
                    {cat.name}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {catProducts.map(product => {
                      const isAvailable = product.is_available;
                      return (
                        <div
                          key={product.id}
                          onClick={() => { if (isAvailable) setSelectedProduct(product); }}
                          className={`flex justify-between items-center gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200/60 shadow-sm transition-all relative ${
                            !isAvailable ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:shadow-md hover:border-brand/35 active:scale-[0.99]"
                          }`}
                        >
                          {/* Left Column: Product Details */}
                          <div className="flex-1 min-w-0 pr-2 text-left">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {product.is_recommended && (
                                <span className="bg-brand/10 text-brand text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Rekomendasi
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-neutral-800 text-sm leading-snug mb-1 text-left">
                              {product.name}
                            </h3>
                            <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed mb-3 font-medium text-left">
                              {product.description || "Hidangan spesial buatan koki terbaik kami."}
                            </p>
                            <div className="font-black text-sm text-left">
                              Rp {product.price.toLocaleString("id-ID")}
                            </div>
                          </div>

                          {/* Right Column: Square Thumbnail + Add Button */}
                          <div className="relative w-24 h-24 flex-shrink-0 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/50 shadow-inner">
                              <img
                                src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                            </div>

                            {/* "Habis" overlay */}
                            {!isAvailable && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                                <span className="text-[9px] bg-neutral-900/90 text-white font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">
                                  Habis
                                </span>
                              </div>
                            )}

                            {/* Add Button */}
                            {isAvailable && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                                className="absolute -bottom-2 bg-brand hover:bg-brand-hover text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-md shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Tambah
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sticky bottom CTA Cart Bar (Fitts's Law) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-neutral-200/60 z-30 flex justify-center">
          <Link
            to={`/${brandCode}/${outletId}/view-order`}
            className="w-full max-w-md flex items-center justify-between px-5 py-4 bg-brand hover:bg-brand-hover active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-xl shadow-brand/20 transition-all cursor-pointer text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] block font-medium opacity-80">{cartItemCount} Menu Terpilih</span>
                <span className="text-xs">Lanjutkan ke Keranjang</span>
              </div>
            </div>
            <span className="text-sm">Rp {cartTotal.toLocaleString("id-ID")}</span>
          </Link>
        </div>
      )}

      {/* Full-Screen Search Modal: Removed. Search is now inline. */}

      {/* Navigation Drawer Overlay Panel */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-all duration-300 flex justify-end">
          {/* Drawer Close trigger background */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 cursor-pointer"
          />

          {/* Drawer Menu Container */}
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col justify-between py-6 px-5 z-10 animate-in slide-in-from-right duration-250">
            <div className="space-y-6">
              {/* Header inside drawer */}
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                <h3 className="font-black text-sm uppercase tracking-wider text-neutral-450">
                  Navigasi Utama
                </h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg cursor-pointer text-neutral-500 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guest Banner notice layout (User Request) */}
              <div className="bg-brand/5 border border-brand/10 p-4.5 rounded-2xl space-y-2.5 text-left shadow-sm">
                <div className="flex items-center gap-2 text-brand">
                  <User className="w-4 h-4" />
                  <span className="font-extrabold text-xs">Anda masuk sebagai Tamu</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-normal font-medium">
                  Akses menu instan aktif. Silakan masuk untuk mengumpulkan koin promo & histori transaksi.
                </p>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveModal("login");
                  }}
                  className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-[11px] font-extrabold rounded-xl transition-all cursor-pointer active:scale-95 text-center block shadow-md shadow-brand/10"
                >
                  Masuk ke Akun
                </button>
              </div>

              {/* Remaining Drawer Navigation Items */}
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveModal("history");
                  }}
                  className="w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer flex items-center gap-3"
                >
                  <History className="w-4 h-4 text-brand" />
                  Riwayat Pesanan
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveModal("lang");
                  }}
                  className="w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer flex items-center gap-3"
                >
                  <Globe className="w-4 h-4 text-brand" />
                  Bahasa (Indonesia)
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveModal("privacy");
                  }}
                  className="w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer flex items-center gap-3"
                >
                  <Shield className="w-4 h-4 text-brand" />
                  Kebijakan Privasi
                </button>
              </nav>
            </div>

            {/* Footer inside drawer */}
            <div className="pt-4 border-t border-neutral-100 text-center">
              <span className="text-[10px] font-bold text-neutral-400 block tracking-wider uppercase">
                OmniOrder Platform v1.2
              </span>
              <span className="text-[9px] text-neutral-450 block mt-0.5">
                © 2026 Premium Light Experience
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal Dialogs */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-150">
              <h3 className="font-extrabold text-sm text-neutral-850 uppercase tracking-wider flex items-center gap-1.5">
                {activeModal === "login" && <LogIn className="w-4 h-4 text-brand" />}
                {activeModal === "history" && <History className="w-4 h-4 text-brand" />}
                {activeModal === "lang" && <Globe className="w-4 h-4 text-brand" />}
                {activeModal === "privacy" && <Shield className="w-4 h-4 text-brand" />}
                {activeModal === "login" && "Masuk Akun"}
                {activeModal === "history" && "Histori Transaksi"}
                {activeModal === "lang" && "Pilih Bahasa"}
                {activeModal === "privacy" && "Kebijakan Privasi"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Contents */}
            <div className="text-xs text-neutral-600 leading-relaxed max-h-60 overflow-y-auto">
              {activeModal === "login" && (
                <div className="space-y-4 py-2 text-left">
                  <p className="font-extrabold text-neutral-800 text-sm">Masuk Akun Pelanggan</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
                    Masuk untuk mengumpulkan koin promo loyalitas, riwayat transaksi, dan penawaran diskon eksklusif dari outlet ini.
                  </p>
                  <div className="space-y-3.5 pt-1">
                    <div>
                      <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">
                        Nomor Telepon atau Email
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789 atau nama@domain.com"
                        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">
                        PIN / Kata Sandi (Opsional)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••"
                        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 text-neutral-850 font-medium"
                      />
                    </div>
                    <button
                      onClick={() => {
                        showToast("Masuk Akun Berhasil (Simulasi)", "success");
                        setActiveModal(null);
                      }}
                      className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-extrabold rounded-2xl text-xs transition-colors cursor-pointer active:scale-95 text-center block shadow-md shadow-brand/10"
                    >
                      Masuk Sekarang
                    </button>
                    <div className="text-center pt-2">
                      <Link
                        to="/admin/login"
                        className="text-[10px] text-neutral-400 hover:text-brand font-bold hover:underline cursor-pointer"
                      >
                        Masuk sebagai Pengelola Restoran (Admin Portal)
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "history" && (
                <div className="space-y-3.5 py-1">
                  {ordersHistory.length > 0 ? (
                    ordersHistory.map((item, index) => (
                      <div key={index} className="bg-neutral-50 border border-neutral-200/60 p-3 rounded-2xl flex justify-between items-center text-left">
                        <div>
                          <span className="font-mono font-bold block text-neutral-700">
                            #{item.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-neutral-450 block mt-0.5">
                            {item.order_type === "dinein" ? "Makan di Tempat" : item.order_type === "takeaway" ? "Bawa Pulang" : "Delivery"}
                          </span>
                          <span className="text-[10px] text-neutral-450 block mt-0.5">
                            {new Date(item.created_at).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-neutral-850 block text-xs">
                            Rp {item.total_amount.toLocaleString("id-ID")}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${
                            item.payment_status === "paid"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {item.payment_status === "paid" ? "Paid" : "Cashier"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <HelpCircle className="w-8 h-8 text-neutral-350 mx-auto mb-2" />
                      <p className="text-[11px] text-neutral-400">Belum ada riwayat pemesanan di perangkat ini.</p>
                    </div>
                  )}
                </div>
              )}

              {activeModal === "lang" && (
                <div className="space-y-2 py-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full p-3 border border-brand bg-brand-light rounded-xl font-bold text-xs text-brand text-left cursor-pointer flex justify-between items-center"
                  >
                    <span>Bahasa Indonesia (Default)</span>
                    <span className="w-2 h-2 rounded-full bg-brand" />
                  </button>
                  <button
                    onClick={() => {
                      showToast("English language will be integrated soon.", "info");
                      setActiveModal(null);
                    }}
                    className="w-full p-3 border border-neutral-200 hover:bg-neutral-50 rounded-xl font-medium text-xs text-neutral-700 text-left cursor-pointer"
                  >
                    English (UK)
                  </button>
                </div>
              )}

              {activeModal === "privacy" && (
                <div className="space-y-3.5 pr-1 text-left">
                  <p className="font-bold text-neutral-800">Kebijakan Privasi OmniOrder</p>
                  <p>
                    Kami di OmniOrder menghargai privasi informasi pribadi Anda. Aplikasi kami mengumpulkan nama lengkap Anda, nomor telepon, dan email struk semata-mata untuk mengidentifikasi status meja pemesanan, mengirim struk digital, serta menyajikan penawaran promosi terbaru yang sesuai dari outlet ini.
                  </p>
                  <p>
                    Kami berkomitmen untuk tidak pernah menjual data pribadi Anda ke pihak ketiga manapun. Semua rincian pemesanan Anda tersimpan aman menggunakan enkripsi terpercaya dari database Supabase.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-brand hover:bg-brand-hover active:scale-95 text-white font-extrabold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal for Modifiers & Notes */}
      <ProductDetailModal
        product={selectedProduct}
        modifiers={modifiers}
        modifierOptions={modifierOptions}
        initialCartItem={editingCartItem}
        onClose={() => {
          setSelectedProduct(null);
          if (editingCartItem) {
            setEditingCartItem(null);
            navigate(`/${brandCode}/${outletId}/view-order`);
          }
        }}
        onAddToCart={(qty, notes, mods) => {
          if (selectedProduct) {
            if (editingCartItem) {
              removeFromCart(editingCartItem.cartItemId);
            }
            addToCart(selectedProduct, qty, notes, mods);
            
            setSelectedProduct(null);
            setEditingCartItem(null);
            if (editingCartItem) {
              navigate(`/${brandCode}/${outletId}/view-order`);
            }
          }
        }}
        brandColor={brandColor}
      />
    </div>
  );
}
