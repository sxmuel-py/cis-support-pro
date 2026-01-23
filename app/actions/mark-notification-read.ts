"use server";

import { createClient } from "@/lib/supabase/server";

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: error.message };
  }

  return { success: true };
}
