"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, Search, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User } from "@/lib/types";
import { assignTicket } from "@/app/actions/assign-ticket";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssignTicketDropdownProps {
  ticketId: string;
  currentAssignee: string | null;
  staff: User[];
}

export function AssignTicketDropdown({
  ticketId,
  currentAssignee,
  staff,
}: AssignTicketDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAssign = (technicianId: string | null) => {
    startTransition(async () => {
      const result = await assignTicket(ticketId, technicianId);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: technicianId
            ? "Ticket assigned successfully"
            : "Ticket unassigned",
        });
        setOpen(false);
      }
    });
  };

  const selectedStaff = staff.find((s) => s.id === currentAssignee);
  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return staff;

    return staff.filter((member) =>
      member.full_name.toLowerCase().includes(normalizedQuery) ||
      member.email.toLowerCase().includes(normalizedQuery) ||
      member.role.toLowerCase().includes(normalizedQuery)
    );
  }, [query, staff]);

  const closeAndReset = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between sm:w-[200px]"
          disabled={isPending}
        >
          {selectedStaff ? (
            <span className="truncate">{selectedStaff.full_name}</span>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,260px)] p-2" align="start">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search staff..."
              className="pl-8"
            />
          </div>

          <ScrollArea className="max-h-72">
            <div className="space-y-1">
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-2 text-left"
                disabled={isPending}
                onClick={() => {
                  handleAssign(null);
                  closeAndReset();
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    !currentAssignee ? "opacity-100" : "opacity-0"
                  )}
                />
                <UserX className="mr-2 h-4 w-4 shrink-0" />
                <span>Unassigned</span>
              </Button>

              {filteredStaff.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No staff found.
                </div>
              ) : (
                filteredStaff.map((member) => (
                  <Button
                    key={member.id}
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start px-2 py-2 text-left"
                    disabled={isPending}
                    onClick={() => {
                      handleAssign(member.id);
                      closeAndReset();
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        currentAssignee === member.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="truncate">{member.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.role === "hod" ? "Head of Dept" : member.role === "supervisor" ? "Supervisor" : member.role === "sims_manager" ? "SIMS Manager" : "Technician"}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
