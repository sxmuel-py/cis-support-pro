"use client";

import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TicketStatus } from "@/lib/types";

interface TicketStatusDropdownProps {
  currentStatus: TicketStatus;
  onStatusChange: (status: TicketStatus) => void;
  disabled?: boolean;
}

const statuses: { value: TicketStatus; label: string; variant: "default" | "warning" | "success" | "secondary" | "info" }[] = [
  { value: "open", label: "Open", variant: "default" },
  { value: "in_progress", label: "In Progress", variant: "info" },
  { value: "pending", label: "Pending", variant: "warning" },
  { value: "resolved", label: "Resolved", variant: "success" },
  { value: "closed", label: "Closed", variant: "secondary" },
];

export function TicketStatusDropdown({ currentStatus, onStatusChange, disabled }: TicketStatusDropdownProps) {
  const currentStatusObj = statuses.find((s) => s.value === currentStatus);

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (newStatus === "closed" || newStatus === "resolved") {
      const confirmed = confirm(
        `Are you sure you want to mark this ticket as ${newStatus}?`
      );
      if (!confirmed) return;
    }
    onStatusChange(newStatus);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <Badge variant={currentStatusObj?.variant} className="capitalize">
            {currentStatusObj?.label}
          </Badge>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {statuses.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className="gap-2"
          >
            {currentStatus === status.value && <Check className="h-4 w-4" />}
            <Badge variant={status.variant} className="capitalize">
              {status.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
