import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {createVideoMcpServer} from './server';

// JSON-RPC must be the only output on stdout. Use stderr for diagnostics.
await serveStdio(() => createVideoMcpServer());
