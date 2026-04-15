import { redirect } from "next/navigation";
import { getCachedUser, createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { getUsers } from "@/app/actions/get-users";
import { UserManagementTable } from "@/components/admin/user-management-table";

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto p-8 space-y-8 max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage IT staff accounts and securely dispatch welcome emails.
              </p>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 mb-6">
            <strong>Security Notice:</strong> Sending a welcome email triggers a secure password reset link valid for 24 hours. The staff member will use it to set their own permanent password and log in.
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
