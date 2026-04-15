"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Ticket, TicketStatus, TicketPriority, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { User as UserIcon, Calendar, Inbox, GripVertical, Sparkles, ArrowRightLeft, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { assignTicket } from "@/app/actions/assign-ticket";
import { useToast } from "@/hooks/use-toast";

interface DragTicketBoardProps {
  tickets: Ticket[];
  staff: User[];
  currentUser: User | null;
  onTicketClick?: (ticket: Ticket) => void;
  refreshData: () => void;
}

const priorityVariants: Record<TicketPriority, "default" | "info" | "warning" | "destructive" | "secondary"> = {
  low: "secondary",
  medium: "info",
  high: "warning",
  urgent: "destructive",
};

export function DragTicketBoard({ tickets, staff, currentUser, onTicketClick, refreshData }: DragTicketBoardProps) {
  const isSupervisorOrHod = currentUser?.role === "supervisor" || currentUser?.role === "hod";
  const { toast } = useToast();

  // Local state for optimistic updates during drag
  const [columns, setColumns] = useState<Record<string, Ticket[]>>({ unassigned: [] });
  const [lastMove, setLastMove] = useState<string | null>(null);

  // Sync props to local state when they change
  useEffect(() => {
    // We group by user ID. Unassigned tickets go to "unassigned" column
    const initialColumns: Record<string, Ticket[]> = {
      unassigned: tickets.filter(t => !t.assigned_to)
    };

    staff.forEach(member => {
      initialColumns[member.id] = tickets.filter(t => t.assigned_to === member.id);
    });

    setColumns(initialColumns);
  }, [tickets, staff]);

  const boardStats = useMemo(() => {
    const urgent = tickets.filter((ticket) => ticket.priority === "urgent").length;
    const unassigned = tickets.filter((ticket) => !ticket.assigned_to).length;
    const inProgress = tickets.filter((ticket) => ticket.status === "in_progress").length;

    return { urgent, unassigned, inProgress };
  }, [tickets]);

  // If not a supervisor/HOD, just render a regular grouped view (or you could fallback to table)
  // For this exercise, we'll keep the board but disable dragging for techs.
  
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list or didn't move
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // Only supervisors/HODs can reassign via DND
    if (!isSupervisorOrHod) {
      toast({ title: "Unauthorized", description: "You don't have permission to reassign tickets.", variant: "destructive" });
      return;
    }

    const sourceColumn = [...columns[source.droppableId]];
    const destColumn = [...columns[destination.droppableId]];
    const [movedTicket] = sourceColumn.splice(source.index, 1);

    // Optimistic UI update
    destColumn.splice(destination.index, 0, movedTicket);
    setColumns({
      ...columns,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    });

    // The destination droppableId is either 'unassigned' or a staff UserID
    const newAssigneeId = destination.droppableId === "unassigned" ? null : destination.droppableId;
    
    // Database update
    try {
      const res = await assignTicket(movedTicket.id, newAssigneeId);
      if (res?.error) {
        throw new Error(res.error);
      }
      const assigneeName =
        newAssigneeId === null
          ? "Unassigned queue"
          : staff.find((member) => member.id === newAssigneeId)?.full_name ?? "selected technician";
      const message = `#${movedTicket.id.slice(0, 8)} moved to ${assigneeName}`;
      setLastMove(message);
      toast({ title: "Ticket Updated", description: message });
      refreshData();
    } catch (err: any) {
      toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
      // Reload on failure to ensure UI is in sync
      refreshData();
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="surface-glass flex flex-col gap-4 rounded-[2rem] border border-white/60 p-5 shadow-xl shadow-slate-200/60 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5" />
              Assignment Board
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              Dispatch work where it will move fastest.
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Drag tickets between technicians to rebalance load, or keep an eye on the unassigned lane when new requests land.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <BoardMiniStat label="Urgent" value={boardStats.urgent} icon={ShieldAlert} tone="rose" />
            <BoardMiniStat label="In Progress" value={boardStats.inProgress} icon={ArrowRightLeft} tone="sky" />
            <BoardMiniStat label="Unassigned" value={boardStats.unassigned} icon={Inbox} tone="amber" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <div className="rounded-full border border-white/60 bg-white/75 px-3 py-1.5 shadow-sm">
            {isSupervisorOrHod ? "Drag and drop is live for dispatchers." : "Board is read-only for your role."}
          </div>
          {lastMove ? (
            <div className="rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1.5 text-emerald-700 shadow-sm">
              Last move: {lastMove}
            </div>
          ) : null}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
        
        {/* Unassigned Column */}
        <div className="flex flex-col min-w-[320px] max-w-[320px] rounded-[1.75rem] border border-white/60 bg-white/70 shadow-lg shadow-slate-200/50 snap-center">
          <div className="flex items-center justify-between rounded-t-[1.75rem] border-b border-white/60 bg-gradient-to-r from-slate-100/90 to-white/70 p-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Unassigned
            </h3>
            <Badge variant="secondary">{columns.unassigned?.length || 0}</Badge>
          </div>
          
          <Droppable droppableId="unassigned" isDropDisabled={!isSupervisorOrHod}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  "flex min-h-[500px] flex-1 flex-col gap-3 p-3 transition-colors",
                  snapshot.isDraggingOver ? "rounded-b-[1.75rem] bg-slate-100/80" : ""
                )}
              >
                {columns.unassigned?.map((ticket, index) => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    index={index} 
                    onClick={() => onTicketClick?.(ticket)} 
                    isDragDisabled={!isSupervisorOrHod} 
                  />
                ))}
                {columns.unassigned?.length === 0 ? (
                  <EmptyLane
                    icon={Inbox}
                    title="Nothing waiting here"
                    description="Fresh tickets without an owner will stack here first."
                  />
                ) : null}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Staff Columns */}
        {staff.map((member) => (
          <div key={member.id} className="flex flex-col min-w-[320px] max-w-[320px] rounded-[1.75rem] border border-white/60 bg-white/70 shadow-lg shadow-slate-200/50 snap-center">
            <div className="flex items-center justify-between rounded-t-[1.75rem] border-b border-white/60 bg-gradient-to-r from-white/80 to-slate-100/90 p-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="max-w-[170px] truncate text-sm font-semibold">{member.full_name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{member.role.replace("_", " ")}</p>
                </div>
              </div>
              <Badge variant="secondary">{columns[member.id]?.length || 0}</Badge>
            </div>
            
            <Droppable droppableId={member.id} isDropDisabled={!isSupervisorOrHod}>
              {(provided, snapshot) => (
                <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                    "flex min-h-[500px] flex-1 flex-col gap-3 p-3 transition-colors",
                    snapshot.isDraggingOver ? "rounded-b-[1.75rem] border-2 border-dashed border-primary/20 bg-primary/5" : ""
                  )}
                >
                  {columns[member.id]?.map((ticket, index) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket} 
                      index={index} 
                      onClick={() => onTicketClick?.(ticket)} 
                      isDragDisabled={!isSupervisorOrHod} 
                    />
                  ))}
                  {columns[member.id]?.length === 0 ? (
                    <EmptyLane
                      icon={UserIcon}
                      title="Ready for more"
                      description="This technician has room to absorb new work."
                    />
                  ) : null}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
        </div>
      </div>
    </DragDropContext>
  );
}

// Subcomponent for individual tickets
function TicketCard({ ticket, index, onClick, isDragDisabled }: { ticket: Ticket, index: number, onClick: () => void, isDragDisabled: boolean }) {
  return (
    <Draggable draggableId={ticket.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={onClick}
          className={cn(
            "group rounded-[1.35rem] border border-white/70 bg-white/95 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
            !isDragDisabled ? "cursor-pointer" : "",
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 opacity-90 rotate-2 scale-105" : ""
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className="text-xs font-mono text-muted-foreground">#{ticket.id.slice(0,8)}</span>
            <div className="flex items-center gap-2">
              {!isDragDisabled ? (
                <button
                  type="button"
                  aria-label={`Drag ticket ${ticket.id.slice(0, 8)}`}
                  {...provided.dragHandleProps}
                  className="rounded-full border border-slate-200 bg-slate-50 p-1 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                  onClick={(event) => event.stopPropagation()}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <Badge variant={priorityVariants[ticket.priority]} className="h-5 px-1.5 py-0 text-[10px] capitalize">
              {ticket.priority}
              </Badge>
            </div>
          </div>
          
          <h4 className="font-medium text-sm mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {ticket.subject}
          </h4>
          
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-4">
            <div className="flex items-center gap-1.5 truncate">
              <UserIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">{ticket.sender_name || ticket.sender_email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function BoardMiniStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Inbox;
  tone: "rose" | "sky" | "amber";
}) {
  const toneClasses = {
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
        <div className={cn("rounded-2xl p-2", toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function EmptyLane({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-32 flex-1 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
      <div className="mb-3 rounded-2xl bg-white p-2 text-slate-400 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
