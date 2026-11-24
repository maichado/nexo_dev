import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const paste = 'Install Nexo for me by reading https://raw.githubusercontent.com/maichado/nexo_dev/main/llms.txt';
const cursorCommand = 'npx -y skills@latest add https://nexo.dev --skill nexo --agent cursor --global --copy --yes';
const discovery = 'npx -y skills@latest add https://nexo.dev --list --full-depth';
const doctor = 'node <installed-path>/bin/nexo.mjs doctor';

const readmes = [
  ['README.md', '## Quick start', '### 1. Install', 'Thanks to everyone who helped build Nexo'],
  ['README_EN.md', '## Quick start', '### 1. Install', 'Thanks to everyone who helped build Nexo'],
  ['README_ZH.md', '## 快速开始', '### 1. 安装', '感谢每一位参与构建 Nexo 的人'],
  ['README_JA.md', '## クイックスタート', '### 1. インストール', 'Nexo の開発を支えてくれたすべての人に感謝します'],
  ['README_KO.md', '## 빠른 시작', '### 1. 설치', 'Nexo를 함께 만들어 준 모든 분께 감사합니다'],
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function switcherAgents() {
  const start = read('docs/start.html');
  const known = start.match(/KNOWN_AGENTS = new Set\(\[([^\]]+)\]\)/);
  assert.ok(known, 'start page must name its switcher agents');
  return [...known[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

function withoutDetails(markdown) {
  return markdown.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, '');
}

test('llms.txt states the package version and the bounded install', () => {
  const version = JSON.parse(read('nexo/package.json')).version;
  const root = read('llms.txt');
  const site = read('docs/llms.txt');
  assert.equal(site, root);
  assert.match(root, new RegExp(`^Version: ${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  assert.match(root, /https:\/\/github\.com\/maichado\/nexo_dev/);
  assert.match(root, /https:\/\/nexo\.dev/);
  assert.match(root, /confirm the scope before you install/i);
  assert.match(root, /exactly one skill named `nexo`/);
  assert.match(root, new RegExp(discovery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(root, /--skill nexo --agent <agent> --global --copy --yes/);
  assert.match(root, /unmanaged files/);
  assert.match(root, /Before either install command, inspect every selected agent destination/);
  assert.match(root, /stop and report the conflict before running the installer/);
  assert.match(root, new RegExp(doctor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(root, /ten diagram types/i);
  assert.match(root, /one-page explainer/i);
  for (const agent of switcherAgents()) assert.match(root, new RegExp(`\\b${agent}\\b`));
  assert.ok(root.length < 4000, 'llms.txt should stay a bounded agent brief');
});
