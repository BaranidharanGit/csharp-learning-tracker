/* Tests for the learning engine added in schema v2. */
const { boot } = require('./harness');

let pass = 0, fail = 0;
function check(name, fn) {
  try { const r = fn(); if (r === false) throw new Error('returned false'); pass++; console.log('  ok  ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e.message).split('\n').slice(0,3).join('\n       ')); }
}

const { window, errors } = boot();
const App = window.App, doc = window.document, U = App.utils;

function goto(route, params) {
  App.router.go(route, params);
  window.dispatchEvent(new window.Event('hashchange'));
}
function el(sel) { return doc.querySelector(sel); }
function click(sel) {
  const t = typeof sel === 'string' ? el(sel) : sel;
  if (!t) throw new Error('no element for ' + sel);
  t.dispatchEvent(new window.Event('click', { bubbles: true }));
  return t;
}
// Dismiss the welcome dialog
if (el('[data-fresh]')) click('[data-fresh]');

const TOPIC = 'fundamentals:variables';

console.log('\n== lesson registry ==');
check('15 lessons registered', () => App.lessons.all().length === 15);
check('every lesson id matches a real roadmap topic', () =>
  App.lessons.all().every(l => !!App.store.topicById(l.topicId)));
check('every lesson topic is in the fundamentals phase', () =>
  App.lessons.all().every(l => l.phaseId === 'fundamentals'));
check('all 15 fundamentals topics are covered', () => {
  const cov = App.lessons.phaseCoverage('fundamentals');
  if (cov.withLesson !== 15) throw new Error('covered ' + cov.withLesson);
  return cov.without === 0;
});
check('other phases correctly report no lessons', () =>
  App.lessons.phaseCoverage('sql').withLesson === 0);
check('exercise ids are globally unique', () => {
  const ids = App.lessons.all().flatMap(l => l.exercises.map(x => x.id));
  return new Set(ids).size === ids.length;
});
check('every lesson has all five flow stages', () => {
  return App.lessons.all().every(l =>
    l.sections.length && l.examples.length &&
    App.lessons.exercisesByLevel(l, 2).length >= 3 &&
    App.lessons.exercisesByLevel(l, 3).length >= 3 &&
    App.lessons.exercisesByLevel(l, 4).length >= 1 &&
    App.lessons.exercisesByLevel(l, 5).length >= 1 &&
    l.knowledgeChecks.length >= 4);
});
check('no-help challenges ship no hints', () =>
  App.lessons.all().every(l =>
    App.lessons.exercisesByLevel(l, 5).every(x => !x.hints || x.hints.length === 0)));

console.log('\n== schema v2 defaults ==');
check('new topics get a learning record', () => {
  const t = App.store.topicById(TOPIC);
  return t.learning && t.learning.level === 1 && t.learning.exercises &&
         t.learning.knowledgeCheck.attempts === 0;
});
check('new topics get a debugging score', () => App.store.topicById(TOPIC).debugging === 0);
check('achievements array exists', () => Array.isArray(App.store.get().achievements));
check('schemaVersion is 2', () => App.store.get().schemaVersion === 2);

console.log('\n== v1 -> v2 migration (backward compatibility) ==');
check('a v1 document loads without losing data', () => {
  // A genuine schema-v1 export: no learning, no debugging, no achievements.
  const v1 = {
    schemaVersion: 1,
    settings: { theme: 'light', dailyGoalMinutes: 45, focusTopicId: null },
    dailyGoal: { date: null, text: '', done: false },
    topics: [{
      id: 'fundamentals:variables', name: 'Variables', phaseId: 'fundamentals', order: 0,
      status: 'practicing', understanding: 3, coding: 2, problemSolving: 2,
      lastReviewed: '2026-01-01', nextReview: '2026-01-08', reviewStep: 2, reviewCount: 4,
      notes: 'my old note', mistakes: 'old mistake', evidence: '', custom: false,
      createdAt: '2026-01-01', updatedAt: '2026-01-01'
    }],
    sessions: [{ id: 's1', date: '2026-01-01', startTime: '10:00', endTime: '11:00',
                 durationMinutes: 60, topicId: 'fundamentals:variables', learned: 'x',
                 struggled: '', exercises: 2, confidence: 3, notes: '' }],
    challenges: [], projects: [], activeSession: null,
    meta: { createdAt: '2026-01-01', projectsSeeded: true, demoLoaded: false, onboarded: true }
  };
  App.store.importJSON(JSON.stringify(v1));
  const t = App.store.topicById('fundamentals:variables');

  if (t.notes !== 'my old note') throw new Error('notes lost');
  if (t.status !== 'practicing') throw new Error('status lost');
  if (t.understanding !== 3) throw new Error('scores lost');
  if (t.reviewCount !== 4) throw new Error('review history lost');
  if (App.store.get().settings.dailyGoalMinutes !== 45) throw new Error('settings lost');
  if (App.store.get().sessions.length !== 1) throw new Error('sessions lost');
  return true;
});
check('migration adds the learning record with defaults', () => {
  const t = App.store.topicById('fundamentals:variables');
  return t.learning && t.learning.level === 1 && t.learning.lessonViewed === false &&
         Object.keys(t.learning.exercises).length === 0;
});
check('migration adds the debugging score at 0', () =>
  App.store.topicById('fundamentals:variables').debugging === 0);
check('migration adds hint counters to old sessions', () => {
  const s = App.store.get().sessions[0];
  return s.hintsUsed === 0 && s.solutionsViewed === 0;
});
check('migration backfills the rest of the roadmap', () =>
  App.store.get().topics.length === 175);
check('migration seeds the mini-project into an old document', () =>
  App.store.get().projects.some(p => p.isMiniProject));
check('migration bumps schemaVersion to 2', () => App.store.get().schemaVersion === 2);
check('a v1 document with a partial learning record is repaired', () => {
  const partial = JSON.parse(App.store.exportJSON());
  partial.data.topics[0].learning = { lessonViewed: true };   // missing everything else
  App.store.importJSON(JSON.stringify(partial));
  const L = App.store.topicById('fundamentals:variables').learning;
  return L.lessonViewed === true && L.exercises && L.knowledgeCheck && L.challenge &&
         typeof L.explanation === 'string';
});

App.store.resetAll();

console.log('\n== lesson progress ==');
check('a fresh topic is 0% through its lesson', () => {
  const flow = App.lessons.steps(App.store.topicById(TOPIC));
  return flow.percent === 0 && flow.next.id === 'lesson';
});
check('steps() returns null for a topic with no lesson', () =>
  App.lessons.steps(App.store.topicById('sql:joins')) === null);
check('reading sections advances the lesson step only', () => {
  const lesson = App.lessons.get(TOPIC);
  App.store.updateLearning(TOPIC, L => {
    L.lessonViewed = true;
    L.sectionsRead = lesson.sections.map(s => s.id);
  });
  const flow = App.lessons.steps(App.store.topicById(TOPIC));
  if (!flow.steps.find(s => s.id === 'lesson').complete) throw new Error('lesson step not complete');
  return flow.next.id === 'examples';
});
check('reading alone earns no score', () => {
  App.mastery.recompute(TOPIC);
  const t = App.store.topicById(TOPIC);
  return t.understanding === 0 && t.coding === 0 && t.problemSolving === 0;
});
check('reading alone promotes only to Learning', () =>
  App.store.topicById(TOPIC).status === 'learning');
check('nextActionLabel is human readable', () => {
  const label = App.lessons.nextActionLabel(App.store.topicById(TOPIC));
  return typeof label === 'string' && label.length > 3;
});

console.log('\n== exercise engine ==');
const EX = App.lessons.get(TOPIC).exercises;
const mcq = EX.find(x => x.type === 'mcq');
const predict = EX.find(x => x.type === 'predict-output');
const coding = EX.find(x => x.type === 'coding');
const fill = EX.find(x => x.type === 'fill-blank');
const explain = EX.find(x => x.type === 'explain');
const dbg = EX.find(x => x.type === 'debug');

check('mcq grades the right answer', () => App.exercises.evaluate(mcq, mcq.answer).passed);
check('mcq rejects a wrong answer', () =>
  !App.exercises.evaluate(mcq, (mcq.answer + 1) % mcq.options.length).passed);
check('mcq rejects no answer', () => !App.exercises.evaluate(mcq, null).passed);
check('predict-output accepts the expected answer', () =>
  App.exercises.evaluate(predict, predict.accept[0]).passed);
check('predict-output ignores case and spacing', () =>
  App.exercises.evaluate(predict, '  ' + predict.accept[0].toUpperCase() + ' ').passed);
check('predict-output rejects nonsense', () =>
  !App.exercises.evaluate(predict, 'definitely not the answer').passed);
check('coding accepts its own solution', () => {
  const r = App.exercises.evaluate(coding, coding.solution);
  if (!r.passed) throw new Error(r.results.filter(x => !x.ok).map(x => x.label).join('; '));
  return true;
});
check('coding rejects empty code', () => !App.exercises.evaluate(coding, '').passed);
check('coding rejects code missing the required concepts', () =>
  !App.exercises.evaluate(coding, 'Console.WriteLine("hello");').passed);
check('static checks ignore commented-out code', () => {
  const sneaky = '// decimal salary = 1m;\nConsole.WriteLine("x");';
  return !App.exercises.evaluate(coding, sneaky).passed;
});
check('fill-blank accepts all correct blanks', () =>
  App.exercises.evaluate(fill, fill.blanks.map(b => b.accept[0])).passed);
check('fill-blank rejects one wrong blank', () => {
  const answers = fill.blanks.map(b => b.accept[0]);
  answers[0] = 'wrong';
  return !App.exercises.evaluate(fill, answers).passed;
});
check('explain is marked self-assessed', () =>
  App.exercises.evaluate(explain, explain.solution).kind === 'self-assessed');
check('explain rejects a one-word answer', () => !App.exercises.evaluate(explain, 'yes').passed);
check('explain accepts a full answer covering the concepts', () =>
  App.exercises.evaluate(explain, explain.solution).passed);
check('debug requires every step', () => {
  const answers = {};
  dbg.steps.forEach(st => {
    if (st.type === 'mcq') answers[st.id] = st.answer;
    else if (st.type === 'coding') answers[st.id] = dbg.solution;
    else answers[st.id] = (st.accept || [''])[0];
  });
  if (!App.exercises.evaluate(dbg, answers).passed) throw new Error('correct answers rejected');
  answers[dbg.steps[0].id] = 99;
  return !App.exercises.evaluate(dbg, answers).passed;
});
check('static grading never claims to have compiled', () =>
  App.exercises.evaluate(coding, coding.solution).kind === 'checked');
check('kindLabel is explicit about what was checked', () => {
  return App.exercises.kindLabel('checked').includes('not compiled') &&
         App.exercises.kindLabel('executed').includes('Compiled');
});
check('gradeOutput compares real program output', () => {
  const ex = { run: { expectedOutput: 'a\nb' } };
  return App.exercises.gradeOutput(ex, 'a\nb\n').passed &&
         App.exercises.gradeOutput(ex, 'a\nc').passed === false &&
         App.exercises.gradeOutput(ex, 'a\nb').kind === 'executed';
});
check('gradeOutput returns null when no output is expected', () =>
  App.exercises.gradeOutput({}, 'anything') === null);

console.log('\n== mastery ==');
function passAll(topicId, level) {
  const lesson = App.lessons.get(topicId);
  App.lessons.exercisesByLevel(lesson, level).forEach(x => {
    App.store.recordExercise(topicId, x.id, { passed: true, hintsUsed: 0, solutionViewed: false });
  });
  App.mastery.recompute(topicId);
}

check('passing an exercise raises the level', () => {
  passAll(TOPIC, 2);
  return App.store.topicById(TOPIC).learning.level === 2;
});
check('passing exercises promotes to Practicing', () =>
  App.store.topicById(TOPIC).status === 'practicing');
check('coding score comes from passed coding exercises', () => {
  const d = App.mastery.demonstrated(App.store.topicById(TOPIC));
  return d.coding !== null && d.coding > 0;
});
check('Comfortable is not granted without the knowledge check', () => {
  passAll(TOPIC, 3);
  const m = App.mastery.evaluate(App.store.topicById(TOPIC));
  if (m.comfortable.met) throw new Error('granted too early');
  return m.comfortable.requirements.find(r => r.id === 'knowledge').met === false;
});
check('passing the knowledge check grants Comfortable', () => {
  App.store.updateLearning(TOPIC, L => {
    L.knowledgeCheck.attempts = 1;
    L.knowledgeCheck.bestScore = 100;
    L.knowledgeCheck.passed = true;
  });
  App.mastery.recompute(TOPIC);
  return App.store.topicById(TOPIC).status === 'comfortable';
});
check('Mastered still requires the challenge and an explanation', () => {
  const m = App.mastery.evaluate(App.store.topicById(TOPIC));
  return !m.mastered.met &&
         m.mastered.requirements.find(r => r.id === 'challenge').met === false &&
         m.mastered.requirements.find(r => r.id === 'explain').met === false;
});
check('completing everything grants Mastered', () => {
  passAll(TOPIC, 4);
  passAll(TOPIC, 5);
  App.store.updateLearning(TOPIC, L => {
    L.challenge.passed = true;
    L.challenge.attempts = 1;
    L.explanation = 'A variable is a named piece of memory holding one value of one type. ' +
                    'The type is fixed for its whole life, which lets the compiler catch mistakes early.';
  });
  App.mastery.recompute(TOPIC);
  const t = App.store.topicById(TOPIC);
  if (t.status !== 'mastered') {
    const m = App.mastery.evaluate(t);
    throw new Error('missing: ' + m.mastered.requirements.filter(r => !r.met).map(r => r.id).join(','));
  }
  return true;
});
check('hints reduce the demonstrated score', () => {
  App.store.resetAll();
  const t2 = 'fundamentals:loops';
  const lesson = App.lessons.get(t2);
  const codingEx = lesson.exercises.filter(x => x.type === 'coding' || x.type === 'refactor' || x.type === 'fill-blank');
  codingEx.forEach(x => App.store.recordExercise(t2, x.id, { passed: true, hintsUsed: 3, solutionViewed: false }));
  const withHints = App.mastery.demonstrated(App.store.topicById(t2)).coding;

  App.store.resetAll();
  codingEx.forEach(x => App.store.recordExercise(t2, x.id, { passed: true, hintsUsed: 0, solutionViewed: false }));
  const without = App.mastery.demonstrated(App.store.topicById(t2)).coding;

  if (!(without > withHints)) throw new Error(without + ' vs ' + withHints);
  return true;
});
check('viewing the solution reduces the score further', () => {
  App.store.resetAll();
  const t2 = 'fundamentals:loops';
  const codingEx = App.lessons.get(t2).exercises.filter(x => x.type === 'coding' || x.type === 'refactor' || x.type === 'fill-blank');
  codingEx.forEach(x => App.store.recordExercise(t2, x.id, { passed: true, hintsUsed: 1, solutionViewed: true }));
  const peeked = App.mastery.demonstrated(App.store.topicById(t2)).coding;
  App.store.resetAll();
  codingEx.forEach(x => App.store.recordExercise(t2, x.id, { passed: true, hintsUsed: 1, solutionViewed: false }));
  return App.mastery.demonstrated(App.store.topicById(t2)).coding > peeked;
});
check('an unaided pass is marked independent', () => {
  App.store.resetAll();
  App.store.recordExercise(TOPIC, 'x1', { passed: true, hintsUsed: 0, solutionViewed: false });
  return App.store.topicById(TOPIC).learning.exercises['x1'].independent === true;
});
check('a hinted pass is not independent', () => {
  App.store.recordExercise(TOPIC, 'x2', { passed: true, hintsUsed: 1, solutionViewed: false });
  return App.store.topicById(TOPIC).learning.exercises['x2'].independent === false;
});
check('passing is sticky across a later failed retry', () => {
  App.store.recordExercise(TOPIC, 'x3', { passed: true });
  App.store.recordExercise(TOPIC, 'x3', { passed: false });
  return App.store.topicById(TOPIC).learning.exercises['x3'].passed === true;
});
check('demonstrated scores never lower a stored score', () => {
  App.store.resetAll();
  App.store.updateTopic(TOPIC, { coding: 5 });     // set by hand
  App.store.recordExercise(TOPIC, App.lessons.get(TOPIC).exercises[0].id,
    { passed: true, hintsUsed: 0, solutionViewed: false });
  App.mastery.recompute(TOPIC);
  return App.store.topicById(TOPIC).coding === 5;
});
check('auto-promotion never demotes an existing status', () => {
  App.store.resetAll();
  App.store.updateTopic(TOPIC, { status: 'mastered' });
  App.store.updateLearning(TOPIC, L => { L.lessonViewed = true; });
  App.mastery.recompute(TOPIC);
  return App.store.topicById(TOPIC).status === 'mastered';
});
check('a topic without a lesson keeps its status', () => {
  App.store.updateTopic('sql:joins', { status: 'comfortable' });
  const m = App.mastery.evaluate(App.store.topicById('sql:joins'));
  return m.hasLesson === false && m.earnedStatus === 'comfortable';
});

console.log('\n== manual override ==');
App.store.resetAll();
check('setting a status by hand marks it manual', () => {
  App.mastery.setManualStatus(TOPIC, 'mastered');
  const t = App.store.topicById(TOPIC);
  return t.status === 'mastered' && App.mastery.isManual(t) === true;
});
check('a manual status survives recompute', () => {
  App.store.updateLearning(TOPIC, L => { L.lessonViewed = true; });
  App.mastery.recompute(TOPIC);
  return App.store.topicById(TOPIC).status === 'mastered';
});
check('clearing the override returns to the earned status', () => {
  App.mastery.clearManualStatus(TOPIC);
  const t = App.store.topicById(TOPIC);
  return t.status === 'learning' && App.mastery.isManual(t) === false;
});

console.log('\n== achievements ==');
App.store.resetAll();
check('no achievements on a fresh tracker', () => {
  App.mastery.checkAchievements();
  return App.store.get().achievements.length === 0;
});
check('opening a lesson unlocks the first achievement', () => {
  App.store.updateLearning(TOPIC, L => { L.lessonViewed = true; });
  App.mastery.checkAchievements();
  return App.store.get().achievements.some(a => a.id === 'first-lesson');
});
check('an achievement unlocks only once', () => {
  const before = App.store.get().achievements.length;
  App.mastery.checkAchievements();
  App.mastery.checkAchievements();
  return App.store.get().achievements.length === before;
});
check('passing an exercise unlocks first-exercise', () => {
  App.store.recordExercise(TOPIC, 'a1', { passed: true });
  App.mastery.checkAchievements();
  return App.store.get().achievements.some(a => a.id === 'first-exercise');
});
check('recentAchievements returns readable labels', () => {
  const r = App.mastery.recentAchievements(3);
  return r.length > 0 && r[0].label.length > 5 && r[0].date === U.today();
});

console.log('\n== metrics ==');
check('metrics separate viewed from demonstrated', () => {
  App.store.resetAll();
  App.store.updateLearning(TOPIC, L => { L.lessonViewed = true; });
  App.store.updateLearning('fundamentals:loops', L => { L.lessonViewed = true; });
  App.store.recordExercise(TOPIC, 'e1', { passed: true });
  const m = App.mastery.metrics();
  if (m.lessonsViewed !== 2) throw new Error('viewed ' + m.lessonsViewed);
  if (m.demonstratedTopics !== 1) throw new Error('demonstrated ' + m.demonstratedTopics);
  return true;
});
check('metrics count hints and solutions', () => {
  App.store.resetAll();
  App.store.recordExercise(TOPIC, 'e1', { passed: true, hintsUsed: 2, solutionViewed: true });
  const m = App.mastery.metrics();
  return m.hintsUsed === 2 && m.solutionsViewed === 1;
});

console.log('\n== learning page rendering ==');
App.store.resetAll();
const VIEWS = ['lesson', 'examples', 'practice', 'check', 'explain', 'challenge', 'mastery'];
for (const v of VIEWS) {
  check('renders the ' + v + ' view', () => {
    App.views.learn.ui.topicId = null;          // force a clean mount
    goto('learn', { topic: TOPIC, view: v });
    const host = doc.getElementById('view');
    if (!host.innerHTML.trim()) throw new Error('empty');
    if (host.querySelector('script')) throw new Error('script element rendered');
    return true;
  });
}
check('renders a topic with no lesson gracefully', () => {
  goto('learn', { topic: 'sql:joins' });
  const html = doc.getElementById('view').innerHTML;
  return html.includes('no lesson') || html.includes('Lesson not written yet');
});
check('renders a missing topic without crashing', () => {
  goto('learn', { topic: 'does:not-exist' });
  return doc.getElementById('view').innerHTML.includes('not found');
});
check('the page title follows the topic', () => {
  goto('learn', { topic: TOPIC });
  return doc.getElementById('page-title').textContent === 'Variables';
});

console.log('\n== learning page interaction ==');
App.store.resetAll();
App.views.learn.ui.topicId = null;
goto('learn', { topic: TOPIC, view: 'lesson' });

check('marking a section read is recorded', () => {
  click('[data-read]');
  const L = App.store.topicById(TOPIC).learning;
  return L.sectionsRead.length === 1 && L.lessonViewed === true;
});
check('opening an example records it', () => {
  App.views.learn.ui.view = 'examples';
  App.router.refresh();
  click('[data-example]');
  return App.store.topicById(TOPIC).learning.examplesViewed.length === 1;
});
check('revealing a hint is recorded immediately', () => {
  App.views.learn.ui.view = 'practice';
  App.views.learn.ui.level = 2;
  App.router.refresh();
  const btn = el('[data-hint]');
  const exId = btn.getAttribute('data-hint');
  click(btn);
  return App.store.topicById(TOPIC).learning.exercises[exId].hintsUsed === 1;
});
check('submitting a correct coding answer passes and promotes', () => {
  App.views.learn.ui.view = 'practice';
  App.views.learn.ui.level = 2;
  App.router.refresh();
  const ex = App.lessons.exercisesByLevel(App.lessons.get(TOPIC), 2).find(x => x.type === 'coding');
  const area = doc.querySelector('[data-code="' + ex.id + '"]');
  area.value = ex.solution;
  area.dispatchEvent(new window.Event('input', { bubbles: true }));
  click('[data-check="' + ex.id + '"]');
  const st = App.store.topicById(TOPIC).learning.exercises[ex.id];
  if (!st.passed) throw new Error('not marked passed');
  return App.store.topicById(TOPIC).status === 'practicing';
});
check('an incorrect answer does not pass', () => {
  App.store.resetAll();
  App.views.learn.ui.topicId = null;
  goto('learn', { topic: TOPIC, view: 'practice' });
  const ex = App.lessons.exercisesByLevel(App.lessons.get(TOPIC), 2).find(x => x.type === 'coding');
  const area = doc.querySelector('[data-code="' + ex.id + '"]');
  area.value = 'Console.WriteLine("nope");';
  area.dispatchEvent(new window.Event('input', { bubbles: true }));
  click('[data-check="' + ex.id + '"]');
  return App.store.topicById(TOPIC).learning.exercises[ex.id].passed === false;
});
check('an mcq can be answered by clicking an option', () => {
  const ex = App.lessons.exercisesByLevel(App.lessons.get(TOPIC), 2).find(x => x.type === 'mcq');
  App.views.learn.ui.view = 'practice';
  App.router.refresh();
  const radio = doc.querySelector('input[data-choice="' + ex.id + '"][value="' + ex.answer + '"]');
  radio.checked = true;
  radio.dispatchEvent(new window.Event('change', { bubbles: true }));
  click('[data-check="' + ex.id + '"]');
  return App.store.topicById(TOPIC).learning.exercises[ex.id].passed === true;
});
check('the editor draft survives a re-render', () => {
  App.store.resetAll();
  App.views.learn.ui.topicId = null;
  goto('learn', { topic: TOPIC, view: 'practice' });
  const ex = App.lessons.exercisesByLevel(App.lessons.get(TOPIC), 2).find(x => x.type === 'coding');
  const area = doc.querySelector('[data-code="' + ex.id + '"]');
  area.value = 'int x = 42;';
  area.dispatchEvent(new window.Event('input', { bubbles: true }));
  App.router.refresh();
  return doc.querySelector('[data-code="' + ex.id + '"]').value === 'int x = 42;';
});
check('resetting the code restores the starter', () => {
  const ex = App.lessons.exercisesByLevel(App.lessons.get(TOPIC), 2).find(x => x.type === 'coding');
  click('[data-reset-code="' + ex.id + '"]');
  return doc.querySelector('[data-code="' + ex.id + '"]').value === ex.starterCode;
});

console.log('\n== knowledge check ==');
App.store.resetAll();
App.views.learn.ui.topicId = null;
goto('learn', { topic: TOPIC, view: 'check' });
check('all-correct answers pass the check', () => {
  const lesson = App.lessons.get(TOPIC);
  lesson.knowledgeChecks.forEach(q => {
    if (q.type === 'mcq') {
      const radio = doc.querySelector('input[data-choice="' + q.id + '"][value="' + q.answer + '"]');
      if (radio) { radio.checked = true; }
    } else {
      const field = doc.querySelector('[data-kc="' + q.id + '"]');
      if (field) field.value = (q.accept && q.accept[0]) || q.explanation || '';
    }
  });
  click('[data-kc-submit]');
  const L = App.store.topicById(TOPIC).learning;
  if (!L.knowledgeCheck.attempts) throw new Error('attempt not recorded');
  return L.knowledgeCheck.bestScore >= 70;
});
check('a failed check is recorded but not passed', () => {
  App.store.resetAll();
  App.views.learn.ui.topicId = null;
  goto('learn', { topic: TOPIC, view: 'check' });
  click('[data-kc-submit]');            // submit with nothing answered
  const L = App.store.topicById(TOPIC).learning;
  return L.knowledgeCheck.attempts === 1 && L.knowledgeCheck.passed === false;
});
check('the best score is kept across attempts', () => {
  const before = App.store.topicById(TOPIC).learning.knowledgeCheck.bestScore;
  click('[data-kc-retry]');
  click('[data-kc-submit]');
  return App.store.topicById(TOPIC).learning.knowledgeCheck.bestScore >= before;
});

console.log('\n== explanation and revision flag ==');
App.store.resetAll();
App.views.learn.ui.topicId = null;
goto('learn', { topic: TOPIC, view: 'explain' });
check('an explanation can be saved', () => {
  const ta = el('[data-explanation]');
  ta.value = 'A variable is a named piece of memory that holds one value of one declared type for its whole life.';
  click('[data-save-explanation]');
  return App.store.topicById(TOPIC).learning.explanation.length > 80;
});
check('"what I still do not understand" can be saved', () => {
  App.router.refresh();
  const ta = el('[data-unclear]');
  ta.value = 'When exactly a value type gets copied';
  click('[data-save-unclear]');
  return App.store.topicById(TOPIC).learning.stillUnclear.includes('copied');
});
check('a topic can be flagged as needing revision', () => {
  App.router.refresh();
  const cb = el('[data-needs-revision]');
  cb.checked = true;
  cb.dispatchEvent(new window.Event('change', { bubbles: true }));
  return App.store.topicById(TOPIC).learning.needsRevision === true;
});

console.log('\n== no-help challenge ==');
App.store.resetAll();
App.views.learn.ui.topicId = null;
goto('learn', { topic: TOPIC, view: 'challenge' });
check('the rules are shown before the challenge starts', () => {
  const html = doc.getElementById('view').innerHTML;
  return html.includes('No AI') && html.includes('No hints') && !!el('[data-challenge-start]');
});
check('the challenge exercise ships no hint button', () => {
  click('[data-challenge-start]');
  return !el('[data-hint]');
});
check('submitting a correct challenge passes and logs a challenge record', () => {
  const ex = App.lessons.exercisesByLevel(App.lessons.get(TOPIC), 5)[0];
  const before = App.store.get().challenges.length;
  const area = doc.querySelector('[data-code="' + ex.id + '"]');
  area.value = ex.solution;
  area.dispatchEvent(new window.Event('input', { bubbles: true }));
  click('[data-challenge-submit="' + ex.id + '"]');
  const L = App.store.topicById(TOPIC).learning;
  if (!L.challenge.passed) throw new Error('challenge not marked passed');
  if (App.store.get().challenges.length !== before + 1) throw new Error('no challenge record');
  return App.store.get().challenges[before].outcome === 'completed';
});
check('a failed challenge books a retry', () => {
  App.store.resetAll();
  App.views.learn.ui.topicId = null;
  goto('learn', { topic: TOPIC, view: 'challenge' });
  click('[data-challenge-start]');
  const ex = App.lessons.exercisesByLevel(App.lessons.get(TOPIC), 5)[0];
  const area = doc.querySelector('[data-code="' + ex.id + '"]');
  area.value = 'Console.WriteLine("nope");';
  area.dispatchEvent(new window.Event('input', { bubbles: true }));
  click('[data-challenge-submit="' + ex.id + '"]');
  const c = App.store.get().challenges[App.store.get().challenges.length - 1];
  return c.outcome === 'failed' && !!c.retryDate;
});

console.log('\n== session integration ==');
App.store.resetAll();
check('starting a session can open the lesson page', () => {
  App.sessionControl.start();
  const form = doc.querySelector('.modal-backdrop:last-child form');
  form.elements.topicId.value = TOPIC;
  form.elements.openLesson.checked = true;
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  window.dispatchEvent(new window.Event('hashchange'));
  return App.sessionControl.active() && App.router.route() === 'learn' &&
         App.router.params().topic === TOPIC;
});
check('a session can be paused and resumed', () => {
  App.sessionControl.pause();
  if (!App.sessionControl.isPaused()) throw new Error('not paused');
  const frozen = App.sessionControl.elapsedSeconds();
  App.sessionControl.resume();
  if (App.sessionControl.isPaused()) throw new Error('still paused');
  return App.sessionControl.elapsedSeconds() >= frozen;
});
check('paused time is excluded from the elapsed count', () => {
  const a = App.store.get().activeSession;
  App.store.update(s => {
    s.activeSession.startedAtMs = Date.now() - 60000;   // pretend a minute passed
    s.activeSession.pausedMs = 30000;                   // half of it paused
  });
  const secs = App.sessionControl.elapsedSeconds();
  return secs >= 28 && secs <= 32;
});
check('ending a session prefills from the lesson work', () => {
  App.store.recordExercise(TOPIC, 'sess-ex', { passed: true, hintsUsed: 2, solutionViewed: true });
  App.store.updateLearning(TOPIC, L => { L.stillUnclear = 'deferred execution'; });
  App.sessionControl.stop();
  const form = doc.querySelector('.modal-backdrop:last-child form');
  if (Number(form.elements.exercises.value) !== 1) throw new Error('exercises not prefilled');
  if (Number(form.elements.hintsUsed.value) !== 2) throw new Error('hints not prefilled');
  if (Number(form.elements.solutionsViewed.value) !== 1) throw new Error('solutions not prefilled');
  return form.elements.struggled.value.includes('deferred');
});
check('saving the session stores the help counters', () => {
  const form = doc.querySelector('.modal-backdrop:last-child form');
  form.elements.learned.value = 'variables';
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  const s = App.store.get().sessions[App.store.get().sessions.length - 1];
  return s.hintsUsed === 2 && s.solutionsViewed === 1 && !App.sessionControl.active();
});

console.log('\n== review retrieval test ==');
App.store.resetAll();
check('reviewing a topic with a lesson starts with a retrieval test', () => {
  App.reviewFlow.open(TOPIC);
  const html = doc.querySelector('.modal-backdrop:last-child').innerHTML;
  return html.includes('Retrieval practice') && !!doc.querySelector('[data-rt]');
});
check('checking retrieval answers records an attempt', () => {
  click('[data-rt-check]');
  return App.store.topicById(TOPIC).learning.knowledgeCheck.attempts === 1;
});
check('the retrieval test leads on to the difficulty rating', () => {
  click('[data-rt-continue]');
  return !!doc.querySelector('[data-quality="good"]');
});
check('rating still schedules the next review', () => {
  click('[data-quality="good"]');
  const t = App.store.topicById(TOPIC);
  return t.nextReview && U.daysBetween(U.today(), t.nextReview) > 0;
});
check('a topic without a lesson goes straight to the rating', () => {
  App.reviewFlow.open('sql:joins');
  return !!doc.querySelector('[data-quality="good"]') && !doc.querySelector('[data-rt]');
});
click('[data-close]');

console.log('\n== mini-project unlock ==');
App.store.resetAll();
check('the mini-project starts locked', () => {
  goto('projects');
  const html = doc.getElementById('view').innerHTML;
  return html.includes('Unlocks as you learn');
});
check('it unlocks once the required topics are comfortable', () => {
  const mp = App.store.get().projects.find(p => p.isMiniProject);
  mp.requiredTopicIds.forEach(id => App.store.updateTopic(id, { status: 'comfortable' }));
  goto('projects');
  return doc.getElementById('view').innerHTML.includes('Time to build it');
});

console.log('\n== export / import with v2 data ==');
check('a v2 export round-trips all learning state', () => {
  App.store.resetAll();
  App.store.updateLearning(TOPIC, L => {
    L.lessonViewed = true;
    L.sectionsRead = ['what', 'why'];
    L.explanation = 'x'.repeat(100);
    L.needsRevision = true;
  });
  App.store.recordExercise(TOPIC, 'round-trip', { passed: true, hintsUsed: 1 });
  App.mastery.recompute(TOPIC);

  const json = App.store.exportJSON();
  App.store.resetAll();
  App.store.importJSON(json);

  const L = App.store.topicById(TOPIC).learning;
  return L.lessonViewed === true && L.sectionsRead.length === 2 &&
         L.exercises['round-trip'].passed === true &&
         L.exercises['round-trip'].hintsUsed === 1 &&
         L.needsRevision === true && L.explanation.length === 100;
});
check('achievements survive an export/import', () => {
  App.mastery.checkAchievements();
  const count = App.store.get().achievements.length;
  const json = App.store.exportJSON();
  App.store.resetAll();
  App.store.importJSON(json);
  return App.store.get().achievements.length === count && count > 0;
});

console.log('\n== safety ==');
check('lesson code is escaped, not executed', () => {
  const html = App.highlight.block('var x = "<script>window.__hacked=1;</' + 'script>";');
  if (html.includes('<script')) throw new Error('raw script tag emitted');
  return html.includes('&lt;script');
});
check('a malicious topic name cannot break the learning page', () => {
  const t = App.store.addTopic({ name: '<img src=x onerror="window.__pwn=1">', phaseId: 'fundamentals' });
  App.views.learn.ui.topicId = null;
  goto('learn', { topic: t.id });
  const host = doc.getElementById('view');
  if (host.querySelector('img')) throw new Error('injected element');
  return !window.__pwn;
});
check('a malicious explanation is escaped on the page', () => {
  App.store.updateLearning(TOPIC, L => { L.explanation = '<img src=x onerror="window.__pwn2=1">'; });
  App.views.learn.ui.topicId = null;
  goto('learn', { topic: TOPIC, view: 'explain' });
  return !window.__pwn2 && !doc.getElementById('view').querySelector('img');
});
check('the runner client reports unavailable rather than throwing', () => {
  // jsdom has no fetch to a live runner; probe must resolve, not reject.
  return App.runner.isAvailable() === false;
});

console.log('\n== all views still render with v2 data ==');
App.store.resetAll();
App.store.loadDemoData();
for (const r of ['dashboard','roadmap','topics','sessions','reviews','challenges','projects','statistics','settings']) {
  check('renders ' + r, () => {
    goto(r);
    if (!doc.getElementById('view').innerHTML.trim()) throw new Error('empty');
    return true;
  });
}

console.log('\n== no uncaught errors ==');
check('no window errors during the whole run', () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join('; '));
  return true;
});

console.log('\n---------------------------------------');
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
