import { getCachedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { data: { user } } = await getCachedUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/auth/login");
  }
}
