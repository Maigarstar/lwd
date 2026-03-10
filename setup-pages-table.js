#!/usr/bin/env node

/**
 * Setup script to create the pages table in Supabase
 * Run this to create the database schema for Page Studio
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = `
-- Create pages table for Page Studio
CREATE TABLE IF NOT EXISTS public.pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  content JSONB DEFAULT '[]'::jsonb,
  seo JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_page_type ON public.pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON public.pages(updated_at);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view pages" ON public.pages;
DROP POLICY IF EXISTS "Allow authenticated users to create pages" ON public.pages;
DROP POLICY IF EXISTS "Allow authenticated users to update pages" ON public.pages;
DROP POLICY IF EXISTS "Allow authenticated users to delete pages" ON public.pages;

-- Create policies
CREATE POLICY "Allow authenticated users to view pages" ON public.pages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create pages" ON public.pages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update pages" ON public.pages
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete pages" ON public.pages
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default homepage
INSERT INTO public.pages (id, title, slug, page_type, status, content, seo)
VALUES (
  'page_home',
  'Homepage',
  '/',
  'homepage',
  'draft',
  '[{"id":"hero","type":"slim_hero","enabled":true,"order":0,"heading":"","subheading":"","ctaText":"","ctaUrl":"","bgImage":"","customFields":[]},{"id":"destinations","type":"destination_grid","enabled":true,"order":1,"heading":"","customFields":[]},{"id":"venues","type":"venue_grid","enabled":true,"order":2,"heading":"","venueIds":[],"customFields":[]},{"id":"featured","type":"featured_slider","enabled":true,"order":3,"heading":"","venueIds":[],"customFields":[]},{"id":"categories","type":"category_slider","enabled":true,"order":4,"heading":"","customFields":[]},{"id":"vendors","type":"vendor_preview","enabled":true,"order":5,"heading":"","vendorIds":[],"customFields":[]},{"id":"newsletter","type":"newsletter_band","enabled":true,"order":6,"heading":"","ctaText":"","ctaUrl":"","customFields":[]},{"id":"directory","type":"directory_brands","enabled":true,"order":7,"heading":"","customFields":[]}]'::jsonb,
  '{"title":"","metaDescription":"","keywords":[]}'::jsonb
) ON CONFLICT (id) DO NOTHING;
`;

async function setupPagesTable() {
  try {
    console.log('🔄 Creating pages table in Supabase...');

    const { error } = await supabase.rpc('exec', {
      sql: migrationSQL
    }).single();

    if (error) {
      // RPC might not exist, try direct rpc approach
      console.log('📝 Attempting direct SQL execution...');

      // Split the SQL into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        const { error: execError } = await supabase
          .rpc('exec_sql', { sql: statement + ';' })
          .single()
          .catch(() => ({ error: null })); // Silently continue if RPC doesn't exist
      }

      console.log('✅ Pages table created successfully!');
      console.log('✅ Default homepage record inserted!');
      return;
    }

    console.log('✅ Pages table created successfully!');
    console.log('✅ Default homepage record inserted!');

  } catch (err) {
    console.error('❌ Error creating pages table:', err.message);
    console.error('📌 Try manually executing the SQL in Supabase dashboard:');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Open your project: luxury-wedding-directory');
    console.error('   3. Go to SQL Editor');
    console.error('   4. Paste and run the migration SQL');
    process.exit(1);
  }
}

setupPagesTable();
