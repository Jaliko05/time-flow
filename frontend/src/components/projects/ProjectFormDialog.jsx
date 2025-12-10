import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Save, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@/api/users";

export default function ProjectFormDialog({
  project,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) {
  const { user } = useAuth();
  const userRole = user?.role;

  // Fetch users for area projects (only for admin/superadmin)
  const { data: users = [] } = useQuery({
    queryKey: ["users", user?.area_id],
    queryFn: () => usersAPI.getAll(),
    enabled: open && (userRole === "admin" || userRole === "superadmin"),
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project_type: "personal",
    assigned_user_id: null,
    start_date: null,
    due_date: null,
    priority: "medium",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        project_type: project.project_type || "personal",
        assigned_user_id: project.assigned_user_id || null,
        start_date: project.start_date ? new Date(project.start_date) : null,
        due_date: project.due_date ? new Date(project.due_date) : null,
        priority: project.priority || "medium",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        project_type: "personal", // Default to personal, admin can change to "area"
        assigned_user_id: null,
        start_date: null,
        due_date: null,
        priority: "medium",
      });
    }
  }, [project, open, userRole]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!formData.start_date) {
      newErrors.start_date = "La fecha de inicio es obligatoria";
    }

    if (!formData.due_date) {
      newErrors.due_date = "La fecha de vencimiento es obligatoria";
    }

    if (
      formData.start_date &&
      formData.due_date &&
      formData.due_date < formData.start_date
    ) {
      newErrors.due_date = "La fecha fin debe ser posterior a la fecha inicio";
    }

    // Note: Assignment is now optional for area projects
    // Can be assigned later via project management

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Formatear fechas y preparar data
    const dataToSave = {
      ...formData,
      assigned_user_id:
        formData.project_type === "area" ? formData.assigned_user_id : null,
      start_date: formData.start_date
        ? format(formData.start_date, "yyyy-MM-dd")
        : null,
      due_date: formData.due_date
        ? format(formData.due_date, "yyyy-MM-dd")
        : null,
    };

    onSubmit(dataToSave);
  };

  const canCreateAreaProject =
    userRole === "admin" || userRole === "superadmin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Editar Proyecto" : "Nuevo Proyecto"}
          </DialogTitle>
          <DialogDescription>
            {project
              ? "Actualiza la información del proyecto"
              : "Crea un nuevo proyecto personal o de área"}
          </DialogDescription>
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
                    : "Proyecto de área - puedes asignarlo a usuarios ahora o después"}
                </p>
              </div>

              {formData.project_type === "area" && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_user">
                    Asignar a Usuario (Opcional)
                  </Label>
                  <Select
                    value={
                      formData.assigned_user_id?.toString() || "unassigned"
                    }
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigned_user_id:
                          value === "unassigned" ? null : parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger
                      className={
                        errors.assigned_user_id ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Sin asignar (se puede asignar después)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.full_name} - {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Podrás asignar múltiples usuarios más adelante desde la
                    gestión del proyecto
                  </p>
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

          {/* Prioridad */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground",
                      errors.start_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? (
                      format(formData.start_date, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) =>
                      setFormData((prev) => ({ ...prev, start_date: date }))
                    }
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && (
                <p className="text-xs text-red-500">{errors.start_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fecha de Vencimiento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground",
                      errors.due_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? (
                      format(formData.due_date, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) =>
                      setFormData((prev) => ({ ...prev, due_date: date }))
                    }
                    locale={es}
                    disabled={(date) =>
                      formData.start_date && date < formData.start_date
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.due_date && (
                <p className="text-xs text-red-500">{errors.due_date}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
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
