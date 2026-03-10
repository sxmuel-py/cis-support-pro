"use server";

import { createClient, getCachedSession } from "@/lib/supabase/server";
import { Ticket } from "@/lib/types";

export async function getFilteredTickets() {
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
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  // Role-based filtering (Server-side)
  if (role === "sims_manager") {
    // SIMS Manager only sees SIMS tickets
    query = query.eq("category", "sims");
  } else if (role === "technician") {
    // Technicians see everything EXCEPT SIMS tickets
    query = query.neq("category", "sims");
  }
  // Supervisors see all (no extra filter)

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return data as Ticket[];
}
