-- Migration: Add index to area_id column in users table for performance
-- This fixes the slow query issue when filtering users by area

CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);

-- Verify index was created
-- You can run: SELECT * FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_area_id';
