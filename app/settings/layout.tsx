import { createClient, getCachedSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
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

  return <>{children}</>;
}
