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
import { ArrowUpRight, CircleAlert, Mail, User2 } from "lucide-react";

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
  const isSupervisor = currentUser?.role === "supervisor" || currentUser?.role === "hod";
  const priorityTone: Record<TicketPriority, string> = {
    low: "text-slate-500",
    medium: "text-sky-600",
    high: "text-amber-600",
    urgent: "text-rose-600",
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
      <Table>
        <TableHeader>
          <TableRow className="border-white/60 bg-muted/30 dark:border-white/10 dark:bg-white/5">
            <TableHead className="w-[110px]">ID</TableHead>
            <TableHead>Ticket</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="w-[130px]">Priority</TableHead>
            {isSupervisor && <TableHead className="w-[220px]">Assigned To</TableHead>}
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
              const reporter = ticket.sender_name || ticket.sender_email;
              
              return (
                <TableRow
                  key={ticket.id}
                  className={cn(
                    "cursor-pointer border-white/50 transition-colors dark:border-white/10",
                    onTicketClick && "hover:bg-primary/5 dark:hover:bg-white/5"
                  )}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button,input,[role='dialog']")) {
                      return;
                    }
                    onTicketClick?.(ticket);
                  }}
                >
                  <TableCell className="align-top">
                    <div className="inline-flex rounded-full bg-muted px-3 py-1 font-mono text-xs dark:bg-white/10">
                      #{ticket.id.slice(0, 8)}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="max-w-[34rem] text-sm font-semibold leading-5 dark:text-white">{ticket.subject}</p>
                        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 capitalize">
                          <CircleAlert className="h-3.5 w-3.5" />
                          {ticket.category}
                        </span>
                        <span className={cn("inline-flex items-center gap-1 font-medium uppercase", priorityTone[ticket.priority])}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-1 text-sm">
                      <p className="inline-flex items-center gap-2 font-medium">
                        <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{reporter}</span>
                      </p>
                      <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{ticket.sender_email}</span>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={statusVariants[ticket.status]} className="capitalize">
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={priorityVariants[ticket.priority]} className="capitalize">
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  {isSupervisor && (
                    <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2">
                        <AssignTicketDropdown
                          ticketId={ticket.id}
                          currentAssignee={ticket.assigned_to ?? null}
                          staff={staff}
                        />
                        <p className="text-xs text-muted-foreground">
                          {assignedStaff ? `Owned by ${assignedStaff.full_name}` : "Waiting for assignment"}
                        </p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="align-top text-right text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p>{formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                      })}</p>
                      <p className="text-xs">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
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
