import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI, areasAPI } from "@/api";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserCheck, UserX, Clock, Mail, Shield, Building2 } from "lucide-react";

const ROLE_LABELS = {
  user: "Usuario",
  admin: "Admin de Área",
  superadmin: "Super Admin",
};

const ROLE_COLORS = {
  user: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  superadmin: "bg-red-100 text-red-700",
};

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    area_id: null,
    is_active: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersAPI.getAll(),
  });

  // Fetch areas
  const { data: areas = [] } = useQuery({
    queryKey: ["areas", { active: true }],
    queryFn: () => areasAPI.getAll({ active: true }),
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast({
        title: "Usuario actualizado",
        description: "Los cambios se guardaron exitosamente",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al actualizar usuario",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      role: user.role,
      area_id: user.area_id || null,
      is_active: user.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setFormData({ role: "", area_id: null, is_active: false });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation: admin requires area
    if (formData.role === "admin" && !formData.area_id) {
      toast({
        title: "Error de validación",
        description: "Un Admin de Área debe tener un área asignada",
        variant: "destructive",
      });
      return;
    }

    updateUserMutation.mutate({
      id: selectedUser.id,
      data: formData,
    });
  };

  const handleQuickToggle = (user) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    });
  };

  // Filter users
  const pendingUsers = users.filter(
    (u) => u.auth_provider === "microsoft" && !u.is_active
  );
  const activeUsers = users.filter((u) => u.is_active);
  const inactiveUsers = users.filter(
    (u) => !u.is_active && u.auth_provider !== "microsoft"
  );

  if (loadingUsers) {
    return <div className="p-6">Cargando usuarios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Gestión de Usuarios
        </h2>
        <p className="text-muted-foreground">
          Administra usuarios, roles y permisos del sistema
        </p>
      </div>

      {/* Pending Microsoft Users - Priority Section */}
      {pendingUsers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">
                Usuarios Pendientes de Aprobación
              </CardTitle>
            </div>
            <CardDescription className="text-orange-700">
              {pendingUsers.length} usuario
              {pendingUsers.length !== 1 ? "s" : ""} de Microsoft esperando
              activación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50">
                        Microsoft
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenDialog(user)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Aprobar y Configurar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Activos</CardTitle>
          <CardDescription>
            {activeUsers.length} usuario{activeUsers.length !== 1 ? "s" : ""}{" "}
            activo{activeUsers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No hay usuarios activos
                  </TableCell>
                </TableRow>
              ) : (
                activeUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[user.role]}>
                        <Shield className="mr-1 h-3 w-3" />
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.area ? (
                        <Badge variant="outline">
                          <Building2 className="mr-1 h-3 w-3" />
                          {user.area.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Sin área
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.auth_provider === "microsoft"
                            ? "bg-blue-50"
                            : "bg-gray-50"
                        }
                      >
                        {user.auth_provider === "microsoft"
                          ? "Microsoft"
                          : "Local"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => handleQuickToggle(user)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(user)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inactive Users */}
      {inactiveUsers.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-gray-900">
                Usuarios Inactivos
              </CardTitle>
            </div>
            <CardDescription>
              {inactiveUsers.length} usuario
              {inactiveUsers.length !== 1 ? "s" : ""} desactivado
              {inactiveUsers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {user.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(user)}
                      >
                        Reactivar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configurar Usuario</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Proveedor de Autenticación</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Badge
                    variant={
                      selectedUser.auth_provider === "microsoft"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedUser.auth_provider === "microsoft"
                      ? "Microsoft OAuth"
                      : "Local (Email/Password)"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Usuario
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        Admin de Área
                      </div>
                    </SelectItem>
                    <SelectItem value="superadmin">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Super Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">
                  Área {formData.role === "admin" && "*"}
                </Label>
                <Select
                  value={formData.area_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      area_id: value === "none" ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin área</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.role === "admin" && !formData.area_id && (
                  <p className="text-sm text-orange-600">
                    Un Admin de Área debe tener un área asignada
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="space-y-0.5">
                  <Label>Estado del Usuario</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active
                      ? "Usuario puede iniciar sesión"
                      : "Usuario bloqueado"}
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
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
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending
                    ? "Guardando..."
                    : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
