import { AlertTriangle, CheckCircle2, Film, ListChecks, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import { DueBadge } from "../components/ui/badges";
import { USERS, userById } from "../data/constants";
import { formatDue } from "../lib/dateUtils";
import { dashboardMetrics } from "../lib/metrics";

export default function Dashboard({ tasks, onOpenTask }) {
  const metrics = useMemo(() => dashboardMetrics(tasks), [tasks]);
  const { doneThisMonth, doneLastMonth, openByPerson, overdueByPerson, onTimeByPerson, upcoming, overdue, throughput } =
    metrics;

  const delta = doneThisMonth.total - doneLastMonth;
  const deadlineItems = [...overdue, ...upcoming].slice(0, 8);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400">How MOMKEN is doing, at a glance.</p>
      </div>

      {/* Headline */}
      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Done this month</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-800">{doneThisMonth.total}</span>
              <span className="text-sm text-slate-400">tasks completed</span>
            </div>
            <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(delta)} vs last month ({doneLastMonth})
            </div>
          </div>

          <div className="flex gap-6">
            {USERS.map((u) => (
              <div key={u.id} className="flex items-center gap-2">
                <Avatar user={u} />
                <div>
                  <p className="text-lg font-semibold text-slate-800">{doneThisMonth.byPerson[u.id] ?? 0}</p>
                  <p className="text-xs text-slate-400">{u.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Per-person cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {USERS.map((u) => (
          <PersonCard
            key={u.id}
            user={u}
            open={openByPerson[u.id] ?? 0}
            done={doneThisMonth.byPerson[u.id] ?? 0}
            overdue={overdueByPerson[u.id] ?? 0}
            onTime={onTimeByPerson[u.id]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Deadlines panel */}
        <Card className="p-4 md:p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Deadlines — next 14 days &amp; overdue</h2>
          <div className="flex flex-col gap-2">
            {deadlineItems.length === 0 && <p className="text-sm text-slate-400">Nothing due. Clear runway.</p>}
            {deadlineItems.map((t) => {
              const assignee = userById(t.assignee);
              const due = formatDue(t.due_date);
              return (
                <button
                  key={t.id}
                  onClick={() => onOpenTask?.(t)}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <Avatar user={assignee} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{t.title}</p>
                    <p className="truncate text-xs text-slate-400">{t.project}</p>
                  </div>
                  {t.is_deliverable && <Film className="h-3.5 w-3.5 shrink-0 text-violet-500" />}
                  <DueBadge label={due.label} tone={due.tone} />
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-5 lg:col-span-3">
          {/* Throughput chart */}
          <Card className="p-4 md:p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Weekly throughput — last 8 weeks</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={throughput} barGap={2}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="ali" name="Ali" fill={USERS[0].color} radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="mohsen" name="Mohsen" fill={USERS[1].color} radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Workload balance */}
          <Card className="p-4 md:p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Workload balance — open tasks</h2>
            <div className="flex flex-col gap-3">
              {USERS.map((u) => {
                const count = openByPerson[u.id] ?? 0;
                const max = Math.max(...USERS.map((x) => openByPerson[x.id] ?? 0), 1);
                return (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar user={u} size="sm" />
                    <span className="w-16 shrink-0 text-sm text-slate-600">{u.name}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(count / max) * 100}%`, backgroundColor: u.color }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PersonCard({ user, open, done, overdue, onTime }) {
  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Avatar user={user} />
        <span className="font-semibold text-slate-800">{user.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={ListChecks} label="Open" value={open} tone="slate" />
        <Stat icon={CheckCircle2} label="Done (mo)" value={done} tone="emerald" />
        <Stat icon={AlertTriangle} label="Overdue" value={overdue} tone={overdue > 0 ? "rose" : "slate"} />
        <Stat label="On-time" value={onTime === null ? "—" : `${onTime}%`} tone="indigo" />
      </div>
    </Card>
  );
}

const TONE_TEXT = {
  slate: "text-slate-700",
  emerald: "text-emerald-600",
  rose: "text-rose-600",
  indigo: "text-indigo-600",
};

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <p className={`mt-0.5 text-lg font-bold ${TONE_TEXT[tone] ?? "text-slate-700"}`}>{value}</p>
    </div>
  );
}
