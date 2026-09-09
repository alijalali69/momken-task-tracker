// ===================================================================
// MOMKEN Task Tracker — Apps Script backend
// Bound to the "MOMKEN Task Tracker" Google Sheet, "Tasks" tab.
// Deploy as Web App: Execute as "Me", Access "Anyone with the link".
// ===================================================================

var SHEET_NAME = 'Tasks';

var USERS = {
  ali: { name: 'Ali', email: '1369.jalali@gmail.com' },
  mohsen: { name: 'Mohsen', email: 'mohsen.etmdn@gmail.com' },
};

var COLUMNS = [
  'id', 'project', 'title', 'assignee', 'stage', 'priority', 'due_date',
  'is_deliverable', 'status', 'created_date', 'done_date', 'link', 'notes', 'gcal_event_id',
];

function getConfig(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

// ---------------- Web app entry points ----------------

function doGet(e) {
  return handle(e);
}

function doPost(e) {
  return handle(e);
}

function handle(e) {
  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
    }
    var params = e.parameter || {};
    var token = params.token || body.token;

    if (token !== getConfig('SHARED_TOKEN')) {
      return json({ error: 'unauthorized' });
    }

    var action = params.action || body.action || 'list';

    switch (action) {
      case 'list':
        return json({ tasks: listTasks() });
      case 'dashboard':
        return json(computeDashboard(listTasks()));
      case 'create':
        return json({ task: createTask(body.task || {}) });
      case 'update':
        return json({ task: updateTask(body.id, body.patch || {}) });
      case 'delete':
        return json({ ok: deleteTask(body.id) });
      default:
        return json({ error: 'unknown action: ' + action });
    }
  } catch (err) {
    return json({ error: String(err && err.message ? err.message : err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------- Sheet I/O ----------------

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function listTasks() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var rows = values.slice(1);
  return rows.filter(function (r) { return r[0]; }).map(function (r) { return rowToTask(header, r); });
}

function rowToTask(header, row) {
  var task = {};
  header.forEach(function (col, i) {
    task[col] = row[i] === '' ? null : row[i];
  });
  ['due_date', 'created_date', 'done_date'].forEach(function (f) {
    if (task[f] instanceof Date) task[f] = isoDateStr(task[f]);
  });
  task.is_deliverable = task.is_deliverable === true || task.is_deliverable === 'TRUE';
  return task;
}

function findRowIndexById(id) {
  var sheet = getSheet();
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}

function taskToRow(task) {
  return COLUMNS.map(function (c) {
    var v = task[c];
    return v === undefined || v === null ? '' : v;
  });
}

function createTask(fields) {
  var sheet = getSheet();
  var task = Object.assign(
    {
      id: 'T' + new Date().getTime(),
      created_date: isoDateStr(new Date()),
      done_date: fields.status === 'Done' ? isoDateStr(new Date()) : null,
      gcal_event_id: null,
    },
    fields
  );

  sheet.appendRow(taskToRow(task));
  syncCalendarEvent(task);
  notifyAssignment(task);
  return task;
}

function updateTask(id, patch) {
  var sheet = getSheet();
  var rowIndex = findRowIndexById(id);
  if (rowIndex === -1) throw new Error('task not found: ' + id);

  var header = sheet.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  var rowRange = sheet.getRange(rowIndex, 1, 1, COLUMNS.length);
  var before = rowToTask(header, rowRange.getValues()[0]);

  var after = Object.assign({}, before, patch);
  if (patch.status === 'Done' && before.status !== 'Done') {
    after.done_date = isoDateStr(new Date());
  } else if (patch.status && patch.status !== 'Done') {
    after.done_date = null;
  }

  rowRange.setValues([taskToRow(after)]);
  syncCalendarEvent(after);

  if (patch.assignee && patch.assignee !== before.assignee) {
    notifyAssignment(after);
  } else if (patch.status && patch.status !== before.status && (after.status === 'Review' || after.status === 'Done')) {
    notifyStatusChange(after);
  }

  return after;
}

function deleteTask(id) {
  var sheet = getSheet();
  var rowIndex = findRowIndexById(id);
  if (rowIndex === -1) return false;

  var header = sheet.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  var task = rowToTask(header, sheet.getRange(rowIndex, 1, 1, COLUMNS.length).getValues()[0]);
  removeCalendarEvent(task);
  sheet.deleteRow(rowIndex);
  return true;
}

// ---------------- Calendar sync ----------------
// One shared "MOMKEN" calendar (both Ali and Mohsen have it added), not each
// person's personal calendar — see build brief §3.

function getCalendar() {
  return CalendarApp.getCalendarById(getConfig('CALENDAR_ID'));
}

function eventTitle(task) {
  var who = USERS[task.assignee] ? USERS[task.assignee].name : task.assignee;
  return (task.is_deliverable ? '★ ' : '') + task.title + ' [' + who + ']';
}

function syncCalendarEvent(task) {
  var cal = getCalendar();
  var existing = null;
  if (task.gcal_event_id) {
    try { existing = cal.getEventById(task.gcal_event_id); } catch (e) { existing = null; }
  }

  var shouldHaveEvent = task.due_date && task.status !== 'Done';

  if (existing && !shouldHaveEvent) {
    existing.deleteEvent();
    task.gcal_event_id = ''; setEventId(task.id, '');
    return;
  }

  if (existing && shouldHaveEvent) {
    existing.setTitle(eventTitle(task));
    var currentDate = isoDateStr(existing.getAllDayStartDate());
    if (currentDate !== task.due_date) existing.setAllDayDate(new Date(task.due_date));
    return;
  }

  if (!existing && shouldHaveEvent) {
    var event = cal.createAllDayEvent(eventTitle(task), new Date(task.due_date));
    // Belt-and-suspenders on top of the calendar's own default 3d/1d/day-of
    // reminders (set once in Calendar settings) in case those ever change.
    event.addPopupReminder(3 * 24 * 60);
    event.addPopupReminder(24 * 60);
    task.gcal_event_id = event.getId(); setEventId(task.id, event.getId());
  }
}

function removeCalendarEvent(task) {
  if (!task.gcal_event_id) return;
  try {
    var cal = getCalendar();
    var existing = cal.getEventById(task.gcal_event_id);
    if (existing) existing.deleteEvent();
  } catch (e) {
    // already gone — fine
  }
}

function setEventId(id, eventId) {
  var sheet = getSheet();
  var rowIndex = findRowIndexById(id);
  if (rowIndex === -1) return;
  var col = COLUMNS.indexOf('gcal_event_id') + 1;
  sheet.getRange(rowIndex, col).setValue(eventId);
}

// ---------------- Email notifications ----------------

function notifyAssignment(task) {
  var user = USERS[task.assignee];
  if (!user) return;
  MailApp.sendEmail({
    to: user.email,
    subject: '[MOMKEN] Assigned: ' + task.title,
    body:
      'You were assigned "' + task.title + '" (' + task.project + ').\n' +
      'Stage: ' + task.stage + ' | Priority: ' + task.priority + ' | Due: ' + (task.due_date || 'none') + '\n' +
      (task.link ? 'Link: ' + task.link + '\n' : '') +
      (task.notes ? '\nNotes: ' + task.notes : ''),
  });
}

function notifyStatusChange(task) {
  var user = USERS[task.assignee];
  if (!user) return;
  MailApp.sendEmail({
    to: user.email,
    subject: '[MOMKEN] "' + task.title + '" moved to ' + task.status,
    body: task.title + ' (' + task.project + ') is now ' + task.status + '.',
  });
}

// ---------------- Daily digest ----------------

function sendDailyDigest() {
  var tasks = listTasks().filter(function (t) { return t.status !== 'Done' && t.due_date; });
  var today = isoDateStr(new Date());

  Object.keys(USERS).forEach(function (assignee) {
    var mine = tasks.filter(function (t) { return t.assignee === assignee; });
    var overdue = mine.filter(function (t) { return t.due_date < today; });
    var dueToday = mine.filter(function (t) { return t.due_date === today; });
    if (overdue.length === 0 && dueToday.length === 0) return;

    var lines = [];
    if (dueToday.length) {
      lines.push('DUE TODAY:');
      dueToday.forEach(function (t) { lines.push('- ' + t.title + ' (' + t.project + ')'); });
    }
    if (overdue.length) {
      if (lines.length) lines.push('');
      lines.push('OVERDUE:');
      overdue.forEach(function (t) { lines.push('- ' + t.title + ' (' + t.project + ')'); });
    }

    MailApp.sendEmail({
      to: USERS[assignee].email,
      subject: '[MOMKEN] Daily digest — ' + dueToday.length + ' due today, ' + overdue.length + ' overdue',
      body: lines.join('\n'),
    });
  });
}

// Run ONCE manually (Apps Script editor: select this function, Run) to install
// the ~8:30am daily trigger. Safe to re-run — clears any prior one first.
function installDailyDigestTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'sendDailyDigest'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger('sendDailyDigest').timeBased().atHour(8).nearMinute(30).everyDays(1).create();
}

// ---------------- Jalali (Shamsi) calendar helpers ----------------
// Mirrors src/lib/jalali.js on the frontend — same Intl-based approach,
// confirmed to work in the Apps Script V8 runtime.

var PERSIAN_MONTHS = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand',
];

var jFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });

function toJalali(dateInput) {
  var d = new Date(dateInput);
  d.setHours(12, 0, 0, 0);
  var parts = jFormatter.formatToParts(d);
  var get = function (type) { return Number(parts.filter(function (p) { return p.type === type; })[0].value); };
  return { jy: get('year'), jm: get('month'), jd: get('day') };
}

var nowruzCache = {};

function nowruz(jy) {
  if (nowruzCache[jy]) return nowruzCache[jy];
  var gy = jy + 621;
  var result = null;
  for (var day = 19; day <= 22; day++) {
    var candidate = new Date(gy, 2, day, 12);
    var p = toJalali(candidate);
    if (p.jy === jy && p.jm === 1 && p.jd === 1) { result = candidate; break; }
  }
  if (!result) result = new Date(gy, 2, 21, 12);
  nowruzCache[jy] = result;
  return result;
}

function isLeapJalaliYear(jy) {
  var days = Math.round((nowruz(jy + 1).getTime() - nowruz(jy).getTime()) / 86400000);
  return days === 366;
}

function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

function jalaliToGregorian(jy, jm, jd) {
  var start = nowruz(jy);
  var offset = 0;
  for (var m = 1; m < jm; m++) offset += m <= 6 ? 31 : 30;
  offset += jd - 1;
  var result = new Date(start);
  result.setDate(result.getDate() + offset);
  return result;
}

function isSameJalaliMonth(dateA, dateB) {
  var a = toJalali(dateA), b = toJalali(dateB);
  return a.jy === b.jy && a.jm === b.jm;
}

function previousJalaliMonth(ref) {
  var j = toJalali(ref);
  return j.jm === 1 ? { jy: j.jy - 1, jm: 12 } : { jy: j.jy, jm: j.jm - 1 };
}

// ---------------- Plain date helpers ----------------

function addDays(date, n) {
  var d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfDay(date) {
  var d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(dateStr, today) {
  if (!dateStr) return null;
  return Math.round((startOfDay(dateStr).getTime() - startOfDay(today).getTime()) / 86400000);
}

function isoDateStr(date) {
  var d = new Date(date);
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// Saturday-start week key (Persian week), matching the frontend's bucketing.
function weekKey(dateStr) {
  var d = startOfDay(dateStr);
  var day = (d.getDay() + 1) % 7; // 0 = Saturday
  d.setDate(d.getDate() - day);
  return isoDateStr(d);
}

function weekLabel(weekKeyStr) {
  var j = toJalali(weekKeyStr);
  return j.jd + ' ' + PERSIAN_MONTHS[j.jm - 1];
}

// ---------------- Dashboard metrics ----------------
// Mirrors src/lib/metrics.js on the frontend — computed server-side per the
// build brief (§3), so the app just displays these.

function computeDashboard(tasks) {
  var today = new Date();
  var personIds = Object.keys(USERS);
  var freshCounter = function () {
    var o = {};
    personIds.forEach(function (id) { o[id] = 0; });
    return o;
  };

  var doneThisMonth = { total: 0, byPerson: freshCounter() };
  var doneLastMonthCount = 0;
  var prevMonth = previousJalaliMonth(today);

  var openByPerson = freshCounter();
  var overdueByPerson = freshCounter();
  var onTimeTally = {};
  personIds.forEach(function (id) { onTimeTally[id] = { total: 0, onTime: 0 }; });

  var upcoming = [];
  var overdue = [];
  var throughputMap = {};

  tasks.forEach(function (t) {
    if (t.status === 'Done' && t.done_date) {
      if (isSameJalaliMonth(t.done_date, today)) {
        doneThisMonth.total += 1;
        doneThisMonth.byPerson[t.assignee] = (doneThisMonth.byPerson[t.assignee] || 0) + 1;
      }
      var jt = toJalali(t.done_date);
      if (jt.jy === prevMonth.jy && jt.jm === prevMonth.jm) doneLastMonthCount += 1;

      if (t.due_date && onTimeTally[t.assignee]) {
        onTimeTally[t.assignee].total += 1;
        if (new Date(t.done_date) <= new Date(t.due_date)) onTimeTally[t.assignee].onTime += 1;
      }

      var wk = weekKey(t.done_date);
      if (!throughputMap[wk]) throughputMap[wk] = { week: wk, label: weekLabel(wk), ali: 0, mohsen: 0 };
      throughputMap[wk][t.assignee] = (throughputMap[wk][t.assignee] || 0) + 1;
    } else if (t.status !== 'Done') {
      openByPerson[t.assignee] = (openByPerson[t.assignee] || 0) + 1;
      if (t.due_date) {
        var d = daysUntil(t.due_date, today);
        var withDays = Object.assign({}, t, { _daysUntil: d });
        if (d < 0) {
          overdueByPerson[t.assignee] = (overdueByPerson[t.assignee] || 0) + 1;
          overdue.push(withDays);
        } else if (d <= 14) {
          upcoming.push(withDays);
        }
      }
    }
  });

  overdue.sort(function (a, b) { return a._daysUntil - b._daysUntil; });
  upcoming.sort(function (a, b) { return a._daysUntil - b._daysUntil; });

  var onTimeByPerson = {};
  personIds.forEach(function (id) {
    var rec = onTimeTally[id];
    onTimeByPerson[id] = rec.total === 0 ? null : Math.round((rec.onTime / rec.total) * 100);
  });

  var throughput = [];
  for (var i = 7; i >= 0; i--) {
    var wk = weekKey(addDays(today, -i * 7));
    throughput.push(throughputMap[wk] || { week: wk, label: weekLabel(wk), ali: 0, mohsen: 0 });
  }

  return {
    doneThisMonth: doneThisMonth,
    doneLastMonth: doneLastMonthCount,
    openByPerson: openByPerson,
    overdueByPerson: overdueByPerson,
    onTimeByPerson: onTimeByPerson,
    upcoming: upcoming,
    overdue: overdue,
    throughput: throughput,
  };
}

// ---------------- One-time verification ----------------
// Run this manually first. Exercises Sheet + Calendar + Mail scopes in one
// shot so the OAuth consent screen asks for everything at once, and prints
// a plain confirmation to the execution log.

function verifySetup() {
  var sheet = getSheet();
  Logger.log('Sheet OK: ' + sheet.getName() + ', rows=' + sheet.getLastRow());

  var cal = getCalendar();
  Logger.log('Calendar OK: ' + cal.getName());

  Logger.log('Today in Jalali: ' + JSON.stringify(toJalali(new Date())));

  var token = getConfig('SHARED_TOKEN');
  Logger.log('SHARED_TOKEN set: ' + (token ? 'yes' : 'NO - set it in Project Settings > Script Properties'));
  var calId = getConfig('CALENDAR_ID');
  Logger.log('CALENDAR_ID set: ' + (calId ? 'yes' : 'NO - set it in Project Settings > Script Properties'));

  Logger.log('Sending a test email to both of you...');
  MailApp.sendEmail({
    to: USERS.ali.email + ',' + USERS.mohsen.email,
    subject: '[MOMKEN] Backend setup check',
    body: 'If you got this, Sheet + Calendar + Gmail access are all working.',
  });
  Logger.log('Done.');
}
