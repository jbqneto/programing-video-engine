import {spawn} from 'node:child_process';
const executable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(executable, ['run', 'mcp:http'], {stdio: 'inherit', env: process.env}),
  spawn(executable, ['run', 'ui'], {stdio: 'inherit', env: process.env})
];
let closing = false;
const shutdown = () => {
  if (closing) return;
  closing = true;
  for (const child of children) if (!child.killed) child.kill('SIGTERM');
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
for (const child of children) {
  child.on('error', error => {console.error('[workbench]', error.message);process.exitCode=1;shutdown();});
  child.on('exit', (code, signal) => {
    if (!closing) {
      console.error('[workbench] Child exited:', code ?? signal);
      process.exitCode = code || 1;
      shutdown();
    }
  });
}
console.log('[workbench] Preview: http://127.0.0.1:5173');
console.log('[workbench] MCP:     http://127.0.0.1:3333/mcp');
