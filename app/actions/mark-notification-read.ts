"use server";

import { createClient, getCachedUser } from "@/lib/supabase/server";

async function getAuthenticatedUserId() {
  const { data: { user } } = await getCachedUser();
  return user?.id ?? null;
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return { error: "Unauthorized" };
  }

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
