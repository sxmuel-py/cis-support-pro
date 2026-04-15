"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Clock, User, Tag, Calendar, CheckCircle2, XCircle, UserPlus, Trash2 } from "lucide-react";
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
import { deleteTicket } from "@/app/actions/delete-ticket";
import { TicketNotes } from "./ticket-notes";
import { TicketActivity } from "./ticket-activity";
import { TicketStatusDropdown } from "./ticket-status-dropdown";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { MergeTicketDialog } from "./merge-ticket-dialog";

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
  const supabase = useMemo(() => createClient(), []);

  const ticket = details?.ticket || initialTicket;
  // assignment_status may be missing in older DBs; default to 'unassigned'
  const assignmentStatus = ticket.assignment_status ?? "unassigned";
  const isAssignedToMe = currentUser && ticket.assigned_to === currentUser.id;
  const isSupervisor = currentUser?.role === "supervisor";
  const isHod = currentUser?.role === "hod";
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this ticket and all its associated data? This action cannot be undone.")) {
      return;
    }
    
    setProcessing(true);
    const result = await deleteTicket(ticket.id);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      setProcessing(false);
    } else {
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });
      // Close the detail view since the ticket is gone
      onClose();
    }
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
  const metaCards = [
    {
      label: "Reporter",
      value: ticket.sender_name || ticket.sender_email,
      icon: User,
    },
    {
      label: "Created",
      value: formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true }),
      icon: Calendar,
    },
    {
      label: "Category",
      value: ticket.category,
      icon: Tag,
    },
    {
      label: "Assigned",
      value: details?.assignedUser?.full_name || "Unassigned",
      icon: Clock,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl border-l border-white/50 bg-background/95 shadow-2xl shadow-slate-900/25">
        <div className="flex h-full flex-col">
          <div className="mesh-panel border-b border-white/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border-0 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-700 shadow-sm">
                    Ticket #{ticket.id.slice(0, 8)}
                  </Badge>
                  <Badge variant={statusVariants[ticket.status]} className="capitalize">
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  <Badge variant={priorityVariants[ticket.priority]} className="capitalize">
                    {ticket.priority}
                  </Badge>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{ticket.subject}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Keep context, coordinate owners, and move this ticket forward without losing the story.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/70" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metaCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-2xl border border-white/70 bg-white/75 p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                    <p className="truncate text-sm font-medium text-slate-800 capitalize">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-b border-white/60 bg-white/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {canAcceptReject && (
                <>
                  <Button onClick={handleAccept} disabled={processing} className="gap-2 rounded-xl">
                    <CheckCircle2 className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button onClick={handleReject} disabled={processing} variant="outline" className="gap-2 rounded-xl bg-white">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              
              {canSelfAssign && (
                <Button onClick={handleSelfAssign} disabled={processing} className="gap-2 rounded-xl">
                  <UserPlus className="h-4 w-4" />
                  Assign to Me
                </Button>
              )}

              {(isHod || isSupervisor) && ticket.status !== 'closed' && (
                <MergeTicketDialog 
                  sourceTicket={ticket} 
                  onMerged={onClose} 
                />
              )}

              {(isAssignedToMe || isSupervisor || isHod) && (assignmentStatus === "accepted" || assignmentStatus === "assigned" || isHod || isSupervisor) && (
                <TicketStatusDropdown
                  currentStatus={ticket.status}
                  onStatusChange={handleStatusChange}
                  disabled={processing}
                />
              )}
              
              {isHod && (
                <Button 
                  onClick={handleDelete} 
                  disabled={processing} 
                  variant="destructive" 
                  className="ml-auto gap-2 rounded-xl"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Ticket
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="rounded-2xl bg-muted/70 p-1">
                  <TabsTrigger value="details" className="rounded-xl">Details</TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-xl">Notes ({details?.notes.length || 0})</TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-xl">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6 space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                    <div className="rounded-3xl border bg-white/80 p-5 shadow-sm">
                      <div className="mb-4">
                        <h3 className="font-semibold">Conversation</h3>
                        <p className="text-sm text-muted-foreground">
                          Original request as received by the helpdesk.
                        </p>
                      </div>
                      <div className="rounded-2xl border bg-muted/40 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-6">{ticket.body}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-3xl border bg-white/80 p-5 shadow-sm">
                        <h3 className="font-semibold">Assignment State</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {details?.assignedUser
                            ? `Currently owned by ${details.assignedUser.full_name}.`
                            : "No technician owns this ticket yet."}
                        </p>
                        <div className="mt-4 rounded-2xl bg-muted/50 p-4 text-sm">
                          <p><span className="font-medium">Status:</span> {ticket.status.replace("_", " ")}</p>
                          <p className="mt-2"><span className="font-medium">Priority:</span> {ticket.priority}</p>
                          <p className="mt-2"><span className="font-medium">Assignment:</span> {assignmentStatus}</p>
                        </div>
                      </div>

                      <div className="rounded-3xl border bg-white/80 p-5 shadow-sm">
                        <h3 className="font-semibold">Reporter Contact</h3>
                        <p className="mt-1 break-all text-sm text-muted-foreground">{ticket.sender_email}</p>
                      </div>
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
