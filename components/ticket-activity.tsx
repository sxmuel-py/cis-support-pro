"use client";

import { CheckCircle2, Clock, Edit, MessageSquare, UserMinus, UserPlus, XCircle } from "lucide-react";

import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  action: string;
  // `details` can be a JSON object (from JSONB) or a string
  details: any | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface TicketActivityProps {
  activities: Activity[];
}

export function TicketActivity({ activities }: TicketActivityProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Clock className="h-4 w-4" />;
      case "assigned":
        return <UserPlus className="h-4 w-4" />;
      case "unassigned":
        return <UserMinus className="h-4 w-4" />;
      case "status_changed":
        return <Edit className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle2 className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "note_added":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "created":
        return "text-blue-500";
      case "assigned":
        return "text-green-500";
      case "unassigned":
        return "text-orange-500";
      case "status_changed":
        return "text-purple-500";
      case "accepted":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      case "note_added":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };

  const formatAction = (action: string, details: any | null) => {
    switch (action) {
      case "created":
        return "Ticket created";
      case "assigned":
        // details may be JSON: { assigned_to, previous_assignee }
        if (!details) return "Ticket assigned";
        if (typeof details === "string") return details;
        const assignedTo = details.assigned_to ?? details.assigned_to_id ?? null;
        const prev = details.previous_assignee ?? details.previous_assignee_id ?? null;
        if (assignedTo && prev) {
          return `Assigned to ${assignedTo} (reassigned from ${prev})`;
        }
        if (assignedTo) return `Assigned to ${assignedTo}`;
        return "Ticket assigned";
      case "unassigned":
        return "Ticket unassigned";
      case "status_changed":
        // details may be JSON: { old_status, new_status }
        if (!details) return "Status changed";
        if (typeof details === "string") return details;
        const oldStatus = details.old_status ?? details.previous ?? null;
        const newStatus = details.new_status ?? details.current ?? null;
        if (oldStatus && newStatus) return `Status: ${oldStatus} → ${newStatus}`;
        return "Status changed";
      case "accepted":
        return "Assignment accepted";
      case "rejected":
        if (!details) return "Assignment rejected";
        if (typeof details === "string") return `Assignment rejected: ${details}`;
        // If details is object, try to extract a reason
        const reason = details.reason || details.rejection_reason || null;
        return reason ? `Assignment rejected: ${reason}` : "Assignment rejected";
      case "note_added":
        return "Note added";
      default:
        return action;
    }
  };

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

          {activities.map((activity, index) => (
            <div key={activity.id} className="relative flex gap-4">
              {/* Icon */}
              <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 ${getActivityColor(activity.action)}`}>
                {getActivityIcon(activity.action)}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1 pb-4">
                <p className="text-sm font-medium">
                  {formatAction(activity.action, activity.details)}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {activity.user && (
                    <>
                      <span>{activity.user.full_name || activity.user.email}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
