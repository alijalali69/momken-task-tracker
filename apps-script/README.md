# MOMKEN Apps Script backend

`Code.gs` is the deployed source of truth for the live Apps Script project
("MOMKEN Backend", bound to the "MOMKEN Task Tracker" Google Sheet). If you
ever need to redeploy from scratch or hand this to someone else, here's the
full setup:

## 1. Sheet

- A Google Sheet named "MOMKEN Task Tracker" with a tab named exactly `Tasks`.
- Header row (bold, row 1) matching the build brief §6 columns:
  `id | project | title | assignee | stage | priority | due_date | is_deliverable | status | created_date | done_date | link | notes | gcal_event_id`

## 2. Apps Script project

- Extensions → Apps Script from that Sheet (binds the project to it).
- Paste `Code.gs` in as `Code.gs`.
- Project Settings → Script Properties, set:
  - `SHARED_TOKEN` — a random string both users paste into the app's Settings screen.
  - `CALENDAR_ID` — the shared Calendar's ID (Calendar → Settings → that calendar → "Integrate calendar" → Calendar ID).
  - `ALI_EMAIL`, `MOHSEN_EMAIL` — real addresses for assignment/digest emails.
    Kept out of `Code.gs` itself (this repo is public) — see `getUsers()`.

## 3. Calendar

- One shared Google Calendar (not each person's personal calendar), shared
  with both users ("Make changes and manage sharing" or similar).
- Calendar Settings → "All-day event notifications" — add three defaults:
  0 days / 1 day / 3 days before, all at 9:00am. `Code.gs` also sets two
  per-event reminders (3d, 1d) as a backstop in case those defaults ever
  change.

## 4. First run

- Run `verifySetup` once from the Apps Script editor. First run prompts an
  OAuth consent screen (Sheets + Calendar + Gmail scopes) — approve it. It
  sends a confirmation email to both users when everything's wired up.

## 5. Deploy

- Deploy → New deployment → Web app.
  - Execute as: **Me**
  - Who has access: **Anyone** (token-gated in code, not Google-login-gated —
    see build brief §3)
- Copy the resulting `.../exec` URL into the app's Settings screen along with
  `SHARED_TOKEN`.
- To ship a code change: paste the update into `Code.gs`, save, then
  **Deploy → Manage deployments → (pencil icon) → Version: New version →
  Deploy**. This keeps the same URL — no need to reconfigure the frontend.

## 6. Daily digest (optional, do once real tasks exist)

- Run `installDailyDigestTrigger` once from the Apps Script editor. Installs
  a ~8:30am daily trigger that emails each person their due-today + overdue
  tasks. Safe to re-run (clears any previous trigger first).

## API shape

POST (or GET with query params) to the deployed URL, body/query includes
`token` and `action`:

| action     | extra fields         | returns                    |
|------------|-----------------------|-----------------------------|
| `list`     | —                     | `{ tasks: [...] }`          |
| `dashboard`| —                     | dashboard metrics object    |
| `create`   | `task: {...}`         | `{ task: {...} }`           |
| `update`   | `id`, `patch: {...}`  | `{ task: {...} }`           |
| `delete`   | `id`                  | `{ ok: true }`              |

The frontend currently only uses `list`/`create`/`update`/`delete` and
computes dashboard metrics client-side (`src/lib/metrics.js`, same Jalali
math as `computeDashboard` here) — `dashboard` is there if that ever needs
to move server-side.
