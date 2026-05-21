-- Menambahkan pengaturan min dan max selection pada product_modifiers
ALTER TABLE product_modifiers 
ADD COLUMN IF NOT EXISTS min_selections INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_selections INTEGER DEFAULT 1;

-- Update data lama: jika is_required = true, maka min_selections = 1
UPDATE product_modifiers SET min_selections = 1 WHERE is_required = true;
