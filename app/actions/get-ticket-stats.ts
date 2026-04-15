"use server";

import { createClient, getCachedUser } from "@/lib/supabase/server";

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  pending: number;
  resolved: number;
  closed: number;
  unassigned: number;
  byTechnician: {
    id: string;
    name: string;
    count: number;
  }[];
}

export async function getTicketStats(): Promise<TicketStats> {
  const supabase = await createClient();

  // Get current user role
  const { data: { user } } = await getCachedUser();
  let role = null;
  
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role;
  }

  // Get tickets with role-based filtering
  let query = supabase
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

  if (role === "sims_manager") {
    query = query.eq("category", "sims");
  } else if (role === "technician") {
    query = query.neq("category", "sims");
  }

  const { data: tickets } = await query;

  if (!tickets) {
    return {
      total: 0,
      open: 0,
      in_progress: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
      unassigned: 0,
      byTechnician: [],
    };
  }

  // Calculate stats
  const stats: TicketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
    byTechnician: [],
  };

  // Group by technician
  const technicianMap = new Map<string, { name: string; count: number }>();
  
  tickets.forEach((ticket) => {
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

  return stats;
}
