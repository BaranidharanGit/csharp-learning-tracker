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
  var SCHEMA_VERSION = 1;

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
      activeSession: null,      // { startedAtMs, date, startTime, topicId }
      meta: {
        createdAt: U.today(),
        projectsSeeded: false,
        demoLoaded: false,
        onboarded: false,
        // Roadmap topics you deleted on purpose, so they are not seeded back.
        removedRoadmapIds: []
      }
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
      lastReviewed: null,
      nextReview: null,
      reviewStep: 0,        // position on the spaced-repetition ladder
      reviewCount: 0,
      notes: '',
      mistakes: '',
      evidence: '',
      custom: !!custom,
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
    return s;
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

    // Backfill fields on individual records so older exports still load.
    s.topics.forEach(function (t) {
      if (t.reviewStep === undefined) t.reviewStep = 0;
      if (t.reviewCount === undefined) t.reviewCount = 0;
      if (t.order === undefined) t.order = 9999;
      ['notes', 'mistakes', 'evidence'].forEach(function (f) {
        if (typeof t[f] !== 'string') t[f] = '';
      });
    });
    s.projects.forEach(function (p) {
      if (!Array.isArray(p.features)) p.features = [];
      if (!Array.isArray(p.technologies)) p.technologies = [];
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
    ['understanding', 'coding', 'problemSolving'].forEach(function (k) {
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
        notes: values.notes
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
    exportJSON: exportJSON, exportToFile: exportToFile, importJSON: importJSON,
    resetAll: resetAll, loadDemoData: loadDemoData, storageSize: storageSize,
    restoreRoadmapTopics: restoreRoadmapTopics,
    isStorageWorking: function () { return storageWorks; }
  };
})();
