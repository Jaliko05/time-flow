package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Password     string         `json:"-"` // Optional now (nullable for Microsoft auth)
	FullName     string         `gorm:"not null" json:"full_name"`
	Role         Role           `gorm:"type:varchar(20);not null;default:'user'" json:"role"`
	AreaID       *uint          `json:"area_id"`
	WorkSchedule datatypes.JSON `json:"work_schedule" swaggertype:"object"`
	LunchBreak   datatypes.JSON `json:"lunch_break" swaggertype:"object"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	// Microsoft OAuth fields
	MicrosoftID          *string        `gorm:"index" json:"microsoft_id,omitempty"`                   // Microsoft user ID
	MicrosoftAccessToken *string        `gorm:"type:text" json:"-"`                                    // Microsoft access token (encrypted, not exposed in JSON)
	AuthProvider         string         `gorm:"type:varchar(20);default:'local'" json:"auth_provider"` // 'local' or 'microsoft'
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	Area       *Area      `gorm:"foreignKey:AreaID" json:"area,omitempty" swaggerignore:"true"`
	Projects   []Project  `gorm:"foreignKey:CreatedBy" json:"projects,omitempty" swaggerignore:"true"`
	Activities []Activity `gorm:"foreignKey:UserID" json:"activities,omitempty" swaggerignore:"true"`
}

// BeforeCreate hook to hash password before creating user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// BeforeUpdate hook to hash password if it's being updated
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Password") && u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// CheckPassword compares a password with the user's hashed password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// HasAccessToArea checks if user has access to a specific area
func (u *User) HasAccessToArea(areaID uint) bool {
	if u.Role == RoleSuperAdmin {
		return true
	}
	if u.Role == RoleAdmin && u.AreaID != nil {
		return *u.AreaID == areaID
	}
	return false
}

// CanManageUsers checks if user can manage other users
func (u *User) CanManageUsers() bool {
	return u.Role == RoleSuperAdmin || u.Role == RoleAdmin
}
