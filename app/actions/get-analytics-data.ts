"use server";

import { createClient } from "@/lib/supabase/server";

export interface AnalyticsData {
  overview: {
    totalTickets: number;
    avgResponseTime: number; // in hours
    avgResolutionTime: number; // in hours
    openTickets: number;
  };
  ticketTrends: {
    date: string;
    created: number;
    resolved: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  priorityDistribution: {
    priority: string;
    count: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
  }[];
  technicianPerformance: {
    id: string;
    name: string;
    assigned: number;
    resolved: number;
    avgResolutionTime: number;
    acceptanceRate: number;
  }[];
}

export async function getAnalyticsData(
  userId?: string,
  timeRange: number = 30 // days
): Promise<AnalyticsData | null> {
  const supabase = await createClient();

  try {
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Get all tickets (filtered by user if technician)
    let ticketsQuery = supabase
      .from("tickets")
      .select("*")
      .gte("created_at", startDate.toISOString());

    if (userId) {
      ticketsQuery = ticketsQuery.eq("assigned_to", userId);
    }

    const { data: tickets } = await ticketsQuery;

    if (!tickets) {
      return null;
    }

    // Overview stats
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === "open").length;

    // Calculate average response time (time to first assignment)
    const ticketsWithAssignment = tickets.filter((t) => t.assigned_at);
    const avgResponseTime =
      ticketsWithAssignment.length > 0
        ? ticketsWithAssignment.reduce((sum, t) => {
            const created = new Date(t.created_at).getTime();
            const assigned = new Date(t.assigned_at!).getTime();
            return sum + (assigned - created) / (1000 * 60 * 60); // hours
          }, 0) / ticketsWithAssignment.length
        : 0;

    // Calculate average resolution time
    const resolvedTickets = tickets.filter((t) => t.status === "resolved" || t.status === "closed");
    const avgResolutionTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
            const created = new Date(t.created_at).getTime();
            const updated = new Date(t.updated_at).getTime();
            return sum + (updated - created) / (1000 * 60 * 60); // hours
          }, 0) / resolvedTickets.length
        : 0;

    // Ticket trends (group by date)
    const trendMap = new Map<string, { created: number; resolved: number }>();
    
    for (let i = 0; i < timeRange; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (timeRange - 1 - i));
      const dateStr = date.toISOString().split("T")[0];
      trendMap.set(dateStr, { created: 0, resolved: 0 });
    }

    tickets.forEach((ticket) => {
      const createdDate = new Date(ticket.created_at).toISOString().split("T")[0];
      if (trendMap.has(createdDate)) {
        trendMap.get(createdDate)!.created++;
      }

      if (ticket.status === "resolved" || ticket.status === "closed") {
        const resolvedDate = new Date(ticket.updated_at).toISOString().split("T")[0];
        if (trendMap.has(resolvedDate)) {
          trendMap.get(resolvedDate)!.resolved++;
        }
      }
    });

    const ticketTrends = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      created: data.created,
      resolved: data.resolved,
    }));

    // Status distribution
    const statusCounts = tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = (Object.entries(statusCounts) as [string, number][]).map(([status, count]) => ({
      status,
      count,
      percentage: (count / totalTickets) * 100,
    }));

    // Priority distribution
    const priorityCounts = tickets.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityDistribution = (Object.entries(priorityCounts) as [string, number][]).map(([priority, count]) => ({
      priority,
      count,
    }));

    // Category breakdown
    const categoryCounts = tickets.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryBreakdown = (Object.entries(categoryCounts) as [string, number][])
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Technician performance (only for supervisors)
    let technicianPerformance: AnalyticsData["technicianPerformance"] = [];

    if (!userId) {
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "technician");

      if (users) {
        technicianPerformance = users.map((user) => {
          const userTickets = tickets.filter((t) => t.assigned_to === user.id);
          const assigned = userTickets.length;
          const resolved = userTickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
          
          const userResolutionTime =
            resolved > 0
              ? userTickets
                  .filter((t) => t.status === "resolved" || t.status === "closed")
                  .reduce((sum, t) => {
                    const created = new Date(t.created_at).getTime();
                    const updated = new Date(t.updated_at).getTime();
                    return sum + (updated - created) / (1000 * 60 * 60);
                  }, 0) / resolved
              : 0;

          const acceptedCount = userTickets.filter((t) => t.assignment_status === "accepted").length;
          const acceptanceRate = assigned > 0 ? (acceptedCount / assigned) * 100 : 0;

          return {
            id: user.id,
            name: user.full_name || "Unknown",
            assigned,
            resolved,
            avgResolutionTime: userResolutionTime,
            acceptanceRate,
          };
        });
      }
    }

    return {
      overview: {
        totalTickets,
        avgResponseTime,
        avgResolutionTime,
        openTickets,
      },
      ticketTrends,
      statusDistribution,
      priorityDistribution,
      categoryBreakdown,
      technicianPerformance,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return null;
  }
}
