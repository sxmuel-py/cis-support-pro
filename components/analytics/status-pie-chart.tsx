"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface StatusPieChartProps {
  data: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  open: "hsl(203 89% 53%)",
  in_progress: "hsl(32 95% 56%)",
  pending: "hsl(262 83% 58%)",
  resolved: "hsl(142 71% 45%)",
  closed: "hsl(215 16% 47%)",
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = data.map((item) => ({
    name: item.status.replace("_", " ").toUpperCase(),
    value: item.count,
    percentage: item.percentage.toFixed(1),
  }));

  return (
    <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>Breakdown of tickets by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={88}
              innerRadius={42}
              fill="#8884d8"
              dataKey="value"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => {
                const status = data[index].status;
                return <Cell key={`cell-${index}`} fill={STATUS_COLORS[status] || "hsl(var(--muted))"} />;
              })}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
