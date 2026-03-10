"use server";

import { createClient, getCachedSession } from "@/lib/supabase/server";
import { Ticket, User, TicketStatus, TicketPriority } from "@/lib/types";

export interface DashboardData {
  tickets: Ticket[];
  staff: User[];
  stats: any; // Using any for stats to match the existing stats structure
  currentUser: User | null;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // 1. Get current user (Single point of auth check)
  const { data: { session }, error: authError } = await getCachedSession();
  const authUser = session?.user;
  
  if (authError || !authUser) {
    console.error("Auth error in getDashboardData:", authError);
    throw new Error("Unauthorized");
  }

  // 2. Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    throw new Error("User profile not found");
  }

  const role = profile.role;

  // 3. Fetch tickets (with role-based filtering)
  let ticketQuery = supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (role === "sims_manager") {
    ticketQuery = ticketQuery.eq("category", "sims");
  } else if (role === "technician") {
    ticketQuery = ticketQuery.neq("category", "sims");
  }

  const { data: tickets } = await ticketQuery;

  // 4. Fetch IT staff
  const { data: staff } = await supabase
    .from("users")
    .select("*")
    .in("role", ["technician", "supervisor", "sims_manager"])
    .order("full_name");

  // 5. Fetch Stats (Calculated server-side to save on client-side compute)
  // Reusing logic from get-ticket-stats.ts
  const { data: allTicketsForStats } = await supabase
    .from("tickets")
    .select(`
      id,
      status,
      assigned_to,
      users:assigned_to (
        id,
        full_name
      )
    `);

  const stats = {
    total: allTicketsForStats?.length || 0,
    open: allTicketsForStats?.filter((t) => t.status === "open").length || 0,
    in_progress: allTicketsForStats?.filter((t) => t.status === "in_progress").length || 0,
    pending: allTicketsForStats?.filter((t) => t.status === "pending").length || 0,
    resolved: allTicketsForStats?.filter((t) => t.status === "resolved").length || 0,
    closed: allTicketsForStats?.filter((t) => t.status === "closed").length || 0,
    unassigned: allTicketsForStats?.filter((t) => !t.assigned_to).length || 0,
    byTechnician: [] as any[],
  };

  const technicianMap = new Map<string, { name: string; count: number }>();
  allTicketsForStats?.forEach((ticket) => {
    if (ticket.assigned_to && ticket.users) {
      const techId = ticket.assigned_to;
      const existing = technicianMap.get(techId);
      if (existing) {
        existing.count++;
      } else {
        technicianMap.set(techId, {
          name: (ticket.users as any).full_name || "Unknown",
          count: 1,
        });
      }
    }
  });

  stats.byTechnician = Array.from(technicianMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    count: data.count,
  }));

  return {
    tickets: tickets || [],
    staff: staff || [],
    stats,
    currentUser: profile as User,
  };
}
