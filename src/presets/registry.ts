import type {Scene, VideoProject} from '../lib/schema';

export type PresetId = 'fade-in-entrance';
export type PresetInputs = {imageA: string; imageB: string};

/**
 * Declarative, discoverable preset contract. See docs/presets.md for versioning.
 * The parameters exposed to agents stay small; animation details remain fixed.
 */
export const PRESET_CATALOG = [{
  id: 'fade-in-entrance',
  version: '1.0.0',
  name: 'Fade In Entrance',
  category: 'image-transition',
  description: 'Two-image cinematic transition. Image A stays visible while image B enters with a crossfade, blur reduction and subtle scale movement.',
  inputs: [
    {name: 'imageA', kind: 'image', required: true, description: 'The outgoing local image, relative to public/.'},
    {name: 'imageB', kind: 'image', required: true, description: 'The incoming local image, relative to public/.'}
  ],
  durationFrames: {default: 90, min: 24, max: 900},
  effects: {transitionStartFraction: 0.33, transitionFraction: 0.4, incomingScale: 1.065, outgoingScale: 0.975, incomingBlurPx: 12, easing: 'smoothstep'},
  example: {presetId: 'fade-in-entrance', imageA: 'demo/frame-a.svg', imageB: 'demo/frame-b.svg', durationFrames: 90}
}] as const;

export function findPreset(presetId: string) {
  return PRESET_CATALOG.find(preset => preset.id === presetId) ?? null;
}

export function buildPresetScene(
  project: VideoProject,
  opts: {presetId: PresetId; imageA: string; imageB: string; durationFrames?: number; sceneId?: string}
): Scene {
  const preset = findPreset(opts.presetId);
  if (!preset) throw new Error('Unknown preset: ' + opts.presetId);
  const durationFrames = opts.durationFrames ?? preset.durationFrames.default;
  if (!Number.isInteger(durationFrames) || durationFrames < preset.durationFrames.min || durationFrames > preset.durationFrames.max)
    throw new Error('durationFrames must be between ' + preset.durationFrames.min + ' and ' + preset.durationFrames.max);
  const id = opts.sceneId ?? ('preset-' + opts.presetId + '-' + (project.scenes.length + 1));
  if (project.scenes.some(scene => scene.id === id)) throw new Error('Scene ID already exists: ' + id);
  return {
    id, type: 'image-transition', durationFrames,
    palette: project.scenes[project.scenes.length - 1].palette,
    presetId: 'fade-in-entrance', presetVersion: '1.0.0',
    inputs: {imageA: opts.imageA, imageB: opts.imageB}
  };
}
