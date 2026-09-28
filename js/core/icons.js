/* ============================================================
   js/core/icons.js
   Inline stroke icons (Feather-style). Inline so the app makes
   zero network requests and works offline / from file://.
   ============================================================ */
window.App = window.App || {};

App.icons = (function () {
  'use strict';

  var PATHS = {
    dashboard:  '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    roadmap:    '<path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3z"/><path d="M8 3v15M16 6v15"/>',
    topics:     '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
    sessions:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    reviews:    '<path d="M22 4v6h-6"/><path d="M2 20v-6h6"/><path d="M4.2 9a8 8 0 0113.3-3L22 10"/><path d="M2 14l4.5 4a8 8 0 0013.3-3"/>',
    challenges: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
    projects:   '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',
    statistics: '<path d="M18 20V9M12 20V4M6 20v-7"/>',
    settings:   '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    plus:       '<path d="M12 5v14M5 12h14"/>',
    edit:       '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash:      '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>',
    play:       '<path d="M6 4l14 8-14 8z"/>',
    stop:       '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    search:     '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    sun:        '<circle cx="12" cy="12" r="4"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    moon:       '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
    menu:       '<path d="M3 12h18M3 6h18M3 18h18"/>',
    download:   '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    upload:     '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    check:      '<path d="M20 6L9 17l-5-5"/>',
    x:          '<path d="M18 6L6 18M6 6l12 12"/>',
    chevron:    '<path d="M6 9l6 6 6-6"/>',
    external:   '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
    flame:      '<path d="M13 2L4 14h7l-1 8 10-13h-8l1-7z"/>',
    book:       '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
    award:      '<circle cx="12" cy="8" r="6"/><path d="M8.2 13.9L7 23l5-3 5 3-1.2-9.1"/>',
    alert:      '<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    calendar:   '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    target:     '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
    refresh:    '<path d="M22 4v6h-6"/><path d="M2 20v-6h6"/><path d="M4.2 9a8 8 0 0113.3-3L22 10"/><path d="M2 14l4.5 4a8 8 0 0013.3-3"/>',
    pin:        '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    trending:   '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
    info:       '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'
  };

  /** icon('plus', 16) -> '<svg ...>...</svg>' */
  function icon(name, size) {
    var body = PATHS[name] || PATHS.info;
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  icon.has = function (name) { return !!PATHS[name]; };
  return icon;
})();
