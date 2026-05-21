-- =========================================================================
-- SEED DATA: Demo Data untuk OmniOrder
-- Jalankan setelah schema.sql
-- =========================================================================

-- =========================================================================
-- 1. Outlets (6 Outlet, 2 Brand)
-- =========================================================================
INSERT INTO outlets (id, name, slug, brand_code, logo_url, brand_color, table_count, is_dine_in_enabled, is_takeaway_enabled, is_delivery_enabled, tax_percentage, is_tax_enabled)
VALUES
  ('d29078c8-1111-4231-89d8-9cd3ef2fb901', 'Mie Gacoan Margonda', 'gacoan-margonda', 'gacoan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=120&fit=crop', '#ea580c', 30, true, true, false, 11, true),
  ('d29078c8-2222-4231-89d8-9cd3ef2fb902', 'Mie Gacoan Ciater', 'gacoan-ciater', 'gacoan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=120&fit=crop', '#ea580c', 25, true, true, false, 11, true),
  ('d29078c8-3333-4231-89d8-9cd3ef2fb903', 'Mie Gacoan Sawangan', 'gacoan-sawangan', 'gacoan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=120&fit=crop', '#ea580c', 20, true, true, true, 11, true),
  ('d29078c8-4444-4231-89d8-9cd3ef2fb904', 'Kopi Kenangan Mall Depok', 'kenangan-depok', 'kenangan', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=120&fit=crop', '#78350f', 8, true, true, true, 11, false),
  ('d29078c8-5555-4231-89d8-9cd3ef2fb905', 'Kopi Kenangan GI', 'kenangan-gi', 'kenangan', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=120&fit=crop', '#78350f', 6, true, true, true, 11, false),
  ('d29078c8-6666-4231-89d8-9cd3ef2fb906', 'Bakso Malang Karapitan', 'bakso-karapitan', 'bakso', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=240&h=120&fit=crop', '#dc2626', 20, true, true, true, 0, false);

-- =========================================================================
-- 2. Auth Users & Profiles
-- Password: SuperAdmin123! (untuk super_admin)
-- Password: password123 (untuk admin & manager)
-- =========================================================================

-- Super Admin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'superadmin@omniorder.com', crypt('SuperAdmin123!', gen_salt('bf')), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', '{"sub":"a0000000-0000-0000-0000-000000000001","email":"superadmin@omniorder.com"}', 'email', 'a0000000-0000-0000-0000-000000000001', NOW(), NOW(), NOW());
INSERT INTO profiles (id, role) VALUES ('a0000000-0000-0000-0000-000000000001', 'super_admin');

-- Admin Gacoan (mengelola semua outlet Gacoan)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'admin@gacoan.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000002', '{"sub":"a0000000-0000-0000-0000-000000000002","email":"admin@gacoan.com"}', 'email', 'a0000000-0000-0000-0000-000000000002', NOW(), NOW(), NOW());
INSERT INTO profiles (id, brand_code, role) VALUES ('a0000000-0000-0000-0000-000000000002', 'gacoan', 'admin');

-- Manager Gacoan Margonda
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'manager@gacoan-margonda.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000003', '{"sub":"a0000000-0000-0000-0000-000000000003","email":"manager@gacoan-margonda.com"}', 'email', 'a0000000-0000-0000-0000-000000000003', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, role) VALUES ('a0000000-0000-0000-0000-000000000003', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'manager');

-- Manager Kopi Kenangan Depok
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'manager@kenangan-depok.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000004', '{"sub":"a0000000-0000-0000-0000-000000000004","email":"manager@kenangan-depok.com"}', 'email', 'a0000000-0000-0000-0000-000000000004', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, role) VALUES ('a0000000-0000-0000-0000-000000000004', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'manager');

-- =========================================================================
-- 3. Categories (per outlet)
-- =========================================================================

-- Gacoan Margonda
INSERT INTO categories (id, outlet_id, name) VALUES
  ('c0000001-0001-0001-0001-000000000001', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'Mie'),
  ('c0000001-0001-0001-0001-000000000002', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'Dimsum'),
  ('c0000001-0001-0001-0001-000000000003', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'Minuman'),
  ('c0000001-0001-0001-0001-000000000004', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'Snack');

-- Gacoan Ciater
INSERT INTO categories (id, outlet_id, name) VALUES
  ('c0000002-0001-0001-0001-000000000001', 'd29078c8-2222-4231-89d8-9cd3ef2fb902', 'Mie'),
  ('c0000002-0001-0001-0001-000000000002', 'd29078c8-2222-4231-89d8-9cd3ef2fb902', 'Dimsum'),
  ('c0000002-0001-0001-0001-000000000003', 'd29078c8-2222-4231-89d8-9cd3ef2fb902', 'Minuman');

-- Kopi Kenangan Depok
INSERT INTO categories (id, outlet_id, name) VALUES
  ('c0000004-0001-0001-0001-000000000001', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'Kopi'),
  ('c0000004-0001-0001-0001-000000000002', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'Non-Kopi'),
  ('c0000004-0001-0001-0001-000000000003', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'Makanan Ringan');

-- Bakso Karapitan
INSERT INTO categories (id, outlet_id, name) VALUES
  ('c0000006-0001-0001-0001-000000000001', 'd29078c8-6666-4231-89d8-9cd3ef2fb906', 'Bakso'),
  ('c0000006-0001-0001-0001-000000000002', 'd29078c8-6666-4231-89d8-9cd3ef2fb906', 'Mie & Bihun'),
  ('c0000006-0001-0001-0001-000000000003', 'd29078c8-6666-4231-89d8-9cd3ef2fb906', 'Minuman');

-- =========================================================================
-- 4. Products
-- =========================================================================

-- Gacoan Margonda - Mie
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
  ('p0000001-0001-0001-0001-000000000001', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000001', 'Mie Suit', 10000, 'Mie pedas khas Gacoan dengan bumbu rahasia.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p0000001-0001-0001-0001-000000000002', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000001', 'Mie Hompimpa', 10000, 'Mie ayam jamur dengan kuah kaldu spesial.', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', true, true),
  ('p0000001-0001-0001-0001-000000000003', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000001', 'Mie Angel', 12000, 'Mie spesial premium dengan topping lengkap.', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', false, true),
  ('p0000001-0001-0001-0001-000000000004', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000001', 'Mie Iblis', 13000, 'Mie super pedas dengan cabai pilihan.', 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400', false, true);

-- Gacoan Margonda - Dimsum
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
  ('p0000001-0001-0001-0001-000000000005', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000002', 'Siomay Ayam (4 pcs)', 10000, 'Dimsum siomay dengan isian ayam premium.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true),
  ('p0000001-0001-0001-0001-000000000006', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000002', 'Lumpia Udang (3 pcs)', 12000, 'Lumpia garing dengan isian udang segar.', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', true, true),
  ('p0000001-0001-0001-0001-000000000007', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000002', 'Pangsit Goreng (5 pcs)', 10000, 'Pangsit renyah berisi daging ayam cincang.', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true);

-- Gacoan Margonda - Minuman
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
  ('p0000001-0001-0001-0001-000000000008', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000003', 'Es Teh Manis', 5000, 'Teh manis dingin segar.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p0000001-0001-0001-0001-000000000009', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000003', 'Es Jeruk', 7000, 'Jeruk peras segar dengan es batu.', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true),
  ('p0000001-0001-0001-0001-000000000010', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000003', 'Kopi Susu Gula Aren', 12000, 'Espresso dengan susu dan gula aren premium.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true);

-- Gacoan Margonda - Snack
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
  ('p0000001-0001-0001-0001-000000000011', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000004', 'Udang Rambutan (3 pcs)', 10000, 'Udang goreng tepung renyah.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', false, true),
  ('p0000001-0001-0001-0001-000000000012', 'd29078c8-1111-4231-89d8-9cd3ef2fb901', 'c0000001-0001-0001-0001-000000000004', 'Kentang Goreng', 8000, 'Kentang goreng crispy dengan saus sambal.', 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400', false, false);

-- Kopi Kenangan Depok
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
  ('p0000004-0001-0001-0001-000000000001', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'c0000004-0001-0001-0001-000000000001', 'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren pilihan.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
  ('p0000004-0001-0001-0001-000000000002', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'c0000004-0001-0001-0001-000000000001', 'Americano', 18000, 'Espresso murni dengan air panas.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', false, true),
  ('p0000004-0001-0001-0001-000000000003', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'c0000004-0001-0001-0001-000000000001', 'Cappuccino', 22000, 'Espresso dengan susu dan busa susu lembut.', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', false, true),
  ('p0000004-0001-0001-0001-000000000004', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'c0000004-0001-0001-0001-000000000002', 'Matcha Latte', 25000, 'Matcha premium Jepang dengan susu segar.', 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true),
  ('p0000004-0001-0001-0001-000000000005', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'c0000004-0001-0001-0001-000000000002', 'Coklat', 22000, 'Coklat Belgia premium dengan susu segar.', 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400', false, true),
  ('p0000004-0001-0001-0001-000000000006', 'd29078c8-4444-4231-89d8-9cd3ef2fb904', 'c0000004-0001-0001-0001-000000000003', 'Roti Bakar', 15000, 'Roti bakar dengan mentega dan selai.', 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400', false, true);

-- Bakso Karapitan
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
  ('p0000006-0001-0001-0001-000000000001', 'd29078c8-6666-4231-89d8-9cd3ef2fb906', 'c0000006-0001-0001-0001-000000000001', 'Bakso Urat Jumbo', 20000, 'Bakso daging sapi dengan urat, ukuran jumbo.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
  ('p0000006-0001-0001-0001-000000000002', 'd29078c8-6666-4231-89d8-9cd3ef2fb906', 'c0000006-0001-0001-0001-000000000001', 'Bakso Telur', 18000, 'Bakso jumbo berisi telur puyuh di dalamnya.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', false, true),
  ('p0000006-0001-0001-0001-000000000003', 'd29078c8-6666-4231-89d8-9cd3ef2fb906', 'c0000006-0001-0001-0001-000000000002', 'Mie Ayam Bakso', 18000, 'Mie ayam pangsit dengan bakso urat.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p0000006-0001-0001-0001-000000000004', 'd29078c8-6666-4231-89d8-9cd3ef2fb906', 'c0000006-0001-0001-0001-000000000003', 'Es Teh Tawar', 3000, 'Teh tawar tanpa gula, dingin.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true);

-- =========================================================================
-- 5. Product Modifiers & Options (Kustomisasi Produk)
-- =========================================================================

-- Mie Suit - Level Pedas (Wajib pilih 1)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('m0000001-0001-0001-0001-000000000001', 'p0000001-0001-0001-0001-000000000001', 'Level Pedas', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) VALUES
  ('m0000001-0001-0001-0001-000000000001', 'Level 0 (Tidak Pedas)', 0),
  ('m0000001-0001-0001-0001-000000000001', 'Level 1 (Sedikit Pedas)', 0),
  ('m0000001-0001-0001-0001-000000000001', 'Level 2 (Sedang)', 0),
  ('m0000001-0001-0001-0001-000000000001', 'Level 3 (Pedas)', 0),
  ('m0000001-0001-0001-0001-000000000001', 'Level 4 (Sangat Pedas)', 0),
  ('m0000001-0001-0001-0001-000000000001', 'Level 5 (Mampus)', 2000);

-- Mie Hompimpa - Level Pedas
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('m0000001-0001-0001-0001-000000000002', 'p0000001-0001-0001-0001-000000000002', 'Level Pedas', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) VALUES
  ('m0000001-0001-0001-0001-000000000002', 'Level 0 (Tidak Pedas)', 0),
  ('m0000001-0001-0001-0001-000000000002', 'Level 1 (Sedikit Pedas)', 0),
  ('m0000001-0001-0001-0001-000000000002', 'Level 2 (Sedang)', 0),
  ('m0000001-0001-0001-0001-000000000002', 'Level 3 (Pedas)', 0),
  ('m0000001-0001-0001-0001-000000000002', 'Level 4 (Sangat Pedas)', 0),
  ('m0000001-0001-0001-0001-000000000002', 'Level 5 (Mampus)', 2000);

-- Mie Suit - Extra Topping (Opsional, bisa pilih beberapa)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('m0000001-0001-0001-0001-000000000003', 'p0000001-0001-0001-0001-000000000001', 'Extra Topping', false, 0, 5);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) VALUES
  ('m0000001-0001-0001-0001-000000000003', 'Telur Ceplok', 3000),
  ('m0000001-0001-0001-0001-000000000003', 'Pangsit Goreng', 4000),
  ('m0000001-0001-0001-0001-000000000003', 'Udang Rambutan', 5000),
  ('m0000001-0001-0001-0001-000000000003', 'Ceker Ayam', 5000);

-- Kenangan Latte - Ukuran (Wajib 1)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('m0000004-0001-0001-0001-000000000001', 'p0000004-0001-0001-0001-000000000001', 'Ukuran', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) VALUES
  ('m0000004-0001-0001-0001-000000000001', 'Regular', 0),
  ('m0000004-0001-0001-0001-000000000001', 'Large', 6000);

-- Kenangan Latte - Gula (Wajib 1)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('m0000004-0001-0001-0001-000000000002', 'p0000004-0001-0001-0001-000000000001', 'Level Gula', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) VALUES
  ('m0000004-0001-0001-0001-000000000002', 'Normal', 0),
  ('m0000004-0001-0001-0001-000000000002', 'Less Sugar', 0),
  ('m0000004-0001-0001-0001-000000000002', 'No Sugar', 0);

-- Kenangan Latte - Extra (Opsional, bisa pilih beberapa)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('m0000004-0001-0001-0001-000000000003', 'p0000004-0001-0001-0001-000000000001', 'Extra', false, 0, 3);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) VALUES
  ('m0000004-0001-0001-0001-000000000003', 'Extra Shot Espresso', 5000),
  ('m0000004-0001-0001-0001-000000000003', 'Boba', 5000),
  ('m0000004-0001-0001-0001-000000000003', 'Whipped Cream', 3000);
