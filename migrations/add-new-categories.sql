-- ============================================
-- 👑 KING BLOGGERS - Add New Categories
-- ============================================
-- Run this SQL in CockroachDB to add the new categories
-- self_growth and finances to the post_category enum
-- ============================================

-- Add 'self_growth' to the post_category enum
ALTER TYPE post_category ADD VALUE IF NOT EXISTS 'self_growth';

-- Add 'finances' to the post_category enum  
ALTER TYPE post_category ADD VALUE IF NOT EXISTS 'finances';

-- Verify the enum values (optional - run to confirm)
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'post_category'::regtype;

-- ============================================
-- NOTE: CockroachDB supports ADD VALUE IF NOT EXISTS
-- If you get an error, the values may already exist
-- ============================================
