"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface TeamWorkloadProps {
  stats: {
    id: string;
    name: string;
    count: number;
  }[];
}

export function TeamWorkload({ stats }: TeamWorkloadProps) {
  if (stats.length === 0) {
    return null;
  }

  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const totalLoad = stats.reduce((sum, tech) => sum + tech.count, 0);

  return (
    <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Team Workload
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Live distribution across the active support bench.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          {totalLoad} open assignments
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((tech) => (
          <div key={tech.id} className="rounded-2xl border bg-white/70 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{tech.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Current queue
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full text-xs">
                {tech.count} {tech.count === 1 ? "ticket" : "tickets"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(tech.count / maxCount) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {tech.count === maxCount ? "Highest current load" : `${maxCount - tech.count} behind the busiest queue`}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
