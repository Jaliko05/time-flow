-- Migration: Add project_assignments table for multiple user assignments
-- This allows projects to be assigned to multiple users

CREATE TABLE IF NOT EXISTS project_assignments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    can_modify BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    unassigned_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_id ON project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_is_active ON project_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_project_assignments_deleted_at ON project_assignments(deleted_at);

-- Migrate existing single assignments to the new table
INSERT INTO project_assignments (project_id, user_id, assigned_by, is_active, can_modify, created_at, updated_at)
SELECT 
    id as project_id,
    assigned_user_id as user_id,
    created_by as assigned_by,
    TRUE as is_active,
    TRUE as can_modify,
    created_at,
    updated_at
FROM projects
WHERE assigned_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Note: We keep the assigned_user_id column for backward compatibility
-- It will be deprecated in future versions
COMMENT ON COLUMN projects.assigned_user_id IS 'DEPRECATED: Use project_assignments table instead';
