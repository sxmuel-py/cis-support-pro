"use server";

import { createClient } from "@/lib/supabase/server";
import { User } from "@/lib/types";

export async function getITStaff(): Promise<User[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching IT staff:", error);
    return [];
  }

  return data || [];
}
