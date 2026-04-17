"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { Inbox, Clock, CheckCircle2, AlertCircle, Loader2, UserX, LayoutList, KanbanSquare, Sparkles, ShieldCheck, RefreshCcw, Siren, ArrowUpRight, TimerReset } from "lucide-react";
import { getDashboardData } from "@/app/actions/get-dashboard-data";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authDebug, setAuthDebug] = useState<{ id?: string, email?: string }>({});
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
      if (data.isUnauthenticated) {
        router.push("/auth/login");
        return;
      }
      setTickets(data.tickets);
      setStaff(data.staff);
      setCurrentUser(data.currentUser);
      setAuthDebug({ id: data.authId, email: data.authEmail });
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

  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (!ticketId || tickets.length === 0) return;

    const matchingTicket = tickets.find((candidate) => candidate.id === ticketId);
    if (matchingTicket) {
      setSelectedTicket((current) => current?.id === matchingTicket.id ? current : matchingTicket);
    }
  }, [searchParams, tickets]);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
  };
  const urgentCount = tickets.filter((t) => t.priority === "urgent").length;
  const mineCount = tickets.filter((t) => t.assigned_to === currentUser?.id).length;
  const staleOpenCount = tickets.filter((t) => {
    const ageInHours = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
    return t.status === "open" && ageInHours >= 24;
  }).length;

  const isSupervisor = currentUser?.role === "supervisor";
  const isHod = currentUser?.role === "hod";
  const isStaffAdmin = isSupervisor || isHod;
  const firstName = currentUser?.full_name?.split(" ")[0] || "Team";
  const highlightCards = [
    {
      title: "Urgent Queue",
      value: urgentCount,
      description: urgentCount > 0 ? "High-friction tickets that need active eyes." : "No urgent tickets competing for attention.",
      icon: Siren,
      accent: "from-rose-500/20 to-orange-500/10",
    },
    {
      title: "My Active Work",
      value: mineCount,
      description: currentUser?.role === "technician" ? "Tickets currently sitting with you." : "Use this as a quick ownership pulse.",
      icon: ShieldCheck,
      accent: "from-sky-500/20 to-cyan-500/10",
    },
    {
      title: "Aging Open Tickets",
      value: staleOpenCount,
      description: "Open for more than 24 hours and still awaiting progress.",
      icon: TimerReset,
      accent: "from-amber-500/20 to-yellow-500/10",
    },
  ];
  const statCards = [
    {
      title: "Total Tickets",
      value: stats.total,
      description: "Full pipeline across the helpdesk.",
      meta: `${stats.pending} pending review`,
      icon: Inbox,
      iconClass: "text-slate-700",
    },
    {
      title: "Open",
      value: stats.open,
      description: "Fresh requests needing triage or pickup.",
      meta: urgentCount > 0 ? `${urgentCount} urgent` : "Queue is calm",
      icon: AlertCircle,
      iconClass: "text-sky-600",
    },
    {
      title: "In Progress",
      value: stats.in_progress,
      description: "Tickets actively being worked on.",
      meta: `${mineCount} in your lane`,
      icon: Clock,
      iconClass: "text-amber-500",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      description: "Issues closed out and communicated.",
      meta: `${Math.round((stats.resolved / Math.max(stats.total, 1)) * 100)}% completion`,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    },
  ];

  if (!loading && !currentUser) {
    return (
      <div className="flex h-screen bg-background items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-destructive/20 shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <UserX className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>IT Staff Account Required</CardTitle>
            <CardDescription>
              We found your IT login, but you haven't been added to the IT Staff list yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-3 rounded-md text-left text-xs space-y-2 font-mono break-all border">
              <p><span className="text-muted-foreground">ID:</span> {authDebug.id}</p>
              <p><span className="text-muted-foreground">Email:</span> {authDebug.email}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please contact the IT HOD or a Supervisor to authorize your account using the ID above.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.reload()} variant="outline">Refresh Dashboard</Button>
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto space-y-5 px-3 pb-24 pt-3 sm:space-y-8 sm:p-6 md:p-8 md:pb-8">
          <div className="mesh-panel overflow-hidden rounded-[1.5rem] border border-white/60 shadow-2xl shadow-slate-200/70 dark:border-white/10 dark:shadow-black/30 sm:rounded-[2rem]">
            <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge className="w-fit rounded-full border-0 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Operations Console
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl md:text-5xl">
                    {`Good to see you, ${firstName}.`}
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The support queue is live. Keep the backlog moving, spot risk early, and hand off work with confidence.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                  <div className="rounded-full bg-white/80 px-3 py-1 shadow-sm dark:bg-white/10">
                    {stats.total} total tickets in view
                  </div>
                  <div className="rounded-full bg-white/80 px-3 py-1 shadow-sm dark:bg-white/10">
                    {currentUser?.role?.replace("_", " ")} access
                  </div>
                  <div className="rounded-full bg-white/80 px-3 py-1 shadow-sm dark:bg-white/10">
                    {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
                {highlightCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div key={card.title} className={`rounded-[1.35rem] border border-white/70 bg-gradient-to-br ${card.accent} p-4 shadow-lg shadow-slate-200/50 dark:border-white/15 dark:shadow-black/20 sm:rounded-3xl`}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          {card.title}
                        </span>
                        <Icon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                      </div>
                      <div className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{card.value}</div>
                      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:text-sm">{card.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={`grid gap-3 sm:gap-4 ${isStaffAdmin ? "sm:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.title} className="surface-glass border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/25">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-2 shadow-sm dark:bg-white/10">
                      <Icon className={`h-4 w-4 ${card.iconClass}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between gap-4">
                      <div className="text-3xl font-semibold tracking-tight">{card.value}</div>
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        {card.meta}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {isStaffAdmin && (
              <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/25">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Unassigned</CardTitle>
                    <CardDescription>Tickets waiting for an owner.</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-2 shadow-sm dark:bg-white/10">
                    <UserX className="h-4 w-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-4">
                    <div className="text-3xl font-semibold tracking-tight">{stats.unassigned}</div>
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Dispatch queue
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {isStaffAdmin && workloadStats.length > 0 && (
            <TeamWorkload stats={workloadStats} />
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/60 bg-white/60 p-4 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 sm:rounded-[2rem] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight dark:text-white sm:text-2xl">Active Tickets</h2>
                <p className="text-sm text-muted-foreground">
                  Scan the live queue, then jump into detail with one click.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15 sm:w-auto"
                  onClick={() => refreshData(true)}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh Queue
                </Button>
                <div className="grid w-full grid-cols-2 items-center rounded-2xl border border-white/70 bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-white/10 sm:flex sm:w-auto">
                  <Button 
                    variant={viewMode === "list" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-9 rounded-xl px-3"
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList className="w-4 h-4 mr-1" />
                    List
                  </Button>
                  <Button 
                    variant={viewMode === "board" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-9 rounded-xl px-3"
                    onClick={() => setViewMode("board")}
                  >
                    <KanbanSquare className="w-4 h-4 mr-1" />
                    Board
                  </Button>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs dark:bg-white/10 dark:text-slate-200 sm:text-sm">
                  {filteredTickets.length} of {tickets.length} tickets
                </Badge>
              </div>
            </div>

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
              <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading tickets...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredTickets.length === 0 ? (
              <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
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
                refreshData={refreshData}
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
