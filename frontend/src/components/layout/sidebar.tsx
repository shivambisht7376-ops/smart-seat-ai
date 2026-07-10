"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Building2,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  Settings,
  Shield,
  Users,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Armchair,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useHasRole } from "@/store/auth";

// ─── Navigation items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["super_admin", "hr_admin", "project_manager", "employee"],
  },
  {
    title: "Employees",
    href: "/employees",
    icon: Users,
    roles: ["super_admin", "hr_admin", "project_manager"],
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    roles: ["super_admin", "hr_admin", "project_manager"],
  },
  {
    title: "Seats",
    href: "/seats",
    icon: Armchair,
    roles: ["super_admin", "hr_admin", "project_manager"],
  },
  {
    title: "Allocations",
    href: "/allocations",
    icon: ClipboardList,
    roles: ["super_admin", "hr_admin", "project_manager"],
  },
  {
    title: "New Joiners",
    href: "/new-joiners",
    icon: UserPlus,
    roles: ["super_admin", "hr_admin"],
  },
  {
    title: "AI Assistant",
    href: "/ai",
    icon: Bot,
    roles: ["super_admin", "hr_admin", "project_manager"],
  },
  {
    title: "Audit Logs",
    href: "/audit",
    icon: FileText,
    roles: ["super_admin", "hr_admin"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin", "hr_admin"],
  },
];


type RoleKey = "super_admin" | "hr_admin" | "project_manager" | "employee";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isSuperAdmin = useHasRole("super_admin");
  const isHRAdmin = useHasRole("super_admin", "hr_admin");
  const isPM = useHasRole("super_admin", "hr_admin", "project_manager");

  const userRole: RoleKey = isSuperAdmin
    ? "super_admin"
    : isHRAdmin
    ? "hr_admin"
    : isPM
    ? "project_manager"
    : "employee";

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out",
        "bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">SmartSeat AI</p>
            <p className="text-[hsl(var(--sidebar-foreground))]/40 text-xs truncate">
              Enterprise Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.href.replace(/\//g, "").replace(/-/g, "")}`}
              className={cn(
                "sidebar-item",
                isActive && "active",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-[hsl(var(--sidebar-border))]">
        <button
          id="sidebar-collapse-toggle"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-lg",
            "text-[hsl(var(--sidebar-foreground))]/50 hover:text-[hsl(var(--sidebar-foreground))]",
            "hover:bg-[hsl(var(--sidebar-accent))] transition-colors text-xs"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
