"use client";

import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/analytics/stat-card";
import { TicketTrendsChart } from "@/components/analytics/ticket-trends-chart";
import { StatusPieChart } from "@/components/analytics/status-pie-chart";
import { PriorityBarChart } from "@/components/analytics/priority-bar-chart";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { TechnicianPerformanceTable } from "@/components/analytics/technician-performance-table";
import { getAnalyticsData, type AnalyticsData } from "@/app/actions/get-analytics-data";
import { exportToCSV, exportToJSON, printReport } from "@/lib/export-utils";
import { createClient } from "@/lib/supabase/client";
import { Inbox, Clock, CheckCircle2, TrendingUp, Loader2, Sparkles, Download, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, timeRange]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single();
      
      setCurrentUser(userData);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const userId = currentUser?.role === "technician" ? currentUser.id : undefined;
    const analyticsData = await getAnalyticsData(userId, timeRange);
    setData(analyticsData);
    setLoading(false);
  };

  const isSupervisor = currentUser?.role === "supervisor";
  const timeOptions = [7, 30, 90];
  const exportActions = data ? [
    { label: "Export CSV", onClick: () => exportToCSV(data, timeRange) },
    { label: "Export JSON", onClick: () => exportToJSON(data, timeRange) },
    { label: "Print / PDF", onClick: () => printReport(data, timeRange) },
  ] : [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto space-y-8 p-6 md:p-8">
          <div className="mesh-panel overflow-hidden rounded-[2rem] border border-white/60 shadow-2xl shadow-slate-200/70">
            <div className="flex flex-col gap-6 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge className="w-fit rounded-full border-0 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-700 shadow-sm">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Performance Intelligence
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                    Analytics that actually help you steer.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    {isSupervisor
                      ? "Monitor queue health, spot team imbalance early, and keep service quality visible."
                      : "Track your response rhythm, output, and where your tickets are spending time."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
                <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/50">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Time Window</div>
                  <div className="text-3xl font-semibold text-slate-900">{timeRange}</div>
                  <p className="mt-2 text-sm text-slate-600">Days in view</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/50">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Perspective</div>
                  <div className="text-xl font-semibold text-slate-900">{isSupervisor ? "Team" : "Personal"}</div>
                  <p className="mt-2 text-sm text-slate-600">Current reporting lens</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/50">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Exports</div>
                  <div className="text-xl font-semibold text-slate-900">{data ? exportActions.length : 0}</div>
                  <p className="mt-2 text-sm text-slate-600">Report formats ready</p>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-glass flex flex-col gap-4 rounded-[2rem] border border-white/60 p-5 shadow-xl shadow-slate-200/60 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Reporting Controls</h2>
              <p className="text-sm text-muted-foreground">
                Choose the period you want to inspect, then export when you need to share the story.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-2xl border border-white/70 bg-white/80 p-1 shadow-sm">
                <CalendarRange className="ml-3 h-4 w-4 text-muted-foreground" />
                {timeOptions.map((option) => (
                  <Button
                    key={option}
                    variant={timeRange === option ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 rounded-xl px-3"
                    onClick={() => setTimeRange(option)}
                  >
                    {option} Days
                  </Button>
                ))}
              </div>

              {exportActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="rounded-2xl border-white/70 bg-white/80"
                  onClick={action.onClick}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60">
              <CardContent className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading analytics...</p>
                </div>
              </CardContent>
            </Card>
          ) : !data ? (
            <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60">
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">No data available</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Tickets"
                  value={data.overview.totalTickets}
                  icon={Inbox}
                  description={`In the last ${timeRange} days`}
                />
                <StatCard
                  title="Open Tickets"
                  value={data.overview.openTickets}
                  icon={TrendingUp}
                  description="Currently active"
                />
                <StatCard
                  title="Avg Response Time"
                  value={`${data.overview.avgResponseTime.toFixed(1)}h`}
                  icon={Clock}
                  description="Time to first assignment"
                />
                <StatCard
                  title="Avg Resolution Time"
                  value={`${data.overview.avgResolutionTime.toFixed(1)}h`}
                  icon={CheckCircle2}
                  description="Time to resolve"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <TicketTrendsChart data={data.ticketTrends} />
                <StatusPieChart data={data.statusDistribution} />
                <PriorityBarChart data={data.priorityDistribution} />
                <CategoryBarChart data={data.categoryBreakdown} />
              </div>

              {/* Technician Performance (Supervisors only) */}
              {isSupervisor && data.technicianPerformance.length > 0 && (
                <TechnicianPerformanceTable data={data.technicianPerformance} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
