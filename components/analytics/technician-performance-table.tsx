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
        <div className="space-y-3 md:hidden">
          {data.map((tech) => (
            <div key={tech.id} className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium dark:text-white">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">Assigned {tech.assigned} tickets</p>
                </div>
                <Badge variant={tech.acceptanceRate >= 80 ? "success" : tech.acceptanceRate >= 50 ? "warning" : "destructive"}>
                  {tech.acceptanceRate.toFixed(0)}%
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/50 p-3 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Resolved</p>
                  <p className="mt-1 font-semibold dark:text-white">{tech.resolved}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Avg Time</p>
                  <p className="mt-1 font-semibold dark:text-white">{tech.avgResolutionTime.toFixed(1)}h</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5">
        <div className="hidden md:block">
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
        </div>
      </CardContent>
    </Card>
  );
}
