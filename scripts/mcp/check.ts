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
  for (const expected of ['get_project', 'describe_timeline', 'list_presets', 'apply_preset', 'update_scene', 'seek_preview', 'list_agent_skills', 'get_agent_skill', 'validate_loop', 'render_contact_sheet']) {
    if (!list.tools.some(tool => tool.name === expected)) throw new Error('Missing stdio MCP tool: ' + expected);
  }
  const presetResult = await stdioClient.callTool({name: 'list_presets', arguments: {}});
  if (!presetResult.content?.length) throw new Error('Empty list_presets response.');
  const skillResult = await stdioClient.callTool({name: 'list_agent_skills', arguments: {}});
  if (!JSON.stringify(skillResult).includes('scenario-motion-loops')) throw new Error('MCP agent skill catalog is missing.');
  if (!JSON.stringify(skillResult).includes('pve-seamless-loops')) throw new Error('First-party skills missing from the MCP catalog.');
  const localDoc = await stdioClient.callTool({name: 'get_agent_skill', arguments: {skillId: 'pve-visual-review'}});
  if (!JSON.stringify(localDoc).includes('Visual Review')) throw new Error('First-party skill documentation unavailable.');
  const skillDoc = await stdioClient.callTool({name: 'get_agent_skill', arguments: {skillId: 'scenario-motion-loops'}});
  if (!JSON.stringify(skillDoc).includes('Scenario Motion Loops')) throw new Error('MCP skill documentation could not be read.');
  console.log('PASS stdio MCP handshake, tools and curated agent skill discovery');
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
  if (!tools.tools.some(tool => tool.name === 'list_agent_skills')) throw new Error('HTTP MCP agent skill discovery tool missing.');
  if (!tools.tools.some(tool => tool.name === 'validate_loop')) throw new Error('HTTP loop validator tool missing.');
  if (!tools.tools.some(tool => tool.name === 'render_contact_sheet')) throw new Error('HTTP contact-sheet tool missing.');
  const response = await httpClient.callTool({name: 'get_project', arguments: {}});
  if (!response.content?.length) throw new Error('HTTP MCP get_project returned no content.');
  console.log('PASS HTTP MCP handshake, tools/list and get_project on :3333');
} finally {
  await httpClient?.close();
  child.kill('SIGTERM');
}
