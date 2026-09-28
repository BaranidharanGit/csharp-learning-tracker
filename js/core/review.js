/* ============================================================
   js/core/review.js
   A deliberately simple spaced-repetition scheduler.

   Every topic carries a `reviewStep` - its position on a ladder of
   intervals. How you rate a review moves you along that ladder:

        LADDER (days):  1  3  7  14  30  60  120  180
        step:           0  1  2   3   4   5    6    7

     Difficult       -> step = 0                  (see it again tomorrow)
     Needs Practice  -> step = step - 1           (shorter gap)
     Good            -> step = step + 1           (normal progression)
     Easy            -> step = step + 2, then x1.3 (stretch it out)

   That is all there is to it - no ease factors, no decimals to debug.
   ============================================================ */
window.App = window.App || {};

App.review = (function () {
  'use strict';

  var U = App.utils;

  var LADDER = [1, 3, 7, 14, 30, 60, 120, 180];

  var QUALITIES = [
    { id: 'difficult',      label: 'Difficult',      hint: 'Could not recall it',      stepDelta: null, reset: true },
    { id: 'needs-practice', label: 'Needs Practice', hint: 'Recalled with effort',     stepDelta: -1 },
    { id: 'good',           label: 'Good',           hint: 'Solid, some hesitation',   stepDelta: 1 },
    { id: 'easy',           label: 'Easy',           hint: 'Instant and confident',    stepDelta: 2, stretch: 1.3 }
  ];

  var QUALITY_BY_ID = QUALITIES.reduce(function (m, q) { m[q.id] = q; return m; }, {});

  /** New ladder position after a review of the given quality. */
  function nextStep(currentStep, qualityId) {
    var q = QUALITY_BY_ID[qualityId];
    if (!q) return currentStep;
    if (q.reset) return 0;
    return U.clamp((currentStep || 0) + q.stepDelta, 0, LADDER.length - 1);
  }

  /** Days until the next review, given the resulting ladder position. */
  function intervalDays(step, qualityId) {
    var q = QUALITY_BY_ID[qualityId];
    var base = LADDER[U.clamp(step, 0, LADDER.length - 1)];
    return q && q.stretch ? Math.round(base * q.stretch) : base;
  }

  /**
   * Preview what a rating would do without changing anything.
   * Used to label the four review buttons with their real intervals.
   */
  function preview(topic, qualityId) {
    var step = nextStep(topic ? topic.reviewStep : 0, qualityId);
    var days = intervalDays(step, qualityId);
    return { step: step, days: days, date: U.addDays(U.today(), days) };
  }

  /**
   * Apply a review result to a topic object (mutates a copy of the fields
   * and returns them - the store does the actual write).
   */
  function applyTo(topic, qualityId) {
    var p = preview(topic, qualityId);
    return {
      reviewStep: p.step,
      reviewCount: (topic.reviewCount || 0) + 1,
      lastReviewed: U.today(),
      nextReview: p.date
    };
  }

  /** Topics scheduled for today or earlier (the "Today's Review" queue). */
  function dueTopics(topics) {
    var today = U.today();
    return topics
      .filter(function (t) { return t.nextReview && U.daysBetween(today, t.nextReview) <= 0; })
      .sort(function (a, b) { return a.nextReview < b.nextReview ? -1 : 1; });
  }

  /** Due strictly before today. */
  function overdueTopics(topics) {
    var today = U.today();
    return topics
      .filter(function (t) { return t.nextReview && U.daysBetween(today, t.nextReview) < 0; })
      .sort(function (a, b) { return a.nextReview < b.nextReview ? -1 : 1; });
  }

  /** Scheduled within the next `days` days (not including today). */
  function upcomingTopics(topics, days) {
    var today = U.today();
    return topics.filter(function (t) {
      if (!t.nextReview) return false;
      var d = U.daysBetween(today, t.nextReview);
      return d > 0 && d <= (days || 7);
    }).sort(function (a, b) { return a.nextReview < b.nextReview ? -1 : 1; });
  }

  return {
    LADDER: LADDER,
    QUALITIES: QUALITIES,
    QUALITY_BY_ID: QUALITY_BY_ID,
    nextStep: nextStep,
    intervalDays: intervalDays,
    preview: preview,
    applyTo: applyTo,
    dueTopics: dueTopics,
    overdueTopics: overdueTopics,
    upcomingTopics: upcomingTopics
  };
})();
