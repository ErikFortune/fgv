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
 * OAuth 2.1 through `authProvider` (personaility#677), end to end over real HTTP. The protected
 * MCP server is the SDK's own Streamable-HTTP server behind the SDK's own `requireBearerAuth`
 * middleware (adapted from Express to `node:http` by a three-method shim). The authorization server
 * is a minimal local one on a second origin — the SDK's authorization-server handlers are Express
 * routers this package cannot import — serving RFC 8414 metadata and a token endpoint.
 */

import '@fgv/ts-utils-jest';
import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { Logging, fail, succeed } from '@fgv/ts-utils';
import { SaferFetch } from '@fgv/ts-extras';

import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { type OAuthClientMetadata, type OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';

import {
  type IMcpSession,
  type McpFailureReason,
  type McpFetch,
  type McpOAuthClientProvider,
  callMcpTool,
  closeMcpSession,
  connectMcpSession,
  createHttpTransport
} from '../../packlets/mcp';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { McpHttpEgress, acceptResourceMetadataUrl } from '../../packlets/mcp/egress';
import { type IRealMcpServer, startRealMcpServer, waitFor } from './realHttpServer';

// Every secret the flows handle. None may appear in a log line or a failure message.
const CLIENT_ID: string = 'client-7f3a';
const CLIENT_SECRET: string = 'csecret-91b2e6';
const ACCESS_TOKEN: string = 'atoken-4c1d88';
const REFRESHED_TOKEN: string = 'atoken-refreshed-a0b9';
const REFRESH_TOKEN: string = 'rtoken-5e7f20';
const NEXT_REFRESH_TOKEN: string = 'rtoken-next-c3d4';
const STALE_TOKEN: string = 'atoken-stale-0d9e';
const API_KEY: string = 'apikey-static-77aa';
const SECRETS: ReadonlyArray<string> = [
  CLIENT_SECRET,
  ACCESS_TOKEN,
  REFRESHED_TOKEN,
  REFRESH_TOKEN,
  NEXT_REFRESH_TOKEN,
  STALE_TOKEN,
  API_KEY
];

const REDIRECT_URL: string = 'http://127.0.0.1:1/callback';

/**
 * An in-memory OAuth client provider, the shape a consumer implements over its keystore. Its state
 * is in private fields on purpose: the package's wrapper must call through with `this` bound to the
 * provider itself.
 */
class TestProvider implements McpOAuthClientProvider {
  public readonly redirects: URL[] = [];
  public readonly verifiers: string[] = [];
  public readonly saved: OAuthTokens[] = [];
  public tokenReads: number = 0;
  public stateCalls: number = 0;
  #tokens: OAuthTokens | undefined;

  public constructor(tokens: OAuthTokens | undefined) {
    this.#tokens = tokens;
  }

  public get redirectUrl(): string {
    return REDIRECT_URL;
  }

  public get clientMetadata(): OAuthClientMetadata {
    return { redirect_uris: [REDIRECT_URL], client_name: 'ts-extras-mcp test' };
  }

  public clientInformation(): { client_id: string; client_secret: string } {
    return { client_id: CLIENT_ID, client_secret: CLIENT_SECRET };
  }

  public state(): string {
    this.stateCalls++;
    return `state-${this.stateCalls}`;
  }

  public tokens(): OAuthTokens | undefined {
    this.tokenReads++;
    return this.#tokens;
  }

  public saveTokens(tokens: OAuthTokens): void {
    this.#tokens = tokens;
    this.saved.push(tokens);
  }

  public redirectToAuthorization(url: URL): void {
    this.redirects.push(url);
  }

  public saveCodeVerifier(verifier: string): void {
    this.verifiers.push(verifier);
  }

  public codeVerifier(): string {
    return this.verifiers[this.verifiers.length - 1] ?? '';
  }
}

interface IRecordedRequest {
  readonly method: string;
  readonly path: string;
  readonly headers: IncomingMessage['headers'];
  readonly body: string;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let text = '';
    req.on('data', (chunk: Buffer) => {
      text += chunk.toString('utf8');
    });
    req.on('end', () => resolve(text));
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));
}

/** A minimal authorization server: RFC 8414 metadata and a refresh-token grant. */
interface IAuthServer {
  readonly server: Server;
  readonly origin: string;
  readonly requests: IRecordedRequest[];
}

async function startAuthServer(): Promise<IAuthServer> {
  const requests: IRecordedRequest[] = [];
  let origin = '';
  const server = createServer((req, res) => {
    readBody(req)
      .then((body) => {
        const path = (req.url ?? '/').split('?')[0];
        requests.push({ method: req.method ?? '?', path, headers: req.headers, body });
        if (path === '/.well-known/oauth-authorization-server') {
          // Built from entries: the metadata's keys are snake_case by RFC 8414.
          sendJson(
            res,
            200,
            Object.fromEntries([
              ['issuer', origin],
              ['authorization_endpoint', `${origin}/authorize`],
              ['token_endpoint', `${origin}/token`],
              ['response_types_supported', ['code']],
              ['grant_types_supported', ['authorization_code', 'refresh_token']],
              ['code_challenge_methods_supported', ['S256']],
              ['token_endpoint_auth_methods_supported', ['client_secret_post']]
            ])
          );
          return;
        }
        if (path === '/token' && req.method === 'POST') {
          const form = new URLSearchParams(body);
          if (
            form.get('grant_type') === 'refresh_token' &&
            form.get('refresh_token') === REFRESH_TOKEN &&
            form.get('client_secret') === CLIENT_SECRET
          ) {
            sendJson(res, 200, {
              access_token: REFRESHED_TOKEN,
              token_type: 'Bearer',
              expires_in: 3600,
              refresh_token: NEXT_REFRESH_TOKEN
            });
            return;
          }
          // Echoes the refresh token back, as a careless server might: it must not surface.
          sendJson(res, 400, {
            error: 'invalid_grant',
            error_description: `refresh token ${form.get('refresh_token') ?? ''} is not valid`
          });
          return;
        }
        res.writeHead(404).end();
      })
      .catch(() => res.writeHead(500).end());
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { server, origin, requests };
}

/** What the protected MCP server accepts and records. */
interface IProtection {
  /** Access tokens currently accepted. */
  readonly valid: Set<string>;
  /** The `authorization` and `x-api-key` header of every MCP request, in order. */
  readonly seen: Array<{ method: string; authorization?: string; apiKey?: string }>;
  /** Standalone GET event streams that passed authorization, so a test can end them. */
  readonly streams: ServerResponse[];
  /** Overrides the `resource_metadata` value the challenge carries. */
  metadataOverride?: string;
  /** Answers every authorized `POST` with a 403 `insufficient_scope` challenge. */
  insufficientScope?: boolean;
  /** Answers every authorized `tools/call` with a 500 whose body echoes the request's credentials. */
  echoOn500?: boolean;
}

/** The three methods of Express's response that the SDK's `requireBearerAuth` uses. */
function expressShim(res: ServerResponse): {
  set: (n: string, v: string) => void;
  status: (c: number) => unknown;
} {
  const shim = {
    set: (name: string, value: string): void => {
      res.setHeader(name, value);
    },
    status: (code: number) => {
      res.statusCode = code;
      return { json: (body: unknown) => sendJson(res, code, body) };
    }
  };
  return shim;
}

async function startProtectedServer(auth: IAuthServer, protection: IProtection): Promise<IRealMcpServer> {
  const holder: { url: string } = { url: '' };
  const metadataPath = '/.well-known/oauth-protected-resource/mcp';
  const real = await startRealMcpServer(async (req, res) => {
    const origin = new URL(holder.url).origin;
    if (req.url === metadataPath) {
      sendJson(res, 200, { resource: holder.url, authorization_servers: [auth.origin] });
      return true;
    }
    protection.seen.push({
      method: req.method ?? '?',
      authorization: req.headers.authorization,
      apiKey: typeof req.headers['x-api-key'] === 'string' ? req.headers['x-api-key'] : undefined
    });
    const middleware = requireBearerAuth({
      verifier: {
        verifyAccessToken: async (token: string) => {
          if (!protection.valid.has(token)) {
            const { InvalidTokenError } = await import('@modelcontextprotocol/sdk/server/auth/errors.js');
            // The SDK's own error text, which a careless server might extend with the token.
            throw new InvalidTokenError(`token ${token} is not valid`);
          }
          return { token, clientId: CLIENT_ID, scopes: [], expiresAt: Date.now() / 1000 + 3600 };
        }
      },
      resourceMetadataUrl: protection.metadataOverride ?? `${origin}${metadataPath}`
    });
    let passed = false;
    await middleware(req as never, expressShim(res) as never, () => {
      passed = true;
    });
    if (passed && req.method === 'GET') {
      protection.streams.push(res);
    }
    if (passed && req.method === 'POST' && protection.insufficientScope === true) {
      res
        .writeHead(403, {
          'www-authenticate': `Bearer error="insufficient_scope", scope="more", resource_metadata="${origin}${metadataPath}"`
        })
        .end();
      return true;
    }
    if (passed && req.method === 'POST' && protection.echoOn500 === true) {
      // A careless debug echo: the whole request's credentials, back in an error body.
      res
        .writeHead(500, 'Server Error')
        .end(`failed: ${req.headers.authorization} ${String(req.headers['x-api-key'])}`);
      return true;
    }
    return !passed;
  });
  holder.url = real.url;
  return real;
}

describe('OAuth through authProvider', () => {
  let auth: IAuthServer;
  let real: IRealMcpServer;
  let protection: IProtection;
  let sessions: IMcpSession[];
  /**
   * Every log line, failure message and serialized `McpFailureReason` the tests produce: checked for
   * secrets at the end of each.
   */
  let observed: string[];
  let logger: Logging.InMemoryLogger;
  let fetchLogger: Logging.InMemoryLogger;

  beforeEach(async () => {
    auth = await startAuthServer();
    protection = { valid: new Set([ACCESS_TOKEN]), seen: [], streams: [] };
    real = await startProtectedServer(auth, protection);
    sessions = [];
    observed = [];
    logger = new Logging.InMemoryLogger('detail');
    fetchLogger = new Logging.InMemoryLogger('detail');
  });

  afterEach(async () => {
    await Promise.all(sessions.map((s) => closeMcpSession(s)));
    await real.stop();
    auth.server.closeAllConnections();
    await new Promise<void>((resolve) => auth.server.close(() => resolve()));
    // The secrets check, over every line and message this test produced.
    const text = [...observed, ...logger.logged, ...fetchLogger.logged].join('\n');
    for (const secret of SECRETS) {
      expect(text).not.toContain(secret);
    }
  });

  /** The recommended guarded fetch, allowing the loopback test servers. */
  function guarded(options?: Partial<SaferFetch.IGuardedFetchOptions>): McpFetch {
    return SaferFetch.createGuardedFetch({
      addressGuard: SaferFetch.blockPrivateNetworks({ allowLoopback: true, allowInsecureHttp: true }),
      logger: fetchLogger,
      ...options
    }).orThrow();
  }

  async function connect(
    provider: McpOAuthClientProvider | undefined,
    fetch: McpFetch = guarded()
  ): Promise<{ session?: IMcpSession; failure?: McpFailureReason; message?: string }> {
    const result = await connectMcpSession({
      transport: createHttpTransport({
        url: real.url,
        headers: { 'x-api-key': API_KEY },
        fetch,
        authProvider: provider
      }).orThrow(),
      logger
    });
    if (result.isSuccess()) {
      sessions.push(result.value);
      return { session: result.value };
    }
    observed.push(result.message, JSON.stringify(result.detail));
    return { failure: result.detail, message: result.message };
  }

  test('a valid token reaches the protected server on every request', async () => {
    const provider = new TestProvider({ access_token: ACCESS_TOKEN, token_type: 'Bearer' });
    const { session } = await connect(provider);
    const called = await callMcpTool(session!, 'echo', {});
    expect(called).toSucceed();
    await closeMcpSession(session!);
    expect(protection.seen.length).toBeGreaterThanOrEqual(3);
    for (const request of protection.seen) {
      expect(request.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
    }
    expect(provider.redirects).toEqual([]);
  });

  test('an expired token is refreshed through the guarded fetch; static headers never reach the authorization server', async () => {
    protection.valid.clear();
    protection.valid.add(REFRESHED_TOKEN);
    const provider = new TestProvider({
      access_token: STALE_TOKEN,
      token_type: 'Bearer',
      refresh_token: REFRESH_TOKEN
    });
    const { session } = await connect(provider);
    expect(session).toBeDefined();
    expect(await callMcpTool(session!, 'echo', {})).toSucceed();
    expect(provider.saved.map((t) => t.access_token)).toEqual([REFRESHED_TOKEN]);
    expect(provider.redirects).toEqual([]);
    // The authorization server was reached, and never saw the MCP server's static API key.
    expect(auth.requests.map((r) => r.path)).toContain('/token');
    for (const request of auth.requests) {
      expect(request.headers['x-api-key']).toBeUndefined();
    }
    // The MCP server did receive it.
    expect(protection.seen.every((r) => r.apiKey === API_KEY)).toBe(true);
  });

  test('a missing token at connect starts the interactive flow, and the connect fails unauthorized with the metadata URL', async () => {
    const provider = new TestProvider(undefined);
    const { failure, message } = await connect(provider);
    expect(failure).toEqual({
      kind: 'unauthorized',
      resourceMetadataUrl: `${new URL(real.url).origin}/.well-known/oauth-protected-resource/mcp`
    });
    expect(message).toBe('connectMcpSession: unauthorized');
    // Inside the consumer's connect, the interactive steps are forwarded.
    expect(provider.stateCalls).toBe(1);
    expect(provider.verifiers).toHaveLength(1);
    expect(provider.redirects).toHaveLength(1);
    expect(provider.redirects[0].origin).toBe(auth.origin);
    expect(provider.redirects[0].pathname).toBe('/authorize');
  });

  test('a refresh the authorization server refuses is unauthorized, and its echoed token never surfaces', async () => {
    protection.valid.clear();
    const provider = new TestProvider({
      access_token: STALE_TOKEN,
      token_type: 'Bearer',
      refresh_token: 'rtoken-unknown'
    });
    const { failure, message } = await connect(provider);
    expect(failure).toEqual(expect.objectContaining({ kind: 'unauthorized' }));
    expect(message).toBe('connectMcpSession: unauthorized');
  });

  test('without an authProvider, a 401 is unauthorized with the status and the metadata URL, and the body is not echoed', async () => {
    protection.valid.clear();
    const { failure, message } = await connect(undefined);
    expect(failure).toEqual({
      kind: 'unauthorized',
      status: 401,
      resourceMetadataUrl: `${new URL(real.url).origin}/.well-known/oauth-protected-resource/mcp`
    });
    expect(message).toBe('connectMcpSession: unauthorized (HTTP 401)');
  });

  test.each<{ label: string; value: string }>([
    { label: 'a data: URL', value: 'data:text/plain,meta' },
    { label: 'an ftp: URL', value: 'ftp://example.com/meta' },
    { label: 'not a URL', value: 'not a url' }
  ])('a resource_metadata that is $label is omitted', async ({ value }) => {
    protection.valid.clear();
    protection.metadataOverride = value;
    const { failure } = await connect(undefined);
    expect(failure).toEqual({ kind: 'unauthorized', status: 401 });
  });

  test('after connect, a token that cannot be refreshed fails a call unauthorized and never starts interactive authorization', async () => {
    const provider = new TestProvider({ access_token: ACCESS_TOKEN, token_type: 'Bearer' });
    const { session } = await connect(provider);
    protection.valid.clear();
    const called = await callMcpTool(session!, 'echo', {});
    observed.push(called.message ?? '', JSON.stringify(called.detail));
    expect(called).toFailWithDetail(/^callMcpTool 'echo': unauthorized$/, {
      kind: 'unauthorized',
      resourceMetadataUrl: `${new URL(real.url).origin}/.well-known/oauth-protected-resource/mcp`
    });
    expect(provider.stateCalls).toBe(0);
    expect(provider.verifiers).toEqual([]);
    expect(provider.redirects).toEqual([]);
  });

  test('the 403 insufficient_scope upscope path never starts interactive authorization', async () => {
    const provider = new TestProvider({ access_token: ACCESS_TOKEN, token_type: 'Bearer' });
    const { session } = await connect(provider);
    protection.insufficientScope = true;
    const called = await callMcpTool(session!, 'echo', {});
    observed.push(called.message ?? '', JSON.stringify(called.detail));
    expect(called).toFailWithDetail(/^callMcpTool 'echo': unauthorized$/, {
      kind: 'unauthorized',
      resourceMetadataUrl: `${new URL(real.url).origin}/.well-known/oauth-protected-resource/mcp`
    });
    expect(provider.stateCalls).toBe(0);
    expect(provider.verifiers).toEqual([]);
    expect(provider.redirects).toEqual([]);
  });

  test('a non-401 error whose body echoes the credentials never surfaces them', async () => {
    const provider = new TestProvider({ access_token: ACCESS_TOKEN, token_type: 'Bearer' });
    const { session } = await connect(provider);
    protection.echoOn500 = true;
    const called = await callMcpTool(session!, 'echo', {});
    observed.push(called.message ?? '', JSON.stringify(called.detail));
    expect(called).toFailWithDetail(/^callMcpTool 'echo': transport \(HTTP 500\)$/, {
      kind: 'transport',
      status: 500
    });
  });

  test("the SDK's background reconnect of the event stream never starts interactive authorization", async () => {
    const provider = new TestProvider({ access_token: ACCESS_TOKEN, token_type: 'Bearer' });
    await connect(provider);
    await waitFor(() => protection.streams.length === 1);
    // The token is revoked, and the server ends the stream: the SDK reconnects it on its own timer,
    // gets a 401, and runs its auth flow — a path no call of the consumer's started.
    protection.valid.clear();
    const getsBefore = protection.seen.filter((r) => r.method === 'GET').length;
    protection.streams[0].end();
    await waitFor(() => protection.seen.filter((r) => r.method === 'GET').length > getsBefore, 5000);
    // Discovery runs as part of that flow; give it time to reach the interactive step.
    await waitFor(() => auth.requests.length > 0, 2000);
    await new Promise((resolve) => setTimeout(resolve, 200));
    // The SDK's auth flow did run — discovery reached the authorization server — and stopped at the
    // interactive step.
    expect(auth.requests.map((r) => r.path)).toContain('/.well-known/oauth-authorization-server');
    expect(provider.stateCalls).toBe(0);
    expect(provider.verifiers).toEqual([]);
    expect(provider.redirects).toEqual([]);
  }, 10000);

  test('closing never authorizes: a 401 on the DELETE is logged by kind and the close resolves promptly', async () => {
    const provider = new TestProvider({ access_token: ACCESS_TOKEN, token_type: 'Bearer' });
    const { session } = await connect(provider);
    protection.valid.clear();
    const started = Date.now();
    expect(await closeMcpSession(session!)).toSucceedWith(true);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(logger.logged).toContainEqual(
      'mcp: session termination failed; closing anyway (unauthorized): unauthorized (HTTP 401)'
    );
    expect(provider.verifiers).toEqual([]);
    expect(provider.redirects).toEqual([]);
    expect(auth.requests).toEqual([]);
  });

  test('the guard covers the authorization server the MCP server names', async () => {
    protection.valid.clear();
    const authOrigin = auth.origin;
    const fetch = guarded({
      requestGuard: {
        name: 'mcp-server-only',
        check: async (request) =>
          request.url.origin === authOrigin ? fail('not the MCP server') : succeed(request)
      }
    });
    const provider = new TestProvider({
      access_token: STALE_TOKEN,
      token_type: 'Bearer',
      refresh_token: REFRESH_TOKEN
    });
    const { failure, message } = await connect(provider, fetch);
    expect(failure).toEqual({ kind: 'egress-blocked', reason: 'blocked-by-guard' });
    expect(message).toBe('connectMcpSession: guarded fetch failed: blocked-by-guard');
    expect(auth.requests).toEqual([]);
  });
});

describe('McpHttpEgress edges', () => {
  const ENDPOINT = new URL('https://mcp.example.com/mcp');

  test('acceptResourceMetadataUrl keeps only an http(s) URL on one printable line', () => {
    expect(acceptResourceMetadataUrl(new URL('https://as.example.com/meta'))).toBe(
      'https://as.example.com/meta'
    );
    expect(acceptResourceMetadataUrl(new URL('http://as.example.com/meta'))).toBe(
      'http://as.example.com/meta'
    );
    expect(acceptResourceMetadataUrl(new URL('ftp://as.example.com/meta'))).toBeUndefined();
    expect(acceptResourceMetadataUrl(undefined)).toBeUndefined();
    // The WHATWG serializer never produces this; the check does not rely on that.
    const forged = { protocol: 'https:', href: 'https://as.example.com/a\nb' } as unknown as URL;
    expect(acceptResourceMetadataUrl(forged)).toBeUndefined();
  });

  test('a challenge whose headers cannot be read leaves no URL and does not fail the request', async () => {
    const unreadable = new Proxy(new Response(null, { status: 401 }), {
      get: (target: Response, prop: string | symbol): unknown => {
        if (prop === 'headers') {
          throw new Error('unreadable');
        }
        return Reflect.get(target, prop, target);
      }
    });
    const egress = new McpHttpEgress(ENDPOINT, async () => unreadable);
    await expect(egress.fetch(ENDPOINT)).resolves.toBe(unreadable);
    expect(egress.resourceMetadataUrl).toBeUndefined();
  });

  test('a consumer fetch that throws instead of rejecting is still seen, and its refusal logged', async () => {
    const refusal = new SaferFetch.GuardedFetchError({
      kind: 'redirect-rejected',
      url: ENDPOINT.href,
      status: 302
    });
    const egress = new McpHttpEgress(ENDPOINT, () => {
      throw refusal;
    });
    const logger = new Logging.InMemoryLogger('detail');
    egress.attachLogger(logger);
    await expect(egress.fetch(ENDPOINT, { method: 'GET' })).rejects.toBe(refusal);
    expect(logger.logged).toEqual([
      'mcp: the server event stream was refused by the egress guard (redirect-rejected)'
    ]);
  });

  test('a rejection is rethrown unchanged, whatever the request', async () => {
    const failure = new TypeError('fetch failed');
    const egress = new McpHttpEgress(ENDPOINT, async () => Promise.reject(failure));
    await expect(egress.fetch(ENDPOINT)).rejects.toBe(failure);
    await expect(egress.fetch(ENDPOINT, { method: 'POST' })).rejects.toBe(failure);
  });

  test('a challenge from another URL is not recorded', async () => {
    const challenge = (): Response =>
      new Response(null, {
        status: 401,
        headers: { 'www-authenticate': 'Bearer resource_metadata="https://as.example.com/meta"' }
      });
    const egress = new McpHttpEgress(ENDPOINT, async () => challenge());
    await egress.fetch('https://mcp.example.com/other');
    expect(egress.resourceMetadataUrl).toBeUndefined();
    await egress.fetch(ENDPOINT);
    expect(egress.resourceMetadataUrl).toBe('https://as.example.com/meta');
  });

  test('static headers are dropped from a request to another origin, even with no headers of its own', async () => {
    const sent: Array<RequestInit | undefined> = [];
    const egress = new McpHttpEgress(
      ENDPOINT,
      async (...args: Parameters<McpFetch>) => {
        sent.push(args[1]);
        return new Response('ok');
      },
      { 'X-Api-Key': ' k ' }
    );
    await egress.fetch('https://as.example.com/token');
    await egress.fetch('https://as.example.com/token', { headers: { 'x-api-key': 'k', 'x-other': 'o' } });
    // The same name with a value the SDK chose is the SDK's to send.
    await egress.fetch('https://as.example.com/token', { headers: { 'x-api-key': 'different' } });
    await egress.fetch(ENDPOINT, { headers: { 'x-api-key': 'k' } });
    expect(new Headers(sent[0]?.headers).has('x-api-key')).toBe(false);
    const second = new Headers(sent[1]?.headers);
    expect(second.has('x-api-key')).toBe(false);
    expect(second.get('x-other')).toBe('o');
    expect(new Headers(sent[2]?.headers).get('x-api-key')).toBe('different');
    expect(sent[3]).toEqual({ headers: { 'x-api-key': 'k' } });
  });

  test('the gated provider refuses the interactive steps outside the window and forwards them inside it', async () => {
    const provider = new TestProvider(undefined);
    const egress = new McpHttpEgress(ENDPOINT, undefined, undefined, provider);
    const gated = egress.authProvider!;
    await expect(Promise.resolve(gated.saveCodeVerifier('v'))).rejects.toThrow(
      /started only by connectMcpSession/
    );
    await expect(
      Promise.resolve(gated.redirectToAuthorization(new URL('https://as.example.com/a')))
    ).rejects.toThrow(/started only by connectMcpSession/);
    await egress.interactive(async () => {
      await gated.saveCodeVerifier('v');
      await gated.redirectToAuthorization(new URL('https://as.example.com/a'));
    });
    expect(provider.verifiers).toEqual(['v']);
    expect(provider.redirects).toHaveLength(1);
    // Every other member passes through, bound to the consumer's object.
    expect(gated.tokens()).toBeUndefined();
    expect(gated.redirectUrl).toBe(REDIRECT_URL);
    expect(gated.saveClientInformation).toBeUndefined();
    // `state` is gated like the other two, and forwarded inside the window.
    await expect(Promise.resolve(gated.state!())).rejects.toThrow(/started only by connectMcpSession/);
    await expect(egress.interactive(async () => gated.state!())).resolves.toBe('state-1');
  });

  test('inside the window, an authorization URL that is not http(s) is still refused', async () => {
    const provider = new TestProvider(undefined);
    const egress = new McpHttpEgress(ENDPOINT, undefined, undefined, provider);
    await expect(
      egress.interactive(async () =>
        egress.authProvider!.redirectToAuthorization(new URL('file:///etc/passwd'))
      )
    ).rejects.toThrow(/not http\(s\)/);
    expect(provider.redirects).toEqual([]);
  });

  test('a provider without state() still reads as having none', () => {
    const minimal: McpOAuthClientProvider = {
      redirectUrl: REDIRECT_URL,
      clientMetadata: { redirect_uris: [REDIRECT_URL] },
      clientInformation: () => undefined,
      tokens: () => undefined,
      saveTokens: () => undefined,
      redirectToAuthorization: () => undefined,
      saveCodeVerifier: () => undefined,
      codeVerifier: () => ''
    };
    const gated = new McpHttpEgress(ENDPOINT, undefined, undefined, minimal).authProvider!;
    expect(gated.state).toBeUndefined();
  });
});
