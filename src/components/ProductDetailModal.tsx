import React, { useState, useMemo, useEffect } from "react";
import { X, Minus, Plus, ShoppingCart, MessageSquare } from "lucide-react";
import { CartModifier } from "@/context/CartContext";

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  is_recommended: boolean;
  is_available: boolean;
  category_id: string;
}

export interface Modifier {
  id: string;
  product_id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
}

export interface ModifierOption {
  id: string;
  modifier_id: string;
  name: string;
  price_adjustment: number;
  is_available: boolean;
}

interface ProductDetailModalProps {
  product: Product | null;
  modifiers: Modifier[];
  modifierOptions: ModifierOption[];
  onClose: () => void;
  onAddToCart: (quantity: number, notes: string, cartModifiers: CartModifier[]) => void;
  brandColor: string;
  initialCartItem?: any; // any to avoid circular dependency with CartContext if not needed
}

export default function ProductDetailModal({
  product,
  modifiers,
  modifierOptions,
  onClose,
  onAddToCart,
  brandColor,
  initialCartItem
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  // Reset state when product changes
  useEffect(() => {
    if (initialCartItem && initialCartItem.id === product?.id) {
      setQuantity(initialCartItem.quantity || 1);
      setNotes(initialCartItem.notes || "");
      if (initialCartItem.modifiers) {
        const initialSelections: Record<string, string[]> = {};
        initialCartItem.modifiers.forEach((mod: any) => {
          initialSelections[mod.id] = mod.options.map((opt: any) => opt.id);
        });
        setSelectedOptions(initialSelections);
      } else {
        setSelectedOptions({});
      }
    } else {
      setQuantity(1);
      setNotes("");
      setSelectedOptions({});
    }
  }, [product, initialCartItem]);

  const productModifiers = useMemo(() => {
    if (!product) return [];
    return modifiers.filter(m => m.product_id === product.id);
  }, [product, modifiers]);

  const getOptionsForModifier = (modifierId: string) => {
    return modifierOptions.filter(o => o.modifier_id === modifierId && o.is_available);
  };

  const handleOptionToggle = (modifier: Modifier, optionId: string) => {
    setSelectedOptions(prev => {
      const currentSelected = prev[modifier.id] || [];
      const isSelected = currentSelected.includes(optionId);
      
      if (modifier.max_selections === 1) {
        // Single selection (Radio behavior)
        if (isSelected && !modifier.is_required) {
          return { ...prev, [modifier.id]: [] };
        }
        return { ...prev, [modifier.id]: [optionId] };
      } else {
        // Multiple selection (Checkbox behavior)
        if (isSelected) {
          return { ...prev, [modifier.id]: currentSelected.filter(id => id !== optionId) };
        } else {
          if (currentSelected.length < modifier.max_selections) {
            return { ...prev, [modifier.id]: [...currentSelected, optionId] };
          }
          return prev; // Hit max limit
        }
      }
    });
  };

  const isRequirementMet = useMemo(() => {
    return productModifiers.every(mod => {
      const selectedCount = (selectedOptions[mod.id] || []).length;
      if (!mod.is_required) {
        if (selectedCount === 0) return true;
        return selectedCount <= mod.max_selections;
      }
      return selectedCount >= mod.min_selections && selectedCount <= mod.max_selections;
    });
  }, [productModifiers, selectedOptions]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    let total = Number(product.price);
    
    Object.entries(selectedOptions).forEach(([modifierId, optionIds]) => {
      optionIds.forEach(optId => {
        const option = modifierOptions.find(o => o.id === optId);
        if (option) {
          total += Number(option.price_adjustment);
        }
      });
    });
    
    return total * quantity;
  }, [product, selectedOptions, modifierOptions, quantity]);

  const handleAddToCart = () => {
    if (!isRequirementMet || !product) return;
    
    const cartModifiers: CartModifier[] = productModifiers.map(mod => {
      const selectedOptIds = selectedOptions[mod.id] || [];
      return {
        id: mod.id,
        name: mod.name,
        options: selectedOptIds.map(optId => {
          const opt = modifierOptions.find(o => o.id === optId)!;
          return {
            id: opt.id,
            name: opt.name,
            price_adjustment: Number(opt.price_adjustment)
          };
        })
      };
    }).filter(mod => mod.options.length > 0);

    onAddToCart(quantity, notes, cartModifiers);
    onClose();
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
        style={{ '--color-brand': brandColor } as React.CSSProperties}
      >
        {/* Header Image */}
        <div className="relative h-48 sm:h-56 shrink-0 bg-neutral-100">
          <img src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"} alt={product.name} className="w-full h-full object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-neutral-800 shadow-sm active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-neutral-50 p-5 space-y-6">
          
          {/* Title & Description */}
          <div>
            <h2 className="font-extrabold text-xl text-neutral-900 leading-tight">{product.name}</h2>
            <p className="text-xs text-neutral-500 mt-2 font-medium leading-relaxed">{product.description}</p>
            <p className="font-black text-brand text-lg mt-3">Rp {Number(product.price).toLocaleString("id-ID")}</p>
          </div>

          {/* Modifiers List */}
          {productModifiers.map(modifier => {
            const options = getOptionsForModifier(modifier.id);
            const selectedCount = (selectedOptions[modifier.id] || []).length;
            const isError = modifier.is_required && selectedCount < modifier.min_selections;
            
            return (
              <div key={modifier.id} className="bg-white border border-neutral-200/60 p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-800">{modifier.name}</h3>
                    <p className="text-[10px] text-neutral-400">
                      {modifier.is_required ? "Wajib" : "Opsional"} 
                      {modifier.max_selections > 1 ? ` • Pilih hingga ${modifier.max_selections}` : " • Pilih 1"}
                    </p>
                  </div>
                  {modifier.is_required && (
                    <span className={`text-[10px] px-2 py-0.5 rounded ${selectedCount >= modifier.min_selections ? "text-neutral-400 font-medium" : "text-neutral-600 font-semibold border border-neutral-200"}`}>
                      {selectedCount >= modifier.min_selections ? "Terpenuhi" : "Wajib"}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {options.map(opt => {
                    const isSelected = (selectedOptions[modifier.id] || []).includes(opt.id);
                    return (
                      <label 
                        key={opt.id} 
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${isSelected ? "border-brand bg-brand/5 shadow-sm" : "border-neutral-200 hover:bg-neutral-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Custom Radio/Checkbox UI */}
                          <div className={`w-4 h-4 rounded-${modifier.max_selections === 1 ? 'full' : 'sm'} border flex items-center justify-center ${isSelected ? "border-brand bg-brand" : "border-neutral-300"}`}>
                            {isSelected && (
                              <div className={`w-1.5 h-1.5 bg-white rounded-${modifier.max_selections === 1 ? 'full' : 'sm'}`} />
                            )}
                          </div>
                          <span className={`text-xs font-bold ${isSelected ? "text-neutral-900" : "text-neutral-700"}`}>{opt.name}</span>
                        </div>
                        {Number(opt.price_adjustment) > 0 ? (
                          <span className="text-[11px] font-medium text-neutral-500">+Rp {Number(opt.price_adjustment).toLocaleString("id-ID")}</span>
                        ) : (
                          <span className="text-[11px] font-normal text-neutral-400">Gratis</span>
                        )}
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={isSelected}
                          onChange={() => handleOptionToggle(modifier, opt.id)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Instructions (Notes) */}
          <div className="bg-white border border-neutral-200/60 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              <h3 className="font-extrabold text-sm text-neutral-800">Catatan Khusus</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Jangan pakai seledri, kuah dipisah..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none h-20 placeholder:text-neutral-400"
            />
          </div>

        </div>

        {/* Footer actions */}
        <div className="shrink-0 p-4 bg-white border-t border-neutral-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-neutral-800 text-sm">Jumlah</span>
            <div className="flex items-center gap-4 bg-neutral-100 rounded-full px-1 py-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-600 active:scale-90 transition-all cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-sm w-4 text-center text-neutral-800">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-brand text-white shadow-sm flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            disabled={!isRequirementMet}
            onClick={handleAddToCart}
            className={`w-full py-4 rounded-2xl flex items-center justify-between px-6 font-extrabold text-sm transition-all shadow-lg active:scale-95 ${
              isRequirementMet 
                ? "bg-brand hover:bg-brand-hover text-white shadow-brand/20 cursor-pointer" 
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Tambah ke Pesanan
            </span>
            <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
