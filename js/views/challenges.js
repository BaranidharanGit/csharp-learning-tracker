/* ============================================================
   js/views/challenges.js
   "No-Help Challenges" - problems solved with no AI, no docs,
   no copy/paste. The honest measure of whether you can actually
   do the thing.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

App.views.challenges = (function () {
  'use strict';

  var U = App.utils, P = App.progress, icon = App.icons;

  var meta = { title: 'No-Help Challenges', subtitle: 'Can you solve it without help? Prove it here.' };

  var DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
  var filters = { q: '', outcome: 'all', difficulty: 'all' };

  /* ---------- Add / edit dialog ---------- */

  function openForm(id) {
    var editing = id ? App.store.get().challenges.filter(function (c) { return c.id === id; })[0] : null;

    var values = editing || {
      name: '', date: U.today(), topicId: '', difficulty: 'Medium',
      outcome: 'completed', timeTakenMinutes: 20, notes: '', gotWrong: '', retryDate: ''
    };

    App.ui.formModal({
      title: editing ? 'Edit challenge' : 'Log a no-help challenge',
      subtitle: 'No AI, no docs, no copy/paste. Record what really happened.',
      size: 'wide',
      fields: [
        { name: 'name', label: 'Challenge', type: 'text', required: true,
          placeholder: 'e.g. Implement a generic Stack<T> from scratch' },
        { name: 'date', label: 'Date attempted', type: 'date', required: true, full: false },
        { name: 'topicId', label: 'Topic', type: 'select', full: false,
          options: [{ value: '', label: '— not linked —' }].concat(App.ui.topicOptions()) },
        { name: 'difficulty', label: 'Difficulty', type: 'select', full: false,
          options: DIFFICULTIES.map(function (d) { return { value: d, label: d }; }) },
        { name: 'outcome', label: 'Result', type: 'select', full: false,
          options: [{ value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }] },
        { name: 'timeTakenMinutes', label: 'Time taken (minutes)', type: 'number', min: 0, max: 600, full: false },
        { name: 'retryDate', label: 'Retry on', type: 'date', full: false,
          hint: 'Failed it? Book the rematch now.' },
        { name: 'gotWrong', label: 'What I got wrong', type: 'textarea', rows: 2,
          placeholder: 'Be specific - this is the part worth re-reading later.' },
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 }
      ],
      values: values,
      submitLabel: editing ? 'Save changes' : 'Save challenge',
      extraFooterHtml: editing
        ? '<button type="button" class="btn btn--sm btn--outline-danger" data-delete>Delete</button>' : '',
      onSubmit: function (v) {
        if (editing) { App.store.updateChallenge(editing.id, v); App.ui.toast('Challenge updated', 'ok'); }
        else { App.store.addChallenge(v); App.ui.toast('Challenge logged', 'ok'); }
      },
      onFooterClick: function (e, handle) {
        if (editing && e.target.closest('[data-delete]')) {
          App.ui.confirm({ title: 'Delete challenge?', message: editing.name, confirmLabel: 'Delete', danger: true })
            .then(function (ok) {
              if (!ok) return;
              App.store.deleteChallenge(editing.id);
              handle.close();
              App.ui.toast('Challenge deleted');
            });
        }
      }
    });
  }

  /* ---------- Page ---------- */

  function visible() {
    return App.store.get().challenges.slice()
      .filter(function (c) {
        if (filters.outcome !== 'all' && c.outcome !== filters.outcome) return false;
        if (filters.difficulty !== 'all' && c.difficulty !== filters.difficulty) return false;
        if (filters.q) {
          var hay = (c.name + ' ' + c.notes + ' ' + c.gotWrong + ' ' + App.store.topicName(c.topicId)).toLowerCase();
          if (hay.indexOf(filters.q.toLowerCase()) === -1) return false;
        }
        return true;
      })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }

  function render(root) {
    var stats = P.challengeStats();
    var list = visible();

    root.innerHTML =
      '<div class="grid grid--stats section">' +
        tile('Attempts', String(stats.total), 'logged in total') +
        tile('Success rate', stats.successRate + '%', stats.completed + ' completed, ' + stats.failed + ' failed',
             stats.successRate >= 70 ? 'ok' : stats.successRate >= 40 ? 'warn' : 'danger') +
        tile('Average time', U.fmtDuration(stats.avgMinutes), 'per attempt') +
        tile('Retries due', String(stats.retriesDue.length),
             stats.retriesDue.length ? 'book them in' : 'nothing waiting',
             stats.retriesDue.length ? 'warn' : '') +
      '</div>' +

      (stats.retriesDue.length
        ? '<div class="section"><div class="section__head"><h2>Retries due</h2></div><div class="card">' +
          stats.retriesDue.map(function (c) {
            return '<div class="lrow"><div class="lrow__main">' +
              '<div class="lrow__title">' + U.escapeHtml(c.name) + '</div>' +
              '<div class="lrow__sub">failed ' + U.relativeDay(c.date) +
                (c.gotWrong ? ' · ' + U.escapeHtml(c.gotWrong) : '') + '</div></div>' +
              '<span class="badge badge--warn">retry ' + U.relativeDay(c.retryDate) + '</span>' +
              '<button class="btn btn--sm btn--primary" data-retry="' + c.id + '">Log retry</button>' +
              '</div>';
          }).join('') + '</div></div>'
        : '') +

      '<div class="toolbar">' +
        '<div class="search">' + icon('search', 15) +
          '<input class="input" type="search" placeholder="Search challenges..." value="' +
            U.escapeHtml(filters.q) + '" data-q></div>' +
        '<select class="select" data-filter="outcome" style="max-width:160px">' +
          opt('all', 'All results', filters.outcome) +
          opt('completed', 'Completed', filters.outcome) +
          opt('failed', 'Failed', filters.outcome) +
        '</select>' +
        '<select class="select" data-filter="difficulty" style="max-width:160px">' +
          opt('all', 'All difficulties', filters.difficulty) +
          DIFFICULTIES.map(function (d) { return opt(d, d, filters.difficulty); }).join('') +
        '</select>' +
        '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-add>' + icon('plus', 15) + ' Log challenge</button>' +
      '</div>' +

      (list.length ? table(list)
        : App.ui.emptyState('No challenges logged',
            'Pick a problem, close every tab, set a timer and see what happens. Then log it honestly.',
            '<button class="btn btn--primary btn--sm" data-add>Log your first challenge</button>'));

    wire(root);
  }

  function opt(value, label, current) {
    return '<option value="' + U.escapeHtml(value) + '"' +
      (String(value) === String(current) ? ' selected' : '') + '>' + U.escapeHtml(label) + '</option>';
  }

  function tile(label, value, hint, tone) {
    return '<div class="stat' + (tone ? ' stat--' + tone : '') + '">' +
      '<span class="stat__label">' + U.escapeHtml(label) + '</span>' +
      '<span class="stat__value">' + U.escapeHtml(value) + '</span>' +
      '<span class="stat__hint">' + U.escapeHtml(hint) + '</span></div>';
  }

  function table(list) {
    return '<div class="card card--pad-0"><div class="table-wrap"><table class="tbl">' +
      '<thead><tr><th>Challenge</th><th>Date</th><th>Topic</th><th>Difficulty</th>' +
      '<th>Result</th><th>Time</th><th>What I got wrong</th><th>Retry</th><th class="col-actions"></th></tr></thead><tbody>' +
      list.map(function (c) {
        var diffTone = c.difficulty === 'Hard' ? 'danger' : c.difficulty === 'Medium' ? 'warn' : 'muted';
        return '<tr>' +
          '<td class="cell-name">' + U.escapeHtml(c.name) + '</td>' +
          '<td class="small faint">' + U.fmtDateShort(c.date) + '</td>' +
          '<td class="small">' + U.escapeHtml(App.store.topicName(c.topicId)) + '</td>' +
          '<td><span class="badge badge--' + diffTone + '">' + U.escapeHtml(c.difficulty) + '</span></td>' +
          '<td><span class="badge badge--' + (c.outcome === 'completed' ? 'ok' : 'danger') + '">' +
            (c.outcome === 'completed' ? 'Completed' : 'Failed') + '</span></td>' +
          '<td class="tnum small">' + U.fmtDuration(c.timeTakenMinutes) + '</td>' +
          '<td class="small muted" style="max-width:260px"><div class="truncate">' +
            U.escapeHtml(c.gotWrong || '—') + '</div></td>' +
          '<td class="small">' + (c.retryDate
            ? '<span class="badge badge--' + (U.daysBetween(U.today(), c.retryDate) <= 0 ? 'warn' : 'muted') + '">' +
              U.fmtDateShort(c.retryDate) + '</span>'
            : '<span class="faint">—</span>') + '</td>' +
          '<td class="col-actions">' +
            '<button class="icon-btn icon-btn--bare" data-edit="' + c.id + '" title="Edit">' + icon('edit', 15) + '</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  /** Logging a retry pre-fills a new attempt from the failed one. */
  function logRetry(id) {
    var c = App.store.get().challenges.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    App.ui.formModal({
      title: 'Retry: ' + c.name,
      subtitle: 'Last time: ' + (c.gotWrong || 'no notes recorded'),
      size: 'wide',
      fields: [
        { name: 'name', label: 'Challenge', type: 'text', required: true },
        { name: 'date', label: 'Date attempted', type: 'date', required: true, full: false },
        { name: 'difficulty', label: 'Difficulty', type: 'select', full: false,
          options: DIFFICULTIES.map(function (d) { return { value: d, label: d }; }) },
        { name: 'outcome', label: 'Result', type: 'select', full: false,
          options: [{ value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }] },
        { name: 'timeTakenMinutes', label: 'Time taken (minutes)', type: 'number', min: 0, max: 600, full: false },
        { name: 'gotWrong', label: 'What I got wrong', type: 'textarea', rows: 2 },
        { name: 'retryDate', label: 'Retry again on', type: 'date', full: false }
      ],
      values: {
        name: c.name, date: U.today(), difficulty: c.difficulty,
        outcome: 'completed', timeTakenMinutes: 0, gotWrong: '', retryDate: ''
      },
      submitLabel: 'Save retry',
      onSubmit: function (v) {
        App.store.addChallenge(Object.assign({ topicId: c.topicId, notes: 'Retry of an earlier attempt.' }, v));
        // The original no longer needs a retry booked.
        App.store.updateChallenge(c.id, Object.assign({}, c, { retryDate: '' }));
        App.ui.toast('Retry logged', 'ok');
      }
    });
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var t;
      if (e.target.closest('[data-add]')) openForm(null);
      else if ((t = e.target.closest('[data-edit]'))) openForm(t.getAttribute('data-edit'));
      else if ((t = e.target.closest('[data-retry]'))) logRetry(t.getAttribute('data-retry'));
    });

    root.addEventListener('change', function (e) {
      if (e.target.matches('[data-filter]')) {
        filters[e.target.getAttribute('data-filter')] = e.target.value;
        App.router.refresh();
      }
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
