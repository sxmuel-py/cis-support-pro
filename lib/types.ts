export type TicketStatus = "open" | "in_progress" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "hardware" | "software" | "network" | "access" | "email" | "sims" | "other";
export type UserRole = "supervisor" | "technician" | "sims_manager";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  created_at: string;
  updated_at?: string;
  subject: string;
  body: string;
  sender_email: string;
  sender_name?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;
}

export interface Note {
  id: string;
  ticket_id: string;
  content: string;
  author_id?: string;
  author_name: string;
  created_at: string;
}

export interface InboundEmail {
  from: string;
  subject: string;
  body: string;
  received_at: string;
}

export interface TriageResult {
  classification: "support" | "junk";
  confidence: number;
  reason?: string;
}

export interface ActivityLog {
  id: string;
  ticket_id: string;
  user_id?: string;
  action: "created" | "assigned" | "reassigned" | "status_changed" | "priority_changed" | "note_added";
  details: Record<string, any>;
  created_at: string;
}
