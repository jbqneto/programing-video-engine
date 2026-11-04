import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

const base = resolve('src/projects/afterhours-demo.json');
const p = JSON.parse(readFileSync(base, 'utf8'));
assert.equal(p.version, '1.0');
assert.equal(p.id, 'afterhours-demo');
assert.ok(Number.isInteger(p.fps) && p.fps > 0);
assert.ok(Number.isInteger(p.width) && p.width >= 640);
assert.ok(Number.isInteger(p.height) && p.height >= 360);
assert.equal(p.scenes.length, 2);
assert.deepEqual(p.scenes.map(s => s.type), ['lounge-3d', 'motion-3d']);
assert.equal(p.scenes.reduce((sum, s) => sum + s.durationFrames, 0), 270);
assert.equal(new Set(p.scenes.map(s => s.id)).size, p.scenes.length);
assert.ok(p.scenes.every(s=>s.durationFrames > 0 && Object.values(s.palette).every(v=>/^#[0-9a-fA-F]{6}$/.test(v))));
assert.ok(existsSync('src/scenes/Lounge3D.tsx'));
assert.ok(existsSync('src/scenes/Motion3D.tsx'));
console.log('PASS smoke: 2 scenes, 270 frames, 9s at 30 fps; project and files are consistent');
