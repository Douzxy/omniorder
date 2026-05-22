-- =========================================================================
-- SEED DATA: Demo Data OmniOrder
-- 3 Brand: Mie Gacoan (5 outlet), Kopi Kenangan (4 outlet), Bakso Malang (3 outlet)
-- UUID dibuat otomatis oleh Supabase
-- =========================================================================

-- =========================================================================
-- HAPUS DATA LAMA
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
DELETE FROM auth.identities WHERE provider = 'email' AND provider_id IN (
  SELECT email FROM auth.users WHERE email LIKE '%@omniorder.com' OR email LIKE '%@miegacoan.com' OR email LIKE '%@kopikenangan.com' OR email LIKE '%@baksokarapitan.com'
);
DELETE FROM auth.users WHERE email LIKE '%@omniorder.com' OR email LIKE '%@miegacoan.com' OR email LIKE '%@kopikenangan.com' OR email LIKE '%@baksokarapitan.com';

-- =========================================================================
-- OUTLETS
-- =========================================================================
INSERT INTO outlets (name, slug, brand_code, logo_url, brand_color, table_count, is_dine_in_enabled, is_takeaway_enabled, is_delivery_enabled, tax_percentage, is_tax_enabled)
VALUES
  ('Mie Gacoan Margonda',   'gacoan-margonda',       'GACOAN',   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240', '#ea580c', 30, true, true, false, 11, true),
  ('Mie Gacoan Ciater',     'gacoan-ciater',          'GACOAN',   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240', '#ea580c', 25, true, true, false, 11, true),
  ('Mie Gacoan Sawangan',   'gacoan-sawangan',        'GACOAN',   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240', '#ea580c', 20, true, true, true,  11, true),
  ('Mie Gacoan Cinere',     'gacoan-cinere',          'GACOAN',   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240', '#ea580c', 18, true, true, false, 11, true),
  ('Mie Gacoan Beji',       'gacoan-beji',            'GACOAN',   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240', '#ea580c', 22, true, false,false, 11, true),
  ('Kopi Kenangan Mall Depok',      'kenangan-mall-depok',       'KENANGAN', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240', '#78350f',  8, true, true, true,  11, false),
  ('Kopi Kenangan Grand Indonesia', 'kenangan-grand-indonesia',  'KENANGAN', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240', '#78350f',  6, true, true, true,  11, false),
  ('Kopi Kenangan Pondok Indah',    'kenangan-pondok-indah',     'KENANGAN', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240', '#78350f', 10, true, true, false, 11, false),
  ('Kopi Kenangan Sudirman',        'kenangan-sudirman',         'KENANGAN', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240', '#78350f',  5, true, true, true,  11, false),
  ('Bakso Malang Karapitan Depok',     'bakso-karapitan-depok',     'BAKSO',    'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=240', '#dc2626', 20, true, true, true,  0, false),
  ('Bakso Malang Karapitan Bekasi',    'bakso-karapitan-bekasi',    'BAKSO',    'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=240', '#dc2626', 15, true, true, false, 0, false),
  ('Bakso Malang Karapitan Tangerang', 'bakso-karapitan-tangerang', 'BAKSO',    'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=240', '#dc2626', 18, true, true, true,  0, false);

-- =========================================================================
-- AUTH USERS (password sudah di-hash: SuperAdmin123! / Admin123! / Manager123!)
-- Menggunakan $2a$10$... bcrypt hash agar tidak perlu pgcrypto di seed
-- Password: SuperAdmin123!
-- =========================================================================

DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated',
    'authenticated',
    'superadmin@omniorder.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_id,
    json_build_object(
      'sub', v_id::text,
      'email', 'superadmin@omniorder.com'
    ),
    'email',
    v_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  INSERT INTO profiles (id, role)
  VALUES (v_id, 'super_admin');
END $$;

-- ADMIN GACOAN (password: Admin123!)
DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'admin@miegacoan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'admin@miegacoan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, brand_code, role) VALUES (v_id, 'GACOAN', 'admin');
END $$;

-- ADMIN KENANGAN
DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'admin@kopikenangan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'admin@kopikenangan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, brand_code, role) VALUES (v_id, 'KENANGAN', 'admin');
END $$;

-- ADMIN BAKSO
DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'admin@baksokarapitan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'admin@baksokarapitan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, brand_code, role) VALUES (v_id, 'BAKSO', 'admin');
END $$;

-- MANAGERS GACOAN (password: Manager123!)
DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-margonda');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.margonda@miegacoan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.margonda@miegacoan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'GACOAN', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-ciater');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.ciater@miegacoan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.ciater@miegacoan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'GACOAN', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-sawangan');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.sawangan@miegacoan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.sawangan@miegacoan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'GACOAN', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-cinere');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.cinere@miegacoan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.cinere@miegacoan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'GACOAN', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-beji');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.beji@miegacoan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.beji@miegacoan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'GACOAN', 'manager');
END $$;

-- MANAGERS KENANGAN
DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'kenangan-mall-depok');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.malldepok@kopikenangan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.malldepok@kopikenangan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'KENANGAN', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'kenangan-grand-indonesia');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.gi@kopikenangan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.gi@kopikenangan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'KENANGAN', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'kenangan-pondok-indah');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.pi@kopikenangan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.pi@kopikenangan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'KENANGAN', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'kenangan-sudirman');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.sudirman@kopikenangan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.sudirman@kopikenangan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'KENANGAN', 'manager');
END $$;

-- MANAGERS BAKSO
DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'bakso-karapitan-depok');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.depok@baksokarapitan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.depok@baksokarapitan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'BAKSO', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'bakso-karapitan-bekasi');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.bekasi@baksokarapitan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.bekasi@baksokarapitan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'BAKSO', 'manager');
END $$;

DO $$
DECLARE v_id uuid := gen_random_uuid();
DECLARE v_outlet_id uuid := (SELECT id FROM outlets WHERE slug = 'bakso-karapitan-tangerang');
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'manager.tangerang@baksokarapitan.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, json_build_object('sub', v_id::text, 'email', 'manager.tangerang@baksokarapitan.com'), 'email', v_id::text, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, outlet_id, brand_code, role) VALUES (v_id, v_outlet_id, 'BAKSO', 'manager');
END $$;

-- =========================================================================
-- CATEGORIES & PRODUCTS — Pakai DO $$ untuk reference outlet by slug
-- =========================================================================

-- === GACOAN MARGONDA ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-margonda');
DECLARE cat_mie uuid; cat_dim uuid; cat_min uuid; cat_snk uuid;
DECLARE prod_suit uuid; prod_homp uuid; prod_setan uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Mie') RETURNING id INTO cat_mie;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Dimsum') RETURNING id INTO cat_dim;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman') RETURNING id INTO cat_min;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Snack & Gorengan') RETURNING id INTO cat_snk;

  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_mie, 'Mie Suit', 10000, 'Mie goreng/kuah khas Gacoan dengan bumbu rahasia. Bisa pilih level pedas.',
    'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true) RETURNING id INTO prod_suit;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_mie, 'Mie Hompimpa', 10000, 'Mie ayam jamur kuah kaldu spesial.',
    'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', true, true) RETURNING id INTO prod_homp;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_mie, 'Mie Angel', 12000, 'Mie spesial premium dengan topping lengkap pilihan chef.',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_mie, 'Mie Iblis', 13000, 'Mie super pedas dengan cabai pilihan.',
    'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_mie, 'Mie Setan', 14000, 'Mie level dewa dengan campuran cabai merah dan hijau.',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', true, true) RETURNING id INTO prod_setan;

  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_dim, 'Siomay Ayam (4 pcs)', 10000, 'Dimsum siomay lembut berisi ayam cincang bumbu spesial.',
    'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_dim, 'Lumpia Udang (3 pcs)', 12000, 'Lumpia garing dengan isian udang segar.',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', true, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_dim, 'Pangsit Goreng (5 pcs)', 10000, 'Pangsit renyah berisi daging ayam cincang.',
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_dim, 'Dimsum Campur (6 pcs)', 18000, 'Kombinasi siomay, lumpia, dan pangsit goreng.',
    'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', true, true);

  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_min, 'Es Teh Manis', 5000, 'Teh manis dingin segar.',
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_min, 'Es Jeruk', 7000, 'Jeruk peras segar dengan es batu.',
    'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_min, 'Kopi Susu Gula Aren', 12000, 'Espresso dengan susu dan gula aren premium.',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true);

  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_snk, 'Udang Rambutan (3 pcs)', 10000, 'Udang goreng tepung coating renyah khas Gacoan.',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_snk, 'Kentang Goreng', 8000, 'Kentang goreng crispy saus sambal pedas.',
    'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400', false, false);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available)
  VALUES (o_id, cat_snk, 'Ceker Pedas (3 pcs)', 9000, 'Ceker ayam bumbu pedas khas. Super gurih!',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', true, true);

  -- Modifiers: Mie Suit
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections)
  VALUES (prod_suit, 'Level Pedas', true, 1, 1),
         (prod_suit, 'Tipe Sajian', true, 1, 1),
         (prod_suit, 'Extra Topping', false, 0, 5);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 0 (Tidak Pedas)', 0 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 1 (Sedikit Pedas)', 0 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 2 (Sedang)', 0 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 3 (Pedas)', 0 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 4 (Sangat Pedas)', 0 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 5 (Mampus)', 2000 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kuah', 0 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Tipe Sajian';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Goreng', 0 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Tipe Sajian';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Telur Ceplok', 3000 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Extra Topping';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Pangsit Goreng', 4000 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Extra Topping';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Udang Rambutan', 5000 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Extra Topping';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Ceker Ayam', 5000 FROM product_modifiers WHERE product_id = prod_suit AND name = 'Extra Topping';

  -- Modifiers: Mie Hompimpa
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections)
  VALUES (prod_homp, 'Level Pedas', true, 1, 1),
         (prod_homp, 'Tipe Sajian', true, 1, 1);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 0 (Tidak Pedas)', 0 FROM product_modifiers WHERE product_id = prod_homp AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 1 (Sedikit Pedas)', 0 FROM product_modifiers WHERE product_id = prod_homp AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 2 (Sedang)', 0 FROM product_modifiers WHERE product_id = prod_homp AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 3 (Pedas)', 0 FROM product_modifiers WHERE product_id = prod_homp AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 4 (Sangat Pedas)', 0 FROM product_modifiers WHERE product_id = prod_homp AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 5 (Mampus)', 2000 FROM product_modifiers WHERE product_id = prod_homp AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kuah', 0 FROM product_modifiers WHERE product_id = prod_homp AND name = 'Tipe Sajian';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Goreng', 0 FROM product_modifiers WHERE product_id = prod_homp AND name = 'Tipe Sajian';

  -- Modifiers: Mie Setan
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections)
  VALUES (prod_setan, 'Level Pedas', true, 1, 1),
         (prod_setan, 'Extra Topping', false, 0, 3);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 3 (Pedas)', 0 FROM product_modifiers WHERE product_id = prod_setan AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 4 (Sangat Pedas)', 0 FROM product_modifiers WHERE product_id = prod_setan AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 5 (Mampus)', 0 FROM product_modifiers WHERE product_id = prod_setan AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Level 6 (Jangan Nyesal)', 3000 FROM product_modifiers WHERE product_id = prod_setan AND name = 'Level Pedas';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Ceker Ayam', 5000 FROM product_modifiers WHERE product_id = prod_setan AND name = 'Extra Topping';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Telur Ceplok', 3000 FROM product_modifiers WHERE product_id = prod_setan AND name = 'Extra Topping';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kerupuk Emping', 2000 FROM product_modifiers WHERE product_id = prod_setan AND name = 'Extra Topping';
END $$;

-- === GACOAN CIATER ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-ciater');
DECLARE cat_mie uuid; cat_dim uuid; cat_min uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Mie') RETURNING id INTO cat_mie;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Dimsum') RETURNING id INTO cat_dim;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman') RETURNING id INTO cat_min;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_mie, 'Mie Suit', 10000, 'Mie goreng/kuah khas Gacoan.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
    (o_id, cat_mie, 'Mie Hompimpa', 10000, 'Mie ayam jamur kuah kaldu.', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', false, true),
    (o_id, cat_mie, 'Mie Iblis', 13000, 'Mie super pedas level dewa!', 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400', true, true),
    (o_id, cat_mie, 'Mie Setan', 14000, 'Mie ekstra pedas untuk pecinta tantangan.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', false, true),
    (o_id, cat_dim, 'Siomay Ayam (4 pcs)', 10000, 'Dimsum siomay lembut.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true),
    (o_id, cat_dim, 'Lumpia Udang (3 pcs)', 12000, 'Lumpia garing udang segar.', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', true, true),
    (o_id, cat_dim, 'Pangsit Goreng (5 pcs)', 10000, 'Pangsit renyah.', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true),
    (o_id, cat_min, 'Es Teh Manis', 5000, 'Teh manis segar.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
    (o_id, cat_min, 'Es Jeruk', 7000, 'Jeruk peras segar.', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);
END $$;

-- === GACOAN SAWANGAN ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-sawangan');
DECLARE cat_mie uuid; cat_dim uuid; cat_min uuid; cat_snk uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Mie') RETURNING id INTO cat_mie;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Dimsum') RETURNING id INTO cat_dim;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman') RETURNING id INTO cat_min;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Snack & Gorengan') RETURNING id INTO cat_snk;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_mie, 'Mie Suit', 10000, 'Mie goreng/kuah dengan bumbu rahasia.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
    (o_id, cat_mie, 'Mie Angel', 12000, 'Mie premium topping lengkap.', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', true, true),
    (o_id, cat_mie, 'Mie Setan', 14000, 'Mie ekstra pedas.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', false, true),
    (o_id, cat_dim, 'Siomay Ayam (4 pcs)', 10000, 'Dimsum siomay ayam lembut.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true),
    (o_id, cat_dim, 'Pangsit Goreng (5 pcs)', 10000, 'Pangsit goreng renyah.', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', true, true),
    (o_id, cat_min, 'Es Teh Manis', 5000, 'Teh manis segar.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
    (o_id, cat_snk, 'Kentang Goreng', 8000, 'Kentang goreng crispy.', 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400', false, true);
END $$;

-- === GACOAN CINERE ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-cinere');
DECLARE cat_mie uuid; cat_dim uuid; cat_min uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Mie') RETURNING id INTO cat_mie;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Dimsum') RETURNING id INTO cat_dim;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman') RETURNING id INTO cat_min;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_mie, 'Mie Suit', 10000, 'Mie goreng/kuah dengan bumbu rahasia.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
    (o_id, cat_mie, 'Mie Hompimpa', 10000, 'Mie ayam jamur kuah kaldu.', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', false, true),
    (o_id, cat_mie, 'Mie Iblis', 13000, 'Mie super pedas.', 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400', true, true),
    (o_id, cat_dim, 'Dimsum Campur (6 pcs)', 18000, 'Kombinasi dimsum pilihan chef.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', true, true),
    (o_id, cat_min, 'Es Teh Manis', 5000, 'Teh manis segar.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
    (o_id, cat_min, 'Kopi Susu Gula Aren', 12000, 'Kopi susu premium gula aren.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true);
END $$;

-- === GACOAN BEJI ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'gacoan-beji');
DECLARE cat_mie uuid; cat_dim uuid; cat_min uuid; cat_snk uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Mie') RETURNING id INTO cat_mie;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Dimsum') RETURNING id INTO cat_dim;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman') RETURNING id INTO cat_min;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Snack & Gorengan') RETURNING id INTO cat_snk;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_mie, 'Mie Suit', 10000, 'Mie goreng/kuah khas Gacoan.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
    (o_id, cat_mie, 'Mie Angel', 12000, 'Mie premium topping chef.', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', true, true),
    (o_id, cat_mie, 'Mie Iblis', 13000, 'Mie super pedas.', 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400', false, true),
    (o_id, cat_dim, 'Lumpia Udang (3 pcs)', 12000, 'Lumpia garing udang segar.', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', true, true),
    (o_id, cat_dim, 'Pangsit Goreng (5 pcs)', 10000, 'Pangsit goreng renyah.', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true),
    (o_id, cat_min, 'Es Teh Manis', 5000, 'Teh manis segar.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
    (o_id, cat_min, 'Es Jeruk', 7000, 'Jeruk peras segar.', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true),
    (o_id, cat_snk, 'Udang Rambutan (3 pcs)', 10000, 'Udang goreng tepung renyah.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', false, true);
END $$;

-- === KENANGAN MALL DEPOK ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'kenangan-mall-depok');
DECLARE cat_kop uuid; cat_non uuid; cat_mak uuid;
DECLARE prod_latte uuid; prod_amer uuid; prod_matcha uuid; prod_roti uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Kopi') RETURNING id INTO cat_kop;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Non-Kopi') RETURNING id INTO cat_non;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Makanan Ringan') RETURNING id INTO cat_mak;

  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_kop, 'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren pilihan. Ikon Kopi Kenangan.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true) RETURNING id INTO prod_latte;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_kop, 'Americano', 18000, 'Espresso murni dengan air panas. Pahit menyegarkan.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', false, true) RETURNING id INTO prod_amer;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_kop, 'Cappuccino', 22000, 'Espresso dengan susu dan busa susu lembut.', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_kop, 'Caramel Macchiato', 27000, 'Latte dengan drizzle karamel di atas busa susu.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_non, 'Matcha Latte', 25000, 'Matcha premium Jepang dengan susu segar. Creamy dan earthy.', 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true) RETURNING id INTO prod_matcha;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_non, 'Coklat Premium', 22000, 'Coklat Belgia premium dengan susu segar.', 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_non, 'Taro Latte', 23000, 'Taro Jepang dengan susu segar.', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_mak, 'Roti Bakar', 15000, 'Roti bakar dengan mentega dan pilihan selai.', 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400', false, true) RETURNING id INTO prod_roti;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_mak, 'Croissant Butter', 18000, 'Croissant mentega panggang renyah dari luar, lembut dalam.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', true, true);

  -- Modifiers: Kenangan Latte
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections) VALUES
    (prod_latte, 'Ukuran', true, 1, 1), (prod_latte, 'Suhu', true, 1, 1),
    (prod_latte, 'Level Gula', true, 1, 1), (prod_latte, 'Extra Add-On', false, 0, 3);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Regular (250ml)', 0 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Ukuran';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Large (350ml)', 6000 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Ukuran';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Dingin (Iced)', 0 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Suhu';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Panas (Hot)', 0 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Suhu';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Normal (100%)', 0 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Level Gula';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Less Sugar (50%)', 0 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Level Gula';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'No Sugar (0%)', 0 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Level Gula';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Extra Shot Espresso', 5000 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Extra Add-On';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Boba Pearl', 5000 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Extra Add-On';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Whipped Cream', 3000 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Extra Add-On';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Almond Milk (ganti susu)', 8000 FROM product_modifiers WHERE product_id = prod_latte AND name = 'Extra Add-On';

  -- Modifiers: Americano
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections) VALUES
    (prod_amer, 'Ukuran', true, 1, 1), (prod_amer, 'Suhu', true, 1, 1);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Regular', 0 FROM product_modifiers WHERE product_id = prod_amer AND name = 'Ukuran';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Large', 5000 FROM product_modifiers WHERE product_id = prod_amer AND name = 'Ukuran';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Dingin (Iced)', 0 FROM product_modifiers WHERE product_id = prod_amer AND name = 'Suhu';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Panas (Hot)', 0 FROM product_modifiers WHERE product_id = prod_amer AND name = 'Suhu';

  -- Modifiers: Matcha Latte
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections) VALUES
    (prod_matcha, 'Ukuran', true, 1, 1), (prod_matcha, 'Suhu', true, 1, 1),
    (prod_matcha, 'Level Gula', true, 1, 1), (prod_matcha, 'Extra Add-On', false, 0, 2);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Regular', 0 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Ukuran';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Large', 6000 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Ukuran';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Dingin (Iced)', 0 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Suhu';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Panas (Hot)', 0 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Suhu';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Normal', 0 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Level Gula';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Less Sugar', 0 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Level Gula';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'No Sugar', 0 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Level Gula';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Boba Pearl', 5000 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Extra Add-On';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Double Matcha Shot', 7000 FROM product_modifiers WHERE product_id = prod_matcha AND name = 'Extra Add-On';

  -- Modifiers: Roti Bakar
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections) VALUES (prod_roti, 'Pilihan Selai', true, 1, 2);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Coklat', 0 FROM product_modifiers WHERE product_id = prod_roti AND name = 'Pilihan Selai';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Keju', 0 FROM product_modifiers WHERE product_id = prod_roti AND name = 'Pilihan Selai';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Strawberry', 0 FROM product_modifiers WHERE product_id = prod_roti AND name = 'Pilihan Selai';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Nanas', 0 FROM product_modifiers WHERE product_id = prod_roti AND name = 'Pilihan Selai';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kacang', 0 FROM product_modifiers WHERE product_id = prod_roti AND name = 'Pilihan Selai';
END $$;

-- === KENANGAN GRAND INDONESIA ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'kenangan-grand-indonesia');
DECLARE cat_kop uuid; cat_non uuid; cat_mak uuid; cat_bua uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Kopi') RETURNING id INTO cat_kop;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Non-Kopi') RETURNING id INTO cat_non;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Makanan Ringan') RETURNING id INTO cat_mak;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman Buah') RETURNING id INTO cat_bua;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_kop, 'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
    (o_id, cat_kop, 'Espresso', 16000, 'Espresso shot murni berkualitas tinggi.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', false, true),
    (o_id, cat_kop, 'Cappuccino', 22000, 'Espresso dengan susu dan busa susu.', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', false, true),
    (o_id, cat_non, 'Matcha Latte', 25000, 'Matcha premium dengan susu segar.', 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true),
    (o_id, cat_non, 'Strawberry Latte', 24000, 'Stroberi segar dengan susu.', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', false, true),
    (o_id, cat_mak, 'Roti Bakar Coklat', 17000, 'Roti bakar dengan selai coklat premium.', 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400', false, true),
    (o_id, cat_bua, 'Jeruk Peras', 20000, 'Jeruk segar diperas langsung.', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', true, true),
    (o_id, cat_bua, 'Watermelon Juice', 22000, 'Jus semangka segar tanpa tambahan gula.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true);
END $$;

-- === KENANGAN PONDOK INDAH ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'kenangan-pondok-indah');
DECLARE cat_kop uuid; cat_non uuid; cat_mak uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Kopi') RETURNING id INTO cat_kop;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Non-Kopi') RETURNING id INTO cat_non;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Makanan Ringan') RETURNING id INTO cat_mak;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_kop, 'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
    (o_id, cat_kop, 'Flat White', 23000, 'Espresso dengan susu steam ratio tinggi.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', false, true),
    (o_id, cat_non, 'Matcha Latte', 25000, 'Matcha premium dengan susu segar.', 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true),
    (o_id, cat_non, 'Coklat Premium', 22000, 'Coklat Belgia premium dengan susu segar.', 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400', false, true),
    (o_id, cat_mak, 'Croissant Butter', 18000, 'Croissant mentega panggang.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', true, true);
END $$;

-- === KENANGAN SUDIRMAN ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'kenangan-sudirman');
DECLARE cat_kop uuid; cat_non uuid; cat_mak uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Kopi') RETURNING id INTO cat_kop;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Non-Kopi') RETURNING id INTO cat_non;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Makanan Ringan') RETURNING id INTO cat_mak;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_kop, 'Kenangan Latte', 24000, 'Espresso dengan susu segar dan gula aren.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true, true),
    (o_id, cat_kop, 'Cold Brew', 22000, 'Kopi cold brew 12 jam. Smooth, tidak asam.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', true, true),
    (o_id, cat_kop, 'Americano', 18000, 'Espresso murni dengan air panas.', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', false, true),
    (o_id, cat_non, 'Matcha Latte', 25000, 'Matcha premium dengan susu segar.', 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true, true),
    (o_id, cat_mak, 'Roti Bakar', 15000, 'Roti bakar dengan mentega dan selai.', 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400', false, true);
END $$;

-- === BAKSO DEPOK ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'bakso-karapitan-depok');
DECLARE cat_bak uuid; cat_mie uuid; cat_top uuid; cat_min uuid;
DECLARE prod_urat uuid; prod_mieay uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Bakso') RETURNING id INTO cat_bak;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Mie & Bihun') RETURNING id INTO cat_mie;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Topping Tambahan') RETURNING id INTO cat_top;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman') RETURNING id INTO cat_min;

  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_bak, 'Bakso Urat Jumbo', 20000, 'Bakso daging sapi dengan urat, ukuran jumbo. Kenyal dan gurih.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true) RETURNING id INTO prod_urat;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_bak, 'Bakso Telur', 18000, 'Bakso jumbo berisi telur puyuh di dalamnya.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', false, true),
    (o_id, cat_bak, 'Bakso Mercon', 22000, 'Bakso super pedas berisi cabai halus. Berani coba?', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
    (o_id, cat_bak, 'Bakso Bakar', 20000, 'Bakso dibakar dengan bumbu kecap pedas. Smoky dan lezat.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', false, true);
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES (o_id, cat_mie, 'Mie Ayam Bakso', 18000, 'Mie ayam pangsit dengan bakso urat. Kuah kaldu spesial.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true) RETURNING id INTO prod_mieay;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_mie, 'Bihun Kuah Bakso', 16000, 'Bihun halus dengan kuah bakso gurih.', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', false, true),
    (o_id, cat_mie, 'Kwetiau Bakso', 17000, 'Kwetiau dengan kuah bakso sapi dan topping lengkap.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', false, true),
    (o_id, cat_top, 'Tahu Goreng (3 pcs)', 6000, 'Tahu kulit goreng renyah.', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true),
    (o_id, cat_top, 'Siomay (4 pcs)', 10000, 'Siomay kukus dengan saus kacang.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', false, true),
    (o_id, cat_min, 'Es Teh Tawar', 3000, 'Teh tawar tanpa gula.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
    (o_id, cat_min, 'Es Teh Manis', 4000, 'Teh manis dingin.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
    (o_id, cat_min, 'Es Jeruk', 6000, 'Jeruk peras segar.', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);

  -- Modifiers: Bakso Urat Jumbo
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections) VALUES
    (prod_urat, 'Pilihan Mie/Bihun', false, 0, 1),
    (prod_urat, 'Kuah', true, 1, 1),
    (prod_urat, 'Topping Tambahan', false, 0, 4);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Mie Kuning', 0 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Pilihan Mie/Bihun';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Bihun', 0 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Pilihan Mie/Bihun';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Tanpa Mie', 0 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Pilihan Mie/Bihun';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kuah Bening', 0 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Kuah';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kuah Pedas', 0 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Kuah';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Tanpa Kuah (Kering)', 0 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Kuah';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Tahu Goreng', 3000 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Topping Tambahan';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Pangsit Goreng', 4000 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Topping Tambahan';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Bakso Telur Tambah', 6000 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Topping Tambahan';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kerupuk', 2000 FROM product_modifiers WHERE product_id = prod_urat AND name = 'Topping Tambahan';

  -- Modifiers: Mie Ayam Bakso
  INSERT INTO product_modifiers (product_id, name, is_required, min_selections, max_selections) VALUES
    (prod_mieay, 'Tipe Sajian', true, 1, 1),
    (prod_mieay, 'Topping Tambahan', false, 0, 3);
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kuah', 0 FROM product_modifiers WHERE product_id = prod_mieay AND name = 'Tipe Sajian';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Campur (Kuah terpisah)', 0 FROM product_modifiers WHERE product_id = prod_mieay AND name = 'Tipe Sajian';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Kering (Tanpa Kuah)', 0 FROM product_modifiers WHERE product_id = prod_mieay AND name = 'Tipe Sajian';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Bakso Jumbo Tambah', 8000 FROM product_modifiers WHERE product_id = prod_mieay AND name = 'Topping Tambahan';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Tahu Goreng', 3000 FROM product_modifiers WHERE product_id = prod_mieay AND name = 'Topping Tambahan';
  INSERT INTO product_modifier_options (modifier_id, name, price_adjustment) SELECT id, 'Pangsit Goreng Tambah', 4000 FROM product_modifiers WHERE product_id = prod_mieay AND name = 'Topping Tambahan';
END $$;

-- === BAKSO BEKASI ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'bakso-karapitan-bekasi');
DECLARE cat_bak uuid; cat_mie uuid; cat_min uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Bakso') RETURNING id INTO cat_bak;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Mie & Bihun') RETURNING id INTO cat_mie;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman') RETURNING id INTO cat_min;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_bak, 'Bakso Urat Jumbo', 20000, 'Bakso daging sapi urat, kenyal dan gurih.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
    (o_id, cat_bak, 'Bakso Telur', 18000, 'Bakso dengan telur puyuh di dalamnya.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', false, true),
    (o_id, cat_bak, 'Bakso Mercon', 22000, 'Bakso pedas berisi cabai halus.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', false, true),
    (o_id, cat_mie, 'Mie Ayam Bakso', 18000, 'Mie ayam dengan bakso dan pangsit.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
    (o_id, cat_mie, 'Bihun Kuah Bakso', 16000, 'Bihun kuah bakso gurih.', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', false, true),
    (o_id, cat_min, 'Es Teh Tawar', 3000, 'Teh tawar dingin.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
    (o_id, cat_min, 'Es Jeruk', 6000, 'Jeruk peras segar.', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);
END $$;

-- === BAKSO TANGERANG ===
DO $$
DECLARE o_id uuid := (SELECT id FROM outlets WHERE slug = 'bakso-karapitan-tangerang');
DECLARE cat_bak uuid; cat_mie uuid; cat_top uuid; cat_min uuid;
BEGIN
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Bakso') RETURNING id INTO cat_bak;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Mie & Bihun') RETURNING id INTO cat_mie;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Topping Tambahan') RETURNING id INTO cat_top;
  INSERT INTO categories (outlet_id, name) VALUES (o_id, 'Minuman') RETURNING id INTO cat_min;
  INSERT INTO products (outlet_id, category_id, name, price, description, image_url, is_recommended, is_available) VALUES
    (o_id, cat_bak, 'Bakso Urat Jumbo', 20000, 'Bakso daging sapi urat ukuran jumbo.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
    (o_id, cat_bak, 'Bakso Mercon', 22000, 'Bakso pedas berisi cabai halus.', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=400', true, true),
    (o_id, cat_bak, 'Bakso Bakar', 20000, 'Bakso dibakar dengan kecap pedas.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', false, true),
    (o_id, cat_mie, 'Mie Ayam Bakso', 18000, 'Mie ayam dengan bakso pilihan.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, true),
    (o_id, cat_mie, 'Kwetiau Bakso', 17000, 'Kwetiau dengan kuah bakso dan topping.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', false, true),
    (o_id, cat_top, 'Tahu Goreng (3 pcs)', 6000, 'Tahu goreng renyah.', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', false, true),
    (o_id, cat_min, 'Es Teh Tawar', 3000, 'Teh tawar dingin.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, true),
    (o_id, cat_min, 'Es Jeruk', 6000, 'Jeruk peras segar.', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', false, true);
END $$;

-- =========================================================================
-- MODIFIER TAMBAHAN — untuk produk yang belum punya modifier + variasi baru
-- =========================================================================

-- 1. GACOAN: Level Pedas & Tipe Sajian untuk semua Mie di Ciater, Sawangan, Cinere, Beji
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id, p.name, o.slug FROM products p JOIN outlets o ON o.id = p.outlet_id
    WHERE o.slug IN ('gacoan-ciater','gacoan-sawangan','gacoan-cinere','gacoan-beji') AND p.name LIKE 'Mie%'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Level Pedas') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Level Pedas',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Level 0 (Tidak Pedas)',0),(m_id,'Level 1 (Sedikit Pedas)',0),(m_id,'Level 2 (Sedang)',0),(m_id,'Level 3 (Pedas)',0),(m_id,'Level 4 (Sangat Pedas)',0),(m_id,'Level 5 (Mampus)',2000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Tipe Sajian') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Tipe Sajian',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Kuah',0),(m_id,'Goreng',0);
    END IF;
  END LOOP;
END $$;

-- 2. GACOAN: Tambahan Sambal (bayar) untuk semua Mie/Dimsum/Snack di semua outlet Gacoan
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id, p.name FROM products p JOIN outlets o ON o.id = p.outlet_id
    JOIN categories c ON c.id = p.category_id
    WHERE o.brand_code = 'GACOAN' AND c.name IN ('Mie','Dimsum','Snack & Gorengan')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Tambahan Sambal') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Tambahan Sambal',false,0,2) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Sambal Ekstra Pedas',2000),(m_id,'Sambal Hijau',2000),(m_id,'Sambal Tomat',1000);
    END IF;
  END LOOP;
END $$;

-- 3. GACOAN: Level Gula + Es Batu untuk Minuman di semua outlet
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id FROM products p JOIN outlets o ON o.id = p.outlet_id
    JOIN categories c ON c.id = p.category_id
    WHERE o.brand_code = 'GACOAN' AND c.name = 'Minuman'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Level Gula') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Level Gula',false,0,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Normal',0),(m_id,'Less Sugar',0),(m_id,'No Sugar',0),(m_id,'Gula Tambahan',2000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Es Batu') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Es Batu',false,0,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Normal',0),(m_id,'Less Ice',0),(m_id,'Tanpa Es',0);
    END IF;
  END LOOP;
END $$;

-- 4. KENANGAN: Ukuran + Suhu + Level Gula + Extra Add-On untuk minuman di GI, Pondok Indah, Sudirman
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id FROM products p JOIN outlets o ON o.id = p.outlet_id
    JOIN categories c ON c.id = p.category_id
    WHERE o.slug IN ('kenangan-grand-indonesia','kenangan-pondok-indah','kenangan-sudirman')
      AND c.name IN ('Kopi','Non-Kopi','Minuman Buah')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Ukuran') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Ukuran',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Regular',0),(m_id,'Large',6000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Suhu') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Suhu',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Dingin (Iced)',0),(m_id,'Panas (Hot)',0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Level Gula') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Level Gula',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Normal',0),(m_id,'Less Sugar',0),(m_id,'No Sugar',0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Extra Add-On') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Extra Add-On',false,0,3) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Extra Shot Espresso',5000),(m_id,'Boba Pearl',5000),(m_id,'Whipped Cream',3000),(m_id,'Gula Aren Tambahan',2000);
    END IF;
  END LOOP;
END $$;

-- 5. KENANGAN MALL DEPOK: Ukuran + Suhu + Level Gula + Extra Add-On untuk produk minuman yg belum punya
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id FROM products p JOIN outlets o ON o.id = p.outlet_id
    WHERE o.slug = 'kenangan-mall-depok' AND p.name IN ('Cappuccino','Caramel Macchiato','Coklat Premium','Taro Latte')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Ukuran') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Ukuran',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Regular',0),(m_id,'Large',6000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Suhu') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Suhu',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Dingin (Iced)',0),(m_id,'Panas (Hot)',0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Level Gula') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Level Gula',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Normal',0),(m_id,'Less Sugar',0),(m_id,'No Sugar',0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Extra Add-On') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Extra Add-On',false,0,3) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Boba Pearl',5000),(m_id,'Whipped Cream',3000),(m_id,'Gula Aren Tambahan',2000);
    END IF;
  END LOOP;
END $$;

-- 6. KENANGAN: Pilihan Selai untuk semua Roti Bakar di semua outlet
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id FROM products p JOIN outlets o ON o.id = p.outlet_id
    WHERE o.brand_code = 'KENANGAN' AND p.name LIKE 'Roti Bakar%'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Pilihan Selai') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Pilihan Selai',true,1,2) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Coklat',0),(m_id,'Keju',0),(m_id,'Strawberry',0),(m_id,'Kacang',0);
    END IF;
  END LOOP;
END $$;

-- 7. BAKSO BEKASI & TANGERANG: Pilihan Mie/Bihun + Kuah + Topping untuk semua produk Bakso
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id, p.name FROM products p JOIN outlets o ON o.id = p.outlet_id
    WHERE o.slug IN ('bakso-karapitan-bekasi','bakso-karapitan-tangerang')
      AND p.name IN ('Bakso Urat Jumbo','Bakso Telur','Bakso Mercon','Bakso Bakar')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Pilihan Mie/Bihun') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Pilihan Mie/Bihun',false,0,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Mie Kuning',0),(m_id,'Bihun',0),(m_id,'Tanpa Mie',0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Kuah') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Kuah',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Kuah Bening',0),(m_id,'Kuah Pedas',0),(m_id,'Tanpa Kuah (Kering)',0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Topping Tambahan') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Topping Tambahan',false,0,4) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Tahu Goreng',3000),(m_id,'Pangsit Goreng',4000),(m_id,'Bakso Telur Tambah',6000),(m_id,'Kerupuk',2000),(m_id,'Sambal Ekstra',2000);
    END IF;
  END LOOP;
END $$;

-- 8. BAKSO BEKASI & TANGERANG: Tipe Sajian + Topping untuk Mie & Bihun
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id, p.name FROM products p JOIN outlets o ON o.id = p.outlet_id
    WHERE o.slug IN ('bakso-karapitan-bekasi','bakso-karapitan-tangerang')
      AND p.name IN ('Mie Ayam Bakso','Bihun Kuah Bakso','Kwetiau Bakso')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Tipe Sajian') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Tipe Sajian',true,1,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Kuah',0),(m_id,'Campur (Kuah terpisah)',0),(m_id,'Kering (Tanpa Kuah)',0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Topping Tambahan') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Topping Tambahan',false,0,3) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Bakso Jumbo Tambah',8000),(m_id,'Tahu Goreng',3000),(m_id,'Pangsit Goreng Tambah',4000),(m_id,'Sambal Ekstra',2000);
    END IF;
  END LOOP;
END $$;

-- 9. BAKSO DEPOK: Tambahan Sambal untuk produk yg sdh punya modifier
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id FROM products p JOIN outlets o ON o.id = p.outlet_id
    WHERE o.slug = 'bakso-karapitan-depok' AND p.name IN ('Bakso Urat Jumbo','Mie Ayam Bakso')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Tambahan Sambal') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Tambahan Sambal',false,0,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Sambal Ekstra',2000),(m_id,'Sambal Hijau',2000);
    END IF;
  END LOOP;
END $$;

-- 10. BAKSO: Minuman (Es Teh, Es Jeruk) tambah Level Gula + Es Batu di semua outlet
DO $$
DECLARE r RECORD; m_id uuid;
BEGIN
  FOR r IN SELECT p.id FROM products p JOIN outlets o ON o.id = p.outlet_id
    JOIN categories c ON c.id = p.category_id
    WHERE o.brand_code = 'BAKSO' AND c.name = 'Minuman'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Level Gula') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Level Gula',false,0,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Normal',0),(m_id,'Less Sugar',0),(m_id,'No Sugar',0),(m_id,'Gula Tambahan',2000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_modifiers WHERE product_id = r.id AND name = 'Es Batu') THEN
      INSERT INTO product_modifiers (product_id,name,is_required,min_selections,max_selections) VALUES (r.id,'Es Batu',false,0,1) RETURNING id INTO m_id;
      INSERT INTO product_modifier_options (modifier_id,name,price_adjustment) VALUES (m_id,'Normal',0),(m_id,'Less Ice',0),(m_id,'Tanpa Es',0);
    END IF;
  END LOOP;
END $$;

-- =========================================================================
-- RINGKASAN AKUN (password default pakai hash 'password' dari laravel/bcrypt contoh):
-- CATATAN: Hash yang digunakan adalah bcrypt dari string 'password' untuk contoh
-- Harap reset password via Supabase Dashboard setelah seeding
-- superadmin@omniorder.com
-- admin@miegacoan.com | admin@kopikenangan.com | admin@baksokarapitan.com
-- manager.margonda/ciater/sawangan/cinere/beji @miegacoan.com
-- manager.malldepok/gi/pi/sudirman @kopikenangan.com
-- manager.depok/bekasi/tangerang @baksokarapitan.com
-- =========================================================================
