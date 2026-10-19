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

import '@fgv/ts-utils-jest';

import { getEventListeners } from 'node:events';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { type AddressInfo } from 'node:net';

import { fail, Logging, succeed, type Result } from '@fgv/ts-utils';

import { SaferFetch } from '../../..';
import {
  cancellableStreamOf,
  mockTransport,
  neverResponds,
  respondWith,
  utf8,
  type IMockTransport
} from './mockTransport';

const { allowAnyAddress, allowContentTypes, blockPrivateNetworks, createGuardedFetch, GuardedFetchError } =
  SaferFetch;

const URL_UNDER_TEST: string = 'https://example.com/mcp';

function guarded(
  transport: SaferFetch.IFetchTransport,
  overrides?: Partial<SaferFetch.IGuardedFetchOptions>
): SaferFetch.GuardedFetch {
  return createGuardedFetch({ addressGuard: allowAnyAddress(), transport, ...overrides }).orThrow();
}

/** Awaits a guarded call that must reject, and returns its `GuardedFetchError`. */
async function rejectionOf(call: Promise<Response>): Promise<SaferFetch.GuardedFetchError> {
  const settled = await call.then(
    () => undefined,
    (err: unknown) => err
  );
  expect(settled).toBeInstanceOf(GuardedFetchError);
  return settled as SaferFetch.GuardedFetchError;
}

function redirectTo(location: string, status: number = 302): Response {
  return new Response(null, { status, headers: { location } });
}

/** An address guard that counts its calls and waits on `gate` before clearing a hop. */
function gatedGuard(gate: Promise<void>): SaferFetch.IAddressGuard & { calls: number } {
  const guard = {
    name: 'gated',
    calls: 0,
    check: async (
      chain: ReadonlyArray<SaferFetch.IRequestHop>
    ): Promise<Result<SaferFetch.IGuardVerdict>> => {
      guard.calls++;
      await gate;
      return succeed({ url: chain[chain.length - 1].url });
    }
  };
  return guard;
}

/**
 * Wraps a response so that reading its headers aborts `controller` first: an abort that lands
 * after the transport call has settled, while the walk is still reading the response.
 */
function abortingOnHeaderRead(response: Response, controller: AbortController): Response {
  return new Proxy(response, {
    get: (target: Response, prop: string | symbol): unknown => {
      if (prop === 'headers') {
        controller.abort();
      }
      const value: unknown = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

/** A resolver that answers from a fixed table, so `blockPrivateNetworks` needs no DNS. */
function resolverOf(table: Record<string, ReadonlyArray<string>>): SaferFetch.HostResolver {
  return async (hostname: string) => {
    const addresses = table[hostname] ?? undefined;
    return addresses !== undefined ? succeed(addresses) : fail(`no such host ${hostname}`);
  };
}

describe('createGuardedFetch', () => {
  describe('options are validated once, at creation', () => {
    test('requires an address guard', () => {
      expect(
        createGuardedFetch({ addressGuard: undefined } as unknown as SaferFetch.IGuardedFetchOptions)
      ).toFailWith(/addressGuard is required/);
    });

    test('rejects an invalid headers timeout, redirect policy, hop cap or sensitive-header list', () => {
      const base = { addressGuard: allowAnyAddress() };
      expect(createGuardedFetch({ ...base, headersTimeoutMs: 0 })).toFailWith(/headersTimeoutMs must be/);
      expect(createGuardedFetch({ ...base, headersTimeoutMs: Number.NaN })).toFailWith(
        /headersTimeoutMs must be/
      );
      expect(
        createGuardedFetch({
          ...base,
          redirectPolicy: 'follow' as unknown as SaferFetch.SaferFetchRedirectPolicy
        })
      ).toFailWith(/redirectPolicy "follow" is not supported/);
      expect(createGuardedFetch({ ...base, maxRedirects: -1 })).toFailWith(/maxRedirects must be/);
      expect(
        createGuardedFetch({ ...base, sensitiveHeaders: [42] as unknown as ReadonlyArray<string> })
      ).toFailWith(/sensitiveHeaders\[0\] must be a string/);
    });

    test('bounds the headers timeout by what a timer honours: 2147483647 is accepted, 2147483648 refused', () => {
      const base = { addressGuard: allowAnyAddress() };
      expect(createGuardedFetch({ ...base, headersTimeoutMs: 2147483647 })).toSucceed();
      expect(createGuardedFetch({ ...base, headersTimeoutMs: 2147483648 })).toFailWith(
        /headersTimeoutMs must be no greater than 2147483647 ms/
      );
    });

    test('refuses every option that needs the body read, would retry, or belongs on the call', () => {
      const withRefused = {
        addressGuard: allowAnyAddress(),
        timeoutMs: 1000,
        maxResponseBytes: 10,
        responseBodyGuard: { name: 'b', check: async () => succeed(true as const) },
        retry: { attempts: 1 },
        method: 'POST',
        headers: { a: 'b' },
        body: 'x',
        signal: new AbortController().signal
      } as unknown as SaferFetch.IGuardedFetchOptions;
      expect(createGuardedFetch(withRefused)).toFailWith(
        /does not support timeoutMs, maxResponseBytes, responseBodyGuard, retry, method, headers, body, signal/
      );
    });

    test('accepts a refused option whose value is undefined, as an omitted one', () => {
      const options = {
        addressGuard: allowAnyAddress(),
        timeoutMs: undefined
      } as unknown as SaferFetch.IGuardedFetchOptions;
      expect(createGuardedFetch(options)).toSucceed();
    });
  });

  describe('the response is returned unread', () => {
    test("returns the final hop's platform response itself, body untouched", async () => {
      const response = new Response('event: x\n\n', { headers: { 'content-type': 'text/event-stream' } });
      const fetch = guarded(respondWith(() => response));
      const returned = await fetch(URL_UNDER_TEST);
      expect(returned).toBe(response);
      expect(returned.bodyUsed).toBe(false);
      await expect(returned.text()).resolves.toBe('event: x\n\n');
    });

    test('returns a non-2xx response rather than rejecting, as fetch does', async () => {
      const fetch = guarded(
        respondWith(() => new Response('gone', { status: 404, statusText: 'Not Found' }))
      );
      const returned = await fetch(URL_UNDER_TEST);
      expect(returned.status).toBe(404);
      await expect(returned.text()).resolves.toBe('gone');
    });

    test('runs the response-headers guard on the head, whatever the status, and releases a refused body', async () => {
      const refused = cancellableStreamOf([utf8('<html>')]);
      const fetch = guarded(
        respondWith(
          () => new Response(refused.stream, { status: 401, headers: { 'content-type': 'text/html' } })
        ),
        { responseHeadersGuard: allowContentTypes(['application/json']).orThrow() }
      );
      const error = await rejectionOf(fetch(URL_UNDER_TEST));
      expect(error.reason).toEqual(
        expect.objectContaining({ kind: 'unsupported-content-type', contentType: 'text/html' })
      );
      // Released, so a refused response does not hold its connection open.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(refused.wasCancelled()).toBe(true);
    });
  });

  describe('request inputs', () => {
    test('accepts a string or a URL', async () => {
      const transport = respondWith(() => new Response('ok'));
      const fetch = guarded(transport);
      await fetch(URL_UNDER_TEST);
      await fetch(new URL(URL_UNDER_TEST));
      expect(transport.calls.map((c) => c.url.toString())).toEqual([URL_UNDER_TEST, URL_UNDER_TEST]);
    });

    test('refuses a Request object, sending nothing', async () => {
      const transport = respondWith(() => new Response('ok'));
      const error = await rejectionOf(guarded(transport)(new Request(URL_UNDER_TEST) as unknown as string));
      expect(error.reason).toEqual({
        kind: 'unknown',
        detail: expect.stringMatching(/a Request object is not supported/)
      });
      expect(transport.calls).toHaveLength(0);
    });

    test('refuses a non-http(s) URL as invalid-url', async () => {
      const error = await rejectionOf(guarded(respondWith(() => new Response('ok')))('file:///etc/passwd'));
      expect(error.reason.kind).toBe('invalid-url');
    });

    test('normalizes the method, and refuses one outside the safer-fetch set', async () => {
      const transport = respondWith(() => new Response('ok'));
      const fetch = guarded(transport);
      await fetch(URL_UNDER_TEST, { method: 'post', body: '{}' });
      expect(transport.calls[0].init.method).toBe('POST');
      const error = await rejectionOf(fetch(URL_UNDER_TEST, { method: 'OPTIONS' }));
      expect(error.reason).toEqual({
        kind: 'unknown',
        detail: expect.stringMatching(/method "OPTIONS" is not supported/)
      });
    });

    test.each<{ label: string; headers: HeadersInit }>([
      { label: 'a Headers object', headers: new Headers({ 'X-Api-Key': 'k', Accept: 'text/event-stream' }) },
      {
        label: 'an array of pairs',
        headers: [
          ['X-Api-Key', 'k'],
          ['Accept', 'text/event-stream']
        ]
      },
      { label: 'a record', headers: { 'X-Api-Key': 'k', Accept: 'text/event-stream' } }
    ])('normalizes headers given as $label, lowercased', async ({ headers }) => {
      const transport = respondWith(() => new Response('ok'));
      await guarded(transport)(URL_UNDER_TEST, { headers });
      expect(transport.calls[0].init.headers).toEqual({ 'x-api-key': 'k', accept: 'text/event-stream' });
    });

    test('refuses headers fetch itself would refuse', async () => {
      const error = await rejectionOf(
        guarded(respondWith(() => new Response('ok')))(URL_UNDER_TEST, { headers: { 'bad name': 'x' } })
      );
      expect(error.reason).toEqual({
        kind: 'unknown',
        detail: expect.stringMatching(/invalid request headers/)
      });
    });

    test('carries a string, Uint8Array or ArrayBuffer body', async () => {
      const transport = respondWith(() => new Response('ok'));
      const fetch = guarded(transport);
      await fetch(URL_UNDER_TEST, { method: 'POST', body: 'text' });
      await fetch(URL_UNDER_TEST, { method: 'POST', body: new Uint8Array(utf8('bytes')) as BodyInit });
      await fetch(URL_UNDER_TEST, { method: 'POST', body: utf8('buffer').buffer as ArrayBuffer });
      expect(transport.calls[0].init.body).toBe('text');
      expect(transport.calls[1].init.body).toEqual(utf8('bytes'));
      expect(transport.calls[2].init.body).toEqual(utf8('buffer'));
    });

    test('sends URLSearchParams as its string form, with the form content type unless one was set', async () => {
      const transport = respondWith(() => new Response('ok'));
      const fetch = guarded(transport);
      await fetch(URL_UNDER_TEST, { method: 'POST', body: new URLSearchParams({ grant_type: 'x' }) });
      await fetch(URL_UNDER_TEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'y' })
      });
      expect(transport.calls[0].init.body).toBe('grant_type=x');
      expect(transport.calls[0].init.headers).toEqual({
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
      });
      expect(transport.calls[1].init.headers).toEqual({
        'content-type': 'application/x-www-form-urlencoded'
      });
    });

    test('treats a null body as absent', async () => {
      const transport = respondWith(() => new Response('ok'));
      await guarded(transport)(URL_UNDER_TEST, { method: 'GET', body: null });
      expect(transport.calls[0].init.body).toBeUndefined();
    });

    test('refuses a stream or form body, and a body on GET or HEAD', async () => {
      const transport = respondWith(() => new Response('ok'));
      const fetch = guarded(transport);
      const stream = new ReadableStream<Uint8Array>();
      await expect(rejectionOf(fetch(URL_UNDER_TEST, { method: 'POST', body: stream }))).resolves.toEqual(
        expect.objectContaining({
          reason: { kind: 'unknown', detail: expect.stringMatching(/body must be a string/) }
        })
      );
      await expect(
        rejectionOf(fetch(URL_UNDER_TEST, { method: 'POST', body: new FormData() }))
      ).resolves.toEqual(
        expect.objectContaining({
          reason: { kind: 'unknown', detail: expect.stringMatching(/body must be a string/) }
        })
      );
      await expect(rejectionOf(fetch(URL_UNDER_TEST, { method: 'HEAD', body: 'x' }))).resolves.toEqual(
        expect.objectContaining({
          reason: { kind: 'unknown', detail: expect.stringMatching(/a HEAD request cannot carry a body/) }
        })
      );
      expect(transport.calls).toHaveLength(0);
    });
  });

  describe('failure contract', () => {
    test('rejects with a GuardedFetchError whose message is fixed text, never the URL', async () => {
      const secretUrl = 'https://internal.example.com/admin?token=s3cret';
      const fetch = guarded(
        respondWith(() => new Response('ok')),
        {
          addressGuard: { name: 'refuse', check: async () => fail('private address 10.0.0.5') }
        }
      );
      const error = await rejectionOf(fetch(secretUrl));
      expect(error.message).toBe('guarded fetch failed: blocked-by-guard');
      expect(error.message).not.toMatch(/internal|s3cret|10\.0\.0\.5/);
      expect(error.name).toBe('GuardedFetchError');
      expect(error).toBeInstanceOf(Error);
      // Not a TypeError: fetch-shaped callers read a TypeError as CORS and retry around it.
      expect(error).not.toBeInstanceOf(TypeError);
      // The reason carries the URL, for the caller's own logs.
      expect(error.reason).toEqual(expect.objectContaining({ kind: 'blocked-by-guard', url: secretUrl }));
    });

    test('reports an internal throw as unknown, never a reason-less error', async () => {
      const throwsOnHeaderRead = (): Response =>
        new Proxy(new Response('hi'), {
          get: (target: Response, prop: string | symbol): unknown => {
            if (prop === 'headers') {
              throw new Error('internal boom');
            }
            const value: unknown = Reflect.get(target, prop, target);
            return typeof value === 'function' ? value.bind(target) : value;
          }
        });
      const error = await rejectionOf(guarded(respondWith(throwsOnHeaderRead))(URL_UNDER_TEST));
      expect(error.reason).toEqual({
        kind: 'unknown',
        detail: expect.stringMatching(/saferFetch: unexpected error: internal boom/)
      });
    });

    test('contains a throwing logger as unknown rather than letting it escape', async () => {
      const logger = new Logging.NoOpLogger();
      logger.detail = (): never => {
        throw new Error('logger boom');
      };
      const fetch = guarded(
        respondWith(() => redirectTo('https://other.example.com/')),
        { logger }
      );
      const error = await rejectionOf(fetch(URL_UNDER_TEST));
      expect(error.reason).toEqual({
        kind: 'unknown',
        detail: expect.stringMatching(/saferFetch: unexpected error: logger boom/)
      });
    });

    test('contains a request guard whose name throws while its refusal is reported', async () => {
      // A collaborator's getter read outside any capture: the walk itself rejects, and the call's
      // top-level capture is what turns that into a reason. Nothing is sent.
      const requestGuard: SaferFetch.IRequestGuard = {
        get name(): string {
          throw new Error('name boom');
        },
        check: async (): Promise<Result<SaferFetch.ISaferFetchRequest>> => fail('refused')
      };
      const transport = respondWith(() => new Response('hi'));
      const error = await rejectionOf(guarded(transport, { requestGuard })(URL_UNDER_TEST));
      expect(error.reason).toEqual({ kind: 'unknown', detail: 'saferFetch: unexpected error: name boom' });
      expect(transport.calls).toHaveLength(0);
    });
  });

  describe('redirects and the address guard', () => {
    test('rejects a redirect by default', async () => {
      const transport = respondWith(() => redirectTo('https://other.example.com/'));
      const error = await rejectionOf(guarded(transport)(URL_UNDER_TEST));
      expect(error.reason).toEqual({ kind: 'redirect-rejected', url: URL_UNDER_TEST, status: 302 });
      expect(transport.calls).toHaveLength(1);
    });

    test('runs the address guard on every hop, and refuses a hop to a private address', async () => {
      const resolve = resolverOf({
        'example.com': ['93.184.216.34'],
        'metadata.example.net': ['169.254.169.254']
      });
      const transport = mockTransport(() => succeed(redirectTo('http://metadata.example.net/latest')));
      const fetch = guarded(transport, {
        addressGuard: blockPrivateNetworks({ resolve, allowInsecureHttp: true }),
        redirectPolicy: 'validate-each-hop'
      });
      const error = await rejectionOf(fetch(URL_UNDER_TEST));
      expect(error.reason).toEqual(
        expect.objectContaining({
          kind: 'blocked-by-guard',
          detail: expect.stringMatching(/link-local/),
          hop: 1
        })
      );
      // The first hop went out; the private hop never did.
      expect(transport.calls.map((c) => c.url.hostname)).toEqual(['example.com']);
    });

    test('follows a cleared chain to the final response', async () => {
      const transport = mockTransport((call) =>
        succeed(
          call.url.hostname === 'example.com'
            ? redirectTo('https://cdn.example.org/mcp', 307)
            : new Response('final', { status: 200 })
        )
      );
      const returned = await guarded(transport, { redirectPolicy: 'validate-each-hop' })(URL_UNDER_TEST, {
        method: 'POST',
        body: '{"a":1}'
      });
      await expect(returned.text()).resolves.toBe('final');
      // 307 preserves the method and body.
      expect(transport.calls[1].init.method).toBe('POST');
      expect(transport.calls[1].init.body).toBe('{"a":1}');
    });

    test('a listed custom credential header is gone from a cross-origin hop and stays gone on A → B → A', async () => {
      const transport: IMockTransport = mockTransport((call) => {
        switch (transport.calls.length) {
          case 1:
            return succeed(redirectTo('https://b.example.org/hop'));
          case 2:
            return succeed(redirectTo('https://example.com/back'));
          default:
            return succeed(new Response('ok'));
        }
      });
      await guarded(transport, {
        redirectPolicy: 'validate-each-hop',
        sensitiveHeaders: ['X-Api-Key', 'mcp-session-id']
      })(URL_UNDER_TEST, {
        headers: { 'x-api-key': 'secret', 'mcp-session-id': 'sess', authorization: 'Bearer t', accept: '*/*' }
      });
      const sent = transport.calls.map((c) => c.init.headers);
      expect(sent[0]).toEqual({
        'x-api-key': 'secret',
        'mcp-session-id': 'sess',
        authorization: 'Bearer t',
        accept: '*/*'
      });
      expect(sent[1]).toEqual({ accept: '*/*' });
      // Back on the original origin, nothing is restored.
      expect(sent[2]).toEqual({ accept: '*/*' });
    });

    test('an unlisted custom header is carried across origins — why the list exists', async () => {
      const transport: IMockTransport = mockTransport(() =>
        succeed(transport.calls.length === 1 ? redirectTo('https://b.example.org/') : new Response('ok'))
      );
      await guarded(transport, { redirectPolicy: 'validate-each-hop' })(URL_UNDER_TEST, {
        headers: { 'x-api-key': 'secret' }
      });
      expect(transport.calls[1].init.headers).toEqual({ 'x-api-key': 'secret' });
    });
  });

  describe('cancellation', () => {
    test('an already-aborted signal fails before any guard runs or anything is sent', async () => {
      const guard = gatedGuard(Promise.resolve());
      const transport = respondWith(() => new Response('ok'));
      const controller = new AbortController();
      controller.abort();
      const error = await rejectionOf(
        guarded(transport, { addressGuard: guard })(URL_UNDER_TEST, { signal: controller.signal })
      );
      expect(error.reason).toEqual({ kind: 'aborted' });
      expect(guard.calls).toBe(0);
      expect(transport.calls).toHaveLength(0);
    });

    test('an abort during guard evaluation stops the call, sending nothing', async () => {
      const guard = gatedGuard(new Promise<void>(() => undefined));
      const transport = respondWith(() => new Response('ok'));
      const controller = new AbortController();
      const call = guarded(transport, { addressGuard: guard })(URL_UNDER_TEST, { signal: controller.signal });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(guard.calls).toBe(1);
      controller.abort();
      await expect(rejectionOf(call)).resolves.toEqual(
        expect.objectContaining({ reason: { kind: 'aborted' } })
      );
      expect(transport.calls).toHaveLength(0);
    });

    test('an abort during the connect stops the call and aborts the request', async () => {
      const transport = neverResponds();
      const controller = new AbortController();
      const call = guarded(transport)(URL_UNDER_TEST, { signal: controller.signal });
      await new Promise((resolve) => setTimeout(resolve, 0));
      controller.abort();
      await expect(rejectionOf(call)).resolves.toEqual(
        expect.objectContaining({ reason: { kind: 'aborted' } })
      );
      expect((transport.calls[0].init.signal as AbortSignal).aborted).toBe(true);
    });

    test('an abort between hops stops the walk before the next hop is guarded or sent', async () => {
      const controller = new AbortController();
      const guard = gatedGuard(Promise.resolve());
      let requestChecks = 0;
      const requestGuard: SaferFetch.IRequestGuard = {
        name: 'counting',
        check: async (request) => {
          requestChecks++;
          return succeed(request);
        }
      };
      // The redirect has arrived — the transport call has settled — and the caller gives up while
      // it is being read, before the next hop starts.
      const transport = mockTransport(() =>
        succeed(abortingOnHeaderRead(redirectTo('https://b.example.org/'), controller))
      );
      const call = guarded(transport, {
        addressGuard: guard,
        requestGuard,
        redirectPolicy: 'validate-each-hop'
      })(URL_UNDER_TEST, { signal: controller.signal });
      await expect(rejectionOf(call)).resolves.toEqual(
        expect.objectContaining({ reason: { kind: 'aborted' } })
      );
      // Neither guard ran for hop 1, and it was never sent.
      expect(requestChecks).toBe(1);
      expect(guard.calls).toBe(1);
      expect(transport.calls).toHaveLength(1);
    });

    test('an abort landing as the final response arrives releases its body unread', async () => {
      const controller = new AbortController();
      const body = cancellableStreamOf([utf8('data: x\n\n')]);
      const transport = mockTransport(() =>
        succeed(abortingOnHeaderRead(new Response(body.stream), controller))
      );
      await expect(
        rejectionOf(guarded(transport)(URL_UNDER_TEST, { signal: controller.signal }))
      ).resolves.toEqual(expect.objectContaining({ reason: { kind: 'aborted' } }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(body.wasCancelled()).toBe(true);
    });

    test('the headers deadline also bounds a response-headers guard that never settles', async () => {
      const body = cancellableStreamOf([utf8('x')]);
      const fetch = guarded(
        respondWith(() => new Response(body.stream)),
        {
          headersTimeoutMs: 20,
          responseHeadersGuard: { name: 'hangs', check: () => new Promise<Result<true>>(() => undefined) }
        }
      );
      const error = await rejectionOf(fetch(URL_UNDER_TEST));
      expect(error.reason).toEqual(expect.objectContaining({ kind: 'timeout', phase: 'headers' }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(body.wasCancelled()).toBe(true);
    });

    test('an abort at any point after the last guard accepts either rejects or reaches the body', async () => {
      // The window between the response-headers guard accepting and the response being handed back
      // is microtasks only, so the abort is swept across microtask depths: wherever it lands, the
      // caller either gets an `aborted` rejection (and the body is released) or the response was
      // returned before the abort, which then reaches the body through the transport signal.
      let rejected = 0;
      for (let depth = 0; depth < 40; depth++) {
        const controller = new AbortController();
        const body = cancellableStreamOf([utf8('x')]);
        const fetch = guarded(
          respondWith(() => new Response(body.stream)),
          {
            responseHeadersGuard: {
              name: 'aborts-later',
              check: async () => {
                let tick: Promise<void> = Promise.resolve();
                for (let i = 0; i < depth; i++) {
                  tick = tick.then(() => undefined);
                }
                tick.then(() => controller.abort()).catch(() => undefined);
                return succeed(true as const);
              }
            }
          }
        );
        const settled = await fetch(URL_UNDER_TEST, { signal: controller.signal }).then(
          (response) => response,
          (err: unknown) => err
        );
        if (settled instanceof GuardedFetchError) {
          expect(settled.reason).toEqual({ kind: 'aborted' });
          await new Promise((resolve) => setTimeout(resolve, 0));
          expect(body.wasCancelled()).toBe(true);
          rejected++;
        } else {
          // Returned before the abort: cancelling the body is then the transport's, through the
          // composed signal (the real-server test shows the platform transport doing it).
          await new Promise((resolve) => setTimeout(resolve, 0));
          expect(controller.signal.aborted).toBe(true);
        }
      }
      expect(rejected).toBeGreaterThan(0);
    });

    test('the headers deadline stops a host that never answers', async () => {
      const error = await rejectionOf(guarded(neverResponds(), { headersTimeoutMs: 20 })(URL_UNDER_TEST));
      expect(error.reason).toEqual(
        expect.objectContaining({ kind: 'timeout', phase: 'headers', limitMs: 20 })
      );
    });
  });

  describe('against a real streaming server', () => {
    let server: Server;
    let baseUrl: string;
    /** Released by a test to let the server finish its stream. */
    let finish: () => void;
    let finished: Promise<void>;
    /** Resolves when the server sees the client close the connection. */
    let clientClosed: Promise<void>;

    beforeEach(async () => {
      let markClosed: () => void = () => undefined;
      clientClosed = new Promise<void>((resolve) => {
        markClosed = resolve;
      });
      finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      server = createServer((req: IncomingMessage, res: ServerResponse) => {
        res.on('close', () => markClosed());
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
        res.write('data: first\n\n');
        if (req.url === '/slow') {
          // A second event well after the headers deadline has passed.
          setTimeout(() => {
            res.write('data: second\n\n');
            res.end();
          }, 150);
          return;
        }
        finished.then(() => res.end('data: last\n\n')).catch(() => undefined);
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterEach(async () => {
      finish();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    async function readChunk(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
      const { value } = await reader.read();
      return new TextDecoder().decode(value);
    }

    test('delivers the first event before the server ends the stream', async () => {
      const fetch = createGuardedFetch({ addressGuard: allowAnyAddress() }).orThrow();
      const response = await fetch(`${baseUrl}/events`);
      const reader = response.body!.getReader();
      // The server has not ended the stream — it waits on `finish` — so this read can only
      // succeed if nothing buffered the body.
      await expect(readChunk(reader)).resolves.toBe('data: first\n\n');
      finish();
      await expect(readChunk(reader)).resolves.toBe('data: last\n\n');
      await expect(reader.read()).resolves.toEqual(expect.objectContaining({ done: true }));
    });

    test('a stream that outlives the headers deadline is not cut off', async () => {
      const fetch = createGuardedFetch({ addressGuard: allowAnyAddress(), headersTimeoutMs: 50 }).orThrow();
      const response = await fetch(`${baseUrl}/slow`);
      await expect(response.text()).resolves.toBe('data: first\n\ndata: second\n\n');
    });

    test('an abort after return cancels the body mid-stream', async () => {
      const controller = new AbortController();
      const fetch = createGuardedFetch({ addressGuard: allowAnyAddress() }).orThrow();
      const response = await fetch(`${baseUrl}/events`, { signal: controller.signal });
      const reader = response.body!.getReader();
      await expect(readChunk(reader)).resolves.toBe('data: first\n\n');
      controller.abort();
      await expect(reader.read()).rejects.toBeDefined();
      await clientClosed;
    });

    test("leaves no abort listener on the caller's signal once the response is returned", async () => {
      const controller = new AbortController();
      const fetch = createGuardedFetch({ addressGuard: allowAnyAddress() }).orThrow();
      const responses: Response[] = [];
      for (let i = 0; i < 3; i++) {
        responses.push(await fetch(`${baseUrl}/slow`, { signal: controller.signal }));
      }
      expect(getEventListeners(controller.signal, 'abort')).toHaveLength(0);
      await Promise.all(responses.map((r) => r.text()));
    });
  });
});

describe('request bodies are copied before the first await', () => {
  /** A gate the test opens, so a call can be held inside its address guard. */
  function gate(): { readonly opened: Promise<void>; open: () => void } {
    let open: () => void = () => undefined;
    const opened = new Promise<void>((resolve) => {
      open = resolve;
    });
    return { opened, open: () => open() };
  }

  const bodies: ReadonlyArray<{
    label: string;
    make: () => { body: Uint8Array | ArrayBuffer; bytes: Uint8Array };
  }> = [
    {
      label: 'a Uint8Array',
      make: () => {
        const bytes = new Uint8Array([1, 2, 3]);
        return { body: bytes, bytes };
      }
    },
    {
      label: 'an ArrayBuffer',
      make: () => {
        const buffer = new ArrayBuffer(3);
        const bytes = new Uint8Array(buffer);
        bytes.set([1, 2, 3]);
        return { body: buffer, bytes };
      }
    },
    {
      label: 'a Node Buffer (whose slice() is a view)',
      make: () => {
        const bytes = Buffer.from([1, 2, 3]);
        return { body: bytes, bytes };
      }
    }
  ];

  test.each(bodies)(
    'createGuardedFetch: $label mutated while the address guard runs is sent as approved',
    async ({ make }) => {
      const held = gate();
      const transport = respondWith(() => new Response('ok'));
      const { body, bytes } = make();
      const call = guarded(transport, { addressGuard: gatedGuard(held.opened) })(URL_UNDER_TEST, {
        method: 'POST',
        body: body as BodyInit
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      bytes[0] = 9;
      held.open();
      await call;
      expect(Array.from(transport.calls[0].init.body as Uint8Array)).toEqual([1, 2, 3]);
    }
  );

  test('saferFetchBytes: a body mutated while the guards run is the body the request guard saw, and is sent', async () => {
    const held = gate();
    const transport = respondWith(() => new Response('ok'));
    const bytes = new Uint8Array([1, 2, 3]);
    const seenByRequestGuard: number[][] = [];
    const call = SaferFetch.saferFetchBytes(URL_UNDER_TEST, {
      addressGuard: gatedGuard(held.opened),
      requestGuard: {
        name: 'records',
        check: async (request) => {
          seenByRequestGuard.push(Array.from(request.body as Uint8Array));
          return succeed(request);
        }
      },
      transport,
      method: 'POST',
      body: bytes
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    bytes[0] = 9;
    held.open();
    await expect(call).resolves.toSucceed();
    expect(seenByRequestGuard).toEqual([[1, 2, 3]]);
    expect(Array.from(transport.calls[0].init.body as Uint8Array)).toEqual([1, 2, 3]);
  });
});
