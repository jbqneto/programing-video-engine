import {createServer} from 'node:http';
import {NodeStreamableHTTPServerTransport} from '@modelcontextprotocol/node';
import {createVideoMcpServer} from './server';
import {readProject, readPreviewState} from './store';
import {PRESET_CATALOG} from '../../src/presets/registry';

const port = Number(process.env.VIDEO_ENGINE_MCP_PORT ?? 3333);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid VIDEO_ENGINE_MCP_PORT.');
const allowedHosts = new Set(['127.0.0.1:' + port, 'localhost:' + port]);
const allowedOrigins = new Set([
  'http://127.0.0.1:5173', 'http://localhost:5173',
  'http://127.0.0.1:' + port, 'http://localhost:' + port
]);
const send = (res: import('node:http').ServerResponse, code: number, data: unknown) => {
  res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
  res.end(JSON.stringify(data));
};

const server = createServer(async (req, res) => {
  // Local-only HTTP. Never bind this development server to 0.0.0.0.
  if (!allowedHosts.has(req.headers.host ?? '') ||
    (req.headers.origin && !allowedOrigins.has(req.headers.origin))) {
    send(res, 403, {error: 'Origin or Host denied'});
    return;
  }
  const route = (req.url ?? '/').split('?')[0];
  try {
    if (req.method === 'GET' && route === '/health') {
      send(res, 200, {ok: true, name: 'programming-video-engine', mcp: '/mcp'});
      return;
    }
    if (req.method === 'GET' && route === '/api/project') {
      send(res, 200, readProject());
      return;
    }
    if (req.method === 'GET' && route === '/api/preview-state') {
      send(res, 200, readPreviewState());
      return;
    }
    if (req.method === 'GET' && route === '/api/presets') {
      send(res, 200, PRESET_CATALOG);
      return;
    }
    if (route === '/mcp') {
      if (req.method !== 'POST') {
        res.writeHead(405, {Allow: 'POST'}); res.end();
        return;
      }
      const app = createVideoMcpServer();
      const transport = new NodeStreamableHTTPServerTransport({sessionIdGenerator: undefined});
      try {
        await app.connect(transport);
        await transport.handleRequest(req, res);
      } finally {
        await transport.close();
        await app.close();
      }
      return;
    }
    send(res, 404, {error: 'Not found'});
  } catch (error) {
    if (!res.headersSent) send(res, 500, {error: error instanceof Error ? error.message : 'Request failed'});
    else res.end();
  }
});
server.listen(port, '127.0.0.1', () => {
  console.error('[video-engine] Local Streamable HTTP MCP: http://127.0.0.1:' + port + '/mcp');
  console.error('[video-engine] Health: http://127.0.0.1:' + port + '/health');
});
