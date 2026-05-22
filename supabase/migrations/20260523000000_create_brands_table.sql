-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    brand_color TEXT NOT NULL DEFAULT '#2563eb',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- RLS: super_admin can CRUD, others can read
CREATE POLICY "super_admin_all_brands" ON brands
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "all_read_brands" ON brands
  FOR SELECT USING (true);

-- Insert initial brands with lowercase codes
INSERT INTO brands (code, name, logo_url, brand_color) VALUES
    ('gacoan',   'Mie Gacoan',           'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240', '#ea580c'),
    ('kenangan', 'Kopi Kenangan',        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240', '#78350f'),
    ('bakso',    'Bakso Malang Karapitan', 'https://images.unsplash.com/photo-1598490947619-2c35fc9aa908?w=240', '#dc2626')
ON CONFLICT (code) DO NOTHING;
