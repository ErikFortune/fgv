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
 * The async context of one MCP request, which the package-owned egress `fetch` reads to fail the
 * request a response belongs to.
 * @packageDocumentation
 */

import { AsyncLocalStorage } from 'node:async_hooks';

import { type McpFailureReason } from './model';

/**
 * What one MCP request in flight exposes to the code that runs on its behalf.
 * @internal
 */
export interface IMcpRequestContext {
  /**
   * Fails the request now, with `reason` as its classification and `message` as its text, unless it
   * has already settled or been aborted. The SDK is told the request was cancelled, as for an abort.
   */
  fail(reason: McpFailureReason, message: string): void;
}

/**
 * The context of the MCP request whose SDK call is running, for the egress `fetch` to read.
 *
 * @remarks
 * `runSdkRequest` runs each SDK call inside this storage, and the SDK's Streamable-HTTP transport
 * sends the request's `POST` from inside that call's promise chain, so the egress sees the context of
 * exactly the request it is carrying — however many are in flight at once. It exists because the SDK
 * reports an error reading a `POST`'s SSE answer only to `onerror` and never rejects the request it
 * belongs to; without a way back to that request, a body the egress guard cut off would leave the
 * request pending until its timeout.
 * @internal
 */
export const mcpRequestContext: AsyncLocalStorage<IMcpRequestContext> =
  new AsyncLocalStorage<IMcpRequestContext>();
