"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { getUserSettings } from "@/app/actions/update-user-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-5xl space-y-6 px-4 pb-24 pt-4 sm:space-y-8 sm:p-6 md:p-8 md:pb-8">
          <div className="mesh-panel overflow-hidden rounded-[2rem] border border-white/60 p-5 shadow-2xl shadow-slate-200/70 dark:border-white/10 dark:shadow-black/30 sm:p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge className="w-fit rounded-full border-0 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Account Controls
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                    Keep your field setup clean and secure.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                    Update your profile, lock down your password, and tune how support updates reach you while you’re on the move.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/50 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">Profile</span>
                    <Settings2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Keep your contact identity accurate across the helpdesk.</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/50 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">Security</span>
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Change credentials and notification behavior without leaving the app.</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
              <CardContent className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading settings...</p>
                </div>
              </CardContent>
            </Card>
          ) : !userData ? (
            <Card className="surface-glass border-white/60 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:shadow-black/20">
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
