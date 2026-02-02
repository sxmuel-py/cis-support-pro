"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/sidebar";
import { TicketList } from "@/components/ticket-list";
import { TeamWorkload } from "@/components/team-workload";
import { TicketDetail } from "@/components/ticket-detail";
import { TicketFilters } from "@/components/ticket-filters";
import { Ticket, User, TicketStatus, TicketPriority } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Clock, CheckCircle2, AlertCircle, Loader2, UserX } from "lucide-react";
import { getITStaff } from "@/app/actions/get-staff";
import { getTicketStats } from "@/app/actions/get-ticket-stats";

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [workloadStats, setWorkloadStats] = useState<{ id: string; name: string; count: number }[]>([]);
  
  // Filter state
  const [filter, setFilter] = useState<"all" | "mine" | "unassigned">("all");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const supabase = createClient();

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        
        if (userData) {
          setCurrentUser(userData);
        }
      }
    };

    fetchCurrentUser();
  }, [supabase]);

  // Fetch IT staff
  useEffect(() => {
    const fetchStaff = async () => {
      const staffData = await getITStaff();
      setStaff(staffData);
    };

    fetchStaff();
  }, []);

  // Fetch tickets from Supabase
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
      } else {
        setTickets(data || []);
      }
      setLoading(false);
    };

    fetchTickets();

    // Set up real-time subscription
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        (payload) => {
          console.log("Real-time update:", payload);

          if (payload.eventType === "INSERT") {
            setTickets((current) => [payload.new as Ticket, ...current]);
          } else if (payload.eventType === "UPDATE") {
            setTickets((current) =>
              current.map((ticket) =>
                ticket.id === payload.new.id ? (payload.new as Ticket) : ticket
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTickets((current) =>
              current.filter((ticket) => ticket.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Fetch workload stats
  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getTicketStats();
      setWorkloadStats(stats.byTechnician);
    };

    fetchStats();

    // Refresh stats when tickets change
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [tickets]);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
  };

  const isSupervisor = currentUser?.role === "supervisor";

  // Apply filters
  const filteredTickets = tickets.filter((ticket) => {
    // Role-based filtering
    const isSimsManager = currentUser?.role === "sims_manager";
    const isTechnician = currentUser?.role === "technician";

    // SIMS Manager sees ONLY SIMS tickets
    if (isSimsManager && ticket.category !== "sims") return false;

    // Technicians see everything EXCEPT SIMS tickets (Supervisors see all)
    if (isTechnician && ticket.category === "sims") return false;

    // Tab filter
    if (filter === "mine" && ticket.assigned_to !== currentUser?.id) return false;
    if (filter === "unassigned" && ticket.assigned_to) return false;

    // Status filter
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.sender_name?.toLowerCase().includes(query) ||
        ticket.sender_email.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome to your IT Help Desk Command Center
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time tickets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.open}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.in_progress}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Being worked on
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.resolved}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed
                </p>
              </CardContent>
            </Card>

            {isSupervisor && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                  <UserX className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.unassigned}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Needs assignment
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Team Workload Widget (Supervisors Only) */}
          {isSupervisor && workloadStats.length > 0 && (
            <TeamWorkload stats={workloadStats} />
          )}

          {/* Active Tickets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Active Tickets</h2>
                <p className="text-sm text-muted-foreground">
                  Manage and track all support requests
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {filteredTickets.length} of {tickets.length} tickets
              </Badge>
            </div>

            {/* Filters */}
            <TicketFilters
              filter={filter}
              onFilterChange={setFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isSupervisor={isSupervisor}
            />

            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading tickets...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Inbox className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No tickets found</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Tickets will appear here when emails are sent to cishelpdesk@cislagos.org"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <TicketList 
                tickets={filteredTickets}
                staff={staff}
                currentUser={currentUser}
                onTicketClick={(ticket) => setSelectedTicket(ticket)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          currentUser={currentUser}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}

