/* ============================================================
   js/core/mastery.js
   Turns evidence into scores, status and achievements.

   THE RULE THIS FILE EXISTS TO ENFORCE:
   reading a lesson earns you nothing. Scores and status move only when
   you demonstrate something - an exercise passed, a check answered, a
   challenge completed, an explanation written.

   Backwards compatibility: auto-promotion only ever RAISES a topic's
   status, and demonstrated scores only ever raise the stored score.
   Anything you set by hand in an older version of the app survives.
   ============================================================ */
window.App = window.App || {};

App.mastery = (function () {
  'use strict';

  var U = App.utils;

  var STATUS_RANK = { 'not-started': 0, 'learning': 1, 'practicing': 2, 'comfortable': 3, 'mastered': 4 };

  /* ============================================================
     Demonstrated scores (0-5)
     ============================================================ */

  /** How much credit one passed exercise is worth. */
  function credit(state) {
    if (!state.passed) return 0;
    if (state.solutionViewed) return 0.4;   // you saw the answer first
    if (state.hintsUsed) return 0.7;        // you needed help
    return 1;                               // solved it cold
  }

  function scoreFrom(list, L) {
    if (!list.length) return null;          // nothing to measure - leave the score alone
    var earned = list.reduce(function (sum, x) {
      return sum + credit(App.lessons.exerciseState(L, x.id));
    }, 0);
    return Math.round((earned / list.length) * 5);
  }

  /**
   * demonstrated(topic) -> { understanding, coding, problemSolving, debugging }
   * Any value may be null, meaning "this lesson gives no evidence either way".
   */
  function demonstrated(topic) {
    var lesson = App.lessons.get(topic.id);
    if (!lesson) return { understanding: null, coding: null, problemSolving: null, debugging: null };
    var L = App.lessons.learningOf(topic);

    /* --- Understanding: the knowledge check plus your own explanation --- */
    var understanding = null;
    var kc = L.knowledgeCheck;
    if (kc.attempts > 0) {
      var best = kc.bestScore;
      understanding = best >= 95 ? 5 : best >= 85 ? 4 : best >= 70 ? 3 : best >= 50 ? 2 : 1;
      // Writing a real explanation is worth one more point, capped at 5.
      if (L.explanation.trim().length >= 80 && understanding < 5) understanding += 1;
    } else if (L.explanation.trim().length >= 80) {
      understanding = 2;
    }

    /* --- Coding: exercises where you actually wrote code --- */
    var codingEx = lesson.exercises.filter(function (x) {
      return x.type === 'coding' || x.type === 'refactor' || x.type === 'fill-blank';
    });
    var coding = scoreFrom(codingEx, L);

    /* --- Problem solving: independent, applied and challenge work --- */
    var solveEx = lesson.exercises.filter(function (x) { return x.level >= 3; });
    var problemSolving = scoreFrom(solveEx, L);

    /* --- Debugging: find-the-bug work --- */
    var debugEx = lesson.exercises.filter(function (x) { return x.type === 'debug'; });
    var debugging = scoreFrom(debugEx, L);

    return {
      understanding: understanding,
      coding: coding,
      problemSolving: problemSolving,
      debugging: debugging
    };
  }

  /* ============================================================
     Mastery requirements
     ============================================================ */

  function req(id, label, met) { return { id: id, label: label, met: !!met }; }

  /**
   * evaluate(topic) -> {
   *   comfortable: { met, requirements[] },
   *   mastered:    { met, requirements[] },
   *   earnedStatus, demonstrated, hasLesson
   * }
   */
  function evaluate(topic) {
    var lesson = App.lessons.get(topic.id);
    var L = App.lessons.learningOf(topic);
    var scores = demonstrated(topic);

    if (!lesson) {
      // No written lesson: nothing can be earned automatically, and the
      // topic keeps whatever status it already has.
      return {
        hasLesson: false,
        comfortable: { met: false, requirements: [] },
        mastered: { met: false, requirements: [] },
        earnedStatus: topic.status,
        demonstrated: scores
      };
    }

    var guided = App.lessons.exercisesByLevel(lesson, 2);
    var independent = App.lessons.exercisesByLevel(lesson, 3);
    var applied = App.lessons.exercisesByLevel(lesson, 4);
    var challenge = App.lessons.exercisesByLevel(lesson, 5);
    var pass = function (x) { return App.lessons.exerciseState(L, x.id).passed; };

    var lessonRead = lesson.sections.length > 0 && L.sectionsRead.length >= lesson.sections.length;
    var guidedDone = guided.length === 0 || guided.every(pass);
    var independentDone = independent.length === 0 || independent.every(pass);
    var appliedDone = applied.length === 0 || applied.every(pass);
    var kcPassed = lesson.knowledgeChecks.length === 0 || L.knowledgeCheck.passed;
    var challengeDone = challenge.length === 0 || L.challenge.passed;
    var explained = L.explanation.trim().length >= 80;

    var comfortableReqs = [
      req('lesson', 'Lesson read end to end', lessonRead),
      req('guided', 'Guided exercises completed (' +
          guided.filter(pass).length + '/' + guided.length + ')', guidedDone),
      req('independent-one', 'At least one independent exercise passed',
          independent.length === 0 || independent.some(pass)),
      req('knowledge', 'Knowledge check passed', kcPassed)
    ];

    var minU = 4, minC = 4, minP = 4, minD = 3;
    var masteredReqs = comfortableReqs.concat([
      req('independent-all', 'All independent exercises passed (' +
          independent.filter(pass).length + '/' + independent.length + ')', independentDone),
      req('applied', 'Applied exercise passed', appliedDone),
      req('challenge', 'No-help challenge passed', challengeDone),
      req('explain', 'You explained the topic in your own words', explained),
      req('score-u', 'Understanding score ' + minU + '+ (demonstrated)',
          (scores.understanding === null ? topic.understanding : scores.understanding) >= minU),
      req('score-c', 'Coding score ' + minC + '+ (demonstrated)',
          (scores.coding === null ? topic.coding : scores.coding) >= minC),
      req('score-p', 'Problem-solving score ' + minP + '+ (demonstrated)',
          (scores.problemSolving === null ? topic.problemSolving : scores.problemSolving) >= minP)
    ]);

    if (lesson.exercises.some(function (x) { return x.type === 'debug'; })) {
      masteredReqs.push(req('score-d', 'Debugging score ' + minD + '+ (demonstrated)',
        (scores.debugging === null ? topic.debugging : scores.debugging) >= minD));
    }

    var comfortableMet = comfortableReqs.every(function (r) { return r.met; });
    var masteredMet = masteredReqs.every(function (r) { return r.met; });

    /* What the evidence says the status should be. */
    var anyAttempt = Object.keys(L.exercises).length > 0 || L.knowledgeCheck.attempts > 0;
    var anyPassed = Object.keys(L.exercises).some(function (k) { return L.exercises[k].passed; });
    var earned = 'not-started';
    if (L.lessonViewed) earned = 'learning';
    if (anyAttempt && anyPassed) earned = 'practicing';
    if (comfortableMet) earned = 'comfortable';
    if (masteredMet) earned = 'mastered';

    return {
      hasLesson: true,
      comfortable: { met: comfortableMet, requirements: comfortableReqs },
      mastered: { met: masteredMet, requirements: masteredReqs },
      earnedStatus: earned,
      demonstrated: scores
    };
  }

  /* ============================================================
     Applying the result
     ============================================================ */

  /**
   * Recompute a topic after any piece of evidence changes.
   * - raises stored scores to match what was demonstrated (never lowers)
   * - promotes status (never demotes)
   * - respects a manual override: if you set the status by hand, that wins
   * Returns the evaluation so callers can show what changed.
   */
  function recompute(topicId) {
    var topic = App.store.topicById(topicId);
    if (!topic) return null;
    var evalResult = evaluate(topic);
    var scores = evalResult.demonstrated;

    App.store.update(function (s) {
      var t = s.topics.filter(function (x) { return x.id === topicId; })[0];
      if (!t) return;

      // Scores: demonstrated performance can only raise them.
      ['understanding', 'coding', 'problemSolving', 'debugging'].forEach(function (key) {
        if (scores[key] !== null && scores[key] > (t[key] || 0)) t[key] = scores[key];
      });
      t.learning.demonstrated = scores;

      // Status: manual override wins, otherwise promote if earned.
      if (t.learning.manualStatus) {
        t.status = t.learning.manualStatus;
      } else if (STATUS_RANK[evalResult.earnedStatus] > STATUS_RANK[t.status]) {
        t.status = evalResult.earnedStatus;
      }

      // Level reached, for the difficulty progression display.
      t.learning.level = levelReached(t, evalResult);
      t.updatedAt = U.today();
    });

    checkAchievements();
    return evalResult;
  }

  /** Highest of the five difficulty levels the learner has actually reached. */
  function levelReached(topic, evalResult) {
    var lesson = App.lessons.get(topic.id);
    if (!lesson) return 1;
    var L = App.lessons.learningOf(topic);
    var pass = function (x) { return App.lessons.exerciseState(L, x.id).passed; };
    var level = 1;
    if (App.lessons.exercisesByLevel(lesson, 2).some(pass)) level = 2;
    if (App.lessons.exercisesByLevel(lesson, 3).some(pass)) level = 3;
    if (App.lessons.exercisesByLevel(lesson, 4).some(pass)) level = 4;
    if (L.challenge.passed) level = 5;
    return level;
  }

  /** Set the status by hand. Recorded as a manual override and labelled as one. */
  function setManualStatus(topicId, status) {
    App.store.updateLearning(topicId, function (L) { L.manualStatus = status; });
    App.store.updateTopic(topicId, { status: status });
  }

  /** Go back to the status the evidence supports. */
  function clearManualStatus(topicId) {
    App.store.updateLearning(topicId, function (L) { L.manualStatus = null; });
    var topic = App.store.topicById(topicId);
    var evalResult = evaluate(topic);
    App.store.updateTopic(topicId, { status: evalResult.earnedStatus });
    return evalResult;
  }

  function isManual(topic) {
    return !!(topic.learning && topic.learning.manualStatus);
  }

  /* ============================================================
     Achievements
     ============================================================ */

  var ACHIEVEMENTS = [
    { id: 'first-lesson',    label: 'Opened your first lesson',        test: function (m) { return m.lessonsViewed >= 1; } },
    { id: 'first-exercise',  label: 'Passed your first exercise',      test: function (m) { return m.exercisesPassed >= 1; } },
    { id: 'first-check',     label: 'Passed your first knowledge check', test: function (m) { return m.checksPassed >= 1; } },
    { id: 'first-challenge', label: 'Passed your first no-help challenge', test: function (m) { return m.challengesPassed >= 1; } },
    { id: 'no-hints-5',      label: 'Solved 5 exercises with no hints', test: function (m) { return m.independentSolves >= 5; } },
    { id: 'debugger',        label: 'Fixed 5 broken programs',         test: function (m) { return m.debugPassed >= 5; } },
    { id: 'exercises-10',    label: '10 exercises passed',             test: function (m) { return m.exercisesPassed >= 10; } },
    { id: 'exercises-50',    label: '50 exercises passed',             test: function (m) { return m.exercisesPassed >= 50; } },
    { id: 'first-comfortable', label: 'First topic reached Comfortable', test: function (m) { return m.comfortable >= 1; } },
    { id: 'first-mastered',  label: 'First topic Mastered',            test: function (m) { return m.mastered >= 1; } },
    { id: 'streak-3',        label: '3-day learning streak',           test: function (m) { return m.streak >= 3; } },
    { id: 'streak-7',        label: '7-day learning streak',           test: function (m) { return m.streak >= 7; } },
    { id: 'streak-30',       label: '30-day learning streak',          test: function (m) { return m.streak >= 30; } },
    { id: 'phase-fundamentals', label: 'Completed C# Fundamentals',    test: function (m) { return m.fundamentalsPercent === 100; } }
  ];

  var ACHIEVEMENT_BY_ID = ACHIEVEMENTS.reduce(function (o, a) { o[a.id] = a; return o; }, {});

  /** Aggregate evidence across every topic - also used by the statistics page. */
  function metrics() {
    var topics = App.store.get().topics;
    var m = {
      lessonsViewed: 0, exercisesPassed: 0, exercisesAttempted: 0, checksPassed: 0,
      challengesPassed: 0, independentSolves: 0, debugPassed: 0, hintsUsed: 0,
      solutionsViewed: 0, comfortable: 0, mastered: 0, demonstratedTopics: 0,
      streak: App.progress.streak().current,
      fundamentalsPercent: App.progress.phaseStats('fundamentals').percent
    };

    topics.forEach(function (t) {
      var L = t.learning;
      if (!L) return;
      if (L.lessonViewed) m.lessonsViewed += 1;
      if (L.knowledgeCheck && L.knowledgeCheck.passed) m.checksPassed += 1;
      if (L.challenge && L.challenge.passed) m.challengesPassed += 1;
      if (t.status === 'comfortable') m.comfortable += 1;
      if (t.status === 'mastered') m.mastered += 1;

      var lesson = App.lessons.get(t.id);
      var anyPassed = false;
      Object.keys(L.exercises || {}).forEach(function (id) {
        var st = L.exercises[id];
        m.exercisesAttempted += st.attempts || 0;
        m.hintsUsed += st.hintsUsed || 0;
        if (st.solutionViewed) m.solutionsViewed += 1;
        if (st.passed) {
          m.exercisesPassed += 1;
          anyPassed = true;
          if (st.independent) m.independentSolves += 1;
          if (lesson) {
            var ex = lesson.exercises.filter(function (x) { return x.id === id; })[0];
            if (ex && ex.type === 'debug') m.debugPassed += 1;
          }
        }
      });
      if (anyPassed || (L.knowledgeCheck && L.knowledgeCheck.passed)) m.demonstratedTopics += 1;
    });

    return m;
  }

  /** Unlock anything newly earned. Returns the list of new achievements. */
  function checkAchievements() {
    var m = metrics();
    var unlocked = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (a.test(m) && App.store.unlockAchievement(a.id)) unlocked.push(a);
    });
    return unlocked;
  }

  /** Unlocked achievements, newest first, ready to render. */
  function recentAchievements(limit) {
    return App.store.get().achievements.slice()
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; })
      .slice(0, limit || 5)
      .map(function (a) {
        return {
          id: a.id, date: a.date,
          label: (ACHIEVEMENT_BY_ID[a.id] || {}).label || a.id
        };
      });
  }

  return {
    STATUS_RANK: STATUS_RANK, ACHIEVEMENTS: ACHIEVEMENTS,
    demonstrated: demonstrated, evaluate: evaluate, recompute: recompute,
    setManualStatus: setManualStatus, clearManualStatus: clearManualStatus, isManual: isManual,
    metrics: metrics, checkAchievements: checkAchievements, recentAchievements: recentAchievements,
    levelReached: levelReached
  };
})();
