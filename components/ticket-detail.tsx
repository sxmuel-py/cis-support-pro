"use client";

import { useEffect, useState } from "react";
import { X, Clock, User, Tag, Calendar, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ticket, User as UserType, TicketStatus } from "@/lib/types";
import { getTicketDetails, type TicketDetails } from "@/app/actions/get-ticket-details";
import { acceptTicket } from "@/app/actions/accept-ticket";
import { rejectTicket } from "@/app/actions/reject-ticket";
import { selfAssignTicket } from "@/app/actions/self-assign-ticket";
import { updateTicketStatus } from "@/app/actions/update-ticket-status";
import { TicketNotes } from "./ticket-notes";
import { TicketActivity } from "./ticket-activity";
import { TicketStatusDropdown } from "./ticket-status-dropdown";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface TicketDetailProps {
  ticket: Ticket;
  currentUser: UserType | null;
  onClose: () => void;
}

export function TicketDetail({ ticket: initialTicket, currentUser, onClose }: TicketDetailProps) {
  const [details, setDetails] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const ticket = details?.ticket || initialTicket;
  // assignment_status may be missing in older DBs; default to 'unassigned'
  const assignmentStatus = ticket.assignment_status ?? "unassigned";
  const isAssignedToMe = currentUser && ticket.assigned_to === currentUser.id;
  const isSupervisor = currentUser?.role === "supervisor";
  const canAcceptReject = isAssignedToMe && assignmentStatus === "assigned";
  
  // More robust check for self-assignment
  const canSelfAssign = 
    currentUser?.role === "technician" && 
    !ticket.assigned_to && 
    (assignmentStatus === "unassigned" || !assignmentStatus);

  // Debug logging
  console.log("Self-assign check:", {
    userRole: currentUser?.role,
    assignedTo: ticket.assigned_to,
    assignmentStatus,
    canSelfAssign
  });

  useEffect(() => {
    loadDetails();

    // Set up real-time subscription
    const channel = supabase
      .channel(`ticket-detail-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticket.id}`,
        },
        () => {
          loadDetails();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notes",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        () => {
          loadDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id, supabase]);

  const loadDetails = async () => {
    const data = await getTicketDetails(ticket.id);
    setDetails(data);
    setLoading(false);
  };

  const handleAccept = async () => {
    setProcessing(true);
    const result = await acceptTicket(ticket.id);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticket accepted and moved to In Progress",
      });
      await loadDetails();
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    const reason = prompt("Optional: Why are you rejecting this ticket?");
    
    setProcessing(true);
    const result = await rejectTicket(ticket.id, reason || undefined);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticket rejected and unassigned",
      });
      await loadDetails();
    }
    setProcessing(false);
  };

  const handleSelfAssign = async () => {
    console.log("Self-assign clicked for ticket:", ticket.id);
    setProcessing(true);
    
    try {
      const result = await selfAssignTicket(ticket.id);
      console.log("Self-assign result:", result);
      
      if (result.error) {
        console.error("Self-assign error:", result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Ticket assigned to you and moved to In Progress",
        });
        await loadDetails();
      }
    } catch (error) {
      console.error("Self-assign exception:", error);
      toast({
        title: "Error",
        description: "Failed to assign ticket. Please try again.",
        variant: "destructive",
      });
    }
    
    setProcessing(false);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setProcessing(true);
    const result = await updateTicketStatus(ticket.id, newStatus);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
      });
      await loadDetails();
    }
    setProcessing(false);
  };

  const statusVariants: Record<string, "default" | "warning" | "success" | "secondary" | "info"> = {
    open: "default",
    in_progress: "info",
    pending: "warning",
    resolved: "success",
    closed: "secondary",
  };

  const priorityVariants: Record<string, "default" | "info" | "warning" | "destructive" | "secondary"> = {
    low: "secondary",
    medium: "info",
    high: "warning",
    urgent: "destructive",
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl border-l bg-background shadow-lg">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">Ticket #{ticket.id.slice(0, 8)}</h2>
                <Badge variant={statusVariants[ticket.status]} className="capitalize">
                  {ticket.status.replace("_", " ")}
                </Badge>
                <Badge variant={priorityVariants[ticket.priority]} className="capitalize">
                  {ticket.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{ticket.subject}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              {canAcceptReject && (
                <>
                  <Button onClick={handleAccept} disabled={processing} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button onClick={handleReject} disabled={processing} variant="outline" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              
              {canSelfAssign && (
                <Button onClick={handleSelfAssign} disabled={processing} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Assign to Me
                </Button>
              )}

              {(isAssignedToMe || isSupervisor) && (assignmentStatus === "accepted" || assignmentStatus === "assigned") && (
                <TicketStatusDropdown
                  currentStatus={ticket.status}
                  onStatusChange={handleStatusChange}
                  disabled={processing}
                />
              )}
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="notes">Notes ({details?.notes.length || 0})</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 mt-6">
                  {/* Ticket Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">From:</span>
                      <span>{ticket.sender_name || ticket.sender_email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Created:</span>
                      <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Category:</span>
                      <span className="capitalize">{ticket.category}</span>
                    </div>

                    {details?.assignedUser && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Assigned to:</span>
                        <span>{details.assignedUser.full_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Email Body */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Message</h3>
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="whitespace-pre-wrap text-sm">{ticket.body}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-6">
                  <TicketNotes
                    ticketId={ticket.id}
                    notes={details?.notes || []}
                    currentUser={currentUser}
                    onNoteAdded={loadDetails}
                  />
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <TicketActivity activities={details?.activities || []} />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
