import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableActivityItem from "./SortableActivityItem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function SortableActivityList({
  activities,
  onReorder,
  onEditActivity,
  disabled = false,
}) {
  const [items, setItems] = useState(activities);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Call parent callback with new order
      if (onReorder) {
        onReorder(
          newItems.map((item, index) => ({ id: item.id, order: index }))
        );
      }
    }
  };

  if (activities.length === 0) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          No hay actividades en este proceso. Agrega la primera actividad.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {!disabled && (
        <p className="text-sm text-muted-foreground mb-3">
          Arrastra para reordenar las actividades por prioridad
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((activity) => (
            <SortableActivityItem
              key={activity.id}
              activity={activity}
              onEdit={onEditActivity}
              disabled={disabled}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
