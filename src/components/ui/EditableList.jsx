import { Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

// A managed list of plain strings (Projects / Stages / Statuses), each item
// rename-in-place + deletable, plus an "add new" row. Fully controlled: every
// change calls onChange with the whole next array — the caller (Settings)
// owns persisting it to the backend and feeding the confirmed list back down.
export default function EditableList({ items, onChange, protectedItems = [], placeholder = "Add new…" }) {
  const [draft, setDraft] = useState("");

  function renameAt(i, value) {
    const next = [...items];
    next[i] = value;
    onChange(next);
  }

  function removeAt(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => {
        const locked = protectedItems.includes(item);
        return (
          <div key={item} className="flex items-center gap-1.5">
            <input
              defaultValue={item}
              disabled={locked}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== item) renameAt(i, v);
                else e.target.value = item;
              }}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              className="input flex-1 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {locked ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-300" title="Required — can't remove">
                <Lock className="h-3.5 w-3.5" />
              </span>
            ) : (
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Remove ${item}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="input flex-1"
        />
        <button
          type="button"
          onClick={add}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          aria-label="Add"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
