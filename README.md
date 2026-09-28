# C# Engineer Learning Tracker

A local-only **interactive learning platform** for C#, covering fundamentals through
ASP.NET Core, SQL, Angular, Azure, system design and AI-assisted development.

It is not just a progress tracker. You open a topic, learn the concept, work through
examples, write code, get it checked, answer a knowledge check, take a no-help
challenge, and only then does the app record that you have learned it.

**What is in it**

* **175 topics across 12 phases** - the full curriculum, tracked
* **15 complete interactive lessons** for C# Fundamentals, with **151 exercises**
  and **77 knowledge-check questions**
* **Real C# execution** - an optional local service compiles and runs your code with
  the .NET SDK on your own machine
* **Evidence-based mastery** - you cannot click "mastered"; you have to earn it
* Live session timer with pause/resume, spaced-repetition reviews with retrieval
  practice, no-help challenges, project tracking and detailed statistics

No account. No backend. No cloud. Nothing leaves your computer.

**The learning flow**

```
Dashboard → Current topic → Lesson → Examples → Guided exercise
    → Independent exercise → Knowledge check → Explain it
    → No-help challenge → Mastery earned → Review scheduled → Next topic
```

---

## 1. Running it locally

### Option A - the launcher (recommended)

```bash
cd csharp-learning-tracker
./start.command
```

On macOS you can also just **double-click `start.command` in Finder**.

It serves the folder on `http://127.0.0.1:5173` (or the next free port) using
Python or Node - whichever you already have - and opens your browser.
Press `Ctrl+C` in the terminal to stop it.

### Option B - any static server you like

```bash
python3 -m http.server 5173     # then visit http://localhost:5173
# or
npx serve .
```

### Option C - no server at all

Open `index.html` directly in your browser (double-click it). Everything works,
because the app uses plain `<script>` tags rather than ES modules and never calls
`fetch`. The only caveat is that some browsers treat `file://` pages as a
throwaway origin, which can make saved data less reliable — so prefer A or B for
day-to-day use. If storage is blocked the app tells you with a red banner instead
of silently losing your work.

### Option D - with real C# execution (recommended once you start the exercises)

Open a **second** terminal and run:

```bash
cd ~/Desktop/csharp-learning-tracker
./start-runner.command          # or: npm run runner
```

This starts a small local service on `127.0.0.1:5174` that compiles and runs the C#
you write in the lessons, using the .NET SDK already installed on this machine.
The learning page shows **"C# runner connected"** in the sidebar when it is available.

Without it the app still works completely - the editor just falls back to static
pattern checks, and says so in plain words. It never pretends to have compiled
anything it has not.

### Installing dependencies

**The application itself has none.** No build step, no bundler, no framework - it is
HTML, CSS and plain JavaScript loaded with `<script>` tags. If you have a browser,
you can run it.

Two optional extras have requirements:

| Extra | Needs | Install |
| --- | --- | --- |
| Real C# execution | .NET SDK 6+ | Already installed if `dotnet --version` works |
| Running the tests | Node 22+ and jsdom | `npm install` (dev-only, never shipped to the browser) |

---

## 2. Folder structure

```
csharp-learning-tracker/
├── index.html              Page shell: sidebar, topbar, view container, script tags
├── start.command           Local launcher (serves the app)
├── start-runner.command    Optional launcher for the C# execution service
├── package.json            Test scripts only - the app has no runtime dependencies
├── README.md               This file
│
├── css/
│   ├── base.css            Design tokens (light + dark), reset, app-shell layout
│   ├── components.css      Buttons, cards, tables, forms, modals, charts, badges
│   └── learn.css           The learning page: lesson, editor, exercises, mastery
│
├── js/
│   ├── data/                        Content you can edit by hand
│   │   ├── roadmap.js                 12 phases, 175 topics, the 5 statuses
│   │   ├── projects.js                6 starter projects + the mini-project
│   │   ├── demo.js                    Optional sample data, relative to today
│   │   └── lessons/                   THE CURRICULUM CONTENT
│   │       ├── registry.js              Lesson + exercise schema, App.registerLessons
│   │       ├── fundamentals-basics.js   Variables, Data Types, Type Conversion,
│   │       │                            Operators, Strings
│   │       ├── fundamentals-flow.js     Conditions, Loops, Methods, Parameters,
│   │       │                            Return Values
│   │       └── fundamentals-collections.js  Arrays, Lists, Dictionaries, HashSet,
│   │                                        Debugging
│   │
│   ├── core/                        Logic, no HTML pages
│   │   ├── utils.js                   Dates, durations, escaping, ids, downloads
│   │   ├── store.js                   THE data layer: load/save/seed/migrate/export
│   │   ├── lessons.js                 Lesson lookup, the 8-step flow, next action
│   │   ├── exercises.js               Grading for all 8 exercise types
│   │   ├── mastery.js                 Demonstrated scores, mastery rules, achievements
│   │   ├── review.js                  Spaced-repetition scheduler
│   │   ├── progress.js                Percentages, streaks, statistics
│   │   ├── charts.js                  Hand-rolled SVG donut / bars / heatmap
│   │   ├── highlight.js               C# syntax highlighter (escapes first)
│   │   ├── runner.js                  Client for the optional local C# service
│   │   ├── icons.js                   Inline SVG icon set
│   │   └── ui.js                      Toasts, confirms, the form-modal builder
│   │
│   ├── views/                       One file per page
│   │   ├── learn.js                   THE LEARNING PAGE (lesson → challenge → mastery)
│   │   ├── dashboard.js   roadmap.js  topics.js
│   │   ├── sessions.js    reviews.js  challenges.js
│   │   ├── projects.js    statistics.js  settings.js
│   │
│   └── app.js                       Bootstrap: hash router, sidebar, theme, timer
│
├── tools/
│   ├── csharp-runner.js    Local .NET execution service (Node, zero dependencies)
│   └── validate-lessons.js Checks lesson schema AND compiles every solution
│
└── tests/
    ├── harness.js          Boots the app inside jsdom
    ├── app.test.js         108 tests - the original tracker
    ├── learning.test.js    127 tests - the learning engine
    ├── journey.test.js     29 steps - the complete user journey
    └── run.js              Runs all three suites
```

Three rules keep this navigable:

1. **`core/` never touches the DOM.** It is pure logic and can be tested headlessly.
2. **`views/` never touches `localStorage`.** Views read through `App.store` /
   `App.progress` / `App.lessons` and write through `App.store.update(...)`.
3. **No lesson text lives in a view file.** All curriculum content is data in
   `js/data/lessons/`, which is why adding a topic means writing one object, not
   editing the UI.

---

## 3. How data is stored

Everything lives in **one JSON document in `localStorage`** under the key:

```
csharp-learning-tracker/v1
```

(The key name is unchanged from version 1 - the document inside it carries its own
`schemaVersion`, currently **2**.)

That is a per-browser, per-machine store: not synced, not uploaded, not shared
between Chrome and Safari. The document looks like this:

```jsonc
{
  "schemaVersion": 2,
  "settings":   { "theme": "dark", "dailyGoalMinutes": 60, "focusTopicId": null },
  "dailyGoal":  { "date": "2026-09-28", "text": "...", "done": false },
  "topics":     [ /* see below */ ],
  "sessions":   [ /* + hintsUsed, solutionsViewed in v2 */ ],
  "challenges": [ /* no-help challenge attempts */ ],
  "projects":   [ /* + requiredTopicIds, isMiniProject in v2 */ ],
  "achievements": [ { "id": "first-challenge", "date": "2026-09-28" } ],
  "activeSession": null,   // + pausedMs / pausedAt in v2
  "meta":       { "createdAt": "...", "demoLoaded": false }
}
```

### A topic in schema v2

```jsonc
{
  "id": "fundamentals:variables",
  "name": "Variables",
  "phaseId": "fundamentals",
  "status": "practicing",
  "understanding": 3, "coding": 2, "problemSolving": 2,
  "debugging": 0,                    // NEW in v2 - the fourth score
  "lastReviewed": "2026-09-20",
  "nextReview": "2026-09-27",
  "reviewStep": 2, "reviewCount": 3,
  "notes": "", "mistakes": "", "evidence": "",

  "learning": {                      // NEW in v2 - everything the engine records
    "level": 3,                      // 1-5 on the difficulty ladder
    "lessonViewed": true,
    "sectionsRead": ["what", "why"],
    "examplesViewed": ["ex1"],
    "exercises": {
      "fundamentals:variables#g1": {
        "passed": true,              // sticky - a failed retry does not undo it
        "attempts": 2,
        "hintsUsed": 1,
        "solutionViewed": false,
        "independent": false,        // solved cold, first time, no help
        "seconds": 240,
        "lastAt": "2026-09-27",
        "response": "…your code…"
      }
    },
    "knowledgeCheck": { "attempts": 2, "bestScore": 83, "passed": true, "lastAt": "…" },
    "challenge":      { "attempts": 1, "passed": false, "bestSeconds": null, "lastAt": "…" },
    "explanation": "…your own words…",
    "stillUnclear": "…what you are still unsure about…",
    "needsRevision": false,
    "manualStatus": null,            // non-null = you set the status by hand
    "demonstrated": { "understanding": 3, "coding": 2, … },
    "seconds": 1820                  // time on this topic's learning page
  }
}
```

### Migration and backward compatibility

Opening a **version 1** document (or importing a v1 export) upgrades it in place:

* every topic gains a blank `learning` record and `debugging: 0`
* every session gains `hintsUsed` / `solutionsViewed` at 0
* the document gains `achievements: []` and the mini-project
* **nothing is removed or overwritten** - your statuses, scores, notes, review
  history, sessions and challenges all survive untouched

A partially-written `learning` record (from a future or interrupted version) is
repaired field by field rather than replaced. Both paths are covered by tests in
`tests/learning.test.js` under *"v1 -> v2 migration"*.

Notes:

* **Dates** are plain local `"YYYY-MM-DD"` strings and **times** are `"HH:MM"`.
* A **running session survives a reload**, including how long it was paused.
* Nothing is ever sent anywhere. The only network call the app can make is to
  `127.0.0.1:5174` for the optional C# runner, and only if you started it.

### Sample seed data

* On **first run** the roadmap (175 topics) and the 6 starter projects are seeded
  automatically, and a welcome dialog offers to load a month of **sample data** so
  you can see every screen populated.
* You can load it later from **Settings → Sample data**, and remove it with
  **Settings → Reset**.
* The sample data is generated *relative to today* (see `js/data/demo.js`), so the
  streak, charts and review queue always look realistic.

---

## 4. How to add and edit topics

**Edit a topic** - click it anywhere it appears: a chip on the Roadmap page, a row
on the Topics page, or "Open" on the dashboard. The dialog holds everything the
topic records:

| Field | Meaning |
| --- | --- |
| Status | Not Started → Learning → Practicing → Comfortable → Mastered |
| Understanding 0-5 | Can you explain it to someone else? |
| Coding 0-5 | Can you write it without looking it up? |
| Problem solving 0-5 | Can you apply it to a problem you have not seen? |
| Last / Next review | Managed for you by the review system, but editable |
| Notes | Key points and mental models |
| Common mistakes | What you keep getting wrong - the most valuable field here |
| Evidence of mastery | e.g. "Rebuilt X from scratch with no help on 12 Mar" |

Shortcuts in that dialog: **Mark mastered** (sets status, all scores to 5 and a
review in 30 days), **Review now**, and **Delete**.

**Change status quickly** - the Topics table has an inline status dropdown on every
row, which is the fastest way to move through a phase.

**Add your own topic** - "Add topic" on the Topics page, or the dashed *Add topic*
chip at the end of any phase on the Roadmap page. Custom topics are tagged
`custom` and behave exactly like built-in ones.

**Add topics to the curriculum itself** - edit `js/data/roadmap.js` and reload.
New entries are *merged in*: existing progress is never touched. Deleting a
built-in topic is remembered too, so it is not seeded back on the next load -
and Settings offers a "Restore deleted roadmap topics" button if you change
your mind.

---

## 5. The learning engine

### How a lesson is delivered

Opening a topic that has a lesson gives you an eight-step flow, shown in the sticky
sidebar. Each step contributes to the topic's lesson percentage:

| Step | Weight | Complete when |
| --- | --- | --- |
| Lesson | 15% | every section marked read |
| Examples | 5% | every worked example opened |
| Guided exercise (level 2) | 15% | all level-2 exercises passed |
| Independent exercise (level 3) | 20% | all level-3 exercises passed |
| Applied exercise (level 4) | 10% | the level-4 exercise passed |
| Knowledge check | 15% | scored 70%+ |
| Explain it | 5% | 80+ characters written in your own words |
| No-help challenge (level 5) | 15% | passed |

### The five difficulty levels

| Level | Name | What it means |
| --- | --- | --- |
| 1 | Understand | You can explain the concept |
| 2 | Guided Practice | You can solve it with hints available |
| 3 | Independent Practice | You can solve it without hints |
| 4 | Applied Practice | You use it in a realistic situation |
| 5 | No-Help Challenge | No hints, no solution, no instructions |

### The eight exercise types

`coding`, `mcq`, `predict-output`, `debug` (find the bug → explain why → fix it),
`explain`, `fill-blank`, `refactor`, `design`.

Deliberately, **not every question is multiple choice** - the validator fails a
lesson whose knowledge check is entirely MCQ.

### Hints are progressive, and they cost you

Hints reveal one at a time. Revealing the solution is recorded permanently. Both
feed into your scores:

| How you passed it | Credit |
| --- | --- |
| Solved cold, no hints | 100% |
| Needed a hint | 70% |
| Looked at the solution first | 40% |

### Checked vs compiled - the honesty rule

Every result carries a badge stating exactly what happened:

| Badge | Means |
| --- | --- |
| **Compiled and executed locally** | The local .NET runner really built and ran it |
| **Code checked (patterns only, not compiled)** | Static pattern checks only |
| **Self-assessed** | You judged your own written answer |

The app will never describe a pattern match as a compile. If the runner is not
running, it says so in the sidebar and in the feedback.

---

## 6. How mastery is earned

You cannot click "mastered". Status is derived from evidence.

**Comfortable requires:**
- lesson read end to end
- all guided exercises passed
- at least one independent exercise passed
- knowledge check passed

**Mastered additionally requires:**
- all independent exercises passed
- the applied exercise passed
- the no-help challenge passed
- an explanation written in your own words
- demonstrated scores of 4+ in understanding, coding and problem solving
  (and 3+ in debugging where the lesson has debugging exercises)

### Where the four scores come from

| Score | Earned from |
| --- | --- |
| Understanding | knowledge-check best score, plus a point for writing an explanation |
| Coding | coding, refactor and fill-blank exercises passed |
| Problem solving | level 3, 4 and 5 exercises passed |
| Debugging | `debug`-type exercises passed |

**Time spent reading never changes a score.** Only demonstrated performance does.

### Two guarantees that protect your existing data

1. A demonstrated score can only ever **raise** the stored score, never lower it.
2. Auto-promotion can only ever **raise** the status, never demote it.

### Manual overrides

You can still set any status by hand - from the topic table, the edit dialog or the
Mastery panel. Doing so is recorded as a **manual override** and labelled as one
everywhere it appears. "Use earned status" on the Mastery panel clears it.

---

## 7. Adding your own content

### How to add a lesson

Add one object to a file in `js/data/lessons/` (or create a new file and add a
`<script>` tag for it in `index.html`), then reload. No build step.

```js
App.registerLessons([{
  topicId: 'core:classes',          // must match a roadmap topic id
  title: 'Classes',
  phaseId: 'core',
  difficulty: 'Beginner',
  estimatedMinutes: 45,
  objectives: ['…', '…', '…'],      // 3-5
  sections: [{ id: 'what', title: 'What a class is', blocks: [
    { type: 'text', text: 'Use `backticks` for code and **stars** for bold.' },
    { type: 'code', code: 'class Employee { }', caption: 'The smallest class' },
    { type: 'analogy', text: '…' },
    { type: 'warning', text: '…' },
    { type: 'whenNot',  text: 'When NOT to use it' },
    { type: 'table', head: ['A','B'], rows: [['1','2']] }
  ]}],
  examples: [{ id: 'ex1', title: '…', code: '…',
               walkthrough: [{ line: 'class Employee', note: 'why this line matters' }],
               output: '…', takeaway: '…' }],
  exercises: [ /* see below */ ],
  knowledgeChecks: [ /* same shape as exercises */ ],
  commonMistakes: [{ mistake: '…', why: '…', fix: '…' }],
  realWorld: ['…', '…']
}]);
```

The topic id must be `phaseId + ':' + slug(topicName)` - for example
`"Value Types vs Reference Types"` in the `core` phase becomes
`core:value-types-vs-reference-types`.

### How to add an exercise

```js
{
  id: 'core:classes#g1',
  type: 'coding',                 // or mcq | predict-output | debug | explain
                                  //      | fill-blank | refactor | design
  level: 2,                       // 1-5, see the ladder above
  difficulty: 'Easy',
  prompt: 'Write a class that…',
  starterCode: '// your code here',
  hints: ['nudge', 'bigger nudge', 'nearly the answer'],   // required at level 2
  solution: '…',                                            // required at level 3+
  explanation: 'Why the solution is what it is',
  checks: [                       // static pattern checks
    { kind: 'regex',       value: 'class\\s+\\w+', message: 'Declares a class' },
    { kind: 'contains',    value: 'public',            message: 'Has a public member' },
    { kind: 'notContains', value: 'Console.WriteLine', message: 'No printing' },
    { kind: 'minLines',    value: 5,                   message: 'At least 5 lines' }
  ],
  run: { expectedOutput: 'Hello' }   // compared against real stdout when the runner is on
}
```

Type-specific fields: `options` + `answer` for `mcq`; `accept` (and optionally
`acceptContains`) for `predict-output`; `blanks: [{ label, accept: [] }]` for
`fill-blank`; `brokenCode` + `steps` for `debug`; `expectedConcepts` for `explain`.

**Level 5 challenges must ship no hints** - the validator enforces it.

### How to add a new curriculum phase

1. Add a phase object to `App.ROADMAP` in `js/data/roadmap.js` (`id`, `name`,
   `blurb`, `color`, `topics: []`).
2. Reload. The 175 existing topics are untouched; the new ones are merged in and
   appear everywhere immediately.
3. Optionally add lessons for the new topics as above.

Deleting a topic from the roadmap is remembered so it is not seeded back, and
Settings offers "Restore deleted roadmap topics".

### Checking your content

```bash
npm run validate        # schema: counts, ids, answer indexes, hints, duplicates
npm run validate:run    # ALSO compiles and runs every solution with the .NET SDK
```

The `--run` mode is the important one: it proves that every solution actually
compiles, that every `expectedOutput` is exactly what the program prints, and that
each solution satisfies its own `checks`. All 150 code samples in the shipped
lessons pass it.

---

## 8. How session tracking works

**Start session** (topbar, or the dashboard) now:

1. Suggests the topic the learning engine thinks you should be on, and shows the
   next action for it.
2. Optionally opens that topic's learning page immediately.
3. Starts a live timer in the topbar, which **survives a reload**.
4. Tracks time on the learning page per topic, flushed quietly every 30 seconds so
   it never interrupts what you are typing.
5. Can be **paused and resumed** - paused time is excluded from the total, and the
   pill turns amber so the state is unmistakable.

**End session** opens a form pre-filled from what actually happened: exercises
passed, hints used, solutions viewed, and your "what I still don't understand" note
carried into the *struggled* field. You add what you learned and your confidence,
and it is saved to the session history.

---

## 9. How progress is calculated

All of this lives in `js/core/progress.js`, and the rules are repeated on the
Settings page so they never drift.

### Topic weight

| Status | Weight |
| --- | --- |
| Not Started | 0% |
| Learning | 25% |
| Practicing | 50% |
| Comfortable | 80% |
| Mastered | 100% |

### Percentages

```
phase %   = average weight of the topics in that phase
overall % = average weight of ALL topics
```

So a phase of 10 topics where 5 are Mastered and 5 are Practicing is
`(5×1.0 + 5×0.5) / 10 = 75%`.

### Everything else

* **Completed / remaining** - a topic counts as *completed* once it reaches
  **Comfortable or Mastered**. Remaining is everything else.
* **Weak topic** - started (not "Not Started") and averaging **2.0 or below**
  across the three scores, or stuck at 0-1 in one score while already Practicing.
* **Streak** - consecutive days with at least one session. Today not being logged
  *yet* does not break it (a one-day grace), so an evening learner sees the right
  number all day.
* **Total hours** - the sum of every session's duration. Duration is calculated
  from start and end time (and correctly handles a session that runs past
  midnight), but you can always type it in by hand.
* **Project progress** - completed features ÷ total features on that project.
* **Phase status** - Not Started, Just Started (<35%), In Progress, Almost There
  (≥80%) or Completed (every topic completed).

### Review scheduling

Each topic sits on a ladder of intervals: **1 → 3 → 7 → 14 → 30 → 60 → 120 → 180 days**.
How you rate a review moves you along it:

| Rating | Effect |
| --- | --- |
| Difficult | back to the first rung (review again tomorrow) |
| Needs Practice | one rung down |
| Good | one rung up |
| Easy | two rungs up, then stretched by 1.3× |

Topics due today (or overdue) appear in **Today's Review** on the dashboard and in
the Reviews page, where "Review them one by one" walks the whole queue.

---

## 10. Export and import your data

### Export

**Settings → Backup & transfer → Export JSON** downloads
`csharp-learning-tracker-YYYY-MM-DD.json`:

```jsonc
{
  "app": "csharp-engineer-learning-tracker",
  "schemaVersion": 1,
  "exportedAt": "2026-09-28T09:00:00.000Z",
  "data": { /* the whole document */ }
}
```

There is also **Copy to clipboard** if you would rather paste it somewhere.

Do this before a browser reset, before clearing site data, or whenever you want a
checkpoint. The file is plain readable JSON - you can keep it in a private git repo.

### Import

**Settings → Backup & transfer → Import JSON**, pick the file, confirm.

* Import **replaces** everything currently in the tracker (you are asked first).
* Both the wrapped format above and a bare document object are accepted.
* If the roadmap has gained topics since the export, they are merged in
  automatically, so an old backup never leaves you with a short curriculum.
* A file that is not a tracker export is rejected with a clear message rather than
  half-loading.

### Reset

**Settings → Reset** wipes every score, session, challenge and project and reseeds
the roadmap and the six starter projects. It asks you to type `RESET`, and offers
to export first.

---

## 11. Page by page

| Page | What it is for |
| --- | --- |
| **Learning page** | Not in the sidebar - you reach it by opening a topic. Lesson, worked examples, exercises at every level, knowledge check, explanation, no-help challenge and the mastery panel |
| **Dashboard** | Current learning (phase, topic, lesson progress, next action, Continue button), today's lesson plan with time remaining, today's review queue, all 12 phase cards, recent sessions, weak areas, recent achievements, and viewed-vs-demonstrated |
| **Roadmap** | All 12 phases as collapsible blocks with one chip per topic, coloured by status. Topics with a written lesson are marked `lesson`; the rest are tracked by hand. Clicking a chip opens its learning page |
| **Topics** | The full table: inline status changes, score pips, review dates, search, phase/status filters and six sort orders |
| **Sessions** | Live "Start session" timer, manual logging of past sessions, last-30-days chart and the full session log |
| **Reviews** | Due now, overdue, coming up, started-but-unscheduled topics, and the interval ladder. Reviewing a topic that has a lesson starts with a **retrieval test** - two questions from memory - before you rate the difficulty |
| **No-Help Challenges** | Problems attempted with no AI and no docs: result, time taken, what you got wrong, and a booked retry date. Success rate front and centre |
| **Projects** | The six starter projects, your own, and the **Personal Expense Tracker** mini-project which unlocks as you reach Comfortable on the six fundamentals topics it needs |
| **Statistics** | **Time invested** and **skill demonstrated** side by side, hours by phase, skill profile with strongest and weakest, donut, per-phase table with lesson coverage, weekly hours, daily minutes, a 26-week activity heatmap, and lists of completed / practicing / weak / overdue topics |
| **Settings** | Theme, daily goal, export, import, sample data, roadmap maintenance and reset |

The layout is responsive: the sidebar becomes a drawer below 1000px, so it works
on a tablet as well as a desktop.

---

## 12. How to actually use it

1. Pick the next topic in your current phase and set it to **Learning**.
2. Press **Start session** before you begin, **End session** when you stop, and be
   honest in *what I struggled with* - that is tomorrow's starting point.
3. When you can use the topic without looking things up, move it to **Practicing**
   and score it.
4. Prove it with a **No-Help Challenge**. If you fail, book the retry date there and
   then.
5. Only mark **Comfortable** or **Mastered** once you have evidence - write that
   evidence in the topic.
6. Clear **Today's Review** each day. It takes a couple of minutes and it is the
   difference between having learned something and still knowing it in March.
7. **Export** once a week.

---

## 13. Scope and limitations

### What is deliberately not here

Accounts, sync, a cloud backend, a build step, a framework, notifications, or a
phone layout below tablet width.

### Known limitations, stated plainly

* **Lesson coverage is 15 of 175 topics.** Every C# Fundamentals topic has a full
  interactive lesson. The other 160 are tracked exactly as before - status, scores,
  notes, reviews - and the roadmap marks clearly which is which. The app never
  pretends a lesson exists when it does not.
* **Static checks are not a compiler.** Without the runner, "code checked" means
  pattern matching. It can tell you that you did not use a loop; it cannot tell you
  your code compiles. The UI says this on every result.
* **The runner needs a second terminal.** It is a separate process by design - the
  app must keep working without it.
* **Explanation answers are self-assessed.** The app measures concept coverage and
  length; it cannot judge whether an explanation is genuinely yours. That is on you.
* **The code editor wraps long lines** rather than scrolling horizontally, so the
  line numbers count logical lines, not visual ones.
* **Dictionary iteration order** is relied on for display in a couple of exercise
  solutions, which is noted in those lessons as something not to rely on in
  production.

### Testing

```bash
npm install        # jsdom, for the tests only
npm test           # 264 assertions across three suites
```

| Suite | What it covers |
| --- | --- |
| `app.test.js` | 108 - the original tracker: store, progress, review ladder, CRUD, dates, export/import, XSS, filters |
| `learning.test.js` | 127 - lesson registry, v1→v2 migration, exercise grading for every type, mastery rules, manual overrides, achievements, learning-page rendering and interaction, knowledge check, challenge, session integration, retrieval test, mini-project unlock |
| `journey.test.js` | 29 - the complete user journey from the brief, start to finish |

Content is validated separately, against the real compiler:

```bash
npm run validate:run   # compiles and runs all 150 lesson code samples
```
