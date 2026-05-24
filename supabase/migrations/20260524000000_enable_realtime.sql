-- 1. Ensure supabase_realtime publication exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Enable REPLICA IDENTITY FULL for these tables
-- This ensures that UPDATE and DELETE events broadcast the old values as well as the new ones, which is necessary for correct state filtering.
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE categories REPLICA IDENTITY FULL;
ALTER TABLE product_modifiers REPLICA IDENTITY FULL;
ALTER TABLE product_modifier_options REPLICA IDENTITY FULL;

-- 3. Add tables to the supabase_realtime publication
DO $$
DECLARE
  tables_to_add text[] := ARRAY['orders', 'products', 'categories', 'product_modifiers', 'product_modifier_options'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables_to_add LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr 
      JOIN pg_class c ON pr.prrelid = c.oid 
      JOIN pg_publication p ON pr.prpubid = p.oid 
      WHERE p.pubname = 'supabase_realtime' AND c.relname = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;
