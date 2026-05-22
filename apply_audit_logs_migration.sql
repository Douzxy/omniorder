-- =========================================================================
-- Audit Logs Table Migration
-- Run this in Supabase Dashboard > SQL Editor
-- =========================================================================

-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,           -- 'create' | 'update' | 'delete'
    entity_type TEXT NOT NULL,      -- 'product' | 'category' | 'order' | 'brand' | 'outlet' | etc.
    entity_id TEXT,                 -- UUID of the affected record (stored as text for flexibility)
    old_data JSONB,                 -- snapshot before the change (null for creates)
    new_data JSONB,                 -- snapshot after the change (null for deletes)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_outlet_id ON audit_logs(outlet_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "insert_own_audit_log" ON audit_logs;
DROP POLICY IF EXISTS "read_audit_logs" ON audit_logs;

-- Authenticated users can insert their own audit logs
CREATE POLICY "insert_own_audit_log" ON audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Scoped reads by role:
--   super_admin  → all logs
--   brand_admin  → logs for outlets belonging to their brand
--   outlet_admin / manager → logs for their own outlet only
CREATE POLICY "read_audit_logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND (
                profiles.role = 'super_admin'
                OR (
                  profiles.role IN ('brand_admin')
                  AND EXISTS (
                    SELECT 1 FROM outlets
                    WHERE outlets.id = audit_logs.outlet_id
                      AND outlets.brand_code = profiles.brand_code
                  )
                )
                OR (
                  profiles.role IN ('outlet_admin', 'manager')
                  AND profiles.outlet_id = audit_logs.outlet_id
                )
              )
        )
    );

-- No UPDATE or DELETE policies — audit logs are immutable
