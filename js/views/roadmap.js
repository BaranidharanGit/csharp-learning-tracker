/* ============================================================
   js/views/roadmap.js
   The whole curriculum at a glance: 12 collapsible phases, one
   chip per topic, coloured by status. Click a chip to edit it.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

App.views.roadmap = (function () {
  'use strict';

  var U = App.utils, C = App.charts, P = App.progress, icon = App.icons;

  var meta = { title: 'Roadmap', subtitle: 'The full curriculum, phase by phase' };

  // Which phases are expanded. Remembered while the app is open.
  var openPhases = {};
  var filters = { q: '', status: 'all' };

  function render(root) {
    var params = App.router.params();
    if (params.phase) openPhases[params.phase] = true;

    // First visit: open the phase you are currently working through.
    if (!Object.keys(openPhases).length) {
      openPhases[P.currentPhase().id] = true;
    }

    var phases = P.allPhaseStats();
    var o = P.overall();

    root.innerHTML =
      '<div class="card section">' +
        '<div class="row">' +
          '<div style="flex:1;min-width:220px">' +
            '<div class="stat__label">Overall roadmap progress</div>' +
            '<div class="row" style="gap:12px;margin-top:6px">' +
              '<span style="font-size:26px;font-weight:700" class="tnum">' + o.percent + '%</span>' +
              '<span class="small muted">' + o.completed + ' of ' + o.total + ' topics completed · ' +
                o.mastered + ' mastered</span>' +
            '</div>' +
            '<div style="margin-top:10px">' + statusDistribution(o.counts) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="toolbar">' +
        '<div class="search">' + icon('search', 15) +
          '<input class="input" type="search" placeholder="Search topics..." value="' +
            U.escapeHtml(filters.q) + '" data-q></div>' +
        '<select class="select" data-status style="max-width:190px">' +
          '<option value="all">All statuses</option>' +
          App.STATUSES.map(function (s) {
            return '<option value="' + s.id + '"' + (filters.status === s.id ? ' selected' : '') + '>' + s.label + '</option>';
          }).join('') +
        '</select>' +
        '<span class="spacer"></span>' +
        '<button class="btn btn--sm" data-expand-all>Expand all</button>' +
        '<button class="btn btn--sm" data-collapse-all>Collapse all</button>' +
      '</div>' +

      phases.map(phaseBlock).join('');

    wire(root);

    // Scroll a deep-linked phase into view.
    if (params.phase) {
      var el = root.querySelector('[data-phase-block="' + params.phase + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function statusDistribution(counts) {
    var segs = App.STATUSES.map(function (s) {
      return { label: s.label, value: counts[s.id] || 0, color: s.color };
    });
    return C.segmentedBar(segs) + '<div style="margin-top:8px">' + C.legend(segs) + '</div>';
  }

  function matches(topic) {
    if (filters.status !== 'all' && topic.status !== filters.status) return false;
    if (filters.q && topic.name.toLowerCase().indexOf(filters.q.toLowerCase()) === -1) return false;
    return true;
  }

  function phaseBlock(p) {
    var topics = App.store.topicsByPhase(p.id).filter(matches);
    var filtering = filters.q || filters.status !== 'all';
    // When filtering, only show phases that still have matches (and force them open).
    if (filtering && !topics.length) return '';
    var isOpen = filtering || openPhases[p.id];

    return '<div class="phase-block' + (isOpen ? ' is-open' : '') + '" data-phase-block="' + p.id + '">' +
      '<button class="phase-block__head" data-toggle="' + p.id + '">' +
        '<span class="phase-dot" style="background:' + p.color + ';margin-top:0"></span>' +
        '<div style="min-width:0;flex:1">' +
          '<h3>' + U.escapeHtml(p.name) + '</h3>' +
          '<div class="small faint">' + U.escapeHtml(p.blurb || '') + '</div>' +
        '</div>' +
        '<div style="width:110px;flex:0 0 auto">' + C.progressBar(p.percent, p.color) +
          '<div class="small faint tnum" style="margin-top:4px;text-align:right">' +
            p.completed + '/' + p.total + ' · ' + p.percent + '%</div></div>' +
        '<span class="chev">' + icon('chevron', 16) + '</span>' +
      '</button>' +
      '<div class="phase-block__body">' +
        '<div class="topic-chips">' +
          topics.map(topicChip).join('') +
          '<button class="tchip" data-add-to="' + p.id + '" style="border-style:dashed">' +
            icon('plus', 13) + ' Add topic</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function topicChip(t) {
    var s = App.STATUS_BY_ID[t.status] || App.STATUS_BY_ID['not-started'];
    var due = t.nextReview && U.daysBetween(U.today(), t.nextReview) <= 0;
    var title = s.label +
      ' · U' + t.understanding + ' C' + t.coding + ' P' + t.problemSolving +
      (t.nextReview ? ' · next review ' + U.fmtDate(t.nextReview) : '');
    return '<button class="tchip' + (due ? ' is-due' : '') + '" data-topic="' + t.id + '" title="' +
      U.escapeHtml(title) + '">' +
      '<i style="background:' + s.color + '"></i>' + U.escapeHtml(t.name) +
      (due ? ' ' + icon('refresh', 11) : '') + '</button>';
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-toggle]'))) {
        var id = t.getAttribute('data-toggle');
        openPhases[id] = !openPhases[id];
        t.parentElement.classList.toggle('is-open', !!openPhases[id]);
      } else if ((t = e.target.closest('[data-topic]'))) {
        App.topicForm.open(t.getAttribute('data-topic'));
      } else if ((t = e.target.closest('[data-add-to]'))) {
        App.topicForm.open(null, t.getAttribute('data-add-to'));
      } else if (e.target.closest('[data-expand-all]')) {
        App.ROADMAP.forEach(function (p) { openPhases[p.id] = true; });
        App.router.refresh();
      } else if (e.target.closest('[data-collapse-all]')) {
        openPhases = {};
        App.router.refresh();
      }
    });

    var q = root.querySelector('[data-q]');
    q.addEventListener('input', function () {
      filters.q = q.value;
      App.router.refresh();
      // Keep the caret in the search box after the re-render.
      var again = document.querySelector('[data-q]');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });

    root.querySelector('[data-status]').addEventListener('change', function (e) {
      filters.status = e.target.value;
      App.router.refresh();
    });
  }

  return { meta: meta, render: render };
})();
