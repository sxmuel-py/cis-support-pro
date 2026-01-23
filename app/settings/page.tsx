"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { getUserSettings } from "@/app/actions/update-user-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const data = await getUserSettings();
    setUserData(data);
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-8 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading settings...</p>
                </div>
              </CardContent>
            </Card>
          ) : !userData ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">Failed to load user data</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Profile Section */}
              <ProfileForm
                initialData={{
                  fullName: userData.full_name || "",
                  email: userData.email || "",
                  role: userData.role || "technician",
                }}
              />

              {/* Password Section */}
              <PasswordForm />

              {/* Notification Preferences */}
              <NotificationPreferences />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
