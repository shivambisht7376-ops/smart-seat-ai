"use client";

import { useState } from "react";
import {
  Bell, Database, Globe, Key, Lock, Moon, Palette, Save, Settings, Shield, Sun, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCurrentUser, useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "profile" | "appearance" | "notifications" | "security" | "system";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "Profile",       icon: User    },
  { id: "appearance",   label: "Appearance",    icon: Palette  },
  { id: "notifications",label: "Notifications", icon: Bell     },
  { id: "security",     label: "Security",      icon: Lock     },
  { id: "system",       label: "System",        icon: Settings },
];

const inputCls = cn(
  "flex h-10 w-full rounded-lg border border-[var(--color-border)]",
  "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
  "placeholder:text-[var(--color-muted-foreground)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6 space-y-5">
      <div>
        <h3 className="font-semibold text-[var(--color-foreground)]">{title}</h3>
        {description && <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4 border-t border-[var(--color-border)] pt-4">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
        checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]")}>
      <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

export default function SettingsPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifs, setNotifs] = useState({
    email_allocations: true,
    email_new_joiners: true,
    email_project_updates: false,
    browser_push: false,
  });

  const handleSave = () => toast.success("Settings saved");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, preferences, and system configuration</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar tabs */}
        <nav className="lg:w-48 shrink-0">
          <div className="glass-card p-2 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} id={`settings-tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  activeTab === id
                    ? "bg-[var(--color-primary)] text-white font-medium shadow-sm"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-5">

          {/* PROFILE */}
          {activeTab === "profile" && (
            <>
              <SectionCard title="Personal Information" description="Update your display name and contact info.">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {(user?.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">{user?.email}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)] capitalize">
                      {String(user?.role ?? "").replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-first-name">First Name</Label>
                    <input id="settings-first-name" className={inputCls}
                      defaultValue={user?.employee?.first_name ?? ""} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-last-name">Last Name</Label>
                    <input id="settings-last-name" className={inputCls}
                      defaultValue={user?.employee?.last_name ?? ""} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-email">Email</Label>
                  <input id="settings-email" type="email" className={inputCls}
                    defaultValue={user?.email ?? ""} disabled />
                </div>
              </SectionCard>

              <div className="flex justify-end">
                <Button id="save-profile" variant="brand" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </>
          )}

          {/* APPEARANCE */}
          {activeTab === "appearance" && (
            <SectionCard title="Theme" description="Choose your preferred color scheme.">
              <div className="grid grid-cols-2 gap-4">
                {(["dark", "light"] as const).map((t) => (
                  <button key={t} id={`theme-${t}`} onClick={() => setTheme(t)}
                    className={cn("flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all",
                      theme === t
                        ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-muted-foreground)]"
                    )}>
                    {t === "dark"
                      ? <Moon className="w-8 h-8 text-[var(--color-primary)]" />
                      : <Sun className="w-8 h-8 text-[var(--color-warning)]" />}
                    <div className="text-center">
                      <p className="font-semibold capitalize text-[var(--color-foreground)]">{t} Mode</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                        {t === "dark" ? "Easy on the eyes at night" : "Bright and crisp"}
                      </p>
                    </div>
                    {theme === t && (
                      <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">Active</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Theme changes apply immediately across the platform.
              </p>
            </SectionCard>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <SectionCard title="Notification Preferences" description="Control which events trigger notifications.">
              {[
                { key: "email_allocations" as const,     label: "Seat allocation updates",  desc: "Notify when a seat is assigned or released" },
                { key: "email_new_joiners" as const,      label: "New joiner requests",       desc: "Alert when a new joiner needs a seat" },
                { key: "email_project_updates" as const,  label: "Project updates",           desc: "Notify on project member changes" },
                { key: "browser_push" as const,           label: "Browser notifications",     desc: "Enable desktop push notifications" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{desc}</p>
                  </div>
                  <Toggle id={`notif-${key}`} checked={notifs[key]}
                    onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button id="save-notifs" variant="brand" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" /> Save Preferences
                </Button>
              </div>
            </SectionCard>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <>
              <SectionCard title="Change Password" description="Update your account password.">
                {[
                  { id: "current-password",  label: "Current Password" },
                  { id: "new-password",      label: "New Password" },
                  { id: "confirm-password",  label: "Confirm New Password" },
                ].map(({ id, label }) => (
                  <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{label}</Label>
                    <input id={id} type="password" className={inputCls} placeholder="••••••••" />
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button id="change-password-btn" variant="brand" onClick={handleSave}>
                    <Key className="w-4 h-4 mr-2" /> Update Password
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Active Sessions" description="Manage devices where you're logged in.">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[var(--color-muted-foreground)]" />
                    <div>
                      <p className="text-sm font-medium">Current Session</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">Web Browser · Active now</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] font-semibold">
                    Current
                  </span>
                </div>
                <div className="flex justify-end">
                  <Button id="revoke-all-sessions" variant="outline" size="sm"
                    className="text-[var(--color-destructive)] border-[var(--color-destructive)] hover:bg-[color-mix(in_srgb,var(--color-destructive)_10%,transparent)]"
                    onClick={() => toast.success("All other sessions revoked")}>
                    <Shield className="w-4 h-4 mr-2" /> Revoke All Other Sessions
                  </Button>
                </div>
              </SectionCard>
            </>
          )}

          {/* SYSTEM (Admin only) */}
          {activeTab === "system" && (
            <>
              <SectionCard title="System Configuration" description="Platform-wide settings (HR Admin only).">
                {[
                  { id: "org-name", label: "Organisation Name", value: "SmartSeat AI Corp" },
                  { id: "max-seats", label: "Max Seats per Employee", value: "1" },
                  { id: "seat-release-days", label: "Auto-release after (days)", value: "90" },
                ].map(({ id, label, value }) => (
                  <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{label}</Label>
                    <input id={id} className={inputCls} defaultValue={value} />
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button id="save-system" variant="brand" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" /> Save System Settings
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Database" description="Connection and health information.">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium">Neon PostgreSQL</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Connection pooling enabled · SSL enforced</p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] font-semibold">
                    Connected
                  </span>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
