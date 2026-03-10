"use server";

import { createClient, getCachedSession } from "@/lib/supabase/server";

export async function getTrash() {
  const supabase = await createClient();

  // Get current user and role
  const { data: { session } } = await getCachedSession();
  const user = session?.user;
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  // Build query
  let query = supabase
    .from("trash")
    .select("*")
    .order("created_at", { ascending: false });

  // Role-based filtering for trash
  // SIMS managers only see junk that mentions SIMS-related keywords
  if (role === "sims_manager") {
    query = query.or("email_subject.ilike.%sims%,email_subject.ilike.%isams%,body.ilike.%sims%,body.ilike.%isams%");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching trash:", error);
    return [];
  }

  return data || [];
}
