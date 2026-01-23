"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function NotificationPreferences() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email alerts for new ticket assignments
            </p>
          </div>
          <Switch id="email-notifications" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="browser-notifications">Browser Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show desktop notifications for real-time updates
            </p>
          </div>
          <Switch id="browser-notifications" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="ticket-updates">Ticket Updates</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when tickets you're watching are updated
            </p>
          </div>
          <Switch id="ticket-updates" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="daily-summary">Daily Summary</Label>
            <p className="text-sm text-muted-foreground">
              Receive a daily summary of your open tickets
            </p>
          </div>
          <Switch id="daily-summary" />
        </div>
      </CardContent>
    </Card>
  );
}
