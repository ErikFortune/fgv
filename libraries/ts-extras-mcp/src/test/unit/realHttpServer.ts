/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * A real Streamable-HTTP MCP server for tests: the SDK's own `StreamableHTTPServerTransport` and
 * `McpServer` behind `node:http`, sessionful (so the client opens the standalone `GET` event stream
 * and sends the termination `DELETE`), with one `echo` tool. A `gate` can answer a request before
 * the SDK sees it — the hook the OAuth tests use to demand a bearer token.
 */

import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http';
import { type AddressInfo } from 'node:net';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

/** Answers a request itself (resolving `true`), or lets the MCP server handle it (`false`). */
export type RequestGate = (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;

export interface IRealMcpServer {
  readonly server: Server;
  /** The MCP endpoint, `http://127.0.0.1:<port>/mcp`. */
  readonly url: string;
  /** The method of every request the server received, in order. */
  readonly methods: string[];
  /** The session ids the server has closed in response to a `DELETE`. */
  readonly closedSessions: string[];
  stop(): Promise<void>;
}

export async function startRealMcpServer(gate?: RequestGate): Promise<IRealMcpServer> {
  const methods: string[] = [];
  const closedSessions: string[] = [];
  const transports = new Map<string, StreamableHTTPServerTransport>();
  let nextSession = 1;
  const server = createServer((req, res) => {
    methods.push(req.method ?? '?');
    (gate ?? (async () => false))(req, res)
      .then((answered) => {
        if (!answered) {
          handleMcp(req, res);
        }
      })
      .catch(() => res.writeHead(500).end());
  });
  function handleMcp(req: IncomingMessage, res: ServerResponse): void {
    const id = req.headers['mcp-session-id'];
    const existing = typeof id === 'string' ? transports.get(id) : undefined;
    if (existing !== undefined) {
      existing.handleRequest(req, res).catch(() => res.writeHead(500).end());
      return;
    }
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => `session-${nextSession++}`,
      onsessioninitialized: (sessionId) => {
        transports.set(sessionId, transport);
      },
      onsessionclosed: (sessionId) => {
        closedSessions.push(sessionId);
      }
    });
    const mcp = new McpServer({ name: 'real-http', version: '1.0.0' });
    mcp.registerTool('echo', { description: 'echoes' }, async () => ({
      content: [{ type: 'text', text: 'echoed' }]
    }));
    mcp
      .connect(transport)
      .then(() => transport.handleRequest(req, res))
      .catch(() => res.writeHead(500).end());
  }
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    server,
    url: `http://127.0.0.1:${port}/mcp`,
    methods,
    closedSessions,
    stop: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  };
}

/** Polls `condition` every 10 ms until it holds or `timeoutMs` passes. */
export async function waitFor(condition: () => boolean, timeoutMs: number = 3000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
