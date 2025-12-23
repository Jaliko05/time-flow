import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@/api/users";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { UserPlus, X, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * UserAssignmentSelect - Selector múltiple de usuarios para asignar
 * @param {Array} selectedUsers - Lista de usuarios seleccionados
 * @param {Function} onChange - Callback cuando cambia la selección
 * @param {Number} areaId - ID del área para filtrar usuarios (opcional)
 * @param {Array} excludeIds - IDs de usuarios a excluir (opcional)
 * @param {Boolean} disabled - Deshabilitado
 */
export const UserAssignmentSelect = ({
  selectedUsers = [],
  onChange,
  areaId = null,
  excludeIds = [],
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar lista de usuarios disponibles
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["users", areaId],
    queryFn: async () => {
      const response = await usersAPI.getAll();
      let users = response.data || [];

      // Filtrar por área si se especifica
      if (areaId) {
        users = users.filter((u) => u.area_id === areaId);
      }

      // Excluir IDs especificados
      if (excludeIds.length > 0) {
        users = users.filter((u) => !excludeIds.includes(u.id));
      }

      return users;
    },
    enabled: open, // Solo cargar cuando se abre el popover
  });

  // Filtrar usuarios por búsqueda
  const filteredUsers = allUsers.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleUser = (user) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);

    if (isSelected) {
      onChange(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      onChange([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId) => {
    onChange(selectedUsers.filter((u) => u.id !== userId));
  };

  const getInitials = (user) => {
    if (user.full_name) {
      const names = user.full_name.split(" ");
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user.username?.[0]?.toUpperCase() || "?";
  };

  return (
    <div className="space-y-2">
      {/* Usuarios seleccionados */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="gap-1 pr-1 pl-2"
            >
              <span className="text-xs">{user.username || user.email}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.id)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Botón para agregar usuarios */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {selectedUsers.length === 0
              ? "Asignar usuarios"
              : `${selectedUsers.length} usuario${
                  selectedUsers.length !== 1 ? "s" : ""
                } asignado${selectedUsers.length !== 1 ? "s" : ""}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Cargando usuarios...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No se encontraron usuarios
              </div>
            ) : (
              <div className="p-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.some(
                    (u) => u.id === user.id
                  );

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleToggleUser(user)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      <Checkbox checked={isSelected} />
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
