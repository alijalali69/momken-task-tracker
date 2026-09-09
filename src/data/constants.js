// Static reference data — mirrors the eventual Sheet's controlled vocab (see build brief §6).

export const USERS = [
  { id: "ali", name: "Ali", color: "#4f46e5", initial: "A" }, // indigo
  { id: "mohsen", name: "Mohsen", color: "#0d9488", initial: "M" }, // teal
];

export const STAGES = [
  "Backlog",
  "Pre-pro",
  "Shoot",
  "Ingest/Backup",
  "Transcribe",
  "Assembly",
  "Fine cut",
  "Color",
  "Sound",
  "Review",
  "Delivered",
];

export const PRIORITIES = ["Low", "Medium", "High"];

export const STATUSES = ["Todo", "In-progress", "Blocked", "Review", "Done"];

export const PRIORITY_STYLES = {
  Low: "bg-slate-100 text-slate-600 border-slate-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-rose-50 text-rose-700 border-rose-200",
};

export const STATUS_STYLES = {
  Todo: "bg-slate-100 text-slate-600 border-slate-200",
  "In-progress": "bg-blue-50 text-blue-700 border-blue-200",
  Blocked: "bg-rose-50 text-rose-700 border-rose-200",
  Review: "bg-violet-50 text-violet-700 border-violet-200",
  Done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function userById(id) {
  return USERS.find((u) => u.id === id) ?? USERS[0];
}
