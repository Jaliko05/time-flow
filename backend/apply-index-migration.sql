-- ==================================================
-- MIGRATION: Add index to users.area_id
-- ==================================================
-- This fixes the slow SQL query issue (30+ seconds)
-- when filtering users by area_id
--
-- Run this in your PostgreSQL client (pgAdmin, DBeaver, etc.)
-- Database: timeflow
-- ==================================================

-- Create the index
CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);

-- Verify the index was created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
  AND indexname = 'idx_users_area_id';

-- Test query performance (should be much faster now)
EXPLAIN ANALYZE 
SELECT * FROM users WHERE area_id = 1;
