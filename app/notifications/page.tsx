"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/notification-item";
import { getNotifications, getUnreadCount, type Notification } from "@/app/actions/get-notifications";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/app/actions/mark-notification-read";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notificationData, unread] = await Promise.all([
          getNotifications(false),
          getUnreadCount(),
        ]);

        setNotifications(notificationData);
        setUnreadCount(unread);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.error) return;

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true, read_at: new Date().toISOString() }
          : notification
      )
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead();
    if (result.error) return;

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Updates about assignments, rejections, and ticket activity.
                </CardDescription>
              </div>

              {unreadCount > 0 && (
                <Button variant="outline" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">No notifications yet</p>
                    <p className="text-sm text-muted-foreground">
                      When something changes, it will show up here.
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[70vh]">
                  <div className="divide-y rounded-md border">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
