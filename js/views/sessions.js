/* ============================================================
   js/views/sessions.js
   Live "Start session" timer (App.sessionControl) + the sessions log.

   A running session is stored in the data file, so closing the tab
   or reloading does not lose it - the timer picks up where it was.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

/* ------------------------------------------------------------
   Session control - used by the topbar button and the dashboard
   ------------------------------------------------------------ */
App.sessionControl = (function () {
  'use strict';

  var U = App.utils;

  function active() { return App.store.get().activeSession; }

  /** Start the live timer. Asks which topic you are about to study. */
  function start() {
    if (active()) { App.ui.toast('A session is already running.', 'warn'); return; }

    var suggested = App.progress.currentTopic();
    App.ui.formModal({
      title: 'Start a learning session',
      subtitle: 'The timer runs until you press "End session".',
      size: 'sm',
      fields: [
        { name: 'topicId', label: 'Topic', type: 'select',
          options: [{ value: '', label: '— decide later —' }].concat(App.ui.topicOptions()) },
        { name: 'startTime', label: 'Start time', type: 'time' }
      ],
      values: { topicId: suggested ? suggested.id : '', startTime: U.nowTime() },
      submitLabel: 'Start',
      onSubmit: function (v) {
        App.store.update(function (s) {
          s.activeSession = {
            startedAtMs: Date.now(),
            date: U.today(),
            startTime: v.startTime || U.nowTime(),
            topicId: v.topicId || ''
          };
        });
        App.ui.toast('Session started. Good luck.', 'ok');
      }
    });
  }

  /** Stop the timer and open the session form prefilled with what we know. */
  function stop() {
    var a = active();
    if (!a) return;

    var elapsedMinutes = Math.max(1, Math.round((Date.now() - a.startedAtMs) / 60000));

    openForm(null, {
      date: a.date,
      startTime: a.startTime,
      endTime: U.nowTime(),
      durationMinutes: elapsedMinutes,
      topicId: a.topicId,
      learned: '', struggled: '', exercises: 0, confidence: 3, notes: ''
    }, {
      title: 'End session',
      subtitle: 'You studied for ' + U.fmtDuration(elapsedMinutes) + '. Capture it while it is fresh.',
      onSaved: clearActive,
      extraFooterHtml: '<button type="button" class="btn btn--sm btn--outline-danger" data-discard>Discard session</button>',
      onFooterClick: function (e, handle) {
        if (e.target.closest('[data-discard]')) {
          App.ui.confirm({
            title: 'Discard this session?',
            message: 'The elapsed time will not be recorded.',
            confirmLabel: 'Discard', danger: true
          }).then(function (ok) {
            if (!ok) return;
            clearActive();
            handle.close();
            App.ui.toast('Session discarded');
          });
        }
      }
    });
  }

  function clearActive() {
    App.store.update(function (s) { s.activeSession = null; });
  }

  /** Seconds the current session has been running (0 when none). */
  function elapsedSeconds() {
    var a = active();
    return a ? Math.floor((Date.now() - a.startedAtMs) / 1000) : 0;
  }

  /* ---------- The session form, shared by "end session" and manual logging ---------- */

  function formFields() {
    return [
      { name: 'date', label: 'Date', type: 'date', required: true, full: false },
      { name: 'topicId', label: 'Topic', type: 'select', full: false,
        options: [{ value: '', label: '— not linked —' }].concat(App.ui.topicOptions()) },
      { name: 'startTime', label: 'Start time', type: 'time', full: false },
      { name: 'endTime', label: 'End time', type: 'time', full: false },
      { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number', min: 0, max: 1440, full: false,
        hint: 'Filled in automatically from the start and end times.' },
      { name: 'exercises', label: 'Exercises completed', type: 'number', min: 0, max: 200, full: false },
      { name: 'learned', label: 'What I learned', type: 'textarea', rows: 3,
        placeholder: 'Concretely - what can you do now that you could not do before?' },
      { name: 'struggled', label: 'What I struggled with', type: 'textarea', rows: 2,
        placeholder: 'This is what tomorrow\'s session should start with.' },
      { name: 'confidence', label: 'Confidence after this session (0-5)', type: 'range', min: 0, max: 5 },
      { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 }
    ];
  }

  /**
   * openForm(sessionId, prefill, options)
   *  - sessionId null  -> create
   *  - sessionId given -> edit
   */
  function openForm(sessionId, prefill, options) {
    options = options || {};
    var editing = sessionId ? App.store.get().sessions.filter(function (s) { return s.id === sessionId; })[0] : null;

    var values = editing || prefill || {
      date: U.today(), startTime: U.nowTime(), endTime: '', durationMinutes: 0,
      topicId: '', learned: '', struggled: '', exercises: 0, confidence: 3, notes: ''
    };

    App.ui.formModal({
      title: options.title || (editing ? 'Edit session' : 'Log a session'),
      subtitle: options.subtitle || (editing ? U.fmtDate(editing.date) : 'Record a session you have already finished'),
      size: 'wide',
      fields: formFields(),
      values: values,
      submitLabel: editing ? 'Save changes' : 'Save session',
      extraFooterHtml: options.extraFooterHtml ||
        (editing ? '<button type="button" class="btn btn--sm btn--outline-danger" data-delete-session>Delete</button>' : ''),
      onFormReady: function (form) {
        // Keep the duration in step with the start / end times.
        function recalc() {
          var start = form.elements.startTime.value;
          var end = form.elements.endTime.value;
          if (start && end) {
            form.elements.durationMinutes.value = U.minutesBetweenTimes(start, end);
          }
        }
        form.elements.startTime.addEventListener('change', recalc);
        form.elements.endTime.addEventListener('change', recalc);
      },
      onSubmit: function (v) {
        if (editing) {
          App.store.updateSession(editing.id, v);
          App.ui.toast('Session updated', 'ok');
        } else {
          App.store.addSession(v);
          App.ui.toast('Session saved · ' + U.fmtDuration(v.durationMinutes), 'ok');
        }
        if (options.onSaved) options.onSaved();
      },
      onFooterClick: function (e, handle) {
        if (options.onFooterClick) options.onFooterClick(e, handle);
        if (editing && e.target.closest('[data-delete-session]')) {
          App.ui.confirm({ title: 'Delete session?', message: 'This cannot be undone.',
                           confirmLabel: 'Delete', danger: true })
            .then(function (ok) {
              if (!ok) return;
              App.store.deleteSession(editing.id);
              handle.close();
              App.ui.toast('Session deleted');
            });
        }
      }
    });
  }

  return { start: start, stop: stop, active: active, elapsedSeconds: elapsedSeconds, openForm: openForm };
})();

/* ------------------------------------------------------------
   The Sessions page
   ------------------------------------------------------------ */
App.views.sessions = (function () {
  'use strict';

  var U = App.utils, C = App.charts, P = App.progress, icon = App.icons;

  var meta = { title: 'Sessions', subtitle: 'Everything you have actually sat down and done' };

  var filters = { q: '', phase: 'all' };

  function visible() {
    return App.store.get().sessions.slice()
      .filter(function (x) {
        if (filters.phase !== 'all') {
          var t = App.store.topicById(x.topicId);
          if (!t || t.phaseId !== filters.phase) return false;
        }
        if (filters.q) {
          var hay = (App.store.topicName(x.topicId) + ' ' + x.learned + ' ' + x.struggled + ' ' + x.notes).toLowerCase();
          if (hay.indexOf(filters.q.toLowerCase()) === -1) return false;
        }
        return true;
      })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return (b.startTime || '').localeCompare(a.startTime || '');
      });
  }

  function render(root) {
    var all = App.store.get().sessions;
    var list = visible();
    var streak = P.streak();
    var minutes = P.totalMinutes();
    var avgLen = all.length ? Math.round(minutes / all.length) : 0;
    var weekMinutes = U.sum(P.sessionsThisWeek().map(function (s) { return s.durationMinutes || 0; }));
    var avgConf = all.length ? U.round(U.avg(all.map(function (s) { return s.confidence || 0; })), 1) : 0;

    root.innerHTML =
      '<div class="grid grid--stats section">' +
        stat('Total sessions', String(all.length), U.pluralize(P.sessionsThisWeek().length, 'session') + ' this week') +
        stat('Total hours', String(U.toHours(minutes)), U.fmtDuration(minutes)) +
        stat('Average length', U.fmtDuration(avgLen), 'per session') +
        stat('This week', U.fmtDuration(weekMinutes), 'since ' + U.fmtDateShort(U.startOfWeek(U.today()))) +
        stat('Current streak', streak.current + 'd', 'longest ' + streak.longest + 'd') +
      '</div>' +

      '<div class="card section">' +
        '<div class="card__head">' + icon('trending', 16) + '<h2>Last 30 days</h2>' +
          '<span class="spacer small faint">minutes per day</span></div>' +
        C.barChart({
          data: P.dailyMinutes(30).map(function (d) {
            return { label: U.fmtDateShort(d.date), value: d.minutes };
          }),
          height: 170, format: function (v) { return Math.round(v) + 'm'; }, highlightLast: true
        }) +
      '</div>' +

      '<div class="toolbar">' +
        '<div class="search">' + icon('search', 15) +
          '<input class="input" type="search" placeholder="Search what you learned..." value="' +
            U.escapeHtml(filters.q) + '" data-q></div>' +
        '<select class="select" data-phase style="max-width:190px">' +
          '<option value="all">All phases</option>' +
          App.ui.phaseOptions().map(function (o) {
            return '<option value="' + o.value + '"' + (filters.phase === o.value ? ' selected' : '') + '>' +
              U.escapeHtml(o.label) + '</option>';
          }).join('') +
        '</select>' +
        '<span class="spacer"></span>' +
        '<button class="btn" data-log>' + icon('plus', 15) + ' Log past session</button>' +
        '<button class="btn btn--primary" data-start>' + icon('play', 14) + ' Start session</button>' +
      '</div>' +

      (list.length ? table(list)
        : App.ui.emptyState('No sessions yet',
            'Press "Start session" when you begin studying, or log one you have already done.',
            '<button class="btn btn--primary btn--sm" data-start>Start a session</button>'));

    wire(root);
  }

  function stat(label, value, hint) {
    return '<div class="stat"><span class="stat__label">' + U.escapeHtml(label) + '</span>' +
      '<span class="stat__value">' + U.escapeHtml(value) + '</span>' +
      '<span class="stat__hint">' + U.escapeHtml(hint) + '</span></div>';
  }

  function table(list) {
    return '<div class="card card--pad-0"><div class="table-wrap"><table class="tbl">' +
      '<thead><tr><th>Date</th><th>Time</th><th>Duration</th><th>Topic</th>' +
      '<th>What I learned</th><th>Exercises</th><th>Confidence</th><th class="col-actions"></th></tr></thead><tbody>' +
      list.map(function (x) {
        return '<tr>' +
          '<td class="small"><b>' + U.fmtDateShort(x.date) + '</b><div class="faint">' +
            U.weekdayShort(x.date) + '</div></td>' +
          '<td class="small faint tnum">' + U.escapeHtml(x.startTime || '—') +
            (x.endTime ? '–' + U.escapeHtml(x.endTime) : '') + '</td>' +
          '<td class="tnum"><b>' + U.fmtDuration(x.durationMinutes) + '</b></td>' +
          '<td class="small">' + U.escapeHtml(App.store.topicName(x.topicId)) + '</td>' +
          '<td class="small muted" style="max-width:320px"><div class="truncate">' +
            U.escapeHtml(x.learned || '—') + '</div></td>' +
          '<td class="tnum small">' + (x.exercises || 0) + '</td>' +
          '<td>' + C.pips(x.confidence, C.scoreTone(x.confidence)) + '</td>' +
          '<td class="col-actions">' +
            '<button class="icon-btn icon-btn--bare" data-view="' + x.id + '" title="Details">' + icon('book', 15) + '</button>' +
            '<button class="icon-btn icon-btn--bare" data-edit="' + x.id + '" title="Edit">' + icon('edit', 15) + '</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function viewDetails(id) {
    var x = App.store.get().sessions.filter(function (s) { return s.id === id; })[0];
    if (!x) return;
    App.ui.openModal({
      title: App.store.topicName(x.topicId),
      subtitle: U.fmtDate(x.date) + ' · ' + U.fmtDuration(x.durationMinutes) +
        (x.startTime ? ' · ' + x.startTime + '–' + (x.endTime || '?') : ''),
      bodyHtml:
        block('What I learned', x.learned) +
        block('What I struggled with', x.struggled) +
        block('Notes', x.notes) +
        '<div class="row" style="margin-top:14px">' +
          '<span class="badge badge--muted">' + U.pluralize(x.exercises || 0, 'exercise') + '</span>' +
          '<span class="badge badge--accent">confidence ' + x.confidence + '/5</span>' +
        '</div>',
      footerHtml: '<button class="btn" data-close>Close</button>' +
        '<button class="btn btn--primary" data-edit-session="' + x.id + '">Edit</button>',
      onMount: function (h) {
        h.root.querySelector('[data-edit-session]').addEventListener('click', function () {
          h.close();
          App.sessionControl.openForm(x.id);
        });
      }
    });
  }

  function block(label, text) {
    if (!text) return '';
    return '<div style="margin-bottom:12px"><div class="stat__label" style="margin-bottom:5px">' +
      U.escapeHtml(label) + '</div><div class="note-box">' + U.escapeHtml(text) + '</div></div>';
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var t;
      if (e.target.closest('[data-start]')) App.sessionControl.start();
      else if (e.target.closest('[data-log]')) App.sessionControl.openForm(null);
      else if ((t = e.target.closest('[data-edit]'))) App.sessionControl.openForm(t.getAttribute('data-edit'));
      else if ((t = e.target.closest('[data-view]'))) viewDetails(t.getAttribute('data-view'));
    });

    root.addEventListener('change', function (e) {
      if (e.target.matches('[data-phase]')) { filters.phase = e.target.value; App.router.refresh(); }
    });

    var q = root.querySelector('[data-q]');
    if (q) q.addEventListener('input', function () {
      filters.q = q.value;
      App.router.refresh();
      var again = document.querySelector('[data-q]');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
  }

  return { meta: meta, render: render };
})();
