import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Clipboard,
  Users,
  Folder,
  Clock,
  AlertTriangle,
  MessageSquare,
  Lock,
  Unlock,
  Bell,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const ICON_MAP = {
  "check-circle": CheckCircle,
  clipboard: Clipboard,
  users: Users,
  folder: Folder,
  clock: Clock,
  "alert-triangle": AlertTriangle,
  "message-square": MessageSquare,
  lock: Lock,
  unlock: Unlock,
  bell: Bell,
};

const VARIANT_STYLES = {
  default: "bg-background",
  success: "bg-green-50 dark:bg-green-950/20",
  warning: "bg-yellow-50 dark:bg-yellow-950/20",
  destructive: "bg-red-50 dark:bg-red-950/20",
  info: "bg-blue-50 dark:bg-blue-950/20",
};

const ICON_COLORS = {
  default: "text-muted-foreground",
  success: "text-green-600",
  warning: "text-yellow-600",
  destructive: "text-red-600",
  info: "text-blue-600",
};

export default function NotificationItem({ notification, onClose }) {
  const navigate = useNavigate();
  const { markAsRead, removeNotification } = useNotifications();

  const IconComponent = ICON_MAP[notification.icon] || Bell;
  const variant = notification.variant || "default";

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    if (notification.data?.link) {
      navigate(notification.data.link);
      onClose?.();
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    removeNotification(notification.id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div
      className={cn(
        "relative p-3 cursor-pointer hover:bg-muted/50 transition-colors group",
        VARIANT_STYLES[variant],
        !notification.read && "border-l-2 border-primary"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            ICON_COLORS[variant]
          )}
        >
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              !notification.read && "font-semibold"
            )}
          >
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
          onClick={handleRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      {!notification.read && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary group-hover:hidden" />
      )}
    </div>
  );
}
