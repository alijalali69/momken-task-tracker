import { CalendarDays, Kanban, LayoutDashboard, ListTodo, Plus, Settings as SettingsIcon } from "lucide-react";
import Avatar from "./ui/Avatar";
import { USERS, userById } from "../data/constants";

const NAV_ITEMS = [
  { key: "today", label: "Today", icon: ListTodo },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "board", label: "Board", icon: Kanban },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout({ screen, onNavigate, viewer, onSwitchViewer, onQuickAdd, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar — fixed so it stays put while the content column scrolls */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-10 md:flex md:w-60 md:flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            M
          </div>
          <span className="text-lg font-semibold text-slate-800">MOMKEN</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                screen === key
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={onQuickAdd}
          className="mx-3 mb-3 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>

        <div className="border-t border-slate-100 px-3 py-4">
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Viewing as</p>
          <div className="flex gap-1.5">
            {USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => onSwitchViewer(u.id)}
                className={`flex flex-1 items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                  viewer === u.id
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Avatar user={u} size="sm" />
                {u.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile top bar — fixed for the same reason */}
      <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            M
          </div>
          <span className="text-base font-semibold text-slate-800">MOMKEN</span>
        </div>
        <button onClick={() => onSwitchViewer(viewer === "ali" ? "mohsen" : "ali")} className="flex items-center gap-1.5">
          <Avatar user={userById(viewer)} size="sm" />
        </button>
      </header>

      {/* Main content — offset for the fixed header/sidebar/bottom-nav around it */}
      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">{children}</div>
      </main>

      {/* Mobile floating quick-add */}
      <button
        onClick={onQuickAdd}
        className="fixed bottom-20 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500 md:hidden"
        aria-label="New task"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              screen === key ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
