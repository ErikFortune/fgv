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
import { type McpOAuthClientProvider } from './sdkTypes';
import { classifySdkError, makeUnauthorizedError, readResourceMetadataUrl } from './sdk';

/**
 * A `resource_metadata` URL as this package will report it: an `http:` or `https:` URL whose
 * serialization is one line of printable ASCII, or `undefined`.
 *
 * @remarks
 * The value is chosen by the server, and the consumer is invited to fetch it, so anything else is
 * dropped rather than echoed. The WHATWG serializer already percent-encodes or strips everything
 * outside printable ASCII; the line check is kept so the guarantee does not rest on that.
 * @internal
 */
export function acceptResourceMetadataUrl(url: URL | undefined): string | undefined {
  if (url === undefined || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
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
 * Every other member is forwarded to the consumer's object unchanged, with methods bound to it, so
 * an implementation using private fields works, and an optional member the consumer did not
 * implement still reads as absent.
 */
function _gateInteractive(consumer: McpOAuthClientProvider, isOpen: () => boolean): McpOAuthClientProvider {
  const refused = (why: string): Promise<never> => Promise.reject(makeUnauthorizedError(why));
  const outsideWindow =
    'interactive authorization is started only by connectMcpSession; reconnect to authorize';
  const state = consumer.state;
  return new Proxy(consumer, {
    get: (target: McpOAuthClientProvider, prop: string | symbol): unknown => {
      if (prop === 'state' && state !== undefined) {
        return () => (isOpen() ? state.call(target) : refused(outsideWindow));
      }
      if (prop === 'saveCodeVerifier') {
        return (verifier: string) => (isOpen() ? target.saveCodeVerifier(verifier) : refused(outsideWindow));
      }
      if (prop === 'redirectToAuthorization') {
        return (url: URL) => {
          if (!isOpen()) {
            return refused(outsideWindow);
          }
          return _acceptableAuthorizationUrl(url)
            ? target.redirectToAuthorization(url)
            : refused(
                'the authorization server named an authorization endpoint that is neither https nor http on a loopback host'
              );
        };
      }
      const value: unknown = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
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
 * The wrapper never alters a response, and rethrows every rejection unchanged, so the SDK — and
 * the classifier after it — sees exactly what the underlying `fetch` produced. It alters a request
 * in one way only: the consumer's static headers are removed from a request to any origin other
 * than the endpoint's (in practice, the authorization server). The SDK merges them into every
 * auth request, and a static `x-api-key` has no business at a server the MCP server chose.
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
    this._staticHeaders = new Map(
      Object.entries(staticHeaders ?? {}).map(([name, value]) => [name.toLowerCase(), value])
    );
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
    // Called inside `then`, so a consumer `fetch` that throws rather than rejecting is still seen.
    const response = await Promise.resolve()
      .then(() => underlying(url, this._forOrigin(target, init)))
      .catch((err: unknown) => {
        this._noteRefusal(target, init, err);
        throw err;
      });
    this._noteChallenge(target, response);
    return response;
  }

  /** Removes the consumer's static headers from a request leaving the endpoint's origin. */
  private _forOrigin(target: URL, init: RequestInit | undefined): RequestInit | undefined {
    if (this._staticHeaders.size === 0 || target.origin === this._endpoint.origin) {
      return init;
    }
    const headers = new Headers(init?.headers);
    for (const [name, value] of this._staticHeaders) {
      // Only the consumer's own value: a header the SDK set for this request under the same name
      // (client authentication on the token endpoint) is the SDK's to send.
      // Compared trimmed, as `Headers` stores it.
      if (headers.get(name) === value.trim()) {
        headers.delete(name);
      }
    }
    return { ...init, headers };
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
   * Logs a guarded-fetch refusal of the standalone `GET` event stream, at `detail`.
   *
   * @remarks
   * The SDK starts that stream itself, detached, and reports its failure only to its own `onerror`:
   * no operation of the consumer's fails. Without this line a guard that refuses the stream would
   * silently stop server-initiated messages (such as `notifications/tools/list_changed`). Only the
   * refusal's kind is logged, never its URL-bearing reason. A refusal of any other request fails
   * the operation that sent it, and is classified there.
   */
  private _noteRefusal(target: URL, init: RequestInit | undefined, err: unknown): void {
    // The SDK opens the stream with exactly `method: 'GET'` on the endpoint URL; OAuth discovery
    // `GET`s go to other URLs and fail the operation that triggered them.
    if (init?.method !== 'GET' || target.href !== this._endpoint.href) {
      return;
    }
    const reason = classifySdkError(err, { phase: 'session', closed: false });
    if (reason.kind === 'egress-blocked') {
      this._logger.detail(
        printable(`mcp: the server event stream was refused by the egress guard (${reason.reason})`)
      );
    }
  }
}
