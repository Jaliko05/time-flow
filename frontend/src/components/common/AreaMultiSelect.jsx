import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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

export default function AreaMultiSelect({
  areas = [],
  selectedAreaIds = [],
  onChange,
  placeholder = "Seleccionar áreas...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const selectedAreas = areas.filter((area) =>
    selectedAreaIds.includes(area.id)
  );

  const handleSelect = (areaId) => {
    const newSelectedIds = selectedAreaIds.includes(areaId)
      ? selectedAreaIds.filter((id) => id !== areaId)
      : [...selectedAreaIds, areaId];
    onChange(newSelectedIds);
  };

  const handleRemove = (areaId, e) => {
    e.stopPropagation();
    onChange(selectedAreaIds.filter((id) => id !== areaId));
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
              {selectedAreas.length === 0
                ? placeholder
                : `${selectedAreas.length} área(s) seleccionada(s)`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar área..." />
            <CommandEmpty>No se encontraron áreas.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {areas.map((area) => (
                <CommandItem
                  key={area.id}
                  value={area.name}
                  onSelect={() => handleSelect(area.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedAreaIds.includes(area.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {area.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Areas Badges */}
      {selectedAreas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAreas.map((area) => (
            <Badge key={area.id} variant="secondary" className="gap-1">
              {area.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(area.id, e)}
                  className="ml-1 hover:bg-gray-300 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
