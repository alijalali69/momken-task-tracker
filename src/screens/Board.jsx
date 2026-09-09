import { useMemo, useState } from "react";
import TaskCard from "../components/TaskCard";
import { STAGES, USERS } from "../data/constants";
import { PROJECTS } from "../data/dummyData";

const GROUP_OPTIONS = [
  { key: "stage", label: "By Stage" },
  { key: "project", label: "By Project" },
];

export default function Board({ tasks, viewer, onOpenTask }) {
  const [groupBy, setGroupBy] = useState("stage");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const filtered = useMemo(() => {
    return tasks.filter((t) => t.status !== "Done").filter((t) => {
      if (assigneeFilter === "all") return true;
      return t.assignee === assigneeFilter;
    });
  }, [tasks, assigneeFilter]);

  const groups = useMemo(() => {
    const keys = groupBy === "stage" ? STAGES : PROJECTS;
    return keys.map((key) => ({
      key,
      tasks: filtered.filter((t) => (groupBy === "stage" ? t.stage === key : t.project === key)),
    }));
  }, [filtered, groupBy]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Board</h1>
          <p className="text-sm text-slate-400">{filtered.length} open tasks</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl options={GROUP_OPTIONS} value={groupBy} onChange={setGroupBy} />
          <AssigneeFilter viewer={viewer} value={assigneeFilter} onChange={setAssigneeFilter} />
        </div>
      </div>

      {groupBy === "stage" ? (
        <div className="scroll-thin -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          {groups.map((g) => (
            <div key={g.key} className="flex w-64 shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-slate-600">{g.key}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {g.tasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {g.tasks.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t)} />
                ))}
                {g.tasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-300">
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups
            .filter((g) => g.tasks.length > 0)
            .map((g) => (
              <div key={g.key}>
                <h3 className="mb-2 text-sm font-semibold text-slate-600">
                  {g.key} <span className="font-normal text-slate-400">({g.tasks.length})</span>
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.tasks.map((t) => (
                    <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t)} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            value === o.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AssigneeFilter({ viewer, value, onChange }) {
  const other = USERS.find((u) => u.id !== viewer);
  const options = [
    { key: "all", label: "All" },
    { key: viewer, label: "Me" },
    { key: other.id, label: other.name },
  ];
  return (
    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            value === o.key ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
