-- Migration: Add parent_id column to tasks table for sub-tasks support
-- Date: 2024-12-24

-- Add parent_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;

-- Create index for parent_id
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'parent_id';
