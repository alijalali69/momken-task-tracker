import { Loader2, PlugZap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Layout from "./components/Layout";
import * as api from "./lib/api";
import Board from "./screens/Board";
import CalendarView from "./screens/CalendarView";
import Dashboard from "./screens/Dashboard";
import Settings from "./screens/Settings";
import TaskForm from "./screens/TaskForm";
import Today from "./screens/Today";

function App() {
  const [config, setConfig] = useState(() => api.loadConfig());
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState({ stages: [], projects: [], statuses: [] });
  const [listError, setListError] = useState("");
  // 'no-config' | 'loading' | 'ready' | 'error'
  const [loadState, setLoadState] = useState(config ? "loading" : "no-config");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  const [viewer, setViewer] = useState("ali");
  const [screen, setScreen] = useState("dashboard");
  const [returnScreen, setReturnScreen] = useState("dashboard");
  const [formState, setFormState] = useState(null); // { mode: 'create' | 'edit', task: taskObj | null }

  const refreshTasks = useCallback(
    async (cfg = config) => {
      if (!cfg) return;
      setLoadState((s) => (s === "ready" ? "ready" : "loading")); // don't blank the screen on a background refresh
      try {
        const [fresh, freshLists] = await Promise.all([api.fetchTasks(cfg), api.fetchConfigLists(cfg)]);
        setTasks(fresh);
        setLists(freshLists);
        setLoadState("ready");
      } catch (err) {
        setLoadError(err.message);
        setLoadState("error");
      }
    },
    [config]
  );

  async function handleSaveList(type, values) {
    setListError("");
    try {
      const updated = await api.saveConfigList(config, type, values);
      setLists(updated);
    } catch (err) {
      setListError(err.message);
    }
  }

  useEffect(() => {
    if (config) refreshTasks(config);
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  function navigate(key) {
    setScreen(key);
  }

  function openTaskForm({ mode, task }) {
    setReturnScreen(screen);
    setFormState({ mode, task });
    setScreen("task-form");
  }

  function closeTaskForm() {
    setFormState(null);
    setScreen(returnScreen);
  }

  async function runMutation(fn) {
    setBusy(true);
    try {
      await fn();
      await refreshTasks();
    } catch (err) {
      setLoadError(err.message);
      setLoadState("error");
    } finally {
      setBusy(false);
    }
  }

  function handleQuickAdd(title) {
    runMutation(() =>
      api.createTask(config, {
        title,
        project: "Unassigned",
        assignee: viewer,
        stage: lists.stages[0] ?? "Backlog",
        priority: "Medium",
        due_date: null,
        is_deliverable: false,
        status: lists.statuses.find((s) => s !== "Done") ?? "Todo",
        link: "",
        notes: "",
      })
    );
  }

  function handleToggleDone(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nowDone = task.status !== "Done";
    runMutation(() => api.updateTask(config, id, { status: nowDone ? "Done" : "Todo" }));
  }

  function handleSaveTask(form) {
    const patch = {
      title: form.title,
      project: form.project,
      assignee: form.assignee,
      stage: form.stage,
      priority: form.priority,
      due_date: form.due_date || null,
      is_deliverable: form.is_deliverable,
      status: form.status,
      link: form.link,
      notes: form.notes,
    };
    runMutation(() =>
      formState?.mode === "edit" ? api.updateTask(config, form.id, patch) : api.createTask(config, patch)
    );
    closeTaskForm();
  }

  function handleDeleteTask(id) {
    runMutation(() => api.deleteTask(config, id));
    closeTaskForm();
  }

  function handleConnected(nextConfig) {
    setConfig(nextConfig);
  }

  const connected = loadState === "ready" || loadState === "loading";

  // Plain helper (not a component) — gating this way keeps the wrapped
  // screen's own element identity stable across renders instead of forcing
  // a remount (which would drop its local state, e.g. TaskForm's draft).
  function gated(children) {
    if (loadState === "no-config") {
      return (
        <ConnectMessage
          icon={<PlugZap className="h-5 w-5" />}
          title="Not connected yet"
          body="Head to Settings and paste the Apps Script Web App URL + shared token to load real tasks."
          onGoToSettings={() => setScreen("settings")}
        />
      );
    }
    if (loadState === "error") {
      return (
        <ConnectMessage
          icon={<PlugZap className="h-5 w-5" />}
          title="Couldn't load tasks"
          body={loadError}
          onGoToSettings={() => setScreen("settings")}
        />
      );
    }
    if (loadState === "loading" && tasks.length === 0) {
      return (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tasks…
        </div>
      );
    }
    return children;
  }

  const screens = {
    dashboard: gated(<Dashboard tasks={tasks} onOpenTask={(task) => openTaskForm({ mode: "edit", task })} />),
    board: gated(
      <Board tasks={tasks} viewer={viewer} stages={lists.stages} onOpenTask={(task) => openTaskForm({ mode: "edit", task })} />
    ),
    today: gated(
      <Today
        tasks={tasks}
        viewer={viewer}
        onOpenTask={(task) => openTaskForm({ mode: "edit", task })}
        onQuickAdd={handleQuickAdd}
        onToggleDone={handleToggleDone}
      />
    ),
    calendar: gated(<CalendarView tasks={tasks} onOpenTask={(task) => openTaskForm({ mode: "edit", task })} />),
    settings: (
      <Settings
        config={config}
        connectionStatus={loadState === "error" ? "error" : loadState === "no-config" ? "idle" : "connected"}
        onConnected={handleConnected}
        lists={config ? lists : null}
        onSaveList={handleSaveList}
        listError={listError}
      />
    ),
    "task-form": formState
      ? gated(
          <TaskForm
            mode={formState.mode}
            initialTask={formState.task}
            viewer={viewer}
            projects={lists.projects}
            stages={lists.stages}
            statuses={lists.statuses}
            onSave={handleSaveTask}
            onCancel={closeTaskForm}
            onDelete={formState.mode === "edit" ? handleDeleteTask : undefined}
          />
        )
      : null,
  };

  return (
    <Layout
      screen={screen}
      onNavigate={navigate}
      viewer={viewer}
      onSwitchViewer={setViewer}
      onQuickAdd={() => connected && openTaskForm({ mode: "create", task: null })}
    >
      {busy && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </div>
      )}
      {screens[screen]}
    </Layout>
  );
}

function ConnectMessage({ icon, title, body, onGoToSettings }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-24 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">{icon}</div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400">{body}</p>
      <button
        onClick={onGoToSettings}
        className="mt-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Open Settings
      </button>
    </div>
  );
}

export default App;
