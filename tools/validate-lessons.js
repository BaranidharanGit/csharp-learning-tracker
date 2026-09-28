#!/usr/bin/env node
/* ============================================================
   tools/validate-lessons.js
   Checks lesson content without opening a browser.

     node tools/validate-lessons.js          schema checks only
     node tools/validate-lessons.js --run    also COMPILES AND RUNS every
                                             solution against the real .NET
                                             SDK via tools/csharp-runner.js

   The --run mode is what stops a lesson from teaching code that does not
   actually work: every solution with an expected output must produce
   exactly that output, and every solution must at least compile.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RUN = process.argv.includes('--run');
const RUNNER = 'http://127.0.0.1:5174';

/* ---------- Load the data files in a minimal fake browser ---------- */

// In a browser `window` IS the global object, so `window.App = ...` also
// creates a bare `App` global. Make the sandbox self-referential to match.
const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function load(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(code, sandbox, { filename: rel });
}

load('js/data/roadmap.js');
load('js/data/lessons/registry.js');

const LESSON_FILES = fs.readdirSync(path.join(ROOT, 'js/data/lessons'))
  .filter((f) => f.endsWith('.js') && f !== 'registry.js')
  .sort();
LESSON_FILES.forEach((f) => load('js/data/lessons/' + f));

const App = sandbox.window.App;
const LESSONS = Object.keys(App.LESSONS).map((k) => App.LESSONS[k]);

/* ---------- Roadmap topic ids ---------- */

const slug = (t) => String(t).toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const ROADMAP_IDS = new Set();
App.ROADMAP.forEach((p) => p.topics.forEach((t) => ROADMAP_IDS.add(p.id + ':' + slug(t))));

/* ---------- Checks ---------- */

const problems = [];
const warnings = [];
const fail = (lesson, msg) => problems.push(`${lesson.topicId}: ${msg}`);
const warn = (lesson, msg) => warnings.push(`${lesson.topicId}: ${msg}`);

const seenExerciseIds = new Set();

LESSONS.forEach((lesson) => {
  if (!ROADMAP_IDS.has(lesson.topicId)) {
    fail(lesson, `topicId is not in the roadmap (check js/data/roadmap.js)`);
  }
  if (lesson.objectives.length < 3) fail(lesson, `needs at least 3 objectives, has ${lesson.objectives.length}`);
  if (lesson.sections.length < 3) fail(lesson, `needs at least 3 lesson sections, has ${lesson.sections.length}`);
  if (lesson.examples.length < 2) fail(lesson, `needs at least 2 worked examples, has ${lesson.examples.length}`);
  if (lesson.knowledgeChecks.length < 4) fail(lesson, `needs at least 4 knowledge-check questions, has ${lesson.knowledgeChecks.length}`);
  if (lesson.commonMistakes.length < 3) fail(lesson, `needs at least 3 common mistakes, has ${lesson.commonMistakes.length}`);
  if (lesson.realWorld.length < 2) fail(lesson, `needs at least 2 real-world notes`);

  const byLevel = (n) => lesson.exercises.filter((x) => x.level === n);
  if (byLevel(2).length < 3) fail(lesson, `needs 3+ guided (level 2) exercises, has ${byLevel(2).length}`);
  if (byLevel(3).length < 3) fail(lesson, `needs 3+ independent (level 3) exercises, has ${byLevel(3).length}`);
  if (byLevel(4).length < 1) fail(lesson, `needs an applied (level 4) exercise`);
  if (byLevel(5).length < 1) fail(lesson, `needs a no-help challenge (level 5)`);

  const debugCount = lesson.exercises.filter((x) => x.type === 'debug').length;
  if (debugCount < 2) fail(lesson, `needs at least 2 debugging exercises, has ${debugCount}`);

  const types = new Set(lesson.exercises.map((x) => x.type));
  if (types.size < 4) warn(lesson, `only ${types.size} exercise types used - variety keeps the learner thinking`);

  const mcqChecks = lesson.knowledgeChecks.filter((q) => q.type === 'mcq').length;
  if (mcqChecks === lesson.knowledgeChecks.length) {
    fail(lesson, 'every knowledge-check question is multiple choice - mix in recall and code reading');
  }

  lesson.exercises.forEach((ex) => {
    if (seenExerciseIds.has(ex.id)) fail(lesson, `duplicate exercise id ${ex.id}`);
    seenExerciseIds.add(ex.id);

    if (!ex.prompt || ex.prompt.length < 20) fail(lesson, `${ex.id} has no real prompt`);

    if (ex.level === 2 && ex.type !== 'debug' && (!ex.hints || ex.hints.length < 2)) {
      fail(lesson, `${ex.id} is a guided exercise but has fewer than 2 hints`);
    }
    if (ex.level === 5 && ex.hints && ex.hints.length) {
      fail(lesson, `${ex.id} is a no-help challenge but ships hints`);
    }
    if (ex.level >= 3 && !ex.solution) fail(lesson, `${ex.id} has no solution to reveal`);

    if (ex.type === 'mcq') {
      if (!Array.isArray(ex.options) || ex.options.length < 3) fail(lesson, `${ex.id} needs 3+ options`);
      if (typeof ex.answer !== 'number' || ex.answer < 0 || ex.answer >= (ex.options || []).length) {
        fail(lesson, `${ex.id} has an answer index outside its options`);
      }
    }
    if (ex.type === 'predict-output' && !(ex.accept || []).length && !(ex.acceptContains || []).length) {
      fail(lesson, `${ex.id} accepts no answers`);
    }
    if (ex.type === 'fill-blank') {
      (ex.blanks || []).forEach((b, i) => {
        if (!(b.accept || []).length) fail(lesson, `${ex.id} blank ${i + 1} accepts nothing`);
      });
    }
    if (ex.type === 'debug') {
      if (!ex.brokenCode) fail(lesson, `${ex.id} is a debug exercise with no broken code`);
      if (!(ex.steps || []).length) fail(lesson, `${ex.id} has no steps`);
      (ex.steps || []).forEach((st) => {
        if (!st.id) fail(lesson, `${ex.id} has a step with no id`);
        if (!st.question) fail(lesson, `${ex.id} step ${st.id} has no question`);
        if (st.type === 'mcq' && (typeof st.answer !== 'number')) {
          fail(lesson, `${ex.id} step ${st.id} is mcq without a numeric answer`);
        }
      });
    }
    if (ex.run && ex.run.expectedOutput && !ex.solution) {
      fail(lesson, `${ex.id} expects output but has no solution to verify it with`);
    }
  });

  lesson.knowledgeChecks.forEach((q) => {
    if (q.type === 'mcq' && (typeof q.answer !== 'number' || q.answer >= (q.options || []).length)) {
      fail(lesson, `knowledge check ${q.id} has a bad answer index`);
    }
    if (!q.explanation) warn(lesson, `knowledge check ${q.id} has no explanation`);
  });
});

/* ---------- Optional: compile and run every solution ---------- */

function postRun(code) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ code });
    const req = require('http').request(RUNNER + '/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tracker-Runner': '1', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ error: 'bad response' }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

const normOutput = (v) => String(v == null ? '' : v)
  .replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).join('\n')
  .replace(/\n{2,}/g, '\n').trim();

async function verifySolutions() {
  const jobs = [];
  LESSONS.forEach((lesson) => {
    lesson.exercises.forEach((ex) => {
      const isCode = ex.type === 'coding' || ex.type === 'refactor';
      if (isCode && ex.solution) jobs.push({ lesson, ex, code: ex.solution });
      if (ex.type === 'debug') {
        (ex.steps || []).forEach((st) => {
          if (st.type === 'coding' && ex.solution) {
            jobs.push({ lesson, ex, step: st, code: ex.solution });
          }
        });
      }
    });
    lesson.examples.forEach((exm) => {
      if (exm.code && /Console\.Write/.test(exm.code) && !/\bclass\b|\bvoid Main\b/.test(exm.code)) {
        jobs.push({ lesson, example: exm, code: exm.code });
      }
    });
  });

  console.log(`\n  Compiling ${jobs.length} code samples with the real .NET SDK...\n`);
  let ok = 0;

  for (const job of jobs) {
    const label = job.example
      ? `${job.lesson.topicId} example "${job.example.title}"`
      : `${job.ex.id}${job.step ? ' step ' + job.step.id : ''}`;

    const res = await postRun(job.code);
    if (res.error) { problems.push(`${label}: runner unreachable (${res.error})`); continue; }

    if (!res.compiled) {
      const first = (res.diagnostics || [])[0];
      problems.push(`${label}: SOLUTION DOES NOT COMPILE — ${first ? first.code + ' line ' + first.line + ': ' + first.message : 'build failed'}`);
      continue;
    }
    if (!res.ok) {
      problems.push(`${label}: solution compiled but crashed — ${String(res.stderr).split('\n')[0]}`);
      continue;
    }

    // Expected output must match exactly.
    const expected = job.ex && job.ex.run && job.ex.run.expectedOutput;
    const stepExpected = job.step && job.step.run && job.step.run.expectedOutput;
    const want = stepExpected !== undefined ? stepExpected : expected;
    if (want !== undefined && want !== null) {
      if (normOutput(res.stdout) !== normOutput(want)) {
        problems.push(`${label}: OUTPUT MISMATCH\n      expected: ${JSON.stringify(normOutput(want))}\n      actual:   ${JSON.stringify(normOutput(res.stdout))}`);
        continue;
      }
    }

    // Solutions must also satisfy their own static checks.
    if (job.ex && (job.ex.checks || []).length && !job.step && !job.example) {
      const skeleton = job.code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
      const flat = skeleton.replace(/\s+/g, ' ');
      job.ex.checks.forEach((c) => {
        let pass = false;
        if (c.kind === 'contains') pass = flat.toLowerCase().includes(String(c.value).toLowerCase().replace(/\s+/g, ' '));
        else if (c.kind === 'notContains') pass = !flat.toLowerCase().includes(String(c.value).toLowerCase().replace(/\s+/g, ' '));
        else if (c.kind === 'regex') pass = new RegExp(c.value, c.flags || 'i').test(skeleton);
        else if (c.kind === 'minLines') pass = job.code.split('\n').filter((l) => l.trim()).length >= Number(c.value);
        if (!pass) problems.push(`${label}: its own solution FAILS the check "${c.message || c.value}"`);
      });
    }
    ok += 1;
  }
  console.log(`  ${ok}/${jobs.length} samples compiled, ran and matched.\n`);
}

/* ---------- Report ---------- */

async function main() {
  if (RUN) await verifySolutions();

  const covered = LESSONS.length;
  console.log('  Lesson validation');
  console.log('  -----------------');
  console.log(`  Files          : ${LESSON_FILES.length} (${LESSON_FILES.join(', ')})`);
  console.log(`  Lessons        : ${covered} of ${ROADMAP_IDS.size} roadmap topics`);
  console.log(`  Exercises      : ${LESSONS.reduce((n, l) => n + l.exercises.length, 0)}`);
  console.log(`  Check questions: ${LESSONS.reduce((n, l) => n + l.knowledgeChecks.length, 0)}`);

  if (warnings.length) {
    console.log(`\n  ${warnings.length} warning(s):`);
    warnings.forEach((w) => console.log('    - ' + w));
  }

  if (problems.length) {
    console.log(`\n  ${problems.length} PROBLEM(S):`);
    problems.forEach((p) => console.log('    x ' + p));
    console.log('');
    process.exit(1);
  }

  console.log('\n  All lesson content passed.\n');
}

main();
