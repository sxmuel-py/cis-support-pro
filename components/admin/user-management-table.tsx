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
    hod: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-200 dark:border-purple-400/20",
    supervisor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-400/20",
    technician: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-200 dark:border-green-400/20",
    sims_manager: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-400/20",
  };

  return (
    <div className="surface-glass overflow-hidden rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
      <div className="flex flex-col gap-3 border-b border-white/60 px-6 py-5 dark:border-white/10 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight dark:text-white">Staff roster</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dispatch secure setup links, track recent access, and keep the support bench organized.
          </p>
        </div>
        <div className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
          {users.length} staff accounts
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-white/60 bg-muted/30 dark:border-white/10 dark:bg-white/5">
            <TableHead>Staff Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-white/50 dark:border-white/10">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium dark:text-white">{user.full_name}</span>
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
                    className="gap-2 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
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
