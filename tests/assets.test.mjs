import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAssetId, normalizePolyHavenAssets, normalizeAmbientCgAssets,
  flattenPolyHavenFiles, choosePolyHavenFile, downloadPolyHavenFile
} from '../scripts/assets.mjs';

test('asset identifiers reject path traversal', () => {
  assert.equal(validateAssetId('ArmChair_01'), 'ArmChair_01');
  assert.throws(() => validateAssetId('../secret'));
  assert.throws(() => validateAssetId('a/b'));
});

test('Poly Haven search normalizes and filters keywords', () => {
  const data = {
    armchair: {name: 'Vintage Armchair', tags: ['wood', 'lounge'], type: 2, category: 'furniture'},
    concrete: {name: 'Concrete Ground', tags: ['street'], type: 1}
  };
  const assets = normalizePolyHavenAssets(data, 'vintage wood');
  assert.equal(assets.length, 1);
  assert.equal(assets[0].id, 'armchair');
  assert.equal(assets[0].license, 'CC0-1.0');
});

test('ambientCG v3 asset collection is normalized', () => {
  assert.deepEqual(normalizeAmbientCgAssets({assets: [{id: 'Wood096', title: 'Wood'}]})[0], {
    id: 'Wood096', title: 'Wood', type: null,
    sourceUrl: 'https://ambientcg.com/view?id=Wood096', license: 'CC0-1.0'
  });
});

test('nested Poly Haven variant records flatten correctly', () => {
  const data = {gltf: {'1k': {glb: {url: 'https://dl.polyhaven.org/sample_1k.glb', size: 120, md5: 'abc'}}},
    hdri: {'2k': {hdr: {url: 'https://dl.polyhaven.org/sample_2k.hdr', size: 80}}}};
  const files = flattenPolyHavenFiles(data);
  assert.equal(files.length, 2);
  assert.equal(choosePolyHavenFile(files, {format: 'glb', resolution: '1k'}).path, 'gltf/1k/glb');
  assert.throws(() => choosePolyHavenFile(files, {format: 'zip'}));
});

test('download refuses off-domain URLs before creating files', async () => {
  await assert.rejects(
    downloadPolyHavenFile('safe-id', {url: 'https://example.com/malware.glb'}),
    /non-Poly Haven host/
  );
});
