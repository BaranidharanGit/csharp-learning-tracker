/* ============================================================
   js/core/store.js
   The single place that owns application data.

   Everything lives in ONE localStorage key as one JSON document.
   Views never touch localStorage directly - they call store.update()
   and re-render when the store notifies them.
   ============================================================ */
window.App = window.App || {};

App.store = (function () {
  'use strict';

  var U = App.utils;

  var STORAGE_KEY = 'csharp-learning-tracker/v1';
  var SCHEMA_VERSION = 2;

  var state = null;              // the in-memory copy of the document
  var listeners = [];            // functions to call after every change
  var storageWorks = true;       // false if localStorage is blocked

  /* ---------- Shapes ---------- */

  function defaultState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      settings: {
        theme: 'dark',
        dailyGoalMinutes: 60,
        focusTopicId: null,     // manually pinned "current topic" (null = auto)
        weekStartsMonday: true
      },
      dailyGoal: { date: null, text: '', done: false },
      topics: [],
      sessions: [],
      challenges: [],
      projects: [],
      activeSession: null,      // { startedAtMs, date, startTime, topicId, pausedMs, pausedAt }
      achievements: [],         // [{ id, date }] - unlocked milestones, see core/mastery.js
      meta: {
        createdAt: U.today(),
        projectsSeeded: false,
        demoLoaded: false,
        onboarded: false,
        miniProjectsSeeded: false,
        // Roadmap topics you deleted on purpose, so they are not seeded back.
        removedRoadmapIds: []
      }
    };
  }

  /**
   * Blank per-topic learning record (schema v2).
   * Everything the learning engine records about ONE topic lives here, so
   * v1 documents can be upgraded simply by adding this object.
   */
  function blankLearning() {
    return {
      level: 1,               // highest difficulty level reached (1-5, see core/mastery.js)
      lessonViewed: false,
      sectionsRead: [],       // ids of lesson sections marked read
      examplesViewed: [],     // ids of worked examples opened
      exercises: {},          // exerciseId -> { passed, attempts, hintsUsed, solutionViewed, seconds, lastAt, response }
      knowledgeCheck: { attempts: 0, bestScore: 0, passed: false, lastAt: null },
      challenge: { attempts: 0, passed: false, lastAt: null, bestSeconds: null },
      explanation: '',        // the learner's own explanation of the topic
      stillUnclear: '',       // "What I still don't understand"
      needsRevision: false,
      manualStatus: null,     // set when the learner overrides the earned status
      seconds: 0              // time spent on this topic's learning page
    };
  }

  /** Build a fresh topic record from a roadmap entry. */
  function makeTopic(phaseId, name, order, custom) {
    var t = U.today();
    return {
      id: phaseId + ':' + U.slug(name),
      name: name,
      phaseId: phaseId,
      order: order,
      status: 'not-started',
      understanding: 0,
      coding: 0,
      problemSolving: 0,
      debugging: 0,
      lastReviewed: null,
      nextReview: null,
      reviewStep: 0,        // position on the spaced-repetition ladder
      reviewCount: 0,
      notes: '',
      mistakes: '',
      evidence: '',
      custom: !!custom,
      learning: blankLearning(),
      createdAt: t,
      updatedAt: t
    };
  }

  function makeProject(seed) {
    return {
      id: U.uid('proj'),
      name: seed.name,
      description: seed.description || '',
      technologies: (seed.technologies || []).slice(),
      status: seed.status || 'Not Started',
      startDate: seed.startDate || '',
      targetDate: seed.targetDate || '',
      features: (seed.features || []).map(function (f) {
        return typeof f === 'string'
          ? { id: U.uid('feat'), title: f, done: false }
          : { id: f.id || U.uid('feat'), title: f.title, done: !!f.done };
      }),
      githubUrl: seed.githubUrl || '',
      notes: seed.notes || '',
      requiredTopicIds: (seed.requiredTopicIds || []).slice(),
      isMiniProject: !!seed.isMiniProject,
      createdAt: U.today()
    };
  }

  /* ---------- Seeding / merging ---------- */

  /**
   * Add every roadmap topic that is not already saved.
   * Existing topics keep all of their progress - this is a merge,
   * never an overwrite, so editing roadmap.js later is safe.
   */
  function ensureRoadmap(s) {
    var byId = {};
    s.topics.forEach(function (t) { byId[t.id] = t; });
    var removed = s.meta.removedRoadmapIds || [];

    App.ROADMAP.forEach(function (phase, pIndex) {
      phase.topics.forEach(function (name, tIndex) {
        var id = phase.id + ':' + U.slug(name);
        if (!byId[id] && removed.indexOf(id) === -1) {
          s.topics.push(makeTopic(phase.id, name, pIndex * 1000 + tIndex));
        }
      });
    });
    return s;
  }

  /** Put back every roadmap topic you previously deleted. */
  function restoreRoadmapTopics() {
    var count = 0;
    update(function (s) {
      count = (s.meta.removedRoadmapIds || []).length;
      s.meta.removedRoadmapIds = [];
      ensureRoadmap(s);
    });
    return count;
  }

  function ensureProjects(s) {
    if (!s.meta.projectsSeeded) {
      App.SEED_PROJECTS.forEach(function (p) { s.projects.push(makeProject(p)); });
      s.meta.projectsSeeded = true;
    }
    // Mini-projects arrived with schema v2 - seed them separately so existing
    // trackers gain them without their other projects being touched.
    if (!s.meta.miniProjectsSeeded && App.SEED_MINI_PROJECTS) {
      App.SEED_MINI_PROJECTS.forEach(function (p) {
        if (!s.projects.some(function (x) { return x.name === p.name; })) {
          var proj = makeProject(p);
          proj.requiredTopicIds = (p.requiredTopicIds || []).slice();
          proj.isMiniProject = true;
          s.projects.push(proj);
        }
      });
      s.meta.miniProjectsSeeded = true;
    }
    return s;
  }

  /**
   * Upgrade one topic's learning record: keeps whatever is already there and
   * fills in anything a newer version of the app expects. Safe to call on
   * undefined (a v1 topic) and on a partially-written v2 record.
   */
  function mergeLearning(existing) {
    var base = blankLearning();
    if (!existing || typeof existing !== 'object') return base;
    var out = Object.assign(base, existing);
    out.sectionsRead = Array.isArray(out.sectionsRead) ? out.sectionsRead : [];
    out.examplesViewed = Array.isArray(out.examplesViewed) ? out.examplesViewed : [];
    out.exercises = (out.exercises && typeof out.exercises === 'object') ? out.exercises : {};
    out.knowledgeCheck = Object.assign(base.knowledgeCheck, out.knowledgeCheck || {});
    out.challenge = Object.assign(base.challenge, out.challenge || {});
    ['explanation', 'stillUnclear'].forEach(function (f) {
      if (typeof out[f] !== 'string') out[f] = '';
    });
    out.level = Number(out.level) || 1;
    out.seconds = Number(out.seconds) || 0;
    return out;
  }

  /** Fill in any keys added by a newer version of the app. */
  function migrate(s) {
    var base = defaultState();
    s = s || {};
    s.schemaVersion = SCHEMA_VERSION;
    s.settings = Object.assign({}, base.settings, s.settings || {});
    s.dailyGoal = Object.assign({}, base.dailyGoal, s.dailyGoal || {});
    s.meta = Object.assign({}, base.meta, s.meta || {});
    if (!Array.isArray(s.meta.removedRoadmapIds)) s.meta.removedRoadmapIds = [];
    ['topics', 'sessions', 'challenges', 'projects'].forEach(function (key) {
      if (!Array.isArray(s[key])) s[key] = [];
    });
    if (s.activeSession === undefined) s.activeSession = null;
    if (!Array.isArray(s.achievements)) s.achievements = [];

    // Backfill fields on individual records so older exports still load.
    s.topics.forEach(function (t) {
      if (t.reviewStep === undefined) t.reviewStep = 0;
      if (t.reviewCount === undefined) t.reviewCount = 0;
      if (t.order === undefined) t.order = 9999;
      ['notes', 'mistakes', 'evidence'].forEach(function (f) {
        if (typeof t[f] !== 'string') t[f] = '';
      });
      // --- schema v1 -> v2: the learning engine's per-topic state ---
      if (typeof t.debugging !== 'number') t.debugging = 0;
      t.learning = mergeLearning(t.learning);
    });

    // v1 sessions have no help counters.
    s.sessions.forEach(function (x) {
      if (typeof x.hintsUsed !== 'number') x.hintsUsed = 0;
      if (typeof x.solutionsViewed !== 'number') x.solutionsViewed = 0;
    });

    // A v1 document has no activeSession pause fields.
    if (s.activeSession) {
      if (typeof s.activeSession.pausedMs !== 'number') s.activeSession.pausedMs = 0;
      if (s.activeSession.pausedAt === undefined) s.activeSession.pausedAt = null;
    }
    s.projects.forEach(function (p) {
      if (!Array.isArray(p.features)) p.features = [];
      if (!Array.isArray(p.technologies)) p.technologies = [];
      if (!Array.isArray(p.requiredTopicIds)) p.requiredTopicIds = [];
      if (typeof p.isMiniProject !== 'boolean') p.isMiniProject = false;
    });
    return s;
  }

  /* ---------- Persistence ---------- */

  function readStorage() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      storageWorks = false;
      console.warn('[tracker] localStorage unavailable - running in memory only.', err);
      return null;
    }
  }

  function writeStorage() {
    if (!storageWorks) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      storageWorks = false;
      console.warn('[tracker] Could not save to localStorage.', err);
      if (App.ui && App.ui.toast) {
        App.ui.toast('Could not save - browser storage is full or blocked.', 'danger');
      }
    }
  }

  /** Load from storage (or create a fresh document) and seed the roadmap. */
  function init() {
    var saved = readStorage();
    state = migrate(saved || defaultState());
    ensureRoadmap(state);
    ensureProjects(state);
    writeStorage();
    return state;
  }

  function get() {
    if (!state) init();
    return state;
  }

  /** Register a callback fired after every mutation. Returns an unsubscribe fn. */
  function subscribe(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (l) { return l !== fn; });
    };
  }

  function notify() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (err) { console.error('[tracker] listener failed', err); }
    });
  }

  /**
   * The only way to change data.
   *   store.update(function (s) { s.topics.push(...); });
   * Saves and notifies automatically.
   */
  function update(mutator, options) {
    get();
    mutator(state);
    writeStorage();
    if (!options || options.silent !== true) notify();
    return state;
  }

  /* ---------- Convenience accessors ---------- */

  function topicById(id) {
    return get().topics.filter(function (t) { return t.id === id; })[0] || null;
  }

  function topicsByPhase(phaseId) {
    return get().topics
      .filter(function (t) { return t.phaseId === phaseId; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function sortedTopics() {
    return get().topics.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function topicName(id) {
    var t = topicById(id);
    return t ? t.name : '—';
  }

  /* ---------- Topic CRUD ---------- */

  function addTopic(values) {
    var s = get();
    var phaseId = values.phaseId;
    var baseId = phaseId + ':' + U.slug(values.name);
    var id = baseId, n = 2;
    while (s.topics.some(function (t) { return t.id === id; })) { id = baseId + '-' + (n++); }

    var maxOrder = Math.max.apply(null, [0].concat(
      s.topics.filter(function (t) { return t.phaseId === phaseId; })
              .map(function (t) { return t.order || 0; })
    ));

    var topic = makeTopic(phaseId, values.name, maxOrder + 1, true);
    topic.id = id;
    Object.assign(topic, pickTopicFields(values));
    update(function (st) { st.topics.push(topic); });
    return topic;
  }

  /** Whitelist of user-editable topic fields (keeps bad keys out of storage). */
  function pickTopicFields(values) {
    var out = {};
    ['name', 'phaseId', 'status', 'notes', 'mistakes', 'evidence',
     'lastReviewed', 'nextReview'].forEach(function (k) {
      if (values[k] !== undefined) out[k] = values[k];
    });
    ['understanding', 'coding', 'problemSolving', 'debugging'].forEach(function (k) {
      if (values[k] !== undefined) out[k] = U.clamp(Number(values[k]) || 0, 0, 5);
    });
    return out;
  }

  function updateTopic(id, values) {
    update(function (s) {
      var t = s.topics.filter(function (x) { return x.id === id; })[0];
      if (!t) return;
      Object.assign(t, pickTopicFields(values));
      t.updatedAt = U.today();
    });
  }

  function deleteTopic(id) {
    update(function (s) {
      var topic = s.topics.filter(function (t) { return t.id === id; })[0];
      // Remember deletions of built-in topics so they are not seeded back on reload.
      if (topic && !topic.custom && s.meta.removedRoadmapIds.indexOf(id) === -1) {
        s.meta.removedRoadmapIds.push(id);
      }
      s.topics = s.topics.filter(function (t) { return t.id !== id; });
      // Sessions and challenges keep the id but will display as "(removed topic)".
      if (s.settings.focusTopicId === id) s.settings.focusTopicId = null;
    });
  }

  /* ---------- Learning state (schema v2) ---------- */

  /**
   * Mutate one topic's learning record.
   *   store.updateLearning(id, function (L) { L.lessonViewed = true; });
   * Always go through this rather than writing to topic.learning directly,
   * so the change is saved and every view re-renders.
   */
  function updateLearning(topicId, mutator) {
    update(function (s) {
      var t = s.topics.filter(function (x) { return x.id === topicId; })[0];
      if (!t) return;
      t.learning = mergeLearning(t.learning);
      mutator(t.learning, t);
      t.updatedAt = U.today();
    });
  }

  /** Record one exercise attempt and keep the best result. */
  function recordExercise(topicId, exerciseId, result) {
    updateLearning(topicId, function (L) {
      var prev = touchExercise(L, exerciseId);
      L.exercises[exerciseId] = {
        // "passed" is sticky: once demonstrated, a later failed retry does not undo it.
        passed: prev.passed || !!result.passed,
        attempts: prev.attempts + 1,
        hintsUsed: Math.max(prev.hintsUsed, result.hintsUsed || 0),
        solutionViewed: prev.solutionViewed || !!result.solutionViewed,
        seconds: prev.seconds + (result.seconds || 0),
        lastAt: U.today(),
        response: result.response !== undefined ? result.response : prev.response,
        // Solved first time with no hints and without peeking at the answer.
        independent: prev.independent ||
          (!!result.passed && !result.hintsUsed && !result.solutionViewed)
      };
    });
  }

  /** Ensure an exercise record exists, then hand it to the caller. */
  function touchExercise(L, exerciseId) {
    if (!L.exercises[exerciseId]) {
      L.exercises[exerciseId] = {
        passed: false, attempts: 0, hintsUsed: 0, solutionViewed: false,
        seconds: 0, lastAt: null, response: null, independent: false
      };
    }
    return L.exercises[exerciseId];
  }

  /** Remember that a hint was revealed, even if the exercise is never submitted. */
  function recordExerciseHint(topicId, exerciseId, hintsUsed) {
    updateLearning(topicId, function (L) {
      var rec = touchExercise(L, exerciseId);
      rec.hintsUsed = Math.max(rec.hintsUsed, hintsUsed);
    });
  }

  /** Remember that the solution was revealed - this ends "independent" status. */
  function recordExerciseSolutionViewed(topicId, exerciseId) {
    updateLearning(topicId, function (L) {
      touchExercise(L, exerciseId).solutionViewed = true;
    });
  }

  /** Add time spent on a topic's learning page (seconds). */
  function addTopicSeconds(topicId, seconds) {
    if (!seconds) return;
    updateLearning(topicId, function (L) { L.seconds += seconds; });
  }

  /** Unlock a milestone once. Returns true the first time only. */
  function unlockAchievement(id) {
    var s = get();
    if (s.achievements.some(function (a) { return a.id === id; })) return false;
    update(function (st) { st.achievements.push({ id: id, date: U.today() }); });
    return true;
  }

  /* ---------- Session CRUD ---------- */

  function addSession(values) {
    var session = {
      id: U.uid('sess'),
      date: values.date || U.today(),
      startTime: values.startTime || '',
      endTime: values.endTime || '',
      durationMinutes: Number(values.durationMinutes) || 0,
      topicId: values.topicId || '',
      learned: values.learned || '',
      struggled: values.struggled || '',
      exercises: Number(values.exercises) || 0,
      confidence: U.clamp(Number(values.confidence) || 0, 0, 5),
      notes: values.notes || '',
      // Schema v2: how much help was needed during this session.
      hintsUsed: Number(values.hintsUsed) || 0,
      solutionsViewed: Number(values.solutionsViewed) || 0,
      createdAt: U.today()
    };
    update(function (s) { s.sessions.push(session); });
    return session;
  }

  function updateSession(id, values) {
    update(function (s) {
      var x = s.sessions.filter(function (v) { return v.id === id; })[0];
      if (!x) return;
      Object.assign(x, {
        date: values.date, startTime: values.startTime, endTime: values.endTime,
        durationMinutes: Number(values.durationMinutes) || 0,
        topicId: values.topicId, learned: values.learned, struggled: values.struggled,
        exercises: Number(values.exercises) || 0,
        confidence: U.clamp(Number(values.confidence) || 0, 0, 5),
        notes: values.notes,
        hintsUsed: Number(values.hintsUsed) || 0,
        solutionsViewed: Number(values.solutionsViewed) || 0
      });
    });
  }

  function deleteSession(id) {
    update(function (s) {
      s.sessions = s.sessions.filter(function (x) { return x.id !== id; });
    });
  }

  /* ---------- Challenge CRUD ---------- */

  function addChallenge(values) {
    var c = {
      id: U.uid('chal'),
      name: values.name || 'Untitled challenge',
      date: values.date || U.today(),
      topicId: values.topicId || '',
      difficulty: values.difficulty || 'Medium',
      outcome: values.outcome || 'completed',   // 'completed' | 'failed'
      timeTakenMinutes: Number(values.timeTakenMinutes) || 0,
      notes: values.notes || '',
      gotWrong: values.gotWrong || '',
      retryDate: values.retryDate || '',
      createdAt: U.today()
    };
    update(function (s) { s.challenges.push(c); });
    return c;
  }

  function updateChallenge(id, values) {
    update(function (s) {
      var c = s.challenges.filter(function (x) { return x.id === id; })[0];
      if (!c) return;
      Object.assign(c, {
        name: values.name, date: values.date, topicId: values.topicId,
        difficulty: values.difficulty, outcome: values.outcome,
        timeTakenMinutes: Number(values.timeTakenMinutes) || 0,
        notes: values.notes, gotWrong: values.gotWrong, retryDate: values.retryDate
      });
    });
  }

  function deleteChallenge(id) {
    update(function (s) {
      s.challenges = s.challenges.filter(function (x) { return x.id !== id; });
    });
  }

  /* ---------- Project CRUD ---------- */

  function addProject(values) {
    var p = makeProject(values);
    update(function (s) { s.projects.push(p); });
    return p;
  }

  function updateProject(id, values) {
    update(function (s) {
      var p = s.projects.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      Object.assign(p, {
        name: values.name, description: values.description,
        technologies: values.technologies || [], status: values.status,
        startDate: values.startDate, targetDate: values.targetDate,
        features: values.features || [], githubUrl: values.githubUrl, notes: values.notes
      });
    });
  }

  function deleteProject(id) {
    update(function (s) {
      s.projects = s.projects.filter(function (x) { return x.id !== id; });
    });
  }

  /* ---------- Settings & daily goal ---------- */

  function setSetting(key, value) {
    update(function (s) { s.settings[key] = value; });
  }

  function setDailyGoal(text) {
    update(function (s) {
      s.dailyGoal = { date: U.today(), text: text, done: false };
    });
  }

  function toggleDailyGoalDone() {
    update(function (s) { s.dailyGoal.done = !s.dailyGoal.done; });
  }

  /* ---------- Export / import / reset ---------- */

  /** The exact JSON written by the Export button. */
  function exportObject() {
    return {
      app: 'csharp-engineer-learning-tracker',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: get()
    };
  }

  function exportJSON() { return JSON.stringify(exportObject(), null, 2); }

  function exportToFile() {
    U.downloadText('csharp-learning-tracker-' + U.today() + '.json', exportJSON());
  }

  /**
   * Replace everything with the contents of an exported file.
   * Accepts both the wrapper ({app, data}) and a bare state object.
   * Throws a friendly Error if the file is not one of ours.
   */
  function importJSON(text) {
    var parsed;
    try { parsed = JSON.parse(text); }
    catch (err) { throw new Error('That file is not valid JSON.'); }

    var incoming = parsed && parsed.data ? parsed.data : parsed;
    if (!incoming || typeof incoming !== 'object' || !Array.isArray(incoming.topics)) {
      throw new Error('That file does not look like a learning tracker export.');
    }

    state = migrate(incoming);
    ensureRoadmap(state);   // pick up any roadmap topics added since the export
    ensureProjects(state);  // and any projects added since it, e.g. mini-projects
    writeStorage();
    notify();
    return {
      topics: state.topics.length,
      sessions: state.sessions.length,
      challenges: state.challenges.length,
      projects: state.projects.length
    };
  }

  /** Wipe everything and start again from a freshly seeded roadmap. */
  function resetAll() {
    state = defaultState();
    ensureRoadmap(state);
    ensureProjects(state);
    writeStorage();
    notify();
  }

  /** Load the example data set (see js/data/demo.js). */
  function loadDemoData() {
    var demo = App.buildDemoData(get());
    update(function (s) {
      demo.topicPatches.forEach(function (patch) {
        var t = s.topics.filter(function (x) { return x.id === patch.id; })[0];
        if (t) Object.assign(t, patch.values, { updatedAt: U.today() });
      });
      s.sessions = s.sessions.concat(demo.sessions);
      s.challenges = s.challenges.concat(demo.challenges);
      demo.projectPatches.forEach(function (patch) {
        var p = s.projects.filter(function (x) { return x.name === patch.name; })[0];
        if (!p) return;
        var values = Object.assign({}, patch.values);
        // `featuresDone` is a demo-only shorthand, not a stored field.
        var featuresDone = values.featuresDone;
        delete values.featuresDone;
        Object.assign(p, values);
        if (featuresDone === 'all') {
          p.features.forEach(function (f) { f.done = true; });
        } else if (typeof featuresDone === 'number') {
          p.features.forEach(function (f, i) { f.done = i < featuresDone; });
        }
      });
      s.dailyGoal = demo.dailyGoal;
      s.settings.focusTopicId = demo.focusTopicId;
      s.meta.demoLoaded = true;
    });
  }

  /** Approximate size of the saved document, for the Settings page. */
  function storageSize() {
    try { return (window.localStorage.getItem(STORAGE_KEY) || '').length; }
    catch (err) { return 0; }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    init: init, get: get, update: update, subscribe: subscribe,
    topicById: topicById, topicsByPhase: topicsByPhase, sortedTopics: sortedTopics, topicName: topicName,
    addTopic: addTopic, updateTopic: updateTopic, deleteTopic: deleteTopic,
    addSession: addSession, updateSession: updateSession, deleteSession: deleteSession,
    addChallenge: addChallenge, updateChallenge: updateChallenge, deleteChallenge: deleteChallenge,
    addProject: addProject, updateProject: updateProject, deleteProject: deleteProject,
    setSetting: setSetting, setDailyGoal: setDailyGoal, toggleDailyGoalDone: toggleDailyGoalDone,
    updateLearning: updateLearning, recordExercise: recordExercise,
    recordExerciseHint: recordExerciseHint, recordExerciseSolutionViewed: recordExerciseSolutionViewed,
    addTopicSeconds: addTopicSeconds, unlockAchievement: unlockAchievement,
    blankLearning: blankLearning,
    exportJSON: exportJSON, exportToFile: exportToFile, importJSON: importJSON,
    resetAll: resetAll, loadDemoData: loadDemoData, storageSize: storageSize,
    restoreRoadmapTopics: restoreRoadmapTopics,
    isStorageWorking: function () { return storageWorks; }
  };
})();
