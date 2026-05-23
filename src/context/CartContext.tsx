import React, { createContext, useContext, useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export interface CartModifierOption {
  id: string;
  name: string;
  price_adjustment: number;
}

export interface CartModifier {
  id: string;
  name: string;
  options: CartModifierOption[];
}

export interface CartItem {
  cartItemId: string;
  id: string;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  notes?: string;
  modifiers?: CartModifier[];
}

interface CartContextType {
  cart: CartItem[];
  cartOutletId: string;
  setCartOutletId: (id: string) => void;
  orderType: "dinein" | "takeaway" | "delivery";
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  generalNote: string;
  sendReceipt: boolean;
  paymentMethod: "qris" | "cash";
  taxPercentage: number;
  isTaxEnabled: boolean;
  // Delivery address fields
  deliveryAddress: string;
  deliveryNote: string;
  setDeliveryAddress: (addr: string) => void;
  setDeliveryNote: (note: string) => void;
  addToCart: (
    product: { id: string; name: string; price: number; image_url?: string },
    quantity?: number,
    notes?: string,
    modifiers?: CartModifier[]
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateNotes: (cartItemId: string, notes: string) => void;
  clearCart: () => void;
  setOrderType: (type: "dinein" | "takeaway" | "delivery") => void;
  setTableNumber: (num: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerEmail: (email: string) => void;
  setGeneralNote: (note: string) => void;
  setSendReceipt: (val: boolean) => void;
  setPaymentMethod: (method: "qris" | "cash") => void;
  setTaxConfig: (enabled: boolean, percentage: number) => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function areModifiersEqual(mods1?: CartModifier[], mods2?: CartModifier[]) {
  if (!mods1 && !mods2) return true;
  if (!mods1 || !mods2) return false;
  if (mods1.length !== mods2.length) return false;
  const normalize = (mods: CartModifier[]) =>
    mods.map(m => ({ ...m, options: [...m.options].sort((a, b) => a.id.localeCompare(b.id)) }))
        .sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(normalize(mods1)) === JSON.stringify(normalize(mods2));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOutletId, setCartOutletIdState] = useState<string>("");
  const [orderType, setOrderTypeState] = useState<"dinein" | "takeaway" | "delivery">("takeaway");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [customerName, setCustomerNameState] = useState<string>(() => localStorage.getItem("omniorder_customer_name") ?? "");
  const [customerPhone, setCustomerPhoneState] = useState<string>(() => localStorage.getItem("omniorder_customer_phone") ?? "");
  const [customerEmail, setCustomerEmailState] = useState<string>(() => localStorage.getItem("omniorder_customer_email") ?? "");
  const [generalNote, setGeneralNote] = useState<string>("");
  const [sendReceipt, setSendReceiptState] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash">("qris");
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(false);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  // Delivery address
  const [deliveryAddress, setDeliveryAddressState] = useState<string>("");
  const [deliveryNote, setDeliveryNoteState] = useState<string>("");

  const setCustomerName = (name: string) => {
    setCustomerNameState(name);
    localStorage.setItem("omniorder_customer_name", name);
  };

  const setCustomerPhone = (phone: string) => {
    setCustomerPhoneState(phone);
    localStorage.setItem("omniorder_customer_phone", phone);
  };

  const setCustomerEmail = (email: string) => {
    setCustomerEmailState(email);
    localStorage.setItem("omniorder_customer_email", email);
  };

  const setSendReceipt = (val: boolean) => {
    setSendReceiptState(true);
  };

  const setDeliveryAddress = (addr: string) => {
    setDeliveryAddressState(addr);
    localStorage.setItem("omniorder_delivery_address", addr);
  };

  const setDeliveryNote = (note: string) => {
    setDeliveryNoteState(note);
    localStorage.setItem("omniorder_delivery_note", note);
  };

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const savedCart = localStorage.getItem("omniorder_cart");
    const savedOutletId = localStorage.getItem("omniorder_cart_outlet_id");
    const savedAddress = localStorage.getItem("omniorder_delivery_address");
    const savedNote = localStorage.getItem("omniorder_delivery_note");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("Gagal memuat keranjang", e); }
    }
    if (savedOutletId) setCartOutletIdState(savedOutletId);
    if (savedAddress) setDeliveryAddressState(savedAddress);
    if (savedNote) setDeliveryNoteState(savedNote);
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("omniorder_cart", JSON.stringify(newCart));
  };

  const setCartOutletId = (newOutletId: string) => {
    if (!newOutletId) return;
    const savedOutletId = localStorage.getItem("omniorder_cart_outlet_id") || "";
    if (savedOutletId && savedOutletId !== newOutletId) {
      setCart([]);
      localStorage.removeItem("omniorder_cart");
    }
    setCartOutletIdState(newOutletId);
    localStorage.setItem("omniorder_cart_outlet_id", newOutletId);
  };

  const setTaxConfig = (enabled: boolean, percentage: number) => {
    setIsTaxEnabled(enabled);
    setTaxPercentage(percentage);
  };

  const addToCart = (
    product: { id: string; name: string; price: number; image_url?: string },
    quantity: number = 1,
    notes?: string,
    modifiers?: CartModifier[]
  ) => {
    const existingIndex = cart.findIndex(
      (item) => item.id === product.id && item.notes === notes && areModifiersEqual(item.modifiers, modifiers)
    );
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      saveCart(newCart);
    } else {
      const cartItemId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      saveCart([...cart, { ...product, cartItemId, quantity, notes, modifiers }]);
    }
  };

  const removeFromCart = (cartItemId: string) => saveCart(cart.filter((item) => item.cartItemId !== cartItemId));

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(cartItemId); return; }
    saveCart(cart.map((item) => item.cartItemId === cartItemId ? { ...item, quantity } : item));
  };

  const updateNotes = (cartItemId: string, notes: string) =>
    saveCart(cart.map((item) => item.cartItemId === cartItemId ? { ...item, notes } : item));

  const clearCart = () => {
    saveCart([]);
    localStorage.removeItem("omniorder_cart");
  };

  const setOrderType = (type: "dinein" | "takeaway" | "delivery") => {
    setOrderTypeState(type);
    if (type !== "dinein") setTableNumber("");
  };

  const calculateItemTotal = (item: CartItem) => {
    const modifiersTotal = (item.modifiers || []).reduce((acc, mod) =>
      acc + mod.options.reduce((sum, opt) => sum + Number(opt.price_adjustment), 0), 0);
    return (Number(item.price) + modifiersTotal) * item.quantity;
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const cartTax = isTaxEnabled ? (cartSubtotal * taxPercentage) / 100 : 0;
  const cartTotal = cartSubtotal + cartTax;

  return (
    <CartContext.Provider
      value={{
        cart, cartOutletId, setCartOutletId,
        orderType, tableNumber,
        customerName,
        customerPhone,
        customerEmail,
        generalNote,
        sendReceipt,
        paymentMethod, taxPercentage, isTaxEnabled,
        deliveryAddress, deliveryNote, setDeliveryAddress, setDeliveryNote,
        addToCart, removeFromCart, updateQuantity, updateNotes, clearCart,
        setOrderType, setTableNumber, setCustomerName, setCustomerPhone,
        setCustomerEmail, setGeneralNote, setSendReceipt, setPaymentMethod,
        setTaxConfig, cartSubtotal, cartTax, cartTotal, toast, showToast,
      }}
    >
      {children}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-9999 w-11/12 max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold bg-white/95 backdrop-blur-md ${
            toast.type === "success" ? "border-emerald-100 text-emerald-800"
            : toast.type === "error" ? "border-rose-100 text-rose-800"
            : "border-blue-100 text-blue-800"
          }`}>
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            <span className="flex-1 leading-snug">{toast.message}</span>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error("useCart must be used within a CartProvider");
  return context;
}
