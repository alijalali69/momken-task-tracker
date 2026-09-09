import { Film, Link as LinkIcon } from "lucide-react";
import Avatar from "./ui/Avatar";
import { DueBadge, PriorityBadge } from "./ui/badges";
import { userById } from "../data/constants";
import { formatDue } from "../lib/dateUtils";

export default function TaskCard({ task, onClick }) {
  const assignee = userById(task.assignee);
  const due = formatDue(task.due_date);

  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
        {task.is_deliverable && (
          <Film className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" aria-label="Deliverable" />
        )}
      </div>

      <p className="truncate text-xs text-slate-400">{task.project}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.due_date && <DueBadge label={due.label} tone={due.tone} />}
        {task.link && <LinkIcon className="h-3 w-3 text-slate-300" aria-label="Has link" />}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <Avatar user={assignee} size="sm" />
        <span className="text-[11px] text-slate-400">{task.stage}</span>
      </div>
    </button>
  );
}
