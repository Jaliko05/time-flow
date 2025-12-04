import apiClient from "@/api/client";

class CalendarService {
  // Obtener eventos de hoy
  async getTodayEvents() {
    try {
      const response = await apiClient.get("/calendar/today");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error obteniendo eventos"
      );
    }
  }

  // Obtener eventos en rango de fechas
  async getEvents(startDate, endDate) {
    try {
      const response = await apiClient.post("/calendar/events", {
        start_date: startDate,
        end_date: endDate,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error obteniendo eventos"
      );
    }
  }
}

export default new CalendarService();
