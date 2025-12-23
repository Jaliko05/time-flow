import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import {
  hasCyclicDependency,
  getDependencyChain,
} from "@/utils/dependencyValidator";

export default function DependencyWarning({
  activityId,
  proposedDependencyId,
  allActivities = [],
  type = "info", // 'info', 'warning', 'error'
}) {
  if (!proposedDependencyId) return null;

  const wouldCreateCycle = hasCyclicDependency(
    allActivities,
    activityId,
    proposedDependencyId
  );

  if (wouldCreateCycle) {
    const chain = getDependencyChain(proposedDependencyId, allActivities);
    const chainNames = chain.map((id) => {
      const activity = allActivities.find((a) => a.id === id);
      return activity ? activity.name : `ID: ${id}`;
    });

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Dependencia circular detectada:</strong>
          <p className="mt-2 text-sm">
            Agregar esta dependencia crearía un ciclo:
          </p>
          <p className="mt-1 text-sm font-mono bg-red-50 p-2 rounded">
            {chainNames.join(" → ")}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Show dependency chain as info
  const proposedActivity = allActivities.find(
    (a) => a.id === proposedDependencyId
  );
  if (!proposedActivity) return null;

  const chain = getDependencyChain(proposedDependencyId, allActivities);

  if (chain.length > 1) {
    const chainNames = chain.map((id) => {
      const activity = allActivities.find((a) => a.id === id);
      return activity ? activity.name : `ID: ${id}`;
    });

    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Cadena de dependencias:</strong>
          <p className="mt-2 text-sm">
            Esta actividad depende de una cadena de {chain.length} actividades:
          </p>
          <p className="mt-1 text-sm font-mono bg-blue-50 p-2 rounded">
            {chainNames.join(" → ")}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
