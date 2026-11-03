import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {projectFrames, projectSchema} from '../src/lib/schema';

const file = resolve(process.argv[2] ?? 'src/projects/afterhours-demo.json');
const project = projectSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
const frames = projectFrames(project);
console.log(JSON.stringify({valid: true, id: project.id, scenes: project.scenes.length, frames, seconds: frames / project.fps, size: `${project.width}x${project.height}`}, null, 2));
