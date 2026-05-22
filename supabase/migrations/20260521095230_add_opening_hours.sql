-- Add open_time and close_time to outlets table (idempotent, already in initial schema)
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS open_time TIME NOT NULL DEFAULT '08:00:00';
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS close_time TIME NOT NULL DEFAULT '22:00:00';
