import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Get initials from full name
 */
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Get consistent color for a user
 */
const getUserColor = (userId) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-red-500",
  ];
  return colors[userId % colors.length];
};

/**
 * Single user avatar with tooltip
 */
export function UserAvatar({ user, size = "md", className, showName = false }) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar
        className={sizeClasses[size]}
        title={user?.full_name || user?.email}
      >
        <AvatarImage src={user?.avatar} alt={user?.full_name} />
        <AvatarFallback className={getUserColor(user?.id)}>
          {getInitials(user?.full_name || user?.email)}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="text-sm font-medium truncate">{user?.full_name}</span>
      )}
    </div>
  );
}

/**
 * Multiple user avatars stacked
 */
export function UserAvatarGroup({
  users = [],
  maxVisible = 3,
  size = "md",
  className,
}) {
  if (!users || users.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-muted-foreground",
          className
        )}
      >
        <Users className="h-4 w-4" />
        <span className="text-xs">Sin asignar</span>
      </div>
    );
  }

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <Avatar
            key={user.id || index}
            className={cn(
              sizeClasses[size],
              "border-2 border-background ring-2 ring-background"
            )}
            title={user.full_name || user.email}
          >
            <AvatarImage src={user.avatar} alt={user.full_name} />
            <AvatarFallback className={getUserColor(user.id)}>
              {getInitials(user.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              sizeClasses[size],
              "flex items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground font-medium"
            )}
            title={`+${remainingCount} más`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * User badge with remove option
 */
export function UserBadge({ user, onRemove, className }) {
  return (
    <Badge
      variant="secondary"
      className={cn("flex items-center gap-1 pr-1", className)}
    >
      <Avatar className="h-5 w-5">
        <AvatarImage src={user?.avatar} alt={user?.full_name} />
        <AvatarFallback className={cn("text-xs", getUserColor(user?.id))}>
          {getInitials(user?.full_name || user?.email)}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs truncate max-w-[120px]">{user?.full_name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(user.id)}
          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
