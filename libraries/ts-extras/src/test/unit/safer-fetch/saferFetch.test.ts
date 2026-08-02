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

import { Converters, Logging, Validators, fail, succeed, type Result } from '@fgv/ts-utils';

import { SaferFetch } from '../../..';
import {
  asOpaqueRedirect,
  bytesResponse,
  cancellableStreamOf,
  mockTransport,
  neverResponds,
  respondWith,
  stallingStreamOf,
  erroringStreamOf,
  streamOf,
  utf8,
  type IMockTransport
} from './mockTransport';

const {
  allowAnyAddress,
  allowContentTypes,
  saferFetchBytes,
  saferFetchJson,
  saferFetchText,
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_HEADERS_TIMEOUT_MS
} = SaferFetch;

const URL_UNDER_TEST: string = 'https://example.com/thing';

function options(
  transport: SaferFetch.IFetchTransport,
  overrides?: Partial<SaferFetch.ISaferFetchOptions>
): SaferFetch.ISaferFetchOptions {
  return { addressGuard: allowAnyAddress(), transport, ...overrides };
}

function jsonResponse(value: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
    ...init
  });
}

function textResponse(text: string, contentType: string = 'text/plain; charset=utf-8'): Response {
  return new Response(text, { headers: { 'content-type': contentType } });
}

/** An address guard that always rejects, so the SSRF boundary is observable in the taxonomy. */
function rejectingAddressGuard(name: string = 'testGuard'): SaferFetch.IAddressGuard {
  return { name, check: async (): Promise<Result<SaferFetch.IGuardVerdict>> => fail('nope') };
}

describe('saferFetch entry points', () => {
  describe('success', () => {
    test('saferFetchText returns the decoded body, status, headers and byte count', async () => {
      const transport = respondWith(() => textResponse('hello'));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<string>) => {
          expect(response.value).toBe('hello');
          expect(response.status).toBe(200);
          expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
          expect(response.bytesRead).toBe(5);
          expect(response.urlChain).toEqual([URL_UNDER_TEST]);
        }
      );
    });

    test('saferFetchBytes returns the raw bytes', async () => {
      const transport = respondWith(() => new Response(streamOf([utf8('abc'), utf8('de')])));
      await expect(saferFetchBytes(URL_UNDER_TEST, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<Uint8Array>) => {
          expect(Array.from(response.value)).toEqual(Array.from(utf8('abcde')));
          expect(response.bytesRead).toBe(5);
        }
      );
    });

    test('saferFetchJson parses the body as JsonValue when no converter is supplied', async () => {
      const transport = respondWith(() => jsonResponse({ a: 1, b: ['x'] }));
      await expect(saferFetchJson(URL_UNDER_TEST, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<unknown>) => {
          expect(response.value).toEqual({ a: 1, b: ['x'] });
        }
      );
    });

    test('saferFetchJson runs the supplied converter so a caller reaches a validated T', async () => {
      const converter = Converters.object<{ name: string }>({ name: Converters.string });
      const transport = respondWith(() => jsonResponse({ name: 'widget' }));
      await expect(
        saferFetchJson(URL_UNDER_TEST, { ...options(transport), converter })
      ).resolves.toSucceedAndSatisfy((response: SaferFetch.ISaferFetchResponse<{ name: string }>) => {
        expect(response.value.name).toBe('widget');
      });
    });

    test('saferFetchJson accepts a Validator as well as a Converter', async () => {
      const validator = Validators.object<{ name: string }>({ name: Validators.string });
      const transport = respondWith(() => jsonResponse({ name: 'widget' }));
      await expect(
        saferFetchJson(URL_UNDER_TEST, { ...options(transport), converter: validator })
      ).resolves.toSucceedAndSatisfy((response: SaferFetch.ISaferFetchResponse<{ name: string }>) => {
        expect(response.value.name).toBe('widget');
      });
    });

    // A caller-named T with nothing checking it is a claim the primitive cannot keep, so the
    // surface does not offer one: T comes from the converter or the value comes back JsonValue.
    test('saferFetchJson does not let a caller assert T without a converter', async () => {
      const transport = respondWith(() => jsonResponse({ name: 'widget' }));
      // @ts-expect-error - no overload takes an explicit T without the converter that evidences it.
      await saferFetchJson<{ name: string }>(URL_UNDER_TEST, options(transport));
    });

    test('accepts a URL instance as well as a string', async () => {
      const transport = respondWith(() => textResponse('ok'));
      await expect(saferFetchText(new URL(URL_UNDER_TEST), options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<string>) => {
          expect(response.urlChain).toEqual([URL_UNDER_TEST]);
        }
      );
    });

    test('a response with no body at all reads as zero bytes', async () => {
      const transport = respondWith(() => new Response(null, { status: 204 }));
      await expect(saferFetchBytes(URL_UNDER_TEST, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<Uint8Array>) => {
          expect(response.bytesRead).toBe(0);
          expect(response.status).toBe(204);
        }
      );
    });

    test('sends the requested method, lowercased headers, and body', async () => {
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Trace': 'abc' },
            body: '{"a":1}'
          })
        )
      ).resolves.toSucceed();

      expect(transport.calls).toHaveLength(1);
      expect(transport.calls[0].init.method).toBe('POST');
      expect(transport.calls[0].init.headers).toEqual({
        'content-type': 'application/json',
        'x-trace': 'abc'
      });
      expect(transport.calls[0].init.body).toBe('{"a":1}');
    });

    test('sends a byte body as a copy, so a later mutation cannot change what was sent', async () => {
      const transport = respondWith(() => textResponse('ok'));
      const body = utf8('payload');
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { method: 'PUT', body }))
      ).resolves.toSucceed();

      const sent = transport.calls[0].init.body as Uint8Array;
      expect(Array.from(sent)).toEqual(Array.from(utf8('payload')));
      body[0] = 0;
      expect(sent[0]).not.toBe(0);
    });

    test('defaults to the platform transport when none is supplied', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(textResponse('ok'));
      try {
        await expect(
          saferFetchText(URL_UNDER_TEST, { addressGuard: allowAnyAddress() })
        ).resolves.toSucceedWith(expect.objectContaining({ value: 'ok' }));
        expect(fetchSpy).toHaveBeenCalledWith(
          URL_UNDER_TEST,
          expect.objectContaining({ redirect: 'manual' })
        );
      } finally {
        fetchSpy.mockRestore();
      }
    });

    test('always requests manual redirects so the platform follows nothing on our behalf', async () => {
      const transport = respondWith(() => textResponse('ok'));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toSucceed();
      expect(transport.calls[0].init.redirect).toBe('manual');
    });
  });

  describe('URL and scheme validation', () => {
    test('rejects an unparseable URL', async () => {
      const transport = respondWith(() => textResponse('ok'));
      await expect(saferFetchText('not a url', options(transport))).resolves.toFailWithDetail(
        /invalid URL/i,
        expect.objectContaining({ kind: 'invalid-url', url: 'not a url' })
      );
      expect(transport.calls).toHaveLength(0);
    });

    test.each(['file:///etc/passwd', 'data:text/plain,hi', 'ftp://example.com/x', 'ws://example.com/'])(
      'refuses the scheme of "%s" before any guard or transport is consulted',
      async (url: string) => {
        const transport = respondWith(() => textResponse('ok'));
        await expect(saferFetchText(url, options(transport))).resolves.toFailWithDetail(
          /scheme .* is not supported/i,
          expect.objectContaining({ kind: 'invalid-url' })
        );
        expect(transport.calls).toHaveLength(0);
      }
    );

    test('allows http as well as https, leaving the choice between them to the address guard', async () => {
      const transport = respondWith(() => textResponse('ok'));
      await expect(saferFetchText('http://example.com/', options(transport))).resolves.toSucceed();
    });
  });

  describe('the address guard', () => {
    test('is consulted with the hop chain, and hop 0 is not a special case', async () => {
      const seen: ReadonlyArray<SaferFetch.IRequestHop>[] = [];
      const addressGuard: SaferFetch.IAddressGuard = {
        name: 'recording',
        check: async (chain) => {
          seen.push(chain);
          return succeed({ url: chain[chain.length - 1].url });
        }
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard }))).resolves.toSucceed();

      expect(seen).toHaveLength(1);
      expect(seen[0]).toHaveLength(1);
      expect(seen[0][0].url.toString()).toBe(URL_UNDER_TEST);
    });

    test('a rejection blocks the connect and names the guard and hop', async () => {
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard: rejectingAddressGuard() }))
      ).resolves.toFailWithDetail(/address guard "testGuard" rejected/i, {
        kind: 'blocked-by-guard',
        url: URL_UNDER_TEST,
        hop: 0,
        guard: 'testGuard',
        detail: 'nope'
      });
      expect(transport.calls).toHaveLength(0);
    });

    test('a guard that throws is a rejection, not an escaped exception', async () => {
      const addressGuard: SaferFetch.IAddressGuard = {
        name: 'throwing',
        check: async (): Promise<Result<SaferFetch.IGuardVerdict>> => {
          throw new Error('guard exploded');
        }
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard }))
      ).resolves.toFailWithDetail(
        /guard exploded/,
        expect.objectContaining({ kind: 'blocked-by-guard', guard: 'throwing' })
      );
      expect(transport.calls).toHaveLength(0);
    });

    test('a normalized verdict URL is what actually gets requested', async () => {
      const addressGuard: SaferFetch.IAddressGuard = {
        name: 'normalizing',
        check: async (chain) => {
          const url = new URL(chain[chain.length - 1].url.toString());
          url.hostname = url.hostname.replace(/\.$/, '');
          return succeed({ url });
        }
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText('https://example.com./thing', options(transport, { addressGuard }))
      ).resolves.toSucceedAndSatisfy((response: SaferFetch.ISaferFetchResponse<string>) => {
        expect(response.urlChain).toEqual([URL_UNDER_TEST]);
      });
      expect(transport.calls[0].url.toString()).toBe(URL_UNDER_TEST);
    });

    test('a verdict that normalizes into an unsupported scheme is still refused', async () => {
      const addressGuard: SaferFetch.IAddressGuard = {
        name: 'retargeting',
        check: async () => succeed({ url: new URL('file:///etc/passwd') })
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard }))
      ).resolves.toFailWithDetail(
        /scheme "file:" is not supported/i,
        expect.objectContaining({ kind: 'invalid-url' })
      );
      expect(transport.calls).toHaveLength(0);
    });

    test('a pinned address is handed to the transport as a hint', async () => {
      const addressGuard: SaferFetch.IAddressGuard = {
        name: 'pinning',
        check: async (chain) => succeed({ url: chain[chain.length - 1].url, pinnedAddress: '93.184.216.34' })
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard }))).resolves.toSucceed();
      expect(transport.calls[0].hints.pinnedAddress).toBe('93.184.216.34');
    });

    // Exactly the defect shape that shipped in this repo before: a `!== undefined` test where
    // its siblings used `??`, letting a null install itself as a guard.
    test('is required — a null guard is a hard failure, never a silent passthrough', async () => {
      const transport = respondWith(() => textResponse('ok'));
      const bad = { addressGuard: null, transport } as unknown as SaferFetch.ISaferFetchOptions;
      await expect(saferFetchText(URL_UNDER_TEST, bad)).resolves.toFailWithDetail(
        /addressGuard is required/i,
        expect.objectContaining({ kind: 'unknown' })
      );
      expect(transport.calls).toHaveLength(0);
    });

    test('omitting addressGuard is a compile error, not a runtime surprise', async () => {
      const transport = respondWith(() => textResponse('ok'));
      // @ts-expect-error - addressGuard has no default; its omission must not compile.
      await saferFetchText(URL_UNDER_TEST, { transport });
    });
  });

  describe('the request guard', () => {
    test('defaults to passthrough, and a null guard is treated as absent', async () => {
      const transport = respondWith(() => textResponse('ok'));
      const nulled = {
        addressGuard: allowAnyAddress(),
        transport,
        requestGuard: null,
        responseHeadersGuard: null,
        responseBodyGuard: null
      } as unknown as SaferFetch.ISaferFetchOptions;
      await expect(saferFetchText(URL_UNDER_TEST, nulled)).resolves.toSucceed();
    });

    test('a rejection stops the call before the address guard or the transport', async () => {
      const addressGuard = rejectingAddressGuard('unreached');
      const requestGuard: SaferFetch.IRequestGuard = {
        name: 'noPost',
        check: async (request) => (request.method === 'POST' ? fail('POST is not allowed') : succeed(request))
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, { addressGuard, requestGuard, method: 'POST', body: 'x' })
        )
      ).resolves.toFailWithDetail(/request guard "noPost" rejected/i, {
        kind: 'blocked-by-guard',
        url: URL_UNDER_TEST,
        hop: 0,
        guard: 'noPost',
        detail: 'POST is not allowed'
      });
      expect(transport.calls).toHaveLength(0);
    });

    // Ordering is load-bearing: if the request guard could retarget the URL after the address
    // check, it would be a route around the SSRF boundary.
    test('a replacement request is still address-checked before it is sent', async () => {
      const seen: string[] = [];
      const addressGuard: SaferFetch.IAddressGuard = {
        name: 'recording',
        check: async (chain) => {
          seen.push(chain[chain.length - 1].url.toString());
          return succeed({ url: chain[chain.length - 1].url });
        }
      };
      const requestGuard: SaferFetch.IRequestGuard = {
        name: 'retargeting',
        check: async (request) => succeed({ ...request, url: new URL('https://elsewhere.example/') })
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard, requestGuard }))
      ).resolves.toSucceed();

      expect(seen).toEqual(['https://elsewhere.example/']);
      expect(transport.calls[0].url.toString()).toBe('https://elsewhere.example/');
    });

    test('a replacement request whose scheme is unsupported is refused', async () => {
      const requestGuard: SaferFetch.IRequestGuard = {
        name: 'retargeting',
        check: async (request) => succeed({ ...request, url: new URL('file:///etc/passwd') })
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { requestGuard }))
      ).resolves.toFailWithDetail(
        /scheme "file:" is not supported/i,
        expect.objectContaining({ kind: 'invalid-url' })
      );
      expect(transport.calls).toHaveLength(0);
    });
  });

  describe('the response guards', () => {
    test('a content-type allowlist rejects before any body byte is read', async () => {
      const stream = cancellableStreamOf([utf8('<html>not json</html>')]);
      const transport = respondWith(
        () => new Response(stream.stream, { headers: { 'content-type': 'text/html' } })
      );
      await expect(
        saferFetchJson(
          URL_UNDER_TEST,
          options(transport, {
            responseHeadersGuard: allowContentTypes(['application/json']).orThrow()
          })
        )
      ).resolves.toFailWithDetail(/is not accepted/i, {
        kind: 'unsupported-content-type',
        contentType: 'text/html',
        accepted: ['application/json']
      });
      expect(stream.wasCancelled()).toBe(true);
    });

    test('a content-type allowlist passes a matching response through', async () => {
      const transport = respondWith(() => jsonResponse({ ok: true }));
      await expect(
        saferFetchJson(
          URL_UNDER_TEST,
          options(transport, {
            responseHeadersGuard: allowContentTypes(['application/json']).orThrow()
          })
        )
      ).resolves.toSucceed();
    });

    test('a response-headers guard that is not a content-type allowlist reports as blocked', async () => {
      const responseHeadersGuard: SaferFetch.IResponseHeadersGuard = {
        name: 'noCookies',
        check: async (head) =>
          head.headers['set-cookie'] !== undefined ? fail('response sets a cookie') : succeed(true)
      };
      const transport = respondWith(
        () => new Response('ok', { headers: { 'set-cookie': 'a=1', 'content-type': 'text/plain' } })
      );
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { responseHeadersGuard }))
      ).resolves.toFailWithDetail(
        /response-headers guard "noCookies" rejected/i,
        expect.objectContaining({ kind: 'blocked-by-guard', guard: 'noCookies' })
      );
    });

    test('a response-body guard sees the buffered body and can reject it', async () => {
      const seen: Uint8Array[] = [];
      const responseBodyGuard: SaferFetch.IResponseBodyGuard = {
        name: 'noSecrets',
        check: async (body) => {
          seen.push(body);
          return fail('body looks wrong');
        }
      };
      const transport = respondWith(() => textResponse('hello'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { responseBodyGuard }))
      ).resolves.toFailWithDetail(
        /response-body guard "noSecrets" rejected/i,
        expect.objectContaining({ kind: 'blocked-by-guard', guard: 'noSecrets' })
      );
      expect(seen).toHaveLength(1);
      expect(Array.from(seen[0])).toEqual(Array.from(utf8('hello')));
    });
  });

  describe('redirects', () => {
    test.each([301, 302, 303, 307, 308])('a %i is rejected rather than followed', async (status: number) => {
      const transport = respondWith(
        () => new Response(null, { status, headers: { location: 'http://169.254.169.254/' } })
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /redirects are rejected/i,
        { kind: 'redirect-rejected', url: URL_UNDER_TEST, status }
      );
    });

    test.each([300, 304])(
      'a %i is not a redirect this primitive follows, and reports as an ordinary status',
      async (status: number) => {
        const transport = respondWith(() => new Response(null, { status }));
        await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
          /returned /i,
          expect.objectContaining({ kind: 'http-status', status })
        );
      }
    );

    test('an opaque redirect fails loudly, because its target cannot be inspected', async () => {
      const transport = respondWith(() => asOpaqueRedirect(new Response('')));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /opaque redirect/i,
        { kind: 'redirect-opaque' }
      );
    });

    test('a redirect policy this release does not implement is refused, not silently ignored', async () => {
      const transport = respondWith(() => textResponse('ok'));
      const bad = options(transport, {
        redirectPolicy: 'follow-unvalidated' as unknown as SaferFetch.SaferFetchRedirectPolicy
      });
      await expect(saferFetchText(URL_UNDER_TEST, bad)).resolves.toFailWithDetail(
        /redirectPolicy "follow-unvalidated" is not supported/i,
        expect.objectContaining({ kind: 'unknown' })
      );
      expect(transport.calls).toHaveLength(0);
    });

    test('an explicit reject policy is accepted', async () => {
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { redirectPolicy: 'reject' }))
      ).resolves.toSucceed();
    });
  });

  describe('status and transport failures', () => {
    test('a non-2xx status reports the status and never a body preview', async () => {
      const transport = respondWith(
        () => new Response('token=sekrit', { status: 404, statusText: 'Not Found' })
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /returned 404 Not Found/,
        { kind: 'http-status', status: 404, statusText: 'Not Found' }
      );
    });

    test('a transport failure is reported as a network condition, naming the transport', async () => {
      const transport = mockTransport(() => fail('connection refused'));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /transport "mockTransport" failed/i,
        { kind: 'network', detail: 'connection refused' }
      );
    });

    test('a transport that throws is a network failure, not an escaped exception', async () => {
      const transport = mockTransport(() => {
        throw new Error('socket hang up');
      });
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /socket hang up/,
        expect.objectContaining({ kind: 'network' })
      );
    });
  });

  describe('the streaming size cap', () => {
    test('rejects on Content-Length before the body is touched, when the server is honest', async () => {
      const stream = cancellableStreamOf([utf8('x'.repeat(100))]);
      const transport = respondWith(
        () =>
          new Response(stream.stream, {
            headers: { 'content-length': '100', 'content-type': 'text/plain' }
          })
      );
      await expect(
        saferFetchBytes(URL_UNDER_TEST, options(transport, { maxResponseBytes: 10 }))
      ).resolves.toFailWithDetail(/declares 100 bytes/i, {
        kind: 'too-large',
        bytesRead: 0,
        limit: 10,
        declared: 100
      });
      expect(stream.wasCancelled()).toBe(true);
    });

    // A body stream can end three ways: it closes, it stalls forever, or it errors. The first
    // two are covered above and under 'timeouts and cancellation'; this is the third. A
    // connection dropping mid-transfer is ordinary AC2 behaviour, and the entry points are
    // documented to return a Result rather than throw — so an escaping rejection here would
    // break the primitive's central guarantee at exactly the moment the network misbehaves.
    test('reports a mid-read connection drop as a network failure rather than throwing', async () => {
      const transport = respondWith(() => new Response(erroringStreamOf([utf8('abc')])));
      await expect(saferFetchBytes(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /response body read failed.*terminated/i,
        {
          kind: 'network',
          detail: expect.stringContaining('terminated')
        }
      );
    });

    test('a mid-read drop on the text entry point is also a Result, not a throw', async () => {
      const transport = respondWith(
        () =>
          new Response(erroringStreamOf([utf8('partial')]), {
            headers: { 'content-type': 'text/plain' }
          })
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /response body read failed/i,
        { kind: 'network', detail: expect.stringContaining('terminated') }
      );
    });

    // The load-bearing case: Content-Length is absent on chunked responses, so the cap has to
    // hold with no help from it.
    test('holds when Content-Length is absent entirely', async () => {
      const transport = respondWith(() => new Response(streamOf([utf8('x'.repeat(8)), utf8('y'.repeat(8))])));
      await expect(
        saferFetchBytes(URL_UNDER_TEST, options(transport, { maxResponseBytes: 10 }))
      ).resolves.toFailWithDetail(/exceeded the 10-byte cap after 16 bytes/i, {
        kind: 'too-large',
        bytesRead: 16,
        limit: 10,
        declared: undefined
      });
    });

    // And the hostile case: Content-Length is a value the adversary chooses freely.
    test('holds when Content-Length lies, and records the lie', async () => {
      const transport = respondWith(
        () =>
          new Response(streamOf([utf8('x'.repeat(50)), utf8('y'.repeat(50))]), {
            headers: { 'content-length': '5' }
          })
      );
      await expect(
        saferFetchBytes(URL_UNDER_TEST, options(transport, { maxResponseBytes: 20 }))
      ).resolves.toFailWithDetail(/exceeded the 20-byte cap/i, {
        kind: 'too-large',
        bytesRead: 50,
        limit: 20,
        declared: 5
      });
    });

    // The failure returns correctly whether or not the reader is cancelled; only an explicit
    // assertion catches a transfer that keeps running against a call that has given up.
    test('cancels the reader on overflow, so the connection is released', async () => {
      const stream = cancellableStreamOf([utf8('x'.repeat(50)), utf8('y'.repeat(50))]);
      const transport = respondWith(() => new Response(stream.stream));
      await expect(
        saferFetchBytes(URL_UNDER_TEST, options(transport, { maxResponseBytes: 20 }))
      ).resolves.toFail();
      expect(stream.wasCancelled()).toBe(true);
    });

    test('a body exactly at the cap is accepted', async () => {
      const transport = respondWith(() => new Response(streamOf([utf8('x'.repeat(10))])));
      await expect(
        saferFetchBytes(URL_UNDER_TEST, options(transport, { maxResponseBytes: 10 }))
      ).resolves.toSucceedAndSatisfy((response: SaferFetch.ISaferFetchResponse<Uint8Array>) => {
        expect(response.bytesRead).toBe(10);
      });
    });

    test('ignores a malformed Content-Length rather than treating it as a size', async () => {
      const transport = respondWith(
        () => new Response(streamOf([utf8('hello')]), { headers: { 'content-length': 'lots' } })
      );
      await expect(saferFetchBytes(URL_UNDER_TEST, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<Uint8Array>) => {
          expect(response.bytesRead).toBe(5);
        }
      );
    });

    test('the cap defaults to 5 MiB and is tunable per call', async () => {
      expect(DEFAULT_MAX_RESPONSE_BYTES).toBe(5 * 1024 * 1024);

      const oversized = (): Response => new Response(streamOf([utf8('x'.repeat(64))]));
      await expect(
        saferFetchBytes(URL_UNDER_TEST, options(respondWith(oversized), { maxResponseBytes: 32 }))
      ).resolves.toFailWithDetail(/exceeded the 32-byte cap/i, expect.objectContaining({ limit: 32 }));
      await expect(
        saferFetchBytes(URL_UNDER_TEST, options(respondWith(oversized), { maxResponseBytes: 128 }))
      ).resolves.toSucceed();
      await expect(saferFetchBytes(URL_UNDER_TEST, options(respondWith(oversized)))).resolves.toSucceed();
    });
  });

  describe('timeouts and cancellation', () => {
    test('the headers deadline fires when the host never answers', async () => {
      const transport = neverResponds();
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { headersTimeoutMs: 10, timeoutMs: 5_000 }))
      ).resolves.toFailWithDetail(
        /timed out \(headers\)/i,
        expect.objectContaining({ kind: 'timeout', phase: 'headers', limitMs: 10 })
      );
    });

    test('the overall deadline fires before headers when it is the tighter of the two', async () => {
      const transport = neverResponds();
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { timeoutMs: 10, headersTimeoutMs: 5_000 }))
      ).resolves.toFailWithDetail(
        /timed out \(overall\)/i,
        expect.objectContaining({ kind: 'timeout', phase: 'overall', limitMs: 10 })
      );
    });

    // A body that dribbles passes every per-read check and never trips a connect timeout; the
    // overall deadline is the only thing that stops it.
    test('the overall deadline stops a body that trickles and never finishes', async () => {
      const stream = stallingStreamOf([utf8('partial')]);
      const transport = respondWith(() => new Response(stream.stream));
      await expect(
        saferFetchBytes(URL_UNDER_TEST, options(transport, { timeoutMs: 30, headersTimeoutMs: 5_000 }))
      ).resolves.toFailWithDetail(
        /timed out \(body\)/i,
        expect.objectContaining({ kind: 'timeout', phase: 'body', limitMs: 30 })
      );
      expect(stream.wasCancelled()).toBe(true);
    });

    test('an already-aborted caller signal is reported as aborted, never as a timeout', async () => {
      const controller = new AbortController();
      controller.abort();
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { signal: controller.signal }))
      ).resolves.toFailWithDetail(/aborted by caller/i, { kind: 'aborted' });
      expect(transport.calls).toHaveLength(0);
    });

    test('a caller abort mid-flight is reported as aborted, never as a network failure', async () => {
      const controller = new AbortController();
      const transport: IMockTransport = mockTransport(
        async (call) =>
          new Promise<Result<Response>>((resolve) => {
            call.init.signal?.addEventListener('abort', () => resolve(fail('AbortError')));
            controller.abort();
          })
      );
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { signal: controller.signal }))
      ).resolves.toFailWithDetail(/aborted by caller/i, { kind: 'aborted' });
    });

    test('the composed signal is handed to the transport so it can cancel its own work', async () => {
      const transport = respondWith(() => textResponse('ok'));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toSucceed();
      expect(transport.calls[0].init.signal).toBeDefined();
    });

    test('the deadlines have documented defaults', () => {
      expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
      expect(DEFAULT_HEADERS_TIMEOUT_MS).toBe(10_000);
    });

    // A guard that hangs — a stalled DNS lookup, an unresponsive remote classifier — must not
    // hang the call. Each seam is inside the same deadline as the request itself.
    test('a hanging address guard is stopped by the deadline', async () => {
      const addressGuard: SaferFetch.IAddressGuard = {
        name: 'hanging',
        check: () => new Promise<Result<SaferFetch.IGuardVerdict>>(() => undefined)
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard, timeoutMs: 20 }))
      ).resolves.toFailWithDetail(
        /timed out/i,
        expect.objectContaining({ kind: 'timeout', phase: 'overall' })
      );
      expect(transport.calls).toHaveLength(0);
    });

    test('a hanging response-headers guard is stopped by the deadline, and the body released', async () => {
      const stream = stallingStreamOf([]);
      const responseHeadersGuard: SaferFetch.IResponseHeadersGuard = {
        name: 'hanging',
        check: () => new Promise<Result<true>>(() => undefined)
      };
      const transport = respondWith(() => new Response(stream.stream));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { responseHeadersGuard, timeoutMs: 20 }))
      ).resolves.toFailWithDetail(/timed out/i, expect.objectContaining({ kind: 'timeout' }));
      expect(stream.wasCancelled()).toBe(true);
    });

    test('a hanging response-body guard is stopped by the deadline', async () => {
      const responseBodyGuard: SaferFetch.IResponseBodyGuard = {
        name: 'hanging',
        check: () => new Promise<Result<true>>(() => undefined)
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { responseBodyGuard, timeoutMs: 20 }))
      ).resolves.toFailWithDetail(/timed out/i, expect.objectContaining({ kind: 'timeout' }));
    });

    test('a hanging request guard is stopped by the deadline', async () => {
      const requestGuard: SaferFetch.IRequestGuard = {
        name: 'hanging',
        check: () => new Promise<Result<SaferFetch.ISaferFetchRequest>>(() => undefined)
      };
      const transport = respondWith(() => textResponse('ok'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { requestGuard, timeoutMs: 20 }))
      ).resolves.toFailWithDetail(/timed out/i, expect.objectContaining({ kind: 'timeout' }));
      expect(transport.calls).toHaveLength(0);
    });
  });

  describe('decoding and parsing', () => {
    test('honors the charset parameter rather than assuming UTF-8', async () => {
      const latin1 = new Uint8Array([0xe9, 0x74, 0xe9]);
      const transport = respondWith(() =>
        bytesResponse(latin1, { headers: { 'content-type': 'text/plain; charset=iso-8859-1' } })
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<string>) => {
          expect(response.value).toBe('été');
        }
      );
    });

    test('honors a quoted charset parameter', async () => {
      const transport = respondWith(
        () => new Response('hi', { headers: { 'content-type': 'text/plain; charset="utf-8"' } })
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toSucceedWith(
        expect.objectContaining({ value: 'hi' })
      );
    });

    test('defaults to UTF-8 when no charset is declared', async () => {
      const transport = respondWith(() => bytesResponse(utf8('héllo')));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toSucceedWith(
        expect.objectContaining({ value: 'héllo' })
      );
    });

    test('fails on an unknown charset rather than silently producing mojibake', async () => {
      const transport = respondWith(
        () => new Response('hi', { headers: { 'content-type': 'text/plain; charset=klingon' } })
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /failed to decode response as "klingon"/i,
        expect.objectContaining({ kind: 'decode' })
      );
    });

    test('fails on bytes that are not valid in the declared charset', async () => {
      const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xfd]);
      const transport = respondWith(() =>
        bytesResponse(invalidUtf8, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /failed to decode/i,
        expect.objectContaining({ kind: 'decode' })
      );
    });

    test('saferFetchJson surfaces a decode failure before it tries to parse', async () => {
      const transport = respondWith(
        () => new Response('{}', { headers: { 'content-type': 'application/json; charset=klingon' } })
      );
      await expect(saferFetchJson(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /failed to decode/i,
        expect.objectContaining({ kind: 'decode' })
      );
    });

    test('reports malformed JSON as a parse failure', async () => {
      const transport = respondWith(
        () => new Response('{not json', { headers: { 'content-type': 'application/json' } })
      );
      await expect(saferFetchJson(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
        /failed to parse response as JSON/i,
        expect.objectContaining({ kind: 'parse' })
      );
    });

    test('reports a converter rejection as a parse failure, naming what was wrong', async () => {
      const converter = Converters.object<{ name: string }>({ name: Converters.string });
      const transport = respondWith(() => jsonResponse({ name: 42 }));
      await expect(
        saferFetchJson(URL_UNDER_TEST, { ...options(transport), converter })
      ).resolves.toFailWithDetail(
        /failed to parse response as JSON/i,
        expect.objectContaining({ kind: 'parse' })
      );
    });
  });

  describe('option validation', () => {
    test.each<[string, Partial<SaferFetch.ISaferFetchOptions>, RegExp]>([
      ['a zero overall deadline', { timeoutMs: 0 }, /timeoutMs must be a positive/i],
      ['a negative headers deadline', { headersTimeoutMs: -1 }, /headersTimeoutMs must be a positive/i],
      ['a zero byte cap', { maxResponseBytes: 0 }, /maxResponseBytes must be a positive/i],
      ['a non-finite deadline', { timeoutMs: Number.POSITIVE_INFINITY }, /timeoutMs must be a positive/i],
      ['a body on a GET', { body: 'x' }, /GET request cannot carry a body/i],
      ['a body on a HEAD', { method: 'HEAD', body: 'x' }, /HEAD request cannot carry a body/i]
    ])(
      'refuses %s',
      async (__name: string, overrides: Partial<SaferFetch.ISaferFetchOptions>, expected: RegExp) => {
        const transport = respondWith(() => textResponse('ok'));
        await expect(saferFetchText(URL_UNDER_TEST, options(transport, overrides))).resolves.toFailWithDetail(
          expected,
          expect.objectContaining({ kind: 'unknown' })
        );
        expect(transport.calls).toHaveLength(0);
      }
    );
  });

  describe('diagnostics', () => {
    test('logs a failure to the supplied logger without changing what the caller receives', async () => {
      const logger = new Logging.InMemoryLogger('detail');
      const transport = respondWith(() => new Response('nope', { status: 500 }));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport, { logger }))).resolves.toFailWithDetail(
        /returned 500/,
        expect.objectContaining({ kind: 'http-status' })
      );
      expect(logger.logged.join('\n')).toMatch(/saferFetch: https:\/\/example\.com\/thing failed/);
    });

    test('logs nothing on success', async () => {
      const logger = new Logging.InMemoryLogger('detail');
      const transport = respondWith(() => textResponse('ok'));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport, { logger }))).resolves.toSucceed();
      expect(logger.logged).toHaveLength(0);
    });
  });
});
