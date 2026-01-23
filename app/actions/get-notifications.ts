"use server";

import { createClient } from "@/lib/supabase/server";

export interface Notification {
  id: string;
  user_id: string;
  ticket_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  created_by: string | null;
}

export async function getNotifications(userId: string, unreadOnly: boolean = false) {
  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data as Notification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}
