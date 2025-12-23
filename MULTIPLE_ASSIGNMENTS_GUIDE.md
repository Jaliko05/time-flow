# Multiple User Assignments - API Guide

## Overview

Projects can now be assigned to multiple users simultaneously, improving team collaboration and task management.

## Backend Changes

### New Database Table

- **project_assignments**: Junction table managing many-to-many relationships between projects and users
  - `project_id`: Foreign key to projects
  - `user_id`: Foreign key to users
  - `assigned_by`: User who made the assignment
  - `is_active`: Whether assignment is currently active
  - `can_modify`: Permission level for the assigned user
  - `assigned_at`, `unassigned_at`: Timestamps

### API Endpoints

#### 1. Create Project with Multiple Assignments

**POST** `/api/projects`

```json
{
  "name": "New Multi-User Project",
  "description": "Project description",
  "project_type": "area",
  "assigned_user_ids": [3, 5, 7], // Array of user IDs
  "priority": "high",
  "start_date": "2025-12-23",
  "due_date": "2025-12-31"
}
```

**Backward Compatibility:**

```json
{
  "name": "Legacy Project",
  "assigned_user_id": 3 // Still works, will be converted internally
}
```

#### 2. Update Project Assignments

**PUT** `/api/projects/:id`

```json
{
  "name": "Updated Project",
  "assigned_user_ids": [3, 5, 7, 9] // Replaces all current assignments
}
```

**Note:** Sending `assigned_user_ids` will:

- Deactivate all current assignments
- Create/reactivate assignments for specified users
- Update project status to "assigned"

### Response Format

Projects now include:

```json
{
  "id": 1,
  "name": "Project Name",
  "assigned_users": [
    {
      "id": 3,
      "name": "User One",
      "email": "user1@example.com"
    },
    {
      "id": 5,
      "name": "User Two",
      "email": "user2@example.com"
    }
  ],
  "project_assignments": [
    {
      "id": 1,
      "project_id": 1,
      "user_id": 3,
      "assigned_by": 1,
      "is_active": true,
      "can_modify": true,
      "assigned_at": "2025-12-23T10:00:00Z"
    }
  ]
}
```

### Permission Rules

- **Area Admins**: Can only assign users from their own area
- **SuperAdmins**: Can assign any user to any project
- **Users**: Cannot assign projects (view-only)

### Validation

- All user IDs must exist in the database
- For area projects, assigned users must belong to the same area as the admin
- Invalid user IDs return 404 error
- Cross-area assignments return 403 error

## Frontend Integration

### Updating Create/Edit Forms

Change from single select to multi-select:

```jsx
// Before (single user)
<Select
  value={assignedUserId}
  onChange={setAssignedUserId}
>
  {users.map(user => (
    <Option key={user.id} value={user.id}>
      {user.name}
    </Option>
  ))}
</Select>

// After (multiple users)
<MultiSelect
  value={assignedUserIds}
  onChange={setAssignedUserIds}
  placeholder="Select team members"
>
  {users.map(user => (
    <MultiSelectItem key={user.id} value={user.id}>
      {user.name}
    </MultiSelectItem>
  ))}
</MultiSelect>
```

### API Request Format

```javascript
// Create project with multiple assignments
const response = await api.post("/projects", {
  name: projectName,
  description: projectDescription,
  project_type: "area",
  assigned_user_ids: [3, 5, 7], // Array of user IDs
  priority: "high",
  start_date: "2025-12-23",
  due_date: "2025-12-31",
});

// Update assignments
const response = await api.put(`/projects/${projectId}`, {
  assigned_user_ids: [3, 5, 7, 9], // New array replaces old assignments
});
```

### Display Assigned Users

```jsx
// Show all assigned users
<div className="assigned-users">
  {project.assigned_users?.map(user => (
    <Avatar key={user.id} name={user.name} />
  ))}
</div>

// Or with details
<div className="team-members">
  <h3>Team Members ({project.assigned_users?.length || 0})</h3>
  {project.assigned_users?.map(user => (
    <div key={user.id} className="team-member">
      <Avatar src={user.avatar} />
      <span>{user.name}</span>
      <span>{user.email}</span>
    </div>
  ))}
</div>
```

## Migration

Run the migration to create the `project_assignments` table:

```bash
# Apply the migration
psql -U your_user -d your_database -f backend/migrations/add_project_assignments.sql
```

The migration will:

1. Create the `project_assignments` table
2. Add necessary indexes
3. Migrate existing single assignments to the new table
4. Keep `assigned_user_id` column for backward compatibility (deprecated)

## Testing

### Test Cases

1. **Create project with multiple users**

   - POST with `assigned_user_ids: [3, 5, 7]`
   - Verify 3 assignments created
   - Check all users see the project

2. **Update assignments**

   - PUT with different `assigned_user_ids`
   - Verify old assignments deactivated
   - Verify new assignments created

3. **Area admin restrictions**

   - Try assigning user from different area
   - Should return 403 error

4. **Backward compatibility**

   - POST with `assigned_user_id: 3`
   - Should work and create single assignment

5. **User access**
   - User should see only projects where they have active assignment
   - User cannot see projects where assignment is inactive

## Benefits

✅ Multiple team members can collaborate on same project
✅ Better reflects real-world workflows
✅ Maintains audit trail of who assigned whom
✅ Backward compatible with existing single-assignment code
✅ Flexible permission system (can_modify flag)
✅ Easy to activate/deactivate assignments without deletion

## Next Steps

For Activities/Tasks, the same pattern can be applied using the existing `ActivityAssignment` and `TaskAssignment` models.
