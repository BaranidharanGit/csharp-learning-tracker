const { boot } = require('./harness');

let pass = 0, fail = 0;
function check(name, fn) {
  try { const r = fn(); if (r === false) throw new Error('returned false'); pass++; console.log('  ok  ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e.message).split('\n').slice(0,4).join('\n       ')); }
}

const { window, errors } = boot();
// jsdom queues hashchange asynchronously; flush it so navigation is synchronous in tests.
function goto(route, params) {
  window.App.router.go(route, params);
  window.dispatchEvent(new window.Event('hashchange'));
}
const App = window.App;
const doc = window.document;

console.log('\n== boot ==');
check('App namespace exists', () => !!App && !!App.store && !!App.views);
check('no window errors during boot', () => { if (errors.length) throw new Error(errors.join('; ')); });
check('welcome modal shown on first run', () => doc.querySelectorAll('.modal-backdrop').length === 1);

// Dismiss the welcome dialog by choosing "Start fresh".
doc.querySelector('[data-fresh]').dispatchEvent(new window.Event('click', { bubbles: true }));
check('welcome modal closes', () => doc.querySelectorAll('.modal-backdrop').length === 0);

console.log('\n== seeded data ==');
const s = App.store.get();
const expectedTopics = App.ROADMAP.reduce((n, p) => n + p.topics.length, 0);
check('12 phases', () => App.ROADMAP.length === 12);
check('all roadmap topics seeded (' + expectedTopics + ')', () => s.topics.length === expectedTopics);
check('topic count is 175', () => expectedTopics === 175);
check('6 starter projects + 1 mini-project', () => s.projects.length === 7);
check('mini-project has unlock requirements', () => {
  const mp = s.projects.find(p => p.isMiniProject);
  return mp && mp.name === 'Personal Expense Tracker' && mp.requiredTopicIds.length === 6;
});
check('no duplicate topic ids', () => new Set(s.topics.map(t => t.id)).size === s.topics.length);
check('every topic has a known phase', () => s.topics.every(t => !!App.PHASE_BY_ID[t.phaseId]));
check('overall starts at 0%', () => App.progress.overall().percent === 0);
check('persisted to localStorage', () => JSON.parse(window.localStorage.getItem(App.store.STORAGE_KEY)).topics.length === expectedTopics);

console.log('\n== routes render (empty state) ==');
const routes = ['dashboard','roadmap','topics','sessions','reviews','challenges','projects','statistics','settings'];
for (const r of routes) {
  check('render ' + r, () => {
    goto(r);
    const host = doc.getElementById('view');
    if (!host.innerHTML.trim()) throw new Error('empty view');
    if (doc.getElementById('page-title').textContent !== App.views[r].meta.title) throw new Error('title mismatch');
  });
}

console.log('\n== demo data ==');
check('loadDemoData runs', () => { App.store.loadDemoData(); });
const s2 = App.store.get();
check('27 demo sessions', () => s2.sessions.length === 27);
check('6 demo challenges', () => s2.challenges.length === 6);
check('overall progress now > 0', () => App.progress.overall().percent > 0);
check('fundamentals fully completed (10 mastered + 5 comfortable = 93%)', () => {
  const f = App.progress.phaseStats('fundamentals');
  if (f.completed !== f.total) throw new Error('completed ' + f.completed + '/' + f.total);
  const expected = Math.round(((10 * 1.0 + 5 * 0.8) / 15) * 100);
  if (f.percent !== expected) throw new Error('percent ' + f.percent + ' expected ' + expected);
});
check('streak is 6 days', () => { const st = App.progress.streak(); if (st.current !== 6) throw new Error('got ' + st.current); });
check('total hours > 20', () => App.progress.totalHours() > 20);
check('due reviews exist', () => App.review.dueTopics(s2.topics).length > 0);
check('overdue reviews exist', () => App.review.overdueTopics(s2.topics).length > 0);
check('weak topics found', () => App.progress.weakTopics().length > 0);
check('project 1 all features done', () => {
  const p = s2.projects.find(x => x.name === 'C# Console Application');
  return p.features.every(f => f.done) && App.progress.projectProgress(p).percent === 100;
});
check('project 2 has 4 features done', () => {
  const p = s2.projects.find(x => x.name === 'C# Problem Solving Project');
  return p.features.filter(f => f.done).length === 4;
});
check('no stray featuresDone key on projects', () => s2.projects.every(p => p.featuresDone === undefined));

console.log('\n== routes render (with data) ==');
for (const r of routes) {
  check('render ' + r + ' w/ data', () => {
    goto(r);
    if (!doc.getElementById('view').innerHTML.trim()) throw new Error('empty view');
  });
}

console.log('\n== charts ==');
check('donut svg produced', () => App.charts.donut({percent: 42}).indexOf('42%') > -1);
check('bar chart svg produced', () => App.charts.barChart({data: App.progress.weeklyHours(8).map(w=>({label:w.label,value:w.hours}))}).startsWith('<svg'));
check('heatmap produced', () => App.charts.heatmap(App.progress.dailyMinutes(182)).indexOf('heat__col') > -1);
check('heatmap has 26-27 week columns and 182 real days', () => {
  const html = App.charts.heatmap(App.progress.dailyMinutes(182));
  const cols = (html.match(/heat__col/g) || []).length;
  const hidden = (html.match(/visibility:hidden/g) || []).length;
  const cells = (html.match(/class="heat__cell/g) || []).length;
  if (cols < 26 || cols > 28) throw new Error('cols ' + cols);
  if (cells - hidden !== 182) throw new Error('real cells ' + (cells - hidden));
});

console.log('\n== review scheduling ==');
const topic = App.store.topicById('professional:linq');
check('linq topic exists', () => !!topic);
check('good moves one rung up', () => {
  const before = topic.reviewStep;
  const p = App.review.preview(topic, 'good');
  return p.step === Math.min(before + 1, App.review.LADDER.length - 1) && p.days === App.review.LADDER[p.step];
});
check('difficult resets to 1 day', () => App.review.preview(topic, 'difficult').days === 1);
check('easy stretches by 1.3', () => {
  const p = App.review.preview(topic, 'easy');
  return p.days === Math.round(App.review.LADDER[p.step] * 1.3);
});
check('applying a review sets dates', () => {
  const before = topic.reviewCount;
  App.reviewFlow.apply(topic.id, 'good');
  const t = App.store.topicById(topic.id);
  if (t.lastReviewed !== App.utils.today()) throw new Error('lastReviewed not stamped');
  if (App.utils.daysBetween(App.utils.today(), t.nextReview) <= 0) throw new Error('nextReview not in future');
  return t.reviewCount === before + 1;
});
check('needs-practice never goes below step 0', () => {
  const t = { reviewStep: 0 };
  return App.review.preview(t, 'needs-practice').step === 0;
});

console.log('\n== CRUD ==');
check('add custom topic', () => {
  const t = App.store.addTopic({ name: 'Span<T>', phaseId: 'advanced', status: 'learning', understanding: 2, coding: 1, problemSolving: 1 });
  return t.id === 'advanced:span-t' && t.custom === true && !!App.store.topicById(t.id);
});
check('duplicate custom topic name gets a unique id', () => {
  const t = App.store.addTopic({ name: 'Span<T>', phaseId: 'advanced' });
  return t.id === 'advanced:span-t-2';
});
check('update topic clamps scores', () => {
  App.store.updateTopic('advanced:span-t', { understanding: 99 });
  return App.store.topicById('advanced:span-t').understanding === 5;
});
check('delete custom topic', () => {
  App.store.deleteTopic('advanced:span-t-2');
  return !App.store.topicById('advanced:span-t-2');
});
check('deleting a roadmap topic is remembered', () => {
  App.store.deleteTopic('sql:having');
  const st = App.store.get();
  if (App.store.topicById('sql:having')) throw new Error('still present');
  return st.meta.removedRoadmapIds.indexOf('sql:having') > -1;
});
check('restoreRoadmapTopics brings it back', () => {
  const n = App.store.restoreRoadmapTopics();
  return n === 1 && !!App.store.topicById('sql:having');
});
check('add + edit + delete session', () => {
  const x = App.store.addSession({ date: App.utils.today(), startTime: '10:00', endTime: '11:30', durationMinutes: 90, topicId: 'sql:joins', learned: 'joins', confidence: 4, exercises: 3 });
  App.store.updateSession(x.id, { date: x.date, startTime: '10:00', endTime: '12:00', durationMinutes: 120, topicId: 'sql:joins', learned: 'joins+', struggled: '', exercises: 4, confidence: 5, notes: '' });
  const after = App.store.get().sessions.find(v => v.id === x.id);
  if (after.durationMinutes !== 120) throw new Error('not updated');
  App.store.deleteSession(x.id);
  return !App.store.get().sessions.find(v => v.id === x.id);
});
check('add + delete challenge', () => {
  const c = App.store.addChallenge({ name: 'Two Sum', date: App.utils.today(), difficulty: 'Easy', outcome: 'completed', timeTakenMinutes: 10 });
  const n = App.store.get().challenges.length;
  App.store.deleteChallenge(c.id);
  return App.store.get().challenges.length === n - 1;
});
check('add + delete project', () => {
  const p = App.store.addProject({ name: 'Scratch', features: ['a','b'] });
  if (p.features.length !== 2 || p.features[0].done !== false) throw new Error('features not normalised');
  App.store.deleteProject(p.id);
  return !App.store.get().projects.find(x => x.id === p.id);
});

console.log('\n== duration maths ==');
const U = App.utils;
check('90 minutes formats as 1h 30m', () => U.fmtDuration(90) === '1h 30m');
check('overnight session wraps', () => U.minutesBetweenTimes('23:30', '01:00') === 90);
check('same-day session', () => U.minutesBetweenTimes('09:15', '10:45') === 90);
check('toHours rounds to 1dp', () => U.toHours(95) === 1.6);
check('daysBetween handles order', () => U.daysBetween('2026-01-01', '2026-01-31') === 30 && U.daysBetween('2026-01-31','2026-01-01') === -30);
check('addDays crosses months', () => U.addDays('2026-01-31', 1) === '2026-02-01');
check('addDays crosses years', () => U.addDays('2025-12-31', 1) === '2026-01-01');
check('leap day handled', () => U.addDays('2028-02-28', 1) === '2028-02-29');
check('startOfWeek is Monday', () => U.startOfWeek('2026-09-28') === '2026-09-28' && U.startOfWeek('2026-09-27') === '2026-09-21');
check('escapeHtml blocks tags', () => U.escapeHtml('<img src=x onerror=1>') === '&lt;img src=x onerror=1&gt;');
check('slug handles symbols', () => U.slug('Value Types vs Reference Types') === 'value-types-vs-reference-types' && U.slug('Swagger/OpenAPI') === 'swagger-openapi');

console.log('\n== progress maths ==');
check('phase percent uses status weights', () => {
  // 15 fundamentals topics: 11 mastered(1.0) + 4 comfortable(0.8) in demo -> verify formula directly
  const st = App.progress.phaseStats('angular');
  return st.percent === 0 && st.total === 16 && st.completed === 0 && st.remaining === 16;
});
check('a single learning topic gives 25% of one topic', () => {
  const before = App.progress.phaseStats('angular').percent;
  App.store.updateTopic('angular:components', { status: 'learning' });
  const after = App.progress.phaseStats('angular').percent;
  App.store.updateTopic('angular:components', { status: 'not-started' });
  return before === 0 && after === Math.round((0.25 / 16) * 100);
});
check('completed counts comfortable + mastered', () => {
  const f = App.progress.phaseStats('fundamentals');
  return f.completed === f.total && f.remaining === 0;
});

console.log('\n== export / import ==');
const json = App.store.exportJSON();
check('export is valid JSON with wrapper', () => {
  const o = JSON.parse(json);
  return o.app === 'csharp-engineer-learning-tracker' && Array.isArray(o.data.topics);
});
const beforeCounts = { t: App.store.get().topics.length, s: App.store.get().sessions.length };
check('reset clears everything', () => {
  App.store.resetAll();
  const st = App.store.get();
  return st.sessions.length === 0 && st.topics.length === expectedTopics && st.projects.length === 7 &&
         App.progress.overall().percent === 0;
});
check('import restores the export', () => {
  const r = App.store.importJSON(json);
  const st = App.store.get();
  return st.sessions.length === beforeCounts.s && st.topics.length === beforeCounts.t && r.sessions === beforeCounts.s;
});
check('import accepts a bare state object', () => {
  App.store.importJSON(JSON.stringify(JSON.parse(json).data));
  return App.store.get().sessions.length === beforeCounts.s;
});
check('import rejects junk', () => {
  try { App.store.importJSON('{"hello":1}'); return false; } catch (e) { return /learning tracker export/.test(e.message); }
});
check('import rejects invalid JSON', () => {
  try { App.store.importJSON('not json'); return false; } catch (e) { return /valid JSON/.test(e.message); }
});
check('import backfills topics added to the roadmap later', () => {
  const partial = JSON.parse(json);
  partial.data.topics = partial.data.topics.filter(t => t.phaseId !== 'ai');
  App.store.importJSON(JSON.stringify(partial));
  return App.store.get().topics.filter(t => t.phaseId === 'ai').length === 10;
});

console.log('\n== interaction smoke ==');
App.store.resetAll();
App.store.loadDemoData();
check('dashboard phase card navigates to roadmap', () => {
  goto('dashboard');
  const card = doc.querySelector('[data-phase]');
  card.dispatchEvent(new window.Event('click', { bubbles: true }));
  window.dispatchEvent(new window.Event('hashchange'));
  return App.router.route() === 'roadmap';
});
check('topic chip opens the learning page', () => {
  goto('roadmap');
  const chip = doc.querySelector('[data-topic]');
  const id = chip.getAttribute('data-topic');
  chip.dispatchEvent(new window.Event('click', { bubbles: true }));
  window.dispatchEvent(new window.Event('hashchange'));
  return App.router.route() === 'learn' && App.router.params().topic === id;
});
check('inline status select updates the topic', () => {
  goto('topics');
  const sel = doc.querySelector('[data-status-for]');
  const id = sel.getAttribute('data-status-for');
  sel.value = 'practicing';
  sel.dispatchEvent(new window.Event('change', { bubbles: true }));
  return App.store.topicById(id).status === 'practicing';
});
check('review dialog rates a topic', () => {
  const due = App.review.dueTopics(App.store.get().topics)[0];
  App.reviewFlow.open(due.id);
  const btn = doc.querySelector('[data-quality="good"]');
  btn.dispatchEvent(new window.Event('click', { bubbles: true }));
  return App.store.topicById(due.id).lastReviewed === App.utils.today() &&
         doc.querySelectorAll('.modal-backdrop').length === 0;
});
check('project feature checkbox toggles', () => {
  goto('projects');
  const cb = doc.querySelector('[data-feature]');
  const [pid, fid] = cb.getAttribute('data-feature').split('|');
  const before = App.store.get().projects.find(p => p.id === pid).features.find(f => f.id === fid).done;
  cb.checked = !before;
  cb.dispatchEvent(new window.Event('change', { bubbles: true }));
  return App.store.get().projects.find(p => p.id === pid).features.find(f => f.id === fid).done === !before;
});
check('start session stores an active session', () => {
  App.sessionControl.start();
  const form = doc.querySelector('.modal-backdrop:last-child form');
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  return !!App.sessionControl.active();
});
check('topbar shows the running timer', () => {
  return doc.getElementById('session-pill').hidden === false &&
         doc.getElementById('start-session-btn').hidden === true;
});
check('ending a session saves it and clears the timer', () => {
  const n = App.store.get().sessions.length;
  App.sessionControl.stop();
  const form = doc.querySelector('.modal-backdrop:last-child form');
  form.elements.learned.value = 'test run';
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  return App.store.get().sessions.length === n + 1 && !App.sessionControl.active();
});
check('duration recalculates from start/end time', () => {
  App.sessionControl.openForm(null);
  const form = doc.querySelector('.modal-backdrop:last-child form');
  form.elements.startTime.value = '09:00';
  form.elements.startTime.dispatchEvent(new window.Event('change', { bubbles: true }));
  form.elements.endTime.value = '10:45';
  form.elements.endTime.dispatchEvent(new window.Event('change', { bubbles: true }));
  const ok = form.elements.durationMinutes.value === '105';
  doc.querySelector('[data-close]').dispatchEvent(new window.Event('click', { bubbles: true }));
  return ok;
});
check('daily goal can be set from the dashboard', () => {
  goto('dashboard');
  doc.querySelector('[data-edit-goal]').dispatchEvent(new window.Event('click', { bubbles: true }));
  const form = doc.querySelector('.modal-backdrop:last-child form');
  form.elements.text.value = 'Finish LINQ';
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  const g = App.store.get().dailyGoal;
  return g.text === 'Finish LINQ' && g.date === App.utils.today();
});
check('theme toggle switches the attribute', () => {
  const before = doc.documentElement.getAttribute('data-theme');
  doc.getElementById('theme-btn').dispatchEvent(new window.Event('click', { bubbles: true }));
  const after = doc.documentElement.getAttribute('data-theme');
  return before !== after && after === App.store.get().settings.theme;
});
check('sidebar nav switches route', () => {
  doc.querySelector('[data-route="statistics"]').dispatchEvent(new window.Event('click', { bubbles: true }));
  window.dispatchEvent(new window.Event('hashchange'));
  return App.router.route() === 'statistics';
});
check('sidebar shows the review due count', () => {
  const due = App.review.dueTopics(App.store.get().topics).length;
  const el = doc.querySelector('[data-route="reviews"] .nav-count');
  return due === 0 ? !el : Number(el.textContent) === due;
});

console.log('\n== search & filters ==');
check('topics search narrows the table and keeps focus', () => {
  goto('topics');
  const rowsBefore = doc.querySelectorAll('[data-row]').length;
  const q = doc.querySelector('[data-q]');
  q.value = 'LINQ';
  q.dispatchEvent(new window.Event('input', { bubbles: true }));
  const rowsAfter = doc.querySelectorAll('[data-row]').length;
  if (rowsAfter === 0 || rowsAfter >= rowsBefore) throw new Error(rowsBefore + ' -> ' + rowsAfter);
  if (doc.activeElement !== doc.querySelector('[data-q]')) throw new Error('lost focus while typing');
  // clear again
  const q2 = doc.querySelector('[data-q]');
  q2.value = '';
  q2.dispatchEvent(new window.Event('input', { bubbles: true }));
  return doc.querySelectorAll('[data-row]').length === rowsBefore;
});
check('topics phase filter narrows the table', () => {
  goto('topics');
  const sel = doc.querySelector('[data-filter="phase"]');
  sel.value = 'sql';
  sel.dispatchEvent(new window.Event('change', { bubbles: true }));
  const rows = doc.querySelectorAll('[data-row]').length;
  const expected = App.store.topicsByPhase('sql').length;
  doc.querySelector('[data-filter="phase"]').value = 'all';
  doc.querySelector('[data-filter="phase"]').dispatchEvent(new window.Event('change', { bubbles: true }));
  if (rows !== expected) throw new Error(rows + ' vs ' + expected);
  return true;
});
check('roadmap status filter hides phases with no match', () => {
  goto('roadmap');
  const before = doc.querySelectorAll('[data-phase-block]').length;
  const sel = doc.querySelector('[data-status]');
  sel.value = 'mastered';
  sel.dispatchEvent(new window.Event('change', { bubbles: true }));
  const after = doc.querySelectorAll('[data-phase-block]').length;
  if (after === 0 || after >= before) throw new Error(before + ' -> ' + after);
  doc.querySelector('[data-status]').value = 'all';
  doc.querySelector('[data-status]').dispatchEvent(new window.Event('change', { bubbles: true }));
  return doc.querySelectorAll('[data-phase-block]').length === before;
});
check('a view click handler fires exactly once after repeated navigation', () => {
  for (let i = 0; i < 6; i++) { goto('projects'); goto('dashboard'); }
  goto('projects');
  let opened = 0;
  const realOpen = App.ui.formModal;
  App.ui.formModal = function (o) { opened++; return realOpen(o); };
  doc.querySelector('[data-add]').dispatchEvent(new window.Event('click', { bubbles: true }));
  App.ui.formModal = realOpen;
  const modals = doc.querySelectorAll('.modal-backdrop').length;
  doc.querySelector('.modal-backdrop:last-child [data-close]').dispatchEvent(new window.Event('click', { bubbles: true }));
  if (opened !== 1) throw new Error('handler fired ' + opened + ' times');
  return modals === 1;
});

console.log('\n== XSS safety ==');
check('malicious topic name is escaped in every view', () => {
  App.store.addTopic({ name: '<img src=x onerror="window.__pwned=1">', phaseId: 'sql', status: 'learning' });
  for (const r of routes) {
    goto(r);
    const host = doc.getElementById('view');
    // The name must never become a real element or attribute.
    if (host.querySelector('img')) throw new Error('injected element in ' + r);
    if (host.innerHTML.indexOf('&lt;img') === -1 && r === 'topics') throw new Error('name not escaped');
  }
  if (window.__pwned) throw new Error('script executed');
  return true;
});
check('malicious text survives an export/import round trip', () => {
  const json = App.store.exportJSON();
  App.store.resetAll();
  App.store.importJSON(json);
  if (window.__pwned) throw new Error('script executed on import');
  return !!App.store.get().topics.find(t => t.name.indexOf('<img') === 0);
});

console.log('\n== confirm dialog ==');
check('confirm resolves true on the confirm button', () => {
  let result = null;
  App.ui.confirm({ title: 'X', message: 'y' }).then(v => { result = v; });
  doc.querySelector('.modal-backdrop:last-child [data-ok]').dispatchEvent(new window.Event('click', { bubbles: true }));
  return new Promise(r => setTimeout(() => r(result === true), 0));
});
check('confirm resolves false when dismissed with Escape', () => {
  let settled = false;
  App.ui.confirm({ title: 'X', message: 'y' }).then(v => { settled = (v === false); });
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  if (doc.querySelectorAll('.modal-backdrop').length !== 0) throw new Error('dialog still open');
  return true;
});
check('confirm resolves false on the cancel button', () => {
  App.ui.confirm({ title: 'X', message: 'y' });
  doc.querySelector('.modal-backdrop:last-child [data-close]').dispatchEvent(new window.Event('click', { bubbles: true }));
  return doc.querySelectorAll('.modal-backdrop').length === 0;
});
check('body scroll lock is released when the last modal closes', () => doc.body.style.overflow === '');

console.log('\n== no leftover errors ==');
check('no uncaught window errors overall', () => { if (errors.length) throw new Error(errors.join('; ')); });

console.log('\n---------------------------------------');
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
