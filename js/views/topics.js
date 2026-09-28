/* ============================================================
   js/views/topics.js
   The topic table (add / edit / filter / sort) plus App.topicForm,
   the add-and-edit dialog that every other page reuses.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

/* ------------------------------------------------------------
   Shared topic dialog - App.topicForm.open(topicId, defaultPhaseId)
   ------------------------------------------------------------ */
App.topicForm = (function () {
  'use strict';

  var U = App.utils;

  function fields() {
    return [
      { name: 'name', label: 'Topic name', type: 'text', required: true, full: false },
      { name: 'phaseId', label: 'Phase', type: 'select', options: App.ui.phaseOptions(), full: false },
      { name: 'status', label: 'Status', type: 'select', options: App.ui.statusOptions(), full: false },
      { name: 'understanding', label: 'Understanding (0-5)', type: 'range', min: 0, max: 5, full: false,
        hint: 'Can you explain it to someone else?' },
      { name: 'coding', label: 'Coding (0-5)', type: 'range', min: 0, max: 5, full: false,
        hint: 'Can you write it without looking it up?' },
      { name: 'problemSolving', label: 'Problem solving (0-5)', type: 'range', min: 0, max: 5, full: false,
        hint: 'Can you apply it to a problem you have not seen?' },
      { name: 'lastReviewed', label: 'Last reviewed', type: 'date', full: false },
      { name: 'nextReview', label: 'Next review', type: 'date', full: false },
      { name: 'notes', label: 'Notes', type: 'textarea', rows: 3,
        placeholder: 'Key points, mental models, links to your own code...' },
      { name: 'mistakes', label: 'Common mistakes', type: 'textarea', rows: 2,
        placeholder: 'What you keep getting wrong - the most valuable field on this form.' },
      { name: 'evidence', label: 'Evidence of mastery', type: 'textarea', rows: 2,
        placeholder: 'e.g. "Built X from scratch with no help on 12 Mar".' }
    ];
  }

  function open(topicId, defaultPhaseId) {
    var editing = topicId ? App.store.topicById(topicId) : null;

    var values = editing ? Object.assign({}, editing) : {
      name: '', phaseId: defaultPhaseId || App.progress.currentPhase().id,
      status: 'not-started', understanding: 0, coding: 0, problemSolving: 0,
      lastReviewed: '', nextReview: '', notes: '', mistakes: '', evidence: ''
    };

    var footerExtras = editing
      ? '<button type="button" class="btn btn--sm" data-mark-mastered>Mark mastered</button>' +
        '<button type="button" class="btn btn--sm" data-review-now>Review now</button>' +
        '<button type="button" class="btn btn--sm btn--outline-danger" data-delete>Delete</button>'
      : '';

    App.ui.formModal({
      title: editing ? editing.name : 'Add topic',
      subtitle: editing
        ? (App.PHASE_BY_ID[editing.phaseId] || {}).name +
          (editing.reviewCount ? ' · reviewed ' + editing.reviewCount + 'x' : '')
        : 'Add a topic of your own to any phase',
      size: 'wide',
      fields: fields(),
      values: values,
      submitLabel: editing ? 'Save changes' : 'Add topic',
      extraFooterHtml: footerExtras,
      onSubmit: function (v) {
        if (editing) {
          App.store.updateTopic(editing.id, v);
          App.ui.toast('Saved ' + v.name, 'ok');
        } else {
          App.store.addTopic(v);
          App.ui.toast('Added ' + v.name, 'ok');
        }
      },
      onFooterClick: function (e, handle) {
        if (!editing) return;

        if (e.target.closest('[data-mark-mastered]')) {
          App.store.updateTopic(editing.id, {
            status: 'mastered', understanding: 5, coding: 5, problemSolving: 5,
            lastReviewed: U.today(), nextReview: U.addDays(U.today(), 30)
          });
          handle.close();
          App.ui.toast(editing.name + ' marked as mastered', 'ok');
        }

        if (e.target.closest('[data-review-now]')) {
          handle.close();
          App.reviewFlow.open(editing.id);
        }

        if (e.target.closest('[data-delete]')) {
          App.ui.confirm({
            title: 'Delete topic?',
            message: '"' + editing.name + '" and its scores will be removed. Sessions that reference it are kept.',
            confirmLabel: 'Delete', danger: true
          }).then(function (ok) {
            if (!ok) return;
            App.store.deleteTopic(editing.id);
            handle.close();
            App.ui.toast('Topic deleted');
          });
        }
      }
    });
  }

  return { open: open };
})();

/* ------------------------------------------------------------
   The Topics page
   ------------------------------------------------------------ */
App.views.topics = (function () {
  'use strict';

  var U = App.utils, C = App.charts, P = App.progress, icon = App.icons;

  var meta = { title: 'Topics', subtitle: 'Every topic, its status and its scores' };

  var filters = { q: '', phase: 'all', status: 'all', sort: 'roadmap' };

  var SORTS = [
    { value: 'roadmap', label: 'Roadmap order' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'status', label: 'Status (furthest first)' },
    { value: 'weakest', label: 'Weakest score first' },
    { value: 'review', label: 'Next review soonest' },
    { value: 'updated', label: 'Recently updated' }
  ];

  function visibleTopics() {
    var list = App.store.sortedTopics().filter(function (t) {
      if (filters.phase !== 'all' && t.phaseId !== filters.phase) return false;
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      if (filters.q) {
        var hay = (t.name + ' ' + t.notes + ' ' + t.mistakes + ' ' + t.evidence).toLowerCase();
        if (hay.indexOf(filters.q.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var order = ['not-started', 'learning', 'practicing', 'comfortable', 'mastered'];
    switch (filters.sort) {
      case 'name':    list.sort(function (a, b) { return a.name.localeCompare(b.name); }); break;
      case 'status':  list.sort(function (a, b) { return order.indexOf(b.status) - order.indexOf(a.status); }); break;
      case 'weakest': list.sort(function (a, b) { return P.averageScore(a) - P.averageScore(b); }); break;
      case 'review':  list.sort(function (a, b) {
                        // Topics without a review date go last.
                        if (!a.nextReview) return 1;
                        if (!b.nextReview) return -1;
                        return a.nextReview.localeCompare(b.nextReview);
                      }); break;
      case 'updated': list.sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); }); break;
      default: break; // already in roadmap order
    }
    return list;
  }

  function render(root) {
    var list = visibleTopics();
    var o = P.overall();

    root.innerHTML =
      '<div class="toolbar">' +
        '<div class="search">' + icon('search', 15) +
          '<input class="input" type="search" placeholder="Search name, notes, mistakes..." value="' +
            U.escapeHtml(filters.q) + '" data-q></div>' +
        select('phase', [{ value: 'all', label: 'All phases' }].concat(App.ui.phaseOptions()), filters.phase) +
        select('status', [{ value: 'all', label: 'All statuses' }].concat(App.ui.statusOptions()), filters.status) +
        select('sort', SORTS, filters.sort) +
        '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-add>' + icon('plus', 15) + ' Add topic</button>' +
      '</div>' +

      '<div class="row small faint" style="margin-bottom:10px">' +
        '<span>Showing <b>' + list.length + '</b> of ' + o.total + ' topics</span>' +
        '<span class="spacer"></span>' +
        '<span>' + o.completed + ' completed · ' + o.counts.practicing + ' practicing · ' +
          o.counts.learning + ' learning</span>' +
      '</div>' +

      (list.length ? table(list)
        : App.ui.emptyState('No topics match', 'Try clearing the search or the filters.',
            '<button class="btn btn--sm" data-clear>Clear filters</button>'));

    wire(root);
  }

  function select(name, options, value) {
    return '<select class="select" data-filter="' + name + '" style="max-width:190px">' +
      options.map(function (o) {
        return '<option value="' + U.escapeHtml(o.value) + '"' +
          (String(o.value) === String(value) ? ' selected' : '') + '>' + U.escapeHtml(o.label) + '</option>';
      }).join('') + '</select>';
  }

  function table(list) {
    return '<div class="card card--pad-0"><div class="table-wrap"><table class="tbl">' +
      '<thead><tr>' +
        '<th>Topic</th><th>Phase</th><th>Status</th>' +
        '<th title="Understanding">Und.</th><th title="Coding">Code</th><th title="Problem solving">Solve</th>' +
        '<th>Last reviewed</th><th>Next review</th><th class="col-actions"></th>' +
      '</tr></thead><tbody>' +
      list.map(row).join('') +
      '</tbody></table></div></div>';
  }

  function row(t) {
    var phase = App.PHASE_BY_ID[t.phaseId] || { name: t.phaseId, color: 'var(--accent)' };
    var dueDays = t.nextReview ? U.daysBetween(U.today(), t.nextReview) : null;
    var nextCell = t.nextReview
      ? '<span class="' + (dueDays < 0 ? 'badge badge--danger' : dueDays === 0 ? 'badge badge--warn' : '') + '">' +
          U.fmtDateShort(t.nextReview) + (dueDays <= 0 ? '' : '') + '</span>'
      : '<span class="faint">—</span>';

    return '<tr data-row="' + t.id + '">' +
      '<td class="cell-name">' + U.escapeHtml(t.name) +
        (t.custom ? ' <span class="tag">custom</span>' : '') +
        (t.notes || t.mistakes ? ' <span class="faint" title="Has notes">' + icon('book', 12) + '</span>' : '') +
      '</td>' +
      '<td><span class="row row--tight"><i class="phase-dot" style="background:' + phase.color +
        ';margin-top:0"></i> <span class="small">' + U.escapeHtml(phase.name) + '</span></span></td>' +
      '<td>' + statusSelect(t) + '</td>' +
      '<td>' + C.pips(t.understanding, C.scoreTone(t.understanding)) + '</td>' +
      '<td>' + C.pips(t.coding, C.scoreTone(t.coding)) + '</td>' +
      '<td>' + C.pips(t.problemSolving, C.scoreTone(t.problemSolving)) + '</td>' +
      '<td class="small faint">' + (t.lastReviewed ? U.fmtDateShort(t.lastReviewed) : '—') + '</td>' +
      '<td class="small">' + nextCell + '</td>' +
      '<td class="col-actions">' +
        '<button class="icon-btn icon-btn--bare" data-review="' + t.id + '" title="Review now">' + icon('refresh', 15) + '</button>' +
        '<button class="icon-btn icon-btn--bare" data-edit="' + t.id + '" title="Edit">' + icon('edit', 15) + '</button>' +
        '<button class="icon-btn icon-btn--bare icon-btn--danger" data-del="' + t.id + '" title="Delete">' + icon('trash', 15) + '</button>' +
      '</td>' +
    '</tr>';
  }

  /** Inline status change straight from the table - the fastest common edit. */
  function statusSelect(t) {
    return '<select class="select select--sm" data-status-for="' + t.id + '">' +
      App.STATUSES.map(function (s) {
        return '<option value="' + s.id + '"' + (t.status === s.id ? ' selected' : '') + '>' + s.label + '</option>';
      }).join('') + '</select>';
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-edit]'))) App.topicForm.open(t.getAttribute('data-edit'));
      else if ((t = e.target.closest('[data-review]'))) App.reviewFlow.open(t.getAttribute('data-review'));
      else if ((t = e.target.closest('[data-del]'))) confirmDelete(t.getAttribute('data-del'));
      else if (e.target.closest('[data-add]')) App.topicForm.open(null, filters.phase !== 'all' ? filters.phase : null);
      else if (e.target.closest('[data-clear]')) {
        filters = { q: '', phase: 'all', status: 'all', sort: 'roadmap' };
        App.router.refresh();
      }
    });

    root.addEventListener('change', function (e) {
      if (e.target.matches('[data-status-for]')) {
        var id = e.target.getAttribute('data-status-for');
        App.store.updateTopic(id, { status: e.target.value });
        App.ui.toast(App.store.topicName(id) + ' → ' + App.STATUS_BY_ID[e.target.value].label, 'ok', 1600);
      } else if (e.target.matches('[data-filter]')) {
        filters[e.target.getAttribute('data-filter')] = e.target.value;
        App.router.refresh();
      }
    });

    var q = root.querySelector('[data-q]');
    if (q) {
      q.addEventListener('input', function () {
        filters.q = q.value;
        App.router.refresh();
        var again = document.querySelector('[data-q]');
        if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
      });
    }
  }

  function confirmDelete(id) {
    var t = App.store.topicById(id);
    if (!t) return;
    App.ui.confirm({
      title: 'Delete topic?',
      message: '"' + t.name + '" will be removed from your tracker. You can restore deleted roadmap topics from Settings.',
      confirmLabel: 'Delete', danger: true
    }).then(function (ok) {
      if (ok) { App.store.deleteTopic(id); App.ui.toast('Topic deleted'); }
    });
  }

  return { meta: meta, render: render };
})();
