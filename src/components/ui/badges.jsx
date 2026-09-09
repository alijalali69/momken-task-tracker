import { AlertTriangle, Clock } from "lucide-react";
import { PRIORITY_STYLES, STATUS_STYLES } from "../../data/constants";

const BASE = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap";

export function PriorityBadge({ priority }) {
  return <span className={`${BASE} ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low}`}>{priority}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`${BASE} ${STATUS_STYLES[status] ?? STATUS_STYLES.Todo}`}>{status}</span>;
}

export function StagePill({ stage }) {
  return (
    <span className={`${BASE} border-indigo-100 bg-indigo-50 text-indigo-700`}>{stage}</span>
  );
}

const DUE_TONE_STYLES = {
  overdue: "border-rose-200 bg-rose-50 text-rose-700",
  soon: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
};

export function DueBadge({ label, tone }) {
  const Icon = tone === "overdue" ? AlertTriangle : Clock;
  return (
    <span className={`${BASE} ${DUE_TONE_STYLES[tone] ?? DUE_TONE_STYLES.neutral}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
