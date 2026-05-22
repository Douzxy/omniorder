import { Search, Plus, Package, Edit2, Trash2, ToggleRight, ToggleLeft } from "lucide-react";

interface Product {
  id: string; outlet_id: string; category_id: string | null;
  name: string; price: number; description: string;
  image_url: string; is_recommended: boolean; is_available: boolean;
}
interface WorkspaceMenuTabProps {
  products: Product[];
  menuSearch: string;
  onMenuSearchChange: (val: string) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onToggleAvailable: (productId: string, current: boolean) => void;
  onDeleteProduct: (product: Product) => void;
}

const fmt = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`;

export default function WorkspaceMenuTab({
  products,
  menuSearch,
  onMenuSearchChange,
  onAddProduct,
  onEditProduct,
  onToggleAvailable,
  onDeleteProduct,
}: WorkspaceMenuTabProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={menuSearch}
            onChange={(e) => onMenuSearchChange(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 bg-white"
          />
        </div>
        <button
          onClick={onAddProduct}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Tambah Produk
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-neutral-200">
            <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Belum ada produk</p>
          </div>
        ) : (
          products.map((p) => (
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
    </>
  );
}
