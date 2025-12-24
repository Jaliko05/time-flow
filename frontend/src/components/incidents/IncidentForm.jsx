import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateIncident } from "@/api/incidents";

export default function IncidentForm({
  incident,
  projectId,
  onSubmit,
  open,
  onOpenChange,
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    severity: "medium",
    status: "open",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (incident) {
      setFormData({
        name: incident.name || "",
        description: incident.description || "",
        severity: incident.severity || "medium",
        status: incident.status || "open",
      });
    }
  }, [incident]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (incident) {
        await updateIncident(incident.id, formData);
        onOpenChange(false);
      } else {
        await onSubmit(formData);
      }
    } catch (err) {
      setError(err.message || "Error al guardar el incidente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {incident ? "Editar Incidente" : "Reportar Incidente"}
          </DialogTitle>
          <DialogDescription>
            {incident
              ? "Actualiza la información del incidente"
              : "Reporta un nuevo incidente para este proyecto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Título del Incidente *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Breve descripción del problema"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción Detallada *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe el incidente en detalle: qué ocurrió, cuándo, y cualquier información relevante"
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severidad *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) =>
                  setFormData({ ...formData, severity: value })
                }
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Selecciona severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja - Impacto menor</SelectItem>
                  <SelectItem value="medium">
                    Media - Afecta funcionalidad
                  </SelectItem>
                  <SelectItem value="high">Alta - Afecta operación</SelectItem>
                  <SelectItem value="critical">
                    Crítica - Sistema caído
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {incident && (
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : incident
                ? "Actualizar"
                : "Reportar Incidente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
