-- ============================================================
-- PlantMedPro — Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor:
-- https://horgkvajmejfbkrtsuqi.supabase.co/project/default/sql
-- ============================================================

-- Diagnoses History Table
-- Stores every plant disease scan result
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  crop text NOT NULL DEFAULT '',
  disease text NOT NULL DEFAULT '',
  confidence integer DEFAULT 0,
  severity text DEFAULT 'Low',
  type text DEFAULT 'Fungus',
  source text DEFAULT 'Gemini AI',
  image_uri text
);

-- Enable Row Level Security (keep data open for now since no auth)
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- Allow all operations (update this when you add auth)
CREATE POLICY "Allow all for now" ON diagnoses
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast ordering by date
CREATE INDEX IF NOT EXISTS diagnoses_created_at_idx ON diagnoses (created_at DESC);

-- ============================================================
-- Verification Query — Run this to confirm tables are ready:
-- ============================================================

SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'diagnoses'
ORDER BY ordinal_position;
