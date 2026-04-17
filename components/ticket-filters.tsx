"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketStatus, TicketPriority } from "@/lib/types";

interface TicketFiltersProps {
  filter: "all" | "mine" | "unassigned";
  onFilterChange: (filter: "all" | "mine" | "unassigned") => void;
  statusFilter: TicketStatus | "all";
  onStatusFilterChange: (status: TicketStatus | "all") => void;
  priorityFilter: TicketPriority | "all";
  onPriorityFilterChange: (priority: TicketPriority | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSupervisor: boolean;
}

export function TicketFilters({
  filter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  searchQuery,
  onSearchChange,
  isSupervisor,
}: TicketFiltersProps) {
  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || searchQuery;

  return (
    <div className="surface-glass rounded-[1.5rem] border border-white/60 p-3 shadow-lg shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20 sm:rounded-3xl sm:p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full max-w-xl space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Search And Refine
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ticket ID, subject, sender, or category..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 rounded-2xl border-white/70 bg-white/80 pl-10 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1 dark:bg-white/5 sm:flex sm:w-auto">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              className="rounded-xl"
              onClick={() => onFilterChange("all")}
            >
              All Tickets
            </Button>
            <Button
              variant={filter === "mine" ? "default" : "ghost"}
              size="sm"
              className="rounded-xl"
              onClick={() => onFilterChange("mine")}
            >
              My Queue
            </Button>
            {isSupervisor && (
              <Button
                variant={filter === "unassigned" ? "default" : "ghost"}
                size="sm"
                className="col-span-2 rounded-xl sm:col-span-1"
                onClick={() => onFilterChange("unassigned")}
              >
                Unassigned
              </Button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as TicketStatus | "all")}>
            <SelectTrigger className="h-11 w-full rounded-2xl border-white/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(value) => onPriorityFilterChange(value as TicketPriority | "all")}>
            <SelectTrigger className="h-11 w-full rounded-2xl border-white/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white sm:w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="h-11 w-full rounded-2xl border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15 sm:w-auto"
              onClick={() => {
                onStatusFilterChange("all");
                onPriorityFilterChange("all");
                onSearchChange("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
