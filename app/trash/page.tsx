"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertTriangle, Loader2, Mail, Calendar, Info } from "lucide-react";
import { getTrash } from "@/app/actions/get-trash";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const data = await getTrash();
      setTrashItems(data);
    } catch (error) {
      console.error("Error loading trash:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
              <p className="text-muted-foreground mt-1">
                Filtered junk emails and rejected requests
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {trashItems.length} filtered items
            </Badge>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading trash...</p>
                </div>
              </CardContent>
            </Card>
          ) : trashItems.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Filtered Messages
                </CardTitle>
                <CardDescription>
                  Emails classified as junk by the triage system
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[300px] flex flex-col items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center font-medium">
                  No junk emails found
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2 max-w-md">
                  Emails filtered by the automated triage system will appear here for review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {trashItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-base line-clamp-1">
                          {item.email_subject || item.subject || "(No Subject)"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {item.email_from || item.from_email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDistanceToNow(new Date(item.created_at || item.received_at), { addSuffix: true })}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-200">
                        Junk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="text-sm text-muted-foreground line-clamp-3 bg-accent/50 p-3 rounded-md border italic">
                      {item.body || "(No body content)"}
                    </div>
                    
                    {(item.triage_reasoning || item.classification_reason) && (
                      <div className="flex items-start gap-2 text-xs bg-blue-500/5 text-blue-600 p-2.5 rounded-md border border-blue-100">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold uppercase tracking-wider mb-0.5">Triage Reasoning</p>
                          <p>{item.triage_reasoning || item.classification_reason}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="border-dashed bg-accent/5">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">About Trash Filtering</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Our AI triage system automatically scans all incoming emails. Only legitimate IT support requests are converted into tickets. Newsletters, automated alerts, and unrelated inquiries are moved here to keep your dashboard clean.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
