/* ============================================================
   js/core/utils.js
   Small helpers used everywhere: dates, formatting, ids, DOM safety.

   All dates are stored as plain local "YYYY-MM-DD" strings and all
   times as "HH:MM". We deliberately avoid UTC/ISO timestamps so that
   "today" always means today where you are sitting.
   ============================================================ */
window.App = window.App || {};

App.utils = (function () {
  'use strict';

  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* ---------- Dates ---------- */

  /** Date object -> "YYYY-MM-DD" using LOCAL time (not UTC). */
  function toISO(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  /** Today as "YYYY-MM-DD". */
  function today() { return toISO(new Date()); }

  /** Current wall-clock time as "HH:MM". */
  function nowTime() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /** "YYYY-MM-DD" -> Date at local midnight (null for empty input). */
  function parseISO(iso) {
    if (!iso || typeof iso !== 'string') return null;
    var parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  /** Shift an ISO date by n days (n may be negative). */
  function addDays(iso, n) {
    var d = parseISO(iso) || new Date();
    d.setDate(d.getDate() + n);
    return toISO(d);
  }

  /** Whole days from `from` to `to`. Positive when `to` is later. */
  function daysBetween(from, to) {
    var a = parseISO(from), b = parseISO(to);
    if (!a || !b) return 0;
    // Round because daylight-saving changes make the raw division fractional.
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  /** "2026-09-28" -> "28 Sep 2026". */
  function fmtDate(iso) {
    var d = parseISO(iso);
    if (!d) return '—';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /** "2026-09-28" -> "28 Sep". */
  function fmtDateShort(iso) {
    var d = parseISO(iso);
    if (!d) return '—';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()];
  }

  /** Human phrasing relative to today: "Today", "in 3 days", "5 days overdue". */
  function relativeDay(iso) {
    if (!iso) return '—';
    var diff = daysBetween(today(), iso);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 1) return 'in ' + diff + ' days';
    return Math.abs(diff) + ' days ago';
  }

  /** Weekday name for an ISO date, e.g. "Mon". */
  function weekdayShort(iso) {
    var d = parseISO(iso);
    if (!d) return '';
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  }

  /** Monday of the week containing `iso`. */
  function startOfWeek(iso) {
    var d = parseISO(iso) || new Date();
    var day = (d.getDay() + 6) % 7; // 0 = Monday
    d.setDate(d.getDate() - day);
    return toISO(d);
  }

  /* ---------- Times & durations ---------- */

  /** "HH:MM" -> minutes since midnight (NaN-safe). */
  function timeToMinutes(hhmm) {
    if (!hhmm || hhmm.indexOf(':') === -1) return null;
    var p = hhmm.split(':').map(Number);
    if (p.some(isNaN)) return null;
    return p[0] * 60 + p[1];
  }

  /**
   * Minutes between two "HH:MM" times.
   * If the end time is earlier than the start we assume the session
   * ran past midnight and add 24h rather than returning a negative.
   */
  function minutesBetweenTimes(start, end) {
    var a = timeToMinutes(start), b = timeToMinutes(end);
    if (a === null || b === null) return 0;
    var diff = b - a;
    if (diff < 0) diff += 24 * 60;
    return diff;
  }

  /** 95 -> "1h 35m", 40 -> "40m", 120 -> "2h". */
  function fmtDuration(minutes) {
    var m = Math.max(0, Math.round(minutes || 0));
    var h = Math.floor(m / 60);
    var rest = m % 60;
    if (h === 0) return rest + 'm';
    if (rest === 0) return h + 'h';
    return h + 'h ' + rest + 'm';
  }

  /** Minutes -> hours with one decimal (number, not string). */
  function toHours(minutes) { return Math.round((minutes || 0) / 6) / 10; }

  /** Seconds -> "HH:MM:SS" for the live session timer. */
  function fmtClock(totalSeconds) {
    var s = Math.max(0, Math.floor(totalSeconds));
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
  }

  /* ---------- Text & numbers ---------- */

  /** Escape anything that came from the user before putting it in innerHTML. */
  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** "Value Types vs Reference Types" -> "value-types-vs-reference-types". */
  function slug(text) {
    return String(text).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  var idCounter = 0;
  /** Short unique id, e.g. "s-lk3f9a-7". */
  function uid(prefix) {
    idCounter += 1;
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + idCounter;
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function sum(list) { return list.reduce(function (a, b) { return a + (b || 0); }, 0); }
  function avg(list) { return list.length ? sum(list) / list.length : 0; }
  function round(n, dp) { var f = Math.pow(10, dp || 0); return Math.round(n * f) / f; }

  /** Group an array into an object keyed by the result of keyFn. */
  function groupBy(list, keyFn) {
    return list.reduce(function (map, item) {
      var key = keyFn(item);
      (map[key] = map[key] || []).push(item);
      return map;
    }, {});
  }

  function pluralize(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  /* ---------- Files ---------- */

  /** Trigger a browser download of a text file (used by the JSON export). */
  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Give the browser a moment to start the download before revoking.
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /** Read a File object as text (promise wrapper around FileReader). */
  function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result)); };
      reader.onerror = function () { reject(new Error('Could not read the file.')); };
      reader.readAsText(file);
    });
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return round(bytes / 1024, 1) + ' KB';
    return round(bytes / (1024 * 1024), 2) + ' MB';
  }

  return {
    toISO: toISO, today: today, nowTime: nowTime, parseISO: parseISO,
    addDays: addDays, daysBetween: daysBetween, fmtDate: fmtDate,
    fmtDateShort: fmtDateShort, relativeDay: relativeDay, weekdayShort: weekdayShort,
    startOfWeek: startOfWeek, timeToMinutes: timeToMinutes,
    minutesBetweenTimes: minutesBetweenTimes, fmtDuration: fmtDuration,
    toHours: toHours, fmtClock: fmtClock, escapeHtml: escapeHtml, slug: slug,
    uid: uid, clamp: clamp, sum: sum, avg: avg, round: round, groupBy: groupBy,
    pluralize: pluralize, downloadText: downloadText, readFileAsText: readFileAsText,
    formatBytes: formatBytes
  };
})();
