-- =========================================================================
-- SEED DATA: Demo Data Lengkap untuk OmniOrder
-- 3 Brand: Mie Gacoan (5 outlet), Kopi Kenangan (4 outlet), Bakso Malang (3 outlet)
-- Jalankan SETELAH schema.sql
-- =========================================================================

-- =========================================================================
-- 1. HAPUS DATA LAMA (urutan terbalik untuk menghindari FK violation)
-- =========================================================================
DELETE FROM order_item_modifiers;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM product_modifier_options;
DELETE FROM product_modifiers;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM outlets;
-- Hapus auth users seeder (kecuali yang mungkin sudah ada)
DELETE FROM auth.identities WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000013',
  'a0000000-0000-0000-0000-000000000014',
  'a0000000-0000-0000-0000-000000000015',
  'a0000000-0000-0000-0000-000000000016'
);
DELETE FROM auth.users WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000013',
  'a0000000-0000-0000-0000-000000000014',
  'a0000000-0000-0000-0000-000000000015',
  'a0000000-0000-0000-0000-000000000016'
);

-- =========================================================================
-- 2. OUTLETS (12 outlet, 3 brand)
-- =========================================================================
INSERT INTO outlets (id, name, slug, brand_code, logo_url, brand_color, table_count, is_dine_in_enabled, is_takeaway_enabled, is_delivery_enabled, tax_percentage, is_tax_enabled)
VALUES
  -- === BRAND: GACOAN (Mie Gacoan) — 5 outlet ===
  ('o1000000-0001-0000-0000-000000000001', 'Mie Gacoan Margonda', 'gacoan-margonda', 'GACOAN',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=120&fit=crop', '#ea580c',
   30, true, true, false, 11, true),

  ('o1000000-0002-0000-0000-000000000002', 'Mie Gacoan Ciater', 'gacoan-ciater', 'GACOAN',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=120&fit=crop', '#ea580c',
   25, true, true, false, 11, true),

  ('o1000000-0003-0000-0000-000000000003', 'Mie Gacoan Sawangan', 'gacoan-sawangan', 'GACOAN',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=120&fit=crop', '#ea580c',
   20, true, true, true, 11, true),

  ('o1000000-0004-0000-0000-000000000004', 'Mie Gacoan Cinere', 'gacoan-cinere', 'GACOAN',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=120&fit=crop', '#ea580c',
   18, true, true, false, 11, true),

  ('o1000000-0005-0000-0000-000000000005', 'Mie Gacoan Beji', 'gacoan-beji', 'GACOAN',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=120&fit=crop', '#ea580c',
   22, true, false, false, 11, true),

  -- === BRAND: KENANGAN (Kopi Kenangan) — 4 outlet ===
  ('o2000000-0001-0000-0000-000000000001', 'Kopi Kenangan Mall Depok', 'kenangan-mall-depok', 'KENANGAN',
   'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=120&fit=crop', '#78350f',
   8, true, true, true, 11, false),

  ('o2000000-0002-0000-0000-000000000002', 'Kopi Kenangan Grand Indonesia', 'kenangan-grand-indonesia', 'KENANGAN',
   'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=120&fit=crop', '#78350f',
   6, true, true, true, 11, false),

  ('o2000000-0003-0000-0000-000000000003', 'Kopi Kenangan Pondok Indah', 'kenangan-pondok-indah', 'KENANGAN',
   'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=120&fit=crop', '#78350f',
   10, true, true, false, 11, false),

  ('o2000000-0004-0000-0000-000000000004', 'Kopi Kenangan Sudirman', 'kenangan-sudirman', 'KENANGAN',
   'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=120&fit=crop', '#78350f',
   5, true, true, true, 11, false),

  -- === BRAND: BAKSO (Bakso Malang Karapitan) — 3 outlet ===
  ('o3000000-0001-0000-0000-000000000001', 'Bakso Malang Karapitan Depok', 'bakso-karapitan-depok', 'BAKSO',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=240&h=120&fit=crop', '#dc2626',
   20, true, true, true, 0, false),

  ('o3000000-0002-0000-0000-000000000002', 'Bakso Malang Karapitan Bekasi', 'bakso-karapitan-bekasi', 'BAKSO',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=240&h=120&fit=crop', '#dc2626',
   15, true, true, false, 0, false),

  ('o3000000-0003-0000-0000-000000000003', 'Bakso Malang Karapitan Tangerang', 'bakso-karapitan-tangerang', 'BAKSO',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=240&h=120&fit=crop', '#dc2626',
   18, true, true, true, 0, false);

-- =========================================================================
-- 3. AUTH USERS & PROFILES
-- Password: SuperAdmin123! (super_admin)
-- Password: Admin123! (semua admin brand)
-- Password: Manager123! (semua manager)
-- =========================================================================

-- === SUPER ADMIN ===
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
  'superadmin@omniorder.com', crypt('SuperAdmin123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"superadmin@omniorder.com"}',
  'email', 'a0000000-0000-0000-0000-000000000001', NOW(), NOW(), NOW());
INSERT INTO profiles (id, role) VALUES ('a0000000-0000-0000-0000-000000000001', 'super_admin');

-- === ADMIN BRAND: GACOAN ===
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
  'admin@miegacoan.com', crypt('Admin123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002',
  '{"sub":"a0000000-0000-0000-0000-000000000002","email":"admin@miegacoan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000002', NOW(), NOW(), NOW());
INSERT INTO profiles (id, brand_code, role) VALUES ('a0000000-0000-0000-0000-000000000002', 'GACOAN', 'admin');

-- === ADMIN BRAND: KENANGAN ===
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
  'admin@kopikenangan.com', crypt('Admin123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003',
  '{"sub":"a0000000-0000-0000-0000-000000000003","email":"admin@kopikenangan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000003', NOW(), NOW(), NOW());
INSERT INTO profiles (id, brand_code, role) VALUES ('a0000000-0000-0000-0000-000000000003', 'KENANGAN', 'admin');

-- === ADMIN BRAND: BAKSO ===
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
  'admin@baksokarapitan.com', crypt('Admin123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004',
  '{"sub":"a0000000-0000-0000-0000-000000000004","email":"admin@baksokarapitan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000004', NOW(), NOW(), NOW());
INSERT INTO profiles (id, brand_code, role) VALUES ('a0000000-0000-0000-0000-000000000004', 'BAKSO', 'admin');

-- === MANAGER GACOAN: 5 outlet ===
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
  'manager.margonda@miegacoan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005',
  '{"sub":"a0000000-0000-0000-0000-000000000005","email":"manager.margonda@miegacoan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000005', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000005', 'o1000000-0001-0000-0000-000000000001', 'GACOAN', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated',
  'manager.ciater@miegacoan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000006',
  '{"sub":"a0000000-0000-0000-0000-000000000006","email":"manager.ciater@miegacoan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000006', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000006', 'o1000000-0002-0000-0000-000000000002', 'GACOAN', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated',
  'manager.sawangan@miegacoan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000007',
  '{"sub":"a0000000-0000-0000-0000-000000000007","email":"manager.sawangan@miegacoan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000007', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000007', 'o1000000-0003-0000-0000-000000000003', 'GACOAN', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated',
  'manager.cinere@miegacoan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000008',
  '{"sub":"a0000000-0000-0000-0000-000000000008","email":"manager.cinere@miegacoan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000008', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000008', 'o1000000-0004-0000-0000-000000000004', 'GACOAN', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated',
  'manager.beji@miegacoan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000009',
  '{"sub":"a0000000-0000-0000-0000-000000000009","email":"manager.beji@miegacoan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000009', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000009', 'o1000000-0005-0000-0000-000000000005', 'GACOAN', 'manager');

-- === MANAGER KENANGAN: 4 outlet ===
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated',
  'manager.malldepok@kopikenangan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000010',
  '{"sub":"a0000000-0000-0000-0000-000000000010","email":"manager.malldepok@kopikenangan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000010', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000010', 'o2000000-0001-0000-0000-000000000001', 'KENANGAN', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated',
  'manager.gi@kopikenangan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000011',
  '{"sub":"a0000000-0000-0000-0000-000000000011","email":"manager.gi@kopikenangan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000011', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000011', 'o2000000-0002-0000-0000-000000000002', 'KENANGAN', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated',
  'manager.pi@kopikenangan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000012',
  '{"sub":"a0000000-0000-0000-0000-000000000012","email":"manager.pi@kopikenangan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000012', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000012', 'o2000000-0003-0000-0000-000000000003', 'KENANGAN', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated',
  'manager.sudirman@kopikenangan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000013',
  '{"sub":"a0000000-0000-0000-0000-000000000013","email":"manager.sudirman@kopikenangan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000013', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000013', 'o2000000-0004-0000-0000-000000000004', 'KENANGAN', 'manager');

-- === MANAGER BAKSO: 3 outlet ===
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated',
  'manager.depok@baksokarapitan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000014',
  '{"sub":"a0000000-0000-0000-0000-000000000014","email":"manager.depok@baksokarapitan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000014', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000014', 'o3000000-0001-0000-0000-000000000001', 'BAKSO', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000015', 'authenticated', 'authenticated',
  'manager.bekasi@baksokarapitan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000015',
  '{"sub":"a0000000-0000-0000-0000-000000000015","email":"manager.bekasi@baksokarapitan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000015', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000015', 'o3000000-0002-0000-0000-000000000002', 'BAKSO', 'manager');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000016', 'authenticated', 'authenticated',
  'manager.tangerang@baksokarapitan.com', crypt('Manager123!', gen_salt('bf')),
  NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000016',
  '{"sub":"a0000000-0000-0000-0000-000000000016","email":"manager.tangerang@baksokarapitan.com"}',
  'email', 'a0000000-0000-0000-0000-000000000016', NOW(), NOW(), NOW());
INSERT INTO profiles (id, outlet_id, brand_code, role)
VALUES ('a0000000-0000-0000-0000-000000000016', 'o3000000-0003-0000-0000-000000000003', 'BAKSO', 'manager');

-- =========================================================================
-- 4. CATEGORIES
-- =========================================================================

-- === GACOAN: Semua outlet punya kategori yang sama ===
-- Margonda
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-g1-01-0000-0000-000000000001', 'o1000000-0001-0000-0000-000000000001', 'Mie'),
  ('cat-g1-01-0000-0000-000000000002', 'o1000000-0001-0000-0000-000000000001', 'Dimsum'),
  ('cat-g1-01-0000-0000-000000000003', 'o1000000-0001-0000-0000-000000000001', 'Minuman'),
  ('cat-g1-01-0000-0000-000000000004', 'o1000000-0001-0000-0000-000000000001', 'Snack & Gorengan');

-- Ciater
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-g1-02-0000-0000-000000000001', 'o1000000-0002-0000-0000-000000000002', 'Mie'),
  ('cat-g1-02-0000-0000-000000000002', 'o1000000-0002-0000-0000-000000000002', 'Dimsum'),
  ('cat-g1-02-0000-0000-000000000003', 'o1000000-0002-0000-0000-000000000002', 'Minuman');

-- Sawangan
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-g1-03-0000-0000-000000000001', 'o1000000-0003-0000-0000-000000000003', 'Mie'),
  ('cat-g1-03-0000-0000-000000000002', 'o1000000-0003-0000-0000-000000000003', 'Dimsum'),
  ('cat-g1-03-0000-0000-000000000003', 'o1000000-0003-0000-0000-000000000003', 'Minuman'),
  ('cat-g1-03-0000-0000-000000000004', 'o1000000-0003-0000-0000-000000000003', 'Snack & Gorengan');

-- Cinere
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-g1-04-0000-0000-000000000001', 'o1000000-0004-0000-0000-000000000004', 'Mie'),
  ('cat-g1-04-0000-0000-000000000002', 'o1000000-0004-0000-0000-000000000004', 'Dimsum'),
  ('cat-g1-04-0000-0000-000000000003', 'o1000000-0004-0000-0000-000000000004', 'Minuman');

-- Beji
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-g1-05-0000-0000-000000000001', 'o1000000-0005-0000-0000-000000000005', 'Mie'),
  ('cat-g1-05-0000-0000-000000000002', 'o1000000-0005-0000-0000-000000000005', 'Dimsum'),
  ('cat-g1-05-0000-0000-000000000003', 'o1000000-0005-0000-0000-000000000005', 'Minuman'),
  ('cat-g1-05-0000-0000-000000000004', 'o1000000-0005-0000-0000-000000000005', 'Snack & Gorengan');

-- === KENANGAN: Semua outlet ===
-- Mall Depok
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-k2-01-0000-0000-000000000001', 'o2000000-0001-0000-0000-000000000001', 'Kopi'),
  ('cat-k2-01-0000-0000-000000000002', 'o2000000-0001-0000-0000-000000000001', 'Non-Kopi'),
  ('cat-k2-01-0000-0000-000000000003', 'o2000000-0001-0000-0000-000000000001', 'Makanan Ringan');

-- Grand Indonesia
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-k2-02-0000-0000-000000000001', 'o2000000-0002-0000-0000-000000000002', 'Kopi'),
  ('cat-k2-02-0000-0000-000000000002', 'o2000000-0002-0000-0000-000000000002', 'Non-Kopi'),
  ('cat-k2-02-0000-0000-000000000003', 'o2000000-0002-0000-0000-000000000002', 'Makanan Ringan'),
  ('cat-k2-02-0000-0000-000000000004', 'o2000000-0002-0000-0000-000000000002', 'Minuman Buah');

-- Pondok Indah
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-k2-03-0000-0000-000000000001', 'o2000000-0003-0000-0000-000000000003', 'Kopi'),
  ('cat-k2-03-0000-0000-000000000002', 'o2000000-0003-0000-0000-000000000003', 'Non-Kopi'),
  ('cat-k2-03-0000-0000-000000000003', 'o2000000-0003-0000-0000-000000000003', 'Makanan Ringan');

-- Sudirman
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-k2-04-0000-0000-000000000001', 'o2000000-0004-0000-0000-000000000004', 'Kopi'),
  ('cat-k2-04-0000-0000-000000000002', 'o2000000-0004-0000-0000-000000000004', 'Non-Kopi'),
  ('cat-k2-04-0000-0000-000000000003', 'o2000000-0004-0000-0000-000000000004', 'Makanan Ringan');

-- === BAKSO ===
-- Depok
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-b3-01-0000-0000-000000000001', 'o3000000-0001-0000-0000-000000000001', 'Bakso'),
  ('cat-b3-01-0000-0000-000000000002', 'o3000000-0001-0000-0000-000000000001', 'Mie & Bihun'),
  ('cat-b3-01-0000-0000-000000000003', 'o3000000-0001-0000-0000-000000000001', 'Topping Tambahan'),
  ('cat-b3-01-0000-0000-000000000004', 'o3000000-0001-0000-0000-000000000001', 'Minuman');

-- Bekasi
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-b3-02-0000-0000-000000000001', 'o3000000-0002-0000-0000-000000000002', 'Bakso'),
  ('cat-b3-02-0000-0000-000000000002', 'o3000000-0002-0000-0000-000000000002', 'Mie & Bihun'),
  ('cat-b3-02-0000-0000-000000000003', 'o3000000-0002-0000-0000-000000000002', 'Minuman');

-- Tangerang
INSERT INTO categories (id, outlet_id, name) VALUES
  ('cat-b3-03-0000-0000-000000000001', 'o3000000-0003-0000-0000-000000000003', 'Bakso'),
  ('cat-b3-03-0000-0000-000000000002', 'o3000000-0003-0000-0000-000000000003', 'Mie & Bihun'),
  ('cat-b3-03-0000-0000-000000000003', 'o3000000-0003-0000-0000-000000000003', 'Topping Tambahan'),
  ('cat-b3-03-0000-0000-000000000004', 'o3000000-0003-0000-0000-000000000003', 'Minuman');

-- =========================================================================
-- 5. PRODUCTS — Mie Gacoan (Margonda sebagai referensi lengkap)
-- =========================================================================

-- === GACOAN MARGONDA — Mie ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-g1-01-mie-0000-000000000001', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000001',
   'Mie Suit', 10000, 'Mie goreng/kuah khas Gacoan dengan bumbu rahasia. Bisa pilih level pedas.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p-g1-01-mie-0000-000000000002', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000001',
   'Mie Hompimpa', 10000, 'Mie ayam jamur kuah kaldu spesial. Cocok untuk yang suka rasa gurih.',
   'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', true, true),
  ('p-g1-01-mie-0000-000000000003', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000001',
   'Mie Angel', 12000, 'Mie spesial premium dengan topping lengkap pilihan chef.',
   'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', false, true),
  ('p-g1-01-mie-0000-000000000004', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000001',
   'Mie Iblis', 13000, 'Mie super pedas dengan cabai pilihan. Untuk penyuka tantangan rasa!',
   'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400', false, true),
  ('p-g1-01-mie-0000-000000000005', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000001',
   'Mie Setan', 14000, 'Mie level dewa dengan campuran cabai merah dan hijau pilihan.',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', true, true);

-- === GACOAN MARGONDA — Dimsum ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-g1-01-dim-0000-000000000001', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000002',
   'Siomay Ayam (4 pcs)', 10000, 'Dimsum siomay lembut berisi ayam cincang bumbu spesial.',
   'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true),
  ('p-g1-01-dim-0000-000000000002', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000002',
   'Lumpia Udang (3 pcs)', 12000, 'Lumpia garing dengan isian udang segar pilihan.',
   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', true, true),
  ('p-g1-01-dim-0000-000000000003', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000002',
   'Pangsit Goreng (5 pcs)', 10000, 'Pangsit renyah berisi daging ayam cincang dan bumbu bawang.',
   'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true),
  ('p-g1-01-dim-0000-000000000004', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000002',
   'Dimsum Campur (6 pcs)', 18000, 'Kombinasi siomay, lumpia, dan pangsit goreng.',
   'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', true, true);

-- === GACOAN MARGONDA — Minuman ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-g1-01-min-0000-000000000001', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000003',
   'Es Teh Manis', 5000, 'Teh manis dingin segar. Cocok menemani mie panas.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-g1-01-min-0000-000000000002', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000003',
   'Es Jeruk', 7000, 'Jeruk peras segar dengan es batu. Menyegarkan!',
   'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true),
  ('p-g1-01-min-0000-000000000003', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000003',
   'Kopi Susu Gula Aren', 12000, 'Espresso dengan susu dan gula aren premium Nusantara.',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
  ('p-g1-01-min-0000-000000000004', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000003',
   'Es Anggur', 8000, 'Sirup anggur dengan biji selasih dan es batu serut.',
   'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', false, true);

-- === GACOAN MARGONDA — Snack ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-g1-01-snk-0000-000000000001', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000004',
   'Udang Rambutan (3 pcs)', 10000, 'Udang goreng tepung dengan coating renyah khas Gacoan.',
   'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', false, true),
  ('p-g1-01-snk-0000-000000000002', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000004',
   'Kentang Goreng', 8000, 'Kentang goreng crispy dengan saus sambal pedas.',
   'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400', false, false),
  ('p-g1-01-snk-0000-000000000003', 'o1000000-0001-0000-0000-000000000001', 'cat-g1-01-0000-0000-000000000004',
   'Ceker Pedas (3 pcs)', 9000, 'Ceker ayam dengan bumbu pedas khas. Super gurih!',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', true, true);

-- === GACOAN CIATER ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-g1-02-mie-0000-000000000001', 'o1000000-0002-0000-0000-000000000002', 'cat-g1-02-0000-0000-000000000001',
   'Mie Suit', 10000, 'Mie goreng/kuah khas Gacoan dengan bumbu rahasia.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p-g1-02-mie-0000-000000000002', 'o1000000-0002-0000-0000-000000000002', 'cat-g1-02-0000-0000-000000000001',
   'Mie Hompimpa', 10000, 'Mie ayam jamur kuah kaldu spesial.',
   'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', false, true),
  ('p-g1-02-mie-0000-000000000003', 'o1000000-0002-0000-0000-000000000002', 'cat-g1-02-0000-0000-000000000001',
   'Mie Iblis', 13000, 'Mie super pedas level dewa!',
   'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400', true, true),
  ('p-g1-02-dim-0000-000000000001', 'o1000000-0002-0000-0000-000000000002', 'cat-g1-02-0000-0000-000000000002',
   'Siomay Ayam (4 pcs)', 10000, 'Dimsum siomay lembut berisi ayam cincang.',
   'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true),
  ('p-g1-02-dim-0000-000000000002', 'o1000000-0002-0000-0000-000000000002', 'cat-g1-02-0000-0000-000000000002',
   'Lumpia Udang (3 pcs)', 12000, 'Lumpia garing dengan isian udang segar.',
   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', true, true),
  ('p-g1-02-min-0000-000000000001', 'o1000000-0002-0000-0000-000000000002', 'cat-g1-02-0000-0000-000000000003',
   'Es Teh Manis', 5000, 'Teh manis dingin segar.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-g1-02-min-0000-000000000002', 'o1000000-0002-0000-0000-000000000002', 'cat-g1-02-0000-0000-000000000003',
   'Es Jeruk', 7000, 'Jeruk peras segar dengan es batu.',
   'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);

-- === GACOAN SAWANGAN ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-g1-03-mie-0000-000000000001', 'o1000000-0003-0000-0000-000000000003', 'cat-g1-03-0000-0000-000000000001',
   'Mie Suit', 10000, 'Mie goreng/kuah dengan bumbu rahasia Gacoan.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p-g1-03-mie-0000-000000000002', 'o1000000-0003-0000-0000-000000000003', 'cat-g1-03-0000-0000-000000000001',
   'Mie Angel', 12000, 'Mie premium topping lengkap.',
   'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', true, true),
  ('p-g1-03-mie-0000-000000000003', 'o1000000-0003-0000-0000-000000000003', 'cat-g1-03-0000-0000-000000000001',
   'Mie Setan', 14000, 'Mie ekstra pedas untuk pecinta tantangan.',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', false, true),
  ('p-g1-03-dim-0000-000000000001', 'o1000000-0003-0000-0000-000000000003', 'cat-g1-03-0000-0000-000000000002',
   'Siomay Ayam (4 pcs)', 10000, 'Dimsum siomay ayam lembut.',
   'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true),
  ('p-g1-03-dim-0000-000000000002', 'o1000000-0003-0000-0000-000000000003', 'cat-g1-03-0000-0000-000000000002',
   'Pangsit Goreng (5 pcs)', 10000, 'Pangsit goreng renyah.',
   'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', true, true),
  ('p-g1-03-min-0000-000000000001', 'o1000000-0003-0000-0000-000000000003', 'cat-g1-03-0000-0000-000000000003',
   'Es Teh Manis', 5000, 'Teh manis segar.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-g1-03-snk-0000-000000000001', 'o1000000-0003-0000-0000-000000000003', 'cat-g1-03-0000-0000-000000000004',
   'Kentang Goreng', 8000, 'Kentang goreng crispy.',
   'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400', false, true);

-- === GACOAN CINERE ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-g1-04-mie-0000-000000000001', 'o1000000-0004-0000-0000-000000000004', 'cat-g1-04-0000-0000-000000000001',
   'Mie Suit', 10000, 'Mie goreng/kuah dengan bumbu rahasia Gacoan.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p-g1-04-mie-0000-000000000002', 'o1000000-0004-0000-0000-000000000004', 'cat-g1-04-0000-0000-000000000001',
   'Mie Hompimpa', 10000, 'Mie ayam jamur kuah kaldu.',
   'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', false, true),
  ('p-g1-04-mie-0000-000000000003', 'o1000000-0004-0000-0000-000000000004', 'cat-g1-04-0000-0000-000000000001',
   'Mie Iblis', 13000, 'Mie super pedas.',
   'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400', true, true),
  ('p-g1-04-dim-0000-000000000001', 'o1000000-0004-0000-0000-000000000004', 'cat-g1-04-0000-0000-000000000002',
   'Dimsum Campur (6 pcs)', 18000, 'Kombinasi dimsum pilihan chef.',
   'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', true, true),
  ('p-g1-04-min-0000-000000000001', 'o1000000-0004-0000-0000-000000000004', 'cat-g1-04-0000-0000-000000000003',
   'Es Teh Manis', 5000, 'Teh manis segar.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-g1-04-min-0000-000000000002', 'o1000000-0004-0000-0000-000000000004', 'cat-g1-04-0000-0000-000000000003',
   'Kopi Susu Gula Aren', 12000, 'Kopi susu premium gula aren.',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true);

-- === GACOAN BEJI ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-g1-05-mie-0000-000000000001', 'o1000000-0005-0000-0000-000000000005', 'cat-g1-05-0000-0000-000000000001',
   'Mie Suit', 10000, 'Mie goreng/kuah khas Gacoan.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p-g1-05-mie-0000-000000000002', 'o1000000-0005-0000-0000-000000000005', 'cat-g1-05-0000-0000-000000000001',
   'Mie Angel', 12000, 'Mie premium topping chef.',
   'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', true, true),
  ('p-g1-05-dim-0000-000000000001', 'o1000000-0005-0000-0000-000000000005', 'cat-g1-05-0000-0000-000000000002',
   'Lumpia Udang (3 pcs)', 12000, 'Lumpia garing udang segar.',
   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', true, true),
  ('p-g1-05-dim-0000-000000000002', 'o1000000-0005-0000-0000-000000000005', 'cat-g1-05-0000-0000-000000000002',
   'Pangsit Goreng (5 pcs)', 10000, 'Pangsit goreng renyah.',
   'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true),
  ('p-g1-05-min-0000-000000000001', 'o1000000-0005-0000-0000-000000000005', 'cat-g1-05-0000-0000-000000000003',
   'Es Teh Manis', 5000, 'Teh manis segar.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-g1-05-min-0000-000000000002', 'o1000000-0005-0000-0000-000000000005', 'cat-g1-05-0000-0000-000000000003',
   'Es Jeruk', 7000, 'Jeruk peras segar.',
   'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true),
  ('p-g1-05-snk-0000-000000000001', 'o1000000-0005-0000-0000-000000000005', 'cat-g1-05-0000-0000-000000000004',
   'Udang Rambutan (3 pcs)', 10000, 'Udang goreng tepung renyah.',
   'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', false, true);

-- =========================================================================
-- PRODUCTS — Kopi Kenangan
-- =========================================================================

-- === KENANGAN MALL DEPOK ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-k2-01-kop-0000-000000000001', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000001',
   'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren pilihan. Ikon Kopi Kenangan.',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
  ('p-k2-01-kop-0000-000000000002', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000001',
   'Americano', 18000, 'Espresso murni dengan air panas. Pahit menyegarkan.',
   'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', false, true),
  ('p-k2-01-kop-0000-000000000003', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000001',
   'Cappuccino', 22000, 'Espresso dengan susu dan busa susu lembut.',
   'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', false, true),
  ('p-k2-01-kop-0000-000000000004', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000001',
   'Caramel Macchiato', 27000, 'Latte dengan drizzle karamel di atas busa susu.',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
  ('p-k2-01-non-0000-000000000001', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000002',
   'Matcha Latte', 25000, 'Matcha premium Jepang dengan susu segar. Creamy dan earthy.',
   'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true),
  ('p-k2-01-non-0000-000000000002', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000002',
   'Coklat Premium', 22000, 'Coklat Belgia premium dengan susu segar. Kental dan harum.',
   'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400', false, true),
  ('p-k2-01-non-0000-000000000003', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000002',
   'Taro Latte', 23000, 'Taro Jepang dengan susu segar. Ungu cantik, manis creamy.',
   'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', false, true),
  ('p-k2-01-mak-0000-000000000001', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000003',
   'Roti Bakar', 15000, 'Roti bakar dengan mentega dan pilihan selai.',
   'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400', false, true),
  ('p-k2-01-mak-0000-000000000002', 'o2000000-0001-0000-0000-000000000001', 'cat-k2-01-0000-0000-000000000003',
   'Croissant Butter', 18000, 'Croissant mentega panggang renyah dari luar, lembut dalam.',
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', true, true);

-- === KENANGAN GRAND INDONESIA ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-k2-02-kop-0000-000000000001', 'o2000000-0002-0000-0000-000000000002', 'cat-k2-02-0000-0000-000000000001',
   'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren. Favorit pelanggan.',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
  ('p-k2-02-kop-0000-000000000002', 'o2000000-0002-0000-0000-000000000002', 'cat-k2-02-0000-0000-000000000001',
   'Espresso', 16000, 'Espresso shot murni berkualitas tinggi.',
   'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', false, true),
  ('p-k2-02-kop-0000-000000000003', 'o2000000-0002-0000-0000-000000000002', 'cat-k2-02-0000-0000-000000000001',
   'Cappuccino', 22000, 'Espresso dengan susu dan busa susu.',
   'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', false, true),
  ('p-k2-02-non-0000-000000000001', 'o2000000-0002-0000-0000-000000000002', 'cat-k2-02-0000-0000-000000000002',
   'Matcha Latte', 25000, 'Matcha premium dengan susu segar.',
   'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true),
  ('p-k2-02-non-0000-000000000002', 'o2000000-0002-0000-0000-000000000002', 'cat-k2-02-0000-0000-000000000002',
   'Strawberry Latte', 24000, 'Stroberi segar dengan susu. Merah menggoda.',
   'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', false, true),
  ('p-k2-02-mak-0000-000000000001', 'o2000000-0002-0000-0000-000000000002', 'cat-k2-02-0000-0000-000000000003',
   'Roti Bakar Coklat', 17000, 'Roti bakar dengan selai coklat premium.',
   'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400', false, true),
  ('p-k2-02-bua-0000-000000000001', 'o2000000-0002-0000-0000-000000000002', 'cat-k2-02-0000-0000-000000000004',
   'Jeruk Peras', 20000, 'Jeruk segar diperas langsung, tanpa pengawet.',
   'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', true, true),
  ('p-k2-02-bua-0000-000000000002', 'o2000000-0002-0000-0000-000000000002', 'cat-k2-02-0000-0000-000000000004',
   'Watermelon Juice', 22000, 'Jus semangka segar tanpa tambahan gula.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true);

-- === KENANGAN PONDOK INDAH ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-k2-03-kop-0000-000000000001', 'o2000000-0003-0000-0000-000000000003', 'cat-k2-03-0000-0000-000000000001',
   'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren.',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
  ('p-k2-03-kop-0000-000000000002', 'o2000000-0003-0000-0000-000000000003', 'cat-k2-03-0000-0000-000000000001',
   'Flat White', 23000, 'Espresso dengan susu steam ratio tinggi.',
   'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', false, true),
  ('p-k2-03-non-0000-000000000001', 'o2000000-0003-0000-0000-000000000003', 'cat-k2-03-0000-0000-000000000002',
   'Matcha Latte', 25000, 'Matcha premium dengan susu segar.',
   'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true),
  ('p-k2-03-non-0000-000000000002', 'o2000000-0003-0000-0000-000000000003', 'cat-k2-03-0000-0000-000000000002',
   'Coklat Premium', 22000, 'Coklat Belgia premium dengan susu segar.',
   'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400', false, true),
  ('p-k2-03-mak-0000-000000000001', 'o2000000-0003-0000-0000-000000000003', 'cat-k2-03-0000-0000-000000000003',
   'Croissant Butter', 18000, 'Croissant mentega panggang.',
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', true, true);

-- === KENANGAN SUDIRMAN ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-k2-04-kop-0000-000000000001', 'o2000000-0004-0000-0000-000000000004', 'cat-k2-04-0000-0000-000000000001',
   'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren.',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
  ('p-k2-04-kop-0000-000000000002', 'o2000000-0004-0000-0000-000000000004', 'cat-k2-04-0000-0000-000000000001',
   'Cold Brew', 22000, 'Kopi cold brew 12 jam. Smooth, tidak asam.',
   'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', true, true),
  ('p-k2-04-kop-0000-000000000003', 'o2000000-0004-0000-0000-000000000004', 'cat-k2-04-0000-0000-000000000001',
   'Americano', 18000, 'Espresso murni dengan air panas.',
   'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', false, true),
  ('p-k2-04-non-0000-000000000001', 'o2000000-0004-0000-0000-000000000004', 'cat-k2-04-0000-0000-000000000002',
   'Matcha Latte', 25000, 'Matcha premium dengan susu segar.',
   'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true),
  ('p-k2-04-mak-0000-000000000001', 'o2000000-0004-0000-0000-000000000004', 'cat-k2-04-0000-0000-000000000003',
   'Roti Bakar', 15000, 'Roti bakar dengan mentega dan selai.',
   'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400', false, true);

-- =========================================================================
-- PRODUCTS — Bakso Malang Karapitan
-- =========================================================================

-- === BAKSO DEPOK ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-b3-01-bak-0000-000000000001', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000001',
   'Bakso Urat Jumbo', 20000, 'Bakso daging sapi dengan urat, ukuran jumbo. Kenyal dan gurih.',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
  ('p-b3-01-bak-0000-000000000002', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000001',
   'Bakso Telur', 18000, 'Bakso jumbo berisi telur puyuh di dalamnya.',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', false, true),
  ('p-b3-01-bak-0000-000000000003', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000001',
   'Bakso Mercon', 22000, 'Bakso super pedas berisi cabai halus. Berani coba?',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
  ('p-b3-01-bak-0000-000000000004', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000001',
   'Bakso Bakar', 20000, 'Bakso dibakar dengan bumbu kecap pedas. Smoky dan lezat.',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', false, true),
  ('p-b3-01-mie-0000-000000000001', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000002',
   'Mie Ayam Bakso', 18000, 'Mie ayam pangsit dengan bakso urat. Kuah kaldu spesial.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p-b3-01-mie-0000-000000000002', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000002',
   'Bihun Kuah Bakso', 16000, 'Bihun halus dengan kuah bakso gurih dan bakso pilihan.',
   'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', false, true),
  ('p-b3-01-mie-0000-000000000003', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000002',
   'Kwetiau Bakso', 17000, 'Kwetiau dengan kuah bakso sapi dan topping lengkap.',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', false, true),
  ('p-b3-01-top-0000-000000000001', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000003',
   'Tahu Goreng (3 pcs)', 6000, 'Tahu kulit goreng renyah.',
   'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true),
  ('p-b3-01-top-0000-000000000002', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000003',
   'Siomay (4 pcs)', 10000, 'Siomay kukus dengan saus kacang.',
   'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true),
  ('p-b3-01-min-0000-000000000001', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000004',
   'Es Teh Tawar', 3000, 'Teh tawar tanpa gula, dingin dan segar.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-b3-01-min-0000-000000000002', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000004',
   'Es Teh Manis', 4000, 'Teh manis dingin.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-b3-01-min-0000-000000000003', 'o3000000-0001-0000-0000-000000000001', 'cat-b3-01-0000-0000-000000000004',
   'Es Jeruk', 6000, 'Jeruk peras segar.',
   'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);

-- === BAKSO BEKASI ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-b3-02-bak-0000-000000000001', 'o3000000-0002-0000-0000-000000000002', 'cat-b3-02-0000-0000-000000000001',
   'Bakso Urat Jumbo', 20000, 'Bakso daging sapi urat, kenyal dan gurih.',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
  ('p-b3-02-bak-0000-000000000002', 'o3000000-0002-0000-0000-000000000002', 'cat-b3-02-0000-0000-000000000001',
   'Bakso Telur', 18000, 'Bakso dengan telur puyuh di dalamnya.',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', false, true),
  ('p-b3-02-mie-0000-000000000001', 'o3000000-0002-0000-0000-000000000002', 'cat-b3-02-0000-0000-000000000002',
   'Mie Ayam Bakso', 18000, 'Mie ayam dengan bakso dan pangsit.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p-b3-02-mie-0000-000000000002', 'o3000000-0002-0000-0000-000000000002', 'cat-b3-02-0000-0000-000000000002',
   'Bihun Kuah Bakso', 16000, 'Bihun kuah bakso gurih.',
   'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', false, true),
  ('p-b3-02-min-0000-000000000001', 'o3000000-0002-0000-0000-000000000002', 'cat-b3-02-0000-0000-000000000003',
   'Es Teh Tawar', 3000, 'Teh tawar dingin.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-b3-02-min-0000-000000000002', 'o3000000-0002-0000-0000-000000000002', 'cat-b3-02-0000-0000-000000000003',
   'Es Jeruk', 6000, 'Jeruk peras segar.',
   'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);

-- === BAKSO TANGERANG ===
INSERT INTO products (id, outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
VALUES
  ('p-b3-03-bak-0000-000000000001', 'o3000000-0003-0000-0000-000000000003', 'cat-b3-03-0000-0000-000000000001',
   'Bakso Urat Jumbo', 20000, 'Bakso daging sapi urat ukuran jumbo.',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
  ('p-b3-03-bak-0000-000000000002', 'o3000000-0003-0000-0000-000000000003', 'cat-b3-03-0000-0000-000000000001',
   'Bakso Mercon', 22000, 'Bakso pedas berisi cabai halus.',
   'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
  ('p-b3-03-bak-0000-000000000003', 'o3000000-0003-0000-0000-000000000003', 'cat-b3-03-0000-0000-000000000001',
   'Bakso Bakar', 20000, 'Bakso dibakar dengan kecap pedas.',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', false, true),
  ('p-b3-03-mie-0000-000000000001', 'o3000000-0003-0000-0000-000000000003', 'cat-b3-03-0000-0000-000000000002',
   'Mie Ayam Bakso', 18000, 'Mie ayam dengan bakso pilihan.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
  ('p-b3-03-mie-0000-000000000002', 'o3000000-0003-0000-0000-000000000003', 'cat-b3-03-0000-0000-000000000002',
   'Kwetiau Bakso', 17000, 'Kwetiau dengan kuah bakso dan topping.',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', false, true),
  ('p-b3-03-top-0000-000000000001', 'o3000000-0003-0000-0000-000000000003', 'cat-b3-03-0000-0000-000000000003',
   'Tahu Goreng (3 pcs)', 6000, 'Tahu goreng renyah.',
   'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true),
  ('p-b3-03-min-0000-000000000001', 'o3000000-0003-0000-0000-000000000003', 'cat-b3-03-0000-0000-000000000004',
   'Es Teh Tawar', 3000, 'Teh tawar dingin.',
   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
  ('p-b3-03-min-0000-000000000002', 'o3000000-0003-0000-0000-000000000003', 'cat-b3-03-0000-0000-000000000004',
   'Es Jeruk', 6000, 'Jeruk peras segar.',
   'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);

-- =========================================================================
-- 6. PRODUCT MODIFIERS (Untuk produk di Gacoan Margonda & Kopi Kenangan Mall Depok)
-- =========================================================================

-- ========================
-- MIE SUIT — Level Pedas (Wajib)
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-g1-suit-pedas-0000000000001', 'p-g1-01-mie-0000-000000000001', 'Level Pedas', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-g1-suit-pedas-0000000000001', 'Level 0 (Tidak Pedas)', 0, true),
  ('mod-g1-suit-pedas-0000000000001', 'Level 1 (Sedikit Pedas)', 0, true),
  ('mod-g1-suit-pedas-0000000000001', 'Level 2 (Sedang)', 0, true),
  ('mod-g1-suit-pedas-0000000000001', 'Level 3 (Pedas)', 0, true),
  ('mod-g1-suit-pedas-0000000000001', 'Level 4 (Sangat Pedas)', 0, true),
  ('mod-g1-suit-pedas-0000000000001', 'Level 5 (Mampus)', 2000, true);

-- MIE SUIT — Tipe Kuah (Wajib)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-g1-suit-kuah-00000000000001', 'p-g1-01-mie-0000-000000000001', 'Tipe Sajian', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-g1-suit-kuah-00000000000001', 'Kuah', 0, true),
  ('mod-g1-suit-kuah-00000000000001', 'Goreng', 0, true);

-- MIE SUIT — Extra Topping (Opsional)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-g1-suit-topng-0000000000001', 'p-g1-01-mie-0000-000000000001', 'Extra Topping', false, 0, 5);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-g1-suit-topng-0000000000001', 'Telur Ceplok', 3000, true),
  ('mod-g1-suit-topng-0000000000001', 'Pangsit Goreng', 4000, true),
  ('mod-g1-suit-topng-0000000000001', 'Udang Rambutan', 5000, true),
  ('mod-g1-suit-topng-0000000000001', 'Ceker Ayam', 5000, true),
  ('mod-g1-suit-topng-0000000000001', 'Siomay Tambah', 4000, true);

-- ========================
-- MIE HOMPIMPA — Level Pedas (Wajib)
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-g1-homp-pedas-0000000000001', 'p-g1-01-mie-0000-000000000002', 'Level Pedas', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-g1-homp-pedas-0000000000001', 'Level 0 (Tidak Pedas)', 0, true),
  ('mod-g1-homp-pedas-0000000000001', 'Level 1 (Sedikit Pedas)', 0, true),
  ('mod-g1-homp-pedas-0000000000001', 'Level 2 (Sedang)', 0, true),
  ('mod-g1-homp-pedas-0000000000001', 'Level 3 (Pedas)', 0, true),
  ('mod-g1-homp-pedas-0000000000001', 'Level 4 (Sangat Pedas)', 0, true),
  ('mod-g1-homp-pedas-0000000000001', 'Level 5 (Mampus)', 2000, true);

-- MIE HOMPIMPA — Tipe Sajian
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-g1-homp-kuah-00000000000001', 'p-g1-01-mie-0000-000000000002', 'Tipe Sajian', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-g1-homp-kuah-00000000000001', 'Kuah', 0, true),
  ('mod-g1-homp-kuah-00000000000001', 'Goreng', 0, true);

-- ========================
-- MIE SETAN — Level Pedas (Wajib, mulai level 3)
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-g1-setan-pedas-000000000001', 'p-g1-01-mie-0000-000000000005', 'Level Pedas', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-g1-setan-pedas-000000000001', 'Level 3 (Pedas)', 0, true),
  ('mod-g1-setan-pedas-000000000001', 'Level 4 (Sangat Pedas)', 0, true),
  ('mod-g1-setan-pedas-000000000001', 'Level 5 (Mampus)', 0, true),
  ('mod-g1-setan-pedas-000000000001', 'Level 6 (Jangan Nyesal)', 3000, true);

-- MIE SETAN — Extra Topping
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-g1-setan-topng-000000000001', 'p-g1-01-mie-0000-000000000005', 'Extra Topping', false, 0, 3);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-g1-setan-topng-000000000001', 'Ceker Ayam', 5000, true),
  ('mod-g1-setan-topng-000000000001', 'Telur Ceplok', 3000, true),
  ('mod-g1-setan-topng-000000000001', 'Kerupuk Emping', 2000, true);

-- ========================
-- SIOMAY AYAM — Saus (Opsional)
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-g1-sio-saus-000000000000001', 'p-g1-01-dim-0000-000000000001', 'Saus Tambahan', false, 0, 2);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-g1-sio-saus-000000000000001', 'Saus Kacang Extra', 2000, true),
  ('mod-g1-sio-saus-000000000000001', 'Saus Sambal Extra', 2000, true),
  ('mod-g1-sio-saus-000000000000001', 'Kecap Manis', 0, true);

-- ========================
-- KENANGAN LATTE — Ukuran (Wajib)
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-latte-ukuran-00000000001', 'p-k2-01-kop-0000-000000000001', 'Ukuran', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-latte-ukuran-00000000001', 'Regular (250ml)', 0, true),
  ('mod-k2-latte-ukuran-00000000001', 'Large (350ml)', 6000, true);

-- KENANGAN LATTE — Suhu (Wajib)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-latte-suhu-000000000001', 'p-k2-01-kop-0000-000000000001', 'Suhu', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-latte-suhu-000000000001', 'Dingin (Iced)', 0, true),
  ('mod-k2-latte-suhu-000000000001', 'Panas (Hot)', 0, true);

-- KENANGAN LATTE — Level Gula (Wajib)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-latte-gula-000000000001', 'p-k2-01-kop-0000-000000000001', 'Level Gula', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-latte-gula-000000000001', 'Normal (100%)', 0, true),
  ('mod-k2-latte-gula-000000000001', 'Less Sugar (50%)', 0, true),
  ('mod-k2-latte-gula-000000000001', 'No Sugar (0%)', 0, true);

-- KENANGAN LATTE — Extra (Opsional)
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-latte-extra-00000000001', 'p-k2-01-kop-0000-000000000001', 'Extra Add-On', false, 0, 3);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-latte-extra-00000000001', 'Extra Shot Espresso', 5000, true),
  ('mod-k2-latte-extra-00000000001', 'Boba Pearl', 5000, true),
  ('mod-k2-latte-extra-00000000001', 'Whipped Cream', 3000, true),
  ('mod-k2-latte-extra-00000000001', 'Almond Milk (ganti susu)', 8000, true);

-- ========================
-- AMERICANO — Ukuran & Suhu
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-amer-ukuran-00000000001', 'p-k2-01-kop-0000-000000000002', 'Ukuran', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-amer-ukuran-00000000001', 'Regular', 0, true),
  ('mod-k2-amer-ukuran-00000000001', 'Large', 5000, true);

INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-amer-suhu-000000000001', 'p-k2-01-kop-0000-000000000002', 'Suhu', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-amer-suhu-000000000001', 'Dingin (Iced)', 0, true),
  ('mod-k2-amer-suhu-000000000001', 'Panas (Hot)', 0, true);

-- ========================
-- MATCHA LATTE — Ukuran & Suhu & Level Gula
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-matc-ukuran-00000000001', 'p-k2-01-non-0000-000000000001', 'Ukuran', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-matc-ukuran-00000000001', 'Regular', 0, true),
  ('mod-k2-matc-ukuran-00000000001', 'Large', 6000, true);

INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-matc-suhu-000000000001', 'p-k2-01-non-0000-000000000001', 'Suhu', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-matc-suhu-000000000001', 'Dingin (Iced)', 0, true),
  ('mod-k2-matc-suhu-000000000001', 'Panas (Hot)', 0, true);

INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-matc-gula-000000000001', 'p-k2-01-non-0000-000000000001', 'Level Gula', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-matc-gula-000000000001', 'Normal', 0, true),
  ('mod-k2-matc-gula-000000000001', 'Less Sugar', 0, true),
  ('mod-k2-matc-gula-000000000001', 'No Sugar', 0, true);

INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-matc-extra-00000000001', 'p-k2-01-non-0000-000000000001', 'Extra Add-On', false, 0, 2);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-matc-extra-00000000001', 'Boba Pearl', 5000, true),
  ('mod-k2-matc-extra-00000000001', 'Whipped Cream', 3000, true),
  ('mod-k2-matc-extra-00000000001', 'Double Matcha Shot', 7000, true);

-- ========================
-- BAKSO URAT JUMBO — Kuah & Mie
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-b3-urat-mie-000000000000001', 'p-b3-01-bak-0000-000000000001', 'Pilihan Mie/Bihun', false, 0, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-b3-urat-mie-000000000000001', 'Mie Kuning', 0, true),
  ('mod-b3-urat-mie-000000000000001', 'Bihun', 0, true),
  ('mod-b3-urat-mie-000000000000001', 'Tanpa Mie', 0, true);

INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-b3-urat-kuah-00000000000001', 'p-b3-01-bak-0000-000000000001', 'Kuah', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-b3-urat-kuah-00000000000001', 'Kuah Bening', 0, true),
  ('mod-b3-urat-kuah-00000000000001', 'Kuah Pedas', 0, true),
  ('mod-b3-urat-kuah-00000000000001', 'Tanpa Kuah (Kering)', 0, true);

INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-b3-urat-topng-0000000000001', 'p-b3-01-bak-0000-000000000001', 'Topping Tambahan', false, 0, 4);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-b3-urat-topng-0000000000001', 'Tahu Goreng', 3000, true),
  ('mod-b3-urat-topng-0000000000001', 'Pangsit Goreng', 4000, true),
  ('mod-b3-urat-topng-0000000000001', 'Bakso Telur Tambah', 6000, true),
  ('mod-b3-urat-topng-0000000000001', 'Kerupuk', 2000, true);

-- ========================
-- MIE AYAM BAKSO — Sajian & Topping
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-b3-mieay-sajian-000000000001', 'p-b3-01-mie-0000-000000000001', 'Tipe Sajian', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-b3-mieay-sajian-000000000001', 'Kuah', 0, true),
  ('mod-b3-mieay-sajian-000000000001', 'Campur (Kuah terpisah)', 0, true),
  ('mod-b3-mieay-sajian-000000000001', 'Kering (Tanpa Kuah)', 0, true);

INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-b3-mieay-topng-000000000001', 'p-b3-01-mie-0000-000000000001', 'Topping Tambahan', false, 0, 3);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-b3-mieay-topng-000000000001', 'Bakso Jumbo Tambah', 8000, true),
  ('mod-b3-mieay-topng-000000000001', 'Tahu Goreng', 3000, true),
  ('mod-b3-mieay-topng-000000000001', 'Pangsit Goreng Tambah', 4000, true);

-- ========================
-- CARAMEL MACCHIATO — Modifiers
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-cara-ukuran-00000000001', 'p-k2-01-kop-0000-000000000004', 'Ukuran', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-cara-ukuran-00000000001', 'Regular', 0, true),
  ('mod-k2-cara-ukuran-00000000001', 'Large', 6000, true);

INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-cara-suhu-000000000001', 'p-k2-01-kop-0000-000000000004', 'Suhu', true, 1, 1);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-cara-suhu-000000000001', 'Dingin (Iced)', 0, true),
  ('mod-k2-cara-suhu-000000000001', 'Panas (Hot)', 0, true);

-- ========================
-- ROTI BAKAR — Pilihan Selai
-- ========================
INSERT INTO product_modifiers (id, product_id, name, is_required, min_selections, max_selections) VALUES
  ('mod-k2-roti-selai-00000000001', 'p-k2-01-mak-0000-000000000001', 'Pilihan Selai', true, 1, 2);
INSERT INTO product_modifier_options (modifier_id, name, price_adjustment, is_available) VALUES
  ('mod-k2-roti-selai-00000000001', 'Coklat', 0, true),
  ('mod-k2-roti-selai-00000000001', 'Keju', 0, true),
  ('mod-k2-roti-selai-00000000001', 'Strawberry', 0, true),
  ('mod-k2-roti-selai-00000000001', 'Nanas', 0, true),
  ('mod-k2-roti-selai-00000000001', 'Kacang', 0, true);

-- =========================================================================
-- 7. SAMPLE ORDERS (Beberapa order contoh untuk Gacoan Margonda)
-- =========================================================================
INSERT INTO orders (id, outlet_id, order_code, order_type, table_number, customer_name, customer_phone, status, payment_method, payment_status, total_amount, created_at)
VALUES
  ('ord-sample-0001-0000-000000000001', 'o1000000-0001-0000-0000-000000000001', 'GMR-0001', 'dinein', '5',
   'Budi Santoso', '081234567890', 'completed', 'qris', 'paid', 35000, NOW() - INTERVAL '2 hours'),
  ('ord-sample-0002-0000-000000000002', 'o1000000-0001-0000-0000-000000000001', 'GMR-0002', 'takeaway', null,
   'Sari Dewi', '082345678901', 'preparing', 'cash', 'pending', 22000, NOW() - INTERVAL '30 minutes'),
  ('ord-sample-0003-0000-000000000003', 'o1000000-0001-0000-0000-000000000001', 'GMR-0003', 'dinein', '12',
   'Andi Kurniawan', '083456789012', 'pending', 'qris', 'paid', 50000, NOW() - INTERVAL '10 minutes');

-- Order items untuk order 1
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, notes)
VALUES
  ('oi-sample-0001-0001-000000000001', 'ord-sample-0001-0000-000000000001', 'p-g1-01-mie-0000-000000000001', 2, 10000, 20000, null),
  ('oi-sample-0001-0002-000000000002', 'ord-sample-0001-0000-000000000001', 'p-g1-01-min-0000-000000000001', 2, 5000, 10000, null),
  ('oi-sample-0001-0003-000000000003', 'ord-sample-0001-0000-000000000001', 'p-g1-01-snk-0000-000000000003', 1, 9000, 9000, 'extra sambal');

-- Modifiers untuk order item 1
INSERT INTO order_item_modifiers (order_item_id, modifier_name, option_name, price_adjustment)
VALUES
  ('oi-sample-0001-0001-000000000001', 'Level Pedas', 'Level 3 (Pedas)', 0),
  ('oi-sample-0001-0001-000000000001', 'Tipe Sajian', 'Kuah', 0);

-- Order items untuk order 2
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, notes)
VALUES
  ('oi-sample-0002-0001-000000000001', 'ord-sample-0002-0000-000000000002', 'p-g1-01-mie-0000-000000000002', 1, 10000, 10000, null),
  ('oi-sample-0002-0002-000000000002', 'ord-sample-0002-0000-000000000002', 'p-g1-01-dim-0000-000000000002', 1, 12000, 12000, null);

INSERT INTO order_item_modifiers (order_item_id, modifier_name, option_name, price_adjustment)
VALUES
  ('oi-sample-0002-0001-000000000001', 'Level Pedas', 'Level 2 (Sedang)', 0),
  ('oi-sample-0002-0001-000000000001', 'Tipe Sajian', 'Goreng', 0);

-- Order items untuk order 3
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, notes)
VALUES
  ('oi-sample-0003-0001-000000000001', 'ord-sample-0003-0000-000000000003', 'p-g1-01-mie-0000-000000000005', 2, 14000, 28000, 'level 6 kalau bisa'),
  ('oi-sample-0003-0002-000000000002', 'ord-sample-0003-0000-000000000003', 'p-g1-01-dim-0000-000000000004', 1, 18000, 18000, null),
  ('oi-sample-0003-0003-000000000003', 'ord-sample-0003-0000-000000000003', 'p-g1-01-min-0000-000000000003', 1, 12000, 12000, null);

INSERT INTO order_item_modifiers (order_item_id, modifier_name, option_name, price_adjustment)
VALUES
  ('oi-sample-0003-0001-000000000001', 'Level Pedas', 'Level 6 (Jangan Nyesal)', 3000),
  ('oi-sample-0003-0001-000000000001', 'Extra Topping', 'Ceker Ayam', 5000);

-- =========================================================================
-- SUMMARY / RINGKASAN
-- =========================================================================
-- Super Admin:  superadmin@omniorder.com / SuperAdmin123!
-- Admin Gacoan: admin@miegacoan.com / Admin123!
-- Admin Kenangan: admin@kopikenangan.com / Admin123!
-- Admin Bakso: admin@baksokarapitan.com / Admin123!
-- Manager Gacoan Margonda: manager.margonda@miegacoan.com / Manager123!
-- Manager Gacoan Ciater: manager.ciater@miegacoan.com / Manager123!
-- Manager Gacoan Sawangan: manager.sawangan@miegacoan.com / Manager123!
-- Manager Gacoan Cinere: manager.cinere@miegacoan.com / Manager123!
-- Manager Gacoan Beji: manager.beji@miegacoan.com / Manager123!
-- Manager Kenangan Mall Depok: manager.malldepok@kopikenangan.com / Manager123!
-- Manager Kenangan GI: manager.gi@kopikenangan.com / Manager123!
-- Manager Kenangan PI: manager.pi@kopikenangan.com / Manager123!
-- Manager Kenangan Sudirman: manager.sudirman@kopikenangan.com / Manager123!
-- Manager Bakso Depok: manager.depok@baksokarapitan.com / Manager123!
-- Manager Bakso Bekasi: manager.bekasi@baksokarapitan.com / Manager123!
-- Manager Bakso Tangerang: manager.tangerang@baksokarapitan.com / Manager123!
