"use client";

import { Ticket, TicketStatus, TicketPriority, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { AssignTicketDropdown } from "./assign-ticket-dropdown";

interface TicketListProps {
  tickets: Ticket[];
  staff: User[];
  currentUser: User | null;
  onTicketClick?: (ticket: Ticket) => void;
}

const statusVariants: Record<TicketStatus, "default" | "warning" | "success" | "secondary" | "info"> = {
  open: "default",
  in_progress: "info",
  pending: "warning",
  resolved: "success",
  closed: "secondary",
};

const priorityVariants: Record<TicketPriority, "default" | "info" | "warning" | "destructive" | "secondary"> = {
  low: "secondary",
  medium: "info",
  high: "warning",
  urgent: "destructive",
};

export function TicketList({ tickets, staff, currentUser, onTicketClick }: TicketListProps) {
  const isSupervisor = currentUser?.role === "supervisor";

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>From</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[120px]">Priority</TableHead>
            {isSupervisor && <TableHead className="w-[200px]">Assigned To</TableHead>}
            <TableHead className="w-[150px] text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isSupervisor ? 7 : 6} className="h-24 text-center">
                No tickets found.
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => {
              const assignedStaff = staff.find((s) => s.id === ticket.assigned_to);
              
              return (
                <TableRow
                  key={ticket.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    onTicketClick && "hover:bg-muted/50"
                  )}
                  onClick={(e) => {
                    // Don't trigger row click if clicking on assignment dropdown
                    if ((e.target as HTMLElement).closest('[role="combobox"]')) {
                      return;
                    }
                    onTicketClick?.(ticket);
                  }}
                >
                  <TableCell className="font-mono text-xs">
                    #{ticket.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ticket.sender_name || ticket.sender_email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[ticket.status]} className="capitalize">
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityVariants[ticket.priority]} className="capitalize">
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  {isSupervisor && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <AssignTicketDropdown
                        ticketId={ticket.id}
                        currentAssignee={ticket.assigned_to ?? null}
                        staff={staff}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
