/* ============================================================
   js/views/dashboard.js
   The landing page: where am I, what am I doing today, what is due.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

App.views.dashboard = (function () {
  'use strict';

  var U = App.utils, C = App.charts, P = App.progress, icon = App.icons;

  var meta = { title: 'Dashboard', subtitle: 'Where you are right now' };

  function render(root) {
    var s = App.store.get();
    var o = P.overall();
    var streak = P.streak();
    var phases = P.allPhaseStats();
    var currentPhase = P.currentPhase();
    var currentTopic = P.currentTopic();
    var due = App.review.dueTopics(s.topics);
    var overdue = App.review.overdueTopics(s.topics);
    var todayMinutes = P.minutesOnDate(U.today());
    var goalMinutes = s.settings.dailyGoalMinutes || 60;

    root.innerHTML =
      statRow(o, streak, s, todayMinutes, goalMinutes) +
      '<div class="grid grid--2 section">' +
        focusCard(currentPhase, currentTopic, s, todayMinutes, goalMinutes) +
        reviewCard(due, overdue) +
      '</div>' +
      phaseSection(phases) +
      '<div class="grid grid--2">' +
        recentSessionsCard() +
        attentionCard() +
      '</div>';

    wire(root);
  }

  /* ---------- Top stat tiles ---------- */

  function statRow(o, streak, s, todayMinutes, goalMinutes) {
    var hours = P.totalHours();
    var goalPct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

    return '<div class="grid grid--stats section">' +
      tile('Overall progress', o.percent + '%', o.completed + ' of ' + o.total + ' topics completed', 'accent') +
      tile('Current streak', streak.current + (streak.current === 1 ? ' day' : ' days'),
           'Longest ' + streak.longest + ' days', streak.current > 0 ? 'warn' : '') +
      tile('Learning sessions', String(s.sessions.length),
           P.sessionsThisWeek().length + ' this week', '') +
      tile('Total hours', String(hours), U.fmtDuration(P.totalMinutes()) + ' logged', '') +
      tile('Today', U.fmtDuration(todayMinutes), goalPct + '% of your ' + goalMinutes + 'm goal',
           todayMinutes >= goalMinutes ? 'ok' : '') +
    '</div>';
  }

  function tile(label, value, hint, tone) {
    return '<div class="stat' + (tone ? ' stat--' + tone : '') + '">' +
      '<span class="stat__label">' + U.escapeHtml(label) + '</span>' +
      '<span class="stat__value">' + U.escapeHtml(value) + '</span>' +
      '<span class="stat__hint">' + U.escapeHtml(hint) + '</span></div>';
  }

  /* ---------- Current focus ---------- */

  function focusCard(phase, topic, s, todayMinutes, goalMinutes) {
    var goal = s.dailyGoal && s.dailyGoal.date === U.today() ? s.dailyGoal : null;
    var goalPct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

    var topicHtml = topic
      ? '<div class="lrow" style="margin-top:8px">' +
          '<div class="lrow__main">' +
            '<div class="lrow__title">' + U.escapeHtml(topic.name) + '</div>' +
            '<div class="lrow__sub">' + U.escapeHtml((App.PHASE_BY_ID[topic.phaseId] || {}).name || '') +
              ' · U ' + topic.understanding + ' / C ' + topic.coding + ' / P ' + topic.problemSolving + '</div>' +
          '</div>' +
          App.ui.statusBadge(topic.status) +
          '<button class="btn btn--sm" data-edit-topic="' + topic.id + '">Open</button>' +
        '</div>'
      : '<p class="muted small" style="margin-top:8px">No topic in progress. Pick one from the Roadmap to begin.</p>';

    return '<div class="card">' +
      '<div class="card__head">' + icon('target', 16) + '<h2>Current focus</h2>' +
        '<button class="btn btn--sm spacer" data-pick-focus>Change topic</button></div>' +

      '<div class="row" style="justify-content:space-between">' +
        '<div><div class="stat__label">Phase</div>' +
          '<div style="font-weight:650;font-size:14px;margin-top:2px">' + U.escapeHtml(phase.name) + '</div></div>' +
        '<div style="text-align:right"><div class="stat__label">Phase progress</div>' +
          '<div style="font-weight:700;font-size:16px;margin-top:2px">' + phase.percent + '%</div></div>' +
      '</div>' +
      '<div style="margin:9px 0 2px">' + C.progressBar(phase.percent, phase.color) + '</div>' +
      '<div class="small faint">' + phase.completed + ' completed · ' + phase.remaining + ' remaining</div>' +

      '<div style="margin-top:14px"><div class="stat__label">Current topic</div>' + topicHtml + '</div>' +

      '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-soft)">' +
        '<div class="row"><div class="stat__label">Today\'s learning goal</div>' +
          '<button class="btn btn--sm btn--ghost spacer" data-edit-goal>' + icon('edit', 13) + ' Edit</button></div>' +
        (goal && goal.text
          ? '<label class="check-row" style="margin-top:6px;align-items:flex-start">' +
              '<input type="checkbox" data-goal-done ' + (goal.done ? 'checked' : '') + '>' +
              '<span style="' + (goal.done ? 'text-decoration:line-through;color:var(--text-faint)' : '') + '">' +
                U.escapeHtml(goal.text) + '</span></label>'
          : '<p class="muted small" style="margin-top:6px">No goal set for today. One sentence is enough.</p>') +
        '<div style="margin-top:12px" class="row">' +
          '<span class="small faint">Time today</span>' +
          '<span class="small tnum spacer">' + U.fmtDuration(todayMinutes) + ' / ' + goalMinutes + 'm</span>' +
        '</div>' +
        '<div style="margin-top:5px">' + C.progressBar(goalPct, todayMinutes >= goalMinutes ? 'var(--ok)' : 'var(--accent)') + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- Today's review ---------- */

  function reviewCard(due, overdue) {
    var body;
    if (!due.length) {
      body = '<div class="empty" style="padding:22px">' +
        '<h3>Nothing due today</h3><p>Reviews appear here when a topic\'s next review date arrives.</p></div>';
    } else {
      body = due.slice(0, 6).map(function (t) {
        var late = U.daysBetween(U.today(), t.nextReview) < 0;
        return '<div class="lrow">' +
          '<div class="lrow__main">' +
            '<div class="lrow__title">' + U.escapeHtml(t.name) + '</div>' +
            '<div class="lrow__sub">' + U.escapeHtml((App.PHASE_BY_ID[t.phaseId] || {}).name || '') + ' · ' +
              (late ? '<span style="color:var(--danger)">' + U.relativeDay(t.nextReview) + '</span>' : 'due today') +
            '</div>' +
          '</div>' +
          '<button class="btn btn--sm btn--primary" data-review="' + t.id + '">Review</button>' +
        '</div>';
      }).join('');
      if (due.length > 6) {
        body += '<p class="small faint" style="margin-top:9px">+ ' + (due.length - 6) + ' more in the Reviews page.</p>';
      }
    }

    return '<div class="card">' +
      '<div class="card__head">' + icon('refresh', 16) + '<h2>Today\'s review</h2>' +
        '<span class="spacer"></span>' +
        (overdue.length ? '<span class="badge badge--danger">' + overdue.length + ' overdue</span>' : '') +
        '<span class="badge badge--muted">' + due.length + ' due</span>' +
      '</div>' + body + '</div>';
  }

  /* ---------- Phase grid ---------- */

  function phaseSection(phases) {
    return '<div class="section">' +
      '<div class="section__head"><h2>Learning phases</h2>' +
        '<span class="spacer small faint">' + phases.length + ' phases · ' +
          U.sum(phases.map(function (p) { return p.total; })) + ' topics</span></div>' +
      '<div class="grid grid--phases">' +
        phases.map(phaseCard).join('') +
      '</div></div>';
  }

  function phaseCard(p) {
    var tone = p.percent === 100 ? 'ok' : p.percent === 0 ? 'muted' : p.percent >= 50 ? 'accent' : 'info';
    return '<button class="phase-card" data-phase="' + p.id + '">' +
      '<div class="phase-card__top">' +
        '<span class="phase-dot" style="background:' + p.color + '"></span>' +
        '<div style="min-width:0">' +
          '<div class="phase-card__name">' + U.escapeHtml(p.name) + '</div>' +
          '<span class="badge badge--' + tone + '" style="margin-top:4px">' + p.status + '</span>' +
        '</div>' +
        '<span class="phase-card__pct">' + p.percent + '%</span>' +
      '</div>' +
      C.progressBar(p.percent, p.color) +
      '<div class="phase-card__meta">' +
        '<span><b>' + p.completed + '</b> done</span>' +
        '<span><b>' + p.remaining + '</b> left</span>' +
        (p.inProgress ? '<span><b>' + p.inProgress + '</b> active</span>' : '') +
      '</div>' +
    '</button>';
  }

  /* ---------- Recent sessions ---------- */

  function recentSessionsCard() {
    var recent = P.recentSessions(5);
    var body = recent.length
      ? recent.map(function (x) {
          return '<div class="lrow">' +
            '<div class="lrow__main">' +
              '<div class="lrow__title">' + U.escapeHtml(App.store.topicName(x.topicId)) + '</div>' +
              '<div class="lrow__sub">' + U.fmtDate(x.date) + ' · ' + U.fmtDuration(x.durationMinutes) +
                (x.exercises ? ' · ' + U.pluralize(x.exercises, 'exercise') : '') + '</div>' +
            '</div>' +
            '<span class="badge badge--muted">confidence ' + x.confidence + '/5</span>' +
          '</div>';
        }).join('')
      : '<div class="empty" style="padding:22px"><h3>No sessions yet</h3>' +
        '<p>Press <b>Start session</b> in the header when you sit down to learn.</p></div>';

    return '<div class="card"><div class="card__head">' + icon('clock', 16) + '<h2>Recent sessions</h2>' +
      '<button class="btn btn--sm spacer" data-goto="sessions">View all</button></div>' + body + '</div>';
  }

  /* ---------- Needs attention ---------- */

  function attentionCard() {
    var weak = P.weakTopics().slice(0, 5);
    var retries = P.challengeStats().retriesDue;

    var body = '';
    if (weak.length) {
      body += '<div class="stat__label" style="margin-bottom:7px">Weak topics</div>' +
        weak.map(function (t) {
          var avg = P.averageScore(t);
          return '<div class="lrow">' +
            '<div class="lrow__main"><div class="lrow__title">' + U.escapeHtml(t.name) + '</div>' +
              '<div class="lrow__sub">' + U.escapeHtml((App.PHASE_BY_ID[t.phaseId] || {}).name || '') +
              ' · average ' + avg + '/5</div></div>' +
            C.pips(Math.round(avg), C.scoreTone(avg)) +
            '<button class="btn btn--sm" data-edit-topic="' + t.id + '">Open</button></div>';
        }).join('');
    }
    if (retries.length) {
      body += '<div class="stat__label" style="margin:14px 0 7px">Challenge retries due</div>' +
        retries.slice(0, 3).map(function (c) {
          return '<div class="lrow"><div class="lrow__main">' +
            '<div class="lrow__title">' + U.escapeHtml(c.name) + '</div>' +
            '<div class="lrow__sub">retry ' + U.relativeDay(c.retryDate) + '</div></div>' +
            '<button class="btn btn--sm" data-goto="challenges">Open</button></div>';
        }).join('');
    }
    if (!body) {
      body = '<div class="empty" style="padding:22px"><h3>Nothing flagged</h3>' +
        '<p>Topics scoring 2 or below and overdue challenge retries show up here.</p></div>';
    }

    return '<div class="card"><div class="card__head">' + icon('alert', 16) + '<h2>Needs attention</h2></div>' + body + '</div>';
  }

  /* ---------- Events ---------- */

  function wire(root) {
    root.addEventListener('click', function (e) {
      var t;

      if ((t = e.target.closest('[data-phase]'))) {
        App.router.go('roadmap', { phase: t.getAttribute('data-phase') });
      } else if ((t = e.target.closest('[data-edit-topic]'))) {
        App.topicForm.open(t.getAttribute('data-edit-topic'));
      } else if ((t = e.target.closest('[data-review]'))) {
        App.reviewFlow.open(t.getAttribute('data-review'));
      } else if ((t = e.target.closest('[data-goto]'))) {
        App.router.go(t.getAttribute('data-goto'));
      } else if (e.target.closest('[data-edit-goal]')) {
        editGoal();
      } else if (e.target.closest('[data-pick-focus]')) {
        pickFocus();
      }
    });

    root.addEventListener('change', function (e) {
      if (e.target.matches('[data-goal-done]')) {
        App.store.toggleDailyGoalDone();
      }
    });
  }

  function editGoal() {
    var s = App.store.get();
    var current = s.dailyGoal && s.dailyGoal.date === U.today() ? s.dailyGoal.text : '';
    App.ui.formModal({
      title: "Today's learning goal",
      subtitle: 'One specific, finishable thing for ' + U.fmtDate(U.today()),
      size: 'sm',
      fields: [{ name: 'text', label: 'Goal', type: 'textarea', rows: 3,
                 placeholder: 'e.g. Write 5 LINQ GroupBy queries with no AI help' }],
      values: { text: current },
      submitLabel: 'Set goal',
      onSubmit: function (v) {
        App.store.setDailyGoal(v.text);
        App.ui.toast('Goal set for today', 'ok');
      }
    });
  }

  function pickFocus() {
    App.ui.formModal({
      title: 'Set current topic',
      subtitle: 'Pin the topic the dashboard should show as your focus',
      size: 'sm',
      fields: [{ name: 'topicId', label: 'Topic', type: 'select',
                 options: [{ value: '', label: 'Automatic (most recently updated)' }].concat(App.ui.topicOptions()) }],
      values: { topicId: App.store.get().settings.focusTopicId || '' },
      submitLabel: 'Set focus',
      onSubmit: function (v) {
        App.store.setSetting('focusTopicId', v.topicId || null);
        App.ui.toast('Focus updated', 'ok');
      }
    });
  }

  return { meta: meta, render: render };
})();
