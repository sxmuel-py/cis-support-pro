import { getCachedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: { user } } = await getCachedUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
