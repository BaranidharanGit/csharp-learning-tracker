/* ============================================================
   js/core/runner.js
   Client for the OPTIONAL local C# execution service.

   The tracker works completely without this. When tools/csharp-runner.js
   is running on 127.0.0.1:5174, the code editor gains a real Run button
   that compiles and executes your code with the .NET SDK on this machine.

   This is the ONLY network call the application ever makes, and it can
   only ever reach your own loopback address. Nothing is sent anywhere else.
   ============================================================ */
window.App = window.App || {};

App.runner = (function () {
  'use strict';

  var ENDPOINT = 'http://127.0.0.1:5174';
  var state = { available: false, probed: false, version: null, probing: null };
  var listeners = [];

  function notify() {
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { /* ignore */ } });
  }

  function onChange(fn) { listeners.push(fn); }

  /** fetch with a hard timeout, so a missing runner never hangs the UI. */
  function timedFetch(url, options, ms) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var opts = Object.assign({}, options, controller ? { signal: controller.signal } : {});
    var timer = setTimeout(function () { if (controller) controller.abort(); }, ms || 2000);
    return fetch(url, opts).then(function (res) {
      clearTimeout(timer);
      return res;
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  /**
   * Is the runner there? Cached after the first call.
   * The custom header forces a CORS preflight, which the runner only
   * answers for loopback origins.
   */
  function probe(force) {
    if (state.probed && !force) return Promise.resolve(state);
    if (state.probing) return state.probing;

    if (typeof fetch !== 'function') {
      state.probed = true;
      return Promise.resolve(state);
    }

    state.probing = timedFetch(ENDPOINT + '/health', {
      headers: { 'X-Tracker-Runner': '1' }
    }, 1500).then(function (res) {
      return res.json();
    }).then(function (json) {
      state.available = !!(json && json.ok);
      state.version = json && json.dotnet;
      state.probed = true;
      state.probing = null;
      notify();
      return state;
    }).catch(function () {
      state.available = false;
      state.probed = true;
      state.probing = null;
      notify();
      return state;
    });

    return state.probing;
  }

  /**
   * Compile and run a C# program locally.
   * Resolves with { ok, compiled, stdout, stderr, diagnostics, timedOut, durationMs }
   * or { unavailable: true } if the service is not running.
   */
  function run(code) {
    return probe().then(function (s) {
      if (!s.available) return { unavailable: true };
      return timedFetch(ENDPOINT + '/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tracker-Runner': '1' },
        body: JSON.stringify({ code: String(code || '') })
      }, 30000).then(function (res) { return res.json(); });
    }).catch(function (err) {
      return { unavailable: true, error: String(err && err.message || err) };
    });
  }

  function isAvailable() { return state.available; }
  function status() { return state; }

  return { probe: probe, run: run, isAvailable: isAvailable, status: status, onChange: onChange, ENDPOINT: ENDPOINT };
})();
