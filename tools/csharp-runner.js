#!/usr/bin/env node
/* ============================================================
   tools/csharp-runner.js
   OPTIONAL local C# execution service for the learning tracker.

   Start it with:   node tools/csharp-runner.js
   or:              ./start-runner.command

   It listens on 127.0.0.1:5174 and does exactly one thing: takes a C#
   program, compiles it with the .NET SDK already installed on this
   machine, runs it, and returns stdout / stderr / compiler diagnostics.

   The tracker works fine without it - the code editor then falls back to
   static "code checked" validation and says so.

   ------------------------------------------------------------
   SAFETY
   ------------------------------------------------------------
   * Binds to 127.0.0.1 only. Never reachable from the network.
   * Requires the X-Tracker-Runner header, which forces a CORS preflight,
     and only answers preflights from loopback origins - so a random web
     page you visit cannot drive it.
   * Validates the Host header (blocks DNS-rebinding).
   * Never builds a shell command from user input: every child process is
     spawned with an argument array and shell:false.
   * Compiles and runs inside one throwaway temp directory.
   * Hard timeouts on both build and execution; the process tree is killed,
     so an infinite loop cannot hang the service or your machine.
   * One run at a time.
   ============================================================ */
'use strict';

const http = require('http');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.TRACKER_RUNNER_PORT || 5174);

const MAX_CODE_CHARS = 20000;
const BUILD_TIMEOUT_MS = 60000;   // first build pulls in the SDK's targets
const RUN_TIMEOUT_MS = 5000;      // a learner's exercise should never need this long
const MAX_OUTPUT_CHARS = 20000;

const WORK_DIR = path.join(os.tmpdir(), 'csharp-learning-tracker-runner');
const PROJECT_DIR = path.join(WORK_DIR, 'sandbox');
const OUT_DIR = path.join(PROJECT_DIR, 'out');
const PROGRAM_CS = path.join(PROJECT_DIR, 'Program.cs');
const ASSEMBLY = 'UserProgram';

let busy = false;
let dotnetVersion = null;
let targetFramework = 'net8.0';

/* ------------------------------------------------------------
   Setting up the sandbox project
   ------------------------------------------------------------ */

function detectDotnet() {
  const probe = spawnSync('dotnet', ['--version'], { encoding: 'utf8', timeout: 20000 });
  if (probe.error || probe.status !== 0) return null;
  const version = String(probe.stdout || '').trim();
  const major = parseInt(version.split('.')[0], 10);
  if (Number.isFinite(major) && major >= 6) targetFramework = 'net' + major + '.0';
  return version;
}

const CSPROJ = () => `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>${targetFramework}</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <AssemblyName>${ASSEMBLY}</AssemblyName>
    <RootNamespace>${ASSEMBLY}</RootNamespace>
    <InvariantGlobalization>true</InvariantGlobalization>
    <GenerateDocumentationFile>false</GenerateDocumentationFile>
    <SatelliteResourceLanguages>en</SatelliteResourceLanguages>
  </PropertyGroup>
</Project>
`;

function prepareProject() {
  fs.mkdirSync(PROJECT_DIR, { recursive: true });
  fs.writeFileSync(path.join(PROJECT_DIR, ASSEMBLY + '.csproj'), CSPROJ(), 'utf8');
  fs.writeFileSync(PROGRAM_CS, 'Console.WriteLine("runner ready");\n', 'utf8');
}

/** Minimal environment for child processes - no inherited secrets. */
function childEnv() {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    DOTNET_CLI_TELEMETRY_OPTOUT: '1',
    DOTNET_NOLOGO: '1',
    DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '1',
    DOTNET_CLI_UI_LANGUAGE: 'en'
  };
}

/**
 * Spawn a child with a hard timeout. Kills the whole process group on
 * timeout so a runaway loop cannot survive.
 */
function runProcess(command, args, options, timeoutMs) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(command, args, Object.assign({
      cwd: PROJECT_DIR,
      env: childEnv(),
      shell: false,          // never interpret user input as a shell command
      detached: true,        // own process group, so we can kill descendants
      stdio: ['ignore', 'pipe', 'pipe']
    }, options || {}));

    const cap = (chunk, which) => {
      const text = chunk.toString();
      if (which === 'out') {
        if (stdout.length < MAX_OUTPUT_CHARS) stdout += text;
      } else if (stderr.length < MAX_OUTPUT_CHARS) {
        stderr += text;
      }
      if (stdout.length + stderr.length > MAX_OUTPUT_CHARS * 2) killTree();
    };

    child.stdout.on('data', (c) => cap(c, 'out'));
    child.stderr.on('data', (c) => cap(c, 'err'));

    function killTree() {
      try { process.kill(-child.pid, 'SIGKILL'); }
      catch (e) { try { child.kill('SIGKILL'); } catch (e2) { /* gone */ } }
    }

    const timer = setTimeout(() => { timedOut = true; killTree(); }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: String(err.message), timedOut: false, spawnFailed: true });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stdout: stdout.slice(0, MAX_OUTPUT_CHARS),
        stderr: stderr.slice(0, MAX_OUTPUT_CHARS),
        timedOut
      });
    });
  });
}

/* ------------------------------------------------------------
   Compiler diagnostics
   ------------------------------------------------------------ */

/** "…/Program.cs(5,13): error CS0103: The name 'x' …" -> structured. */
function parseDiagnostics(text) {
  const out = [];
  const seen = new Set();
  const re = /(?:^|\n)(?:.*?)Program\.cs\((\d+),(\d+)\):\s+(error|warning)\s+(CS\d+):\s+([^\n\[]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1] + ':' + m[4] + ':' + m[5];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      line: Number(m[1]),
      column: Number(m[2]),
      severity: m[3],
      code: m[4],
      message: m[5].trim()
    });
  }
  return out;
}

/* ------------------------------------------------------------
   Build + run
   ------------------------------------------------------------ */

async function warmUp() {
  prepareProject();
  console.log('  Warming up the sandbox project (first build can take a moment)...');
  const restore = await runProcess('dotnet', ['restore', '--nologo'], {}, BUILD_TIMEOUT_MS);
  if (restore.code !== 0) console.log('  restore warning:', restore.stderr.slice(0, 300));
  const build = await runProcess('dotnet',
    ['build', '--no-restore', '--nologo', '-v', 'q', '-o', OUT_DIR], {}, BUILD_TIMEOUT_MS);
  if (build.code === 0) console.log('  Sandbox ready.');
  else console.log('  Warm-up build failed; runs will still be attempted.\n' + build.stdout.slice(0, 400));
}

async function compileAndRun(code) {
  const started = Date.now();
  fs.writeFileSync(PROGRAM_CS, code, 'utf8');

  const build = await runProcess('dotnet',
    ['build', '--no-restore', '--nologo', '-v', 'q', '-o', OUT_DIR], {}, BUILD_TIMEOUT_MS);

  const diagnostics = parseDiagnostics(build.stdout + '\n' + build.stderr);

  if (build.timedOut) {
    return { ok: false, compiled: false, timedOut: true, stage: 'build',
             stdout: '', stderr: 'The build timed out.', diagnostics,
             durationMs: Date.now() - started };
  }

  if (build.code !== 0) {
    return {
      ok: false, compiled: false, stage: 'build',
      stdout: '', stderr: '',
      diagnostics: diagnostics.length ? diagnostics : [{
        line: 0, column: 0, severity: 'error', code: 'BUILD',
        message: (build.stdout + build.stderr).trim().split('\n').slice(0, 6).join('\n') || 'Build failed.'
      }],
      durationMs: Date.now() - started
    };
  }

  const exec = await runProcess('dotnet', [path.join(OUT_DIR, ASSEMBLY + '.dll')], {}, RUN_TIMEOUT_MS);

  return {
    ok: !exec.timedOut && exec.code === 0,
    compiled: true,
    stage: 'run',
    exitCode: exec.code,
    timedOut: exec.timedOut,
    stdout: exec.stdout,
    stderr: exec.timedOut
      ? 'Execution stopped after ' + (RUN_TIMEOUT_MS / 1000) + ' seconds. Check for an infinite loop.'
      : exec.stderr,
    diagnostics: diagnostics.filter((d) => d.severity === 'warning'),
    durationMs: Date.now() - started
  };
}

/* ------------------------------------------------------------
   HTTP layer
   ------------------------------------------------------------ */

const LOOPBACK_ORIGIN = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;
const LOOPBACK_HOST = /^(127\.0\.0\.1|localhost)(:\d+)?$/;

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && LOOPBACK_ORIGIN.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tracker-Runner');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '600');
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(json);
}

const server = http.createServer((req, res) => {
  // Anti DNS-rebinding: the Host header must be loopback.
  if (!LOOPBACK_HOST.test(String(req.headers.host || ''))) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  // A cross-site page cannot set this header without a preflight we refuse.
  const origin = req.headers.origin;
  if (origin && !LOOPBACK_ORIGIN.test(origin)) {
    res.writeHead(403); res.end('forbidden origin'); return;
  }

  applyCors(req, res);

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, {
      ok: true, service: 'csharp-learning-tracker-runner',
      dotnet: dotnetVersion, targetFramework, busy
    });
  }

  if (req.method === 'POST' && req.url === '/run') {
    if (busy) return send(res, 429, { ok: false, error: 'A program is already running. Try again in a moment.' });

    let body = '';
    let tooBig = false;
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_CODE_CHARS * 2) { tooBig = true; req.destroy(); }
    });
    req.on('end', async () => {
      if (tooBig) return send(res, 413, { ok: false, error: 'Program too large.' });
      let parsed;
      try { parsed = JSON.parse(body); }
      catch (e) { return send(res, 400, { ok: false, error: 'Invalid JSON.' }); }

      const code = String(parsed && parsed.code || '');
      if (!code.trim()) return send(res, 400, { ok: false, error: 'No code supplied.' });
      if (code.length > MAX_CODE_CHARS) return send(res, 413, { ok: false, error: 'Program too large.' });

      busy = true;
      try {
        const result = await compileAndRun(code);
        send(res, 200, result);
      } catch (err) {
        send(res, 500, { ok: false, error: String(err && err.message || err) });
      } finally {
        busy = false;
      }
    });
    return;
  }

  send(res, 404, { ok: false, error: 'Not found.' });
});

/* ------------------------------------------------------------
   Start-up
   ------------------------------------------------------------ */

dotnetVersion = detectDotnet();
if (!dotnetVersion) {
  console.error('\n  No .NET SDK found on this machine (`dotnet --version` failed).');
  console.error('  The tracker still works - the code editor will use static checks instead.\n');
  process.exit(1);
}

console.log('');
console.log('  C# runner for the learning tracker');
console.log('  ----------------------------------');
console.log('  .NET SDK        : ' + dotnetVersion);
console.log('  Target framework: ' + targetFramework);
console.log('  Listening on    : http://' + HOST + ':' + PORT + '  (this machine only)');
console.log('  Sandbox         : ' + PROJECT_DIR);
console.log('');

warmUp().then(() => {
  server.listen(PORT, HOST, () => {
    console.log('  Ready. Leave this window open while you learn. Ctrl+C to stop.');
    console.log('');
  });
});

process.on('SIGINT', () => { console.log('\n  Runner stopped.'); process.exit(0); });
