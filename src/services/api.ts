import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Brand {
  id: string; code: string; name: string;
  logo_url: string | null; brand_color: string;
}
export interface Outlet {
  id: string; name: string; slug: string; brand_code: string;
  logo_url: string; brand_color: string; table_count: number;
  is_dine_in_enabled: boolean; is_takeaway_enabled: boolean; is_delivery_enabled: boolean;
  open_time: string; close_time: string;
}
export interface Category { id: string; outlet_id: string; name: string; }
export interface Product {
  id: string; outlet_id: string; category_id: string | null;
  name: string; price: number; description: string;
  image_url: string; is_recommended: boolean; is_available: boolean;
}
export interface Order {
  id: string; outlet_id: string; order_type: string; table_number: string | null;
  customer_name: string; customer_phone: string; status: string;
  payment_method: string; payment_status: string; total_amount: number; created_at: string;
  items?: any[];
}
export interface Profile { id: string; outlet_id: string | null; role: string; brand_code?: string; name?: string; phone?: string; email_notifications?: boolean; }
export interface ProductModifier {
  id: string; product_id: string; name: string;
  is_required: boolean; min_selections: number; max_selections: number;
}
export interface ProductModifierOption {
  id: string; modifier_id: string; name: string; price_adjustment: number; is_available: boolean;
}

// ─── API Service ──────────────────────────────────────────────────────────────
// Abstracting Supabase calls here so it's easier to migrate to MySQL/REST API later.

export const api = {
  // Brands
  brands: {
    fetchAll: async () => {
      const { data, error } = await supabase.from("brands").select("*").order("name");
      if (error) throw error;
      return data as Brand[];
    },
    fetchByCode: async (code: string) => {
      const { data, error } = await supabase.from("brands").select("*").eq("code", code).single();
      if (error) throw error;
      return data as Brand;
    },
    create: async (payload: Partial<Brand>) => {
      const { data, error } = await supabase.from("brands").insert(payload).select().single();
      if (error) throw error;
      return data as Brand;
    },
    update: async (id: string, payload: Partial<Brand>) => {
      const { data, error } = await supabase.from("brands").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data as Brand;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
    }
  },
  // Outlets
  outlets: {
    fetchAll: async () => {
      const { data, error } = await supabase.from("outlets").select("*").order("name");
      if (error) throw error;
      return data as Outlet[];
    },
    fetchByBrand: async (brandCode: string) => {
      const { data, error } = await supabase.from("outlets").select("*").eq("brand_code", brandCode).order("name");
      if (error) throw error;
      return data as Outlet[];
    },
    fetchById: async (id: string) => {
      const { data, error } = await supabase.from("outlets").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Outlet;
    },
    fetchBySlug: async (slug: string) => {
      const { data, error } = await supabase.from("outlets").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data as Outlet;
    },
    create: async (payload: Partial<Outlet>) => {
      const { data, error } = await supabase.from("outlets").insert(payload).select().single();
      if (error) throw error;
      return data as Outlet;
    },
    update: async (id: string, payload: Partial<Outlet>) => {
      const { data, error } = await supabase.from("outlets").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data as Outlet;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from("outlets").delete().eq("id", id);
      if (error) throw error;
    }
  },

  // Categories
  categories: {
    fetchByOutlet: async (outletId: string) => {
      const { data, error } = await supabase.from("categories").select("*").eq("outlet_id", outletId).order("name");
      if (error) throw error;
      return data as Category[];
    },
    create: async (payload: Partial<Category>) => {
      const { data, error } = await supabase.from("categories").insert(payload).select().single();
      if (error) throw error;
      return data as Category;
    },
    update: async (id: string, payload: Partial<Category>) => {
      const { data, error } = await supabase.from("categories").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data as Category;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    }
  },

  // Products
  products: {
    fetchByOutlet: async (outletId: string) => {
      const { data, error } = await supabase.from("products").select("*").eq("outlet_id", outletId).order("name");
      if (error) throw error;
      return data as Product[];
    },
    create: async (payload: Partial<Product>) => {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (error) throw error;
      return data as Product;
    },
    update: async (id: string, payload: Partial<Product>) => {
      const { data, error } = await supabase.from("products").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data as Product;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    }
  },

  // Modifiers
  modifiers: {
    fetchByProduct: async (productId: string) => {
      const { data, error } = await supabase.from("product_modifiers").select("*").eq("product_id", productId).order("created_at");
      if (error) throw error;
      return data as ProductModifier[];
    },
    create: async (payload: Partial<ProductModifier>) => {
      const { data, error } = await supabase.from("product_modifiers").insert(payload).select().single();
      if (error) throw error;
      return data as ProductModifier;
    },
    update: async (id: string, payload: Partial<ProductModifier>) => {
      const { data, error } = await supabase.from("product_modifiers").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data as ProductModifier;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from("product_modifiers").delete().eq("id", id);
      if (error) throw error;
    }
  },

  modifierOptions: {
    fetchByModifiers: async (modifierIds: string[]) => {
      if (modifierIds.length === 0) return [];
      const { data, error } = await supabase.from("product_modifier_options").select("*").in("modifier_id", modifierIds).order("created_at");
      if (error) throw error;
      return data as ProductModifierOption[];
    },
    create: async (payload: Partial<ProductModifierOption>) => {
      const { data, error } = await supabase.from("product_modifier_options").insert(payload).select().single();
      if (error) throw error;
      return data as ProductModifierOption;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from("product_modifier_options").delete().eq("id", id);
      if (error) throw error;
    }
  },

  // Orders
  orders: {
    fetchByOutlet: async (outletId: string, limit = 200) => {
      const { data, error } = await supabase.from("orders").select("*, items:order_items(*, product:products(*))").eq("outlet_id", outletId).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      
      const orders = data as Order[];
      if (orders.length > 0) {
        const itemIds = orders.flatMap(o => o.items?.map(i => i.id) || []);
        if (itemIds.length > 0) {
          const { data: modifiersData } = await supabase.from("order_item_modifiers").select("*").in("order_item_id", itemIds);
          if (modifiersData && modifiersData.length > 0) {
            orders.forEach(order => {
              order.items?.forEach(item => {
                item.modifiers = modifiersData.filter(m => m.order_item_id === item.id);
              });
            });
          }
        }
      }
      return orders;
    },
    updateStatus: async (id: string, status: string) => {
      const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data as Order;
    },
    updatePayment: async (id: string, payment_status: string, status: string) => {
      const { data, error } = await supabase.from("orders").update({ payment_status, status }).eq("id", id).select().single();
      if (error) throw error;
      return data as Order;
    }
  },

  // Profiles/Users
  profiles: {
    fetchAll: async () => {
      const { data, error } = await supabase.from("profiles").select("id, outlet_id, role, brand_code");
      if (error) throw error;
      return data as Profile[];
    },
    updateOutletId: async (id: string, outlet_id: string) => {
      const { data, error } = await supabase.from("profiles").update({ outlet_id }).eq("id", id).select().single();
      if (error) throw error;
      return data as Profile;
    }
  },

  // Customer operations
  customers: {
    getProfile: async (userId: string) => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      return data as Profile;
    },
    updateProfile: async (userId: string, updates: Partial<Profile>) => {
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
      if (error) throw error;
      return data as Profile;
    },
    getOrders: async (userId: string) => {
      const { data, error } = await supabase.from("orders").select("*, items:order_items(*, product:products(*))").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;

      const orders = data as Order[];
      if (orders.length > 0) {
        const itemIds = orders.flatMap(o => o.items?.map(i => i.id) || []);
        if (itemIds.length > 0) {
          const { data: modifiersData } = await supabase.from("order_item_modifiers").select("*").in("order_item_id", itemIds);
          if (modifiersData && modifiersData.length > 0) {
            orders.forEach(order => {
              order.items?.forEach(item => {
                item.modifiers = modifiersData.filter(m => m.order_item_id === item.id);
              });
            });
          }
        }
      }
      return orders;
    }
  }
};
