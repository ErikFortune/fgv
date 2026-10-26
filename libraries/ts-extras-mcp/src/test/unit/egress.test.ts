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
 * MCP egress through an injected `fetch` (personaility#672), against a real SDK Streamable-HTTP
 * server. Every request the session makes — each `POST`, the standalone `GET` event stream, the
 * termination `DELETE` — must go through the injected `fetch`, and a guarded fetch's refusal must
 * classify as `'egress-blocked'` wherever it lands.
 */

import '@fgv/ts-utils-jest';
import { type IncomingHttpHeaders, type Server, type ServerResponse, createServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { fail, Logging, succeed } from '@fgv/ts-utils';
import { SaferFetch } from '@fgv/ts-extras';

import {
  type IMcpSession,
  type McpFetch,
  callMcpTool,
  closeMcpSession,
  connectMcpSession,
  createHttpTransport,
  listMcpTools
} from '../../packlets/mcp';
import { type IRealMcpServer, startRealMcpServer, startRechunkingProxy, waitFor } from './realHttpServer';

/** A loopback MCP server is private, so the recommended guard is told to allow exactly that. */
const LOOPBACK_ALLOWED: SaferFetch.IAddressGuard = SaferFetch.blockPrivateNetworks({
  allowLoopback: true,
  allowInsecureHttp: true
});

interface ICountingFetch {
  readonly fetch: McpFetch;
  /** The method of every request that went through `fetch`, in order. */
  readonly methods: string[];
}

function counting(inner: McpFetch): ICountingFetch {
  const methods: string[] = [];
  return {
    methods,
    fetch: (url, init) => {
      methods.push((init?.method ?? 'GET').toUpperCase());
      return inner(url, init);
    }
  };
}

/** A request guard refusing whatever `refuses` says, at the moment of the request. */
function switchableRequestGuard(refuses: (method: string) => boolean): SaferFetch.IRequestGuard {
  return {
    name: 'switchable',
    check: async (request) => (refuses(request.method) ? fail('refused by test') : succeed(request))
  };
}

function guardedFetch(options?: Partial<SaferFetch.IGuardedFetchOptions>): McpFetch {
  return SaferFetch.createGuardedFetch({ addressGuard: LOOPBACK_ALLOWED, ...options }).orThrow();
}

describe('Streamable-HTTP egress through an injected fetch', () => {
  let real: IRealMcpServer;
  /** Sessions a test opened; each is closed after the test, which is a no-op if it already was. */
  let sessions: IMcpSession[];

  beforeEach(async () => {
    real = await startRealMcpServer();
    sessions = [];
  });

  afterEach(async () => {
    await Promise.all(sessions.map((s) => closeMcpSession(s)));
    await real.stop();
  });

  async function connectWith(fetch: McpFetch, logger?: Logging.ILogger): Promise<IMcpSession> {
    const connected = (
      await connectMcpSession({ transport: createHttpTransport({ url: real.url, fetch }).orThrow(), logger })
    ).orThrow();
    sessions.push(connected);
    return connected;
  }

  test('every request kind — POST, the standalone GET and the termination DELETE — goes through it', async () => {
    const counter = counting(guardedFetch());
    const connected = await connectWith(counter.fetch);
    await waitFor(() => counter.methods.includes('GET'));
    expect(await listMcpTools(connected)).toSucceed();
    expect(await callMcpTool(connected, 'echo', {})).toSucceed();
    expect(await closeMcpSession(connected)).toSucceedWith(true);

    expect(counter.methods.filter((m) => m === 'POST').length).toBeGreaterThanOrEqual(4);
    expect(counter.methods.filter((m) => m === 'GET')).toHaveLength(1);
    expect(counter.methods.filter((m) => m === 'DELETE')).toHaveLength(1);
    // Nothing reached the server except through the injected fetch.
    expect([...real.methods].sort()).toEqual([...counter.methods].sort());
    expect(real.closedSessions).toEqual(['session-1']);
  });

  test('an unguarded consumer fetch is used as given', async () => {
    const counter = counting((url, init) => globalThis.fetch(url, init));
    const connected = await connectWith(counter.fetch);
    expect(await callMcpTool(connected, 'echo', {})).toSucceed();
    expect(counter.methods).toContain('POST');
  });

  test('a refusal on connect classifies as egress-blocked, and nothing reaches the server', async () => {
    // The default guard refuses loopback, which is what the test server is on.
    const fetch = SaferFetch.createGuardedFetch({
      addressGuard: SaferFetch.blockPrivateNetworks()
    }).orThrow();
    const result = await connectMcpSession({
      transport: createHttpTransport({ url: real.url, fetch }).orThrow()
    });
    expect(result).toFailWithDetail(/connectMcpSession: guarded fetch failed: blocked-by-guard/, {
      kind: 'egress-blocked',
      reason: 'blocked-by-guard'
    });
    // The message names the kind only, never the address or the guard's detail.
    expect(result.message).not.toMatch(/127\.0\.0\.1|loopback/);
    expect(real.methods).toEqual([]);
  });

  test.each([
    ['an SSE', false],
    ['a JSON', true]
  ])(
    "a guarded fetch's maxResponseBytes, tripped by %s response's declared Content-Length, classifies as egress-blocked too-large",
    async (__label, enableJsonResponse) => {
      const server = await startRealMcpServer(undefined, { enableJsonResponse });
      try {
        const fetch = guardedFetch({ maxResponseBytes: 50 });
        const result = await connectMcpSession({
          transport: createHttpTransport({ url: server.url, fetch }).orThrow(),
          timeoutMs: 5000
        });
        expect(result).toFailWithDetail(/connectMcpSession: .*exceeded maxResponseBytes \(50 bytes\)/, {
          kind: 'egress-blocked',
          reason: 'too-large'
        });
      } finally {
        await server.stop();
      }
    }
  );

  test.each([
    ['an SSE', false],
    ['a JSON', true]
  ])(
    "a guarded fetch's maxResponseBytes, tripped mid-body by %s answer with no Content-Length, fails the request promptly as egress-blocked too-large",
    async (__label, enableJsonResponse) => {
      // ~250 tools of ~250 bytes each: a tools/list answer far over the cap, sent in 256-byte writes
      // with no Content-Length, so only the count during the read can catch it.
      const server = await startRealMcpServer(undefined, { enableJsonResponse, bulkTools: 250 });
      const proxy = await startRechunkingProxy(server.url);
      const logger = new Logging.InMemoryLogger('all');
      try {
        const session = (
          await connectMcpSession({
            transport: createHttpTransport({ url: proxy.url, fetch: guardedFetch({ maxResponseBytes: 4096 }) }).orThrow(),
            timeoutMs: 5000,
            logger
          })
        ).orThrow();
        sessions.push(session);
        const started = Date.now();
        expect(await listMcpTools(session, { timeoutMs: 10000 })).toFailWithDetail(
          /listMcpTools: .*exceeded maxResponseBytes \(4096 bytes\)/,
          { kind: 'egress-blocked', reason: 'too-large' }
        );
        // Promptly: not the 10 s request timeout.
        expect(Date.now() - started).toBeLessThan(5000);
        // The session is still usable, as after any other egress refusal.
        expect(await callMcpTool(session, 'echo', {})).toSucceed();
      } finally {
        await proxy.stop();
        await server.stop();
      }
    }
  );

  test("an answer over the cap on a resumed (Last-Event-ID) GET fails its request promptly as egress-blocked too-large", async () => {
    // The server closes the POST's stream before answering; the SDK resumes it with a GET carrying
    // Last-Event-ID, and the 20 000-character answer arrives there.
    const server = await startRealMcpServer(undefined, { resumable: true });
    try {
      const session = (
        await connectMcpSession({
          transport: createHttpTransport({ url: server.url, fetch: guardedFetch({ maxResponseBytes: 4096 }) }).orThrow(),
          timeoutMs: 5000
        })
      ).orThrow();
      sessions.push(session);
      const started = Date.now();
      expect(await callMcpTool(session, 'polled', {}, { timeoutMs: 15000 })).toFailWithDetail(
        /callMcpTool 'polled': .*exceeded maxResponseBytes \(4096 bytes\)/,
        { kind: 'egress-blocked', reason: 'too-large' }
      );
      expect(Date.now() - started).toBeLessThan(8000);
      expect(await callMcpTool(session, 'echo', {})).toSucceed();
    } finally {
      await server.stop();
    }
  }, 20000);

  test("an over-cap standalone event stream is logged at detail and reconnected, and the session keeps working", async () => {
    const proxy = await startRechunkingProxy(real.url, { getStream: { size: 500, count: 100, everyMs: 5 } });
    const logger = new Logging.InMemoryLogger('all');
    try {
      const session = (
        await connectMcpSession({
          transport: createHttpTransport({ url: proxy.url, fetch: guardedFetch({ maxResponseBytes: 4096 }) }).orThrow(),
          timeoutMs: 5000,
          logger
        })
      ).orThrow();
      sessions.push(session);
      await waitFor(() => proxy.gets() >= 2);
      // Each overflow ends that one connection; the SDK opens a fresh one, with a fresh count.
      expect(proxy.gets()).toBeGreaterThanOrEqual(2);
      expect(logger.logged.join('\n')).toMatch(
        /mcp: the server event stream exceeded the egress guard's maxResponseBytes \(4096 bytes\)/
      );
      expect(await callMcpTool(session, 'echo', {})).toSucceed();
    } finally {
      await proxy.stop();
    }
  });

  test("a guarded fetch's maxResponseBytes above every response leaves the session working", async () => {
    const session = await connectWith(guardedFetch({ maxResponseBytes: 64 * 1024 }));
    expect(await listMcpTools(session)).toSucceed();
    expect(await callMcpTool(session, 'echo', {})).toSucceedAndSatisfy((called) => {
      expect(called.content).toBe('echoed');
    });
  });

  test('a refusal on a call classifies as egress-blocked, and the session stays usable', async () => {
    let refusing = false;
    const connected = await connectWith(
      guardedFetch({ requestGuard: switchableRequestGuard((method) => refusing && method === 'POST') })
    );
    refusing = true;
    expect(await callMcpTool(connected, 'echo', {})).toFailWithDetail(
      /guarded fetch failed: blocked-by-guard/,
      {
        kind: 'egress-blocked',
        reason: 'blocked-by-guard'
      }
    );
    expect(await listMcpTools(connected)).toFailWithDetail(/blocked-by-guard/, {
      kind: 'egress-blocked',
      reason: 'blocked-by-guard'
    });
    refusing = false;
    expect(await callMcpTool(connected, 'echo', {})).toSucceed();
  });

  test('a refused DELETE is logged as egress-blocked and the close still resolves promptly', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const connected = await connectWith(
      guardedFetch({ requestGuard: switchableRequestGuard((method) => method === 'DELETE') }),
      logger
    );
    expect(await closeMcpSession(connected)).toSucceedWith(true);
    // Promptly: the close ended on the refusal, not on the termination bound running out.
    expect(logger.logged.join('\n')).not.toMatch(/did not finish within/);
    expect(logger.logged).toContainEqual(
      expect.stringMatching(
        /session termination failed; closing anyway \(egress-blocked\): guarded fetch failed/
      )
    );
    // Refused before the wire: the server never saw a DELETE, and its session stays open.
    expect(real.methods).not.toContain('DELETE');
    expect(real.closedSessions).toEqual([]);
  });

  test('a refused standalone GET is logged by kind, and calls still work', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const connected = await connectWith(
      guardedFetch({ requestGuard: switchableRequestGuard((method) => method === 'GET') }),
      logger
    );
    await waitFor(() => logger.logged.some((line) => /event stream was refused/.test(line)));
    expect(logger.logged).toContainEqual(
      'mcp: the server event stream was refused by the egress guard (blocked-by-guard)'
    );
    expect(await callMcpTool(connected, 'echo', {})).toSucceed();
    expect(real.methods).not.toContain('GET');
  });

  test("a slow tool on a JSON-response server outlives the guarded fetch's headers deadline: timeout, not transport", async () => {
    // In JSON-response mode the server holds the POST's response headers until the tool is done, so
    // the guarded fetch's headersTimeoutMs — not callMcpTool's timeoutMs — is what bounds the call.
    const slow = await startRealMcpServer(undefined, { enableJsonResponse: true, slowToolMs: 400 });
    try {
      const tight = (
        await connectMcpSession({
          transport: createHttpTransport({
            url: slow.url,
            fetch: guardedFetch({ headersTimeoutMs: 150 })
          }).orThrow()
        })
      ).orThrow();
      sessions.push(tight);
      expect(await callMcpTool(tight, 'slow', {}, { timeoutMs: 60000 })).toFailWithDetail(
        /guarded fetch failed: timeout/,
        { kind: 'timeout' }
      );
      // Sized to the longest request timeout, the same server and tool succeed.
      const sized = (
        await connectMcpSession({
          transport: createHttpTransport({
            url: slow.url,
            fetch: guardedFetch({ headersTimeoutMs: 5000 })
          }).orThrow()
        })
      ).orThrow();
      sessions.push(sized);
      expect(await callMcpTool(sized, 'slow', {}, { timeoutMs: 5000 })).toSucceed();
    } finally {
      await Promise.all(sessions.splice(0).map((s) => closeMcpSession(s)));
      await slow.stop();
    }
  });

  test("a guarded fetch's network failure is a transport failure, not a refusal", async () => {
    const gone = await startRealMcpServer();
    await gone.stop();
    const result = await connectMcpSession({
      transport: createHttpTransport({ url: gone.url, fetch: guardedFetch() }).orThrow()
    });
    expect(result).toFailWithDetail(/guarded fetch failed: network/, { kind: 'transport' });
  });

  test("a refused standalone GET with no session logger is still only the SDK's to report", async () => {
    const counter = counting(
      guardedFetch({ requestGuard: switchableRequestGuard((method) => method === 'GET') })
    );
    const connected = await connectWith(counter.fetch);
    await waitFor(() => counter.methods.includes('GET'));
    expect(await callMcpTool(connected, 'echo', {})).toSucceed();
  });

  test('an unguarded fetch failing on the standalone GET is not reported as a refusal', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const counter = counting((url, init) =>
      init?.method === 'GET' ? Promise.reject(new TypeError('fetch failed')) : globalThis.fetch(url, init)
    );
    const connected = await connectWith(counter.fetch, logger);
    await waitFor(() => counter.methods.includes('GET'));
    expect(await callMcpTool(connected, 'echo', {})).toSucceed();
    expect(logger.logged.join('\n')).not.toMatch(/refused/);
  });

  test('createHttpTransport refuses a fetch that is not a function', () => {
    expect(
      createHttpTransport({ url: 'https://example.com/mcp', fetch: 'nope' as unknown as McpFetch })
    ).toFailWith(/createHttpTransport: fetch must be a function \(got string\)/);
  });
});

describe('static headers and redirects through globalThis.fetch', () => {
  /** A loopback server answering every request with `respond`, recording each request's headers. */
  async function listen(
    respond: (res: ServerResponse) => void
  ): Promise<{ server: Server; origin: string; seen: IncomingHttpHeaders[] }> {
    const seen: IncomingHttpHeaders[] = [];
    const server = createServer((req, res) => {
      seen.push(req.headers);
      req.resume();
      respond(res);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    return { server, origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, seen };
  }

  const servers: Server[] = [];
  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise<void>((resolve) => {
            server.closeAllConnections();
            server.close(() => resolve());
          })
      )
    );
  });

  test('a 307 from the MCP origin to another origin is refused, and the static header never reaches it', async () => {
    const other = await listen((res) => res.writeHead(500).end());
    const mcp = await listen((res) => res.writeHead(307, { location: `${other.origin}/elsewhere` }).end());
    servers.push(other.server, mcp.server);

    // Control: without static headers the platform follows the redirect, so the other origin is
    // reachable and would see whatever the request carried.
    await connectMcpSession({
      transport: createHttpTransport({ url: `${mcp.origin}/mcp` }).orThrow(),
      timeoutMs: 2000
    });
    expect(other.seen.length).toBeGreaterThan(0);
    other.seen.length = 0;

    const connected = await connectMcpSession({
      transport: createHttpTransport({
        url: `${mcp.origin}/mcp`,
        headers: { 'x-api-key': 'k-static-3e9a' }
      }).orThrow(),
      timeoutMs: 2000
    });
    expect(connected).toFail();
    expect(mcp.seen.map((headers) => headers['x-api-key'])).toContain('k-static-3e9a');
    expect(other.seen).toEqual([]);
  });
});
