import { createClient, getCachedSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TrashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await getCachedSession();
  const user = session?.user;

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is supervisor
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "supervisor") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
