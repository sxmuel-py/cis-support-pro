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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5" />
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.map((tech) => (
          <div key={tech.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{tech.name}</span>
              <Badge variant="secondary" className="text-xs">
                {tech.count} {tech.count === 1 ? "ticket" : "tickets"}
              </Badge>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(tech.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
