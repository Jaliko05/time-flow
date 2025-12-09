import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksAPI } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";

const PRIORITIES = [
  { value: "low", label: "Baja", color: "text-blue-600" },
  { value: "medium", label: "Media", color: "text-yellow-600" },
  { value: "high", label: "Alta", color: "text-orange-600" },
  { value: "urgent", label: "Urgente", color: "text-red-600" },
];

export default function TaskFormDialog({
  open,
  onOpenChange,
  task,
  projectId,
  users = [],
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!task;

  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    estimated_hours: task?.estimated_hours || "",
    assigned_user_id: task?.assigned_user_id || "",
    due_date: task?.due_date ? task.due_date.split("T")[0] : "",
    project_id: task?.project_id || projectId || "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => tasksAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      queryClient.invalidateQueries(["projects"]);
      toast({
        title: "Tarea creada",
        description: "La tarea se ha creado correctamente",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la tarea",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => tasksAPI.update(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      queryClient.invalidateQueries(["projects"]);
      toast({
        title: "Tarea actualizada",
        description: "La tarea se ha actualizado correctamente",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al actualizar la tarea",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      estimated_hours: parseFloat(formData.estimated_hours) || 0,
      assigned_user_id: formData.assigned_user_id
        ? parseInt(formData.assigned_user_id)
        : null,
      project_id: parseInt(formData.project_id),
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Actualiza los detalles de la tarea"
                : "Crea una nueva tarea para el proyecto"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la tarea *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre de la tarea"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción de la tarea"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridad *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <span className={priority.color}>{priority.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimated_hours">Horas estimadas *</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimated_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_hours: e.target.value,
                    })
                  }
                  placeholder="8"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assigned_user_id">Asignar a</Label>
                <Select
                  value={formData.assigned_user_id?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigned_user_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="due_date">Fecha límite</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                />
              </div>
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
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Guardando..."
                : isEdit
                ? "Actualizar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
