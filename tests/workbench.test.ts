import test from 'node:test';
import assert from 'node:assert/strict';
import {imageAssetSchema, projectSchema, projectFrames} from '../src/lib/schema';
import {buildPresetScene, findPreset, PRESET_CATALOG} from '../src/presets/registry';
import demo from '../src/projects/afterhours-demo.json';

test('preset exposes discoverable image inputs and fixed effects', () => {
  const preset = findPreset('fade-in-entrance');
  assert.ok(preset);
  assert.deepEqual(preset.inputs.map(input => input.name), ['imageA', 'imageB']);
  assert.equal(preset.version, '1.0.0');
  assert.equal(preset.effects.incomingBlurPx, 12);
  assert.equal(PRESET_CATALOG.length, 1);
});

test('build preset scene without modifying the source project', () => {
  const project = projectSchema.parse(demo);
  const originalFrames = projectFrames(project);
  const scene = buildPresetScene(project, {presetId:'fade-in-entrance', imageA:'demo/frame-a.svg', imageB:'demo/frame-b.svg'});
  assert.equal(scene.durationFrames, 90);
  assert.equal(scene.type, 'image-transition');
  assert.equal(projectFrames(project), originalFrames);
  const updated = projectSchema.parse({...project, scenes:[...project.scenes, scene]});
  assert.equal(projectFrames(updated), originalFrames + 90);
});

test('image input rejects absolute URLs and path traversal', () => {
  for (const value of ['https://example.com/x.png', '../private.png', '/etc/hosts.png', 'demo/../secret.jpg', 'demo//frame.jpg']) {
    assert.equal(imageAssetSchema.safeParse(value).success, false, value);
  }
  assert.equal(imageAssetSchema.safeParse('demo/frame-a.svg').success, true);
});

test('scene ID conflicts and invalid durations are rejected', () => {
  const project = projectSchema.parse(demo);
  assert.throws(() => buildPresetScene(project, {presetId:'fade-in-entrance', imageA:'demo/frame-a.svg', imageB:'demo/frame-b.svg',
    sceneId: project.scenes[0].id}));
  assert.throws(() => buildPresetScene(project, {presetId:'fade-in-entrance', imageA:'demo/frame-a.svg', imageB:'demo/frame-b.svg',
    durationFrames: 5}));
});
