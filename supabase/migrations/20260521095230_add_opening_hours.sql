-- Add open_time and close_time to outlets table
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS open_time TIME NOT NULL DEFAULT '08:00:00';
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS close_time TIME NOT NULL DEFAULT '22:00:00';

-- We might also need tables for modifiers if they don't exist yet, but the user said they already had menus and choices. Let's assume product_modifiers and product_modifier_options exist.
