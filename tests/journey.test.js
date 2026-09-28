/* ============================================================
   tests/journey.test.js
   The full user journey from the brief, executed as one run:

     dashboard -> start session -> Variables -> lesson -> examples
     -> guided -> independent -> knowledge check -> explanation
     -> no-help challenge -> topic complete -> progress updates
     -> review scheduled -> dashboard updates -> session in history
     -> statistics update
   ============================================================ */
const { boot } = require('./harness');

let pass = 0, fail = 0;
function step(name, fn) {
  try { const r = fn(); if (r === false) throw new Error('returned false'); pass++; console.log('  ok  ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e.message).split('\n').slice(0,3).join('\n       ')); }
}

const { window, errors } = boot();
const App = window.App, doc = window.document, U = App.utils;
const TOPIC = 'fundamentals:variables';

function goto(route, params) {
  App.router.go(route, params);
  window.dispatchEvent(new window.Event('hashchange'));
}
function el(s) { return doc.querySelector(s); }
function click(s) {
  const t = typeof s === 'string' ? el(s) : s;
  if (!t) throw new Error('missing element: ' + s);
  t.dispatchEvent(new window.Event('click', { bubbles: true }));
  return t;
}
if (el('[data-fresh]')) click('[data-fresh]');

console.log('\n=== THE COMPLETE USER JOURNEY ===\n');

step('1. Dashboard opens on a fresh tracker at 0%', () => {
  goto('dashboard');
  const html = doc.getElementById('view').innerHTML;
  return App.progress.overall().percent === 0 && html.includes('Current learning');
});

step('2. Start session suggests the first topic with a lesson', () => {
  App.sessionControl.start();
  const form = doc.querySelector('.modal-backdrop:last-child form');
  const suggested = form.elements.topicId.value;
  if (!App.lessons.has(suggested)) throw new Error('suggested a topic with no lesson: ' + suggested);
  form.elements.topicId.value = TOPIC;
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  window.dispatchEvent(new window.Event('hashchange'));
  return !!App.sessionControl.active();
});

step('3. It lands on the Variables learning page', () =>
  App.router.route() === 'learn' && App.router.params().topic === TOPIC &&
  doc.getElementById('page-title').textContent === 'Variables');

step('4. Reading every lesson section completes the lesson step', () => {
  const lesson = App.lessons.get(TOPIC);
  lesson.sections.forEach(sec => {
    const btn = doc.querySelector('[data-read="' + sec.id + '"]');
    if (btn) click(btn);
  });
  const flow = App.lessons.steps(App.store.topicById(TOPIC));
  const st = flow.steps.find(s => s.id === 'lesson');
  if (!st.complete) throw new Error(st.done + '/' + st.total + ' sections read');
  return true;
});

step('5. Reading alone earns Learning - and no scores', () => {
  const t = App.store.topicById(TOPIC);
  if (t.status !== 'learning') throw new Error('status is ' + t.status);
  return t.understanding === 0 && t.coding === 0 && t.problemSolving === 0;
});

step('6. Viewing the worked examples completes that step', () => {
  App.views.learn.ui.view = 'examples';
  App.router.refresh();
  const lesson = App.lessons.get(TOPIC);
  lesson.examples.forEach(ex => {
    const btn = doc.querySelector('[data-example="' + ex.id + '"]');
    if (btn) click(btn);
  });
  return App.lessons.steps(App.store.topicById(TOPIC)).steps.find(s => s.id === 'examples').complete;
});

function solveLevel(level) {
  const lesson = App.lessons.get(TOPIC);
  App.views.learn.ui.view = 'practice';
  App.views.learn.ui.level = level;
  App.router.refresh();

  App.lessons.exercisesByLevel(lesson, level).forEach(ex => {
    App.views.learn.ui.view = 'practice';
    App.views.learn.ui.level = level;
    App.router.refresh();

    if (ex.type === 'mcq') {
      const radio = doc.querySelector('input[data-choice="' + ex.id + '"][value="' + ex.answer + '"]');
      if (radio) { radio.checked = true; radio.dispatchEvent(new window.Event('change', { bubbles: true })); }
    } else if (ex.type === 'predict-output') {
      const f = doc.querySelector('[data-answer="' + ex.id + '"]');
      if (f) { f.value = ex.accept[0]; f.dispatchEvent(new window.Event('input', { bubbles: true })); }
    } else if (ex.type === 'fill-blank') {
      ex.blanks.forEach((b, i) => {
        const f = doc.querySelector('[data-blank="' + ex.id + '|' + i + '"]');
        if (f) { f.value = b.accept[0]; f.dispatchEvent(new window.Event('input', { bubbles: true })); }
      });
    } else if (ex.type === 'explain' || ex.type === 'design') {
      const f = doc.querySelector('[data-answer="' + ex.id + '"]');
      if (f) { f.value = ex.solution; f.dispatchEvent(new window.Event('input', { bubbles: true })); }
    } else if (ex.type === 'debug') {
      ex.steps.forEach(st => {
        if (st.type === 'mcq') {
          const r = doc.querySelector('input[data-choice="' + ex.id + '|' + st.id + '"][value="' + st.answer + '"]');
          if (r) { r.checked = true; r.dispatchEvent(new window.Event('change', { bubbles: true })); }
        } else if (st.type === 'coding') {
          const c = doc.querySelector('[data-code="' + ex.id + '|' + st.id + '"]');
          if (c) { c.value = ex.solution; c.dispatchEvent(new window.Event('input', { bubbles: true })); }
        } else {
          const a = doc.querySelector('[data-step-answer="' + ex.id + '|' + st.id + '"]');
          if (a) { a.value = (st.accept || [''])[0]; a.dispatchEvent(new window.Event('input', { bubbles: true })); }
        }
      });
    } else {
      const c = doc.querySelector('[data-code="' + ex.id + '"]');
      if (c) { c.value = ex.solution; c.dispatchEvent(new window.Event('input', { bubbles: true })); }
    }

    const btn = doc.querySelector('[data-check="' + ex.id + '"]');
    if (btn) click(btn);
  });
}

step('7. Solving the guided (level 2) exercises', () => {
  solveLevel(2);
  const flow = App.lessons.steps(App.store.topicById(TOPIC));
  const s = flow.steps.find(x => x.id === 'guided');
  if (!s.complete) throw new Error(s.done + '/' + s.total + ' guided passed');
  return true;
});

step('8. Passing exercises promotes to Practicing and earns real scores', () => {
  const t = App.store.topicById(TOPIC);
  if (t.status !== 'practicing') throw new Error('status is ' + t.status);
  return t.coding > 0 || t.understanding > 0 || t.problemSolving > 0;
});

step('9. Solving the independent (level 3) exercises', () => {
  solveLevel(3);
  const s = App.lessons.steps(App.store.topicById(TOPIC)).steps.find(x => x.id === 'independent');
  if (!s.complete) throw new Error(s.done + '/' + s.total + ' independent passed');
  return true;
});

step('10. Solving the applied (level 4) exercise', () => {
  solveLevel(4);
  return App.lessons.steps(App.store.topicById(TOPIC)).steps.find(x => x.id === 'applied').complete;
});

step('11. Comfortable is still withheld until the knowledge check', () => {
  const m = App.mastery.evaluate(App.store.topicById(TOPIC));
  return !m.comfortable.met && App.store.topicById(TOPIC).status === 'practicing';
});

step('12. Passing the knowledge check', () => {
  App.views.learn.ui.view = 'check';
  App.router.refresh();
  App.lessons.get(TOPIC).knowledgeChecks.forEach(q => {
    if (q.type === 'mcq') {
      const r = doc.querySelector('input[data-choice="' + q.id + '"][value="' + q.answer + '"]');
      if (r) r.checked = true;
    } else {
      const f = doc.querySelector('[data-kc="' + q.id + '"]');
      if (f) f.value = (q.accept && q.accept[0]) || q.explanation || '';
    }
  });
  click('[data-kc-submit]');
  return App.store.topicById(TOPIC).learning.knowledgeCheck.passed === true;
});

step('13. The topic is now Comfortable - earned, not clicked', () => {
  const t = App.store.topicById(TOPIC);
  if (t.status !== 'comfortable') throw new Error('status is ' + t.status);
  return App.mastery.isManual(t) === false;
});

step('14. Writing the explanation in your own words', () => {
  App.views.learn.ui.view = 'explain';
  App.router.refresh();
  const ta = el('[data-explanation]');
  ta.value = 'A variable is a named piece of memory that holds one value of one declared type. ' +
             'The type never changes, which is what lets the compiler catch whole classes of mistake ' +
             'before the program ever runs.';
  click('[data-save-explanation]');
  return App.store.topicById(TOPIC).learning.explanation.length >= 80;
});

step('15. The no-help challenge shows its rules first', () => {
  App.views.learn.ui.view = 'challenge';
  App.router.refresh();
  const html = doc.getElementById('view').innerHTML;
  return html.includes('No AI') && !!el('[data-challenge-start]');
});

step('16. Passing the no-help challenge', () => {
  click('[data-challenge-start]');
  const ex = App.lessons.exercisesByLevel(App.lessons.get(TOPIC), 5)[0];
  const c = doc.querySelector('[data-code="' + ex.id + '"]');
  c.value = ex.solution;
  c.dispatchEvent(new window.Event('input', { bubbles: true }));
  click('[data-challenge-submit="' + ex.id + '"]');
  return App.store.topicById(TOPIC).learning.challenge.passed === true;
});

step('17. The topic is now Mastered, with every requirement met', () => {
  const t = App.store.topicById(TOPIC);
  if (t.status !== 'mastered') {
    const m = App.mastery.evaluate(t);
    throw new Error('unmet: ' + m.mastered.requirements.filter(r => !r.met).map(r => r.id).join(', '));
  }
  return App.mastery.evaluate(t).mastered.met === true;
});

step('18. The lesson reports 100% complete', () =>
  App.lessons.steps(App.store.topicById(TOPIC)).percent === 100);

step('19. Overall progress has moved', () => {
  const o = App.progress.overall();
  return o.percent > 0 && o.mastered === 1 && o.completed === 1;
});

step('20. The challenge was logged to the Challenges page', () => {
  goto('challenges');
  const list = App.store.get().challenges;
  return list.length >= 1 && list[list.length - 1].topicId === TOPIC &&
         doc.getElementById('view').innerHTML.includes('Success rate');
});

step('21. A review can be scheduled via the retrieval test', () => {
  App.reviewFlow.open(TOPIC);
  if (!el('[data-rt]')) throw new Error('no retrieval test');
  click('[data-rt-check]');
  click('[data-rt-continue]');
  click('[data-quality="good"]');
  const t = App.store.topicById(TOPIC);
  return !!t.nextReview && U.daysBetween(U.today(), t.nextReview) > 0;
});

step('22. Ending the session records it with the work done', () => {
  App.sessionControl.stop();
  const form = doc.querySelector('.modal-backdrop:last-child form');
  if (Number(form.elements.exercises.value) < 1) throw new Error('exercise count not prefilled');
  form.elements.learned.value = 'Variables, types and definite assignment';
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  return App.store.get().sessions.length === 1 && !App.sessionControl.active();
});

step('23. The session appears in the sessions history', () => {
  goto('sessions');
  return doc.getElementById('view').innerHTML.includes('Variables');
});

step('24. The dashboard reflects everything', () => {
  goto('dashboard');
  const html = doc.getElementById('view').innerHTML;
  const m = App.mastery.metrics();
  if (m.demonstratedTopics !== 1) throw new Error('demonstrated ' + m.demonstratedTopics);
  return html.includes('Recent achievements') && html.includes('Viewed vs demonstrated');
});

step('25. Achievements were unlocked along the way', () => {
  const ids = App.store.get().achievements.map(a => a.id);
  const expected = ['first-lesson', 'first-exercise', 'first-check', 'first-challenge', 'first-mastered'];
  const missing = expected.filter(e => !ids.includes(e));
  if (missing.length) throw new Error('missing: ' + missing.join(', '));
  return true;
});

step('26. Statistics show time invested AND skill demonstrated', () => {
  goto('statistics');
  const html = doc.getElementById('view').innerHTML;
  return html.includes('Time invested') && html.includes('Skill demonstrated') &&
         html.includes('Skill profile');
});

step('27. The next topic is suggested automatically', () => {
  const next = App.lessons.suggestedTopic();
  return next && next.id !== TOPIC && App.lessons.has(next.id);
});

step('28. Everything survives an export/import round trip', () => {
  const json = App.store.exportJSON();
  App.store.resetAll();
  App.store.importJSON(json);
  const t = App.store.topicById(TOPIC);
  return t.status === 'mastered' && t.learning.challenge.passed &&
         App.store.get().sessions.length === 1 &&
         App.store.get().achievements.length >= 5;
});

step('29. No uncaught errors during the entire journey', () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join('; '));
  return true;
});

console.log('\n---------------------------------------');
console.log(pass + ' steps passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
