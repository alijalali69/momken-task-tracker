// Static mock dataset for the Phase 0 mockups. No backend — every screen reads
// from this array. Dates are generated relative to "today" so the dashboard
// always looks alive (overdue/upcoming/this-month math stays meaningful)
// whenever this is opened.

import { addDays, isoDate } from "../lib/dateUtils";

const TODAY = new Date();

// day(n): n days from today as an ISO date string. n=null -> no due date.
function day(n) {
  if (n === null) return null;
  return isoDate(addDays(TODAY, n));
}

let _id = 1;
function nextId() {
  return `T${String(_id++).padStart(3, "0")}`;
}

function task({
  project,
  title,
  assignee,
  stage,
  priority,
  due,
  createdOffset,
  isDeliverable = false,
  status,
  doneOffset = null,
  link = "",
  notes = "",
}) {
  return {
    id: nextId(),
    project,
    title,
    assignee,
    stage,
    priority,
    due_date: day(due),
    is_deliverable: isDeliverable,
    status,
    created_date: day(createdOffset),
    done_date: doneOffset === null ? null : day(doneOffset),
    link,
    notes,
    gcal_event_id: due !== null ? `evt_${_id}` : null,
  };
}

// ---- Open tasks (not Done) ---------------------------------------------
const openTasks = [
  task({
    project: "Bazaar of Tehran",
    title: "Color grade opening sequence",
    assignee: "ali",
    stage: "Color",
    priority: "High",
    due: -3,
    createdOffset: -20,
    isDeliverable: true,
    status: "In-progress",
    link: "https://drive.google.com/mock1",
  }),
  task({
    project: "Bazaar of Tehran",
    title: "Sound mix reel 2",
    assignee: "mohsen",
    stage: "Sound",
    priority: "High",
    due: -1,
    createdOffset: -18,
    isDeliverable: true,
    status: "Blocked",
    notes: "Waiting on composer stems",
  }),
  task({
    project: "Coffee Culture Ep.4",
    title: "Transcribe barista interview",
    assignee: "ali",
    stage: "Transcribe",
    priority: "Medium",
    due: 0,
    createdOffset: -5,
    status: "Todo",
  }),
  task({
    project: "Coffee Culture Ep.4",
    title: "Assemble rough cut",
    assignee: "mohsen",
    stage: "Assembly",
    priority: "High",
    due: 1,
    createdOffset: -10,
    status: "In-progress",
  }),
  task({
    project: "Desert Nomads",
    title: "Backup drone footage",
    assignee: "ali",
    stage: "Ingest/Backup",
    priority: "Medium",
    due: 2,
    createdOffset: -2,
    status: "Todo",
  }),
  task({
    project: "Desert Nomads",
    title: "Client review call notes",
    assignee: "mohsen",
    stage: "Review",
    priority: "Low",
    due: 3,
    createdOffset: -6,
    status: "Review",
  }),
  task({
    project: "Silk Route Diaries",
    title: "Fine cut episode 1",
    assignee: "ali",
    stage: "Fine cut",
    priority: "High",
    due: 5,
    createdOffset: -15,
    isDeliverable: true,
    status: "In-progress",
  }),
  task({
    project: "Silk Route Diaries",
    title: "Pre-pro shot list",
    assignee: "mohsen",
    stage: "Pre-pro",
    priority: "Medium",
    due: 7,
    createdOffset: -1,
    status: "Todo",
  }),
  task({
    project: "Bazaar of Tehran",
    title: "Deliver final master to client",
    assignee: "mohsen",
    stage: "Delivered",
    priority: "High",
    due: 9,
    createdOffset: -25,
    isDeliverable: true,
    status: "Review",
    link: "https://drive.google.com/mock2",
  }),
  task({
    project: "Coffee Culture Ep.4",
    title: "Color pass B-roll",
    assignee: "ali",
    stage: "Color",
    priority: "Medium",
    due: 12,
    createdOffset: -3,
    status: "Todo",
  }),
  task({
    project: "Desert Nomads",
    title: "Shoot pickup interviews",
    assignee: "mohsen",
    stage: "Shoot",
    priority: "High",
    due: 13,
    createdOffset: -4,
    status: "Todo",
  }),
  task({
    project: "Silk Route Diaries",
    title: "Ingest new SD cards",
    assignee: "ali",
    stage: "Ingest/Backup",
    priority: "Low",
    due: null,
    createdOffset: -8,
    status: "Todo",
  }),
  task({
    project: "Bazaar of Tehran",
    title: "Transcribe vendor interview #3",
    assignee: "mohsen",
    stage: "Transcribe",
    priority: "Low",
    due: null,
    createdOffset: -8,
    status: "Todo",
  }),
  task({
    project: "Coffee Culture Ep.4",
    title: "Write voiceover script",
    assignee: "ali",
    stage: "Assembly",
    priority: "Medium",
    due: -7,
    createdOffset: -20,
    status: "Blocked",
    notes: "Blocked on narrator availability",
  }),
  task({
    project: "Desert Nomads",
    title: "Sound design pass",
    assignee: "mohsen",
    stage: "Sound",
    priority: "Medium",
    due: 6,
    createdOffset: -9,
    status: "In-progress",
  }),
];

// ---- Done tasks (drive every dashboard metric) --------------------------
const doneTasks = [
  task({ project: "Bazaar of Tehran", title: "Deliver teaser cut", assignee: "ali", stage: "Delivered", priority: "High", due: -1, createdOffset: -14, isDeliverable: true, status: "Done", doneOffset: -1 }),
  task({ project: "Bazaar of Tehran", title: "Finish sound mix reel 1", assignee: "mohsen", stage: "Sound", priority: "High", due: -1, createdOffset: -12, isDeliverable: true, status: "Done", doneOffset: -2 }),
  task({ project: "Desert Nomads", title: "Log shoot footage", assignee: "ali", stage: "Ingest/Backup", priority: "Low", due: -2, createdOffset: -9, status: "Done", doneOffset: -3 }),
  task({ project: "Coffee Culture Ep.4", title: "Client-approved color pass", assignee: "mohsen", stage: "Color", priority: "Medium", due: -5, createdOffset: -16, isDeliverable: true, status: "Done", doneOffset: -4 }),
  task({ project: "Silk Route Diaries", title: "Rough cut episode 2", assignee: "ali", stage: "Assembly", priority: "Medium", due: -6, createdOffset: -18, status: "Done", doneOffset: -6 }),
  task({ project: "Desert Nomads", title: "Backup archive drive", assignee: "mohsen", stage: "Ingest/Backup", priority: "Low", due: -8, createdOffset: -13, status: "Done", doneOffset: -7 }),
  task({ project: "Desert Nomads", title: "Transcribe elder interview", assignee: "ali", stage: "Transcribe", priority: "Medium", due: -9, createdOffset: -19, status: "Done", doneOffset: -9 }),
  task({ project: "Bazaar of Tehran", title: "Assemble sizzle reel", assignee: "mohsen", stage: "Assembly", priority: "High", due: -9, createdOffset: -21, isDeliverable: true, status: "Done", doneOffset: -11 }),
  task({ project: "Bazaar of Tehran", title: "Shoot rooftop scene", assignee: "ali", stage: "Shoot", priority: "Medium", due: -12, createdOffset: -22, status: "Done", doneOffset: -13 }),
  task({ project: "Coffee Culture Ep.4", title: "Sound design ep.3", assignee: "mohsen", stage: "Sound", priority: "Medium", due: -13, createdOffset: -24, status: "Done", doneOffset: -15 }),
  task({ project: "Silk Route Diaries", title: "Fine cut ep.3", assignee: "ali", stage: "Fine cut", priority: "High", due: -19, createdOffset: -30, isDeliverable: true, status: "Done", doneOffset: -17 }),
  task({ project: "Desert Nomads", title: "Deliver rough cut to client", assignee: "mohsen", stage: "Delivered", priority: "High", due: -20, createdOffset: -32, isDeliverable: true, status: "Done", doneOffset: -20 }),
  task({ project: "Bazaar of Tehran", title: "Ingest festival footage", assignee: "ali", stage: "Ingest/Backup", priority: "Low", due: -24, createdOffset: -30, status: "Done", doneOffset: -22 }),
  task({ project: "Coffee Culture Ep.4", title: "Color grade ep.2", assignee: "mohsen", stage: "Color", priority: "Medium", due: -23, createdOffset: -34, status: "Done", doneOffset: -25 }),
  task({ project: "Silk Route Diaries", title: "Pre-pro location scout", assignee: "ali", stage: "Pre-pro", priority: "Low", due: -27, createdOffset: -36, status: "Done", doneOffset: -29 }),
  task({ project: "Bazaar of Tehran", title: "Deliver final ep.1", assignee: "mohsen", stage: "Delivered", priority: "High", due: -30, createdOffset: -44, isDeliverable: true, status: "Done", doneOffset: -33 }),
  task({ project: "Bazaar of Tehran", title: "Transcribe market vendor", assignee: "ali", stage: "Transcribe", priority: "Low", due: -35, createdOffset: -45, status: "Done", doneOffset: -37 }),
  task({ project: "Desert Nomads", title: "Assemble teaser", assignee: "mohsen", stage: "Assembly", priority: "Medium", due: -38, createdOffset: -48, isDeliverable: true, status: "Done", doneOffset: -41 }),
  task({ project: "Coffee Culture Ep.4", title: "Sound mix ep.1", assignee: "ali", stage: "Sound", priority: "Medium", due: -44, createdOffset: -54, status: "Done", doneOffset: -46 }),
  task({ project: "Silk Route Diaries", title: "Fine cut ep.0 pilot", assignee: "mohsen", stage: "Fine cut", priority: "High", due: -48, createdOffset: -60, isDeliverable: true, status: "Done", doneOffset: -52 }),
];

export const TASKS = [...openTasks, ...doneTasks];

export const PROJECTS = [...new Set(TASKS.map((t) => t.project))];
