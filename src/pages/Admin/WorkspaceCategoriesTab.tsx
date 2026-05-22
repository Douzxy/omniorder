import React, { useState } from "react";
import {
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  Layers,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Category {
  id: string;
  outlet_id: string;
  name: string;
  sort_order?: number;
}

interface WorkspaceCategoriesTabProps {
  categories: Category[];
  onAddCategory: (name: string) => void;
  onUpdateCategory: (catId: string, name: string) => void;
  onDeleteCategory: (category: Category) => void;
  onReorderCategories: (categories: Category[]) => void;
}

export default function WorkspaceCategoriesTab({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
}: WorkspaceCategoriesTabProps) {
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName("");
  };

  const handleUpdateCategory = (catId: string) => {
    if (!editCatName.trim()) return;
    onUpdateCategory(catId, editCatName.trim());
    setEditingCatId(null);
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= categories.length) return;

    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[nextIndex];
    newCats[nextIndex] = temp;

    onReorderCategories(newCats);
  };

  return (
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
          categories.map((cat, index) => (
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
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveCategory(index, "up")}
                      className={`p-1.5 rounded-lg cursor-pointer transition-all ${index === 0 ? "text-neutral-200 cursor-not-allowed opacity-40" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"}`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === categories.length - 1}
                      onClick={() => moveCategory(index, "down")}
                      className={`p-1.5 rounded-lg cursor-pointer transition-all ${index === categories.length - 1 ? "text-neutral-200 cursor-not-allowed opacity-40" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
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
                    onClick={() => onDeleteCategory(cat)}
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
  );
}
