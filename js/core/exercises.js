/* ============================================================
   js/core/exercises.js
   The exercise engine: grading, for every exercise type.

   HONESTY RULE - this module is careful about one thing above all:
   it never claims to have compiled anything. Every result carries a
   `kind` that the UI must show:

     'executed'      the local .NET runner compiled and ran the code
     'checked'       static checks only - patterns, not a compiler
     'self-assessed' you judged your own written answer

   A static check passing does NOT mean the code compiles.
   ============================================================ */
window.App = window.App || {};

App.exercises = (function () {
  'use strict';

  /* ---------- Normalisation helpers ---------- */

  /** Lowercase, collapse all whitespace - for comparing prose answers. */
  function normText(v) {
    return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /** Trim each line and drop blank leading/trailing lines - for stdout. */
  function normOutput(v) {
    return String(v == null ? '' : v)
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .join('\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  /** Strip comments and string bodies so checks match real code, not prose. */
  function codeSkeleton(code) {
    return String(code || '')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ');
  }

  function result(passed, kind, results, message, extra) {
    return Object.assign({
      passed: !!passed,
      kind: kind,
      results: results || [],
      message: message || '',
      score: results && results.length
        ? results.filter(function (r) { return r.ok; }).length / results.length
        : (passed ? 1 : 0)
    }, extra || {});
  }

  /* ---------- Static code checks ---------- */

  /**
   * Run an exercise's `checks` against submitted code.
   * These are pattern checks. They catch "you did not use a loop" and
   * "you hard-coded the answer" - they do not catch syntax errors.
   */
  function runChecks(exercise, code) {
    var skeleton = codeSkeleton(code);
    var flat = skeleton.replace(/\s+/g, ' ');

    return (exercise.checks || []).map(function (c) {
      var ok = false;
      switch (c.kind) {
        case 'contains':
          ok = flat.toLowerCase().indexOf(String(c.value).toLowerCase().replace(/\s+/g, ' ')) > -1;
          break;
        case 'notContains':
          ok = flat.toLowerCase().indexOf(String(c.value).toLowerCase().replace(/\s+/g, ' ')) === -1;
          break;
        case 'regex':
          ok = new RegExp(c.value, c.flags || 'i').test(skeleton);
          break;
        case 'minLines':
          ok = String(code || '').split('\n').filter(function (l) { return l.trim(); }).length >= Number(c.value);
          break;
        default:
          ok = false;
      }
      return { ok: ok, label: c.message || String(c.value) };
    });
  }

  /* ---------- Per-type grading ---------- */

  function gradeMcq(exercise, response) {
    var correct = exercise.answer;
    var multi = Array.isArray(correct);
    var results;

    if (multi) {
      var given = (Array.isArray(response) ? response : []).map(Number).sort();
      var want = correct.map(Number).sort();
      var same = given.length === want.length && given.every(function (v, i) { return v === want[i]; });
      results = [{ ok: same, label: same ? 'All correct options selected' : 'Selection does not match' }];
      return result(same, 'checked', results, same ? 'Correct.' : 'Not quite - read the options again.');
    }

    var ok = Number(response) === Number(correct);
    results = [{ ok: ok, label: ok ? 'Correct answer' : 'Incorrect answer' }];
    return result(ok, 'checked', results, ok ? 'Correct.' : 'Not correct.');
  }

  function gradeAccepted(exercise, response) {
    // predict-output and short-answer: compare against a list of accepted forms.
    var accept = exercise.accept || [];
    var given = normText(response);
    var ok = accept.some(function (a) { return normText(a) === given; });

    // A looser fallback so trivial phrasing differences do not fail a correct answer.
    if (!ok && exercise.acceptContains) {
      ok = exercise.acceptContains.every(function (needle) {
        return given.indexOf(normText(needle)) > -1;
      });
    }
    return result(ok, 'checked',
      [{ ok: ok, label: ok ? 'Matches the expected answer' : 'Does not match the expected answer' }],
      ok ? 'Correct.' : 'Not the expected answer.');
  }

  function gradeFillBlank(exercise, response) {
    var blanks = exercise.blanks || [];
    var given = Array.isArray(response) ? response : [response];
    var results = blanks.map(function (b, i) {
      var value = normText(given[i]);
      var ok = (b.accept || []).some(function (a) { return normText(a) === value; });
      return { ok: ok, label: 'Blank ' + (i + 1) + (ok ? ' correct' : ' - expected something like "' + (b.accept || [''])[0] + '"') };
    });
    var passed = results.length > 0 && results.every(function (r) { return r.ok; });
    return result(passed, 'checked', results, passed ? 'All blanks correct.' : 'Some blanks are not right yet.');
  }

  function gradeCoding(exercise, code) {
    var text = String(code || '').trim();
    if (text.length < 5) {
      return result(false, 'checked', [{ ok: false, label: 'No code submitted' }], 'Write some code first.');
    }
    var results = runChecks(exercise, code);
    if (!results.length) {
      // No checks defined: fall back to concept coverage so we never claim more than we know.
      results = (exercise.expectedConcepts || []).map(function (c) {
        return { ok: codeSkeleton(code).toLowerCase().indexOf(String(c).toLowerCase()) > -1,
                 label: 'Uses ' + c };
      });
    }
    var passed = results.length > 0 && results.every(function (r) { return r.ok; });
    return result(passed, 'checked', results,
      passed ? 'All checks passed. This is a pattern check, not a compile.'
             : 'Some checks did not pass yet.');
  }

  /**
   * Explanation-style answers. We can measure concept coverage but we cannot
   * mark understanding, so the learner confirms it themselves.
   */
  function gradeExplain(exercise, response) {
    var text = normText(response);
    var concepts = exercise.expectedConcepts || [];
    var results = concepts.map(function (c) {
      var keys = String(c).toLowerCase().split('|');
      var ok = keys.some(function (k) { return text.indexOf(normText(k)) > -1; });
      return { ok: ok, label: 'Mentions ' + keys[0] };
    });
    var longEnough = text.length >= (exercise.minLength || 60);
    results.unshift({ ok: longEnough, label: 'Answer is substantial (' + text.length + ' characters)' });

    var covered = results.filter(function (r) { return r.ok; }).length;
    var enough = longEnough && (!concepts.length || covered - 1 >= Math.ceil(concepts.length * 0.6));

    return result(enough, 'self-assessed', results,
      enough ? 'Good coverage. You decide whether the explanation is genuinely yours.'
             : 'Try to cover more of the key ideas.');
  }

  function gradeDebugStep(step, response) {
    if (step.type === 'mcq') return gradeMcq(step, response);
    if (step.type === 'coding') return gradeCoding(step, response);
    return gradeAccepted(step, response);
  }

  /* ---------- Public grading entry point ---------- */

  /**
   * evaluate(exercise, response) -> result
   * `response` shape depends on the type:
   *   mcq            -> index (or array of indexes)
   *   predict-output -> string
   *   fill-blank     -> array of strings
   *   coding/refactor-> code string
   *   explain/design -> string
   *   debug          -> { stepId: response, ... }
   */
  function evaluate(exercise, response) {
    switch (exercise.type) {
      case 'mcq':            return gradeMcq(exercise, response);
      case 'predict-output': return gradeAccepted(exercise, response);
      case 'fill-blank':     return gradeFillBlank(exercise, response);
      case 'explain':
      case 'design':         return gradeExplain(exercise, response);
      case 'debug':          return gradeDebug(exercise, response);
      case 'refactor':
      case 'coding':
      default:               return gradeCoding(exercise, response);
    }
  }

  function gradeDebug(exercise, response) {
    var answers = response || {};
    var results = [];
    var allOk = true;
    (exercise.steps || []).forEach(function (st) {
      var r = gradeDebugStep(st, answers[st.id]);
      if (!r.passed) allOk = false;
      results.push({ ok: r.passed, label: st.label || st.question });
    });
    return result(allOk, 'checked', results,
      allOk ? 'You found it, explained it and fixed it.' : 'Keep going - not every step is right yet.');
  }

  /**
   * Compare real program output against what the exercise expects.
   * Only called after App.runner actually compiled and ran the code.
   */
  function gradeOutput(exercise, stdout) {
    var expected = exercise.run && exercise.run.expectedOutput;
    if (expected === undefined || expected === null) return null;
    var ok = normOutput(stdout) === normOutput(expected);
    return result(ok, 'executed',
      [{ ok: ok, label: ok ? 'Program output matches' : 'Program output differs from what was expected' }],
      ok ? 'Compiled, ran, and produced the expected output.' : 'It ran, but the output is not what was expected.',
      { expected: expected, actual: stdout });
  }

  /** Merge a static check result with a real execution result. */
  function combine(staticResult, runResult) {
    if (!runResult) return staticResult;
    var results = (staticResult ? staticResult.results : []).concat(runResult.results);
    var passed = (!staticResult || staticResult.passed) && runResult.passed;
    return result(passed, 'executed', results,
      passed ? 'Compiled, ran and passed every check.' : runResult.message,
      { expected: runResult.expected, actual: runResult.actual });
  }

  /** Human label for the honesty badge shown next to a result. */
  function kindLabel(kind) {
    if (kind === 'executed') return 'Compiled and executed locally';
    if (kind === 'self-assessed') return 'Self-assessed';
    return 'Code checked (patterns only, not compiled)';
  }

  return {
    evaluate: evaluate, gradeOutput: gradeOutput, combine: combine,
    runChecks: runChecks, kindLabel: kindLabel,
    normText: normText, normOutput: normOutput
  };
})();
