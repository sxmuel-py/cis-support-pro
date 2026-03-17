"use server";

import { createClient } from "@supabase/supabase-js";
import { getCachedSession } from "@/lib/supabase/server";

export async function sendWelcomeEmail(targetUserId: string, targetEmail: string) {
  // We need the service role key to forcefully trigger password reset emails
  // for other users from the server side.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const supabaseClient = await import("@/lib/supabase/server").then(m => m.createClient());

  // 1. Auth check
  const { data: { session } } = await getCachedSession();
  const user = session?.user;

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabaseClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "hod" && profile.role !== "supervisor")) {
    return { error: "Only HODs and Supervisors can dispatch welcome emails." };
  }

  // 2. Trigger Supabase Password Reset Flow
  // We rely on Supabase's native built-in reset password email template right now, 
  // which will provide them a secure link to set their own password logging in.
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(targetEmail, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://helpdesk.cislagos.com'}/auth/callback?next=/settings`,
  });

  if (error) {
    console.error("Error triggering welcome reset:", error);
    return { error: "Failed to send the setup email. Check Supabase Auth settings." };
  }

  return { success: true };
}
