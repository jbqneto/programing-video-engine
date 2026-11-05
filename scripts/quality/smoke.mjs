import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync} from 'node:fs';

function run(program, args) {
  const result = spawnSync(program, args, {encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024});
  if (result.error || result.status !== 0) {
    throw new Error(program + ' failed: ' + (result.error?.message ?? '') + '\n' + result.stderr + '\n' + result.stdout);
  }
  return result.stdout;
}
mkdirSync('out/quality-fixtures', {recursive: true});
run('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=64x64:r=6:d=1',
  '-c:v', 'mpeg4', '-pix_fmt', 'yuv420p', '-y', 'out/quality-fixtures/static.mp4']);
const inspect = run(process.execPath, ['--import', 'tsx', 'scripts/quality/cli.ts',
  'loop', '--input', 'quality-fixtures/static.mp4']);
const loop = JSON.parse(inspect);
if (!loop.passed || loop.video.frames !== 6 || loop.seamDifference !== 0)
  throw new Error('Static test clip did not pass loop check: ' + inspect);
const output = 'out/quality-fixtures/contact.png';
run(process.execPath, ['--import', 'tsx', 'scripts/quality/cli.ts',
  'sheet', '--input', 'quality-fixtures/static.mp4', '--out', 'quality-fixtures/contact.png',
  '--count', '6', '--columns', '3', '--force']);
if (!existsSync(output)) throw new Error('Contact sheet not created');
const header = readFileSync(output).subarray(0, 8).toString('hex');
if (header !== '89504e470d0a1a0a') throw new Error('Contact sheet is not a PNG');
console.log('PASS FFmpeg/FFprobe real-video loop validation and PNG contact-sheet generation');
