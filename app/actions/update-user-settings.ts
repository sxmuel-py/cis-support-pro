"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(data: {
  fullName: string;
  email: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Update user profile in users table
  const { error: profileError } = await supabase
    .from("users")
    .update({
      full_name: data.fullName,
      email: data.email,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  // Update auth email if changed
  if (data.email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({
      email: data.email,
    });

    if (emailError) {
      return { error: emailError.message };
    }
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getUserSettings() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return userData;
}
