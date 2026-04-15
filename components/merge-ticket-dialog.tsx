"use client";

import { useState } from "react";
import { CopyPlus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { mergeTickets } from "@/app/actions/merge-tickets";
import { Ticket } from "@/lib/types";

interface MergeTicketDialogProps {
  sourceTicket: Ticket;
  onMerged: () => void;
}

export function MergeTicketDialog({ sourceTicket, onMerged }: MergeTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleMerge = async () => {
    if (!targetId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target ticket ID.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    const result = await mergeTickets(sourceTicket.id, targetId.trim());

    if (result.error) {
      toast({
        title: "Merge Failed",
        description: result.error,
        variant: "destructive",
      });
      setProcessing(false);
    } else {
      toast({
        title: "Success",
        description: `Ticket successfully merged into #${targetId.trim().slice(0, 8)}`,
      });
      setProcessing(false);
      setTargetId("");
      setOpen(false);
      onMerged();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setTargetId("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-primary hover:text-primary">
          <CopyPlus className="h-4 w-4" />
          Merge Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Merge Ticket</DialogTitle>
          <DialogDescription>
            This will copy all notes and the main message from this ticket 
            (#{sourceTicket.id.slice(0, 8)}) into the target ticket, and close this one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-3">
            <label htmlFor="target-id" className="text-sm font-medium">
              Target Ticket ID
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="target-id"
                placeholder="Paste the ticket ID or first 8 characters..."
                className="pl-9"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Short IDs shown in the dashboard also work here, as long as they are unique.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={processing || !targetId}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Merging...
              </>
            ) : (
              "Confirm Merge"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
