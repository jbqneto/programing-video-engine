import {generateContactSheet, validateVideoLoop} from './core';

const [action, ...args] = process.argv.slice(2);
function argument(name: string) {
  const index = args.indexOf('--' + name);
  return index < 0 ? undefined : args[index + 1];
}
const input = argument('input');
if (!input || !['loop', 'sheet'].includes(action ?? '')) {
  console.error('Usage: npm run quality -- loop --input filename.mp4');
  console.error('       npm run quality -- sheet --input filename.mp4 --out qa/contact-sheet.png [--count 9] [--columns 3] [--force]');
  console.error('All filenames are relative to out/. FFmpeg and ffprobe must be installed.');
  process.exit(2);
}
try {
  if (action === 'loop') {
    const report = validateVideoLoop(input);
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } else {
    const output = argument('out') ?? 'quality/' + input.replace(/[/.]/g, '-') + '-sheet.png';
    const count = argument('count') === undefined ? 9 : Number(argument('count'));
    const columns = argument('columns') === undefined ? 3 : Number(argument('columns'));
    console.log(JSON.stringify(generateContactSheet(input, output, count, columns, args.includes('--force')), null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Unknown quality check failure');
  process.exitCode = 2;
}
