"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { getNotifications, getUnreadCount, type Notification } from "@/app/actions/get-notifications";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/mark-notification-read";
import { NotificationItem } from "./notification-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await getNotifications(userId, false);
      setNotifications(data.slice(0, 5)); // Show only last 5 in dropdown
      
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    };

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Notification update:", payload);

          if (payload.eventType === "INSERT") {
            setNotifications((current) => [payload.new as Notification, ...current.slice(0, 4)]);
            setUnreadCount((count) => count + 1);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((current) =>
              current.map((notif) =>
                notif.id === payload.new.id ? (payload.new as Notification) : notif
              )
            );
            
            // Update unread count
            if ((payload.new as Notification).read && !(payload.old as Notification).read) {
              setUnreadCount((count) => Math.max(0, count - 1));
            }
          } else if (payload.eventType === "DELETE") {
            setNotifications((current) =>
              current.filter((notif) => notif.id !== payload.old.id)
            );
            
            if (!(payload.old as Notification).read) {
              setUnreadCount((count) => Math.max(0, count - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications((current) =>
      current.map((notif) => ({ ...notif, read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full text-sm">
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
