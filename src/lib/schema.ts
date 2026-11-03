import {z} from 'zod';

const hex = z.string().regex(/^#[a-fA-F0-9]{6}$/, 'Cor HEX #RRGGBB obrigatoria');
const palette = z.object({
  background: hex,
  accent: hex,
  secondary: hex,
  text: hex,
});

const common = z.object({
  id: z.string().min(1),
  durationFrames: z.number().int().min(1),
  palette,
});

const lounge = common.extend({
  type: z.literal('lounge-3d'),
  snowfall: z.object({count: z.number().int().min(0).max(240), speed: z.number().positive(), seed: z.number().int()}).default({count: 100, speed: 0.65, seed: 7}),
  camera: z.object({startX: z.number(), endX: z.number(), y: z.number(), z: z.number()}).default({startX: -0.3, endX: 0.25, y: 2.45, z: 8}),
  title: z.string().optional(),
});

const motion = common.extend({
  type: z.literal('motion-3d'),
  title: z.string().min(1),
  subtitle: z.string().default(''),
  rings: z.number().int().min(1).max(8).default(3),
});

export const sceneSchema = z.discriminatedUnion('type', [lounge, motion]);
export const projectSchema = z.object({
  version: z.literal('1.0'),
  id: z.string().min(1),
  title: z.string().min(1),
  fps: z.number().int().min(12).max(60),
  width: z.number().int().min(320).max(7680),
  height: z.number().int().min(240).max(4320),
  scenes: z.array(sceneSchema).min(1),
  // Caminho relativo ao diretorio public/, ex.: "audio/music.mp3".
  audio: z.object({src: z.string().min(1), volume: z.number().min(0).max(1).default(0.8)}).optional(),
}).superRefine((project, ctx) => {
  const ids = project.scenes.map(s => s.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({code: 'custom', path: ['scenes'], message: 'IDs de cenas devem ser unicos'});
  }
});

export type VideoProject = z.infer<typeof projectSchema>;
export type Scene = VideoProject['scenes'][number];
export const projectFrames = (project: VideoProject) => project.scenes.reduce((sum, s) => sum + s.durationFrames, 0);
