-- Migration: Normalize and optimize database schema
-- This migration removes deprecated fields and adds composite indexes

-- ============================================
-- 1. Remove deprecated assigned_user_id columns
-- ============================================

-- Drop indexes related to deprecated fields
DROP INDEX IF EXISTS idx_projects_assigned_user_id;
DROP INDEX IF EXISTS idx_tasks_assigned_user_id;

-- Remove the deprecated columns (data already migrated to assignment tables)
ALTER TABLE projects DROP COLUMN IF EXISTS assigned_user_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_user_id;

-- ============================================
-- 2. Add new indexes for Projects
-- ============================================

-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Index for project_type filtering
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type) WHERE deleted_at IS NULL;

-- Index for status filtering (improved)
DROP INDEX IF EXISTS idx_projects_status;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE deleted_at IS NULL;

-- ============================================
-- 3. Add composite indexes for Tasks
-- ============================================

-- Composite index for project + status queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;

-- ============================================
-- 4. Add composite indexes for ProjectAssignments
-- ============================================

-- Unique constraint for project-user combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_assignments_project_user 
ON project_assignments(project_id, user_id) WHERE deleted_at IS NULL;

-- Index for finding active assignments by project
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_active 
ON project_assignments(project_id, is_active) WHERE deleted_at IS NULL;

-- Index for finding active assignments by user
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_active 
ON project_assignments(user_id, is_active) WHERE deleted_at IS NULL;

-- ============================================
-- 5. Add composite indexes for TaskAssignments
-- ============================================

-- Unique constraint for task-user combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_assignments_task_user 
ON task_assignments(task_id, user_id) WHERE deleted_at IS NULL;

-- Index for finding active assignments by task
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_active 
ON task_assignments(task_id, is_active) WHERE deleted_at IS NULL;

-- Index for finding active assignments by user
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_task_active 
ON task_assignments(user_id, is_active) WHERE deleted_at IS NULL;

-- ============================================
-- 6. Add composite indexes for Activities
-- ============================================

-- Common query patterns for time tracking

-- User activities by date range
CREATE INDEX IF NOT EXISTS idx_activities_user_date 
ON activities(user_id, date DESC) WHERE deleted_at IS NULL;

-- Area activities by date range
CREATE INDEX IF NOT EXISTS idx_activities_area_date 
ON activities(area_id, date DESC) WHERE deleted_at IS NULL AND area_id IS NOT NULL;

-- Project activities by date range
CREATE INDEX IF NOT EXISTS idx_activities_project_date 
ON activities(project_id, date DESC) WHERE deleted_at IS NULL AND project_id IS NOT NULL;

-- Make calendar_event_id unique to prevent duplicates from sync
DROP INDEX IF EXISTS idx_activities_calendar_event_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_calendar_event_id_unique 
ON activities(calendar_event_id) WHERE calendar_event_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================
-- 7. Add defaults for numeric fields
-- ============================================

-- Projects
ALTER TABLE projects ALTER COLUMN estimated_hours SET DEFAULT 0;
ALTER TABLE projects ALTER COLUMN used_hours SET DEFAULT 0;
ALTER TABLE projects ALTER COLUMN remaining_hours SET DEFAULT 0;
ALTER TABLE projects ALTER COLUMN completion_percent SET DEFAULT 0;

-- Tasks
ALTER TABLE tasks ALTER COLUMN estimated_hours SET DEFAULT 0;
ALTER TABLE tasks ALTER COLUMN used_hours SET DEFAULT 0;
ALTER TABLE tasks ALTER COLUMN remaining_hours SET DEFAULT 0;
ALTER TABLE tasks ALTER COLUMN completion_percent SET DEFAULT 0;

-- Activities
ALTER TABLE activities ALTER COLUMN execution_time SET DEFAULT 0;

-- ============================================
-- 8. Update existing NULL values to 0
-- ============================================

-- Projects
UPDATE projects SET 
    estimated_hours = 0 WHERE estimated_hours IS NULL,
    used_hours = 0 WHERE used_hours IS NULL,
    remaining_hours = 0 WHERE remaining_hours IS NULL,
    completion_percent = 0 WHERE completion_percent IS NULL;

-- Tasks
UPDATE tasks SET 
    estimated_hours = 0 WHERE estimated_hours IS NULL,
    used_hours = 0 WHERE used_hours IS NULL,
    remaining_hours = 0 WHERE remaining_hours IS NULL,
    completion_percent = 0 WHERE completion_percent IS NULL;

-- Activities
UPDATE activities SET execution_time = 0 WHERE execution_time IS NULL;

-- ============================================
-- 9. Analyze tables for query planner
-- ============================================

ANALYZE projects;
ANALYZE tasks;
ANALYZE project_assignments;
ANALYZE task_assignments;
ANALYZE activities;

-- ============================================
-- Migration Summary
-- ============================================
-- Changes applied:
-- ✅ Removed deprecated assigned_user_id columns
-- ✅ Added composite indexes for common query patterns
-- ✅ Added unique constraints to prevent duplicate assignments
-- ✅ Optimized indexes with WHERE clauses for soft deletes
-- ✅ Added defaults for numeric fields
-- ✅ Updated existing NULL values to sensible defaults
-- ✅ Analyzed tables for better query planning
--
-- Performance improvements:
-- - Faster project/task queries by status
-- - Faster assignment lookups
-- - Faster time tracking reports by date ranges
-- - Prevented duplicate assignments
-- - Better use of indexes with partial indexes
