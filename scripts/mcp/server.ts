import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {McpServer} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {PRESET_CATALOG} from '../../src/presets/registry';
import {applyWorkbenchPreset, updateWorkbenchScene, readPreviewState, readProject, seekPreview} from './store';

const result = (payload: unknown) => ({content: [{type: 'text' as const, text: JSON.stringify(payload, null, 2)}]});
const safe = <T>(fn: () => T | Promise<T>) => async () => {
  try {return result(await fn());}
  catch (error) {return {isError: true, content: [{type: 'text' as const, text: error instanceof Error ? error.message : 'UNKNOWN_ERROR'}]};}
};

export function createVideoMcpServer() {
  const server = new McpServer({name: 'programming-video-engine', version: '0.2.0'});
  server.registerTool('get_project', {
    description: 'Read the current workbench project, its SHA-256 revision and total duration. Use revision as expectedRevision when applying a preset.',
    inputSchema: z.object({}),
    annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
  }, safe(() => readProject()));

  server.registerTool('describe_timeline', {
    description: 'List scenes, types, and exact start/end frames and seconds. Frames are 0-indexed.',
    inputSchema: z.object({}),
    annotations: {readOnlyHint: true}
  }, safe(() => {
    const {project} = readProject();
    let start = 0;
    return {fps: project.fps, scenes: project.scenes.map(scene => {
      const item = {id: scene.id, type: scene.type, startFrame: start,
        endFrameInclusive: start + scene.durationFrames - 1, startSeconds: start / project.fps,
        endSecondsExclusive: (start + scene.durationFrames) / project.fps};
      start += scene.durationFrames;
      return item;
    })};
  }));

  server.registerTool('list_presets', {
    description: 'List available versioned, parameterized animation presets. Their fixed effects do not need to be specified by agents.',
    inputSchema: z.object({}),
    annotations: {readOnlyHint: true}
  }, safe(() => PRESET_CATALOG));

  server.registerTool('apply_preset', {
    description: 'Append a Fade In Entrance scene with two existing images under public/. Supply expectedRevision from get_project. The preset defines the transition animation; images are the only required creative inputs.',
    inputSchema: z.object({
      presetId: z.literal('fade-in-entrance'),
      imageA: z.string().min(1).max(250),
      imageB: z.string().min(1).max(250),
      expectedRevision: z.string().regex(/^[0-9a-f]{64}$/),
      durationFrames: z.number().int().min(24).max(900).optional(),
      sceneId: z.string().regex(/^[A-Za-z0-9_-]{1,90}$/).optional(),
    }),
    annotations: {readOnlyHint: false, destructiveHint: false, openWorldHint: false}
  }, async ({presetId, imageA, imageB, durationFrames, sceneId, expectedRevision}) => {
    try {
      const data = applyWorkbenchPreset({presetId, imageA, imageB, durationFrames, sceneId, expectedRevision});
      return result({scene: data.scene, revision: data.revision, frames: data.frames});
    } catch (error) {
      return {isError: true, content: [{type: 'text' as const, text: error instanceof Error ? error.message : 'UNKNOWN_ERROR'}]};
    }
  });

  server.registerTool('update_scene', {
    description: 'Apply a validated field patch to an existing scene without replacing other scenes. Call get_project first; use the latest expectedRevision. Permitted fields depend on scene type. Use describe_timeline to find the intended scene at a precise time.',
    inputSchema: z.object({
      sceneId: z.string().min(1).max(100),
      expectedRevision: z.string().regex(/^[0-9a-f]{64}$/),
      patch: z.record(z.string(), z.unknown())
    }),
    annotations: {readOnlyHint: false, destructiveHint: false, openWorldHint: false}
  }, async ({sceneId, expectedRevision, patch}) => {
    try {return result(updateWorkbenchScene({sceneId, expectedRevision, patch}));}
    catch (error) {return {isError: true, content: [{type: 'text' as const, text: error instanceof Error ? error.message : 'UNKNOWN_ERROR'}]};}
  });

  server.registerTool('seek_preview', {
    description: 'Move the open browser preview to a specific 0-based frame or a position in seconds. Set exactly one. The preview browser polls this shared state.',
    inputSchema: z.object({frame: z.number().int().min(0).optional(), seconds: z.number().finite().min(0).optional()}),
    annotations: {readOnlyHint: false, destructiveHint: false, openWorldHint: false}
  }, async ({frame, seconds}) => {
    try {
      if ((frame === undefined) === (seconds === undefined)) throw new Error('Supply exactly one of frame or seconds.');
      const requested = frame ?? Math.round((seconds ?? 0) * readProject().project.fps);
      return result(seekPreview(requested));
    } catch (error) {
      return {isError: true, content: [{type: 'text' as const, text: error instanceof Error ? error.message : 'UNKNOWN_ERROR'}]};
    }
  });

  server.registerTool('get_preview_state', {
    description: 'Get the last agent-requested frame, playback state, and sequence number.',
    inputSchema: z.object({}),
    annotations: {readOnlyHint: true}
  }, safe(() => readPreviewState()));

  server.registerTool('get_agent_guide', {
    description: 'Read the local agent instructions (AGENTS.md). Consult this before editing a project or introducing presets.',
    inputSchema: z.object({}),
    annotations: {readOnlyHint: true}
  }, safe(() => ({content: readFileSync(resolve('AGENTS.md'), 'utf8')})));
  return server;
}
