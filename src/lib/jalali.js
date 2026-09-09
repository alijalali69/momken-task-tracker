// Jalali (Shamsi/Persian) calendar helpers, built entirely on the browser's
// native Intl support for the "persian" calendar — no hand-ported conversion
// math, no dependency. Chrome/Edge/Firefox all ship accurate ICU data for it.
//
// Month names are the standard English transliteration (Farvardin, Ordibehesht,
// ...) per the brief: Persian calendar dates, English/Latin script for now.

export const PERSIAN_MONTHS = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
];

// Persian week order (Saturday first), matching the calendar screen's grid.
export const PERSIAN_WEEKDAYS_SHORT = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const partsFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function atNoon(dateInput) {
  const d = new Date(dateInput);
  d.setHours(12, 0, 0, 0); // dodge any DST/midnight rounding weirdness
  return d;
}

// Gregorian date (Date | ISO string) -> { jy, jm, jd }
export function toJalali(dateInput) {
  const parts = partsFormatter.formatToParts(atNoon(dateInput));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { jy: get("year"), jm: get("month"), jd: get("day") };
}

const nowruzCache = new Map();

// Gregorian Date for Farvardin 1 of the given Jalali year — found by scanning
// the few Gregorian days Nowruz can ever fall on, rather than computing it.
function nowruz(jy) {
  if (nowruzCache.has(jy)) return nowruzCache.get(jy);
  const gy = jy + 621;
  let result = null;
  for (let day = 19; day <= 22; day++) {
    const candidate = atNoon(new Date(gy, 2, day)); // March
    const p = toJalali(candidate);
    if (p.jy === jy && p.jm === 1 && p.jd === 1) {
      result = candidate;
      break;
    }
  }
  if (!result) result = atNoon(new Date(gy, 2, 21)); // shouldn't happen; safe fallback
  nowruzCache.set(jy, result);
  return result;
}

export function isLeapJalaliYear(jy) {
  const days = Math.round((nowruz(jy + 1) - nowruz(jy)) / 86400000);
  return days === 366;
}

export function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

// { jy, jm, jd } -> Gregorian Date
export function jalaliToGregorian(jy, jm, jd) {
  const start = nowruz(jy);
  let offset = 0;
  for (let m = 1; m < jm; m++) offset += m <= 6 ? 31 : 30;
  offset += jd - 1;
  const result = new Date(start);
  result.setDate(result.getDate() + offset);
  return result;
}

export function isSameJalaliMonth(dateStr, ref = new Date()) {
  const a = toJalali(dateStr);
  const b = toJalali(ref);
  return a.jy === b.jy && a.jm === b.jm;
}

// { jy, jm } of the Jalali month immediately before the given date's.
export function previousJalaliMonth(ref = new Date()) {
  const { jy, jm } = toJalali(ref);
  return jm === 1 ? { jy: jy - 1, jm: 12 } : { jy, jm: jm - 1 };
}

export function formatJalali(dateStr, { withYear = true } = {}) {
  if (!dateStr) return "—";
  const { jy, jm, jd } = toJalali(dateStr);
  const month = PERSIAN_MONTHS[jm - 1];
  return withYear ? `${jd} ${month} ${jy}` : `${jd} ${month}`;
}
