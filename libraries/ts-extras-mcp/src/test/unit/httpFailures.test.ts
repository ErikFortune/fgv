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
 * HTTP-status classification through the REAL Streamable-HTTP client transport, against a minimal
 * loopback HTTP server that speaks just enough MCP to complete (or refuse) the handshake. This is
 * what proves the `'connect'` / `'session'` phase split: the same HTTP 404 is `transport` when the
 * endpoint does not exist, and `session-expired` when an established session is no longer known.
 */

import '@fgv/ts-utils-jest';
import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http';
import { type AddressInfo } from 'node:net';

import {
  type IMcpSession,
  callMcpTool,
  closeMcpSession,
  connectMcpSession,
  createHttpTransport
} from '../../packlets/mcp';

/** How the fixture answers a POST that is not part of the handshake. */
type Mode = 'refuse-all' | 'missing-endpoint' | 'expire-session' | 'server-error';

interface IJsonRpcMessage {
  readonly id?: number;
  readonly method?: string;
  readonly params?: { readonly protocolVersion?: string };
}

function readBody(req: IncomingMessage): Promise<IJsonRpcMessage> {
  return new Promise((resolve) => {
    let text = '';
    req.on('data', (chunk: Buffer) => {
      text += chunk.toString('utf8');
    });
    req.on('end', () => resolve(JSON.parse(text) as IJsonRpcMessage));
  });
}

async function handle(mode: Mode, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    // No standalone SSE stream; the SDK client treats 405 as "not offered".
    res.writeHead(405).end();
    return;
  }
  const message = await readBody(req);
  if (mode === 'refuse-all') {
    res.writeHead(401).end('missing or invalid bearer token');
    return;
  }
  if (mode === 'missing-endpoint') {
    res.writeHead(404).end('no such endpoint');
    return;
  }
  if (message.method === 'initialize') {
    res.writeHead(200, { 'content-type': 'application/json', 'mcp-session-id': 'session-1' }).end(
      JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: message.params?.protocolVersion,
          capabilities: { tools: {} },
          serverInfo: { name: 'http-fixture', version: '0.0.1' }
        }
      })
    );
    return;
  }
  if (message.id === undefined) {
    res.writeHead(202).end();
    return;
  }
  res.writeHead(mode === 'expire-session' ? 404 : 500).end('Session not found');
}

async function startHttpFixture(mode: Mode): Promise<{ server: Server; url: string }> {
  const server = createServer((req, res) => {
    handle(mode, req, res).catch(() => res.writeHead(500).end());
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return { server, url: `http://127.0.0.1:${port}/mcp` };
}

async function connectTo(url: string): ReturnType<typeof connectMcpSession> {
  return connectMcpSession({ transport: createHttpTransport({ url }).orThrow() });
}

describe('HTTP-status classification over the real Streamable-HTTP transport', () => {
  let server: Server | undefined;
  let session: IMcpSession | undefined;

  afterEach(async () => {
    const toClose = session;
    session = undefined;
    if (toClose !== undefined) {
      await closeMcpSession(toClose);
    }
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  });

  test('a refused credential at connect is unauthorized, carrying the status', async () => {
    const fixture = await startHttpFixture('refuse-all');
    server = fixture.server;
    expect(await connectTo(fixture.url)).toFailWithDetail(
      /^connectMcpSession: .*missing or invalid bearer token/,
      {
        kind: 'unauthorized',
        status: 401
      }
    );
  });

  test('a 404 during the handshake is transport — there is no session to have expired', async () => {
    const fixture = await startHttpFixture('missing-endpoint');
    server = fixture.server;
    expect(await connectTo(fixture.url)).toFailWithDetail(/^connectMcpSession: .*no such endpoint/, {
      kind: 'transport',
      status: 404
    });
  });

  test('a 404 on an established session is session-expired', async () => {
    const fixture = await startHttpFixture('expire-session');
    server = fixture.server;
    session = (await connectTo(fixture.url)).orThrow();
    expect(await callMcpTool(session, 'echo', {})).toFailWithDetail(
      /^callMcpTool 'echo': .*Session not found/,
      {
        kind: 'session-expired'
      }
    );
  });

  test('any other HTTP failure on an established session is transport, carrying the status', async () => {
    const fixture = await startHttpFixture('server-error');
    server = fixture.server;
    session = (await connectTo(fixture.url)).orThrow();
    expect(await callMcpTool(session, 'echo', {})).toFailWithDetail(/^callMcpTool 'echo':/, {
      kind: 'transport',
      status: 500
    });
  });
});
