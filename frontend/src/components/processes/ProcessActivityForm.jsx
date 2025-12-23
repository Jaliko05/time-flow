import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function ProcessActivityForm({
  open,
  onClose,
  onSubmit,
  initialData = null,
  processId,
  users = [],
  existingActivities = [],
  loading = false,
  error = null,
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Pendiente",
    order: 1,
    estimatedHours: "",
    assignedUserId: "",
    dependencies: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        status: initialData.status || "Pendiente",
        order: initialData.order || 1,
        estimatedHours: initialData.estimatedHours?.toString() || "",
        assignedUserId: initialData.assignedUserId?.toString() || "",
        dependencies: initialData.dependencies || [],
      });
    } else {
      // Set next order number for new activities
      const maxOrder = existingActivities.reduce(
        (max, act) => Math.max(max, act.order || 0),
        0
      );
      setFormData({
        name: "",
        description: "",
        status: "Pendiente",
        order: maxOrder + 1,
        estimatedHours: "",
        assignedUserId: "",
        dependencies: [],
      });
    }
  }, [initialData, open, existingActivities]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      processId: parseInt(processId),
      order: parseInt(formData.order) || 1,
      estimatedHours: formData.estimatedHours
        ? parseFloat(formData.estimatedHours)
        : null,
      assignedUserId: formData.assignedUserId
        ? parseInt(formData.assignedUserId)
        : null,
    };

    onSubmit(submitData);
  };

  // Filter out current activity from dependencies list
  const availableDependencies = existingActivities.filter(
    (act) => !initialData || act.id !== initialData.id
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Actividad" : "Nueva Actividad"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Modifica los datos de la actividad."
              : "Completa el formulario para crear una nueva actividad en el proceso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nombre de la actividad"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descripción de la actividad"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En Progreso">En Progreso</SelectItem>
                  <SelectItem value="Completada">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Orden *</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => handleChange("order", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Estimated Hours */}
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                min="0"
                value={formData.estimatedHours}
                onChange={(e) => handleChange("estimatedHours", e.target.value)}
                placeholder="ej: 8.5"
              />
            </div>

            {/* Assigned User */}
            <div className="space-y-2">
              <Label htmlFor="assignedUser">Usuario Asignado</Label>
              <Select
                value={formData.assignedUserId}
                onValueChange={(value) => handleChange("assignedUserId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dependencies - TODO: Multi-select implementation */}
          {availableDependencies.length > 0 && (
            <div className="space-y-2">
              <Label>Dependencias (Opcional)</Label>
              <Alert>
                <AlertDescription className="text-xs">
                  Esta actividad puede depender de otras actividades del
                  proceso. Las dependencias múltiples se implementarán
                  próximamente.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
