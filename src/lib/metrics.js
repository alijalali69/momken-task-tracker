// All dashboard math lives here, computed client-side over the dummy dataset.
// In Phase 1 this same shape gets computed server-side in Apps Script instead —
// keeping it isolated here means swapping the source later is a one-file change.

import { USERS } from "../data/constants";
import { daysUntil, weekKey, weekLabel, addDays } from "./dateUtils";
import { isSameJalaliMonth, previousJalaliMonth, toJalali } from "./jalali";

const personIds = USERS.map((u) => u.id);

// "This month" / "last month" mean the current Jalali month — that's the
// calendar MOMKEN actually works in.
export function doneThisMonth(tasks, today = new Date()) {
  const done = tasks.filter((t) => t.status === "Done" && t.done_date && isSameJalaliMonth(t.done_date, today));
  const byPerson = Object.fromEntries(personIds.map((id) => [id, 0]));
  done.forEach((t) => (byPerson[t.assignee] = (byPerson[t.assignee] ?? 0) + 1));
  return { total: done.length, byPerson };
}

export function doneLastMonth(tasks, today = new Date()) {
  const prev = previousJalaliMonth(today);
  const done = tasks.filter((t) => {
    if (t.status !== "Done" || !t.done_date) return false;
    const jt = toJalali(t.done_date);
    return jt.jy === prev.jy && jt.jm === prev.jm;
  });
  return done.length;
}

export function openCountByPerson(tasks) {
  const byPerson = Object.fromEntries(personIds.map((id) => [id, 0]));
  tasks.filter((t) => t.status !== "Done").forEach((t) => (byPerson[t.assignee] = (byPerson[t.assignee] ?? 0) + 1));
  return byPerson;
}

export function overdueCountByPerson(tasks, today = new Date()) {
  const byPerson = Object.fromEntries(personIds.map((id) => [id, 0]));
  tasks
    .filter((t) => t.status !== "Done" && t.due_date && daysUntil(t.due_date, today) < 0)
    .forEach((t) => (byPerson[t.assignee] = (byPerson[t.assignee] ?? 0) + 1));
  return byPerson;
}

export function onTimePercentByPerson(tasks) {
  const result = {};
  personIds.forEach((id) => {
    const done = tasks.filter((t) => t.assignee === id && t.status === "Done" && t.due_date && t.done_date);
    if (done.length === 0) {
      result[id] = null;
      return;
    }
    const onTime = done.filter((t) => new Date(t.done_date) <= new Date(t.due_date)).length;
    result[id] = Math.round((onTime / done.length) * 100);
  });
  return result;
}

export function upcomingDeadlines(tasks, today = new Date(), horizonDays = 14) {
  return tasks
    .filter((t) => t.status !== "Done" && t.due_date)
    .map((t) => ({ ...t, _daysUntil: daysUntil(t.due_date, today) }))
    .filter((t) => t._daysUntil >= 0 && t._daysUntil <= horizonDays)
    .sort((a, b) => a._daysUntil - b._daysUntil);
}

export function overdueDeadlines(tasks, today = new Date()) {
  return tasks
    .filter((t) => t.status !== "Done" && t.due_date)
    .map((t) => ({ ...t, _daysUntil: daysUntil(t.due_date, today) }))
    .filter((t) => t._daysUntil < 0)
    .sort((a, b) => a._daysUntil - b._daysUntil);
}

// Weekly completed-task counts, split by person, for the last `weeks` weeks
// (Monday-start buckets), oldest first — ready to feed straight into a bar chart.
export function weeklyThroughput(tasks, today = new Date(), weeks = 8) {
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const wk = weekKey(addDays(today, -i * 7));
    if (!buckets.find((b) => b.week === wk)) {
      buckets.push({ week: wk, label: weekLabel(wk), ali: 0, mohsen: 0 });
    }
  }
  const byWeek = Object.fromEntries(buckets.map((b) => [b.week, b]));
  tasks
    .filter((t) => t.status === "Done" && t.done_date)
    .forEach((t) => {
      const wk = weekKey(t.done_date);
      const bucket = byWeek[wk];
      if (bucket) bucket[t.assignee] = (bucket[t.assignee] ?? 0) + 1;
    });
  return buckets;
}

export function dashboardMetrics(tasks, today = new Date()) {
  return {
    doneThisMonth: doneThisMonth(tasks, today),
    doneLastMonth: doneLastMonth(tasks, today),
    openByPerson: openCountByPerson(tasks),
    overdueByPerson: overdueCountByPerson(tasks, today),
    onTimeByPerson: onTimePercentByPerson(tasks),
    upcoming: upcomingDeadlines(tasks, today),
    overdue: overdueDeadlines(tasks, today),
    throughput: weeklyThroughput(tasks, today),
  };
}
