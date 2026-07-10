"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Briefcase, Building2, RefreshCw, Users, Armchair,
  TrendingUp, UserCheck, AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useDashboardStats, useDepartmentDistribution,
  useSeatUtilizationAnalytics, useEmploymentStatusBreakdown,
  useProjectUtilizationAnalytics,
} from "@/hooks/useAnalytics";
import { useCurrentUser } from "@/store/auth";
import { formatNumber, formatPercentage, cn } from "@/lib/utils";

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, trend, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  accent: string;
}) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          accent
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            trend >= 0
              ? "bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)]"
              : "bg-[color-mix(in_srgb,var(--color-destructive)_12%,transparent)] text-[var(--color-destructive)]"
          )}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-[var(--color-foreground)]">{value}</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{label}</p>
        {sub && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs border border-[var(--color-border)]">
      {label && <p className="font-semibold text-[var(--color-foreground)] mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Chart colours ────────────────────────────────────────────────────────────
const CHART_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const EMP_STATUS_COLORS: Record<string, string> = {
  active: "#10b981", inactive: "#64748b", on_leave: "#f59e0b", terminated: "#ef4444",
};

export default function DashboardPage() {
  const user = useCurrentUser();
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardStats();
  const { data: deptData = [] }   = useDepartmentDistribution();
  const { data: seatData = [] }   = useSeatUtilizationAnalytics();
  const { data: empStatus = [] }  = useEmploymentStatusBreakdown();
  const { data: projData = [] }   = useProjectUtilizationAnalytics();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            {greeting()},{" "}
            <span className="text-[var(--color-primary)]">
              {user?.employee?.first_name ?? user?.email?.split("@")[0] ?? "Admin"} 👋
            </span>
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Here's your workspace overview for today.
          </p>
        </div>
        <Button id="refresh-dashboard" variant="ghost" size="icon" className="h-9 w-9"
          onClick={() => refetch()} aria-label="Refresh">
          <RefreshCw className={cn("w-4 h-4", statsLoading && "animate-spin")} />
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Employees" value={formatNumber(stats?.total_employees ?? 0)}
          sub={`${formatNumber(stats?.active_employees ?? 0)} active`}
          accent="bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]" />
        <KpiCard icon={Building2} label="Seat Utilization"
          value={formatPercentage(stats?.seat_utilization_pct ?? 0)}
          sub={`${formatNumber(stats?.occupied_seats ?? 0)} / ${formatNumber(stats?.total_seats ?? 0)} occupied`}
          accent="bg-[color-mix(in_srgb,#06b6d4_12%,transparent)] text-[#06b6d4]" />
        <KpiCard icon={Briefcase} label="Active Projects"
          value={formatNumber(stats?.active_projects ?? 0)}
          sub={`${formatNumber(stats?.total_projects ?? 0)} total`}
          accent="bg-[color-mix(in_srgb,#10b981_12%,transparent)] text-[#10b981]" />
        <KpiCard icon={UserCheck} label="Allocation Rate"
          value={formatPercentage(stats?.allocation_rate_pct ?? 0)}
          sub={`${formatNumber(stats?.unallocated_employees ?? 0)} unallocated`}
          accent="bg-[color-mix(in_srgb,#f59e0b_12%,transparent)] text-[#f59e0b]" />
      </div>

      {/* Charts row 1: Seat util bar + Dept pie */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Seat utilization bar chart */}
        <div className="glass-card p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
            Seat Utilization by Floor
          </h2>
          {seatData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              No seat data yet. Add buildings and seats to see utilization.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={seatData.map(f => ({
                name: `${f.building_name.slice(0,3)} · ${f.floor_name}`,
                Occupied: f.occupied, Available: f.available, Reserved: f.reserved,
              }))} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Occupied"  fill="#4f46e5" radius={[4,4,0,0]} />
                <Bar dataKey="Available" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Reserved"  fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department distribution pie */}
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--color-primary)]" />
            Employees by Department
          </h2>
          {deptData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              No department data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptData.slice(0, 7)} dataKey="count" nameKey="department"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  paddingAngle={2}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(entry: any) =>
                    (entry.percentage ?? 0) > 8 ? `${(entry.department ?? "").slice(0, 5)}…` : ""
                  }>
                  {deptData.slice(0, 7).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [`${v} employees`, name]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2: Project utilization + Employment status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Project utilization horizontal bar */}
        <div className="glass-card p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
            Project Team Sizes
          </h2>
          {projData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              No active projects yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, projData.length * 36)}>
              <BarChart data={projData} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                <YAxis type="category" dataKey="project_code" width={70}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="active_employees" name="Members" fill="#4f46e5" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Employment status breakdown */}
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
            Employment Status
          </h2>
          <div className="space-y-3 mt-2">
            {empStatus.map(({ status, count }) => {
              const total = empStatus.reduce((s, r) => s + r.count, 0) || 1;
              const pct   = Math.round((count / total) * 100);
              const color = EMP_STATUS_COLORS[status] ?? "#64748b";
              const label = status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color }}>{label}</span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-border)]">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
            {empStatus.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)] text-center py-8">
                No data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Alert: unallocated + new joiners */}
      {((stats?.unallocated_employees ?? 0) > 0 || (stats?.new_joiners_pending ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats?.unallocated_employees ?? 0) > 0 && (
            <div className="glass-card p-4 flex items-start gap-3 border-l-4 border-l-[var(--color-warning)]">
              <AlertCircle className="w-5 h-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {stats?.unallocated_employees} employees without seats
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Active employees who haven't been allocated a seat yet.
                </p>
              </div>
            </div>
          )}
          {(stats?.new_joiners_pending ?? 0) > 0 && (
            <div className="glass-card p-4 flex items-start gap-3 border-l-4 border-l-[var(--color-primary)]">
              <UserCheck className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {stats?.new_joiners_pending} pending new joiners
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  New joiners awaiting seat assignment.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
