"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Trash2,
  User as UserIcon,
  ShieldAlert,
  ChevronRight,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton } from "./logout-button";
import { NotificationBell } from "./notification-bell";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/lib/types";
import { Badge } from "./ui/badge";
import { Logo } from "./logo";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Admin", href: "/admin", icon: ShieldAlert, roles: ["hod", "supervisor"] },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Trash", href: "/trash", icon: Trash2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        
        if (userData) {
          setUser(userData);
        }
      }
    };

    fetchUser();
  }, [supabase]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "hod":
        return "Head of Dept";
      case "supervisor":
        return "Supervisor";
      case "technician":
        return "Technician";
      case "sims_manager":
        return "Sims Manager";
      default:
        return role;
    }
  };

  const mobileNavigation = [{ name: "Home", href: "/dashboard", icon: Home }, ...navigation.slice(1)].filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-white/60 bg-background/85 px-3 py-2.5 backdrop-blur lg:hidden dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <Logo size={30} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-none">IT Helpdesk</p>
              <p className="truncate pt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Support Command</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {user && <NotificationBell userId={user.id} compact />}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="surface-glass hidden h-screen w-72 flex-col border-r border-white/60 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:shadow-black/30 lg:flex">
        <div className="mesh-panel flex h-24 items-center gap-4 border-b border-white/60 px-6 dark:border-white/10">
          <Logo size={42} />
          <div className="flex flex-col">
            <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-xl font-black tracking-tight text-transparent uppercase">
              IT <span className="text-primary">Helpdesk</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 leading-none">
              Support Command
            </p>
          </div>
        </div>

        {user && (
          <div className="border-b border-white/60 px-4 py-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 shadow-sm dark:bg-primary/15">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{user.full_name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge 
                    variant={user.role === "supervisor" ? "default" : "secondary"}
                    className="rounded-full px-2 py-0 text-[10px]"
                  >
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-2 p-4">
          {navigation.map((item) => {
            if (item.roles && user && !item.roles.includes(user.role)) {
              return null;
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white text-foreground shadow-md shadow-slate-200/50 dark:bg-white/10 dark:text-white dark:shadow-black/20"
                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/15"
                    : "bg-muted/60 text-muted-foreground group-hover:text-foreground dark:bg-white/5 dark:group-hover:text-white"
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="flex-1">{item.name}</span>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isActive ? "translate-x-0 text-primary" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                )} />
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/60 p-4 space-y-3 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <LogoutButton />
            <div className="flex items-center gap-1">
              {user && <NotificationBell userId={user.id} />}
              <ThemeToggle />
            </div>
          </div>
          <div className="rounded-2xl bg-white/70 px-3 py-2 text-center text-xs text-muted-foreground dark:bg-white/5">
            IT Help Desk v1.0
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-background/92 px-2 py-2 backdrop-blur lg:hidden dark:border-white/10">
        <div className="flex items-stretch gap-1.5">
          {mobileNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-medium transition",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="mb-1 h-4 w-4 shrink-0" />
                <span className="w-full truncate text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
