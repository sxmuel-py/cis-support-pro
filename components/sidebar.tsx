"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Trash2,
  Headset,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton } from "./logout-button";
import { NotificationBell } from "./notification-bell";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/lib/types";
import { Badge } from "./ui/badge";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Trash", href: "/trash", icon: Trash2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

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
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Headset className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold">CIS Support Pro</h1>
          <p className="text-xs text-muted-foreground">Command Center</p>
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
