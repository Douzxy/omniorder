-- Migration: Add stock and sku columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
