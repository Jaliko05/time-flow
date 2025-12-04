import React, { useState, useEffect } from "react";
import calendarService from "@/services/calendarService";
import { activitiesAPI } from "@/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Plus,
  RefreshCw,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function CalendarEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activityData, setActivityData] = useState({
    hours: 0,
    description: "",
    activity_type: "teams",
    notes: "",
  });

  const fetchEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const events = await calendarService.getTodayEvents();
      setEvents(events);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openActivityModal = (event) => {
    setSelectedEvent(event);
    const locationInfo = event.location ? `📍 ${event.location}` : "";
    const onlineInfo = event.is_online ? "📹 Reunión online" : "";

    setActivityData({
      hours: event.duration_hours || 1,
      description: event.subject,
      activity_type: "teams",
      notes: `📅 ${event.subject}\n${locationInfo}\n${onlineInfo}\n\n${
        event.description || ""
      }`.trim(),
    });

    setShowModal(true);
  };

  const createActivity = async () => {
    try {
      await activitiesAPI.create({
        date: selectedEvent.start_time.split("T")[0],
        hours: activityData.hours,
        description: activityData.description,
        activity_type: activityData.activity_type,
        notes: activityData.notes,
        project_id: null,
      });

      setShowModal(false);
      setSelectedEvent(null);

      // Marcar como convertida
      setEvents(
        events.map((e) =>
          e.id === selectedEvent.id ? { ...e, converted: true } : e
        )
      );

      alert("✅ Actividad creada exitosamente!");
    } catch (err) {
      console.error("Error creating activity:", err);
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  const adjustHours = (delta) => {
    setActivityData({
      ...activityData,
      hours: Math.max(0, activityData.hours + delta),
    });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            Cargando eventos del calendario...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📅 Calendario Microsoft</h1>
          <p className="text-muted-foreground">
            Convierte tus reuniones en actividades
          </p>
        </div>
        <Button onClick={fetchEvents} variant="outline" disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {events.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              No hay reuniones programadas para hoy
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tus eventos de Microsoft Calendar aparecerán aquí
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card
            key={event.id}
            className={event.converted ? "opacity-60 border-green-500" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant="outline" className="mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(event.start_time).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Badge>
                {event.converted && (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    Convertida
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{event.subject}</CardTitle>
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{event.duration_hours?.toFixed(2) || 0}h</span>
                </div>
                {event.is_online && (
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Reunión online</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {event.description}
                </p>
              )}
              <Button
                onClick={() => openActivityModal(event)}
                disabled={event.converted}
                className="w-full"
                size="sm"
              >
                {event.converted ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Convertida
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Actividad
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Creación de Actividad */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>✏️ Crear Actividad desde Reunión</DialogTitle>
            <DialogDescription>
              Convierte tu reunión en una actividad registrada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={activityData.description}
                onChange={(e) =>
                  setActivityData({
                    ...activityData,
                    description: e.target.value,
                  })
                }
                placeholder="Descripción de la actividad"
              />
            </div>

            <div className="space-y-2">
              <Label>⏱️ Duración Real</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustHours(-0.25)}
                >
                  -15m
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustHours(-0.5)}
                >
                  -30m
                </Button>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={activityData.hours}
                  onChange={(e) =>
                    setActivityData({
                      ...activityData,
                      hours: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 text-center"
                />
                <span className="text-sm text-muted-foreground">horas</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustHours(0.25)}
                >
                  +15m
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustHours(0.5)}
                >
                  +30m
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_type">Tipo de Actividad</Label>
              <Select
                value={activityData.activity_type}
                onValueChange={(value) =>
                  setActivityData({ ...activityData, activity_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teams">📹 Teams</SelectItem>
                  <SelectItem value="sesion">👥 Sesión</SelectItem>
                  <SelectItem value="plan_de_trabajo">
                    📋 Plan de Trabajo
                  </SelectItem>
                  <SelectItem value="investigacion">
                    🔍 Investigación
                  </SelectItem>
                  <SelectItem value="desarrollo">💻 Desarrollo</SelectItem>
                  <SelectItem value="documentacion">
                    📝 Documentación
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={activityData.notes}
                onChange={(e) =>
                  setActivityData({ ...activityData, notes: e.target.value })
                }
                rows={4}
                placeholder="Notas adicionales sobre la actividad..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={createActivity}
              disabled={!activityData.description || activityData.hours === 0}
            >
              💾 Crear Actividad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
