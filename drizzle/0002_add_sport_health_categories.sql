-- Migration: Add Sport and Health categories
-- Date: 2026-01-11

-- Add new enum values to post_category
ALTER TYPE post_category ADD VALUE IF NOT EXISTS 'sport';
ALTER TYPE post_category ADD VALUE IF NOT EXISTS 'health';
