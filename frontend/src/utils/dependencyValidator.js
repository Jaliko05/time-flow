/**
 * Validates if adding a dependency would create a circular reference
 * @param {Array} activities - All activities in the process
 * @param {number} activityId - ID of activity receiving the dependency
 * @param {number} dependencyId - ID of activity to be added as dependency
 * @returns {boolean} - True if circular dependency would be created
 */
export const hasCyclicDependency = (activities, activityId, dependencyId) => {
  if (activityId === dependencyId) return true;

  const visited = new Set();
  const stack = [dependencyId];

  while (stack.length > 0) {
    const currentId = stack.pop();

    if (currentId === activityId) return true;
    if (visited.has(currentId)) continue;

    visited.add(currentId);

    const activity = activities.find((a) => a.id === currentId);
    if (activity && activity.dependencies) {
      stack.push(...activity.dependencies);
    }
  }

  return false;
};

/**
 * Checks if an activity can be started based on its dependencies
 * @param {Object} activity - The activity to check
 * @param {Array} allActivities - All activities in the process
 * @returns {boolean} - True if all dependencies are completed
 */
export const canStartActivity = (activity, allActivities) => {
  if (!activity.dependencies || activity.dependencies.length === 0) {
    return true;
  }

  return activity.dependencies.every((depId) => {
    const dependency = allActivities.find((a) => a.id === depId);
    return dependency && dependency.status === "completed";
  });
};

/**
 * Gets all activities that are blocked by a specific activity
 * @param {number} activityId - ID of the blocking activity
 * @param {Array} allActivities - All activities in the process
 * @returns {Array} - Array of blocked activity IDs
 */
export const getBlockedActivities = (activityId, allActivities) => {
  return allActivities
    .filter((activity) => {
      return (
        activity.dependencies &&
        activity.dependencies.includes(activityId) &&
        activity.status !== "completed"
      );
    })
    .map((activity) => activity.id);
};

/**
 * Gets the full dependency chain for an activity
 * @param {number} activityId - ID of the activity
 * @param {Array} allActivities - All activities in the process
 * @returns {Array} - Array of activity IDs in the dependency chain
 */
export const getDependencyChain = (activityId, allActivities) => {
  const chain = [];
  const visited = new Set();
  const stack = [activityId];

  while (stack.length > 0) {
    const currentId = stack.pop();

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const activity = allActivities.find((a) => a.id === currentId);
    if (activity && activity.dependencies) {
      activity.dependencies.forEach((depId) => {
        if (!visited.has(depId)) {
          chain.push(depId);
          stack.push(depId);
        }
      });
    }
  }

  return chain;
};

/**
 * Validates all dependencies before updating activity status
 * @param {Object} activity - Activity being updated
 * @param {string} newStatus - New status to apply
 * @param {Array} allActivities - All activities
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validateActivityStatusChange = (activity, newStatus, allActivities) => {
  // If marking as in progress, check dependencies
  if (newStatus === "in_progress" || newStatus === "completed") {
    if (!canStartActivity(activity, allActivities)) {
      const incompleteDeps = activity.dependencies
        .map((depId) => allActivities.find((a) => a.id === depId))
        .filter((dep) => dep && dep.status !== "completed")
        .map((dep) => dep.name);

      return {
        valid: false,
        message: `No se puede iniciar. Dependencias incompletas: ${incompleteDeps.join(", ")}`,
      };
    }
  }

  // If marking as completed, check if it's blocking others
  if (newStatus === "pending" && activity.status === "completed") {
    const blocked = getBlockedActivities(activity.id, allActivities);
    if (blocked.length > 0) {
      return {
        valid: false,
        message: `Esta actividad bloquea ${blocked.length} actividad(es). No se puede marcar como pendiente.`,
      };
    }
  }

  return { valid: true, message: "" };
};
