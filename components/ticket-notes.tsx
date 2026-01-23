"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/lib/types";
import { addNote } from "@/app/actions/add-note";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Note {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface TicketNotesProps {
  ticketId: string;
  notes: Note[];
  currentUser: User | null;
  onNoteAdded: () => void;
}

export function TicketNotes({ ticketId, notes, currentUser, onNoteAdded }: TicketNotesProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    setSubmitting(true);
    const result = await addNote(ticketId, content);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Note added",
      });
      setContent("");
      onNoteAdded();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add an internal note (visible only to IT staff)..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || !content.trim()} className="gap-2">
            <Send className="h-4 w-4" />
            Add Note
          </Button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No notes yet</p>
            <p className="text-xs mt-1">Add internal notes to track progress and communicate with your team</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {note.author.full_name?.charAt(0) || note.author.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{note.author.full_name || note.author.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
