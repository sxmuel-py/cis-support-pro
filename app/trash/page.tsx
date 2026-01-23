import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertTriangle } from "lucide-react";

export default function TrashPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
            <p className="text-muted-foreground mt-1">
              Filtered junk emails and deleted tickets
            </p>
          </div>

          {/* Placeholder Content */}
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
              <p className="text-muted-foreground text-center">
                No junk emails found
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Emails filtered by the triage system will appear here
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Trash</CardTitle>
              <CardDescription>
                How the email triage system works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  The <code className="bg-muted px-1 py-0.5 rounded">/api/inbound</code> endpoint 
                  automatically classifies incoming emails as either "Support Requests" or "Junk".
                </p>
                <p>
                  Only legitimate support requests are saved as tickets. Junk emails are stored 
                  here for review in case of false positives.
                </p>
                <p className="text-xs mt-4">
                  Future update: Ability to restore false positives and retrain the classifier.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
