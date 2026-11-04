import {createHash, randomUUID} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, relative, resolve, isAbsolute} from 'node:path';
import {imageAssetSchema, projectFrames, projectSchema, type VideoProject} from '../../src/lib/schema';
import {buildPresetScene, type PresetId} from '../../src/presets/registry';

export const WORKBENCH_PROJECT = resolve('out/workbench-project.json');
export const PREVIEW_STATE = resolve('out/workbench-preview-state.json');
const EXAMPLE_PROJECT = resolve('src/projects/afterhours-demo.json');
const MAX_BYTES = 2_000_000;

function atomicWrite(path: string, content: string) {
  mkdirSync(dirname(path), {recursive: true});
  const partial = path + '.' + process.pid + '.' + randomUUID() + '.tmp';
  try {
    writeFileSync(partial, content, {flag: 'wx'});
    renameSync(partial, path);
  } catch (error) {
    try { requireCleanup(partial); } catch {}
    throw error;
  }
}

function requireCleanup(path: string) {
  // Avoid importing additional filesystem primitives into the runtime's happy path.
  rmSync(path, {force: true});
}

function initializeProject() {
  mkdirSync(dirname(WORKBENCH_PROJECT), {recursive: true});
  if (!existsSync(WORKBENCH_PROJECT)) copyFileSync(EXAMPLE_PROJECT, WORKBENCH_PROJECT);
}
export function readProject() {
  initializeProject();
  const raw = readFileSync(WORKBENCH_PROJECT, 'utf8');
  if (Buffer.byteLength(raw) > MAX_BYTES) throw new Error('Project file exceeds 2 MB limit.');
  const project = projectSchema.parse(JSON.parse(raw));
  return {project, revision: createHash('sha256').update(raw).digest('hex'), path: WORKBENCH_PROJECT,
    frames: projectFrames(project), durationSeconds: projectFrames(project) / project.fps};
}
export function assertImageAsset(relativePath: string) {
  const checked = imageAssetSchema.parse(relativePath);
  const root = realpathSync(resolve('public'));
  const absolute = realpathSync(resolve('public', checked));
  const rel = relative(root, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Asset is outside public/: ' + checked);
  return checked;
}
export function applyWorkbenchPreset(input: {
  presetId: PresetId; imageA: string; imageB: string; durationFrames?: number; sceneId?: string;
  expectedRevision: string;
}) {
  const before = readProject();
  if (before.revision !== input.expectedRevision) throw new Error('REVISION_CONFLICT: read get_project again before editing.');
  const imageA = assertImageAsset(input.imageA);
  const imageB = assertImageAsset(input.imageB);
  const scene = buildPresetScene(before.project, {...input, imageA, imageB});
  const updated: VideoProject = projectSchema.parse({...before.project, scenes: [...before.project.scenes, scene]});
  // A final read prevents accidentally overwriting an external edit during the operation.
  if (readProject().revision !== before.revision) throw new Error('REVISION_CONFLICT');
  atomicWrite(WORKBENCH_PROJECT, JSON.stringify(updated, null, 2) + '\n');
  return {scene, ...readProject()};
}

export function updateWorkbenchScene(input: {
  sceneId: string; expectedRevision: string; patch: Record<string, unknown>;
}) {
  const before = readProject();
  if (before.revision !== input.expectedRevision) throw new Error('REVISION_CONFLICT: refresh get_project.');
  const index = before.project.scenes.findIndex(scene => scene.id === input.sceneId);
  if (index < 0) throw new Error('Scene not found: ' + input.sceneId);
  const existing = before.project.scenes[index];
  const allowed: Record<string, string[]> = {
    'lounge-3d': ['title', 'camera', 'snowfall', 'palette', 'durationFrames'],
    'motion-3d': ['title', 'subtitle', 'rings', 'palette', 'durationFrames'],
    'image-transition': ['inputs', 'palette', 'durationFrames']
  };
  for (const key of Object.keys(input.patch)) {
    if (!allowed[existing.type].includes(key)) throw new Error('Field is not editable for this scene: ' + key);
  }
  if (Object.keys(input.patch).length === 0) throw new Error('Patch cannot be empty.');
  if (input.patch.durationFrames !== undefined &&
    (typeof input.patch.durationFrames !== 'number' || input.patch.durationFrames > 54_000)) {
    throw new Error('Scene duration must be at most 54,000 frames.');
  }
  let merged = {...existing, ...input.patch};
  if (input.patch.palette && typeof input.patch.palette === 'object' && !Array.isArray(input.patch.palette)) {
    merged = {...merged, palette: {...existing.palette, ...(input.patch.palette as object)}};
  }
  if (existing.type === 'image-transition' && input.patch.inputs && typeof input.patch.inputs === 'object' && !Array.isArray(input.patch.inputs)) {
    const inputs = {...existing.inputs, ...(input.patch.inputs as object)};
    assertImageAsset(String(inputs.imageA));
    assertImageAsset(String(inputs.imageB));
    merged = {...merged, inputs};
  }
  const updated = projectSchema.parse({...before.project, scenes: before.project.scenes.map((scene, i) => i === index ? merged : scene)});
  if (readProject().revision !== before.revision) throw new Error('REVISION_CONFLICT');
  atomicWrite(WORKBENCH_PROJECT, JSON.stringify(updated, null, 2) + '\n');
  const snapshot = readProject();
  return {scene: snapshot.project.scenes[index], revision: snapshot.revision, frames: snapshot.frames};
}

export type PreviewState = {sequence: number; frame: number; playing: boolean};
export function readPreviewState(): PreviewState {
  if (!existsSync(PREVIEW_STATE)) return {sequence: 0, frame: 0, playing: false};
  try {
    const data = JSON.parse(readFileSync(PREVIEW_STATE, 'utf8'));
    return {
      sequence: Number.isInteger(data.sequence) && data.sequence >= 0 ? data.sequence : 0,
      frame: Number.isInteger(data.frame) && data.frame >= 0 ? data.frame : 0,
      playing: data.playing === true
    };
  } catch {
    return {sequence: 0, frame: 0, playing: false};
  }
}
export function seekPreview(requestedFrame: number) {
  const snapshot = readProject();
  if (!Number.isInteger(requestedFrame) || requestedFrame < 0 || requestedFrame >= snapshot.frames)
    throw new Error('Frame must be between 0 and ' + (snapshot.frames - 1));
  const previous = readPreviewState();
  const next = {sequence: previous.sequence + 1, frame: requestedFrame, playing: false};
  atomicWrite(PREVIEW_STATE, JSON.stringify(next) + '\n');
  return {...next, seconds: requestedFrame / snapshot.project.fps};
}
