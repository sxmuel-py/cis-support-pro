"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TechnicianPerformanceTableProps {
  data: {
    id: string;
    name: string;
    assigned: number;
    resolved: number;
    avgResolutionTime: number;
    acceptanceRate: number;
  }[];
}

export function TechnicianPerformanceTable({ data }: TechnicianPerformanceTableProps) {
  if (data.length === 0) {
    return (
      <Card className="surface-glass col-span-2 border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
        <CardHeader>
          <CardTitle>Technician Performance</CardTitle>
          <CardDescription>Performance metrics per technician</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No technician data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surface-glass col-span-2 border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
      <CardHeader>
        <CardTitle>Technician Performance</CardTitle>
        <CardDescription>Performance metrics per technician</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 dark:bg-white/5">
              <TableHead>Technician</TableHead>
              <TableHead className="text-right">Assigned</TableHead>
              <TableHead className="text-right">Resolved</TableHead>
              <TableHead className="text-right">Avg Resolution Time</TableHead>
              <TableHead className="text-right">Acceptance Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((tech) => (
              <TableRow key={tech.id} className="border-white/50 dark:border-white/10">
                <TableCell className="font-medium dark:text-white">{tech.name}</TableCell>
                <TableCell className="text-right">{tech.assigned}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="success">{tech.resolved}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {tech.avgResolutionTime.toFixed(1)}h
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant={tech.acceptanceRate >= 80 ? "success" : tech.acceptanceRate >= 50 ? "warning" : "destructive"}
                  >
                    {tech.acceptanceRate.toFixed(0)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
