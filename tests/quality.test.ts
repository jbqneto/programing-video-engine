import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateLoopMetrics, contactSheetFrames, meanRgbDifference, safeRelativeName} from '../scripts/quality/core';

test('perfect static and looping samples have zero seam difference', () => {
  const frame = new Uint8Array([40, 60, 80, 40, 60, 80]);
  const report = calculateLoopMetrics(frame, frame, frame, frame);
  assert.equal(report.passed, true);
  assert.equal(report.seamDifference, 0);
});

test('abrupt discontinuity fails the seam metric', () => {
  const black = new Uint8Array(360);
  const white = new Uint8Array(360).fill(255);
  const report = calculateLoopMetrics(black, black, white, white);
  assert.equal(report.passed, false);
  assert.equal(report.seamDifference, 255);
});

test('small regular movement near the seam is tolerated', () => {
  const value = (n: number) => new Uint8Array(360).fill(n);
  const report = calculateLoopMetrics(value(0), value(3), value(4), value(2));
  assert.equal(report.passed, true);
  assert.ok(report.seamDifference > 0);
});

test('mean difference checks size and empty arrays', () => {
  assert.throws(() => meanRgbDifference(new Uint8Array(2), new Uint8Array(3)));
  assert.throws(() => meanRgbDifference(new Uint8Array(), new Uint8Array()));
  assert.equal(meanRgbDifference(new Uint8Array([0, 255]), new Uint8Array([255, 0])), 255);
});

test('contact sheet samples include exact first and last frames', () => {
  assert.deepEqual(contactSheetFrames(270, 5), [0, 67, 135, 202, 269]);
  assert.throws(() => contactSheetFrames(3, 9));
  assert.throws(() => contactSheetFrames(100, 25));
});

test('QA input and output paths reject traversal, absolute paths and unsupported extensions', () => {
  const mp4 = /\.(mp4|webm|mov)$/i;
  assert.equal(safeRelativeName('shots/clip.mp4', mp4), 'shots/clip.mp4');
  for (const attempt of ['../private.mp4', '/tmp/clip.mp4', 'a//b.mp4', 'a\\b.mp4', 'a/file.json', 'https://host/file.mp4']) {
    assert.throws(() => safeRelativeName(attempt, mp4), attempt);
  }
});
