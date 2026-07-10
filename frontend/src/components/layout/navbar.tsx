"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useCurrentUser } from "@/store/auth";
import { avatarUrl, initials, ROLE_LABELS } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const user = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const roleName = user?.role?.name ?? "employee";
  const displayName = user?.employee?.full_name ?? user?.email ?? "User";

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6">
      {/* Left — breadcrumb placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">SmartSeat AI</span>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Dark/Light toggle */}
        <Button
          id="theme-toggle"
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="h-8 w-8"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          id="notifications-btn"
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </Button>

        {/* User info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border ml-1">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-md shadow-primary/20">
            {initials(displayName)}
          </div>

          {/* Name + role — hidden on small screens */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground leading-tight max-w-[140px] truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[roleName] ?? roleName}
            </p>
          </div>

          {/* Logout */}
          <Button
            id="logout-btn"
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
