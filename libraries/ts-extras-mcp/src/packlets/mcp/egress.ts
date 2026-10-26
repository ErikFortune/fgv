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
 * The package-owned `fetch` every Streamable-HTTP request goes through, whatever the consumer
 * supplied.
 * @packageDocumentation
 */

import { Logging, captureResult, succeed } from '@fgv/ts-utils';
import { SaferFetch } from '@fgv/ts-extras';

import { type McpFailureReason, type McpFetch } from './model';
import { printable } from './request';
import { type IMcpRequestContext, mcpRequestContext } from './requestContext';
import { type McpOAuthClientProvider } from './sdkTypes';
import { classifySdkError, makeUnauthorizedError, readResourceMetadataUrl } from './sdk';

/**
 * A `resource_metadata` URL as this package will report it: an `http:` or `https:` URL with no
 * username or password whose serialization is one line of printable ASCII, or `undefined`.
 *
 * @remarks
 * The value is chosen by the server, and the consumer is invited to fetch it, so anything else is
 * dropped rather than echoed. The WHATWG serializer already percent-encodes or strips everything
 * outside printable ASCII; the line check is kept so the guarantee does not rest on that.
 * @internal
 */
export function acceptResourceMetadataUrl(url: URL | undefined): string | undefined {
  // A URL with userinfo is never reported: the consumer would be invited to send those credentials.
  if (
    url === undefined ||
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username !== '' ||
    url.password !== ''
  ) {
    return undefined;
  }
  return /^[\x21-\x7e]+$/.test(url.href) ? url.href : undefined;
}

/**
 * Whether `hostname` is a loopback host: `localhost`, or an address literal (IPv6 in brackets) that
 * classifies as loopback.
 */
function _isLoopbackHost(hostname: string): boolean {
  const literal = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
  return (
    hostname === 'localhost' ||
    SaferFetch.classifyAddress(literal)
      .onSuccess((classified) => succeed(classified.classification === 'loopback'))
      .orDefault(false)
  );
}

/**
 * Whether an authorization endpoint may be handed to the consumer to open: `https:`, or `http:` on a
 * loopback host only, as OAuth 2.1 allows. The URL comes from server-supplied metadata.
 */
function _acceptableAuthorizationUrl(url: URL): boolean {
  return url.protocol === 'https:' || (url.protocol === 'http:' && _isLoopbackHost(url.hostname));
}

/**
 * The limit and the (fixed-text) message of a body read failure that is a guarded fetch's
 * `maxResponseBytes` refusal, or `undefined` for any other failure.
 */
function _tooLarge(err: unknown): { readonly limit: number; readonly message: string } | undefined {
  if (!(err instanceof SaferFetch.GuardedFetchError)) {
    return undefined;
  }
  const reason = err.reason;
  return reason.kind === 'too-large' ? { limit: reason.limit, message: err.message } : undefined;
}

/**
 * Passes `body` through chunk by chunk as the reader asks for it, calling `onError` with whatever a
 * read of the upstream fails with before the stream errors with it. Nothing is read ahead.
 */
function _observedBody(
  body: ReadableStream<Uint8Array>,
  onError: (err: unknown) => void
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  return new ReadableStream<Uint8Array>(
    {
      pull: async (controller): Promise<void> => {
        const read = await reader.read().catch((err: unknown) => {
          onError(err);
          throw err;
        });
        if (read.done) {
          controller.close();
          return;
        }
        controller.enqueue(read.value);
      },
      cancel: async (reason: unknown): Promise<void> => {
        await reader.cancel(reason).catch(() => undefined);
      }
    },
    { highWaterMark: 0 }
  );
}

/**
 * Every member of the SDK's `OAuthClientProvider`, as the facade in {@link _gateInteractive} forwards
 * it. A `Record` over `keyof`, so a member a future SDK version adds fails the build here until the
 * facade forwards it; a unit test checks the facade against this list.
 * @internal
 */
export const FORWARDED_PROVIDER_MEMBERS: Readonly<Record<keyof McpOAuthClientProvider, true>> = {
  redirectUrl: true,
  clientMetadata: true,
  clientMetadataUrl: true,
  state: true,
  clientInformation: true,
  saveClientInformation: true,
  tokens: true,
  saveTokens: true,
  redirectToAuthorization: true,
  saveCodeVerifier: true,
  codeVerifier: true,
  addClientAuthentication: true,
  validateResourceURL: true,
  invalidateCredentials: true,
  prepareTokenRequest: true,
  saveDiscoveryState: true,
  discoveryState: true
};

/**
 * Wraps the consumer's OAuth provider so that the steps that start an interactive authorization run
 * only while the consumer's connect is in progress.
 *
 * @remarks
 * The SDK's `auth()` runs from paths the consumer did not start: the standalone `GET` event stream
 * answers a 401 by authorizing, and that stream is opened detached after the handshake and
 * reopened by the SDK's own reconnect timer. Without this, a token that expired an hour into a
 * session could open a browser window, or overwrite the `state` and code verifier of a flow the
 * consumer has in progress, from a timer.
 *
 * Gated, in the order `auth()` calls them: `state` (where a provider typically mints and stores the
 * CSRF value), `saveCodeVerifier`, `redirectToAuthorization`. Outside the window each rejects with
 * the SDK's own `UnauthorizedError`, so the operation fails `'unauthorized'` before the first of
 * them has run. Inside it, `redirectToAuthorization` is still refused for a URL that is neither
 * `https:` nor `http:` on a loopback host — the authorization endpoint comes from server-supplied
 * metadata, and a consumer is expected to open it in a browser.
 *
 * **Not gated, and so able to run from those background paths:** discovery and
 * `saveDiscoveryState`, dynamic client registration and `saveClientInformation`, a token refresh and
 * `saveTokens`, and `invalidateCredentials` when the authorization server answers `invalid_grant` or
 * `invalid_client`. None is interactive; each is what keeps a session authorized.
 *
 * The wrapper is an explicit forwarding facade, not a `Proxy`: a `Proxy` that returns wrapped or
 * bound functions violates the invariant for a non-writable, non-configurable property, so a frozen
 * provider would throw on any read. Every member calls through with the consumer's object as the
 * receiver, so an implementation using private fields works. Data members (`redirectUrl`,
 * `clientMetadata`, `clientMetadataUrl`) are read at use. Optional methods are read once, at
 * construction, and one the consumer did not implement is absent here too, because the SDK
 * feature-detects them.
 */
function _gateInteractive(consumer: McpOAuthClientProvider, isOpen: () => boolean): McpOAuthClientProvider {
  const refused = (why: string): Promise<never> => Promise.reject(makeUnauthorizedError(why));
  const outsideWindow =
    'interactive authorization is started only by connectMcpSession; reconnect to authorize';
  // Optional methods, read once: the SDK feature-detects them (`provider.state ? …`), so one the
  // consumer did not implement must stay absent here too. Each is called with the consumer's object
  // as its receiver.
  const {
    state,
    saveClientInformation,
    addClientAuthentication,
    validateResourceURL,
    invalidateCredentials,
    prepareTokenRequest,
    saveDiscoveryState,
    discoveryState
  } = consumer;
  return {
    // Data members are read through at use, as the SDK reads them.
    get redirectUrl() {
      return consumer.redirectUrl;
    },
    get clientMetadata() {
      return consumer.clientMetadata;
    },
    get clientMetadataUrl() {
      return consumer.clientMetadataUrl;
    },
    clientInformation: () => consumer.clientInformation(),
    tokens: () => consumer.tokens(),
    saveTokens: (tokens) => consumer.saveTokens(tokens),
    codeVerifier: () => consumer.codeVerifier(),
    saveCodeVerifier: (verifier) => (isOpen() ? consumer.saveCodeVerifier(verifier) : refused(outsideWindow)),
    redirectToAuthorization: (url) => {
      if (!isOpen()) {
        return refused(outsideWindow);
      }
      return _acceptableAuthorizationUrl(url)
        ? consumer.redirectToAuthorization(url)
        : refused(
            'the authorization server named an authorization endpoint that is neither https nor http on a loopback host'
          );
    },
    ...(state !== undefined
      ? { state: () => (isOpen() ? state.call(consumer) : refused(outsideWindow)) }
      : {}),
    ...(saveClientInformation !== undefined
      ? { saveClientInformation: (info) => saveClientInformation.call(consumer, info) }
      : {}),
    ...(addClientAuthentication !== undefined
      ? {
          addClientAuthentication: (headers, params, url, metadata) =>
            addClientAuthentication.call(consumer, headers, params, url, metadata)
        }
      : {}),
    ...(validateResourceURL !== undefined
      ? {
          validateResourceURL: (serverUrl, resource) =>
            validateResourceURL.call(consumer, serverUrl, resource)
        }
      : {}),
    ...(invalidateCredentials !== undefined
      ? { invalidateCredentials: (scope) => invalidateCredentials.call(consumer, scope) }
      : {}),
    ...(prepareTokenRequest !== undefined
      ? { prepareTokenRequest: (scope) => prepareTokenRequest.call(consumer, scope) }
      : {}),
    ...(saveDiscoveryState !== undefined
      ? { saveDiscoveryState: (discovered) => saveDiscoveryState.call(consumer, discovered) }
      : {}),
    ...(discoveryState !== undefined ? { discoveryState: () => discoveryState.call(consumer) } : {})
  };
}

/**
 * Per-transport egress state, and the `fetch` (and OAuth provider) the SDK transport is
 * constructed with.
 *
 * @remarks
 * **One wrapper, always.** The SDK transport is always given {@link McpHttpEgress.fetch}, which
 * delegates to the consumer's `fetch` or, when none was supplied, to `globalThis.fetch` at call
 * time. Every request the SDK makes for the session — each `POST`, the standalone `GET` event
 * stream, the termination `DELETE`, and with OAuth every discovery, registration and token request
 * — passes through it, so per-session protections live in one place and apply identically
 * whichever `fetch` is underneath.
 *
 * The wrapper rethrows every rejection unchanged, so the SDK — and the classifier after it — sees
 * exactly what the underlying `fetch` produced. It alters a request in one way only: it **applies**
 * the consumer's static headers, and only to a request for the MCP endpoint's origin. The SDK is not
 * given them, so a request to any other origin (in practice, the authorization server the MCP server
 * named) never carries them.
 *
 * It alters a response in one way only: an SSE answer (`text/event-stream`) is returned with its body
 * passed through an observer, a new `Response` with the same status, status text and headers. Every
 * chunk and every read failure reaches the SDK unchanged. The observer exists for one failure the SDK
 * mishandles — see {@link McpHttpEgress._noteOversizedBody}.
 * @internal
 */
export class McpHttpEgress {
  /** The `fetch` to construct the SDK transport with. */
  public readonly fetch: McpFetch;
  /** The gated OAuth provider to construct the SDK transport with, when the consumer supplied one. */
  public readonly authProvider: McpOAuthClientProvider | undefined;

  private readonly _endpoint: URL;
  private readonly _underlying: McpFetch | undefined;
  /** The consumer's static headers: lowercased name to value. */
  private readonly _staticHeaders: ReadonlyMap<string, string>;
  private _logger: Logging.ILogger = new Logging.NoOpLogger();
  private _interactive: boolean = false;
  private _resourceMetadataUrl: string | undefined;

  /**
   * @param endpoint - The MCP endpoint the transport was created for.
   * @param underlying - The consumer's `fetch`, if one was supplied.
   * @param staticHeaders - The consumer's static headers, if any.
   * @param authProvider - The consumer's OAuth provider, if one was supplied.
   */
  public constructor(
    endpoint: URL,
    underlying: McpFetch | undefined,
    staticHeaders?: Readonly<Record<string, string>>,
    authProvider?: McpOAuthClientProvider
  ) {
    this._endpoint = endpoint;
    this._underlying = underlying;
    // Normalized through `Headers`, as every request's headers are: names lowercased, values trimmed,
    // and case-variant duplicates combined into one value — exactly what the SDK will send.
    const normalized = new Headers(staticHeaders);
    const entries: Array<[string, string]> = [];
    normalized.forEach((value, name) => entries.push([name, value]));
    this._staticHeaders = new Map(entries);
    this.authProvider =
      authProvider !== undefined ? _gateInteractive(authProvider, () => this._interactive) : undefined;
    this.fetch = (url: string | URL, init?: RequestInit): Promise<Response> => this._send(url, init);
  }

  /**
   * The `resource_metadata` URL of the endpoint's most recent valid `WWW-Authenticate` challenge.
   */
  public get resourceMetadataUrl(): string | undefined {
    return this._resourceMetadataUrl;
  }

  /** Attaches the session's logger. Called by `connectMcpSession`, before anything is sent. */
  public attachLogger(logger: Logging.ILogger | undefined): void {
    this._logger = logger ?? new Logging.NoOpLogger();
  }

  /**
   * Runs the consumer's connect with interactive authorization allowed, and closes the window
   * however it ends. The transport is single-use, so this runs at most once per egress.
   */
  public async interactive<T>(work: () => Promise<T>): Promise<T> {
    this._interactive = true;
    try {
      return await work();
    } finally {
      this._interactive = false;
    }
  }

  /** Adds the captured `resource_metadata` URL to an `'unauthorized'` reason; returns any other as is. */
  public describe(reason: McpFailureReason): McpFailureReason {
    const resourceMetadataUrl = this._resourceMetadataUrl;
    return reason.kind === 'unauthorized' && resourceMetadataUrl !== undefined
      ? { ...reason, resourceMetadataUrl }
      : reason;
  }

  private async _send(url: string | URL, init: RequestInit | undefined): Promise<Response> {
    const underlying = this._underlying ?? globalThis.fetch;
    const target = new URL(String(url));
    // Read before the first `await`: the request this fetch carries, when one of this package's
    // operations sent it.
    const request = mcpRequestContext.getStore();
    // Called inside `then`, so a consumer `fetch` that throws rather than rejecting is still seen.
    const response = await Promise.resolve()
      .then(() => underlying(url, this._withStaticHeaders(target, init)))
      .catch((err: unknown) => {
        this._noteRefusal(target, init, err);
        throw err;
      });
    this._noteChallenge(target, response);
    return this._observeEventStream(response, this._isEventStreamGet(target, init), request);
  }

  /** Whether a request is the SDK's standalone `GET` event stream: exactly `GET` on the endpoint URL. */
  private _isEventStreamGet(target: URL, init: RequestInit | undefined): boolean {
    return init?.method === 'GET' && target.href === this._endpoint.href;
  }

  /**
   * Returns an SSE answer with its body observed by {@link McpHttpEgress._noteOversizedBody}; any
   * other response, and any response whose head cannot be read, unchanged.
   */
  private _observeEventStream(
    response: Response,
    isEventStreamGet: boolean,
    request: IMcpRequestContext | undefined
  ): Response {
    // A consumer `fetch` can return anything shaped like a response; one whose head cannot be read
    // is handed back as it came, for the SDK to deal with.
    const body = captureResult(() =>
      response.body !== null && String(response.headers.get('content-type')).startsWith('text/event-stream')
        ? response.body
        : undefined
    ).orDefault(undefined);
    if (body === undefined) {
      return response;
    }
    return new Response(
      _observedBody(body, (err) => this._noteOversizedBody(err, isEventStreamGet, request)),
      { status: response.status, statusText: response.statusText, headers: response.headers }
    );
  }

  /**
   * Reports an SSE body that the guarded fetch's `maxResponseBytes` cut off.
   *
   * @remarks
   * The SDK reads a `POST`'s SSE answer detached from the request it answers, and an error reading it
   * goes only to the transport's `onerror`, wrapped in a new message: the request itself is never
   * rejected, and would wait out its whole timeout. So for a `POST`, the request the body belongs to
   * — the one whose context the fetch ran in — is failed here, as `egress-blocked` with reason
   * `'too-large'`, exactly as a refused JSON answer is classified. The session stays usable.
   *
   * The standalone `GET` event stream has no request to fail. The SDK reconnects it at once, and the
   * new response is counted from zero, so the cap bounds each connection rather than the session.
   * Both cases are logged at `detail`, by the limit only, so the cut-off is never silent.
   */
  private _noteOversizedBody(
    err: unknown,
    isEventStreamGet: boolean,
    request: IMcpRequestContext | undefined
  ): void {
    const tooLarge = _tooLarge(err);
    if (tooLarge === undefined) {
      return;
    }
    const { limit } = tooLarge;
    if (isEventStreamGet) {
      this._logger.detail(
        `mcp: the server event stream exceeded the egress guard's maxResponseBytes (${limit} bytes); ` +
          'the SDK reconnects it'
      );
      return;
    }
    this._logger.detail(`mcp: a response exceeded the egress guard's maxResponseBytes (${limit} bytes)`);
    request?.fail({ kind: 'egress-blocked', reason: 'too-large' }, tooLarge.message);
  }

  /**
   * Applies the consumer's static headers to a request for the MCP endpoint's origin, and to no
   * other.
   *
   * @remarks
   * The SDK is never given the static headers: if it were, its auth fetch would merge them into
   * every OAuth request with the caller's casing, beside the SDK's own lowercased ones — so a static
   * `Authorization` and the `client_secret_basic` `authorization` would both reach the authorization
   * server, joined. Applying them here, with `set`, means the authorization server never sees them,
   * and on the endpoint's origin a static header overrides one the SDK set under the same name (the
   * provider's `Authorization: Bearer`) exactly as the SDK's own merge did.
   */
  private _withStaticHeaders(target: URL, init: RequestInit | undefined): RequestInit | undefined {
    if (this._staticHeaders.size === 0 || target.origin !== this._endpoint.origin) {
      return init;
    }
    const headers = new Headers(init?.headers);
    for (const [name, value] of this._staticHeaders) {
      headers.set(name, value);
    }
    // `globalThis.fetch` follows a redirect with every custom header, to any origin, so a request
    // carrying static headers refuses redirects. A consumer `fetch` owns its own redirect policy.
    return this._underlying === undefined ? { ...init, headers, redirect: 'error' } : { ...init, headers };
  }

  /** Records the `resource_metadata` URL of a challenge from the endpoint. */
  private _noteChallenge(target: URL, response: Response): void {
    if (target.href !== this._endpoint.href || (response.status !== 401 && response.status !== 403)) {
      return;
    }
    // A consumer `fetch` can return anything shaped like a response; a header read that throws
    // leaves the previous value in place rather than failing the request.
    const parsed = captureResult(() => readResourceMetadataUrl(response)).orDefault(undefined);
    const accepted = acceptResourceMetadataUrl(parsed);
    if (accepted !== undefined) {
      this._resourceMetadataUrl = accepted;
    }
  }

  /**
   * Logs every guarded-fetch refusal, at `detail`, by the refusal's kind alone.
   *
   * @remarks
   * Some requests have no caller to fail. The SDK opens the standalone `GET` event stream itself,
   * detached, and on a 401 from it — at connect or from its own reconnect timer — runs OAuth
   * discovery, refresh and registration with no operation of the consumer's waiting. A refusal on
   * any of those is reported only to the SDK's own `onerror`, so without this line a guard that
   * refuses one would silently stop server-initiated messages or background authorization.
   *
   * Which request was refused is not knowable here as "detached" or "awaited", so every
   * `egress-blocked` refusal is logged, whatever its URL or method; a refusal that also fails an
   * operation is classified there as well. The event stream keeps its own line. Only the refusal's
   * kind is logged — never the URL or the URL-bearing reason.
   */
  private _noteRefusal(target: URL, init: RequestInit | undefined, err: unknown): void {
    const reason = classifySdkError(err, { phase: 'session', closed: false });
    if (reason.kind !== 'egress-blocked') {
      return;
    }
    // The SDK opens the stream with exactly `method: 'GET'` on the endpoint URL.
    const what = this._isEventStreamGet(target, init) ? 'the server event stream was' : 'an HTTP request was';
    this._logger.detail(printable(`mcp: ${what} refused by the egress guard (${reason.reason})`));
  }
}
