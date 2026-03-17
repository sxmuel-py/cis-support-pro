"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/sidebar";
import { TicketList } from "@/components/ticket-list";
import { DragTicketBoard } from "@/components/drag-ticket-board";
import { TeamWorkload } from "@/components/team-workload";
import { TicketDetail } from "@/components/ticket-detail";
import { TicketFilters } from "@/components/ticket-filters";
import { Ticket, User, TicketStatus, TicketPriority } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Clock, CheckCircle2, AlertCircle, Loader2, UserX, LayoutList, KanbanSquare } from "lucide-react";
import { getDashboardData } from "@/app/actions/get-dashboard-data";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [workloadStats, setWorkloadStats] = useState<{ id: string; name: string; count: number }[]>([]);
  
  // View mode
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  
  // Filter state
  const [filter, setFilter] = useState<"all" | "mine" | "unassigned">("all");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const supabase = useMemo(() => createClient(), []);

  // Consolidated data fetching
  const refreshData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getDashboardData();
      setTickets(data.tickets);
      setStaff(data.staff);
      setCurrentUser(data.currentUser);
      setWorkloadStats(data.stats.byTechnician);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    refreshData(true);

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
            // Re-fetch everything to ensure server-side filtering is applied to the new item
            refreshData();
          } else if (payload.eventType === "UPDATE") {
            // Optimistically update tickets
            setTickets((current) =>
              current.map((ticket) =>
                ticket.id === payload.new.id ? (payload.new as Ticket) : ticket
              )
            );
            // Refresh stats in background as assignments might have changed
            refreshData();
          } else if (payload.eventType === "DELETE") {
            setTickets((current) =>
              current.filter((ticket) => ticket.id !== payload.old.id)
            );
            refreshData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Periodic stats refresh (less frequent now as real-time updates also refresh stats)
  useEffect(() => {
    const interval = setInterval(() => refreshData(), 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
  };

  const isSupervisor = currentUser?.role === "supervisor";
  const isHod = currentUser?.role === "hod";
  const isStaffAdmin = isSupervisor || isHod;

  // Apply filters
  const filteredTickets = tickets.filter((ticket) => {
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

            {isStaffAdmin && (
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

          {/* Team Workload Widget (Admins Only) */}
          {isStaffAdmin && workloadStats.length > 0 && (
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
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-md border bg-muted/50 p-1">
                  <Button 
                    variant={viewMode === "list" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList className="w-4 h-4 mr-1" />
                    List
                  </Button>
                  <Button 
                    variant={viewMode === "board" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => setViewMode("board")}
                  >
                    <KanbanSquare className="w-4 h-4 mr-1" />
                    Board
                  </Button>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {filteredTickets.length} of {tickets.length} tickets
                </Badge>
              </div>
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
              isSupervisor={isStaffAdmin}
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
            ) : viewMode === "list" ? (
              <TicketList 
                tickets={filteredTickets}
                staff={staff}
                currentUser={currentUser}
                onTicketClick={(ticket) => setSelectedTicket(ticket)}
              />
            ) : (
              <DragTicketBoard
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

