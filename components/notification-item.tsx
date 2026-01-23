"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Notification } from "@/app/actions/get-notifications";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate to the ticket
    router.push(`/dashboard?ticket=${notification.ticket_id}`);
    
    onClose?.();
  };

  return (
    <div
      className={cn(
        "p-4 hover:bg-accent cursor-pointer transition-colors",
        !notification.read && "bg-muted/50"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {notification.read ? (
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Circle className="h-4 w-4 text-primary fill-primary" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
