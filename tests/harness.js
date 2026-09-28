/* Boots the tracker inside jsdom so we can exercise it like a browser. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const APP = path.join(__dirname, '..');

function boot() {
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const { window } = dom;

  // jsdom has no matchMedia / scrollIntoView / clipboard; stub what the app touches.
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.URL.createObjectURL = () => 'blob:stub';
  window.URL.revokeObjectURL = () => {};

  const errors = [];
  window.addEventListener('error', e => errors.push('window error: ' + e.message));

  // Load the scripts in the order index.html declares them.
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  for (const src of srcs) {
    const code = fs.readFileSync(path.join(APP, src), 'utf8');
    try {
      window.eval(code);
    } catch (err) {
      throw new Error(`Failed loading ${src}: ${err.stack}`);
    }
  }
  // jsdom may still report readyState 'loading'; app.js defers boot to
  // DOMContentLoaded in that case, so fire it now to keep the test synchronous.
  if (window.document.readyState === 'loading') {
    window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  }

  return { dom, window, errors, scriptCount: srcs.length };
}

module.exports = { boot, APP };
