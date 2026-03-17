"use client";

import { useState } from "react";
import { User } from "@/lib/types";
import { sendWelcomeEmail } from "@/app/actions/send-welcome-email";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserManagementTableProps {
  initialUsers: User[];
  currentUser: User;
}

export function UserManagementTable({ initialUsers, currentUser }: UserManagementTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleSendWelcome = async (targetUser: User) => {
    setProcessingId(targetUser.id);

    try {
      const result = await sendWelcomeEmail(targetUser.id, targetUser.email);

      if (result.error) {
        toast({
          title: "Dispatch Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome Email Sent",
          description: `Password reset link dispatched to ${targetUser.email}`,
        });
        setSentIds((prev) => new Set(prev).add(targetUser.id));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const roleColors: Record<string, string> = {
    hod: "bg-purple-100 text-purple-800 border-purple-200",
    supervisor: "bg-blue-100 text-blue-800 border-blue-200",
    technician: "bg-green-100 text-green-800 border-green-200",
    sims_manager: "bg-orange-100 text-orange-800 border-orange-200",
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{user.full_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={roleColors[user.role] || ""}
                >
                  {user.role === "hod" ? "HOD" : user.role.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(user.created_at), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {user.last_sign_in
                  ? formatDistanceToNow(new Date(user.last_sign_in), {
                      addSuffix: true,
                    })
                  : "Never"}
              </TableCell>
              <TableCell className="text-right">
                {user.id !== currentUser.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSendWelcome(user)}
                    disabled={
                      processingId === user.id || sentIds.has(user.id)
                    }
                  >
                    {processingId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : sentIds.has(user.id) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {sentIds.has(user.id) ? "Sent" : "Send Welcome"}
                  </Button>
                )}
                {user.id === currentUser.id && (
                  <span className="text-xs text-muted-foreground italic flex justify-end items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    You
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                No staff members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
