import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', 'nexo');
const repoRoot = path.resolve(skillRoot, '..');
const cursorCommand = 'npx -y skills@latest add https://nexo.dev --skill nexo --agent cursor --global --copy --yes';

test('the zero-dependency archive works from the canonical Cursor-visible agent path', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nexo-cursor-package-'));
  const agentSkills = path.join(tmp, '.agents', 'skills');
  try {
    fs.mkdirSync(agentSkills, { recursive: true });
    execFileSync('unzip', ['-q', path.join(repoRoot, 'nexo.zip'), '-d', agentSkills]);
    const installed = path.join(agentSkills, 'nexo');
    const cli = path.join(installed, 'bin', 'nexo.mjs');
    const doctor = execFileSync(process.execPath, [cli, 'doctor'], { encoding: 'utf8' });
    assert.match(doctor, /Nexo is ready\./);

    const fixtures = {
      architecture: 'web-app.architecture.json',
      workflow: 'agent-tool-call.workflow.json',
      sequence: 'cache-miss-request.sequence.json',
      dataflow: 'product-analytics.dataflow.json',
      lifecycle: 'agent-run.lifecycle.json',
    };
    for (const [type, fixture] of Object.entries(fixtures)) {
      const output = execFileSync(process.execPath, [
        cli,
        'validate',
        type,
        path.join(installed, 'examples', fixture),
        '--json',
      ], { encoding: 'utf8' });
      const receipt = JSON.parse(output);
      assert.equal(receipt.ok, true, `${type}: installed package validation failed`);
      assert.equal(receipt.type, type);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
