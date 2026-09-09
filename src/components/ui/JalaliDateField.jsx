import { isoDate } from "../../lib/dateUtils";
import { PERSIAN_MONTHS, jalaliMonthLength, jalaliToGregorian, toJalali } from "../../lib/jalali";

// Due-date picker in the Persian calendar. Native <input type="date"> can't be
// forced into Jalali, so this is three plain <select>s — no calendar-popup
// widget, just enough to pick a Jalali day/month/year and store it back as
// the Gregorian ISO string the data model (and Apps Script / Calendar side,
// later) expects.
export default function JalaliDateField({ value, onChange }) {
  const today = toJalali(new Date());
  const current = value ? toJalali(value) : today;
  const hasDate = Boolean(value);

  const years = [];
  for (let y = today.jy - 1; y <= today.jy + 3; y++) years.push(y);
  const dayCount = jalaliMonthLength(current.jy, current.jm);

  function update(patch) {
    const jy = patch.jy ?? current.jy;
    const jm = patch.jm ?? current.jm;
    const maxDay = jalaliMonthLength(jy, jm);
    const jd = Math.min(patch.jd ?? current.jd, maxDay);
    onChange(isoDate(jalaliToGregorian(jy, jm, jd)));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="input w-auto min-w-[4.5rem] flex-1"
        value={current.jd}
        disabled={!hasDate}
        onChange={(e) => update({ jd: Number(e.target.value) })}
      >
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        className="input w-auto min-w-[7.5rem] flex-[2]"
        value={current.jm}
        disabled={!hasDate}
        onChange={(e) => update({ jm: Number(e.target.value) })}
      >
        {PERSIAN_MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>

      <select
        className="input w-auto min-w-[5rem] flex-1"
        value={current.jy}
        disabled={!hasDate}
        onChange={(e) => update({ jy: Number(e.target.value) })}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onChange(hasDate ? null : isoDate(new Date()))}
        className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
      >
        {hasDate ? "No due date" : "Set date"}
      </button>
    </div>
  );
}
