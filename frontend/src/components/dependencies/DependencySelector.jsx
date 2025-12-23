import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { hasCyclicDependency } from "@/utils/dependencyValidator";

export default function DependencySelector({
  activities = [],
  currentActivityId,
  selectedDependencyIds = [],
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  // Filter out current activity and already selected dependencies
  const availableActivities = activities.filter(
    (activity) => activity.id !== currentActivityId
  );

  const selectedActivities = activities.filter((activity) =>
    selectedDependencyIds.includes(activity.id)
  );

  const handleSelect = (activityId) => {
    // Check for circular dependencies
    if (hasCyclicDependency(activities, currentActivityId, activityId)) {
      alert(
        "No se puede agregar esta dependencia porque crearía una dependencia circular"
      );
      return;
    }

    const newSelectedIds = selectedDependencyIds.includes(activityId)
      ? selectedDependencyIds.filter((id) => id !== activityId)
      : [...selectedDependencyIds, activityId];

    onChange(newSelectedIds);
  };

  const handleRemove = (activityId, e) => {
    e.stopPropagation();
    onChange(selectedDependencyIds.filter((id) => id !== activityId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedActivities.length === 0
                ? "Seleccionar dependencias..."
                : `${selectedActivities.length} dependencia(s) seleccionada(s)`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar actividad..." />
            <CommandEmpty>No se encontraron actividades.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {availableActivities.map((activity) => {
                const isSelected = selectedDependencyIds.includes(activity.id);
                const wouldCreateCycle = hasCyclicDependency(
                  activities,
                  currentActivityId,
                  activity.id
                );

                return (
                  <CommandItem
                    key={activity.id}
                    value={activity.name}
                    onSelect={() => handleSelect(activity.id)}
                    disabled={wouldCreateCycle}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div>{activity.name}</div>
                      {wouldCreateCycle && (
                        <div className="text-xs text-red-600">
                          Crearía dependencia circular
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {activity.status}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Dependencies */}
      {selectedActivities.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Dependencias seleccionadas:</p>
          <div className="flex flex-wrap gap-2">
            {selectedActivities.map((activity) => (
              <Badge key={activity.id} variant="secondary" className="gap-1">
                {activity.name}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(activity.id, e)}
                    className="ml-1 hover:bg-gray-300 rounded-full"
                  >
                    ×
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
