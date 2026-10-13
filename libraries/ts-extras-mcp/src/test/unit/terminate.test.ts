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
 * Session termination on close (personaility#674), through the REAL Streamable-HTTP client
 * transport. Two kinds of server: the SDK's own `StreamableHTTPServerTransport` behind `node:http`,
 * which proves the `DELETE` really ends the server's session; and a loopback fixture that answers
 * the handshake and then misbehaves on the `DELETE` (405, never answers, drops the connection,
 * 500), which proves the close stays bounded. Every bounded case is checked with a timing, not only
 * with success.
 */

import '@fgv/ts-utils-jest';
import { randomUUID } from 'node:crypto';
import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { Logging } from '@fgv/ts-utils';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import {
  type IMcpSession,
  type IMcpTransport,
  closeMcpSession,
  connectMcpSession,
  createCustomTransport,
  createHttpTransport
} from '../../packlets/mcp';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { TERMINATE_TIMEOUT_MS } from '../../packlets/mcp/session';

/** How the fixture answers the `DELETE`. */
type DeleteMode = 'ok' | 'not-allowed' | 'never' | 'drop' | 'server-error';

interface IFixture {
  readonly server: Server;
  url: string;
  /** The `mcp-session-id` header of every `DELETE` received, in order. */
  readonly deletes: Array<string | undefined>;
  /** Resolves when the client abandons a `DELETE` the fixture is holding open. */
  heldDeleteClosed: Promise<void>;
}

function readBody(req: IncomingMessage): Promise<{ id?: number; method?: string; params?: unknown }> {
  return new Promise((resolve) => {
    let text = '';
    req.on('data', (chunk: Buffer) => {
      text += chunk.toString('utf8');
    });
    req.on('end', () => resolve(JSON.parse(text)));
  });
}

async function handle(
  fixture: IFixture,
  mode: DeleteMode,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method === 'GET') {
    // No standalone SSE stream; the SDK client treats 405 as "not offered".
    res.writeHead(405).end();
    return;
  }
  if (req.method === 'DELETE') {
    const header = req.headers['mcp-session-id'];
    fixture.deletes.push(typeof header === 'string' ? header : undefined);
    switch (mode) {
      case 'ok':
        res.writeHead(200).end();
        return;
      case 'not-allowed':
        res.writeHead(405).end();
        return;
      case 'server-error':
        res.writeHead(500).end();
        return;
      case 'drop':
        req.socket.destroy();
        return;
      case 'never':
        fixture.heldDeleteClosed = new Promise<void>((resolve) => res.on('close', () => resolve()));
        return;
    }
  }
  const message = await readBody(req);
  if (message.method === 'initialize') {
    const params = message.params as { protocolVersion?: string };
    res.writeHead(200, { 'content-type': 'application/json', 'mcp-session-id': 'session-1' }).end(
      JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: params.protocolVersion,
          capabilities: { tools: {} },
          serverInfo: { name: 'terminate-fixture', version: '0.0.1' }
        }
      })
    );
    return;
  }
  res.writeHead(202).end();
}

async function startFixture(mode: DeleteMode): Promise<IFixture> {
  const fixture: IFixture = {
    server: createServer((req, res) => {
      handle(fixture, mode, req, res).catch(() => res.writeHead(500).end());
    }),
    url: '',
    deletes: [],
    heldDeleteClosed: Promise.resolve()
  };
  await new Promise<void>((resolve) => fixture.server.listen(0, '127.0.0.1', resolve));
  const { port } = fixture.server.address() as AddressInfo;
  fixture.url = `http://127.0.0.1:${port}/mcp`;
  return fixture;
}

async function stop(server: Server | undefined): Promise<void> {
  if (server !== undefined) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

/** Closes `session` and measures how long the close took. */
async function timedClose(
  session: IMcpSession
): Promise<{ result: Awaited<ReturnType<typeof closeMcpSession>>; ms: number }> {
  const started = Date.now();
  const result = await closeMcpSession(session);
  return { result, ms: Date.now() - started };
}

/** Comfortably above a loopback round trip, and well under the termination bound. */
const PROMPT_MS: number = 1000;

describe('closeMcpSession terminates a Streamable-HTTP session', () => {
  let fixture: IFixture | undefined;
  let httpServer: Server | undefined;

  afterEach(async () => {
    const toStop = [fixture?.server, httpServer];
    fixture = undefined;
    httpServer = undefined;
    await Promise.all(toStop.map(stop));
  });

  async function connectToFixture(
    mode: DeleteMode,
    logger?: Logging.ILogger
  ): Promise<{ session: IMcpSession; closes: jest.Mock }> {
    const started = await startFixture(mode);
    fixture = started;
    const closes = jest.fn();
    const session = (
      await connectMcpSession({
        transport: createHttpTransport({ url: started.url }).orThrow(),
        onClose: closes,
        logger
      })
    ).orThrow();
    return { session, closes };
  }

  test('the DELETE ends the session on a real SDK server, and the close stays prompt', async () => {
    const closedOnServer: string[] = [];
    const transports = new Map<string, StreamableHTTPServerTransport>();
    httpServer = createServer((req, res) => {
      const id = req.headers['mcp-session-id'];
      const existing = typeof id === 'string' ? transports.get(id) : undefined;
      if (existing !== undefined) {
        existing.handleRequest(req, res).catch(() => res.writeHead(500).end());
        return;
      }
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports.set(sessionId, transport);
        },
        onsessionclosed: (sessionId) => {
          closedOnServer.push(sessionId);
        }
      });
      const server = new McpServer({ name: 'real-http', version: '1.0.0' });
      server
        .connect(transport)
        .then(() => transport.handleRequest(req, res))
        .catch(() => res.writeHead(500).end());
    });
    await new Promise<void>((resolve) => httpServer!.listen(0, '127.0.0.1', resolve));
    const { port } = httpServer.address() as AddressInfo;

    const closes = jest.fn();
    const session = (
      await connectMcpSession({
        transport: createHttpTransport({ url: `http://127.0.0.1:${port}/mcp` }).orThrow(),
        onClose: closes
      })
    ).orThrow();
    expect(transports.size).toBe(1);
    const [sessionId] = [...transports.keys()];

    const { result, ms } = await timedClose(session);
    expect(result).toSucceedWith(true);
    expect(closedOnServer).toEqual([sessionId]);
    expect(closes).toHaveBeenCalledTimes(1);
    expect(ms).toBeLessThan(PROMPT_MS);
  });

  test('a successful DELETE carries the session id, and a second close sends no second DELETE', async () => {
    const { session, closes } = await connectToFixture('ok');
    expect(await closeMcpSession(session)).toSucceedWith(true);
    expect(await closeMcpSession(session)).toSucceedWith(true);
    expect(fixture!.deletes).toEqual(['session-1']);
    expect(closes).toHaveBeenCalledTimes(1);
  });

  test('concurrent closes share one DELETE', async () => {
    const { session, closes } = await connectToFixture('ok');
    const results = await Promise.all([closeMcpSession(session), closeMcpSession(session)]);
    results.forEach((result) => expect(result).toSucceedWith(true));
    expect(fixture!.deletes).toEqual(['session-1']);
    expect(closes).toHaveBeenCalledTimes(1);
  });

  test('a 405 answer is not a failure: the close is prompt, unlogged, and onClose fires once', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const { session, closes } = await connectToFixture('not-allowed', logger);
    const { result, ms } = await timedClose(session);
    expect(result).toSucceedWith(true);
    expect(fixture!.deletes).toEqual(['session-1']);
    expect(ms).toBeLessThan(PROMPT_MS);
    expect(closes).toHaveBeenCalledTimes(1);
    expect(logger.logged.join('\n')).not.toMatch(/termination/);
  });

  test('a server that never answers holds the close for the bound and no longer; the DELETE is aborted', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const { session, closes } = await connectToFixture('never', logger);
    const { result, ms } = await timedClose(session);
    expect(result).toSucceedWith(true);
    expect(fixture!.deletes).toEqual(['session-1']);
    expect(ms).toBeGreaterThanOrEqual(TERMINATE_TIMEOUT_MS - 50);
    expect(ms).toBeLessThan(TERMINATE_TIMEOUT_MS + PROMPT_MS);
    expect(closes).toHaveBeenCalledTimes(1);
    // The close that followed the bound aborted the DELETE the server was holding.
    await fixture!.heldDeleteClosed;
    expect(logger.logged.join('\n')).toMatch(/termination did not finish within 2000 ms/);
  }, 10000);

  test('a dropped connection does not fail or delay the close, and is logged once at detail', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const { session, closes } = await connectToFixture('drop', logger);
    const { result, ms } = await timedClose(session);
    expect(result).toSucceedWith(true);
    expect(ms).toBeLessThan(PROMPT_MS);
    expect(closes).toHaveBeenCalledTimes(1);
    const lines = logger.logged.filter((line) => /termination/.test(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/session termination failed; closing anyway/);
  });

  test('a termination failure is logged at detail and never at warning or above', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const detail = jest.spyOn(logger, 'detail');
    const louder = [jest.spyOn(logger, 'info'), jest.spyOn(logger, 'warn'), jest.spyOn(logger, 'error')];
    const { session, closes } = await connectToFixture('server-error', logger);
    louder.forEach((spy) => spy.mockClear());
    const { result, ms } = await timedClose(session);
    expect(result).toSucceedWith(true);
    expect(ms).toBeLessThan(PROMPT_MS);
    expect(closes).toHaveBeenCalledTimes(1);
    expect(detail).toHaveBeenCalledWith(
      expect.stringMatching(/session termination failed.*Internal Server Error/)
    );
    louder.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  test('with no logger, a failed or silent DELETE still leaves the close bounded and successful', async () => {
    const failing = await connectToFixture('server-error');
    expect(await closeMcpSession(failing.session)).toSucceedWith(true);
    await stop(fixture?.server);
    const silent = await connectToFixture('never');
    const { result, ms } = await timedClose(silent.session);
    expect(result).toSucceedWith(true);
    expect(ms).toBeLessThan(TERMINATE_TIMEOUT_MS + PROMPT_MS);
    expect(silent.closes).toHaveBeenCalledTimes(1);
  }, 10000);

  test('a custom transport is closed exactly as before, with no DELETE, even when it speaks HTTP', async () => {
    const { session: first } = await connectToFixture('ok');
    await closeMcpSession(first);
    fixture!.deletes.length = 0;
    const custom: IMcpTransport = createCustomTransport(
      new StreamableHTTPClientTransport(new URL(fixture!.url))
    ).orThrow();
    const closes = jest.fn();
    const session = (await connectMcpSession({ transport: custom, onClose: closes })).orThrow();
    expect(await closeMcpSession(session)).toSucceedWith(true);
    expect(fixture!.deletes).toEqual([]);
    expect(closes).toHaveBeenCalledTimes(1);
  });
});
