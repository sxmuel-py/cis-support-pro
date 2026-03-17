"use server";

import { createClient, getCachedSession } from "@/lib/supabase/server";

export async function getUsers() {
  const supabase = await createClient();

  const { data: { session } } = await getCachedSession();
  const user = session?.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify HOD/Supervisor
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "hod" && profile.role !== "supervisor")) {
    throw new Error("Unauthorized access to user management");
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return users;
}
