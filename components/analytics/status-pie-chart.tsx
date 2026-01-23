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
  open: "hsl(var(--chart-1))",
  in_progress: "hsl(var(--chart-2))",
  pending: "hsl(var(--chart-3))",
  resolved: "hsl(var(--chart-4))",
  closed: "hsl(var(--chart-5))",
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = data.map((item) => ({
    name: item.status.replace("_", " ").toUpperCase(),
    value: item.count,
    percentage: item.percentage.toFixed(1),
  }));

  return (
    <Card>
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
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
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
