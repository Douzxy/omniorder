-- Create product_modifiers and product_modifier_options tables (idempotent)
-- These are already created in initial_schema.sql. This migration is kept for history.

-- Tables already exist with IF NOT EXISTS in initial schema
-- Policies already set in initial schema
-- This migration is a no-op when initial schema is applied first.

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
