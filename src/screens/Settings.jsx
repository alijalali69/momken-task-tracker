import { Check, Eye, EyeOff, Info, Loader2, X } from "lucide-react";
import { useState } from "react";
import Card from "../components/ui/Card";
import EditableList from "../components/ui/EditableList";
import { fetchTasks, saveConfig } from "../lib/api";

const STATUS_STYLES = {
  connected: "bg-emerald-100 text-emerald-700",
  error: "bg-rose-100 text-rose-700",
  checking: "bg-amber-100 text-amber-700",
  idle: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL = {
  connected: "Connected",
  error: "Connection failed",
  checking: "Checking…",
  idle: "Not connected",
};

export default function Settings({ config, connectionStatus, onConnected, lists, onSaveList, listError }) {
  const [sheetUrl, setSheetUrl] = useState(config?.sheetUrl ?? "");
  const [scriptUrl, setScriptUrl] = useState(config?.scriptUrl ?? "");
  const [token, setToken] = useState(config?.token ?? "");
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState(connectionStatus ?? "idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [language, setLanguage] = useState("en");

  async function handleSave(e) {
    e.preventDefault();
    const next = { sheetUrl: sheetUrl.trim(), scriptUrl: scriptUrl.trim(), token: token.trim() };

    setStatus("checking");
    setErrorMsg("");
    try {
      await fetchTasks(next);
      saveConfig(next);
      setStatus("connected");
      onConnected?.(next);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400">Connection &amp; preferences</p>
      </div>

      <Card className="flex items-start gap-3 border-indigo-200 bg-indigo-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
        <p className="text-xs text-indigo-700">
          Paste the Apps Script Web App URL and the shared token (same values on both Ali's and Mohsen's browsers)
          from the backend deployment. Saving tests the connection before storing it.
        </p>
      </Card>

      <Card as="form" onSubmit={handleSave} className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold text-slate-700">Google connection</h2>

        <Field label="Google Sheet URL (reference only, not used for calls)">
          <input
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="input"
          />
        </Field>

        <Field label="Apps Script Web App URL">
          <input
            value={scriptUrl}
            onChange={(e) => setScriptUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="input"
          />
        </Field>

        <Field label="Shared secret token">
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste the shared token used by both of you"
              className="input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken((s) => !s)}
              className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {status === "error" && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
            {status === "checking" && <Loader2 className="h-3 w-3 animate-spin" />}
            {status === "connected" && <Check className="h-3 w-3" />}
            {STATUS_LABEL[status]}
          </span>
          <button
            type="submit"
            disabled={status === "checking"}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {status === "checking" ? "Testing…" : "Save & test connection"}
          </button>
        </div>
      </Card>

      {config && lists && (
        <Card className="flex flex-col gap-5 p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Task fields</h2>
            <p className="text-xs text-slate-400">
              Add, rename, or remove the Project / Stage / Status options shown on tasks. Renaming or removing one
              doesn't change tasks already using the old value — only what's offered going forward.
            </p>
          </div>

          {listError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {listError}
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Projects</h3>
            <EditableList items={lists.projects} onChange={(next) => onSaveList("project", next)} placeholder="Add a project…" />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Stages</h3>
            <EditableList items={lists.stages} onChange={(next) => onSaveList("stage", next)} placeholder="Add a stage…" />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Statuses</h3>
            <EditableList
              items={lists.statuses}
              onChange={(next) => onSaveList("status", next)}
              protectedItems={["Done"]}
              placeholder="Add a status…"
            />
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold text-slate-700">Language</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              language === "en" ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"
            }`}
          >
            English
          </button>
          <button
            disabled
            className="flex-1 cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-300"
            title="Coming soon"
          >
            فارسی · soon
          </button>
        </div>
        <p className="text-xs text-slate-400">Farsi + RTL toggle lands in a later phase.</p>
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
