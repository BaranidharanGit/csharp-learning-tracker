/* ============================================================
   js/views/projects.js
   Portfolio projects. Progress comes from the feature checklist,
   which you can tick straight from the card.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

App.views.projects = (function () {
  'use strict';

  var U = App.utils, C = App.charts, P = App.progress, icon = App.icons;

  var meta = { title: 'Projects', subtitle: 'Proof that you can build, not just study' };

  var STATUSES = ['Not Started', 'Planning', 'In Progress', 'Paused', 'Completed'];

  var STATUS_TONE = {
    'Not Started': 'muted', 'Planning': 'info', 'In Progress': 'accent',
    'Paused': 'warn', 'Completed': 'ok'
  };

  function openForm(id) {
    var editing = id ? App.store.get().projects.filter(function (p) { return p.id === id; })[0] : null;

    var values = editing || {
      name: '', description: '', technologies: [], status: 'Not Started',
      startDate: '', targetDate: '', features: [], githubUrl: '', notes: ''
    };

    App.ui.formModal({
      title: editing ? editing.name : 'Add project',
      subtitle: editing ? 'Edit project details and features' : 'Something you will actually finish',
      size: 'wide',
      fields: [
        { name: 'name', label: 'Project name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
        { name: 'technologies', label: 'Technologies', type: 'tags',
          placeholder: 'C#, ASP.NET Core, SQL Server' , hint: 'Comma separated' },
        { name: 'status', label: 'Status', type: 'select', full: false,
          options: STATUSES.map(function (s) { return { value: s, label: s }; }) },
        { name: 'githubUrl', label: 'GitHub URL', type: 'url', full: false,
          placeholder: 'https://github.com/...' },
        { name: 'startDate', label: 'Start date', type: 'date', full: false },
        { name: 'targetDate', label: 'Target date', type: 'date', full: false },
        { name: 'features', label: 'Features', type: 'features',
          hint: 'Tick a feature when it is done - this drives the project progress bar.' },
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 }
      ],
      values: values,
      submitLabel: editing ? 'Save changes' : 'Add project',
      extraFooterHtml: editing
        ? '<button type="button" class="btn btn--sm btn--outline-danger" data-delete>Delete</button>' : '',
      onSubmit: function (v) {
        if (editing) { App.store.updateProject(editing.id, v); App.ui.toast('Project saved', 'ok'); }
        else { App.store.addProject(v); App.ui.toast('Project added', 'ok'); }
      },
      onFooterClick: function (e, handle) {
        if (editing && e.target.closest('[data-delete]')) {
          App.ui.confirm({ title: 'Delete project?', message: editing.name, confirmLabel: 'Delete', danger: true })
            .then(function (ok) {
              if (!ok) return;
              App.store.deleteProject(editing.id);
              handle.close();
              App.ui.toast('Project deleted');
            });
        }
      }
    });
  }

  function render(root) {
    var projects = App.store.get().projects;
    var totals = projects.reduce(function (acc, p) {
      var pr = P.projectProgress(p);
      acc.features += pr.total;
      acc.done += pr.done;
      if (p.status === 'Completed') acc.completed += 1;
      if (p.status === 'In Progress') acc.active += 1;
      return acc;
    }, { features: 0, done: 0, completed: 0, active: 0 });

    root.innerHTML =
      '<div class="grid grid--stats section">' +
        tile('Projects', String(projects.length), totals.completed + ' completed') +
        tile('In progress', String(totals.active), 'being built now') +
        tile('Features shipped', totals.done + ' / ' + totals.features,
             totals.features ? Math.round((totals.done / totals.features) * 100) + '% of all features' : '—') +
      '</div>' +

      '<div class="toolbar"><span class="spacer"></span>' +
        '<button class="btn btn--primary" data-add>' + icon('plus', 15) + ' Add project</button></div>' +

      (projects.length
        ? '<div class="grid grid--3">' + projects.map(card).join('') + '</div>'
        : App.ui.emptyState('No projects yet', 'Add the first thing you are going to build.',
            '<button class="btn btn--primary btn--sm" data-add>Add project</button>'));

    wire(root);
  }

  function tile(label, value, hint) {
    return '<div class="stat"><span class="stat__label">' + U.escapeHtml(label) + '</span>' +
      '<span class="stat__value">' + U.escapeHtml(value) + '</span>' +
      '<span class="stat__hint">' + U.escapeHtml(hint) + '</span></div>';
  }

  function card(p) {
    var pr = P.projectProgress(p);
    var tone = STATUS_TONE[p.status] || 'muted';
    var overdue = p.targetDate && p.status !== 'Completed' && U.daysBetween(U.today(), p.targetDate) < 0;

    return '<div class="card proj">' +
      '<div class="proj__head">' +
        '<div style="min-width:0;flex:1">' +
          '<div class="proj__name">' + U.escapeHtml(p.name) + '</div>' +
          '<span class="badge badge--' + tone + '" style="margin-top:5px">' + U.escapeHtml(p.status) + '</span>' +
        '</div>' +
        '<button class="icon-btn icon-btn--bare" data-edit="' + p.id + '" title="Edit">' + icon('edit', 15) + '</button>' +
      '</div>' +

      (p.description ? '<p class="proj__desc">' + U.escapeHtml(p.description) + '</p>' : '') +

      (p.technologies.length
        ? '<div class="row row--tight">' + p.technologies.map(function (t) {
            return '<span class="tag">' + U.escapeHtml(t) + '</span>'; }).join('') + '</div>'
        : '') +

      '<div>' +
        '<div class="row small faint" style="margin-bottom:5px">' +
          '<span>Features</span><span class="spacer tnum">' + pr.done + ' / ' + pr.total + ' · ' + pr.percent + '%</span>' +
        '</div>' +
        C.progressBar(pr.percent, pr.percent === 100 ? 'var(--ok)' : 'var(--accent)') +
      '</div>' +

      (p.features.length
        ? '<div class="proj__features">' + p.features.map(function (f) {
            return '<label class="feat-row' + (f.done ? ' done' : '') + '">' +
              '<input type="checkbox" data-feature="' + p.id + '|' + f.id + '" ' + (f.done ? 'checked' : '') + '>' +
              '<span>' + U.escapeHtml(f.title) + '</span></label>';
          }).join('') + '</div>'
        : '<p class="small faint">No features listed yet - edit the project to add some.</p>') +

      '<div class="row small faint" style="border-top:1px solid var(--border-soft);padding-top:10px">' +
        (p.startDate ? '<span>' + icon('calendar', 12) + ' ' + U.fmtDateShort(p.startDate) + '</span>' : '') +
        (p.targetDate
          ? '<span style="' + (overdue ? 'color:var(--danger)' : '') + '">→ ' + U.fmtDateShort(p.targetDate) +
            (overdue ? ' (overdue)' : '') + '</span>'
          : '') +
        '<span class="spacer"></span>' +
        (p.githubUrl
          ? '<a href="' + U.escapeHtml(p.githubUrl) + '" target="_blank" rel="noopener noreferrer">' +
            icon('external', 12) + ' GitHub</a>'
          : '') +
      '</div>' +

      (p.notes ? '<div class="note-box">' + U.escapeHtml(p.notes) + '</div>' : '') +
    '</div>';
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var t;
      if (e.target.closest('[data-add]')) openForm(null);
      else if ((t = e.target.closest('[data-edit]'))) openForm(t.getAttribute('data-edit'));
    });

    root.addEventListener('change', function (e) {
      if (!e.target.matches('[data-feature]')) return;
      // value is "projectId|featureId"
      var parts = e.target.getAttribute('data-feature').split('|');
      var checked = e.target.checked;
      App.store.update(function (s) {
        var proj = s.projects.filter(function (p) { return p.id === parts[0]; })[0];
        if (!proj) return;
        var feat = proj.features.filter(function (f) { return f.id === parts[1]; })[0];
        if (feat) feat.done = checked;
      });
    });
  }

  return { meta: meta, render: render };
})();
