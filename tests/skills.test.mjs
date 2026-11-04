import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('vendored agent skills are complete, properly named and attributed', () => {
  const r = spawnSync(process.execPath, ['scripts/skills.mjs', 'check'], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /PASS 7 vendored Scenario skills/);
});

test('agent skill catalog exposes the chosen domain skills', () => {
  const r = spawnSync(process.execPath, ['scripts/skills.mjs', 'list'], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /scenario-motion-loops/);
  assert.match(r.stdout, /scenario-blender-export/);
});

test('agent skill reader rejects unknown names', () => {
  const r = spawnSync(process.execPath, ['scripts/skills.mjs', 'show', '../AGENTS.md'], {encoding: 'utf8'});
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Unknown skill/);
});
