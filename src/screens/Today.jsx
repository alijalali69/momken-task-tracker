import { Check, Film, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DueBadge, PriorityBadge } from "../components/ui/badges";
import { userById } from "../data/constants";
import { daysUntil, formatDue } from "../lib/dateUtils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Today({ tasks, viewer, onOpenTask, onQuickAdd, onToggleDone }) {
  const [draft, setDraft] = useState("");
  const viewerName = userById(viewer).name;

  const mine = useMemo(
    () => tasks.filter((t) => t.assignee === viewer && t.status !== "Done"),
    [tasks, viewer]
  );

  const sections = useMemo(() => {
    const withDays = mine.map((t) => ({ ...t, _d: t.due_date ? daysUntil(t.due_date) : null }));
    return [
      { key: "overdue", label: "Overdue", tasks: withDays.filter((t) => t._d !== null && t._d < 0) },
      { key: "today", label: "Today", tasks: withDays.filter((t) => t._d === 0) },
      { key: "week", label: "This week", tasks: withDays.filter((t) => t._d !== null && t._d > 0 && t._d <= 7) },
      { key: "later", label: "Later / no date", tasks: withDays.filter((t) => t._d === null || t._d > 7) },
    ];
  }, [mine]);

  function submitDraft() {
    const title = draft.trim();
    if (!title) return;
    onQuickAdd(title);
    setDraft("");
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          {greeting()}, {viewerName}
        </h1>
        <p className="text-sm text-slate-400">{mine.length} open tasks assigned to you</p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitDraft()}
          placeholder="Quick-add a task for yourself..."
          className="flex-1 bg-transparent px-2 py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-300"
        />
        <button
          onClick={submitDraft}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {sections.map(
        (s) =>
          s.tasks.length > 0 && (
            <div key={s.key}>
              <h2
                className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                  s.key === "overdue" ? "text-rose-500" : "text-slate-400"
                }`}
              >
                {s.label} · {s.tasks.length}
              </h2>
              <div className="flex flex-col gap-2">
                {s.tasks.map((t) => {
                  const due = formatDue(t.due_date);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <button
                        onClick={() => onToggleDone(t.id)}
                        aria-label="Mark done"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent transition hover:border-emerald-400 hover:text-emerald-500"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button onClick={() => onOpenTask(t)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium text-slate-700">{t.title}</p>
                        <p className="truncate text-xs text-slate-400">{t.project}</p>
                      </button>
                      {t.is_deliverable && <Film className="h-3.5 w-3.5 shrink-0 text-violet-500" />}
                      <PriorityBadge priority={t.priority} />
                      {t.due_date && <DueBadge label={due.label} tone={due.tone} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )
      )}

      {mine.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          Nothing on your plate. Nice.
        </p>
      )}
    </div>
  );
}
