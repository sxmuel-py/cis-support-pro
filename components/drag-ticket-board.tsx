"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Ticket, TicketStatus, TicketPriority, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { User as UserIcon, Calendar, Tag, Inbox } from "lucide-react";
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

export function DragTicketBoard({ tickets, staff, currentUser, onTicketClick }: DragTicketBoardProps) {
  const isSupervisorOrHod = currentUser?.role === "supervisor" || currentUser?.role === "hod";
  const { toast } = useToast();

  // Local state for optimistic updates during drag
  const [columns, setColumns] = useState<Record<string, Ticket[]>>({ unassigned: [] });

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
      const message = newAssigneeId ? `Assigned #${movedTicket.id.slice(0,8)}` : `Unassigned #${movedTicket.id.slice(0,8)}`;
      toast({ title: "Ticket Updated", description: message });
    } catch (err: any) {
      toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
      // Reload on failure to ensure UI is in sync
      refreshData();
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
        
        {/* Unassigned Column */}
        <div className="flex flex-col min-w-[320px] max-w-[320px] bg-muted/30 rounded-xl border snap-center">
          <div className="p-4 border-b bg-muted/50 rounded-t-xl flex justify-between items-center">
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
                  "flex-1 p-3 min-h-[500px] flex flex-col gap-3 transition-colors",
                  snapshot.isDraggingOver ? "bg-muted/50" : ""
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
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Staff Columns */}
        {staff.map((member) => (
          <div key={member.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-muted/30 rounded-xl border snap-center">
            <div className="p-4 border-b bg-muted/50 rounded-t-xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-3 h-3 text-primary" />
                </div>
                <h3 className="font-semibold text-sm truncate max-w-[150px]">{member.full_name}</h3>
              </div>
              <Badge variant="secondary">{columns[member.id]?.length || 0}</Badge>
            </div>
            
            <Droppable droppableId={member.id} isDropDisabled={!isSupervisorOrHod}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "flex-1 p-3 min-h-[500px] flex flex-col gap-3 transition-colors",
                    snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary/20 rounded-b-xl" : ""
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
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
        
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
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "bg-card p-4 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group",
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 opacity-90 rotate-2 scale-105" : ""
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-muted-foreground">#{ticket.id.slice(0,8)}</span>
            <Badge variant={priorityVariants[ticket.priority]} className="capitalize text-[10px] px-1 py-0 h-4">
              {ticket.priority}
            </Badge>
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
