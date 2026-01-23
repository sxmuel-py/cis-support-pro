"use client";

import { useEffect, useState } from "react";
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
import { Inbox, Clock, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const supabase = createClient();

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">
                {isSupervisor ? "Team performance and ticket insights" : "Your performance metrics"}
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2">
              <Button
                variant={timeRange === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(7)}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(30)}
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === 90 ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(90)}
              >
                90 Days
              </Button>
              
              {/* Export Buttons */}
              {data && (
                <>
                  <div className="w-px bg-border mx-2" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(data, timeRange)}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToJSON(data, timeRange)}
                  >
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printReport(data, timeRange)}
                  >
                    Print/PDF
                  </Button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading analytics...</p>
                </div>
              </CardContent>
            </Card>
          ) : !data ? (
            <Card>
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
