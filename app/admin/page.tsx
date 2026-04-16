import { redirect } from "next/navigation";
import { getCachedUser, createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { getUsers } from "@/app/actions/get-users";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MailCheck, Users2, Sparkles } from "lucide-react";

export default async function AdminPage() {
  const { data: { user } } = await getCachedUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  // Only HODs and Supervisors can access the admin panel
  if (!profile || (profile.role !== "hod" && profile.role !== "supervisor")) {
    redirect("/dashboard");
  }

  const users = await getUsers();
  const roleCounts = users.reduce<Record<string, number>>((acc, current) => {
    acc[current.role] = (acc[current.role] || 0) + 1;
    return acc;
  }, {});
  const inactiveUsers = users.filter((candidate) => !candidate.last_sign_in).length;
  const totalStaff = users.length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-4 sm:space-y-8 sm:p-6 md:p-8 md:pb-8">
          <div className="mesh-panel overflow-hidden rounded-[2rem] border border-white/60 shadow-2xl shadow-slate-200/70 dark:border-white/10 dark:shadow-black/30">
            <div className="flex flex-col gap-6 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge className="w-fit rounded-full border-0 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Admin Control
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                    Manage the people behind the queue.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                    Review IT staff access, keep roles visible, and dispatch secure setup emails without losing operational context.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
                <AdminStatCard
                  title="Total Staff"
                  value={totalStaff}
                  description="Visible in the support command roster."
                  icon={<Users2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />}
                />
                <AdminStatCard
                  title="Never Signed In"
                  value={inactiveUsers}
                  description="Accounts that still need their first secure login."
                  icon={<MailCheck className="h-4 w-4 text-amber-600 dark:text-amber-300" />}
                />
                <AdminStatCard
                  title="HOD + Supervisors"
                  value={(roleCounts.hod || 0) + (roleCounts.supervisor || 0)}
                  description="Users with elevated control over staffing workflows."
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="surface-glass rounded-[2rem] border border-white/60 p-5 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
              <h2 className="text-xl font-semibold tracking-tight dark:text-white">Security workflow</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sending a welcome email triggers a secure password reset link valid for 24 hours. Staff members use it to set their own permanent password and complete first access safely.
              </p>
            </div>

            <div className="surface-glass rounded-[2rem] border border-white/60 p-5 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
              <h2 className="text-xl font-semibold tracking-tight dark:text-white">Role mix</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 dark:bg-white/10 dark:text-slate-200">
                  {(roleCounts.hod || 0)} HOD
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 dark:bg-white/10 dark:text-slate-200">
                  {(roleCounts.supervisor || 0)} Supervisors
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 dark:bg-white/10 dark:text-slate-200">
                  {(roleCounts.technician || 0)} Technicians
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 dark:bg-white/10 dark:text-slate-200">
                  {(roleCounts.sims_manager || 0)} SIMS Managers
                </Badge>
              </div>
            </div>
          </div>

          <UserManagementTable 
            initialUsers={users} 
            currentUser={{
              id: user.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              created_at: new Date().toISOString()
            }} 
          />
        </div>
      </main>
    </div>
  );
}

function AdminStatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/50 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">
          {title}
        </span>
        <div className="rounded-2xl bg-white/80 p-2 shadow-sm dark:bg-white/10">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
