/* ============================================================
   js/core/ui.js
   Shared interface pieces: toasts, confirm dialogs and a small
   declarative form-modal builder.

   Every "Add / Edit" screen in the app is built from a field list
   like:  [{ name:'title', label:'Title', type:'text', required:true }]
   which keeps the view files short and consistent.
   ============================================================ */
window.App = window.App || {};

App.ui = (function () {
  'use strict';

  var U = App.utils;
  var openModals = [];

  /* ============================================================
     Toasts
     ============================================================ */
  function toast(message, tone, ms) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast' + (tone ? ' toast--' + tone : '');
    el.textContent = message;
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .2s, transform .2s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(10px)';
      setTimeout(function () { el.remove(); }, 220);
    }, ms || 2600);
  }

  /* ============================================================
     Generic modal
     ============================================================ */

  /**
   * openModal({ title, subtitle, bodyHtml, footerHtml, size, onMount })
   * Returns { root, modal, close } so callers can wire their own events.
   */
  function openModal(opts) {
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    var sizeClass = opts.size === 'wide' ? ' modal--wide' : opts.size === 'sm' ? ' modal--sm' : '';
    backdrop.innerHTML =
      '<div class="modal' + sizeClass + '" role="dialog" aria-modal="true">' +
        '<div class="modal__head">' +
          '<div style="min-width:0">' +
            '<h2>' + U.escapeHtml(opts.title || '') + '</h2>' +
            (opts.subtitle ? '<p>' + U.escapeHtml(opts.subtitle) + '</p>' : '') +
          '</div>' +
          '<button type="button" class="icon-btn icon-btn--bare spacer" data-close aria-label="Close">' +
            App.icons('x', 16) + '</button>' +
        '</div>' +
        '<div class="modal__body">' + (opts.bodyHtml || '') + '</div>' +
        (opts.footerHtml ? '<div class="modal__foot">' + opts.footerHtml + '</div>' : '') +
      '</div>';

    document.getElementById('modal-root').appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      backdrop.remove();
      openModals = openModals.filter(function (m) { return m !== handle; });
      if (!openModals.length) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (opts.onClose) opts.onClose();
    }

    function onKey(e) {
      // Only the top-most modal reacts to Escape.
      if (e.key === 'Escape' && openModals[openModals.length - 1] === handle) {
        e.stopPropagation();
        close();
      }
    }

    var handle = { root: backdrop, modal: backdrop.firstElementChild, close: close };
    openModals.push(handle);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop || e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', onKey);

    if (opts.onMount) opts.onMount(handle);

    // Focus the first usable control for keyboard users.
    var first = backdrop.querySelector('input, select, textarea, button:not([data-close])');
    if (first) setTimeout(function () { first.focus(); }, 30);

    return handle;
  }

  /** Promise-based replacement for window.confirm(). Always settles exactly once. */
  function confirm(opts) {
    return new Promise(function (resolve) {
      var answered = false;
      function settle(value) {
        if (answered) return;
        answered = true;
        resolve(value);
      }

      openModal({
        title: opts.title || 'Are you sure?',
        size: 'sm',
        bodyHtml: '<p class="muted" style="font-size:13px">' + U.escapeHtml(opts.message || '') + '</p>',
        footerHtml:
          '<button type="button" class="btn" data-close>' + U.escapeHtml(opts.cancelLabel || 'Cancel') + '</button>' +
          '<button type="button" class="btn ' + (opts.danger ? 'btn--danger' : 'btn--primary') + '" data-ok>' +
            U.escapeHtml(opts.confirmLabel || 'Confirm') + '</button>',
        onMount: function (h) {
          h.root.querySelector('[data-ok]').addEventListener('click', function () {
            settle(true);
            h.close();
          });
        },
        // Escape, the close icon, the backdrop and Cancel all land here.
        onClose: function () { settle(false); }
      });
    });
  }

  /* ============================================================
     Field rendering
     ============================================================ */

  function fieldHtml(f, value) {
    var id = 'f-' + f.name;
    var common = 'id="' + id + '" name="' + f.name + '"' + (f.required ? ' required' : '');
    var inner;

    switch (f.type) {
      case 'textarea':
        inner = '<textarea class="textarea" ' + common +
          (f.rows ? ' rows="' + f.rows + '"' : '') +
          (f.placeholder ? ' placeholder="' + U.escapeHtml(f.placeholder) + '"' : '') + '>' +
          U.escapeHtml(value || '') + '</textarea>';
        break;

      case 'select':
        inner = '<select class="select" ' + common + '>' +
          (f.options || []).map(function (o) {
            var val = o.value !== undefined ? o.value : o;
            var label = o.label !== undefined ? o.label : o;
            return '<option value="' + U.escapeHtml(val) + '"' +
              (String(val) === String(value === undefined || value === null ? '' : value) ? ' selected' : '') + '>' +
              U.escapeHtml(label) + '</option>';
          }).join('') + '</select>';
        break;

      case 'range':
        inner = '<div class="range-row">' +
          '<input type="range" ' + common + ' min="' + (f.min || 0) + '" max="' + (f.max || 5) +
            '" step="' + (f.step || 1) + '" value="' + (value || 0) + '" data-range>' +
          '<output for="' + id + '">' + (value || 0) + '</output></div>';
        break;

      case 'checkbox':
        inner = '<label class="check-row"><input type="checkbox" ' + common +
          (value ? ' checked' : '') + '> <span>' + U.escapeHtml(f.checkboxLabel || '') + '</span></label>';
        break;

      case 'tags':
        inner = '<input type="text" class="input" ' + common + ' value="' +
          U.escapeHtml((value || []).join(', ')) + '" placeholder="' +
          U.escapeHtml(f.placeholder || 'Comma separated') + '">';
        break;

      case 'features':
        inner = featuresEditorHtml(f.name, value || []);
        break;

      case 'static':
        inner = f.html || '';
        break;

      default: // text, number, date, time, url
        inner = '<input type="' + (f.type || 'text') + '" class="input" ' + common +
          (f.min !== undefined ? ' min="' + f.min + '"' : '') +
          (f.max !== undefined ? ' max="' + f.max + '"' : '') +
          (f.step !== undefined ? ' step="' + f.step + '"' : '') +
          (f.placeholder ? ' placeholder="' + U.escapeHtml(f.placeholder) + '"' : '') +
          ' value="' + U.escapeHtml(value === undefined || value === null ? '' : value) + '">';
    }

    return '<div class="field ' + (f.full === false ? '' : 'col-full') + '"' +
      (f.type === 'checkbox' ? '' : '') + '>' +
      (f.type === 'checkbox' ? '' : '<label for="' + id + '">' + U.escapeHtml(f.label || '') + '</label>') +
      inner +
      (f.hint ? '<span class="field__hint">' + U.escapeHtml(f.hint) + '</span>' : '') +
      '</div>';
  }

  function featuresEditorHtml(name, features) {
    var rows = features.map(function (f) { return featureRowHtml(f); }).join('');
    return '<div class="flist" data-features="' + name + '">' +
      '<div data-rows>' + rows + '</div>' +
      '<button type="button" class="btn btn--sm" data-add-feature style="align-self:flex-start;margin-top:4px">' +
        App.icons('plus', 13) + ' Add feature</button></div>';
  }

  function featureRowHtml(f) {
    f = f || { id: U.uid('feat'), title: '', done: false };
    return '<div class="flist__row" data-feature-id="' + U.escapeHtml(f.id) + '">' +
      '<input type="checkbox" data-feature-done ' + (f.done ? 'checked' : '') + ' title="Completed">' +
      '<input type="text" class="input" data-feature-title value="' + U.escapeHtml(f.title) + '" placeholder="Feature">' +
      '<button type="button" class="icon-btn icon-btn--bare icon-btn--danger" data-remove-feature title="Remove">' +
        App.icons('x', 14) + '</button></div>';
  }

  /** Pull the values back out of a rendered form. */
  function readValues(form, fields) {
    var out = {};
    fields.forEach(function (f) {
      if (f.type === 'static') return;

      if (f.type === 'features') {
        var rows = form.querySelectorAll('[data-features="' + f.name + '"] .flist__row');
        out[f.name] = Array.prototype.map.call(rows, function (row) {
          return {
            id: row.getAttribute('data-feature-id'),
            title: row.querySelector('[data-feature-title]').value.trim(),
            done: row.querySelector('[data-feature-done]').checked
          };
        }).filter(function (x) { return x.title; });
        return;
      }

      var el = form.elements[f.name];
      if (!el) return;

      if (f.type === 'checkbox') out[f.name] = el.checked;
      else if (f.type === 'number' || f.type === 'range') out[f.name] = Number(el.value) || 0;
      else if (f.type === 'tags') {
        out[f.name] = el.value.split(',').map(function (s) { return s.trim(); })
          .filter(function (s) { return s.length; });
      }
      else out[f.name] = el.value.trim ? el.value.trim() : el.value;
    });
    return out;
  }

  /**
   * formModal({ title, subtitle, fields, values, submitLabel, size,
   *             onSubmit(values, handle), extraFooterHtml, onFooterClick })
   * onSubmit may return false to keep the dialog open.
   */
  var formSeq = 0;

  function formModal(opts) {
    var fields = opts.fields || [];
    var values = opts.values || {};

    // Each dialog gets its own form id: two dialogs can be open at once
    // (e.g. a confirm on top of an edit form) and duplicate ids would make
    // the submit button drive the wrong form.
    formSeq += 1;
    var formId = 'modal-form-' + formSeq;

    var body = '<form id="' + formId + '" novalidate><div class="form-grid">' +
      fields.map(function (f) { return fieldHtml(f, values[f.name]); }).join('') +
      '</div></form>';

    var footer =
      (opts.extraFooterHtml ? '<div class="left">' + opts.extraFooterHtml + '</div>' : '') +
      '<button type="button" class="btn" data-close>Cancel</button>' +
      '<button type="submit" form="' + formId + '" class="btn btn--primary">' +
        U.escapeHtml(opts.submitLabel || 'Save') + '</button>';

    return openModal({
      title: opts.title,
      subtitle: opts.subtitle,
      size: opts.size,
      bodyHtml: body,
      footerHtml: footer,
      onMount: function (handle) {
        var form = handle.root.querySelector('form');

        // Live value display for range inputs.
        form.addEventListener('input', function (e) {
          if (e.target.matches('[data-range]')) {
            var out = form.querySelector('output[for="' + e.target.id + '"]');
            if (out) out.textContent = e.target.value;
          }
        });

        // Feature list add / remove.
        form.addEventListener('click', function (e) {
          var addBtn = e.target.closest('[data-add-feature]');
          if (addBtn) {
            var rows = addBtn.parentElement.querySelector('[data-rows]');
            rows.insertAdjacentHTML('beforeend', featureRowHtml({ id: U.uid('feat'), title: '', done: false }));
            var inputs = rows.querySelectorAll('[data-feature-title]');
            inputs[inputs.length - 1].focus();
            return;
          }
          var rm = e.target.closest('[data-remove-feature]');
          if (rm) rm.closest('.flist__row').remove();
        });

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          var result = readValues(form, fields);
          var keepOpen = opts.onSubmit && opts.onSubmit(result, handle) === false;
          if (!keepOpen) handle.close();
        });

        if (opts.onFooterClick) {
          handle.root.querySelector('.modal__foot')
            .addEventListener('click', function (e) { opts.onFooterClick(e, handle); });
        }

        // Escape hatch for forms that need custom behaviour (e.g. the session
        // form recalculating its duration when the times change).
        if (opts.onFormReady) opts.onFormReady(form, handle);
      }
    });
  }

  /* ============================================================
     Small shared render helpers
     ============================================================ */

  function statusBadge(statusId) {
    var s = App.STATUS_BY_ID[statusId] || App.STATUS_BY_ID['not-started'];
    return '<span class="badge badge--' + s.id + '"><i class="dot"></i>' + s.label + '</span>';
  }

  function statusOptions() {
    return App.STATUSES.map(function (s) { return { value: s.id, label: s.label }; });
  }

  function phaseOptions() {
    return App.ROADMAP.map(function (p) { return { value: p.id, label: p.name }; });
  }

  function topicOptions(includeBlank) {
    var opts = includeBlank ? [{ value: '', label: '— none —' }] : [];
    App.ROADMAP.forEach(function (phase) {
      App.store.topicsByPhase(phase.id).forEach(function (t) {
        opts.push({ value: t.id, label: phase.name + ' › ' + t.name });
      });
    });
    return opts;
  }

  function emptyState(title, message, actionHtml) {
    return '<div class="empty"><h3>' + U.escapeHtml(title) + '</h3><p>' +
      U.escapeHtml(message) + '</p>' + (actionHtml || '') + '</div>';
  }

  return {
    toast: toast, openModal: openModal, confirm: confirm, formModal: formModal,
    statusBadge: statusBadge, statusOptions: statusOptions, phaseOptions: phaseOptions,
    topicOptions: topicOptions, emptyState: emptyState
  };
})();
