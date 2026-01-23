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
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets by ID, subject, or sender..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Tabs and Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tab Filters */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange("all")}
          >
            All Tickets
          </Button>
          <Button
            variant={filter === "mine" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange("mine")}
          >
            My Tickets
          </Button>
          {isSupervisor && (
            <Button
              variant={filter === "unassigned" ? "default" : "ghost"}
              size="sm"
              onClick={() => onFilterChange("unassigned")}
            >
              Unassigned
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as TicketStatus | "all")}>
          <SelectTrigger className="w-[140px]">
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

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={(value) => onPriorityFilterChange(value as TicketPriority | "all")}>
          <SelectTrigger className="w-[140px]">
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

        {/* Clear Filters */}
        {(statusFilter !== "all" || priorityFilter !== "all" || searchQuery) && (
          <Button
            variant="outline"
            size="sm"
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
  );
}
