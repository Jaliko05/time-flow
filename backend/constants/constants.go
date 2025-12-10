package constants

// Role constants
type Role string

const (
	RoleUser       Role = "user"
	RoleAdmin      Role = "admin"
	RoleSuperAdmin Role = "superadmin"
)

// Project Type constants
type ProjectType string

const (
	ProjectTypePersonal ProjectType = "personal"
	ProjectTypeArea     ProjectType = "area"
)

// Project Status constants
type ProjectStatus string

const (
	ProjectStatusUnassigned ProjectStatus = "unassigned"
	ProjectStatusAssigned   ProjectStatus = "assigned"
	ProjectStatusInProgress ProjectStatus = "in_progress"
	ProjectStatusPaused     ProjectStatus = "paused"
	ProjectStatusCompleted  ProjectStatus = "completed"
)

// Project Priority constants
type ProjectPriority string

const (
	ProjectPriorityLow      ProjectPriority = "low"
	ProjectPriorityMedium   ProjectPriority = "medium"
	ProjectPriorityHigh     ProjectPriority = "high"
	ProjectPriorityCritical ProjectPriority = "critical"
)

// Task Status constants
type TaskStatus string

const (
	TaskStatusBacklog    TaskStatus = "backlog"
	TaskStatusAssigned   TaskStatus = "assigned"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusPaused     TaskStatus = "paused"
	TaskStatusCompleted  TaskStatus = "completed"
)

// Task Priority constants
type TaskPriority string

const (
	TaskPriorityLow      TaskPriority = "low"
	TaskPriorityMedium   TaskPriority = "medium"
	TaskPriorityHigh     TaskPriority = "high"
	TaskPriorityCritical TaskPriority = "critical"
)

// Activity Type constants
type ActivityType string

const (
	ActivityTypePlanDeTrabajo                ActivityType = "plan_de_trabajo"
	ActivityTypeApoyoSolicitadoPorOtrasAreas ActivityType = "apoyo_solicitado_por_otras_areas"
	ActivityTypeTeams                        ActivityType = "teams"
	ActivityTypeInterno                      ActivityType = "interno"
	ActivityTypeSesion                       ActivityType = "sesion"
	ActivityTypeInvestigacion                ActivityType = "investigacion"
	ActivityTypePrototipado                  ActivityType = "prototipado"
	ActivityTypeDisenos                      ActivityType = "disenos"
	ActivityTypePruebas                      ActivityType = "pruebas"
	ActivityTypeDocumentacion                ActivityType = "documentacion"
)

// HTTP Status codes commonly used
const (
	StatusOK                  = 200
	StatusCreated             = 201
	StatusBadRequest          = 400
	StatusUnauthorized        = 401
	StatusForbidden           = 403
	StatusNotFound            = 404
	StatusConflict            = 409
	StatusInternalServerError = 500
)

// Error messages
const (
	ErrInvalidInput       = "Invalid input data"
	ErrUnauthorized       = "Unauthorized access"
	ErrForbidden          = "Access forbidden"
	ErrNotFound           = "Resource not found"
	ErrInternalServer     = "Internal server error"
	ErrDatabaseOperation  = "Database operation failed"
	ErrValidationFailed   = "Validation failed"
	ErrDuplicateEntry     = "Duplicate entry"
	ErrInsufficientRights = "Insufficient rights to perform this action"
)

// Success messages
const (
	MsgCreatedSuccessfully   = "Resource created successfully"
	MsgUpdatedSuccessfully   = "Resource updated successfully"
	MsgDeletedSuccessfully   = "Resource deleted successfully"
	MsgRetrievedSuccessfully = "Resource retrieved successfully"
)
