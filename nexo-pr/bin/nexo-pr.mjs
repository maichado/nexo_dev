#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INSTALL_COMMAND = 'npx -y skills add maichado/nexo_dev --skill nexo --global --copy --yes';
const args = process.argv.slice(2);
const wantsJson = args.includes('--json');
const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, '..');
const home = process.env.HOME || process.env.USERPROFILE || os.homedir();

function isFile(candidate) {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function siblingCandidates() {
  return [path.resolve(skillRoot, '..', 'nexo', 'bin', 'nexo.mjs')];
}

function globalCandidates() {
  return [
    path.join(home, '.agents', 'skills', 'nexo', 'bin', 'nexo.mjs'),
    path.join(home, '.codex', 'skills', 'nexo', 'bin', 'nexo.mjs'),
    path.join(home, '.claude', 'skills', 'nexo', 'bin', 'nexo.mjs'),
    path.join(home, '.cursor', 'skills', 'nexo', 'bin', 'nexo.mjs'),
    path.join(home, '.config', 'devin', 'skills', 'nexo', 'bin', 'nexo.mjs'),
    path.join(home, '.gemini', 'config', 'skills', 'nexo', 'bin', 'nexo.mjs'),
    path.join(home, '.gemini', 'antigravity', 'skills', 'nexo', 'bin', 'nexo.mjs'),
  ];
}

function resolveCore() {
  const explicit = process.env.NEXO_BIN;
  if (explicit && explicit.trim()) {
    const resolved = path.resolve(explicit);
    if (!isFile(resolved)) {
      return {
        error: `NEXO_BIN points to a missing nexo CLI: ${resolved}`,
        searched: [resolved],
      };
    }
    return { core: resolved, searched: [resolved] };
  }
  const searched = [...siblingCandidates(), ...globalCandidates()];
  const core = searched.find(isFile);
  return core ? { core, searched } : { error: null, searched };
}

function missingCore({ error, searched }) {
  const message = error
    ? `${error}. Install the nexo core Skill or point NEXO_BIN at its bin/nexo.mjs.`
    : 'The nexo core Skill was not found. Install it or point NEXO_BIN at its bin/nexo.mjs.';
  const supportedFixes = [
    `install the core Skill: ${INSTALL_COMMAND}`,
    'set NEXO_BIN to the absolute path of nexo/bin/nexo.mjs, then rerun',
  ];
  if (wantsJson) {
    console.log(JSON.stringify({
      schemaVersion: 1,
      ok: false,
      command: 'nexo-pr',
      diagnostics: [{
        code: 'nexo-pr/core-skill-missing',
        severity: 'error',
        message,
        evidence: { searched },
        supportedFixes,
      }],
    }, null, 2));
  } else {
    console.error([
      `nexo-pr: ${message}`,
      '',
      'Install the core Skill:',
      `  ${INSTALL_COMMAND}`,
      '',
      'Or point at an existing checkout or installation:',
      '  NEXO_BIN=/absolute/path/to/nexo/bin/nexo.mjs nexo-pr <command>',
    ].join('\n'));
  }
  process.exitCode = 1;
}

const resolved = resolveCore();
if (!resolved.core) {
  missingCore(resolved);
} else {
  const result = spawnSync(process.execPath, [resolved.core, ...args], { stdio: 'inherit' });
  if (result.error) {
    console.error(`nexo-pr: could not start ${resolved.core}: ${result.error.message}`);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
}
