import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";

/**
 * Componente de columna para el Kanban de tareas
 */
export function TaskColumn({
  column,
  tasks = [],
  onEdit,
  onStatusChange,
  onAddTask,
  users = [],
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const currentStatus = e.dataTransfer.getData("currentStatus");

    if (currentStatus !== column.id) {
      onStatusChange(taskId, column.id);
    }
  };

  const columnTasks = tasks.filter((t) => t.status === column.id);

  return (
    <div
      className="flex-1 min-w-[280px] max-w-[320px]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card
        className={cn(
          "h-full border-2 transition-colors",
          column.color,
          isDragOver && "ring-2 ring-blue-500"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {column.label}
                <Badge variant="outline" className="ml-1">
                  {columnTasks.length}
                </Badge>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">{column.description}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onAddTask(column.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 max-h-[600px] overflow-y-auto">
          {columnTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <p>No hay tareas</p>
              <p className="text-xs">Arrastra aquí o crea una nueva</p>
            </div>
          ) : (
            columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                users={users}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
