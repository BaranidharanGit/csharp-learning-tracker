/* ============================================================
   js/views/statistics.js
   The detailed progress page: overall, per phase, per topic list,
   time charts and the activity heatmap.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

App.views.statistics = (function () {
  'use strict';

  var U = App.utils, C = App.charts, P = App.progress, R = App.review, icon = App.icons;

  var meta = { title: 'Statistics', subtitle: 'Progress in detail, with the charts to back it up' };

  function render(root) {
    var s = App.store.get();
    var o = P.overall();
    var phases = P.allPhaseStats();
    var streak = P.streak();
    var weekly = P.weeklyHours(12);
    var daily = P.dailyMinutes(182);          // 26 weeks for the heatmap
    var overdue = R.overdueTopics(s.topics);
    var weak = P.weakTopics();
    var completed = P.completedTopics();
    var practicing = P.practicingTopics();

    root.innerHTML =
      headline(o, streak, s) +
      investedVsDemonstrated() +
      overviewSection(o, phases) +
      skillSection() +
      phaseTable(phases) +
      timeSection(weekly, daily) +
      listsSection(completed, practicing, weak, overdue) +
      recentSection();

    root.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-edit-topic]'))) App.topicForm.open(t.getAttribute('data-edit-topic'));
      else if ((t = e.target.closest('[data-review]'))) App.reviewFlow.open(t.getAttribute('data-review'));
      else if ((t = e.target.closest('[data-phase]'))) App.router.go('roadmap', { phase: t.getAttribute('data-phase') });
    });
  }

  /* ---------- Headline numbers ---------- */

  function headline(o, streak, s) {
    var minutes = P.totalMinutes();
    var weekMinutes = U.sum(P.sessionsThisWeek().map(function (x) { return x.durationMinutes || 0; }));
    return '<div class="grid grid--stats section">' +
      tile('Overall progress', o.percent + '%', o.completed + ' of ' + o.total + ' completed', 'accent') +
      tile('Mastered', String(o.mastered), 'topics at full confidence', 'ok') +
      tile('Total hours', String(U.toHours(minutes)), U.pluralize(s.sessions.length, 'session')) +
      tile('This week', U.fmtDuration(weekMinutes), 'since ' + U.fmtDateShort(U.startOfWeek(U.today()))) +
      tile('Streak', streak.current + 'd', 'longest ' + streak.longest + 'd', streak.current ? 'warn' : '') +
      tile('Challenges', String(P.challengeStats().successRate) + '%', 'no-help success rate') +
    '</div>';
  }

  function tile(label, value, hint, tone) {
    return '<div class="stat' + (tone ? ' stat--' + tone : '') + '">' +
      '<span class="stat__label">' + U.escapeHtml(label) + '</span>' +
      '<span class="stat__value">' + U.escapeHtml(value) + '</span>' +
      '<span class="stat__hint">' + U.escapeHtml(hint) + '</span></div>';
  }

  /* ---------- Time invested vs skill demonstrated ---------- */

  function investedVsDemonstrated() {
    var m = App.mastery.metrics();
    var o = P.overall();
    var minutes = P.totalMinutes();
    var hoursByPhase = phaseHours();

    return '<div class="grid grid--2 section">' +
      '<div class="card">' +
        '<div class="card__head">' + icon('clock', 16) + '<h2>Time invested</h2></div>' +
        '<p class="small faint" style="margin-bottom:12px">How long you have spent. Necessary, but not evidence ' +
          'of anything on its own.</p>' +
        '<div class="grid grid--stats" style="gap:12px">' +
          kv('Total hours', String(U.toHours(minutes))) +
          kv('Sessions', String(App.store.get().sessions.length)) +
          kv('Topics opened', String(m.lessonsViewed)) +
          kv('Avg session', U.fmtDuration(App.store.get().sessions.length
            ? Math.round(minutes / App.store.get().sessions.length) : 0)) +
        '</div>' +
        '<div class="stat__label" style="margin:16px 0 8px">Hours by phase</div>' +
        (hoursByPhase.length
          ? hoursByPhase.map(function (row) {
              return '<div class="row small" style="margin-bottom:6px">' +
                '<span class="phase-dot" style="background:' + row.color + ';margin-top:0"></span>' +
                '<span>' + U.escapeHtml(row.name) + '</span>' +
                '<span class="spacer tnum">' + row.hours + 'h</span></div>';
            }).join('')
          : '<p class="small faint">No sessions linked to a topic yet.</p>') +
      '</div>' +

      '<div class="card">' +
        '<div class="card__head">' + icon('award', 16) + '<h2>Skill demonstrated</h2></div>' +
        '<p class="small faint" style="margin-bottom:12px">What you have actually proved you can do. This is the ' +
          'number that matters.</p>' +
        '<div class="grid grid--stats" style="gap:12px">' +
          kv('Topics demonstrated', String(m.demonstratedTopics), 'ok') +
          kv('Exercises passed', String(m.exercisesPassed), 'ok') +
          kv('Solved unaided', String(m.independentSolves), 'ok') +
          kv('Challenges passed', String(m.challengesPassed), 'ok') +
        '</div>' +
        '<div class="grid grid--stats" style="gap:12px;margin-top:12px">' +
          kv('Checks passed', String(m.checksPassed)) +
          kv('Bugs fixed', String(m.debugPassed)) +
          kv('Hints used', String(m.hintsUsed), m.hintsUsed > m.exercisesPassed ? 'warn' : '') +
          kv('Solutions viewed', String(m.solutionsViewed), m.solutionsViewed > 5 ? 'warn' : '') +
        '</div>' +
        '<div style="margin-top:16px">' +
          '<div class="row small faint" style="margin-bottom:5px">' +
            '<span>Opened vs demonstrated</span>' +
            '<span class="spacer tnum">' + m.demonstratedTopics + ' / ' + m.lessonsViewed + '</span></div>' +
          C.progressBar(m.lessonsViewed ? Math.round((m.demonstratedTopics / m.lessonsViewed) * 100) : 0,
                        'var(--ok)') +
          '<p class="small faint" style="margin-top:8px">A big gap here means you are reading more than you are ' +
            'practising.</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function kv(label, value, tone) {
    return '<div><div class="stat__label">' + U.escapeHtml(label) + '</div>' +
      '<div style="font-size:20px;font-weight:700;margin-top:2px' +
      (tone === 'ok' ? ';color:var(--ok)' : tone === 'warn' ? ';color:var(--warn)' : '') +
      '" class="tnum">' + U.escapeHtml(value) + '</div></div>';
  }

  /** Minutes logged against each phase, via each session's topic. */
  function phaseHours() {
    var byPhase = {};
    App.store.get().sessions.forEach(function (x) {
      var t = App.store.topicById(x.topicId);
      if (!t) return;
      byPhase[t.phaseId] = (byPhase[t.phaseId] || 0) + (x.durationMinutes || 0);
    });
    return App.ROADMAP
      .filter(function (p) { return byPhase[p.id]; })
      .map(function (p) {
        return { name: p.name, color: p.color, hours: U.toHours(byPhase[p.id]) };
      })
      .sort(function (a, b) { return b.hours - a.hours; });
  }

  /* ---------- Average skill scores across all started topics ---------- */

  function skillSection() {
    var topics = App.store.get().topics.filter(function (t) { return t.status !== 'not-started'; });
    if (!topics.length) return '';

    var skills = [
      { key: 'understanding', label: 'Understanding' },
      { key: 'coding', label: 'Coding' },
      { key: 'problemSolving', label: 'Problem solving' },
      { key: 'debugging', label: 'Debugging' }
    ].map(function (sk) {
      sk.avg = U.round(U.avg(topics.map(function (t) { return t[sk.key] || 0; })), 1);
      return sk;
    });

    var sorted = skills.slice().sort(function (a, b) { return b.avg - a.avg; });
    var strongest = sorted[0];
    var weakest = sorted[sorted.length - 1];

    return '<div class="card section">' +
      '<div class="card__head">' + icon('statistics', 16) + '<h2>Skill profile</h2>' +
        '<span class="spacer small faint">averaged over ' + topics.length + ' started topics</span></div>' +
      skills.map(function (sk) {
        return '<div style="margin-bottom:12px">' +
          '<div class="row small" style="margin-bottom:5px">' +
            '<span>' + U.escapeHtml(sk.label) + '</span>' +
            '<span class="spacer tnum">' + sk.avg + ' / 5</span></div>' +
          C.progressBar((sk.avg / 5) * 100,
            sk.key === weakest.key ? 'var(--warn)' : sk.key === strongest.key ? 'var(--ok)' : 'var(--accent)') +
        '</div>';
      }).join('') +
      '<div class="row" style="margin-top:6px">' +
        '<span class="badge badge--ok">Strongest: ' + U.escapeHtml(strongest.label) + '</span>' +
        '<span class="badge badge--warn">Weakest: ' + U.escapeHtml(weakest.label) + '</span>' +
      '</div>' +
    '</div>';
  }

  /* ---------- Donut + distribution ---------- */

  function overviewSection(o, phases) {
    var segs = App.STATUSES.map(function (st) {
      return { label: st.label, value: o.counts[st.id] || 0, color: st.color };
    });

    var phaseBars = phases.map(function (p) {
      return '<button class="lrow" data-phase="' + p.id + '" style="width:100%;cursor:pointer;text-align:left;border:1px solid var(--border-soft)">' +
        '<span class="phase-dot" style="background:' + p.color + ';margin-top:0"></span>' +
        '<div class="lrow__main">' +
          '<div class="row" style="gap:8px"><span class="lrow__title">' + U.escapeHtml(p.name) + '</span>' +
            '<span class="spacer small tnum faint">' + p.completed + '/' + p.total + '</span>' +
            '<span class="small tnum" style="font-weight:700;min-width:38px;text-align:right">' + p.percent + '%</span></div>' +
          '<div style="margin-top:6px">' + C.progressBar(p.percent, p.color) + '</div>' +
        '</div></button>';
    }).join('');

    return '<div class="grid grid--2 section">' +
      '<div class="card">' +
        '<div class="card__head">' + icon('statistics', 16) + '<h2>Overall progress</h2></div>' +
        '<div class="row" style="justify-content:center;margin:6px 0 14px">' +
          C.donut({ percent: o.percent, label: o.completed + ' of ' + o.total + ' topics' }) + '</div>' +
        C.segmentedBar(segs) +
        '<div style="margin-top:10px">' + C.legend(segs) + '</div>' +
        '<p class="small faint" style="margin-top:12px">Weights: Learning 25%, Practicing 50%, ' +
          'Comfortable 80%, Mastered 100%.</p>' +
      '</div>' +
      '<div class="card"><div class="card__head">' + icon('roadmap', 16) + '<h2>Progress by phase</h2></div>' +
        phaseBars + '</div>' +
    '</div>';
  }

  /* ---------- Phase table ---------- */

  function phaseTable(phases) {
    return '<div class="card card--pad-0 section"><div class="table-wrap"><table class="tbl">' +
      '<thead><tr><th>Phase</th><th>Progress</th><th>Completed</th><th>Remaining</th>' +
      '<th>Active</th><th>Lessons</th><th>Avg score</th><th>Status</th></tr></thead><tbody>' +
      phases.map(function (p) {
        return '<tr>' +
          '<td class="cell-name"><span class="row row--tight"><i class="phase-dot" style="background:' +
            p.color + ';margin-top:0"></i>' + U.escapeHtml(p.name) + '</span></td>' +
          '<td style="min-width:140px">' + C.progressBar(p.percent, p.color) +
            '<div class="small tnum faint" style="margin-top:4px">' + p.percent + '%</div></td>' +
          '<td class="tnum">' + p.completed + '</td>' +
          '<td class="tnum">' + p.remaining + '</td>' +
          '<td class="tnum">' + p.inProgress + '</td>' +
          '<td class="tnum small">' + (function () {
            var cov = App.lessons.phaseCoverage(p.id);
            return cov.withLesson ? cov.withLesson + '/' + cov.total : '<span class="faint">—</span>';
          })() + '</td>' +
          '<td>' + (p.avgScore ? C.pips(Math.round(p.avgScore), C.scoreTone(p.avgScore)) +
            ' <span class="small faint tnum">' + p.avgScore + '</span>' : '<span class="faint">—</span>') + '</td>' +
          '<td><span class="badge badge--' + (p.percent === 100 ? 'ok' : p.percent === 0 ? 'muted' : 'accent') + '">' +
            p.status + '</span></td>' +
        '</tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  /* ---------- Time charts ---------- */

  function timeSection(weekly, daily) {
    var last30 = daily.slice(-30);
    return '<div class="section">' +
      '<div class="grid grid--2">' +
        '<div class="card"><div class="card__head">' + icon('trending', 16) + '<h2>Weekly hours</h2>' +
          '<span class="spacer small faint">last 12 weeks</span></div>' +
          C.barChart({
            data: weekly.map(function (w) { return { label: w.label, value: w.hours }; }),
            height: 190, showValues: true, highlightLast: true,
            format: function (v) { return U.round(v, 1) + 'h'; }
          }) +
        '</div>' +
        '<div class="card"><div class="card__head">' + icon('clock', 16) + '<h2>Daily minutes</h2>' +
          '<span class="spacer small faint">last 30 days</span></div>' +
          C.barChart({
            data: last30.map(function (d) { return { label: U.fmtDateShort(d.date), value: d.minutes }; }),
            height: 190, highlightLast: true,
            format: function (v) { return Math.round(v) + 'm'; }
          }) +
        '</div>' +
      '</div>' +

      '<div class="card" style="margin-top:16px">' +
        '<div class="card__head">' + icon('calendar', 16) + '<h2>Activity</h2>' +
          '<span class="spacer small faint">last 26 weeks · one square per day</span></div>' +
        C.heatmap(daily) +
        '<div class="legend" style="margin-top:10px">' +
          '<span><i class="heat__cell" style="width:10px;height:10px"></i>none</span>' +
          '<span><i class="heat__cell l1" style="width:10px;height:10px"></i>&lt; 30m</span>' +
          '<span><i class="heat__cell l2" style="width:10px;height:10px"></i>30–60m</span>' +
          '<span><i class="heat__cell l3" style="width:10px;height:10px"></i>1–2h</span>' +
          '<span><i class="heat__cell l4" style="width:10px;height:10px"></i>2h+</span>' +
        '</div>' +
      '</div></div>';
  }

  /* ---------- Topic lists ---------- */

  function listsSection(completed, practicing, weak, overdue) {
    return '<div class="grid grid--2 section">' +
      listCard('Currently practicing', practicing, 'You are actively working on these.', 'edit') +
      listCard('Weak topics', weak, 'Average score of 2 or below - revisit these first.', 'edit') +
      listCard('Overdue for review', overdue, 'Past their scheduled review date.', 'review') +
      listCard('Completed topics', completed, 'Comfortable or mastered.', 'edit') +
    '</div>';
  }

  function listCard(title, topics, blurb, action) {
    var body = topics.length
      ? topics.slice(0, 10).map(function (t) {
          var avg = P.averageScore(t);
          return '<div class="lrow">' +
            '<div class="lrow__main"><div class="lrow__title">' + U.escapeHtml(t.name) + '</div>' +
              '<div class="lrow__sub">' + U.escapeHtml((App.PHASE_BY_ID[t.phaseId] || {}).name || '') +
                (t.nextReview ? ' · review ' + U.relativeDay(t.nextReview) : '') + '</div></div>' +
            C.pips(Math.round(avg), C.scoreTone(avg)) +
            (action === 'review'
              ? '<button class="btn btn--sm btn--primary" data-review="' + t.id + '">Review</button>'
              : '<button class="btn btn--sm" data-edit-topic="' + t.id + '">Open</button>') +
          '</div>';
        }).join('') +
        (topics.length > 10 ? '<p class="small faint" style="margin-top:9px">+ ' + (topics.length - 10) + ' more</p>' : '')
      : '<p class="small faint">Nothing here right now.</p>';

    return '<div class="card"><div class="card__head"><h2>' + U.escapeHtml(title) + '</h2>' +
      '<span class="spacer badge badge--muted">' + topics.length + '</span></div>' +
      '<p class="small faint" style="margin-bottom:10px">' + U.escapeHtml(blurb) + '</p>' + body + '</div>';
  }

  /* ---------- Recent sessions ---------- */

  function recentSection() {
    var recent = P.recentSessions(8);
    if (!recent.length) return '';
    return '<div class="card card--pad-0"><div style="padding:16px 18px 0"><div class="card__head">' +
      icon('clock', 16) + '<h2>Recent sessions</h2></div></div>' +
      '<div class="table-wrap"><table class="tbl">' +
      '<thead><tr><th>Date</th><th>Topic</th><th>Duration</th><th>Learned</th><th>Confidence</th></tr></thead><tbody>' +
      recent.map(function (x) {
        return '<tr><td class="small">' + U.fmtDateShort(x.date) + '</td>' +
          '<td class="small cell-name">' + U.escapeHtml(App.store.topicName(x.topicId)) + '</td>' +
          '<td class="tnum small">' + U.fmtDuration(x.durationMinutes) + '</td>' +
          '<td class="small muted" style="max-width:420px"><div class="truncate">' +
            U.escapeHtml(x.learned || '—') + '</div></td>' +
          '<td>' + C.pips(x.confidence, C.scoreTone(x.confidence)) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  return { meta: meta, render: render };
})();
