import React, { useState, useEffect } from "react";
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

export default function ProjectFormDialog({
  project,
  open,
  onClose,
  onSave,
  isSubmitting,
  userRole,
  users = [], // Lista de usuarios para asignar (solo para proyectos de área)
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project_type: "personal",
    assigned_user_id: null,
    estimated_hours: 8,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        project_type: project.project_type || "personal",
        assigned_user_id: project.assigned_user_id || null,
        estimated_hours: project.estimated_hours || 8,
      });
    } else {
      // Default values for new project
      // Para usuarios, siempre es personal
      setFormData({
        name: "",
        description: "",
        project_type: userRole === "user" ? "personal" : "personal",
        assigned_user_id: null,
        estimated_hours: 8,
      });
    }
  }, [project, open, userRole]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!formData.estimated_hours || formData.estimated_hours <= 0) {
      newErrors.estimated_hours = "Las horas estimadas deben ser mayores a 0";
    }

    // Si es proyecto de área y el rol es admin, debe asignar un usuario
    if (formData.project_type === "area" && !formData.assigned_user_id) {
      newErrors.assigned_user_id =
        "Debe asignar un usuario para proyectos de área";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Solo enviar assigned_user_id si es proyecto de área
    const dataToSave = {
      ...formData,
      assigned_user_id:
        formData.project_type === "area" ? formData.assigned_user_id : null,
    };

    onSave(dataToSave);
  };

  const canCreateAreaProject =
    userRole === "admin" || userRole === "superadmin";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Editar Proyecto" : "Nuevo Proyecto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proyecto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ej: Desarrollo de nueva funcionalidad"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Breve descripción del proyecto..."
              className="h-20"
            />
          </div>

          {/* Solo mostrar tipo y asignación si el usuario es admin o superadmin */}
          {canCreateAreaProject && (
            <>
              <div className="space-y-2">
                <Label htmlFor="project_type">Tipo de Proyecto *</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      project_type: value,
                      assigned_user_id:
                        value === "personal" ? null : prev.assigned_user_id,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {formData.project_type === "personal"
                    ? "Proyecto personal - solo tú puedes registrar actividades"
                    : "Proyecto de área - puedes asignarlo a un usuario"}
                </p>
              </div>

              {formData.project_type === "area" && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_user">Asignar a Usuario *</Label>
                  <Select
                    value={formData.assigned_user_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigned_user_id: value ? parseInt(value) : null,
                      }))
                    }
                  >
                    <SelectTrigger
                      className={
                        errors.assigned_user_id ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Seleccionar usuario..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.full_name} - {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assigned_user_id && (
                    <p className="text-xs text-red-500">
                      {errors.assigned_user_id}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Para usuarios, mostrar info que es proyecto personal */}
          {!canCreateAreaProject && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Proyecto Personal:</strong> Solo tú podrás registrar
                actividades en este proyecto.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="estimated_hours">Horas Estimadas *</Label>
            <Input
              id="estimated_hours"
              type="number"
              step="0.5"
              min="0.5"
              value={formData.estimated_hours}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estimated_hours: parseFloat(e.target.value) || 0,
                }))
              }
              className={errors.estimated_hours ? "border-red-500" : ""}
            />
            {errors.estimated_hours && (
              <p className="text-xs text-red-500">{errors.estimated_hours}</p>
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
