# C# Engineer Learning Tracker

A local-only personal tracker for learning C# from fundamentals through ASP.NET Core,
SQL, Angular, Azure, system design and AI-assisted development.

**175 topics across 12 phases**, topic scoring, learning sessions with a live timer,
spaced-repetition reviews, no-help challenges, project tracking and a statistics page.

No account. No backend. No network requests. Everything is stored in your own browser.

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

### Installing dependencies

**There are none.** No `npm install`, no build step, no bundler, no framework.
It is HTML, CSS and plain JavaScript. If you have a browser, you can run it.

---

## 2. Folder structure

```
csharp-learning-tracker/
├── index.html              Page shell: sidebar, topbar, view container, script tags
├── start.command           Local launcher (macOS double-click or ./start.command)
├── README.md               This file
│
├── css/
│   ├── base.css            Design tokens (light + dark), reset, app-shell layout
│   └── components.css      Buttons, cards, tables, forms, modals, charts, badges
│
└── js/
    ├── data/               Content you can edit by hand
    │   ├── roadmap.js        The 12 phases and their topics + the 5 statuses
    │   ├── projects.js       The 6 starter projects
    │   └── demo.js           Optional sample data, generated relative to today
    │
    ├── core/               Logic, no HTML pages
    │   ├── utils.js          Dates, durations, escaping, ids, file download
    │   ├── store.js          THE data layer: load/save/seed/export/import/reset
    │   ├── review.js         Spaced-repetition scheduler
    │   ├── progress.js       Every percentage, streak and statistic
    │   ├── charts.js         Hand-rolled SVG donut / bars / heatmap
    │   ├── icons.js          Inline SVG icon set
    │   └── ui.js             Toasts, confirm dialogs, the form-modal builder
    │
    ├── views/              One file per page in the sidebar
    │   ├── dashboard.js    roadmap.js    topics.js
    │   ├── sessions.js     reviews.js    challenges.js
    │   ├── projects.js     statistics.js settings.js
    │
    └── app.js              Bootstrap: hash router, sidebar, theme, session timer
```

The rule of thumb: **`core/` never touches the DOM, `views/` never touches
`localStorage`.** Views read through `App.store` / `App.progress` and write through
`App.store.update(...)`; the store then tells every view to re-render.

---

## 3. How data is stored

Everything lives in **one JSON document in `localStorage`** under the key:

```
csharp-learning-tracker/v1
```

That is a per-browser, per-machine store: it is not synced, not uploaded, and not
shared between Chrome and Safari. The document looks like this:

```jsonc
{
  "schemaVersion": 1,
  "settings":   { "theme": "dark", "dailyGoalMinutes": 60, "focusTopicId": null },
  "dailyGoal":  { "date": "2026-09-28", "text": "...", "done": false },
  "topics":     [ /* 175 topics: status, 3 scores, notes, review dates */ ],
  "sessions":   [ /* every study session you log */ ],
  "challenges": [ /* no-help challenge attempts */ ],
  "projects":   [ /* projects and their feature checklists */ ],
  "activeSession": null,   // set while the live timer is running
  "meta":       { "createdAt": "...", "demoLoaded": false }
}
```

Notes:

* **Dates** are plain local `"YYYY-MM-DD"` strings and **times** are `"HH:MM"`, so
  "today" always means today where you are, with no timezone surprises.
* A **running session survives a reload** - the start time is written into the
  document, so closing the tab by accident does not lose your timer.
* Nothing is ever sent anywhere. There is not a single `fetch` or `XMLHttpRequest`
  in the codebase.

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

## 5. How progress is calculated

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

## 6. Export and import your data

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

## 7. Page by page

| Page | What it is for |
| --- | --- |
| **Dashboard** | Overall %, streak, hours, today's time vs goal, current phase and topic, today's learning goal, today's review queue, all 12 phase cards, recent sessions, and anything needing attention |
| **Roadmap** | All 12 phases as collapsible blocks with one chip per topic, coloured by status. Search and filter, click any chip to edit |
| **Topics** | The full table: inline status changes, score pips, review dates, search, phase/status filters and six sort orders |
| **Sessions** | Live "Start session" timer, manual logging of past sessions, last-30-days chart and the full session log |
| **Reviews** | Due now, overdue, coming up, started-but-unscheduled topics, and an explanation of the interval ladder |
| **No-Help Challenges** | Problems attempted with no AI and no docs: result, time taken, what you got wrong, and a booked retry date. Success rate front and centre |
| **Projects** | The six starter projects plus your own. Tick features straight from the card to move the progress bar |
| **Statistics** | The detailed progress page: donut, per-phase table, weekly hours, daily minutes, a 26-week activity heatmap, and lists of completed / practicing / weak / overdue topics |
| **Settings** | Theme, daily goal, export, import, sample data, roadmap maintenance and reset |

The layout is responsive: the sidebar becomes a drawer below 1000px, so it works
on a tablet as well as a desktop.

---

## 8. How I would actually use it

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

## 9. Version 1 scope

Deliberately not included: accounts, sync, a backend, a build step, a framework,
notifications, or a mobile layout below tablet width. Version 1 is meant to be
small enough that you can read the whole codebase in an afternoon - which is a
reasonable thing to do while learning to build software.
