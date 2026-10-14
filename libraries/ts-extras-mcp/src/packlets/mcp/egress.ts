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

import { Logging } from '@fgv/ts-utils';

import { type McpFetch } from './model';
import { printable } from './request';
import { classifySdkError } from './sdk';

/**
 * Per-transport egress state, and the `fetch` the SDK transport is constructed with.
 *
 * @remarks
 * **One wrapper, always.** The SDK transport is always given {@link McpHttpEgress.fetch}, which
 * delegates to the consumer's `fetch` or, when none was supplied, to `globalThis.fetch` at call
 * time. Every request the SDK makes for the session — each `POST`, the standalone `GET` event
 * stream, the termination `DELETE` — passes through it, so per-session protections live in one
 * place and apply identically whichever `fetch` is underneath.
 *
 * The wrapper never alters a request or a response. It rethrows every rejection unchanged, so the
 * SDK — and the classifier after it — sees exactly what the underlying `fetch` produced.
 * @internal
 */
export class McpHttpEgress {
  /** The `fetch` to construct the SDK transport with. */
  public readonly fetch: McpFetch;

  private readonly _endpoint: URL;
  private readonly _underlying: McpFetch | undefined;
  private _logger: Logging.ILogger = new Logging.NoOpLogger();

  /**
   * @param endpoint - The MCP endpoint the transport was created for.
   * @param underlying - The consumer's `fetch`, if one was supplied.
   */
  public constructor(endpoint: URL, underlying: McpFetch | undefined) {
    this._endpoint = endpoint;
    this._underlying = underlying;
    this.fetch = (url: string | URL, init?: RequestInit): Promise<Response> => this._send(url, init);
  }

  /** Attaches the session's logger. Called by `connectMcpSession`, before anything is sent. */
  public attachLogger(logger: Logging.ILogger | undefined): void {
    this._logger = logger ?? new Logging.NoOpLogger();
  }

  private async _send(url: string | URL, init: RequestInit | undefined): Promise<Response> {
    const underlying = this._underlying ?? globalThis.fetch;
    return underlying(url, init).catch((err: unknown) => {
      this._noteRefusal(url, init, err);
      throw err;
    });
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
  private _noteRefusal(url: string | URL, init: RequestInit | undefined, err: unknown): void {
    // The SDK opens the stream with exactly `method: 'GET'` on the endpoint URL it was given; OAuth
    // discovery `GET`s go to other URLs and fail the operation that triggered them.
    if (init?.method !== 'GET' || String(url) !== this._endpoint.href) {
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
