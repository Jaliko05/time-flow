package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// CalendarEvent represents an event from Microsoft Calendar
type CalendarEvent struct {
	ID              string     `json:"id"`
	Subject         string     `json:"subject"`
	BodyPreview     string     `json:"bodyPreview"`
	Start           EventTime  `json:"start"`
	End             EventTime  `json:"end"`
	Location        Location   `json:"location"`
	IsOnlineMeeting bool       `json:"isOnlineMeeting"`
	Organizer       Organizer  `json:"organizer"`
	Attendees       []Attendee `json:"attendees"`
}

type EventTime struct {
	DateTime string `json:"dateTime"` // formato: "2025-12-02T14:00:00.0000000"
	TimeZone string `json:"timeZone"` // ej: "UTC"
}

type Location struct {
	DisplayName string `json:"displayName"`
}

type Organizer struct {
	EmailAddress EmailAddress `json:"emailAddress"`
}

type Attendee struct {
	EmailAddress EmailAddress   `json:"emailAddress"`
	Status       AttendeeStatus `json:"status"`
}

type EmailAddress struct {
	Name    string `json:"name"`
	Address string `json:"address"`
}

type AttendeeStatus struct {
	Response string `json:"response"` // "accepted", "declined", "tentative", "none"
}

type CalendarEventsResponse struct {
	Value []CalendarEvent `json:"value"`
}

// GetCalendarEvents obtiene los eventos del calendario del usuario
func GetCalendarEvents(accessToken string, startDate, endDate time.Time) ([]CalendarEvent, error) {
	// Formato de fechas para Microsoft Graph API
	startISO := startDate.Format("2006-01-02T15:04:05")
	endISO := endDate.Format("2006-01-02T15:04:05")

	// Construir URL con filtro de fechas
	url := fmt.Sprintf(
		"https://graph.microsoft.com/v1.0/me/calendar/calendarView?startDateTime=%s&endDateTime=%s&$orderby=start/dateTime",
		startISO, endISO,
	)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Prefer", `outlook.timezone="UTC"`) // Recibir fechas en UTC

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call Microsoft Graph API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("microsoft API returned status %d: %s", resp.StatusCode, string(body))
	}

	var result CalendarEventsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result.Value, nil
}

// GetTodayEvents obtiene los eventos del día actual
func GetTodayEvents(accessToken string) ([]CalendarEvent, error) {
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	return GetCalendarEvents(accessToken, startOfDay, endOfDay)
}

// GetWeekEvents obtiene los eventos de la semana actual
func GetWeekEvents(accessToken string) ([]CalendarEvent, error) {
	now := time.Now()
	// Lunes de esta semana
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // Domingo = 7
	}
	startOfWeek := now.AddDate(0, 0, -weekday+1)
	startOfWeek = time.Date(startOfWeek.Year(), startOfWeek.Month(), startOfWeek.Day(), 0, 0, 0, 0, startOfWeek.Location())

	endOfWeek := startOfWeek.AddDate(0, 0, 7)

	return GetCalendarEvents(accessToken, startOfWeek, endOfWeek)
}
