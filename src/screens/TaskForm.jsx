import { ChevronLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import JalaliDateField from "../components/ui/JalaliDateField";
import { PRIORITIES, STAGES, STATUSES, USERS } from "../data/constants";
import { PROJECTS } from "../data/dummyData";

const emptyForm = {
  title: "",
  project: PROJECTS[0],
  assignee: "ali",
  stage: STAGES[0],
  priority: "Medium",
  due_date: "",
  is_deliverable: false,
  status: "Todo",
  link: "",
  notes: "",
};

export default function TaskForm({ mode, initialTask, viewer, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(() =>
    initialTask
      ? { ...emptyForm, ...initialTask, due_date: initialTask.due_date ?? "" }
      : { ...emptyForm, assignee: viewer }
  );

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-slate-800">{mode === "edit" ? "Edit Task" : "New Task"}</h1>
      </div>

      <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        <Field label="Title">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Color grade opening sequence"
            className="input"
          />
        </Field>

        <Field label="Project">
          <select value={form.project} onChange={(e) => set("project", e.target.value)} className="input">
            {PROJECTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Due date (Persian calendar)">
          <JalaliDateField value={form.due_date || null} onChange={(v) => set("due_date", v)} />
        </Field>

        <Field label="Assignee">
          <div className="flex gap-2">
            {USERS.map((u) => (
              <button
                type="button"
                key={u.id}
                onClick={() => set("assignee", u.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  form.assignee === u.id ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Avatar user={u} size="sm" />
                {u.name}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Stage">
            <select value={form.stage} onChange={(e) => set("stage", e.target.value)} className="input">
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Priority">
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => set("priority", p)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  form.priority === p ? "border-slate-700 bg-slate-800 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.is_deliverable}
            onChange={(e) => set("is_deliverable", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          This is a client deliverable
        </label>

        <Field label="Link (Drive / timeline / transcript)">
          <input
            value={form.link}
            onChange={(e) => set("link", e.target.value)}
            placeholder="https://drive.google.com/..."
            className="input"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className="input resize-none"
          />
        </Field>

        <div className="mt-2 flex items-center justify-between">
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(initialTask.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              {mode === "edit" ? "Save changes" : "Create task"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
