/* ============================================================
   js/core/lessons.js
   Reads lesson content and works out, for one topic:
     - how far through the learning flow you are (the % bar)
     - what the single next action is
     - which exercises belong to which level

   Knows nothing about the DOM. views/learn.js renders what this returns.
   ============================================================ */
window.App = window.App || {};

App.lessons = (function () {
  'use strict';

  var U = App.utils;

  /* ---------- Lookup ---------- */

  function get(topicId) { return App.LESSONS[topicId] || null; }
  function has(topicId) { return !!App.LESSONS[topicId]; }
  function all() { return Object.keys(App.LESSONS).map(function (k) { return App.LESSONS[k]; }); }

  /** How many topics in a phase actually have written lesson content. */
  function phaseCoverage(phaseId) {
    var topics = App.store.topicsByPhase(phaseId);
    var withLesson = topics.filter(function (t) { return has(t.id); }).length;
    return { total: topics.length, withLesson: withLesson, without: topics.length - withLesson };
  }

  function exercisesByLevel(lesson, level) {
    return lesson.exercises.filter(function (x) { return x.level === level; });
  }

  /** The learning record for a topic, always fully populated. */
  function learningOf(topic) {
    if (!topic) return App.store.blankLearning();
    return topic.learning || App.store.blankLearning();
  }

  function exerciseState(L, id) {
    return L.exercises[id] || { passed: false, attempts: 0, hintsUsed: 0, solutionViewed: false, independent: false };
  }

  function passedCount(L, list) {
    return list.filter(function (x) { return exerciseState(L, x.id).passed; }).length;
  }

  /* ---------- The learning flow ---------- */

  /*
     The eight steps of the flow and what each contributes to the topic's
     lesson progress percentage. They add up to 100.
  */
  var STEP_WEIGHTS = {
    lesson: 15, examples: 5, guided: 15, independent: 20,
    applied: 10, knowledge: 15, explain: 5, challenge: 15
  };

  /**
   * steps(topic) -> ordered list of flow steps with done/partial state,
   * plus the overall percentage and the next action to take.
   */
  function steps(topic) {
    var lesson = get(topic.id);
    if (!lesson) return null;
    var L = learningOf(topic);

    var guided = exercisesByLevel(lesson, 2);
    var independent = exercisesByLevel(lesson, 3);
    var applied = exercisesByLevel(lesson, 4);
    var challenge = exercisesByLevel(lesson, 5);

    var list = [
      step('lesson', 'Lesson', 'Read the concept',
           L.sectionsRead.length, lesson.sections.length, { view: 'lesson' }),
      step('examples', 'Examples', 'Work through the examples',
           L.examplesViewed.length, lesson.examples.length, { view: 'examples' }),
      step('guided', 'Guided exercise', 'Solve with hints available',
           passedCount(L, guided), guided.length, { view: 'practice', level: 2 }),
      step('independent', 'Independent exercise', 'Solve without hints',
           passedCount(L, independent), independent.length, { view: 'practice', level: 3 }),
      step('applied', 'Applied exercise', 'Use it in a realistic situation',
           passedCount(L, applied), applied.length, { view: 'practice', level: 4 }),
      step('knowledge', 'Knowledge check', 'Pass the retrieval test',
           L.knowledgeCheck.passed ? 1 : 0, lesson.knowledgeChecks.length ? 1 : 0, { view: 'check' }),
      step('explain', 'Explain it', 'Write the concept in your own words',
           L.explanation.trim().length >= 80 ? 1 : 0, 1, { view: 'explain' }),
      step('challenge', 'No-help challenge', 'Prove it with no support',
           L.challenge.passed ? 1 : 0, challenge.length ? 1 : 0, { view: 'challenge' })
    ].filter(function (s) { return s.total > 0; });   // skip steps this lesson has no content for

    var earned = 0, possible = 0;
    list.forEach(function (s) {
      var w = STEP_WEIGHTS[s.id];
      possible += w;
      earned += w * (s.total ? s.done / s.total : 0);
    });

    var percent = possible ? Math.round((earned / possible) * 100) : 0;
    var next = list.filter(function (s) { return !s.complete; })[0] || null;

    return { steps: list, percent: percent, next: next, lesson: lesson };
  }

  function step(id, label, blurb, done, total, target) {
    return {
      id: id, label: label, blurb: blurb,
      done: Math.min(done, total), total: total,
      complete: total > 0 && done >= total,
      started: done > 0,
      target: target
    };
  }

  /** Short sentence for the dashboard: "Complete Independent Exercise 2". */
  function nextActionLabel(topic) {
    var s = steps(topic);
    if (!s) return null;
    if (!s.next) return 'Topic complete - schedule a review';
    var n = s.next;
    if (n.total > 1) return n.label + ' ' + (n.done + 1) + ' of ' + n.total;
    return n.label;
  }

  /** Estimated minutes left, based on the lesson estimate and progress so far. */
  function remainingMinutes(topic) {
    var s = steps(topic);
    if (!s) return null;
    var spent = Math.round(learningOf(topic).seconds / 60);
    var estimate = s.lesson.estimatedMinutes;
    return {
      estimate: estimate,
      spent: spent,
      remaining: Math.max(0, estimate - spent)
    };
  }

  /** Every topic that has lesson content, in roadmap order. */
  function topicsWithLessons() {
    return App.store.sortedTopics().filter(function (t) { return has(t.id); });
  }

  /** Previous / next topic in roadmap order (for lesson navigation). */
  function neighbours(topicId) {
    var list = App.store.sortedTopics();
    var i = list.findIndex ? list.findIndex(function (t) { return t.id === topicId; })
                           : list.map(function (t) { return t.id; }).indexOf(topicId);
    return {
      prev: i > 0 ? list[i - 1] : null,
      next: i > -1 && i < list.length - 1 ? list[i + 1] : null
    };
  }

  /**
   * The topic the learner should work on now: their pinned focus if it has a
   * lesson, otherwise the first unfinished topic that does.
   */
  function suggestedTopic() {
    var pinned = App.progress.currentTopic();
    if (pinned && has(pinned.id)) {
      var s = steps(pinned);
      if (s && s.next) return pinned;
    }
    var candidates = topicsWithLessons();
    var unfinished = candidates.filter(function (t) {
      var s = steps(t);
      return s && s.next;
    });
    return unfinished[0] || pinned || candidates[0] || null;
  }

  return {
    get: get, has: has, all: all, phaseCoverage: phaseCoverage,
    exercisesByLevel: exercisesByLevel, learningOf: learningOf,
    exerciseState: exerciseState, steps: steps, nextActionLabel: nextActionLabel,
    remainingMinutes: remainingMinutes, topicsWithLessons: topicsWithLessons,
    neighbours: neighbours, suggestedTopic: suggestedTopic,
    STEP_WEIGHTS: STEP_WEIGHTS
  };
})();
