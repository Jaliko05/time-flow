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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Save,
  CalendarIcon,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@/api/users";
import { areasAPI } from "@/api/areas";
import { UserBadge } from "@/components/common/UserAvatar";
import AreaMultiSelect from "@/components/common/AreaMultiSelect";

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

  // Fetch areas for multi-area support (only for superadmin)
  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: () => areasAPI.getAll(),
    enabled: open && userRole === "superadmin",
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project_type: "personal",
    area_ids: [], // Array of area IDs for multi-area support
    assigned_user_ids: [], // Changed to array for multiple assignments
    start_date: null,
    due_date: null,
    priority: "medium",
  });
  const [errors, setErrors] = useState({});
  const [showUserSelector, setShowUserSelector] = useState(false);

  useEffect(() => {
    if (project) {
      // Get assigned user IDs from assigned_users or project_assignments
      const assignedIds =
        project.assigned_users?.map((u) => u.id) ||
        project.project_assignments
          ?.filter((a) => a.is_active)
          .map((a) => a.user_id) ||
        (project.assigned_user_id ? [project.assigned_user_id] : []);

      // Get area IDs from project areas
      const areaIds = project.areas?.map((a) => a.id) || [];

      setFormData({
        name: project.name,
        description: project.description || "",
        project_type: project.project_type || "personal",
        area_ids: areaIds,
        assigned_user_ids: assignedIds,
        start_date: project.start_date ? new Date(project.start_date) : null,
        due_date: project.due_date ? new Date(project.due_date) : null,
        priority: project.priority || "medium",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        project_type: "personal", // Default to personal, admin can change to "area"
        area_ids: [],
        assigned_user_ids: [],
        start_date: null,
        due_date: null,
        priority: "medium",
      });
    }
    setShowUserSelector(false);
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
      assigned_user_ids:
        formData.project_type === "area" ? formData.assigned_user_ids : [],
      start_date: formData.start_date
        ? format(formData.start_date, "yyyy-MM-dd")
        : null,
      due_date: formData.due_date
        ? format(formData.due_date, "yyyy-MM-dd")
        : null,
    };

    onSubmit(dataToSave);
  };

  const toggleUserSelection = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assigned_user_ids: prev.assigned_user_ids.includes(userId)
        ? prev.assigned_user_ids.filter((id) => id !== userId)
        : [...prev.assigned_user_ids, userId],
    }));
  };

  const removeUser = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assigned_user_ids: prev.assigned_user_ids.filter((id) => id !== userId),
    }));
  };

  const getSelectedUsers = () => {
    return users.filter((user) => formData.assigned_user_ids.includes(user.id));
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
                      assigned_user_ids:
                        value === "personal" ? [] : prev.assigned_user_ids,
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
                    : "Proyecto de área - asigna múltiples usuarios al equipo"}
                </p>
              </div>

              {/* Multi-Area Selector (SuperAdmin only) */}
              {userRole === "superadmin" &&
                formData.project_type === "area" && (
                  <div className="space-y-2">
                    <Label>Áreas del Proyecto</Label>
                    <AreaMultiSelect
                      areas={areas}
                      selectedAreaIds={formData.area_ids}
                      onChange={(areaIds) =>
                        setFormData((prev) => ({ ...prev, area_ids: areaIds }))
                      }
                      placeholder="Seleccionar áreas..."
                    />
                    <p className="text-xs text-gray-500">
                      SuperAdmin puede asignar el proyecto a múltiples áreas
                    </p>
                  </div>
                )}

              {formData.project_type === "area" && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Miembros del Equipo ({formData.assigned_user_ids.length})
                  </Label>

                  {/* Selected users badges */}
                  {formData.assigned_user_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                      {getSelectedUsers().map((user) => (
                        <UserBadge
                          key={user.id}
                          user={user}
                          onRemove={removeUser}
                        />
                      ))}
                    </div>
                  )}

                  {/* Add users button */}
                  <Popover
                    open={showUserSelector}
                    onOpenChange={setShowUserSelector}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {formData.assigned_user_ids.length === 0
                          ? "Seleccionar miembros del equipo"
                          : "Agregar más miembros"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-3 border-b">
                        <h4 className="font-medium text-sm">
                          Seleccionar Usuarios
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Elige uno o más miembros del equipo
                        </p>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {users.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground text-center">
                            No hay usuarios disponibles
                          </div>
                        ) : (
                          <div className="p-2">
                            {users.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                onClick={() => toggleUserSelection(user.id)}
                              >
                                <Checkbox
                                  checked={formData.assigned_user_ids.includes(
                                    user.id
                                  )}
                                  onCheckedChange={() =>
                                    toggleUserSelection(user.id)
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {user.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <p className="text-xs text-gray-500">
                    Todos los miembros seleccionados podrán ver y registrar
                    actividades en este proyecto
                  </p>
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
