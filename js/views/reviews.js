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

  var U = App.utils, R = App.review, icon = App.icons;

  /**
   * Reviewing is retrieval practice, not re-reading. If the topic has a
   * lesson, we ask a couple of its knowledge-check questions first and only
   * then offer the difficulty rating.
   */
  function open(topicId, skipRetrieval) {
    var t = App.store.topicById(topicId);
    if (!t) { App.ui.toast('That topic no longer exists.', 'warn'); return; }

    var lesson = App.lessons.get(topicId);
    if (!skipRetrieval && lesson && lesson.knowledgeChecks.length) {
      retrievalTest(t, lesson);
      return;
    }

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

  /** Pick `count` questions, rotating by how many times this topic has been reviewed. */
  function pickQuestions(lesson, count, offset) {
    var qs = lesson.knowledgeChecks;
    var out = [];
    for (var i = 0; i < Math.min(count, qs.length); i++) {
      out.push(qs[(offset + i) % qs.length]);
    }
    return out;
  }

  function retrievalTest(topic, lesson) {
    var questions = pickQuestions(lesson, 2, topic.reviewCount || 0);
    var answers = {};

    function questionHtml(q, i) {
      var input;
      if (q.type === 'mcq') {
        input = '<div class="opts">' + (q.options || []).map(function (o, oi) {
          return '<label class="opt"><input type="radio" name="rt-' + i + '" ' +
            'data-rt="' + U.escapeHtml(q.id) + '" value="' + oi + '"><span>' +
            U.escapeHtml(o).replace(/`([^`]+)`/g, '<code>$1</code>') + '</span></label>';
        }).join('') + '</div>';
      } else {
        input = '<input type="text" class="input" data-rt="' + U.escapeHtml(q.id) +
          '" placeholder="From memory - do not look it up">';
      }
      return '<div class="kc__q">' +
        '<div class="kc__num">Recall ' + (i + 1) + ' of ' + questions.length + '</div>' +
        '<div class="kc__prompt">' + U.escapeHtml(q.prompt) + '</div>' +
        (q.code ? App.highlight.block(q.code, { copy: false }) : '') +
        input + '</div>';
    }

    App.ui.openModal({
      title: 'Review: ' + topic.name,
      subtitle: 'Retrieval practice - answer before you rate yourself',
      bodyHtml:
        '<p class="small muted" style="margin-bottom:10px">Re-reading feels like learning but is not. ' +
          'Answer these from memory first - getting one wrong is far more useful than getting it right.</p>' +
        questions.map(questionHtml).join('') +
        '<div id="rt-result"></div>',
      footerHtml:
        '<button class="btn left btn--sm" data-skip-retrieval>Skip to rating</button>' +
        '<button class="btn" data-close>Cancel</button>' +
        '<button class="btn btn--primary" data-rt-check>Check my answers</button>',
      onMount: function (h) {
        h.root.addEventListener('change', function (e) {
          var id = e.target.getAttribute && e.target.getAttribute('data-rt');
          if (id) answers[id] = e.target.value;
        });
        h.root.addEventListener('input', function (e) {
          var id = e.target.getAttribute && e.target.getAttribute('data-rt');
          if (id) answers[id] = e.target.value;
        });

        h.root.querySelector('[data-skip-retrieval]').addEventListener('click', function () {
          h.close();
          open(topic.id, true);
        });

        h.root.querySelector('[data-rt-check]').addEventListener('click', function () {
          var correct = 0;
          var rows = questions.map(function (q) {
            var given = q.type === 'mcq' ? Number(answers[q.id]) : (answers[q.id] || '');
            var r = App.exercises.evaluate(q, given);
            if (r.passed) correct += 1;
            return '<li class="' + (r.passed ? 'ok' : 'no') + '"><span class="mark">' +
              icon(r.passed ? 'check' : 'x', 13) + '</span><span>' +
              U.escapeHtml(q.prompt.slice(0, 70)) + (q.prompt.length > 70 ? '…' : '') +
              (q.explanation ? '<br><span class="faint">' + U.escapeHtml(q.explanation) + '</span>' : '') +
              '</span></li>';
          }).join('');

          h.root.querySelector('#rt-result').innerHTML =
            '<div class="feedback ' + (correct === questions.length ? 'feedback--pass' : 'feedback--fail') +
              '" style="margin-top:14px">' +
              '<div class="feedback__head">' + icon(correct === questions.length ? 'check' : 'alert', 15) +
                '<span>' + correct + ' of ' + questions.length + ' recalled</span></div>' +
              '<ul class="feedback__list">' + rows + '</ul>' +
              '<p class="small" style="margin-top:10px">Now rate how that felt - be honest, the schedule depends on it.</p>' +
            '</div>';

          // Record the retrieval attempt, then move on to the rating.
          App.store.updateLearning(topic.id, function (L) {
            L.knowledgeCheck.attempts += 1;
            var score = Math.round((correct / questions.length) * 100);
            L.knowledgeCheck.bestScore = Math.max(L.knowledgeCheck.bestScore, score);
            L.knowledgeCheck.lastAt = U.today();
          });

          var footer = h.root.querySelector('.modal__foot');
          footer.innerHTML = '<button class="btn btn--primary" data-rt-continue>Rate difficulty</button>';
          footer.querySelector('[data-rt-continue]').addEventListener('click', function () {
            h.close();
            open(topic.id, true);
          });
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
