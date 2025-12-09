import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { areasAPI } from "@/api";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Users } from "lucide-react";

export default function AreaManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch areas
  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: () => areasAPI.getAll(),
  });

  // Create area mutation
  const createMutation = useMutation({
    mutationFn: areasAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(["areas"]);
      toast({
        title: "Área creada",
        description: "El área se creó exitosamente",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear área",
        variant: "destructive",
      });
    },
  });

  // Update area mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => areasAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["areas"]);
      toast({
        title: "Área actualizada",
        description: "Los cambios se guardaron exitosamente",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al actualizar área",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => areasAPI.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(["areas"]);
      toast({
        title: "Estado actualizado",
        description: "El estado del área se actualizó correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al actualizar estado",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (area = null) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        name: area.name,
        description: area.description || "",
      });
    } else {
      setEditingArea(null);
      setFormData({ name: "", description: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingArea(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (area) => {
    toggleActiveMutation.mutate({
      id: area.id,
      is_active: !area.is_active,
    });
  };

  if (isLoading) {
    return <div className="p-6">Cargando áreas...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestión de Áreas
          </h2>
          <p className="text-muted-foreground">
            Crea y administra las áreas de tu organización
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Área
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Áreas Registradas</CardTitle>
          <CardDescription>
            {areas.length} área{areas.length !== 1 ? "s" : ""} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Usuarios</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No hay áreas registradas
                  </TableCell>
                </TableRow>
              ) : (
                areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {area.description || "Sin descripción"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        <Users className="mr-1 h-3 w-3" />
                        {area.user_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={area.is_active}
                          onCheckedChange={() => handleToggleActive(area)}
                        />
                        <Badge
                          variant={area.is_active ? "default" : "secondary"}
                        >
                          {area.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(area)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingArea ? "Editar Área" : "Nueva Área"}
            </DialogTitle>
            <DialogDescription>
              {editingArea
                ? "Modifica la información del área"
                : "Completa los datos para crear una nueva área"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Desarrollo, Marketing, Ventas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción del área y sus responsabilidades"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingArea ? "Guardar Cambios" : "Crear Área"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
