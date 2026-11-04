import {readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, resolve, join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {projectFrames, projectSchema} from '../src/lib/schema';

const args = process.argv.slice(2);
const get = (flag: string, fallback: string) => {
  const i = args.indexOf(flag);
  return i < 0 ? fallback : args[i+1] ?? fallback;
};
const projectPath = resolve(get('--project', 'src/projects/afterhours-demo.json'));
const outputPath = resolve(get('--out', 'out/afterhours-demo.mp4'));
const project = projectSchema.parse(JSON.parse(readFileSync(projectPath, 'utf8')));
const dir = mkdtempSync(join(tmpdir(), 'video-engine-'));
try {
  const propsFile = join(dir, 'props.json');
  writeFileSync(propsFile, JSON.stringify({project}));
  mkdirSync(dirname(outputPath), {recursive: true});
  console.log(`[engine] ${project.scenes.length} scenes; ${projectFrames(project)} frames; output: ${outputPath}`);
  const child = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
    '--no-install', 'remotion', 'render', 'src/index.ts', 'CinematicDemo', outputPath,
    '--props', propsFile, '--gl', process.env.REMOTION_GL ?? 'angle', '--codec', 'h264', '--pixel-format', 'yuv420p', '--concurrency', '2'
  ], {cwd: process.cwd(), stdio: 'inherit', env: process.env});
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
} finally {
  rmSync(dir, {recursive: true, force: true});
}
