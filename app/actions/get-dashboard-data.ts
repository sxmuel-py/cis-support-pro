"use server";

import { createClient, getCachedSession } from "@/lib/supabase/server";
import { Ticket, User, TicketStatus, TicketPriority } from "@/lib/types";

export interface DashboardData {
  tickets: Ticket[];
  staff: User[];
  stats: any; // Using any for stats to match the existing stats structure
  currentUser: User | null;
  authId?: string;
  authEmail?: string;
  isUnauthenticated?: boolean;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // 1. Get current user (Single point of auth check)
  const { data: { session }, error: authError } = await getCachedSession();
  const authUser = session?.user;
  
  if (authError || !authUser) {
    console.error("Auth error in getDashboardData:", authError);
    return {
      tickets: [],
      staff: [],
      stats: {
        total: 0,
        open: 0,
        in_progress: 0,
        pending: 0,
        resolved: 0,
        closed: 0,
        unassigned: 0,
        byTechnician: [],
      },
      currentUser: null,
      isUnauthenticated: true,
    };
  }

  // 2. Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    if (profileError) console.error("Profile fetch error:", profileError);
    return {
      tickets: [],
      staff: [],
      stats: {
        total: 0,
        open: 0,
        in_progress: 0,
        pending: 0,
        resolved: 0,
        closed: 0,
        unassigned: 0,
        byTechnician: [],
      },
      currentUser: null,
      authId: authUser.id,
      authEmail: authUser.email,
    };
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
    .in("role", ["technician", "supervisor", "sims_manager", "hod"])
    .order("full_name");

  // 5. Fetch Stats (Calculated server-side to save on client-side compute)
  // Reusing logic from get-ticket-stats.ts
  let statsQuery = supabase
    .from("tickets")
    .select(`
      id,
      status,
      assigned_to,
      category,
      users:assigned_to (
        id,
        full_name
      )
    `);

  // Role-based filtering for stats
  if (role === "sims_manager") {
    statsQuery = statsQuery.eq("category", "sims");
  } else if (role === "technician") {
    statsQuery = statsQuery.neq("category", "sims");
  }

  const { data: allTicketsForStats } = await statsQuery;

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
    authId: authUser.id,
    authEmail: authUser.email,
  };
}
