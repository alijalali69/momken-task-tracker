// Small date helpers. No date library — the app's date math is simple enough
// (day diffs, week buckets) that pulling one in isn't worth it yet. Calendar
// (Jalali) formatting lives in ./jalali — this file stays calendar-agnostic.

import { formatJalali } from "./jalali";

const MS_DAY = 24 * 60 * 60 * 1000;

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function isoDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Days between "today" and target date-string, rounded to whole days.
// Negative = overdue, 0 = today, positive = upcoming.
export function daysUntil(dateStr, today = new Date()) {
  if (!dateStr) return null;
  const target = startOfDay(dateStr).getTime();
  const from = startOfDay(today).getTime();
  return Math.round((target - from) / MS_DAY);
}

export function formatDue(dateStr, today = new Date()) {
  const n = daysUntil(dateStr, today);
  if (n === null) return { label: "No due date", tone: "neutral" };
  if (n < 0) return { label: `${Math.abs(n)}d overdue`, tone: "overdue" };
  if (n === 0) return { label: "Due today", tone: "soon" };
  if (n === 1) return { label: "Due tomorrow", tone: "soon" };
  if (n <= 3) return { label: `Due in ${n}d`, tone: "soon" };
  return { label: `Due in ${n}d`, tone: "neutral" };
}

// Saturday-start week key (Persian week), e.g. "2026-08-22", for bucketing throughput.
export function weekKey(dateStr) {
  const d = startOfDay(dateStr);
  const day = (d.getDay() + 1) % 7; // 0 = Saturday
  d.setDate(d.getDate() - day);
  return isoDate(d);
}

export function weekLabel(weekKeyStr) {
  return formatJalali(weekKeyStr, { withYear: false });
}

export function isSameDay(dateStr, ref) {
  return isoDate(dateStr) === isoDate(ref);
}
