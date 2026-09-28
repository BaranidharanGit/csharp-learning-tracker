/* ============================================================
   js/core/charts.js
   Hand-rolled SVG / CSS charts. No chart library, no downloads -
   every function returns an HTML string you can drop into a card.
   ============================================================ */
window.App = window.App || {};

App.charts = (function () {
  'use strict';

  var U = App.utils;

  /* ---------- Donut (used for overall progress) ---------- */

  function donut(opts) {
    var percent = U.clamp(Math.round(opts.percent || 0), 0, 100);
    var size = opts.size || 148;
    var stroke = opts.stroke || 13;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var dash = (percent / 100) * c;
    var color = opts.color || 'var(--accent)';

    return '' +
      '<svg class="chart" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="' + percent + ' percent complete">' +
        '<circle class="donut__track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" ' +
          'stroke="' + color + '" stroke-width="' + stroke + '" stroke-linecap="round" ' +
          'stroke-dasharray="' + dash.toFixed(2) + ' ' + (c - dash).toFixed(2) + '" ' +
          'transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
        '<text class="donut__value" x="50%" y="48%" text-anchor="middle" font-size="' + Math.round(size * 0.25) + '">' + percent + '%</text>' +
        (opts.label
          ? '<text class="donut__label" x="50%" y="64%" text-anchor="middle" font-size="' + Math.round(size * 0.088) + '">' + U.escapeHtml(opts.label) + '</text>'
          : '') +
      '</svg>';
  }

  /* ---------- Vertical bar chart (weekly hours, daily minutes) ---------- */

  function barChart(opts) {
    var data = opts.data || [];
    if (!data.length) return emptyChart('No data yet');

    var W = 760;
    var H = opts.height || 190;
    var padL = 40, padR = 10, padT = 16, padB = 26;
    var chartW = W - padL - padR;
    var chartH = H - padT - padB;

    var max = data.reduce(function (m, d) { return Math.max(m, d.value || 0); }, 0);
    if (max <= 0) max = 1;
    // Round the axis up to something readable.
    var niceMax = niceCeil(max);

    var slot = chartW / data.length;
    var barW = Math.max(3, Math.min(opts.maxBarWidth || 44, slot * 0.68));
    var fmt = opts.format || function (v) { return String(v); };

    var parts = [];

    // Horizontal grid lines + y labels at 0, half, max
    [0, 0.5, 1].forEach(function (f) {
      var y = padT + chartH - (chartH * f);
      parts.push('<line class="grid-line" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '"/>');
      parts.push('<text x="' + (padL - 7) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="10">' + fmt(niceMax * f) + '</text>');
    });

    // Label density: keep the axis readable when there are many bars.
    var labelEvery = data.length <= 12 ? 1 : Math.ceil(data.length / 10);

    data.forEach(function (d, i) {
      var v = Math.max(0, d.value || 0);
      var h = (v / niceMax) * chartH;
      var x = padL + slot * i + (slot - barW) / 2;
      var y = padT + chartH - h;
      var isLast = i === data.length - 1;
      var fill = d.color || (opts.highlightLast && isLast ? 'var(--accent)' : (opts.color || 'var(--accent)'));
      var opacity = opts.highlightLast && !isLast ? '0.55' : '1';

      parts.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) +
        '" height="' + Math.max(v > 0 ? 2 : 0, h).toFixed(1) + '" rx="3" fill="' + fill + '" opacity="' + opacity + '">' +
        '<title>' + U.escapeHtml(d.label + ': ' + fmt(v)) + '</title></rect>');

      if (i % labelEvery === 0 || isLast) {
        parts.push('<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10">' +
          U.escapeHtml(d.label) + '</text>');
      }
      // Value on top of the bar when there is room.
      if (opts.showValues && v > 0 && data.length <= 12) {
        parts.push('<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (y - 4).toFixed(1) +
          '" text-anchor="middle" font-size="10" fill="var(--text-muted)">' + U.escapeHtml(fmt(v)) + '</text>');
      }
    });

    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img">' +
      parts.join('') + '</svg>';
  }

  /** 0.4 -> 0.5, 7 -> 8, 23 -> 25 ... keeps the y-axis tidy. */
  function niceCeil(n) {
    if (n <= 1) return 1;
    var mag = Math.pow(10, Math.floor(Math.log10(n)));
    var norm = n / mag;
    var step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    return step * mag;
  }

  function emptyChart(message) {
    return '<div class="empty" style="padding:26px"><p style="margin:0">' + U.escapeHtml(message) + '</p></div>';
  }

  /* ---------- Segmented bar (status distribution) ---------- */

  function segmentedBar(segments, opts) {
    var total = U.sum(segments.map(function (s) { return s.value; }));
    if (!total) return '<div class="bar bar--lg"></div>';
    var html = segments.map(function (s) {
      var pct = (s.value / total) * 100;
      if (pct <= 0) return '';
      return '<i style="width:' + pct.toFixed(2) + '%;background:' + s.color + '" title="' +
        U.escapeHtml(s.label + ': ' + s.value) + '"></i>';
    }).join('');
    return '<div class="bar bar--lg bar--seg' + (opts && opts.className ? ' ' + opts.className : '') + '">' + html + '</div>';
  }

  function legend(items) {
    return '<div class="legend">' + items.map(function (i) {
      return '<span><i style="background:' + i.color + '"></i>' + U.escapeHtml(i.label) +
        (i.value !== undefined ? ' <b class="tnum">' + i.value + '</b>' : '') + '</span>';
    }).join('') + '</div>';
  }

  /* ---------- Simple horizontal bar (phase progress lists) ---------- */

  function progressBar(percent, color, large) {
    return '<div class="bar' + (large ? ' bar--lg' : '') + '"><i style="width:' +
      U.clamp(percent, 0, 100) + '%;background:' + (color || 'var(--accent)') + '"></i></div>';
  }

  /* ---------- Activity heatmap (GitHub-style) ---------- */

  /**
   * days: [{ date, minutes }] oldest-first, ideally a whole number of weeks.
   * Columns are weeks, rows are Mon..Sun.
   */
  function heatmap(days) {
    if (!days.length) return emptyChart('No sessions logged yet');

    // Pad the start so the first column begins on a Monday.
    var first = days[0].date;
    var offset = (U.parseISO(first).getDay() + 6) % 7;
    var padded = [];
    for (var i = 0; i < offset; i++) padded.push(null);
    padded = padded.concat(days);

    var cols = [];
    for (var c = 0; c < padded.length; c += 7) cols.push(padded.slice(c, c + 7));

    var html = cols.map(function (week) {
      return '<div class="heat__col">' + week.map(function (d) {
        if (!d) return '<div class="heat__cell" style="visibility:hidden"></div>';
        return '<div class="heat__cell ' + heatLevel(d.minutes) + '" title="' +
          U.escapeHtml(U.fmtDate(d.date) + ' — ' + (d.minutes ? U.fmtDuration(d.minutes) : 'no session')) + '"></div>';
      }).join('') + '</div>';
    }).join('');

    return '<div class="heat">' + html + '</div>';
  }

  function heatLevel(minutes) {
    if (!minutes) return '';
    if (minutes < 30) return 'l1';
    if (minutes < 60) return 'l2';
    if (minutes < 120) return 'l3';
    return 'l4';
  }

  /* ---------- Score pips (0-5) ---------- */

  function pips(score, tone) {
    var cls = 'pips' + (tone ? ' pips--' + tone : '');
    var out = '';
    for (var i = 1; i <= 5; i++) out += '<i class="' + (i <= score ? 'on' : '') + '"></i>';
    return '<span class="' + cls + '" title="' + score + ' / 5">' + out + '</span>';
  }

  /** Colour tone for a 0-5 score, used to make weak areas obvious. */
  function scoreTone(score) {
    if (score >= 4) return 'ok';
    if (score >= 2.5) return null;      // default accent
    if (score >= 1) return 'warn';
    return 'danger';
  }

  return {
    donut: donut, barChart: barChart, segmentedBar: segmentedBar, legend: legend,
    progressBar: progressBar, heatmap: heatmap, pips: pips, scoreTone: scoreTone,
    emptyChart: emptyChart
  };
})();
