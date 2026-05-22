import React, { useState } from "react";
import { Search, Plus, Package, Edit2, Trash2, ToggleRight, ToggleLeft, ChevronUp, ChevronDown, Filter, Download, Upload, AlertCircle, X } from "lucide-react";
import { parseCSV, generateCSV } from "@/utils/csvHelper";

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
}

interface WorkspaceMenuTabProps {
  products: Product[];
  categories: Category[];
  menuSearch: string;
  onMenuSearchChange: (val: string) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onToggleAvailable: (productId: string, current: boolean) => void;
  onDeleteProduct: (product: Product) => void;
  onReorderProducts: (updatedProducts: Product[]) => void;
  onImportProducts: (imported: any[]) => Promise<void>;
}

const fmt = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`;

export default function WorkspaceMenuTab({
  products,
  categories,
  menuSearch,
  onMenuSearchChange,
  onAddProduct,
  onEditProduct,
  onToggleAvailable,
  onDeleteProduct,
  onReorderProducts,
  onImportProducts,
}: WorkspaceMenuTabProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImportErrorModalOpen, setIsImportErrorModalOpen] = useState(false);

  const handleExportCSV = () => {
    const headers = ["Nama", "Harga", "Deskripsi", "Kategori", "Gambar", "Rekomendasi", "Tersedia"];
    const rows = products.map((p) => {
      const categoryName = categories.find((c) => c.id === p.category_id)?.name || "";
      return [
        p.name || "",
        String(p.price || 0),
        p.description || "",
        categoryName,
        p.image_url || "",
        p.is_recommended ? "Ya" : "Tidak",
        p.is_available ? "Ya" : "Tidak",
      ];
    });

    const csvContent = generateCSV(headers, rows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `katalog_produk_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setImportErrors(["Berkas CSV kosong atau tidak memiliki data."]);
          setIsImportErrorModalOpen(true);
          e.target.value = "";
          return;
        }

        const firstRow = parsed[0];
        const keys = Object.keys(firstRow);
        
        const nameKey = keys.find(k => k === "nama" || k === "name");
        const priceKey = keys.find(k => k === "harga" || k === "price");
        const descKey = keys.find(k => k === "deskripsi" || k === "description");
        const catKey = keys.find(k => k === "kategori" || k === "category");
        const imgKey = keys.find(k => k === "gambar" || k === "image" || k === "image_url");
        const recKey = keys.find(k => k === "rekomendasi" || k === "recommended" || k === "is_recommended");
        const availKey = keys.find(k => k === "tersedia" || k === "available" || k === "is_available");

        if (!nameKey || !priceKey) {
          setImportErrors([
            "Format file CSV tidak valid. Pastikan kolom header memiliki nama kolom 'Nama' (atau 'Name') dan 'Harga' (atau 'Price')."
          ]);
          setIsImportErrorModalOpen(true);
          e.target.value = "";
          return;
        }

        const errors: string[] = [];
        const validRows: any[] = [];

        parsed.forEach((row, index) => {
          const rowNum = index + 2;
          const rawName = row[nameKey]?.trim();
          const rawPrice = row[priceKey]?.trim();

          if (!rawName) {
            errors.push(`Baris ${rowNum}: Nama produk tidak boleh kosong.`);
            return;
          }

          const cleanPriceStr = rawPrice.replace(/[^0-9]/g, "");
          const priceNum = Number(cleanPriceStr);
          if (!rawPrice || isNaN(priceNum) || priceNum < 0) {
            errors.push(`Baris ${rowNum}: Harga "${rawPrice}" tidak valid (harus berupa angka positif).`);
            return;
          }

          const description = descKey ? row[descKey]?.trim() : "";
          const categoryName = catKey ? row[catKey]?.trim() : "";
          const imageUrl = imgKey ? row[imgKey]?.trim() : "";

          const parseBool = (val: string | undefined, defaultVal: boolean) => {
            if (!val) return defaultVal;
            const lower = val.toLowerCase().trim();
            if (lower === "ya" || lower === "yes" || lower === "true" || lower === "1") return true;
            if (lower === "tidak" || lower === "no" || lower === "false" || lower === "0") return false;
            return defaultVal;
          };

          const isRecommended = parseBool(recKey ? row[recKey] : undefined, false);
          const isAvailable = parseBool(availKey ? row[availKey] : undefined, true);

          validRows.push({
            name: rawName,
            price: priceNum,
            description,
            categoryName,
            imageUrl,
            isRecommended,
            isAvailable,
          });
        });

        if (errors.length > 0) {
          setImportErrors(errors);
          setIsImportErrorModalOpen(true);
          e.target.value = "";
          return;
        }

        await onImportProducts(validRows);
        
      } catch (err: any) {
        setImportErrors([`Gagal memproses berkas CSV: ${err.message}`]);
        setIsImportErrorModalOpen(true);
      } finally {
        e.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  // 1. Filter by category
  const categoryProducts = products.filter((p) => {
    if (selectedCategoryId === "all") return true;
    return p.category_id === selectedCategoryId;
  });

  // 2. Filter by search query
  const searchedProducts = categoryProducts.filter((p) => {
    if (!menuSearch.trim()) return true;
    return p.name.toLowerCase().includes(menuSearch.toLowerCase());
  });

  // 3. Sort products:
  // - If category is selected and not searching: sort strictly by sort_order
  // - Otherwise: sort by is_available desc, sort_order asc, name asc
  const sortedProducts = [...searchedProducts].sort((a, b) => {
    if (selectedCategoryId !== "all" && !menuSearch.trim()) {
      const sa = a.sort_order ?? 0;
      const sb = b.sort_order ?? 0;
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    }
    if (a.is_available && !b.is_available) return -1;
    if (!a.is_available && b.is_available) return 1;
    const sa = a.sort_order ?? 0;
    const sb = b.sort_order ?? 0;
    if (sa !== sb) return sa - sb;
    return a.name.localeCompare(b.name);
  });

  const showReorderButtons = selectedCategoryId !== "all" && !menuSearch.trim();

  const moveProduct = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sortedProducts.length) return;

    const newSorted = [...sortedProducts];
    const temp = newSorted[index];
    newSorted[index] = newSorted[nextIndex];
    newSorted[nextIndex] = temp;

    // Recalculate sort_order indices for this filtered category
    const reorderedCategoryProducts = newSorted.map((p, idx) => ({
      ...p,
      sort_order: idx,
    }));

    // Merge updated items back into the complete products list
    const updatedProducts = products.map((p) => {
      const matched = reorderedCategoryProducts.find((rp) => rp.id === p.id);
      return matched ? matched : p;
    });

    onReorderProducts(updatedProducts);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Category Dropdown Selector */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 bg-white cursor-pointer appearance-none min-w-[150px]"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
              <Filter className="w-4 h-4" />
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={menuSearch}
              onChange={(e) => onMenuSearchChange(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-neutral-200 text-neutral-600 text-xs font-semibold rounded-lg hover:bg-neutral-50 hover:text-neutral-800 cursor-pointer transition-all bg-white shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          
          <label className="flex items-center gap-1.5 px-3 py-2 border border-neutral-200 text-neutral-600 text-xs font-semibold rounded-lg hover:bg-neutral-50 hover:text-neutral-800 cursor-pointer transition-all bg-white shadow-sm">
            <Upload className="w-3.5 h-3.5" /> Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>

          <button
            onClick={onAddProduct}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedProducts.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-neutral-200">
            <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Belum ada produk</p>
          </div>
        ) : (
          sortedProducts.map((p, index) => (
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
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {showReorderButtons && (
                      <>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveProduct(index, "up")}
                          className={`p-1.5 rounded-lg cursor-pointer transition-all ${index === 0 ? "text-neutral-200 cursor-not-allowed opacity-40" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"}`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === sortedProducts.length - 1}
                          onClick={() => moveProduct(index, "down")}
                          className={`p-1.5 rounded-lg cursor-pointer transition-all ${index === sortedProducts.length - 1 ? "text-neutral-200 cursor-not-allowed opacity-40" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"}`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onEditProduct(p)}
                      className="p-1 hover:bg-neutral-100 rounded cursor-pointer text-neutral-400 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p)}
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
                    <span className="text-[10px] font-semibold bg-brand/5 text-brand border border-brand px-2 py-0.5 rounded-full">
                      ★ Rekomendasi
                    </span>
                  )}
                  <button
                    onClick={() => onToggleAvailable(p.id, p.is_available)}
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

      {isImportErrorModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setIsImportErrorModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg p-5 shadow-xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Kesalahan Impor CSV</h3>
              </div>
              <button
                onClick={() => setIsImportErrorModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            
            <p className="text-xs text-neutral-500 mb-3">
              Proses impor dibatalkan karena terdapat beberapa baris dengan format tidak valid. Silakan perbaiki file CSV Anda dan coba lagi:
            </p>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[50vh] custom-scrollbar">
              {importErrors.map((err, idx) => (
                <div key={idx} className="p-2.5 bg-red-50/50 border border-red-100 rounded-lg text-xs text-red-700 font-medium">
                  {err}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 mt-3 border-t border-neutral-100">
              <button
                onClick={() => setIsImportErrorModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 cursor-pointer transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
