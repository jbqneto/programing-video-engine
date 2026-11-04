import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {Client, StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

const tsx = resolve('node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
const makeClient = () => new Client({name: 'video-engine-self-check', version: '0.1.0'});

const stdioClient = makeClient();
try {
  await stdioClient.connect(new StdioClientTransport({command: tsx, args: ['scripts/mcp/stdio.ts']}));
  const list = await stdioClient.listTools();
  for (const expected of ['get_project', 'describe_timeline', 'list_presets', 'apply_preset', 'seek_preview']) {
    if (!list.tools.some(tool => tool.name === expected)) throw new Error('Missing stdio MCP tool: ' + expected);
  }
  const presetResult = await stdioClient.callTool({name: 'list_presets', arguments: {}});
  if (!presetResult.content?.length) throw new Error('Empty list_presets response.');
  console.log('PASS stdio MCP handshake and tools');
} finally {
  await stdioClient.close();
}

const port = 3333;
const child = spawn(tsx, ['scripts/mcp/http.ts'], {stdio: ['ignore', 'ignore', 'pipe'], env: {
  ...process.env, VIDEO_ENGINE_MCP_PORT: String(port)
}});
let logs = '';
child.stderr?.on('data', data => {logs += String(data);});
let httpClient: Client | undefined;
try {
  let connected = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error('HTTP process exited early: ' + logs);
    try {
      const res = await fetch('http://127.0.0.1:' + port + '/health');
      if (res.ok) {connected = true; break;}
    } catch {/* Still starting. */}
    await delay(125);
  }
  if (!connected) throw new Error('HTTP MCP health check timeout: ' + logs);
  httpClient = makeClient();
  await httpClient.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:' + port + '/mcp')));
  const tools = await httpClient.listTools();
  if (!tools.tools.some(tool => tool.name === 'list_presets')) throw new Error('HTTP MCP tools/list failed.');
  const response = await httpClient.callTool({name: 'get_project', arguments: {}});
  if (!response.content?.length) throw new Error('HTTP MCP get_project returned no content.');
  console.log('PASS HTTP MCP handshake, tools/list and get_project on :3333');
} finally {
  await httpClient?.close();
  child.kill('SIGTERM');
}
