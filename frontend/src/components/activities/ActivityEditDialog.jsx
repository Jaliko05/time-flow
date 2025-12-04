import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsAPI } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, Save } from "lucide-react";

const ACTIVITY_TYPES = [
  { value: "plan_de_trabajo", label: "Plan de Trabajo" },
  {
    value: "apoyo_solicitado_por_otras_areas",
    label: "Apoyo Solicitado por Otras Áreas",
  },
  { value: "teams", label: "Teams" },
  { value: "interno", label: "Interno" },
  { value: "sesion", label: "Sesión" },
  { value: "investigacion", label: "Investigación" },
  { value: "prototipado", label: "Prototipado" },
  { value: "disenos", label: "Diseños" },
  { value: "pruebas", label: "Pruebas" },
  { value: "documentacion", label: "Documentación" },
];

export default function ActivityEditDialog({
  activity,
  open,
  onClose,
  onSave,
  isSubmitting,
  user,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: () => projectsAPI.getAll({ active: true }),
    select: (data) =>
      data.filter(
        (p) =>
          (p.project_type === "personal" && p.created_by === user?.id) ||
          (p.project_type === "area" && p.assigned_user_id === user?.id)
      ),
    enabled: !!user,
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_name: activity.activity_name,
        activity_type: activity.activity_type,
        execution_time: activity.execution_time,
        observations: activity.observations || "",
        project_id: activity.project_id || "none",
        other_area: activity.other_area || "",
      });
    }
  }, [activity]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.activity_name?.trim()) {
      newErrors.activity_name = "El nombre es obligatorio";
    }

    if (!formData.execution_time || parseFloat(formData.execution_time) <= 0) {
      newErrors.execution_time = "El tiempo debe ser mayor a 0";
    }

    if (
      formData.project_id &&
      formData.project_id !== "none" &&
      !formData.observations?.trim()
    ) {
      newErrors.observations = "Obligatorio con proyecto";
    }

    if (
      formData.activity_type === "apoyo_solicitado_por_otras_areas" &&
      !formData.other_area?.trim()
    ) {
      newErrors.other_area = "Especifica el área";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const selectedProject = projects.find((p) => p.id === formData.project_id);

    onSave({
      ...formData,
      project_id: formData.project_id === "none" ? null : formData.project_id,
      execution_time: parseFloat(formData.execution_time),
      project_name: selectedProject?.name || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Actividad</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity_name">Nombre de la Actividad *</Label>
              <Input
                id="activity_name"
                value={formData.activity_name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    activity_name: e.target.value,
                  }))
                }
                className={errors.activity_name ? "border-red-500" : ""}
              />
              {errors.activity_name && (
                <p className="text-xs text-red-500">{errors.activity_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_type">Tipo de Actividad</Label>
              <Select
                value={formData.activity_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, activity_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="execution_time">Tiempo (horas) *</Label>
              <Input
                id="execution_time"
                type="number"
                step="0.25"
                min="0.25"
                value={formData.execution_time || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    execution_time: e.target.value,
                  }))
                }
                className={errors.execution_time ? "border-red-500" : ""}
              />
              {errors.execution_time && (
                <p className="text-xs text-red-500">{errors.execution_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_id">Proyecto</Label>
              <Select
                value={formData.project_id || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, project_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.activity_type === "apoyo_solicitado_por_otras_areas" && (
            <div className="space-y-2">
              <Label htmlFor="other_area">Área Solicitante *</Label>
              <Input
                id="other_area"
                value={formData.other_area || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    other_area: e.target.value,
                  }))
                }
                className={errors.other_area ? "border-red-500" : ""}
              />
              {errors.other_area && (
                <p className="text-xs text-red-500">{errors.other_area}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observations">
              Observaciones{" "}
              {formData.project_id && formData.project_id !== "none" && "*"}
            </Label>
            <Textarea
              id="observations"
              value={formData.observations || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observations: e.target.value,
                }))
              }
              className={`h-24 ${errors.observations ? "border-red-500" : ""}`}
            />
            {errors.observations && (
              <p className="text-xs text-red-500">{errors.observations}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
