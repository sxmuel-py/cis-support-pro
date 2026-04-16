"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TicketTrendsChartProps {
  data: {
    date: string;
    created: number;
    resolved: number;
  }[];
}

export function TicketTrendsChart({ data }: TicketTrendsChartProps) {
  // Format dates for display
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <Card className="surface-glass col-span-2 border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
      <CardHeader>
        <CardTitle>Ticket Trends</CardTitle>
        <CardDescription>Created vs Resolved tickets over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
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
            <Legend />
            <Line 
              type="monotone" 
              dataKey="created" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              name="Created"
            />
            <Line 
              type="monotone" 
              dataKey="resolved" 
              stroke="hsl(142 76% 36%)" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              name="Resolved"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
