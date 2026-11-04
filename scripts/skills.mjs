#!/usr/bin/env node
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, join} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalogPath = resolve(root, '.agents/skills/catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const skillsRoot = resolve(root, '.agents/skills');

function catalogSkills() {
  assert.equal(catalog.schemaVersion, 1);
  assert.match(catalog.upstreamCommit, /^[a-f0-9]{40}$/);
  assert.equal(catalog.license, 'MIT');
  assert.ok(Array.isArray(catalog.skills) && catalog.skills.length > 0);
  return catalog.skills;
}

function check() {
  const skills = catalogSkills();
  const ids = new Set();
  for (const skill of skills) {
    assert.match(skill.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!ids.has(skill.id), 'Duplicate skill ' + skill.id);
    ids.add(skill.id);
    const directory = join(skillsRoot, skill.id);
    const instructions = join(directory, 'SKILL.md');
    assert.ok(existsSync(instructions), 'Missing skill instructions: ' + skill.id);
    const markdown = readFileSync(instructions, 'utf8');
    assert.match(markdown, /^---\r?\n/);
    assert.ok(markdown.split(/\r?\n/).includes('name: ' + skill.id), 'Skill name mismatch: ' + skill.id);
    assert.ok(markdown.split(/\r?\n/).includes('license: MIT'), 'MIT license missing in: ' + skill.id);
    assert.ok(skill.skillFile === '.agents/skills/' + skill.id + '/SKILL.md');
    assert.ok(skill.upstreamUrl.includes(catalog.upstreamCommit));
    assert.match(skill.localEntry, /^[a-z0-9_./-]+$/i);
    assert.ok(!skill.localEntry.split('/').includes('..'));
    assert.ok(existsSync(join(directory, skill.localEntry)), 'Missing local tool: ' + skill.id + '/' + skill.localEntry);
  }
  assert.ok(existsSync(join(skillsRoot, 'SCENARIO-LICENSE.txt')));
  assert.ok(readFileSync(join(skillsRoot, 'SCENARIO-LICENSE.txt'), 'utf8').includes('MIT License'));
  assert.ok(existsSync(join(skillsRoot, 'pve-cinematic-agent', 'SKILL.md')));
  assert.ok(readFileSync(resolve(root, 'README.md'), 'utf8').includes('https://github.com/scenario-labs/skills'));
  console.log('PASS ' + skills.length + ' vendored Scenario skills, local scripts, license and README provenance');
}

const [action = 'list', arg] = process.argv.slice(2);
if (action === 'check') {
  check();
} else if (action === 'list') {
  const skills = catalogSkills();
  for (const s of skills) console.log(s.id + ' — ' + s.description);
} else if (action === 'show') {
  const skill = catalogSkills().find(s => s.id === arg);
  if (!skill) throw new Error('Unknown skill: ' + String(arg) + '. Run "npm run skills -- list".');
  process.stdout.write(readFileSync(join(skillsRoot, skill.id, 'SKILL.md'), 'utf8'));
} else {
  throw new Error('Usage: npm run skills -- [list|show <id>|check]');
}
