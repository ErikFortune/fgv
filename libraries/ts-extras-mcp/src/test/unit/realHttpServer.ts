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

import { type IncomingMessage, type Server, type ServerResponse, createServer, request as httpRequest } from 'node:http';
import { type AddressInfo } from 'node:net';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';

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

/** How the server answers. */
export interface IRealMcpServerOptions {
  /**
   * Answer each `POST` with one JSON body rather than an SSE stream (the SDK's `enableJsonResponse`).
   * The response headers then wait for the whole request — a slow tool holds them.
   */
  readonly enableJsonResponse?: boolean;
  /** Registers a `slow` tool that answers after this many milliseconds. */
  readonly slowToolMs?: number;
  /** Registers this many extra tools, `bulk_<n>`, each with a 200-character description: a large `tools/list`. */
  readonly bulkTools?: number;
  /**
   * Makes the server resumable (an in-memory event store, a 50 ms retry hint) and registers a
   * `polled` tool that closes its request's SSE stream before answering with 20 000 characters, so
   * the answer reaches the client only on the `GET` it resumes with (`Last-Event-ID`).
   */
  readonly resumable?: boolean;
}

export async function startRealMcpServer(
  gate?: RequestGate,
  options?: IRealMcpServerOptions
): Promise<IRealMcpServer> {
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
      enableJsonResponse: options?.enableJsonResponse === true,
      ...(options?.resumable === true ? { eventStore: new InMemoryEventStore(), retryInterval: 50 } : {}),
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
    for (let i = 0; i < (options?.bulkTools ?? 0); i++) {
      mcp.registerTool(`bulk_${i}`, { description: 'd'.repeat(200) }, async () => ({
        content: [{ type: 'text', text: 'bulk' }]
      }));
    }
    if (options?.resumable === true) {
      mcp.registerTool('polled', { description: 'answers on the resumed stream' }, async (extra) => {
        extra.closeSSEStream?.();
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { content: [{ type: 'text', text: 'P'.repeat(20000) }] };
      });
    }
    const slowMs = options?.slowToolMs;
    if (slowMs !== undefined) {
      mcp.registerTool('slow', { description: 'answers late' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, slowMs));
        return { content: [{ type: 'text', text: 'late' }] };
      });
    }
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

/** A running HTTP proxy in front of a {@link startRealMcpServer} endpoint. */
export interface IRechunkingProxy {
  /** The proxied MCP endpoint, `http://127.0.0.1:<port>/mcp`. */
  readonly url: string;
  /** How many `GET` requests the proxy has received. */
  readonly gets: () => number;
  stop(): Promise<void>;
}

/** How the proxy answers. */
export interface IRechunkingProxyOptions {
  /**
   * Answer every `GET` itself, with an event stream that sends `count` SSE comments of `size` bytes,
   * one every `everyMs`, rather than forwarding it.
   */
  readonly getStream?: { readonly size: number; readonly count: number; readonly everyMs: number };
}

/**
 * A proxy that forwards every request to `target` but drops the response's `Content-Length` and
 * re-sends its body in 256-byte writes, so a body over a size cap can only be caught by counting it
 * as it streams — never on its declared length.
 */
export async function startRechunkingProxy(
  target: string,
  options?: IRechunkingProxyOptions
): Promise<IRechunkingProxy> {
  const upstream = new URL(target);
  let gets = 0;
  const server = createServer((req, res) => {
    const getStream = options?.getStream;
    if (req.method === 'GET' && getStream !== undefined) {
      gets++;
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      let sent = 0;
      const timer = setInterval(() => {
        res.write(`: ${'k'.repeat(getStream.size)}\n\n`);
        if (++sent >= getStream.count) {
          clearInterval(timer);
        }
      }, getStream.everyMs);
      res.on('close', () => clearInterval(timer));
      return;
    }
    const forward = httpRequest(
      { host: upstream.hostname, port: upstream.port, path: upstream.pathname, method: req.method, headers: req.headers },
      (answer) => {
        const headers = { ...answer.headers };
        delete headers['content-length'];
        res.writeHead(answer.statusCode ?? 502, headers);
        answer.on('data', (chunk: Buffer) => {
          for (let i = 0; i < chunk.length; i += 256) {
            res.write(chunk.subarray(i, i + 256));
          }
        });
        answer.on('end', () => res.end());
      }
    );
    forward.on('error', () => res.destroy());
    req.pipe(forward);
    res.on('close', () => forward.destroy());
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    gets: () => gets,
    stop: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  };
}
