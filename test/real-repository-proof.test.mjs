import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyRepositoryEvidence } from '../nexo/renderers/shared/repository-evidence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', 'nexo');
const repoRoot = path.resolve(skillRoot, '..');
const sourcePath = path.join(repoRoot, 'docs', 'cases', 'mco-runtime.architecture.json');
const artifactPath = path.join(repoRoot, 'docs', 'cases', 'mco-runtime.architecture.html');
const shareCardPath = path.join(repoRoot, 'docs', 'assets', 'mco-runtime-share-card.png');
const experimentSourcePath = path.join(repoRoot, 'experiments', 'mco-showcase', 'mco-runtime.architecture.json');
const experimentArtifactPath = path.join(repoRoot, 'experiments', 'mco-showcase', 'mco-runtime.html');
const cli = path.join(skillRoot, 'bin', 'nexo.mjs');
const pinnedSource = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const pinnedRepository = pinnedSource.meta.repository;

function evidencePayload(html) {
  const match = html.match(/<script id="nexo-source-evidence-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'checked-in MCO proof is missing verified repository evidence');
  return JSON.parse(match[1]);
}

function connectionLabelGeometry(html) {
  return Object.fromEntries([...html.matchAll(
    /<g data-detail="context"[^>]*data-edge-id="([^"]+)"[^>]*>[\s\S]*?<text x="([^"]+)" y="([^"]+)"/g,
  )].map((match) => [match[1], { x: Number(match[2]), y: Number(match[3]) }]));
}

function automaticMcoRoot() {
  const candidate = path.resolve(repoRoot, '..', 'mco');
  if (!fs.existsSync(path.join(candidate, '.git'))) return null;
  try {
    verifyRepositoryEvidence('architecture', pinnedSource, candidate);
    return candidate;
  } catch {
    return null;
  }
}

const pinnedMcoRoot = process.env.NEXO_MCO_REPO_ROOT
  ? path.resolve(process.env.NEXO_MCO_REPO_ROOT)
  : automaticMcoRoot();

test('checked-in MCO artifacts are byte-reproducible from the pinned repository revision', {
  skip: pinnedMcoRoot
    ? false
    : `Set NEXO_MCO_REPO_ROOT to a matching ${pinnedRepository.url} clone containing revision ${pinnedRepository.revision.slice(0, 7)}.`,
}, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nexo-mco-byte-reproduction-'));
  try {
    const experimentOutput = path.join(tmp, 'mco-runtime.experiment.html');
    const experiment = spawnSync(process.execPath, [
      cli,
      'render',
      'architecture',
      experimentSourcePath,
      experimentOutput,
      '--quality',
      'showcase',
      '--repo-root',
      pinnedMcoRoot,
    ], { encoding: 'utf8' });
    assert.equal(experiment.status, 0, `${experiment.stdout}\n${experiment.stderr}`);
    assert.equal(
      fs.readFileSync(experimentOutput, 'utf8'),
      fs.readFileSync(experimentArtifactPath, 'utf8'),
      'checked-in MCO showcase drifted from its typed source and verified repository',
    );

    const caseOutput = path.join(tmp, 'mco-runtime.case.html');
    const delivered = spawnSync(process.execPath, [
      cli,
      'deliver',
      'architecture',
      sourcePath,
      caseOutput,
      '--quality',
      'showcase',
      '--repo-root',
      pinnedMcoRoot,
      '--json',
    ], { encoding: 'utf8' });
    assert.equal(delivered.status, 0, `${delivered.stdout}\n${delivered.stderr}`);
    assert.equal(JSON.parse(delivered.stdout).ok, true);
    assert.equal(
      fs.readFileSync(caseOutput, 'utf8'),
      fs.readFileSync(artifactPath, 'utf8'),
      'checked-in MCO case drifted from its typed source and verified repository',
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
