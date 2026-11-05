import {spawnSync} from 'node:child_process';
import {existsSync, lstatSync, mkdirSync, realpathSync, renameSync, rmSync, statSync} from 'node:fs';
import {dirname, extname, isAbsolute, relative, resolve, sep} from 'node:path';

const ROOT = resolve('out');
const SAMPLE_WIDTH = 320;
const SAMPLE_HEIGHT = 180;
const FRAME_BYTES = SAMPLE_WIDTH * SAMPLE_HEIGHT * 3;
const LIMIT_MB = 500;
const MAX_FRAMES = 18000;

function isInside(root: string, target: string) {
  const diff = relative(root, target);
  return diff === '' || (diff !== '..' && !diff.startsWith('..' + sep) && !isAbsolute(diff));
}

export function safeRelativeName(name: string, extension: RegExp) {
  if (!name || name.length > 220 || isAbsolute(name) || name.includes('\\') ||
    !/^[A-Za-z0-9_.\/-]+$/.test(name) ||
    name.split('/').some(part => part === '' || part === '.' || part === '..') ||
    !extension.test(name)) throw new Error('INVALID_MEDIA_PATH: use a relative filename under out/');
  return name;
}

function outRoot() {
  mkdirSync(ROOT, {recursive: true});
  return realpathSync(ROOT);
}

export function resolveVideoPath(name: string) {
  const rel = safeRelativeName(name, /\.(mp4|mov|webm)$/i);
  const root = outRoot();
  const full = resolve(root, rel);
  if (!isInside(root, full)) throw new Error('PATH_NOT_ALLOWED');
  if (!existsSync(full)) throw new Error('VIDEO_NOT_FOUND: ' + rel);
  const actual = realpathSync(full);
  if (!isInside(root, actual) || !statSync(actual).isFile()) throw new Error('PATH_NOT_ALLOWED');
  if (statSync(actual).size > LIMIT_MB * 1024 * 1024) throw new Error('VIDEO_TOO_LARGE: limit is 500 MiB');
  return actual;
}

export function resolveImageOutputPath(name: string, overwrite = false) {
  const rel = safeRelativeName(name, /\.png$/i);
  const root = outRoot();
  const full = resolve(root, rel);
  if (!isInside(root, full)) throw new Error('PATH_NOT_ALLOWED');
  // Check every ancestor before creating folders. A symlink must never cause
  // mkdir to write outside out/, even temporarily.
  const directories = rel.split('/').slice(0, -1);
  let cursor = root;
  for (const part of directories) {
    cursor = resolve(cursor, part);
    if (!isInside(root, cursor)) throw new Error('PATH_NOT_ALLOWED');
    const status = (() => {try {return lstatSync(cursor);} catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }})();
    if (status) {
      if (status.isSymbolicLink() || !status.isDirectory()) throw new Error('PATH_NOT_ALLOWED');
    } else mkdirSync(cursor);
  }
  if (!isInside(root, realpathSync(dirname(full)))) throw new Error('PATH_NOT_ALLOWED');
  if (existsSync(full)) {
    if (lstatSync(full).isSymbolicLink() || !isInside(root, realpathSync(full)) ||
        !statSync(full).isFile()) throw new Error('PATH_NOT_ALLOWED');
    if (!overwrite) throw new Error('OUTPUT_EXISTS: add --force to overwrite the PNG');
  }
  return full;
}

function command(executable: string, args: string[], timeout = 90_000, maxBuffer = 4 * 1024 * 1024): Buffer {
  const proc = spawnSync(executable, args, {encoding: null, timeout, maxBuffer, windowsHide: true});
  if (proc.error) throw new Error(executable + ': ' + proc.error.message);
  if (proc.status !== 0) throw new Error(executable + ' failed: ' + proc.stderr.toString('utf8').slice(-2000));
  return proc.stdout;
}

function rationalRate(text: string) {
  const [numerator, denominator = '1'] = text.split('/').map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0 || numerator <= 0)
    throw new Error('INVALID_FPS');
  return numerator / denominator;
}

export type VideoMetadata = {file: string; width: number; height: number; fps: number; frames: number; durationSeconds: number};

export function probeVideo(name: string): VideoMetadata {
  const file = resolveVideoPath(name);
  const data = command('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=width,height,nb_read_frames,r_frame_rate',
    '-of', 'json', file
  ], 60_000);
  const entry = JSON.parse(data.toString('utf8')).streams?.[0];
  const frames = Number(entry?.nb_read_frames);
  const width = Number(entry?.width);
  const height = Number(entry?.height);
  const fps = rationalRate(String(entry?.r_frame_rate ?? ''));
  if (!Number.isInteger(frames) || frames < 4 || frames > MAX_FRAMES)
    throw new Error('UNSUPPORTED_DURATION: require between 4 and ' + MAX_FRAMES + ' decoded frames');
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
    width > 4096 || height > 4096) throw new Error('UNSUPPORTED_DIMENSIONS');
  return {file, width, height, fps, frames, durationSeconds: frames / fps};
}

export function meanRgbDifference(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length || left.length === 0) throw new Error('Images must have equal nonempty dimensions');
  let sum = 0;
  for (let i = 0; i < left.length; i++) sum += Math.abs(left[i] - right[i]);
  return sum / left.length;
}

export function calculateLoopMetrics(first: Uint8Array, second: Uint8Array, penultimate: Uint8Array, last: Uint8Array) {
  const startMotion = meanRgbDifference(first, second);
  const endMotion = meanRgbDifference(penultimate, last);
  const seamDifference = meanRgbDifference(last, first);
  const typicalMotion = (startMotion + endMotion) / 2;
  // Image-based heuristic: allow both compression noise and normal movement per frame.
  const threshold = Math.max(6, typicalMotion * 2.5 + 2);
  return {
    passed: seamDifference <= threshold,
    seamDifference: Number(seamDifference.toFixed(4)),
    startMotion: Number(startMotion.toFixed(4)),
    endMotion: Number(endMotion.toFixed(4)),
    typicalMotion: Number(typicalMotion.toFixed(4)),
    threshold: Number(threshold.toFixed(4)),
    interpretation: 'Mean absolute RGB sample difference (0..255), downscaled to 320x180. Heuristic only; visually inspect two playback cycles.'
  };
}

function selectFilter(frames: number[]) {
  return 'select=' + frames.map(frame => 'eq(n\\,' + frame + ')').join('+') +
    ',scale=' + SAMPLE_WIDTH + ':' + SAMPLE_HEIGHT + ':force_original_aspect_ratio=decrease' +
    ',pad=' + SAMPLE_WIDTH + ':' + SAMPLE_HEIGHT + ':(ow-iw)/2:(oh-ih)/2:color=black';
}

export function validateVideoLoop(name: string) {
  const video = probeVideo(name);
  const wanted = [0, 1, video.frames - 2, video.frames - 1];
  const bytes = command('ffmpeg', ['-v', 'error', '-i', video.file,
    '-vf', selectFilter(wanted) + ',format=rgb24',
    '-fps_mode', 'passthrough', '-frames:v', '4',
    '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1'], 120_000, FRAME_BYTES * 4 + 1024 * 1024);
  if (bytes.length !== FRAME_BYTES * 4) throw new Error('FRAME_DECODE_MISMATCH');
  const samples = wanted.map((_, index) =>
    new Uint8Array(bytes.buffer, bytes.byteOffset + FRAME_BYTES * index, FRAME_BYTES));
  return {input: name, video: {width: video.width, height: video.height, fps: video.fps,
    frames: video.frames, durationSeconds: video.durationSeconds},
    sampledFrames: wanted, ...calculateLoopMetrics(samples[0], samples[1], samples[2], samples[3])};
}

export function contactSheetFrames(totalFrames: number, count: number) {
  if (!Number.isInteger(count) || count < 2 || count > 24 || totalFrames < count)
    throw new Error('Contact sheet requires 2..24 samples, no more than total video frames');
  return Array.from({length: count}, (_, i) => Math.round(i * (totalFrames - 1) / (count - 1)));
}

export function generateContactSheet(input: string, out: string, count = 9, columns = 3, overwrite = false) {
  if (!Number.isInteger(columns) || columns < 1 || columns > 6)
    throw new Error('columns must be between 1 and 6');
  const meta = probeVideo(input);
  const indexes = contactSheetFrames(meta.frames, count);
  const target = resolveImageOutputPath(out, overwrite);
  const temporary = target.slice(0, -4) + '.partial-' + process.pid + '.png';
  const rows = Math.ceil(count / columns);
  try {
    command('ffmpeg', ['-v', 'error', '-i', meta.file, '-vf',
      selectFilter(indexes) + ',tile=' + columns + 'x' + rows + ':padding=8:margin=8:color=black',
      '-fps_mode', 'passthrough', '-frames:v', '1', '-y', temporary], 120_000, 4 * 1024 * 1024);
    if (!existsSync(temporary)) throw new Error('CONTACT_SHEET_MISSING');
    renameSync(temporary, target);
  } catch (error) {
    rmSync(temporary, {force: true});
    throw error;
  }
  return {input, output: out, path: target, fps: meta.fps, width: meta.width, height: meta.height,
    columns, rows, frames: indexes, seconds: indexes.map(frame => Number((frame / meta.fps).toFixed(3)))};
}
