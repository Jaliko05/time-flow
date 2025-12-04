package handlers

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

type GetCalendarEventsRequest struct {
	StartDate string `json:"start_date"` // formato: YYYY-MM-DD (opcional)
	EndDate   string `json:"end_date"`   // formato: YYYY-MM-DD (opcional)
}

type CalendarEventResponse struct {
	ID          string    `json:"id"`
	Subject     string    `json:"subject"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Location    string    `json:"location"`
	IsOnline    bool      `json:"is_online"`
	Duration    float64   `json:"duration_hours"`
}

// GetCalendarEvents godoc
// @Summary Get Microsoft Calendar events
// @Description Get calendar events from Microsoft for the authenticated user
// @Tags calendar
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body GetCalendarEventsRequest true "Calendar request"
// @Success 200 {object} utils.Response{data=[]CalendarEventResponse}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Router /calendar/events [post]
func GetCalendarEvents(c *gin.Context) {
	// Obtener usuario autenticado
	userID, _ := c.Get("user_id")

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	// Verificar que el usuario tenga token de Microsoft
	if user.MicrosoftAccessToken == nil || *user.MicrosoftAccessToken == "" {
		utils.ErrorResponse(c, 401, "No Microsoft calendar access. Please logout and login again with Microsoft to sync your calendar.")
		return
	}

	var req GetCalendarEventsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Determinar rango de fechas
	var startDate, endDate time.Time
	var err error

	if req.StartDate != "" && req.EndDate != "" {
		startDate, err = time.Parse("2006-01-02", req.StartDate)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid start_date format. Use YYYY-MM-DD")
			return
		}

		endDate, err = time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid end_date format. Use YYYY-MM-DD")
			return
		}
		endDate = endDate.Add(24 * time.Hour) // Incluir todo el día final
	} else {
		// Por defecto: eventos de hoy
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		endDate = startDate.Add(24 * time.Hour)
	}

	// Obtener eventos usando el token guardado
	events, err := utils.GetCalendarEvents(*user.MicrosoftAccessToken, startDate, endDate)
	if err != nil {
		utils.ErrorResponse(c, 401, "Failed to get calendar events: "+err.Error())
		return
	}

	// Convertir a formato de respuesta
	response := make([]CalendarEventResponse, 0, len(events))
	for _, event := range events {
		startTime, _ := time.Parse("2006-01-02T15:04:05.0000000", event.Start.DateTime)
		endTime, _ := time.Parse("2006-01-02T15:04:05.0000000", event.End.DateTime)
		duration := endTime.Sub(startTime).Hours()

		response = append(response, CalendarEventResponse{
			ID:          event.ID,
			Subject:     event.Subject,
			Description: event.BodyPreview,
			StartTime:   startTime,
			EndTime:     endTime,
			Location:    event.Location.DisplayName,
			IsOnline:    event.IsOnlineMeeting,
			Duration:    duration,
		})
	}

	utils.SuccessResponse(c, 200, "Calendar events retrieved successfully", response)
}

// GetTodayCalendarEvents godoc
// @Summary Get today's calendar events
// @Description Get calendar events for today from Microsoft
// @Tags calendar
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response{data=[]CalendarEventResponse}
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /calendar/today [get]
func GetTodayCalendarEvents(c *gin.Context) {
	// Obtener usuario autenticado
	userID, _ := c.Get("user_id")

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	// Verificar que el usuario tenga token de Microsoft
	if user.MicrosoftAccessToken == nil || *user.MicrosoftAccessToken == "" {
		log.Printf("User %d has no Microsoft token saved. Auth provider: %s", user.ID, user.AuthProvider)
		utils.ErrorResponse(c, 401, "No Microsoft calendar access. Please logout and login again with Microsoft to sync your calendar.")
		return
	}

	log.Printf("User %d has Microsoft token (length: %d)", user.ID, len(*user.MicrosoftAccessToken))

	events, err := utils.GetTodayEvents(*user.MicrosoftAccessToken)
	if err != nil {
		utils.ErrorResponse(c, 401, "Failed to get calendar events: "+err.Error())
		return
	}

	response := make([]CalendarEventResponse, 0, len(events))
	for _, event := range events {
		startTime, _ := time.Parse("2006-01-02T15:04:05.0000000", event.Start.DateTime)
		endTime, _ := time.Parse("2006-01-02T15:04:05.0000000", event.End.DateTime)
		duration := endTime.Sub(startTime).Hours()

		response = append(response, CalendarEventResponse{
			ID:          event.ID,
			Subject:     event.Subject,
			Description: event.BodyPreview,
			StartTime:   startTime,
			EndTime:     endTime,
			Location:    event.Location.DisplayName,
			IsOnline:    event.IsOnlineMeeting,
			Duration:    duration,
		})
	}

	utils.SuccessResponse(c, 200, "Today's calendar events retrieved successfully", response)
}
