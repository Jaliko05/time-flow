import { useState, useCallback } from "react";
import { Command } from "cmdk";
import {
  Search,
  FileText,
  AlertTriangle,
  FolderKanban,
  User,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function GlobalSearch({ open, onOpenChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual API search
      // For now, this is a placeholder structure
      const mockResults = [
        {
          type: "project",
          id: 1,
          title: "Proyecto Demo",
          description: "Descripción del proyecto",
          icon: FolderKanban,
        },
        {
          type: "requirement",
          id: 1,
          title: "Requerimiento Demo",
          description: "Descripción del requerimiento",
          icon: FileText,
        },
      ];

      setResults(mockResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (result) => {
    switch (result.type) {
      case "project":
        navigate(`/Projects/${result.id}`);
        break;
      case "requirement":
        navigate(`/projects/${result.projectId}/requirements`);
        break;
      case "incident":
        navigate(`/projects/${result.projectId}/incidents`);
        break;
      case "user":
        navigate(`/Admin`); // Or user profile page
        break;
      default:
        break;
    }
    onOpenChange(false);
    setQuery("");
  };

  const getTypeLabel = (type) => {
    const labels = {
      project: "Proyecto",
      requirement: "Requerimiento",
      incident: "Incidente",
      user: "Usuario",
      activity: "Actividad",
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      project: FolderKanban,
      requirement: FileText,
      incident: AlertTriangle,
      user: User,
    };
    return icons[type] || FileText;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Buscar proyectos, requerimientos, incidentes..."
              className="flex h-11 w-full border-0 bg-transparent py-3 text-sm outline-none focus-visible:ring-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres para buscar
              </div>
            )}

            {!loading &&
              results.map((result) => {
                const Icon = getTypeIcon(result.type);
                return (
                  <Command.Item
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-start gap-3 rounded-md px-3 py-3 hover:bg-accent cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                );
              })}
          </Command.List>

          <div className="border-t p-2 text-xs text-muted-foreground">
            Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
