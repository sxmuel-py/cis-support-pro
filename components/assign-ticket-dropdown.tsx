"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User } from "@/lib/types";
import { assignTicket } from "@/app/actions/assign-ticket";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
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
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search staff..." />
          <CommandList>
            <CommandEmpty>No staff found.</CommandEmpty>
            <CommandGroup>
              {/* Unassign option */}
              <CommandItem
                value="unassigned"
                onSelect={() => {
                  console.log("Unassign selected via CMDK");
                  handleAssign(null);
                }}
                className="cursor-pointer"
                onPointerDown={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !currentAssignee ? "opacity-100" : "opacity-0"
                  )}
                />
                <UserX className="mr-2 h-4 w-4" />
                Unassigned
              </CommandItem>

              {/* Staff list */}
              {staff.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.full_name}
                  onSelect={() => {
                    console.log(`Staff selected via CMDK: ${member.full_name}`);
                    handleAssign(member.id);
                  }}
                  className="cursor-pointer"
                  onPointerDown={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentAssignee === member.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{member.full_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">
                      {member.role === "hod" ? "Head of Dept" : member.role === "supervisor" ? "Supervisor" : member.role === "sims_manager" ? "SIMS Manager" : "Technician"}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
