/* ============================================================
   js/core/highlight.js
   A small C# tokeniser used to colour code blocks.

   It escapes first and wraps second, so a lesson (or your own code)
   can never inject markup through a code block.
   ============================================================ */
window.App = window.App || {};

App.highlight = (function () {
  'use strict';

  var KEYWORDS = ('abstract as async await base bool break byte case catch char checked class const continue ' +
    'decimal default delegate do double dynamic else enum event explicit extern false finally fixed float for ' +
    'foreach get goto if implicit in init int interface internal is lock long nameof namespace new null object ' +
    'operator out override params private protected public readonly record ref return sbyte sealed set short ' +
    'sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ' +
    'ushort using var virtual void volatile when where while yield').split(' ');

  var esc = function (s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // comments | strings & chars | numbers | keywords | PascalCase identifiers
  var TOKEN = new RegExp(
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +
    '|(@?\\$?"(?:[^"\\\\]|\\\\.|"")*"|\'(?:[^\'\\\\]|\\\\.)\')' +
    '|(\\b\\d[\\d_]*(?:\\.\\d+)?[fFdDmMlLuU]*\\b)' +
    '|\\b(' + KEYWORDS.join('|') + ')\\b' +
    '|\\b([A-Z][A-Za-z0-9_]*)\\b', 'g');

  /** highlight('int x = 1;') -> HTML string with <span class="tok-*"> wrappers. */
  function highlight(code) {
    var src = String(code == null ? '' : code);
    var out = '';
    var last = 0;
    var m;
    TOKEN.lastIndex = 0;

    while ((m = TOKEN.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      if (m[1])      out += '<span class="tok-comment">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="tok-string">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="tok-number">' + esc(m[3]) + '</span>';
      else if (m[4]) out += '<span class="tok-keyword">' + esc(m[4]) + '</span>';
      else if (m[5]) out += '<span class="tok-type">' + esc(m[5]) + '</span>';
      last = m.index + m[0].length;
    }
    out += esc(src.slice(last));
    return out;
  }

  /** A complete, scrollable code block with line numbers. */
  function block(code, options) {
    options = options || {};
    var lines = String(code || '').replace(/\n$/, '').split('\n');
    var gutter = lines.map(function (_, i) { return i + 1; }).join('\n');
    return '<div class="codeblock' + (options.className ? ' ' + options.className : '') + '">' +
      (options.caption ? '<div class="codeblock__cap">' + App.utils.escapeHtml(options.caption) + '</div>' : '') +
      '<div class="codeblock__body">' +
        '<pre class="codeblock__gutter" aria-hidden="true">' + gutter + '</pre>' +
        '<pre class="codeblock__code"><code>' + highlight(code) + '</code></pre>' +
      '</div>' +
      (options.copy === false ? '' :
        '<button type="button" class="codeblock__copy" data-copy-code title="Copy code">' +
          App.icons('check', 13) + ' Copy</button>') +
    '</div>';
  }

  return { highlight: highlight, block: block, escape: esc };
})();
