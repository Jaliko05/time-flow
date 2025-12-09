-- Migration: Add Task support and Calendar integration to Activities
-- Date: 2024-12-09
-- Description: Adds task_id, task_name, and calendar_event_id columns to activities table

-- Add task_id column (foreign key to tasks)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;

-- Add task_name column
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS task_name TEXT;

-- Add calendar_event_id column for Microsoft Calendar integration
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

-- Create index on task_id for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_task_id ON activities(task_id);

-- Create index on calendar_event_id for duplicate detection
CREATE INDEX IF NOT EXISTS idx_activities_calendar_event_id ON activities(calendar_event_id);

-- Note: The tasks table will be created automatically by GORM AutoMigrate
-- But if you need to create it manually, here's the structure:

/*
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'backlog',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    estimated_hours NUMERIC DEFAULT 0,
    used_hours NUMERIC DEFAULT 0,
    remaining_hours NUMERIC DEFAULT 0,
    completion_percent NUMERIC DEFAULT 0,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    due_date TIMESTAMP,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user_id ON tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
*/
