"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PriorityBarChartProps {
  data: {
    priority: string;
    count: number;
  }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "hsl(215 16% 75%)",
  medium: "hsl(203 89% 53%)",
  high: "hsl(32 95% 56%)",
  urgent: "hsl(var(--destructive))",
};

export function PriorityBarChart({ data }: PriorityBarChartProps) {
  const chartData = data.map((item) => ({
    priority: item.priority.toUpperCase(),
    count: item.count,
    fill: PRIORITY_COLORS[item.priority] || "hsl(var(--muted))",
  }));

  return (
    <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
      <CardHeader>
        <CardTitle>Priority Distribution</CardTitle>
        <CardDescription>Tickets by priority level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
            <XAxis 
              type="number"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              dataKey="priority" 
              type="category"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="count" radius={[0, 10, 10, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
