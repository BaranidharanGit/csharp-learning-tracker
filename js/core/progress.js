/* ============================================================
   js/core/progress.js
   Every number shown in the app is calculated here, once.

   THE PROGRESS RULE (also documented in the README and on the
   Settings page so it never drifts out of sync):

     Each topic contributes a weight based on its status:
        Not Started 0%   Learning 25%   Practicing 50%
        Comfortable 80%  Mastered 100%

     Phase %   = average weight of the topics in that phase
     Overall % = average weight of ALL topics
     "Completed" = status Comfortable or Mastered
   ============================================================ */
window.App = window.App || {};

App.progress = (function () {
  'use strict';

  var U = App.utils;

  /* ---------- Topic-level ---------- */

  function statusWeight(statusId) {
    var s = App.STATUS_BY_ID[statusId];
    return s ? s.weight : 0;
  }

  function isCompleted(topic) {
    return App.COMPLETED_STATUSES.indexOf(topic.status) !== -1;
  }

  function isActive(topic) {
    return topic.status === 'learning' || topic.status === 'practicing';
  }

  /** Average of the three 0-5 scores. */
  function averageScore(topic) {
    return U.round((topic.understanding + topic.coding + topic.problemSolving) / 3, 1);
  }

  /* ---------- Phase-level ---------- */

  /**
   * Stats for one phase.
   * Returns { id, name, color, total, completed, remaining, inProgress,
   *           percent, status, counts, avgScore }
   */
  function phaseStats(phaseId, allTopics) {
    var topics = (allTopics || App.store.get().topics)
      .filter(function (t) { return t.phaseId === phaseId; });

    var phase = App.PHASE_BY_ID[phaseId] || { id: phaseId, name: phaseId, color: 'var(--accent)' };
    var total = topics.length;
    var completed = topics.filter(isCompleted).length;
    var inProgress = topics.filter(isActive).length;
    var percent = total ? Math.round(U.avg(topics.map(function (t) { return statusWeight(t.status); })) * 100) : 0;

    var counts = {};
    App.STATUSES.forEach(function (s) { counts[s.id] = 0; });
    topics.forEach(function (t) { counts[t.status] = (counts[t.status] || 0) + 1; });

    var scored = topics.filter(function (t) { return t.status !== 'not-started'; });

    return {
      id: phaseId,
      name: phase.name,
      blurb: phase.blurb,
      color: phase.color,
      total: total,
      completed: completed,
      remaining: total - completed,
      inProgress: inProgress,
      percent: percent,
      status: phaseStatusLabel(percent, completed, total),
      counts: counts,
      avgScore: scored.length ? U.round(U.avg(scored.map(averageScore)), 1) : 0,
      topics: topics
    };
  }

  /** Human label for a phase's state. */
  function phaseStatusLabel(percent, completed, total) {
    if (total === 0) return 'Empty';
    if (percent === 0) return 'Not Started';
    if (completed === total) return 'Completed';
    if (percent >= 80) return 'Almost There';
    if (percent >= 35) return 'In Progress';
    return 'Just Started';
  }

  function allPhaseStats() {
    var topics = App.store.get().topics;
    return App.ROADMAP.map(function (p) { return phaseStats(p.id, topics); });
  }

  /* ---------- Overall ---------- */

  function overall() {
    var topics = App.store.get().topics;
    var total = topics.length;
    var completed = topics.filter(isCompleted).length;
    var mastered = topics.filter(function (t) { return t.status === 'mastered'; }).length;
    var percent = total ? Math.round(U.avg(topics.map(function (t) { return statusWeight(t.status); })) * 100) : 0;

    var counts = {};
    App.STATUSES.forEach(function (s) { counts[s.id] = 0; });
    topics.forEach(function (t) { counts[t.status] = (counts[t.status] || 0) + 1; });

    return {
      percent: percent,
      total: total,
      completed: completed,
      remaining: total - completed,
      mastered: mastered,
      counts: counts
    };
  }

  /* ---------- Current focus ---------- */

  /** First phase that is started but unfinished; otherwise the first unstarted one. */
  function currentPhase() {
    var stats = allPhaseStats();
    var started = stats.filter(function (p) { return p.percent > 0 && p.percent < 100; });
    if (started.length) return started[0];
    var unstarted = stats.filter(function (p) { return p.percent === 0 && p.total > 0; });
    if (unstarted.length) return unstarted[0];
    return stats[stats.length - 1];
  }

  /**
   * The topic you are working on right now.
   * A manually pinned topic always wins; otherwise we pick the most
   * recently touched topic that is still Learning or Practicing.
   */
  function currentTopic() {
    var s = App.store.get();
    if (s.settings.focusTopicId) {
      var pinned = App.store.topicById(s.settings.focusTopicId);
      if (pinned) return pinned;
    }
    var active = s.topics.filter(isActive)
      .sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
    if (active.length) return active[0];

    // Nothing in progress: suggest the next not-started topic of the current phase.
    var phase = currentPhase();
    var next = App.store.topicsByPhase(phase.id)
      .filter(function (t) { return t.status === 'not-started'; })[0];
    return next || null;
  }

  /* ---------- Sessions, hours and streaks ---------- */

  function totalMinutes(sessions) {
    return U.sum((sessions || App.store.get().sessions).map(function (s) { return s.durationMinutes || 0; }));
  }

  function totalHours(sessions) {
    return U.toHours(totalMinutes(sessions));
  }

  /** Unique set of dates that have at least one session. */
  function sessionDateSet(sessions) {
    var set = {};
    (sessions || App.store.get().sessions).forEach(function (s) { if (s.date) set[s.date] = true; });
    return set;
  }

  /**
   * Current and longest streak of consecutive days with a session.
   * Today not being logged yet does NOT break the streak - we allow a
   * one-day grace so an evening learner still sees the right number.
   */
  function streak(sessions) {
    var set = sessionDateSet(sessions);
    var dates = Object.keys(set).sort();
    if (!dates.length) return { current: 0, longest: 0, lastDate: null };

    var today = U.today();
    var cursor = set[today] ? today : (set[U.addDays(today, -1)] ? U.addDays(today, -1) : null);

    var current = 0;
    while (cursor && set[cursor]) {
      current += 1;
      cursor = U.addDays(cursor, -1);
    }

    var longest = 1, run = 1;
    for (var i = 1; i < dates.length; i++) {
      if (U.daysBetween(dates[i - 1], dates[i]) === 1) { run += 1; }
      else { run = 1; }
      if (run > longest) longest = run;
    }

    return { current: current, longest: Math.max(longest, current), lastDate: dates[dates.length - 1] };
  }

  /** Minutes logged on a given date. */
  function minutesOnDate(iso, sessions) {
    return U.sum((sessions || App.store.get().sessions)
      .filter(function (s) { return s.date === iso; })
      .map(function (s) { return s.durationMinutes || 0; }));
  }

  /** Last `days` days as [{ date, minutes }] oldest-first. */
  function dailyMinutes(days) {
    var sessions = App.store.get().sessions;
    var byDate = {};
    sessions.forEach(function (s) {
      byDate[s.date] = (byDate[s.date] || 0) + (s.durationMinutes || 0);
    });
    var out = [];
    for (var i = (days || 30) - 1; i >= 0; i--) {
      var d = U.addDays(U.today(), -i);
      out.push({ date: d, minutes: byDate[d] || 0 });
    }
    return out;
  }

  /** Last `weeks` weeks as [{ weekStart, label, hours, minutes }] oldest-first. */
  function weeklyHours(weeks) {
    var sessions = App.store.get().sessions;
    var byWeek = {};
    sessions.forEach(function (s) {
      var wk = U.startOfWeek(s.date);
      byWeek[wk] = (byWeek[wk] || 0) + (s.durationMinutes || 0);
    });
    var out = [];
    var thisWeek = U.startOfWeek(U.today());
    for (var i = (weeks || 8) - 1; i >= 0; i--) {
      var wk = U.addDays(thisWeek, -7 * i);
      out.push({
        weekStart: wk,
        label: U.fmtDateShort(wk),
        minutes: byWeek[wk] || 0,
        hours: U.toHours(byWeek[wk] || 0)
      });
    }
    return out;
  }

  function recentSessions(n) {
    return App.store.get().sessions.slice()
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return (b.startTime || '').localeCompare(a.startTime || '');
      })
      .slice(0, n || 5);
  }

  function sessionsThisWeek() {
    var wk = U.startOfWeek(U.today());
    return App.store.get().sessions.filter(function (s) { return s.date >= wk; });
  }

  /* ---------- Topic lists used by the Progress page ---------- */

  function completedTopics() {
    return App.store.sortedTopics().filter(isCompleted);
  }

  function practicingTopics() {
    return App.store.sortedTopics().filter(isActive);
  }

  /**
   * Weak topics: you have started them, but the evidence is thin.
   * Either the average score is 2 or below, or a single score is 0-1
   * while you are already meant to be practising.
   */
  function weakTopics() {
    return App.store.sortedTopics().filter(function (t) {
      if (t.status === 'not-started') return false;
      var avg = averageScore(t);
      if (avg <= 2) return true;
      return t.status === 'practicing' && Math.min(t.understanding, t.coding, t.problemSolving) <= 1;
    }).sort(function (a, b) { return averageScore(a) - averageScore(b); });
  }

  /* ---------- Challenges ---------- */

  function challengeStats() {
    var list = App.store.get().challenges;
    var done = list.filter(function (c) { return c.outcome === 'completed'; }).length;
    var retriesDue = list.filter(function (c) {
      return c.retryDate && U.daysBetween(U.today(), c.retryDate) <= 0;
    });
    return {
      total: list.length,
      completed: done,
      failed: list.length - done,
      successRate: list.length ? Math.round((done / list.length) * 100) : 0,
      retriesDue: retriesDue,
      avgMinutes: list.length ? Math.round(U.avg(list.map(function (c) { return c.timeTakenMinutes || 0; }))) : 0
    };
  }

  /* ---------- Projects ---------- */

  function projectProgress(project) {
    var total = project.features.length;
    var done = project.features.filter(function (f) { return f.done; }).length;
    return {
      total: total,
      done: done,
      percent: total ? Math.round((done / total) * 100) : 0
    };
  }

  return {
    statusWeight: statusWeight, isCompleted: isCompleted, isActive: isActive,
    averageScore: averageScore, phaseStats: phaseStats, allPhaseStats: allPhaseStats,
    overall: overall, currentPhase: currentPhase, currentTopic: currentTopic,
    totalMinutes: totalMinutes, totalHours: totalHours, streak: streak,
    minutesOnDate: minutesOnDate, dailyMinutes: dailyMinutes, weeklyHours: weeklyHours,
    recentSessions: recentSessions, sessionsThisWeek: sessionsThisWeek,
    completedTopics: completedTopics, practicingTopics: practicingTopics, weakTopics: weakTopics,
    challengeStats: challengeStats, projectProgress: projectProgress
  };
})();
