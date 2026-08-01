// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * The test seam. Every safer-fetch test drives a scripted `IFetchTransport` rather than a live
 * server: redirect statuses, lying `Content-Length` headers, bodies that trickle and never
 * finish, and opaque redirects are all reachable in-process, and none of them is flaky. A guard
 * test that could actually reach a private address would be worse than flaky.
 */

import { fail, succeed, type Result } from '@fgv/ts-utils';

import { SaferFetch } from '../../..';

/** One call recorded by a mock transport. */
export interface IRecordedCall {
  readonly url: URL;
  readonly init: RequestInit;
  readonly hints: SaferFetch.IFetchTransportHints;
}

/** A transport that records what it was asked to do. */
export interface IMockTransport extends SaferFetch.IFetchTransport {
  readonly calls: ReadonlyArray<IRecordedCall>;
}

export type Responder = (call: IRecordedCall) => Promise<Result<Response>> | Result<Response>;

export function mockTransport(responder: Responder): IMockTransport {
  const calls: IRecordedCall[] = [];
  return {
    name: 'mockTransport',
    calls,
    fetch: async (
      url: URL,
      init: RequestInit,
      hints: SaferFetch.IFetchTransportHints
    ): Promise<Result<Response>> => {
      const call: IRecordedCall = { url, init, hints };
      calls.push(call);
      return responder(call);
    }
  };
}

/** A transport that always returns the supplied response. */
export function respondWith(response: () => Response): IMockTransport {
  return mockTransport(() => succeed(response()));
}

/** A transport whose request never settles until the composed signal aborts. */
export function neverResponds(): IMockTransport {
  return mockTransport(
    async (call) =>
      new Promise<Result<Response>>((resolve) => {
        call.init.signal?.addEventListener('abort', () => resolve(fail('aborted')));
      })
  );
}

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** A stream that emits the supplied chunks and then closes. */
export function streamOf(chunks: ReadonlyArray<Uint8Array>): ReadableStream<Uint8Array> {
  let index: number = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    }
  });
}

/**
 * A response whose body is exactly the supplied bytes. Routed through a stream because the
 * platform's `BodyInit` will not take a `Uint8Array` over a possibly-shared buffer.
 */
export function bytesResponse(body: Uint8Array, init?: ResponseInit): Response {
  return new Response(streamOf([body]), init);
}

/** Tracks whether a stream was cancelled — the assertion the `too-large` path needs. */
export interface ICancellableStream {
  readonly stream: ReadableStream<Uint8Array>;
  readonly wasCancelled: () => boolean;
}

/**
 * A stream that emits the supplied chunks and records whether it was cancelled. The `too-large`
 * failure returns correctly whether or not the reader is cancelled; only an explicit assertion
 * catches a transfer that keeps running against a call that already gave up.
 */
export function cancellableStreamOf(chunks: ReadonlyArray<Uint8Array>): ICancellableStream {
  let index: number = 0;
  let cancelled: boolean = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
    cancel(): void {
      cancelled = true;
    }
  });
  return { stream, wasCancelled: (): boolean => cancelled };
}

/** A stream that emits the supplied chunks and then trickles forever — the slowloris shape. */
export function stallingStreamOf(chunks: ReadonlyArray<Uint8Array>): ICancellableStream {
  let index: number = 0;
  let cancelled: boolean = false;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
        return;
      }
      await new Promise<void>(() => undefined);
    },
    cancel(): void {
      cancelled = true;
    }
  });
  return { stream, wasCancelled: (): boolean => cancelled };
}

/** Marks a response as the opaque redirect a browser yields for `redirect: 'manual'`. */
export function asOpaqueRedirect(response: Response): Response {
  // `type` is read-only on a constructed Response, and there is no way to obtain a genuine
  // opaque redirect outside a browser — so the test forges the one observable the core reads.
  Object.defineProperty(response, 'type', { value: 'opaqueredirect' });
  return response;
}
