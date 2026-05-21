-- Create product_modifiers table
CREATE TABLE IF NOT EXISTS public.product_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_modifier_options table
CREATE TABLE IF NOT EXISTS public.product_modifier_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modifier_id UUID NOT NULL REFERENCES public.product_modifiers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_modifiers_product_id ON public.product_modifiers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modifier_options_modifier_id ON public.product_modifier_options(modifier_id);

-- Enable RLS
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifier_options ENABLE ROW LEVEL SECURITY;

-- Allow public read access to modifiers and options
CREATE POLICY "Public read access for product_modifiers" 
    ON public.product_modifiers FOR SELECT USING (true);

CREATE POLICY "Public read access for product_modifier_options" 
    ON public.product_modifier_options FOR SELECT USING (true);

-- Allow authenticated admins to fully manage these tables
CREATE POLICY "Admin full access for product_modifiers" 
    ON public.product_modifiers FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access for product_modifier_options" 
    ON public.product_modifier_options FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
