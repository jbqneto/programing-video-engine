import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const current = Number(process.versions.node.split('.')[0]);
assert.ok([24, 26].includes(current), 'This project supports Node.js 24 and 26 LTS only. Current runtime: ' + process.version);
const exact = ['remotion', '@remotion/player', '@remotion/three', '@remotion/cli'].map(name => {
  const version = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  assert.match(version ?? '', /^\d+\.\d+\.\d+$/, name + ' must have an exact stable release without ^ or ~');
  return version;
});
assert.equal(new Set(exact).size, 1, 'All Remotion packages must use exactly the same version');
assert.match(pkg.engines.node, /24/);
assert.match(pkg.engines.node, /26/);
console.log('PASS runtime ' + process.version + ', Remotion packages aligned at ' + exact[0]);
