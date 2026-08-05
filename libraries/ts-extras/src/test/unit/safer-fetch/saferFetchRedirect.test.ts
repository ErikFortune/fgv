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

import { fail, succeed, type Result } from '@fgv/ts-utils';

import { SaferFetch } from '../../..';
import { mockTransport, type IMockTransport, type IRecordedCall } from './mockTransport';

const { allowAnyAddress, blockPrivateNetworks, saferFetchText } = SaferFetch;

const START: string = 'https://start.example/first';

function options(
  transport: SaferFetch.IFetchTransport,
  overrides?: Partial<SaferFetch.ISaferFetchOptions>
): SaferFetch.ISaferFetchOptions {
  return {
    addressGuard: allowAnyAddress(),
    transport,
    redirectPolicy: 'validate-each-hop',
    ...overrides
  };
}

function redirect(status: number, location: string): Response {
  return new Response(null, { status, headers: { location } });
}

function ok(text: string): Response {
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

/** One scripted answer: a URL, and the response to give when it is requested. */
type ScriptEntry = readonly [string, () => Response];

/**
 * A transport that answers by URL. Anything not scripted returns a `200` naming itself, so a
 * chain that wandered somewhere unexpected shows up as the wrong body rather than as a hang.
 *
 * Entries rather than an object literal because the keys are URLs, which no identifier naming
 * convention accepts. The responses are thunks because a chain may request the same URL twice
 * and a `Response` body is a single-use stream.
 */
function scripted(...script: ReadonlyArray<ScriptEntry>): IMockTransport {
  const responders = new Map<string, () => Response>(script);
  return mockTransport((call: IRecordedCall) => {
    const key = call.url.toString();
    const responder = responders.get(key);
    return succeed(responder !== undefined ? responder() : ok(`unscripted:${key}`));
  });
}

function headersOf(call: IRecordedCall): Headers {
  // Built from what the transport was actually handed, so the assertion is about the wire and
  // not about an internal record we happen to keep.
  return new Headers(call.init.headers);
}

function requestedUrls(transport: IMockTransport): ReadonlyArray<string> {
  return transport.calls.map((c) => c.url.toString());
}

/** An address guard that records every chain it was shown. */
interface IObservingGuard {
  readonly guard: SaferFetch.IAddressGuard;
  readonly chains: ReadonlyArray<ReadonlyArray<SaferFetch.IRequestHop>>;
}

function observingGuard(pinnedAddress?: string): IObservingGuard {
  const chains: ReadonlyArray<SaferFetch.IRequestHop>[] = [];
  return {
    chains,
    guard: {
      name: 'observing',
      check: async (
        chain: ReadonlyArray<SaferFetch.IRequestHop>
      ): Promise<Result<SaferFetch.IGuardVerdict>> => {
        chains.push(chain.map((hop) => ({ ...hop })));
        return succeed({
          url: chain[chain.length - 1].url,
          ...(pinnedAddress !== undefined ? { pinnedAddress } : {})
        });
      }
    }
  };
}

/** A `blockPrivateNetworks` guard whose resolution is scripted, so no test touches DNS. */
function guardResolving(map: Readonly<Record<string, ReadonlyArray<string>>>): SaferFetch.IAddressGuard {
  return blockPrivateNetworks({
    resolve: async (hostname: string): Promise<Result<ReadonlyArray<string>>> =>
      succeed(map[hostname] ?? ['93.184.216.34'])
  });
}

describe('saferFetch redirect walk', () => {
  describe('policy', () => {
    test("'reject' is the default and fails on a redirect without following it", async () => {
      const transport = scripted([START, () => redirect(302, 'https://elsewhere.example/')]);
      await expect(
        saferFetchText(START, { addressGuard: allowAnyAddress(), transport })
      ).resolves.toFailWithDetail(/redirects are rejected/, {
        kind: 'redirect-rejected',
        url: START,
        status: 302
      });
      expect(transport.calls).toHaveLength(1);
    });

    test.each([
      ['negative', -1],
      ['fractional', 1.5],
      ['infinite', Number.POSITIVE_INFINITY]
    ])('rejects a %s maxRedirects', async (__name: string, maxRedirects: number) => {
      const transport = scripted();
      await expect(saferFetchText(START, options(transport, { maxRedirects }))).resolves.toFailWith(
        /maxRedirects must be a non-negative integer/
      );
      expect(transport.calls).toHaveLength(0);
    });

    // These names decide which headers get stripped on a cross-origin hop, and the types are only
    // enforced for TypeScript callers. A JavaScript caller passing the wrong shape must be told,
    // not silently given a set that stops matching the credential it was meant to strip.
    test.each([
      ['a bare string instead of an array', 'authorization', /sensitiveHeaders must be an array/],
      ['a non-string entry', ['x-token', 42], /sensitiveHeaders\[1\] must be a string header name/],
      ['an undefined entry', ['x-token', undefined], /sensitiveHeaders\[1\] must be a string header name/]
    ])(
      'rejects %s for sensitiveHeaders',
      async (__name: string, sensitiveHeaders: unknown, expected: RegExp) => {
        const transport = scripted();
        await expect(
          saferFetchText(
            START,
            options(transport, {
              sensitiveHeaders: sensitiveHeaders as unknown as ReadonlyArray<string>
            })
          )
        ).resolves.toFailWith(expected);
        expect(transport.calls).toHaveLength(0);
      }
    );
  });

  describe('following', () => {
    test('follows a hop and reports every URL requested', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'https://end.example/second')],
        ['https://end.example/second', () => ok('arrived')]
      );
      await expect(saferFetchText(START, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<string>) => {
          expect(response.value).toBe('arrived');
          expect(response.urlChain).toEqual([START, 'https://end.example/second']);
        }
      );
      expect(requestedUrls(transport)).toEqual([START, 'https://end.example/second']);
    });

    test.each([301, 302, 303, 307, 308])('follows a %d', async (status: number) => {
      const transport = scripted(
        [START, () => redirect(status, 'https://end.example/second')],
        ['https://end.example/second', () => ok('arrived')]
      );
      await expect(saferFetchText(START, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<string>) => {
          expect(response.value).toBe('arrived');
        }
      );
    });

    test('resolves a relative Location against the hop that sent it, not the original URL', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'https://mid.example/a/b')],
        ['https://mid.example/a/b', () => redirect(302, 'c')],
        ['https://mid.example/a/c', () => ok('relative')]
      );
      await expect(saferFetchText(START, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<string>) => {
          expect(response.value).toBe('relative');
          expect(response.urlChain).toEqual([START, 'https://mid.example/a/b', 'https://mid.example/a/c']);
        }
      );
    });

    test('sends every hop with redirect: manual so the platform follows nothing', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'https://end.example/second')],
        ['https://end.example/second', () => ok('arrived')]
      );
      await expect(saferFetchText(START, options(transport))).resolves.toSucceed();
      for (const call of transport.calls) {
        expect(call.init.redirect).toBe('manual');
      }
    });
  });

  describe('the guard runs on every hop', () => {
    test('a 302 to the metadata endpoint is blocked at the hop and never reaches the transport', async () => {
      const transport = scripted([
        START,
        () => redirect(302, 'http://169.254.169.254/latest/meta-data/iam/security-credentials/')
      ]);
      await expect(
        saferFetchText(START, options(transport, { addressGuard: guardResolving({}) }))
      ).resolves.toFailWithDetail(
        /link-local/,
        expect.objectContaining({
          kind: 'blocked-by-guard',
          url: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
          hop: 1,
          guard: 'blockPrivateNetworks'
        })
      );
      // The assertion that matters: the request was never made. A failure that arrived after the
      // connect would look identical to the caller and would still have hit the metadata service.
      expect(requestedUrls(transport)).toEqual([START]);
    });

    test('a 302 to loopback is blocked by default and permitted only on explicit opt-in', async () => {
      const script: ReadonlyArray<ScriptEntry> = [
        [START, () => redirect(302, 'http://127.0.0.1:11434/v1/models')],
        ['http://127.0.0.1:11434/v1/models', () => ok('sidecar')]
      ];

      const blocked = scripted(...script);
      await expect(
        saferFetchText(START, options(blocked, { addressGuard: guardResolving({}) }))
      ).resolves.toFailWith(/127\.0\.0\.1 is loopback/);
      expect(requestedUrls(blocked)).toEqual([START]);

      const permitted = scripted(...script);
      await expect(
        saferFetchText(
          START,
          options(permitted, {
            addressGuard: blockPrivateNetworks({
              allowLoopback: true,
              resolve: async (): Promise<Result<ReadonlyArray<string>>> => succeed(['93.184.216.34'])
            })
          })
        )
      ).resolves.toSucceedAndSatisfy((response: SaferFetch.ISaferFetchResponse<string>) => {
        expect(response.value).toBe('sidecar');
      });
      expect(requestedUrls(permitted)).toEqual([START, 'http://127.0.0.1:11434/v1/models']);
    });

    test('a hop whose host resolves to one public and one private address is refused', async () => {
      const transport = scripted([START, () => redirect(302, 'https://rebind.example/target')]);
      await expect(
        saferFetchText(
          START,
          options(transport, {
            addressGuard: guardResolving({ 'rebind.example': ['93.184.216.34', '10.0.0.5'] })
          })
        )
      ).resolves.toFailWith(/10\.0\.0\.5 is private/);
      expect(requestedUrls(transport)).toEqual([START]);
    });

    test('the guard sees the whole chain, oldest first, with the producing status on each hop', async () => {
      const observed = observingGuard();
      const transport = scripted(
        [START, () => redirect(302, 'https://mid.example/b')],
        ['https://mid.example/b', () => redirect(307, 'https://end.example/c')],
        ['https://end.example/c', () => ok('done')]
      );
      await expect(
        saferFetchText(START, options(transport, { addressGuard: observed.guard }))
      ).resolves.toSucceed();

      expect(observed.chains.map((c) => c.length)).toEqual([1, 2, 3]);
      const last = observed.chains[2];
      expect(last.map((hop) => hop.url.toString())).toEqual([
        START,
        'https://mid.example/b',
        'https://end.example/c'
      ]);
      expect(last.map((hop) => hop.status)).toEqual([302, 307, undefined]);
      // Hop 0 is not a special case: the very first check already receives a chain.
      expect(observed.chains[0][0].status).toBeUndefined();
    });

    test('records connectedAddress on earlier hops once a guard pins and the transport accepts', async () => {
      const observed = observingGuard('93.184.216.34');
      const transport = scripted(
        [START, () => redirect(302, 'https://end.example/second')],
        ['https://end.example/second', () => ok('done')]
      );
      await expect(
        saferFetchText(START, options(transport, { addressGuard: observed.guard }))
      ).resolves.toSucceed();

      expect(transport.calls[0].hints.pinnedAddress).toBe('93.184.216.34');
      expect(observed.chains[1][0].connectedAddress).toBe('93.184.216.34');
      // The hop under consideration has not connected yet, so it has nothing to report.
      expect(observed.chains[1][1].connectedAddress).toBeUndefined();
    });
  });

  describe('credential stripping', () => {
    const AUTH: Readonly<Record<string, string>> = {
      authorization: 'Bearer secret',
      cookie: 'session=abc',
      'proxy-authorization': 'Basic zzz',
      accept: 'text/plain'
    };

    test('keeps credentials on a same-origin hop', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'https://start.example/second')],
        ['https://start.example/second', () => ok('same origin')]
      );
      await expect(saferFetchText(START, options(transport, { headers: AUTH }))).resolves.toSucceed();
      expect(headersOf(transport.calls[1]).get('authorization')).toBe('Bearer secret');
      expect(headersOf(transport.calls[1]).get('cookie')).toBe('session=abc');
    });

    test('drops credentials on a cross-origin hop and keeps ordinary headers', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'https://other.example/second')],
        ['https://other.example/second', () => ok('cross origin')]
      );
      await expect(saferFetchText(START, options(transport, { headers: AUTH }))).resolves.toSucceed();
      const sent = headersOf(transport.calls[1]);
      expect(sent.get('authorization')).toBeNull();
      expect(sent.get('cookie')).toBeNull();
      expect(sent.get('proxy-authorization')).toBeNull();
      expect(sent.get('accept')).toBe('text/plain');
    });

    test('a port change is a cross-origin hop', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'https://start.example:8443/second')],
        ['https://start.example:8443/second', () => ok('other port')]
      );
      await expect(saferFetchText(START, options(transport, { headers: AUTH }))).resolves.toSucceed();
      expect(headersOf(transport.calls[1]).get('authorization')).toBeNull();
    });

    test('a scheme downgrade is a cross-origin hop', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'http://start.example/second')],
        ['http://start.example/second', () => ok('downgraded')]
      );
      await expect(saferFetchText(START, options(transport, { headers: AUTH }))).resolves.toSucceed();
      expect(headersOf(transport.calls[1]).get('authorization')).toBeNull();
    });

    test('A → B → A does NOT re-attach credentials on the final hop', async () => {
      // The leak this exists to catch: comparing the final hop only against the caller's original
      // origin finds it same-origin with A and hands the token back — after B has already watched
      // the chain go past. It reviews as correct and it is a real credential disclosure.
      const transport = scripted(
        [START, () => redirect(302, 'https://launder.example/hop')],
        ['https://launder.example/hop', () => redirect(302, 'https://start.example/back')],
        ['https://start.example/back', () => ok('returned')]
      );
      await expect(saferFetchText(START, options(transport, { headers: AUTH }))).resolves.toSucceed();

      expect(requestedUrls(transport)).toEqual([
        START,
        'https://launder.example/hop',
        'https://start.example/back'
      ]);
      expect(headersOf(transport.calls[0]).get('authorization')).toBe('Bearer secret');
      expect(headersOf(transport.calls[1]).get('authorization')).toBeNull();
      expect(headersOf(transport.calls[2]).get('authorization')).toBeNull();
      expect(headersOf(transport.calls[2]).get('cookie')).toBeNull();
    });

    test('drops caller-declared sensitive headers too, case-insensitively', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'https://other.example/second')],
        ['https://other.example/second', () => ok('cross origin')]
      );
      await expect(
        saferFetchText(
          START,
          options(transport, {
            headers: { 'x-api-key': 'k', 'x-trace': 't' },
            sensitiveHeaders: ['X-API-Key']
          })
        )
      ).resolves.toSucceed();
      expect(headersOf(transport.calls[1]).get('x-api-key')).toBeNull();
      expect(headersOf(transport.calls[1]).get('x-trace')).toBe('t');
    });

    test('strips a credential a request guard added under a non-lowercase spelling', async () => {
      // A caller's headers are lowercased at the boundary, but a request guard returns a
      // replacement request whose header names it chose. A strip keyed on the exact string
      // `authorization` would sail straight past `Authorization` and replay the token.
      const adding: SaferFetch.IRequestGuard = {
        name: 'adding',
        check: async (
          request: SaferFetch.ISaferFetchRequest
        ): Promise<Result<SaferFetch.ISaferFetchRequest>> =>
          request.url.toString() === START
            ? succeed({ ...request, headers: { ...request.headers, Authorization: 'Bearer secret' } })
            : succeed(request)
      };
      const transport = scripted(
        [START, () => redirect(302, 'https://other.example/second')],
        ['https://other.example/second', () => ok('done')]
      );
      await expect(saferFetchText(START, options(transport, { requestGuard: adding }))).resolves.toSucceed();
      expect(headersOf(transport.calls[0]).get('authorization')).toBe('Bearer secret');
      expect(headersOf(transport.calls[1]).get('authorization')).toBeNull();
    });
  });

  describe('method and body rewriting', () => {
    async function follow(
      status: number,
      method: SaferFetch.SaferFetchMethod,
      body?: string
    ): Promise<IMockTransport> {
      const transport = scripted(
        [START, () => redirect(status, 'https://end.example/second')],
        ['https://end.example/second', () => ok('done')]
      );
      await expect(
        saferFetchText(
          START,
          options(transport, {
            method,
            ...(body !== undefined ? { body } : {}),
            headers: { 'content-type': 'application/json' }
          })
        )
      ).resolves.toSucceed();
      return transport;
    }

    test.each([301, 302])('%d converts a POST to a GET and drops the body', async (status: number) => {
      const transport = await follow(status, 'POST', '{"a":1}');
      expect(transport.calls[1].init.method).toBe('GET');
      expect(transport.calls[1].init.body).toBeUndefined();
      // A Content-Type describing a body that is no longer there is not a rounding error on a
      // request the next hop's guards are about to inspect.
      expect(headersOf(transport.calls[1]).get('content-type')).toBeNull();
    });

    test.each([301, 302])('%d leaves a non-POST method and its body alone', async (status: number) => {
      const transport = await follow(status, 'PUT', '{"a":1}');
      expect(transport.calls[1].init.method).toBe('PUT');
      expect(transport.calls[1].init.body).toBe('{"a":1}');
      expect(headersOf(transport.calls[1]).get('content-type')).toBe('application/json');
    });

    test('303 converts any non-GET/HEAD method to a GET and drops the body', async () => {
      const transport = await follow(303, 'PUT', '{"a":1}');
      expect(transport.calls[1].init.method).toBe('GET');
      expect(transport.calls[1].init.body).toBeUndefined();
    });

    test('303 leaves a GET alone', async () => {
      const transport = await follow(303, 'GET');
      expect(transport.calls[1].init.method).toBe('GET');
      expect(headersOf(transport.calls[1]).get('content-type')).toBe('application/json');
    });

    test.each([307, 308])('%d preserves both method and body', async (status: number) => {
      const transport = await follow(status, 'POST', '{"a":1}');
      expect(transport.calls[1].init.method).toBe('POST');
      expect(transport.calls[1].init.body).toBe('{"a":1}');
      expect(headersOf(transport.calls[1]).get('content-type')).toBe('application/json');
    });
  });

  describe('bounding the chain', () => {
    /** `hop-<n>` redirects to `hop-<n+1>`, forever. */
    function endlessChain(): IMockTransport {
      return mockTransport((call: IRecordedCall) => {
        const n = Number(call.url.pathname.slice('/hop-'.length));
        return succeed(redirect(302, `https://chain.example/hop-${n + 1}`));
      });
    }

    test('fails past the default hop cap', async () => {
      const transport = endlessChain();
      await expect(
        saferFetchText('https://chain.example/hop-0', options(transport))
      ).resolves.toFailWithDetail(/exceeded the limit of 5 hops/, {
        kind: 'too-many-redirects',
        hops: 6,
        limit: 5
      });
      expect(transport.calls).toHaveLength(6);
    });

    test('honors a lower cap', async () => {
      const transport = endlessChain();
      await expect(
        saferFetchText('https://chain.example/hop-0', options(transport, { maxRedirects: 2 }))
      ).resolves.toFailWithDetail(/exceeded the limit of 2 hops/, {
        kind: 'too-many-redirects',
        hops: 3,
        limit: 2
      });
      expect(transport.calls).toHaveLength(3);
    });

    test('maxRedirects: 0 follows nothing', async () => {
      const transport = endlessChain();
      await expect(
        saferFetchText('https://chain.example/hop-0', options(transport, { maxRedirects: 0 }))
      ).resolves.toFailWithDetail(/exceeded the limit of 0 hops/, {
        kind: 'too-many-redirects',
        hops: 1,
        limit: 0
      });
      expect(transport.calls).toHaveLength(1);
    });

    test('catches an A→B→A→B oscillation instead of burning the whole budget', async () => {
      const a: string = 'https://a.example/x';
      const b: string = 'https://b.example/y';
      const transport = scripted([a, () => redirect(302, b)], [b, () => redirect(302, a)]);
      // `url` is the hop that issued the rejected redirect — b, not the repeated target a.
      // Naming the target here would make the field mean something different than it does on
      // the other two 'redirect-rejected' paths; the target is named in the message.
      await expect(saferFetchText(a, options(transport))).resolves.toFailWithDetail(
        /redirected with status 302 to https:\/\/a\.example\/x, which is already in the chain/,
        { kind: 'redirect-rejected', url: b, status: 302 }
      );
      // Two requests, not the six the cap alone would have allowed: the repeat is caught before
      // it is issued, so the oscillation never gets a second lap.
      expect(requestedUrls(transport)).toEqual([a, b]);
    });

    test('catches an immediate self-redirect', async () => {
      const transport = scripted([START, () => redirect(302, START)]);
      await expect(saferFetchText(START, options(transport))).resolves.toFailWith(/already in the chain/);
      expect(transport.calls).toHaveLength(1);
    });
  });

  describe('unfollowable redirects', () => {
    test('a redirect with no Location header is refused', async () => {
      const transport = scripted([START, () => new Response(null, { status: 302 })]);
      await expect(saferFetchText(START, options(transport))).resolves.toFailWithDetail(
        /no usable Location header/,
        { kind: 'redirect-rejected', url: START, status: 302 }
      );
    });

    test('a redirect with a blank Location header is refused', async () => {
      const transport = scripted([START, () => redirect(302, '   ')]);
      await expect(saferFetchText(START, options(transport))).resolves.toFailWith(
        /no usable Location header/
      );
    });

    test('a Location that cannot be parsed is an invalid-url failure', async () => {
      const transport = scripted([START, () => redirect(302, 'http://[')]);
      await expect(saferFetchText(START, options(transport))).resolves.toFailWithDetail(
        /invalid redirect target/,
        expect.objectContaining({ kind: 'invalid-url', url: 'http://[' })
      );
      expect(transport.calls).toHaveLength(1);
    });

    test('a Location naming a scheme this primitive never requests is refused', async () => {
      const transport = scripted([START, () => redirect(302, 'ftp://files.example/secret')]);
      await expect(saferFetchText(START, options(transport))).resolves.toFailWithDetail(
        /scheme "ftp:" is not supported/,
        expect.objectContaining({ kind: 'invalid-url', url: 'ftp://files.example/secret' })
      );
      expect(transport.calls).toHaveLength(1);
    });
  });

  describe('interaction with the rest of the pipeline', () => {
    test('a non-2xx on a later hop is reported as http-status, not as a redirect failure', async () => {
      const transport = scripted(
        [START, () => redirect(302, 'https://end.example/gone')],
        ['https://end.example/gone', () => new Response('nope', { status: 404, statusText: 'Not Found' })]
      );
      await expect(saferFetchText(START, options(transport))).resolves.toFailWithDetail(/404/, {
        kind: 'http-status',
        status: 404,
        statusText: 'Not Found'
      });
    });

    test('the response-headers guard sees the full chain on the final hop', async () => {
      const chains: number[] = [];
      const recording: SaferFetch.IResponseHeadersGuard = {
        name: 'recording',
        check: async (
          __head: SaferFetch.ISaferFetchResponseHead,
          chain: ReadonlyArray<SaferFetch.IRequestHop>
        ): Promise<Result<true>> => {
          chains.push(chain.length);
          return succeed(true as const);
        }
      };
      const transport = scripted(
        [START, () => redirect(302, 'https://end.example/second')],
        ['https://end.example/second', () => ok('done')]
      );
      await expect(
        saferFetchText(START, options(transport, { responseHeadersGuard: recording }))
      ).resolves.toSucceed();
      // The redirect hop never reaches the response-headers guard — its body is discarded before
      // any policy runs — so the guard is consulted exactly once, on the response that has one.
      expect(chains).toEqual([2]);
    });

    test('the headers deadline is per attempt, so a later hop that never answers still times out', async () => {
      // The first hop answers immediately, which retires its headers deadline. If that retirement
      // were for the whole call rather than for the attempt, the second host stalling would be
      // bounded only by the 30s overall deadline — a hang, not a timeout.
      const transport = mockTransport(async (call: IRecordedCall) => {
        if (call.url.toString() === START) {
          return succeed(redirect(302, 'https://silent.example/second'));
        }
        return new Promise<Result<Response>>((resolve) => {
          call.init.signal?.addEventListener('abort', () => resolve(fail('aborted')));
        });
      });
      await expect(
        saferFetchText(START, options(transport, { headersTimeoutMs: 20, timeoutMs: 5_000 }))
      ).resolves.toFailWithDetail(
        /timed out/,
        expect.objectContaining({ kind: 'timeout', phase: 'headers', limitMs: 20 })
      );
      expect(requestedUrls(transport)).toEqual([START, 'https://silent.example/second']);
    });

    test('a request guard rejecting a later hop reports that hop index', async () => {
      const blocking: SaferFetch.IRequestGuard = {
        name: 'blocking',
        check: async (
          request: SaferFetch.ISaferFetchRequest
        ): Promise<Result<SaferFetch.ISaferFetchRequest>> =>
          request.url.hostname === 'end.example' ? fail('not that host') : succeed(request)
      };
      const transport = scripted(
        [START, () => redirect(302, 'https://end.example/second')],
        ['https://end.example/second', () => ok('never')]
      );
      await expect(
        saferFetchText(START, options(transport, { requestGuard: blocking }))
      ).resolves.toFailWithDetail(/not that host/, {
        kind: 'blocked-by-guard',
        url: 'https://end.example/second',
        hop: 1,
        guard: 'blocking',
        detail: 'not that host'
      });
      expect(requestedUrls(transport)).toEqual([START]);
    });

    test('a request guard replacing a later hop with a bad scheme is refused', async () => {
      const retargeting: SaferFetch.IRequestGuard = {
        name: 'retargeting',
        check: async (
          request: SaferFetch.ISaferFetchRequest
        ): Promise<Result<SaferFetch.ISaferFetchRequest>> =>
          request.url.hostname === 'end.example'
            ? succeed({ ...request, url: new URL('ftp://files.example/secret') })
            : succeed(request)
      };
      const transport = scripted(
        [START, () => redirect(302, 'https://end.example/second')],
        ['https://end.example/second', () => ok('never')]
      );
      await expect(
        saferFetchText(START, options(transport, { requestGuard: retargeting }))
      ).resolves.toFailWith(/scheme "ftp:" is not supported/);
      expect(requestedUrls(transport)).toEqual([START]);
    });
  });
});
