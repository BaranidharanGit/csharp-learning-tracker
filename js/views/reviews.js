/* ============================================================
   js/views/reviews.js
   The spaced-repetition queue plus App.reviewFlow, the small
   "how did that go?" dialog used from every page.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

/* ------------------------------------------------------------
   Review dialog
   ------------------------------------------------------------ */
App.reviewFlow = (function () {
  'use strict';

  var U = App.utils, R = App.review;

  function open(topicId) {
    var t = App.store.topicById(topicId);
    if (!t) { App.ui.toast('That topic no longer exists.', 'warn'); return; }

    var phase = App.PHASE_BY_ID[t.phaseId] || {};

    var buttons = R.QUALITIES.map(function (q) {
      var p = R.preview(t, q.id);
      return '<button type="button" class="rbtn rbtn--' + q.id + '" data-quality="' + q.id + '">' +
        '<strong>' + q.label + '</strong>' +
        '<small>' + q.hint + '</small>' +
        '<small style="margin-top:3px;font-weight:600">+' + p.days + 'd</small>' +
      '</button>';
    }).join('');

    var recall = '<p class="muted small" style="margin-bottom:12px">' +
      'Try to recall it <b>before</b> you look. Then rate how that went - the next review date is set for you.</p>';

    var context = '';
    if (t.notes) context += detail('Your notes', t.notes);
    if (t.mistakes) context += detail('Common mistakes', t.mistakes);

    App.ui.openModal({
      title: 'Review: ' + t.name,
      subtitle: (phase.name || '') +
        (t.lastReviewed ? ' · last reviewed ' + U.relativeDay(t.lastReviewed) : ' · never reviewed'),
      bodyHtml:
        recall +
        '<div class="review-actions">' + buttons + '</div>' +
        '<div style="margin-top:16px" class="field">' +
          '<label>Update status at the same time (optional)</label>' +
          '<select class="select" data-status-select>' +
            App.STATUSES.map(function (s) {
              return '<option value="' + s.id + '"' + (t.status === s.id ? ' selected' : '') + '>' + s.label + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        (context ? '<details style="margin-top:14px"><summary class="small muted" style="cursor:pointer">' +
          'Show your notes for this topic</summary><div style="margin-top:10px">' + context + '</div></details>' : ''),
      footerHtml: '<button class="btn" data-close>Cancel</button>' +
        '<button class="btn btn--sm left" data-open-topic>Edit topic</button>',
      onMount: function (h) {
        h.root.addEventListener('click', function (e) {
          var b = e.target.closest('[data-quality]');
          if (b) {
            var status = h.root.querySelector('[data-status-select]').value;
            apply(t.id, b.getAttribute('data-quality'), status);
            h.close();
            return;
          }
          if (e.target.closest('[data-open-topic]')) {
            h.close();
            App.topicForm.open(t.id);
          }
        });
      }
    });
  }

  function detail(label, text) {
    return '<div style="margin-bottom:10px"><div class="stat__label" style="margin-bottom:4px">' +
      U.escapeHtml(label) + '</div><div class="note-box">' + U.escapeHtml(text) + '</div></div>';
  }

  /** Apply a rating: move along the interval ladder and stamp the dates. */
  function apply(topicId, qualityId, newStatus) {
    var t = App.store.topicById(topicId);
    if (!t) return;
    var changes = App.review.applyTo(t, qualityId);
    if (newStatus) changes.status = newStatus;

    App.store.update(function (s) {
      var topic = s.topics.filter(function (x) { return x.id === topicId; })[0];
      if (topic) Object.assign(topic, changes, { updatedAt: U.today() });
    });

    App.ui.toast(t.name + ' → next review ' + U.fmtDate(changes.nextReview), 'ok');
  }

  return { open: open, apply: apply };
})();

/* ------------------------------------------------------------
   The Reviews page
   ------------------------------------------------------------ */
App.views.reviews = (function () {
  'use strict';

  var U = App.utils, R = App.review, icon = App.icons;

  var meta = { title: 'Reviews', subtitle: 'Spaced repetition, so what you learn stays learned' };

  function render(root) {
    var topics = App.store.get().topics;
    var due = R.dueTopics(topics);
    var overdue = R.overdueTopics(topics);
    var upcoming = R.upcomingTopics(topics, 14);
    var scheduled = topics.filter(function (t) { return !!t.nextReview; });

    // Topics you have started but never scheduled - easy to forget.
    var unscheduled = topics.filter(function (t) {
      return t.status !== 'not-started' && !t.nextReview;
    });

    var reviewedThisWeek = topics.filter(function (t) {
      return t.lastReviewed && t.lastReviewed >= U.startOfWeek(U.today());
    }).length;

    root.innerHTML =
      '<div class="grid grid--stats section">' +
        tile('Due today', String(due.length), due.length ? 'start with the oldest' : 'all clear', due.length ? 'accent' : '') +
        tile('Overdue', String(overdue.length), overdue.length ? 'these decay fastest' : 'nothing late', overdue.length ? 'danger' : 'ok') +
        tile('Next 14 days', String(upcoming.length), 'already scheduled') +
        tile('Reviewed this week', String(reviewedThisWeek), 'since ' + U.fmtDateShort(U.startOfWeek(U.today()))) +
        tile('On the schedule', String(scheduled.length), 'of ' + topics.length + ' topics') +
      '</div>' +

      '<div class="section"><div class="section__head"><h2>Due now</h2>' +
        '<span class="spacer"></span>' +
        (due.length > 1 ? '<button class="btn btn--sm btn--primary" data-review-all>Review them one by one</button>' : '') +
      '</div>' +
      (due.length
        ? '<div class="card">' + due.map(dueRow).join('') + '</div>'
        : App.ui.emptyState('Nothing due', 'Reviews you schedule will appear here on the day they are due.')) +
      '</div>' +

      (unscheduled.length ? '<div class="section"><div class="section__head"><h2>Started but not scheduled</h2>' +
        '<span class="spacer small faint">' + unscheduled.length + ' topics</span></div>' +
        '<div class="card">' + unscheduled.slice(0, 12).map(unscheduledRow).join('') +
        (unscheduled.length > 12 ? '<p class="small faint" style="margin-top:10px">+ ' +
          (unscheduled.length - 12) + ' more.</p>' : '') + '</div></div>' : '') +

      '<div class="grid grid--2">' +
        '<div class="card"><div class="card__head">' + icon('calendar', 16) + '<h2>Coming up</h2></div>' +
          (upcoming.length
            ? upcoming.slice(0, 12).map(function (t) {
                return '<div class="lrow"><div class="lrow__main">' +
                  '<div class="lrow__title">' + U.escapeHtml(t.name) + '</div>' +
                  '<div class="lrow__sub">' + U.escapeHtml((App.PHASE_BY_ID[t.phaseId] || {}).name || '') + '</div></div>' +
                  '<span class="badge badge--muted">' + U.relativeDay(t.nextReview) + '</span>' +
                  '<button class="btn btn--sm" data-review="' + t.id + '">Review early</button></div>';
              }).join('')
            : '<p class="muted small">Nothing scheduled in the next two weeks.</p>') +
        '</div>' +

        '<div class="card"><div class="card__head">' + icon('info', 16) + '<h2>How the schedule works</h2></div>' +
          '<p class="small muted">Every topic sits on a ladder of intervals. How you rate a review moves you along it:</p>' +
          '<div class="kv" style="margin-top:12px">' +
            '<dt>Ladder</dt><dd class="tnum">' + R.LADDER.join(' → ') + ' days</dd>' +
            '<dt>Difficult</dt><dd>back to the first rung (1 day)</dd>' +
            '<dt>Needs Practice</dt><dd>one rung down</dd>' +
            '<dt>Good</dt><dd>one rung up</dd>' +
            '<dt>Easy</dt><dd>two rungs up, then stretched by 1.3x</dd>' +
          '</div>' +
          '<p class="small faint" style="margin-top:12px">You can always override the next review date by editing the topic.</p>' +
        '</div>' +
      '</div>';

    wire(root);
  }

  function tile(label, value, hint, tone) {
    return '<div class="stat' + (tone ? ' stat--' + tone : '') + '">' +
      '<span class="stat__label">' + U.escapeHtml(label) + '</span>' +
      '<span class="stat__value">' + U.escapeHtml(value) + '</span>' +
      '<span class="stat__hint">' + U.escapeHtml(hint) + '</span></div>';
  }

  function dueRow(t) {
    var days = U.daysBetween(U.today(), t.nextReview);
    return '<div class="lrow">' +
      '<div class="lrow__main">' +
        '<div class="lrow__title">' + U.escapeHtml(t.name) + '</div>' +
        '<div class="lrow__sub">' + U.escapeHtml((App.PHASE_BY_ID[t.phaseId] || {}).name || '') +
          ' · ' + (t.reviewCount || 0) + ' previous reviews</div>' +
      '</div>' +
      App.ui.statusBadge(t.status) +
      (days < 0 ? '<span class="badge badge--danger">' + Math.abs(days) + 'd late</span>'
                : '<span class="badge badge--warn">today</span>') +
      '<button class="btn btn--sm btn--primary" data-review="' + t.id + '">Review</button>' +
    '</div>';
  }

  function unscheduledRow(t) {
    return '<div class="lrow">' +
      '<div class="lrow__main"><div class="lrow__title">' + U.escapeHtml(t.name) + '</div>' +
      '<div class="lrow__sub">' + U.escapeHtml((App.PHASE_BY_ID[t.phaseId] || {}).name || '') + '</div></div>' +
      App.ui.statusBadge(t.status) +
      '<button class="btn btn--sm" data-schedule="' + t.id + '">Schedule</button></div>';
  }

  /** Walk the due queue one topic at a time. */
  function reviewAll() {
    var queue = R.dueTopics(App.store.get().topics).map(function (t) { return t.id; });
    var i = 0;
    function next() {
      if (i >= queue.length) { App.ui.toast('Review queue finished.', 'ok'); App.router.refresh(); return; }
      var id = queue[i++];
      if (!App.store.topicById(id)) { next(); return; }
      App.reviewFlow.open(id);
      // Chain: when this dialog closes, open the next one.
      var backdrop = document.querySelector('.modal-backdrop:last-child');
      if (backdrop) {
        var observer = new MutationObserver(function () {
          if (!document.body.contains(backdrop)) { observer.disconnect(); setTimeout(next, 120); }
        });
        observer.observe(document.getElementById('modal-root'), { childList: true });
      }
    }
    next();
  }

  function scheduleTopic(id) {
    var t = App.store.topicById(id);
    if (!t) return;
    App.ui.formModal({
      title: 'Schedule a review',
      subtitle: t.name,
      size: 'sm',
      fields: [{ name: 'nextReview', label: 'Next review date', type: 'date', required: true }],
      values: { nextReview: U.addDays(U.today(), 3) },
      submitLabel: 'Schedule',
      onSubmit: function (v) {
        App.store.updateTopic(id, { nextReview: v.nextReview });
        App.ui.toast('Review scheduled for ' + U.fmtDate(v.nextReview), 'ok');
      }
    });
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-review]'))) App.reviewFlow.open(t.getAttribute('data-review'));
      else if ((t = e.target.closest('[data-schedule]'))) scheduleTopic(t.getAttribute('data-schedule'));
      else if (e.target.closest('[data-review-all]')) reviewAll();
    });
  }

  return { meta: meta, render: render };
})();
