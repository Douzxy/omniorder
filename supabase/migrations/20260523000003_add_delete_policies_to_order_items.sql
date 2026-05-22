-- Add DELETE policies for order_items and order_item_modifiers to allow admins to edit and delete items.
CREATE POLICY "Admin delete order items" ON order_items FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles
        LEFT JOIN orders ord ON ord.id = order_items.order_id
        LEFT JOIN outlets o ON o.id = ord.outlet_id
        WHERE profiles.id = auth.uid()
          AND (profiles.role = 'super_admin' OR (profiles.role = 'brand_admin' AND profiles.brand_code = o.brand_code) OR (profiles.role = 'outlet_admin' AND profiles.outlet_id = ord.outlet_id))
    )
);

CREATE POLICY "Admin delete order item modifiers" ON order_item_modifiers FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles
        LEFT JOIN order_items oi ON oi.id = order_item_modifiers.order_item_id
        LEFT JOIN orders ord ON ord.id = oi.order_id
        LEFT JOIN outlets o ON o.id = ord.outlet_id
        WHERE profiles.id = auth.uid()
          AND (profiles.role = 'super_admin' OR (profiles.role = 'brand_admin' AND profiles.brand_code = o.brand_code) OR (profiles.role = 'outlet_admin' AND profiles.outlet_id = ord.outlet_id))
    )
);
