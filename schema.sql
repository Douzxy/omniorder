-- =========================================================================
-- MASTER SCHEMA SETUP
-- =========================================================================

-- 1. Bersihkan tabel lama (Hati-hati: Menghapus semua data!)
DROP TABLE IF EXISTS order_item_modifiers CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_modifier_options CASCADE;
DROP TABLE IF EXISTS product_modifiers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS outlets CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 2. DDL: Definisi Tabel
-- =========================================================================

CREATE TABLE outlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    brand_code TEXT NOT NULL DEFAULT 'APP',
    logo_url TEXT,
    brand_color TEXT NOT NULL DEFAULT '#2563eb',
    table_count INTEGER NOT NULL DEFAULT 10,
    is_dine_in_enabled BOOLEAN NOT NULL DEFAULT true,
    is_takeaway_enabled BOOLEAN NOT NULL DEFAULT true,
    is_delivery_enabled BOOLEAN NOT NULL DEFAULT true,
    tax_percentage INTEGER NOT NULL DEFAULT 0,
    is_tax_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
    brand_code TEXT,
    role TEXT NOT NULL DEFAULT 'manager',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_recommended BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    min_selections INTEGER NOT NULL DEFAULT 1,
    max_selections INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_modifier_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modifier_id UUID REFERENCES product_modifiers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE NOT NULL,
    order_code TEXT NOT NULL,
    order_type TEXT NOT NULL,
    table_number TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    customer_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT
);

CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
    modifier_name TEXT NOT NULL,
    option_name TEXT NOT NULL,
    price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- =========================================================================
-- 3. Storage Config
-- =========================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- =========================================================================
-- 4. RLS & Keamanan
-- =========================================================================

ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;

-- Helper macro condition for Outlet Access
-- Kondisi: User adalah admin dari brand tersebut, ATAU manager dari outlet tersebut, ATAU super_admin.
-- Catatan: RLS di Supabase tidak merekomendasikan JOIN yang kompleks, tapi ini aman untuk skala kecil/menengah.

CREATE POLICY "Public read outlets" ON outlets FOR SELECT USING (true);
CREATE POLICY "Admin update outlets" ON outlets FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'super_admin' OR (profiles.role = 'admin' AND profiles.brand_code = outlets.brand_code) OR (profiles.role = 'manager' AND profiles.outlet_id = outlets.id)))
);
CREATE POLICY "Admin delete outlets" ON outlets FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'super_admin' OR (profiles.role = 'admin' AND profiles.brand_code = outlets.brand_code) OR (profiles.role = 'manager' AND profiles.outlet_id = outlets.id)))
);
CREATE POLICY "Admin insert outlets" ON outlets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Self update profiles" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin insert profiles" ON profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles LEFT JOIN outlets o ON o.id = categories.outlet_id WHERE profiles.id = auth.uid() AND (profiles.role = 'super_admin' OR (profiles.role = 'admin' AND profiles.brand_code = o.brand_code) OR (profiles.role = 'manager' AND profiles.outlet_id = categories.outlet_id)))
);

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin manage products" ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles LEFT JOIN outlets o ON o.id = products.outlet_id WHERE profiles.id = auth.uid() AND (profiles.role = 'super_admin' OR (profiles.role = 'admin' AND profiles.brand_code = o.brand_code) OR (profiles.role = 'manager' AND profiles.outlet_id = products.outlet_id)))
);

CREATE POLICY "Public read modifiers" ON product_modifiers FOR SELECT USING (true);
CREATE POLICY "Admin manage modifiers" ON product_modifiers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles LEFT JOIN products p ON p.id = product_modifiers.product_id LEFT JOIN outlets o ON o.id = p.outlet_id WHERE profiles.id = auth.uid() AND (profiles.role = 'super_admin' OR (profiles.role = 'admin' AND profiles.brand_code = o.brand_code) OR (profiles.role = 'manager' AND profiles.outlet_id = p.outlet_id)))
);

CREATE POLICY "Public read modifier options" ON product_modifier_options FOR SELECT USING (true);
CREATE POLICY "Admin manage modifier options" ON product_modifier_options FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles LEFT JOIN product_modifiers m ON m.id = product_modifier_options.modifier_id LEFT JOIN products p ON p.id = m.product_id LEFT JOIN outlets o ON o.id = p.outlet_id WHERE profiles.id = auth.uid() AND (profiles.role = 'super_admin' OR (profiles.role = 'admin' AND profiles.brand_code = o.brand_code) OR (profiles.role = 'manager' AND profiles.outlet_id = p.outlet_id)))
);

CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles LEFT JOIN outlets o ON o.id = orders.outlet_id WHERE profiles.id = auth.uid() AND (profiles.role = 'super_admin' OR (profiles.role = 'admin' AND profiles.brand_code = o.brand_code) OR (profiles.role = 'manager' AND profiles.outlet_id = orders.outlet_id)))
);

CREATE POLICY "Public insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Admin update order items" ON order_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles LEFT JOIN orders ord ON ord.id = order_items.order_id LEFT JOIN outlets o ON o.id = ord.outlet_id WHERE profiles.id = auth.uid() AND (profiles.role = 'super_admin' OR (profiles.role = 'admin' AND profiles.brand_code = o.brand_code) OR (profiles.role = 'manager' AND profiles.outlet_id = ord.outlet_id)))
);

CREATE POLICY "Public insert order modifiers" ON order_item_modifiers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order modifiers" ON order_item_modifiers FOR SELECT USING (true);
