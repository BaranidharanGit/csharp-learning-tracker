/* ============================================================
   js/app.js
   Bootstrap: hash router, sidebar, topbar, theme and the live
   session timer. This is the last script the page loads.
   ============================================================ */
window.App = window.App || {};

(function (App) {
  'use strict';

  var U = App.utils;

  /* ---------- Route table (also drives the sidebar) ---------- */
  var ROUTES = [
    { id: 'dashboard',  label: 'Dashboard',  icon: 'dashboard'  },
    { id: 'roadmap',    label: 'Roadmap',    icon: 'roadmap'    },
    { id: 'topics',     label: 'Topics',     icon: 'topics',     count: function (s) { return s.topics.length; } },
    { id: 'sessions',   label: 'Sessions',   icon: 'sessions',   count: function (s) { return s.sessions.length; } },
    { id: 'reviews',    label: 'Reviews',    icon: 'reviews',
      count: function (s) { return App.review.dueTopics(s.topics).length; }, alert: true },
    { id: 'challenges', label: 'Challenges', icon: 'challenges', count: function (s) { return s.challenges.length; } },
    { id: 'projects',   label: 'Projects',   icon: 'projects',   count: function (s) { return s.projects.length; } },
    { id: 'statistics', label: 'Statistics', icon: 'statistics' },
    { id: 'settings',   label: 'Settings',   icon: 'settings'   }
  ];

  var ROUTE_BY_ID = ROUTES.reduce(function (m, r) { m[r.id] = r; return m; }, {});

  /* ============================================================
     Router
     ============================================================ */
  App.router = (function () {
    var current = { route: 'dashboard', params: {} };

    /** "#/topics?phase=core" -> { route:'topics', params:{phase:'core'} } */
    function parseHash() {
      var hash = (window.location.hash || '').replace(/^#\/?/, '');
      var parts = hash.split('?');
      var route = parts[0] || 'dashboard';
      var params = {};
      if (parts[1]) {
        parts[1].split('&').forEach(function (pair) {
          var kv = pair.split('=');
          if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
      }
      if (!ROUTE_BY_ID[route]) route = 'dashboard';
      return { route: route, params: params };
    }

    function buildHash(route, params) {
      var qs = Object.keys(params || {})
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
        .join('&');
      return '#/' + route + (qs ? '?' + qs : '');
    }

    /** Navigate. Same-route navigation still re-renders. */
    function go(route, params) {
      var next = buildHash(route, params);
      if (window.location.hash === next) { handleRoute(); }
      else { window.location.hash = next; }
      closeDrawer();
    }

    function handleRoute() {
      current = parseHash();
      renderCurrent();
      renderNav();
    }

    function renderCurrent() {
      var view = App.views[current.route];
      var host = freshViewHost();
      if (!view) { host.innerHTML = '<p class="muted">Page not found.</p>'; return; }

      document.getElementById('page-title').textContent = view.meta.title;
      document.getElementById('page-subtitle').textContent = view.meta.subtitle || '';
      document.title = view.meta.title + ' · C# Engineer Learning Tracker';

      view.render(host);
      host.scrollTop = 0;
    }

    return {
      go: go,
      start: function () {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
      },
      refresh: function () { renderCurrent(); renderNav(); },
      params: function () { return current.params; },
      route: function () { return current.route; }
    };
  })();

  /**
   * Replace #view with an empty clone of itself before every render.
   * Views attach their event listeners to this container, so reusing the
   * same element would stack a fresh set of listeners on every navigation
   * and make each click fire several times.
   */
  function freshViewHost() {
    var host = document.getElementById('view');
    var clean = host.cloneNode(false);   // same tag and attributes, no children, no listeners
    host.parentNode.replaceChild(clean, host);
    return clean;
  }

  /* ============================================================
     Sidebar
     ============================================================ */
  function renderNav() {
    var s = App.store.get();
    var active = App.router.route();
    var overdue = App.review.overdueTopics(s.topics).length;

    document.getElementById('nav').innerHTML = ROUTES.map(function (r) {
      var n = r.count ? r.count(s) : null;
      var alertClass = (r.alert && overdue > 0) ? ' is-alert' : '';
      return '<button class="nav-item' + (r.id === active ? ' is-active' : '') + '" data-route="' + r.id + '">' +
        App.icons(r.icon, 17) + '<span>' + r.label + '</span>' +
        (n ? '<span class="nav-count' + alertClass + '">' + n + '</span>' : '') +
      '</button>';
    }).join('');

    var o = App.progress.overall();
    document.getElementById('sidebar-progress').innerHTML =
      '<div class="mini-progress__top"><span>Overall</span><span class="tnum">' + o.percent + '%</span></div>' +
      App.charts.progressBar(o.percent, 'var(--accent)') +
      '<div class="small faint" style="margin-top:6px">' + o.completed + ' of ' + o.total + ' topics</div>';

    // Streak chip in the topbar
    var streak = App.progress.streak();
    var chip = document.getElementById('streak-chip');
    chip.innerHTML = App.icons('flame', 14) + '<span>' + streak.current + 'd</span>';
    chip.title = 'Current streak: ' + U.pluralize(streak.current, 'day') +
                 ' · longest ' + U.pluralize(streak.longest, 'day');
  }

  function closeDrawer() {
    document.getElementById('sidebar').classList.remove('is-open');
    document.getElementById('scrim').hidden = true;
  }

  function openDrawer() {
    document.getElementById('sidebar').classList.add('is-open');
    document.getElementById('scrim').hidden = false;
  }

  /* ============================================================
     Theme
     ============================================================ */
  App.applyTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    var btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = App.icons(theme === 'light' ? 'moon' : 'sun', 16);
  };

  function toggleTheme() {
    var next = App.store.get().settings.theme === 'light' ? 'dark' : 'light';
    App.store.setSetting('theme', next);
    App.applyTheme(next);
  }

  /* ============================================================
     Live session timer in the topbar
     ============================================================ */
  function renderSessionPill() {
    var active = App.sessionControl.active();
    var pill = document.getElementById('session-pill');
    var startBtn = document.getElementById('start-session-btn');

    pill.hidden = !active;
    startBtn.hidden = !!active;

    if (active) {
      document.getElementById('session-timer').textContent =
        U.fmtClock(App.sessionControl.elapsedSeconds());
    }
  }

  function startTimerLoop() {
    renderSessionPill();
    setInterval(function () {
      if (App.sessionControl.active()) renderSessionPill();
    }, 1000);
  }

  /* ============================================================
     First run
     ============================================================ */
  function maybeWelcome() {
    var s = App.store.get();
    if (s.meta.onboarded) return;

    App.ui.openModal({
      title: 'Welcome to your learning tracker',
      subtitle: 'Everything is stored on this computer only. No account, no cloud, no network.',
      bodyHtml:
        '<p class="small muted">The full roadmap is already loaded: <b>' +
          App.ROADMAP.length + ' phases</b> and <b>' + s.topics.length + ' topics</b>, ' +
          'plus six starter projects.</p>' +
        '<ul class="small muted" style="margin:12px 0 0;padding-left:18px;line-height:1.9">' +
          '<li>Set a status and scores per topic as you go.</li>' +
          '<li>Press <b>Start session</b> whenever you sit down to learn.</li>' +
          '<li>Rate your reviews - the app schedules the next one for you.</li>' +
          '<li>Use <b>No-Help Challenges</b> to check what you can really do.</li>' +
        '</ul>' +
        '<p class="small faint" style="margin-top:14px">Want to see it populated first? Load the sample month ' +
          'of data - you can reset it at any time from Settings.</p>',
      footerHtml:
        '<button class="btn" data-demo>Load sample data</button>' +
        '<button class="btn btn--primary" data-fresh>Start fresh</button>',
      onMount: function (h) {
        function finish(loadDemo) {
          App.store.update(function (st) { st.meta.onboarded = true; });
          if (loadDemo) {
            App.store.loadDemoData();
            App.ui.toast('Sample data loaded - reset it any time in Settings', 'ok', 4000);
          }
          h.close();
          App.router.refresh();
        }
        h.root.querySelector('[data-demo]').addEventListener('click', function () { finish(true); });
        h.root.querySelector('[data-fresh]').addEventListener('click', function () { finish(false); });
      }
    });
  }

  /* ============================================================
     Boot
     ============================================================ */
  function boot() {
    App.store.init();
    App.applyTheme(App.store.get().settings.theme);

    // Re-render the current page and the sidebar after any data change.
    App.store.subscribe(function () {
      App.router.refresh();
      renderSessionPill();
    });

    // Sidebar navigation
    document.getElementById('nav').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-route]');
      if (btn) App.router.go(btn.getAttribute('data-route'));
    });

    // Topbar
    document.getElementById('start-session-btn').addEventListener('click', function () {
      App.sessionControl.start();
    });
    document.getElementById('session-stop').addEventListener('click', function () {
      App.sessionControl.stop();
    });
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    document.getElementById('menu-btn').innerHTML = App.icons('menu', 18);
    document.getElementById('menu-btn').addEventListener('click', openDrawer);
    document.getElementById('scrim').addEventListener('click', closeDrawer);

    App.router.start();
    startTimerLoop();
    maybeWelcome();

    if (!App.store.isStorageWorking()) {
      App.ui.toast('Browser storage is blocked - your changes will not be saved. Try running the app from a local server.', 'danger', 8000);
    }
  }

  // The scripts are plain (non-deferred) tags at the end of <body>,
  // so the DOM is ready by the time this runs - but guard anyway.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Exposed for the views that need to refresh the sidebar directly.
  App.renderNav = renderNav;
})(window.App);
