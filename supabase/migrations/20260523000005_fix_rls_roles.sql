-- Drop old policies
DROP POLICY IF EXISTS "Admin update outlets" ON outlets;
DROP POLICY IF EXISTS "Admin delete outlets" ON outlets;
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
DROP POLICY IF EXISTS "Admin manage products" ON products;
DROP POLICY IF EXISTS "Admin manage modifiers" ON product_modifiers;
DROP POLICY IF EXISTS "Admin manage modifier options" ON product_modifier_options;
DROP POLICY IF EXISTS "Admin update orders" ON orders;
DROP POLICY IF EXISTS "Admin update order items" ON order_items;
DROP POLICY IF EXISTS "Admin delete order items" ON order_items;
DROP POLICY IF EXISTS "Admin delete order item modifiers" ON order_item_modifiers;

-- Recreate policies supporting: 'super_admin', 'brand_admin', 'admin', 'outlet_admin', 'manager', and 'kasir'

CREATE POLICY "Admin update outlets" ON outlets FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = outlets.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = outlets.id)
          )
    )
);

CREATE POLICY "Admin delete outlets" ON outlets FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = outlets.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = outlets.id)
          )
    )
);

CREATE POLICY "Admin manage categories" ON categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        LEFT JOIN outlets o ON o.id = categories.outlet_id 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = o.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = categories.outlet_id)
          )
    )
);

CREATE POLICY "Admin manage products" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        LEFT JOIN outlets o ON o.id = products.outlet_id 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = o.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = products.outlet_id)
          )
    )
);

CREATE POLICY "Admin manage modifiers" ON product_modifiers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        LEFT JOIN products p ON p.id = product_modifiers.product_id 
        LEFT JOIN outlets o ON o.id = p.outlet_id 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = o.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = p.outlet_id)
          )
    )
);

CREATE POLICY "Admin manage modifier options" ON product_modifier_options FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        LEFT JOIN product_modifiers m ON m.id = product_modifier_options.modifier_id 
        LEFT JOIN products p ON p.id = m.product_id 
        LEFT JOIN outlets o ON o.id = p.outlet_id 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = o.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = p.outlet_id)
          )
    )
);

CREATE POLICY "Admin update orders" ON orders FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        LEFT JOIN outlets o ON o.id = orders.outlet_id 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = o.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = orders.outlet_id)
          )
    )
);

CREATE POLICY "Admin update order items" ON order_items FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        LEFT JOIN orders ord ON ord.id = order_items.order_id 
        LEFT JOIN outlets o ON o.id = ord.outlet_id 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = o.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = ord.outlet_id)
          )
    )
);

CREATE POLICY "Admin delete order items" ON order_items FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        LEFT JOIN orders ord ON ord.id = order_items.order_id 
        LEFT JOIN outlets o ON o.id = ord.outlet_id 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = o.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = ord.outlet_id)
          )
    )
);

CREATE POLICY "Admin delete order item modifiers" ON order_item_modifiers FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        LEFT JOIN order_items oi ON oi.id = order_item_modifiers.order_item_id 
        LEFT JOIN orders ord ON ord.id = oi.order_id 
        LEFT JOIN outlets o ON o.id = ord.outlet_id 
        WHERE profiles.id = auth.uid() 
          AND (
            profiles.role = 'super_admin' 
            OR (profiles.role IN ('brand_admin', 'admin') AND profiles.brand_code = o.brand_code) 
            OR (profiles.role IN ('outlet_admin', 'manager', 'kasir') AND profiles.outlet_id = ord.outlet_id)
          )
    )
);
