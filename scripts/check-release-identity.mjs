#!/usr/bin/env node
// Verifies that every place advertising the Nexo version agrees with nexo/package.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootFlag = process.argv.indexOf('--root');
const repoRoot = rootFlag === -1 ? scriptRoot : path.resolve(process.argv[rootFlag + 1] || '');
const failures = [];
const fail = (message) => failures.push(message);

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    fail(`${relativePath} is missing or unreadable.`);
    return '';
  }
}

const version = JSON.parse(read('nexo/package.json') || '{}').version;
if (!/^\d+\.\d+\.\d+$/.test(version || '')) fail(`nexo/package.json version is not stable SemVer: ${version}.`);
const majorMinor = version?.split('.').slice(0, 2).join('.');

const release = JSON.parse(read('nexo/skill-release.json') || '{}');
if (release.version !== version) fail(`nexo/skill-release.json says ${release.version}, expected ${version}.`);

const lock = JSON.parse(read('nexo/package-lock.json') || '{}');
if (lock.version !== version || lock.packages?.['']?.version !== version) fail(`nexo/package-lock.json does not match ${version}.`);

for (const skill of ['nexo/SKILL.md', 'nexo-pr/SKILL.md']) {
  const found = read(skill).match(/^\s*version:\s*"([^"]+)"/m)?.[1];
  if (found !== majorMinor) fail(`${skill} metadata version is ${found}, expected ${majorMinor}.`);
}

for (const template of ['nexo/assets/template.html', 'viewer/template.source.html']) {
  if (!read(template).includes(`<meta name="generator" content="nexo ${version}">`)) {
    fail(`${template} generator meta does not name nexo ${version}.`);
  }
}

for (const llms of ['llms.txt', 'docs/llms.txt']) {
  if (!new RegExp(`^Version: ${version.replace(/\./g, '\\.')}$`, 'm').test(read(llms))) fail(`${llms} does not declare Version: ${version}.`);
}

const readmeBadges = [...read('README.md').matchAll(/img\.shields\.io\/badge\/version-([0-9.]+)-/g)].map((m) => m[1]);
if (readmeBadges.length === 0 || readmeBadges.some((v) => v !== version)) fail(`README.md version badge does not say ${version}.`);

const changelogTop = read('CHANGELOG.md').match(/^## (\d+\.\d+\.\d+)/m)?.[1];
if (changelogTop !== version) fail(`CHANGELOG.md newest entry is ${changelogTop}, expected ${version}.`);

for (const page of ['docs/index.html', 'docs/start.html', 'docs/gallery.html', 'docs/guide.html']) {
  const labels = [...read(page).matchAll(/\bv\d+\.\d+\.\d+\b/g)].map((m) => m[0]);
  if (labels.some((label) => label !== `v${version}`)) fail(`${page} shows ${[...new Set(labels)].join(', ')} instead of v${version}.`);
}

if (failures.length) {
  console.error(`Release identity check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`release identity ok: ${version}`);
