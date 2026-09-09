import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { useMemo, useState } from "react";
import { userById } from "../data/constants";
import { isoDate, isSameDay } from "../lib/dateUtils";
import { PERSIAN_MONTHS, PERSIAN_WEEKDAYS_SHORT, jalaliToGregorian, toJalali } from "../lib/jalali";

// Builds a 6-week grid of Gregorian Date objects covering the given Jalali
// month, Saturday-first (Persian week order). Each cell's own Jalali y/m/d is
// read back off it individually, so leading/trailing padding days from the
// neighboring months get their correct (dimmed) Jalali day numbers too.
function buildGrid(jy, jm) {
  const firstDay = jalaliToGregorian(jy, jm, 1);
  const offset = (firstDay.getDay() + 1) % 7; // 0 = Saturday
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - offset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function CalendarView({ tasks, onOpenTask }) {
  const [jalaliMonth, setJalaliMonth] = useState(() => {
    const { jy, jm } = toJalali(new Date());
    return { jy, jm };
  });
  const [selected, setSelected] = useState(null);

  const days = useMemo(() => buildGrid(jalaliMonth.jy, jalaliMonth.jm), [jalaliMonth]);
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks
      .filter((t) => t.due_date)
      .forEach((t) => {
        const key = isoDate(t.due_date);
        (map[key] ??= []).push(t);
      });
    return map;
  }, [tasks]);

  function shiftMonth(delta) {
    setJalaliMonth(({ jy, jm }) => {
      let nextJm = jm + delta;
      let nextJy = jy;
      if (nextJm < 1) {
        nextJm = 12;
        nextJy -= 1;
      } else if (nextJm > 12) {
        nextJm = 1;
        nextJy += 1;
      }
      return { jy: nextJy, jm: nextJm };
    });
    setSelected(null);
  }

  const monthLabel = `${PERSIAN_MONTHS[jalaliMonth.jm - 1]} ${jalaliMonth.jy}`;
  const today = new Date();
  const selectedTasks = selected ? tasksByDate[isoDate(selected)] ?? [] : [];
  const selectedJalali = selected ? toJalali(selected) : null;
  const selectedWeekday = selected
    ? selected.toLocaleDateString("en-US", { weekday: "long" })
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Calendar</h1>
          <p className="text-sm text-slate-400">Due dates &amp; deliverables — Persian calendar</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-40 text-center text-sm font-medium text-slate-700">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {PERSIAN_WEEKDAYS_SHORT.map((w) => (
            <div key={w} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const key = isoDate(d);
            const dayTasks = tasksByDate[key] ?? [];
            const { jy, jm, jd } = toJalali(d);
            const inMonth = jy === jalaliMonth.jy && jm === jalaliMonth.jm;
            const isToday = isSameDay(d, today);
            const isSelected = selected && isSameDay(d, selected);
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={`flex min-h-[72px] flex-col items-start gap-1 border-b border-r border-slate-100 p-1.5 text-left transition last:border-r-0 md:min-h-[100px] md:p-2 ${
                  inMonth ? "bg-white" : "bg-slate-50/60"
                } ${isSelected ? "ring-2 ring-inset ring-indigo-400" : "hover:bg-slate-50"}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
                    isToday ? "bg-indigo-600 text-white" : inMonth ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  {jd}
                </span>
                <div className="flex w-full flex-col gap-0.5">
                  {dayTasks.slice(0, 2).map((t) => (
                    <span
                      key={t.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                        t.is_deliverable ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.is_deliverable && "★ "}
                      {t.title}
                    </span>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="text-[10px] font-medium text-slate-400">+{dayTasks.length - 2} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            {selectedWeekday}, {selectedJalali.jd} {PERSIAN_MONTHS[selectedJalali.jm - 1]} {selectedJalali.jy}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing due.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedTasks.map((t) => {
                const assignee = userById(t.assignee);
                return (
                  <button
                    key={t.id}
                    onClick={() => onOpenTask(t)}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: assignee.color }} />
                    <span className="flex-1 truncate text-sm text-slate-700">{t.title}</span>
                    {t.is_deliverable && <Film className="h-3.5 w-3.5 text-violet-500" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-violet-100" /> Deliverable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-slate-100" /> Regular task
        </span>
      </div>
    </div>
  );
}
