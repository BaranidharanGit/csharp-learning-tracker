#!/usr/bin/env node
/* Runs every test suite and reports a combined total. */
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const SUITES = ['app.test.js', 'learning.test.js', 'journey.test.js'];
let failed = 0;

for (const suite of SUITES) {
  console.log('\n========================================');
  console.log('  ' + suite);
  console.log('========================================');
  try {
    const out = execFileSync(process.execPath,
      ['--experimental-require-module', path.join(__dirname, suite)],
      { encoding: 'utf8', stdio: 'pipe' });
    process.stdout.write(out);
  } catch (err) {
    if (err.stdout) process.stdout.write(err.stdout);
    if (err.stderr) process.stderr.write(err.stderr);
    failed += 1;
  }
}

console.log('\n========================================');
console.log(failed ? '  ' + failed + ' SUITE(S) FAILED' : '  ALL SUITES PASSED');
console.log('========================================\n');
process.exit(failed ? 1 : 0);
