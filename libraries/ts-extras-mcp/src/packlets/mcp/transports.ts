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
 * Transport factories — convert the throwing SDK transport constructors into `Result<T>`.
 * @packageDocumentation
 */

import { type Result, captureResult, fail, succeed } from '@fgv/ts-utils';

import {
  type IMcpHttpTransportParams,
  type IMcpSdkTransport,
  type IMcpStdioTransportParams,
  type IMcpTransport,
  type McpTransportKind
} from './model';
import { type ISdkTransport, makeHttpTransport, makeStdioTransport } from './sdk';

/**
 * Concrete transport handle. Packlet-internal — carries the SDK transport that
 * {@link McpTransport.fromHandle} recovers inside {@link connectMcpSession}. Not exported from
 * the package barrel, so it does not appear in the public API surface.
 * @internal
 */
export class McpTransport implements IMcpTransport {
  public readonly transportKind: McpTransportKind;
  /** The wrapped SDK transport. */
  public readonly sdkTransport: ISdkTransport;

  private _claimed: boolean = false;

  public constructor(transportKind: McpTransportKind, sdkTransport: ISdkTransport) {
    this.transportKind = transportKind;
    this.sdkTransport = sdkTransport;
  }

  /**
   * Claims the transport for one connect. A handle is single-use: the session that connects over
   * it owns the underlying transport, and starting a transport twice either throws in the SDK or —
   * for a transport that keeps a session id — silently skips the handshake. A second claim fails
   * without touching the transport. The handle stays claimed even when its connect fails, because
   * the SDK may already have started (and then closed) the transport.
   */
  public claim(): Result<ISdkTransport> {
    if (this._claimed) {
      return fail('invalid MCP transport: this handle was already used by a connect; create a new transport');
    }
    this._claimed = true;
    return succeed(this.sdkTransport);
  }

  /**
   * Narrows a public {@link IMcpTransport} handle back to the concrete {@link McpTransport}.
   * Fails loudly when handed a foreign object that did not originate from one of this
   * package's transport factories.
   */
  public static fromHandle(handle: IMcpTransport): Result<McpTransport> {
    if (handle instanceof McpTransport) {
      return succeed(handle);
    }
    return fail(
      'invalid MCP transport: expected a handle from createStdioTransport / createHttpTransport / createCustomTransport'
    );
  }
}

/**
 * Creates a stdio MCP transport that speaks MCP over the stdin/stdout of a spawned subprocess.
 *
 * @remarks
 * **Security — trust boundary.** The transport spawns `params.command` (with `params.args`) as a
 * child process. Never source the command or arguments from untrusted input; treat them with the
 * same care as any shell-out. See the package README's security note.
 *
 * @param params - The command, arguments, environment, and working directory.
 * @returns `Success` with an opaque transport handle, or `Failure` if the SDK constructor throws
 * (e.g. an empty command).
 * @public
 */
export function createStdioTransport(params: IMcpStdioTransportParams): Result<IMcpTransport> {
  if (params.command.trim().length === 0) {
    return fail('createStdioTransport: command must be a non-empty string');
  }
  return captureResult(() =>
    makeStdioTransport({
      command: params.command,
      args: params.args,
      env: params.env,
      cwd: params.cwd
    })
  )
    .onSuccess((sdkTransport) => succeed<IMcpTransport>(new McpTransport('stdio', sdkTransport)))
    .withErrorFormat((msg) => `createStdioTransport: ${msg}`);
}

/**
 * Creates a Streamable-HTTP MCP transport for the given endpoint URL.
 *
 * @param params - The endpoint URL and optional static headers.
 * @returns `Success` with an opaque transport handle, or `Failure` if the URL is invalid or the
 * SDK constructor throws.
 * @public
 */
export function createHttpTransport(params: IMcpHttpTransportParams): Result<IMcpTransport> {
  return captureResult(() => new URL(params.url))
    .withErrorFormat(() => `invalid url '${params.url}'`)
    .onSuccess((url): Result<IMcpTransport> => {
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return fail(`url must use http or https protocol (got '${url.protocol}')`);
      }
      return captureResult(() => makeHttpTransport(url, params.headers)).onSuccess((sdkTransport) =>
        succeed<IMcpTransport>(new McpTransport('http', sdkTransport))
      );
    })
    .withErrorFormat((msg) => `createHttpTransport: ${msg}`);
}

/**
 * Wraps a pre-built MCP SDK client transport in this package's opaque transport handle, so a
 * session can run over any transport the SDK (or the consumer) provides.
 *
 * @remarks
 * The motivating use is testing against an in-process server, with no subprocess and no port:
 *
 * ```ts
 * import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
 * const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
 * await server.connect(serverSide); // an SDK `Server` / `McpServer`
 * const transport = createCustomTransport(clientSide).orThrow();
 * const session = (await connectMcpSession({ transport })).orThrow();
 * ```
 *
 * It equally admits transports this package does not construct itself (the SDK's legacy SSE or
 * WebSocket client transports, or a consumer's own implementation). The transport is handed to the
 * SDK client unchanged, and the session that connects over it takes ownership of it. It must be
 * fresh — unstarted and without a `sessionId` (the SDK treats a transport with one as a reconnect
 * and skips the `initialize` handshake) — and its `close()` must call the `onclose` callback the
 * SDK assigns, or neither in-flight requests nor `onClose` learn of the close. The handle is
 * single-use: a second {@link connectMcpSession} with it fails `'invalid-handle'`.
 *
 * @param transport - An unstarted SDK client transport with no session id.
 * @returns `Success` with an opaque handle (`transportKind: 'custom'`), or `Failure` if the
 * transport already carries a session id.
 * @public
 */
export function createCustomTransport(transport: IMcpSdkTransport): Result<IMcpTransport> {
  if (transport.sessionId !== undefined) {
    // The id is deliberately not echoed: it acts much like a routing token, and failure messages
    // reach logs.
    return fail(
      'createCustomTransport: the transport already has a session id; ' +
        'the SDK would skip the initialize handshake — pass a fresh transport'
    );
  }
  return succeed<IMcpTransport>(new McpTransport('custom', transport));
}
