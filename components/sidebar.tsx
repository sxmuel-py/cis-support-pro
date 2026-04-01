"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Trash2,
  Headset,
  User as UserIcon,
  ShieldAlert
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
      // Use getSession to avoid unnecessary network request on every mount
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;
      
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

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo/Header */}
      <div className="flex h-20 items-center gap-4 border-b px-6 bg-accent/5">
        <Logo size={42} />
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent uppercase">
            IT <span className="text-primary">Helpdesk</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 leading-none">
            Support Portal
          </p>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge 
                  variant={user.role === "supervisor" ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          // Check role restrictions if the item has a roles array
          if (item.roles && user && !item.roles.includes(user.role)) {
            return null;
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer with Notifications, Logout, and Theme Toggle */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <LogoutButton />
          <div className="flex items-center gap-1">
            {user && <NotificationBell userId={user.id} />}
            <ThemeToggle />
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          IT Help Desk v1.0
        </div>
      </div>
    </div>
  );
}
