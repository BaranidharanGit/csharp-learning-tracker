/* ============================================================
   js/views/settings.js
   Appearance, data export / import, sample data and reset.
   Also documents how progress is calculated, so the rules live
   in the app and not only in the README.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

App.views.settings = (function () {
  'use strict';

  var U = App.utils, icon = App.icons;

  var meta = { title: 'Settings', subtitle: 'Your data, your rules - all of it stays on this machine' };

  function render(root) {
    var s = App.store.get();
    var size = App.store.storageSize();
    var removed = (s.meta.removedRoadmapIds || []).length;

    root.innerHTML =
      '<div class="grid grid--2">' +

        /* ---------- Appearance ---------- */
        '<div class="card">' +
          '<div class="card__head">' + icon('sun', 16) + '<h2>Appearance & goals</h2></div>' +
          '<div class="stack">' +
            '<div class="field"><label for="set-theme">Theme</label>' +
              '<select class="select" id="set-theme" data-set="theme">' +
                '<option value="dark"' + (s.settings.theme === 'dark' ? ' selected' : '') + '>Dark</option>' +
                '<option value="light"' + (s.settings.theme === 'light' ? ' selected' : '') + '>Light</option>' +
              '</select></div>' +
            '<div class="field"><label for="set-goal">Daily goal (minutes)</label>' +
              '<input class="input" type="number" id="set-goal" min="5" max="600" step="5" ' +
                'value="' + (s.settings.dailyGoalMinutes || 60) + '" data-set="dailyGoalMinutes">' +
              '<span class="field__hint">Used by the "Today" tile on the dashboard.</span></div>' +
          '</div>' +
        '</div>' +

        /* ---------- Export / import ---------- */
        '<div class="card">' +
          '<div class="card__head">' + icon('download', 16) + '<h2>Backup & transfer</h2></div>' +
          '<p class="small muted">Everything you have recorded fits in one JSON file. Export it to back up ' +
            'your progress or move it to another computer.</p>' +
          '<div class="row" style="margin-top:14px">' +
            '<button class="btn btn--primary" data-export>' + icon('download', 15) + ' Export JSON</button>' +
            '<button class="btn" data-import>' + icon('upload', 15) + ' Import JSON</button>' +
            '<button class="btn" data-copy>Copy to clipboard</button>' +
          '</div>' +
          '<input type="file" accept="application/json,.json" hidden data-file>' +
          '<div class="kv" style="margin-top:16px">' +
            '<dt>Stored in</dt><dd><code>localStorage</code></dd>' +
            '<dt>Key</dt><dd><code>' + U.escapeHtml(App.store.STORAGE_KEY) + '</code></dd>' +
            '<dt>Size</dt><dd class="tnum">' + U.formatBytes(size) + '</dd>' +
            '<dt>Storage</dt><dd>' + (App.store.isStorageWorking()
              ? '<span class="badge badge--ok">working</span>'
              : '<span class="badge badge--danger">blocked - changes will be lost on reload</span>') + '</dd>' +
          '</div>' +
        '</div>' +

        /* ---------- Sample data ---------- */
        '<div class="card">' +
          '<div class="card__head">' + icon('book', 16) + '<h2>Sample data</h2></div>' +
          '<p class="small muted">Loads an example month of progress - topic scores, 27 sessions, ' +
            'challenges and project progress - so you can see every screen populated. ' +
            'It is added on top of what you already have, so use it on a fresh tracker.</p>' +
          '<div class="row" style="margin-top:14px">' +
            '<button class="btn" data-demo>' + (s.meta.demoLoaded ? 'Load sample data again' : 'Load sample data') + '</button>' +
          '</div>' +
          (s.meta.demoLoaded ? '<p class="small faint" style="margin-top:10px">Sample data has been loaded in this tracker.</p>' : '') +
        '</div>' +

        /* ---------- How progress works ---------- */
        '<div class="card">' +
          '<div class="card__head">' + icon('info', 16) + '<h2>How progress is calculated</h2></div>' +
          '<p class="small muted">Each topic contributes a weight based on its status. A phase percentage is ' +
            'the average weight of its topics; the overall percentage is the average across all topics.</p>' +
          '<div class="kv" style="margin-top:12px">' +
            App.STATUSES.map(function (st) {
              return '<dt><span class="badge badge--' + st.id + '"><i class="dot"></i>' + st.label + '</span></dt>' +
                '<dd class="tnum">' + Math.round(st.weight * 100) + '%</dd>';
            }).join('') +
            '<dt>Completed</dt><dd>Comfortable or Mastered</dd>' +
            '<dt>Weak topic</dt><dd>started, average score 2 or below</dd>' +
            '<dt>Streak</dt><dd>consecutive days with at least one session</dd>' +
          '</div>' +
        '</div>' +

        /* ---------- Content maintenance ---------- */
        '<div class="card">' +
          '<div class="card__head">' + icon('roadmap', 16) + '<h2>Roadmap</h2></div>' +
          '<div class="kv">' +
            '<dt>Phases</dt><dd class="tnum">' + App.ROADMAP.length + '</dd>' +
            '<dt>Topics tracked</dt><dd class="tnum">' + s.topics.length + '</dd>' +
            '<dt>Custom topics</dt><dd class="tnum">' +
              s.topics.filter(function (t) { return t.custom; }).length + '</dd>' +
            '<dt>Deleted built-ins</dt><dd class="tnum">' + removed + '</dd>' +
          '</div>' +
          '<p class="small faint" style="margin-top:12px">Editing <code>js/data/roadmap.js</code> and reloading ' +
            'adds any new topics without touching your progress.</p>' +
          (removed ? '<button class="btn btn--sm" style="margin-top:12px" data-restore>Restore ' + removed +
            ' deleted roadmap ' + (removed === 1 ? 'topic' : 'topics') + '</button>' : '') +
        '</div>' +

        /* ---------- Danger zone ---------- */
        '<div class="card danger-zone">' +
          '<div class="card__head">' + icon('alert', 16) + '<h2>Reset</h2></div>' +
          '<p class="small muted">Deletes every topic score, session, challenge and project, then reloads the ' +
            'roadmap and the six starter projects from scratch. Export first if you might want it back.</p>' +
          '<div class="row" style="margin-top:14px">' +
            '<button class="btn btn--outline-danger" data-reset>Reset all data</button>' +
          '</div>' +
        '</div>' +

      '</div>' +

      '<div class="card section" style="margin-top:16px">' +
        '<div class="card__head">' + icon('info', 16) + '<h2>Your data</h2></div>' +
        '<div class="grid grid--stats">' +
          count('Topics', s.topics.length) +
          count('Sessions', s.sessions.length) +
          count('Challenges', s.challenges.length) +
          count('Projects', s.projects.length) +
          count('Tracking since', 0, U.fmtDate(s.meta.createdAt)) +
        '</div>' +
        '<p class="small faint" style="margin-top:14px">This application never makes a network request. ' +
          'Nothing you type here leaves your computer.</p>' +
      '</div>';

    wire(root);
  }

  function count(label, n, text) {
    return '<div class="stat"><span class="stat__label">' + U.escapeHtml(label) + '</span>' +
      '<span class="stat__value" style="font-size:' + (text ? '16px' : '25px') + '">' +
        U.escapeHtml(text || String(n)) + '</span></div>';
  }

  /* ---------- Actions ---------- */

  function wire(root) {
    root.addEventListener('change', function (e) {
      var key = e.target.getAttribute && e.target.getAttribute('data-set');
      if (!key) return;
      var value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      App.store.setSetting(key, value);
      if (key === 'theme') App.applyTheme(value);
      App.ui.toast('Setting saved', 'ok', 1400);
    });

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-export]')) doExport();
      else if (e.target.closest('[data-copy]')) doCopy();
      else if (e.target.closest('[data-import]')) root.querySelector('[data-file]').click();
      else if (e.target.closest('[data-demo]')) doDemo();
      else if (e.target.closest('[data-reset]')) doReset();
      else if (e.target.closest('[data-restore]')) {
        var n = App.store.restoreRoadmapTopics();
        App.ui.toast('Restored ' + U.pluralize(n, 'topic'), 'ok');
      }
    });

    root.querySelector('[data-file]').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) doImport(file);
      e.target.value = '';   // allow re-importing the same file
    });
  }

  function doExport() {
    App.store.exportToFile();
    App.ui.toast('Exported to your Downloads folder', 'ok');
  }

  function doCopy() {
    var text = App.store.exportJSON();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () { App.ui.toast('JSON copied to clipboard', 'ok'); })
        .catch(function () { showRawJson(text); });
    } else {
      showRawJson(text);
    }
  }

  function showRawJson(text) {
    App.ui.openModal({
      title: 'Your data as JSON',
      subtitle: 'Select all and copy',
      size: 'wide',
      bodyHtml: '<textarea class="textarea" rows="16" readonly>' + U.escapeHtml(text) + '</textarea>',
      footerHtml: '<button class="btn" data-close>Close</button>'
    });
  }

  function doImport(file) {
    U.readFileAsText(file).then(function (text) {
      App.ui.confirm({
        title: 'Replace all current data?',
        message: 'Importing "' + file.name + '" overwrites everything currently in the tracker.',
        confirmLabel: 'Import and replace', danger: true
      }).then(function (ok) {
        if (!ok) return;
        try {
          var result = App.store.importJSON(text);
          App.applyTheme(App.store.get().settings.theme);
          App.ui.toast('Imported ' + result.topics + ' topics, ' + result.sessions + ' sessions', 'ok', 4000);
        } catch (err) {
          App.ui.toast(err.message, 'danger', 5000);
        }
      });
    }).catch(function (err) {
      App.ui.toast(err.message, 'danger');
    });
  }

  function doDemo() {
    App.ui.confirm({
      title: 'Load sample data?',
      message: 'Example scores, sessions, challenges and project progress will be added to this tracker.',
      confirmLabel: 'Load sample data'
    }).then(function (ok) {
      if (!ok) return;
      App.store.loadDemoData();
      App.ui.toast('Sample data loaded', 'ok');
      App.router.go('dashboard');
    });
  }

  function doReset() {
    App.ui.formModal({
      title: 'Reset all data?',
      subtitle: 'This cannot be undone. Type RESET to confirm.',
      size: 'sm',
      fields: [
        { name: 'confirm', label: 'Type RESET', type: 'text', required: true, placeholder: 'RESET' }
      ],
      values: { confirm: '' },
      submitLabel: 'Reset everything',
      extraFooterHtml: '<button type="button" class="btn btn--sm" data-export-first>Export first</button>',
      onSubmit: function (v) {
        if (v.confirm.trim().toUpperCase() !== 'RESET') {
          App.ui.toast('Type RESET exactly to confirm.', 'warn');
          return false;   // keep the dialog open
        }
        App.store.resetAll();
        App.applyTheme(App.store.get().settings.theme);
        App.ui.toast('All data reset', 'ok');
        App.router.go('dashboard');
      },
      onFooterClick: function (e) {
        if (e.target.closest('[data-export-first]')) doExport();
      }
    });
  }

  return { meta: meta, render: render };
})();
