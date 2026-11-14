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
 * What this package adds over `@fgv/ts-extras`'s core: the up-front refusal of options this
 * runtime cannot honor, and faithful delegation of everything else.
 *
 * **No test here constructs a `Response`.** This package's suite runs under jsdom, which ships
 * no Fetch API globals, and a hand-rolled stand-in for `Response` would be a partial mock of a
 * canonical type dressed up as one — the shape this repo has been bitten by before. The
 * response-handling semantics are the core's and are tested in `@fgv/ts-extras`, where those
 * globals exist. What belongs here is the wrapper's own two jobs, and a scripted transport that
 * *fails* exercises delegation end to end without needing a `Response` at all.
 */

import '@fgv/ts-utils-jest';

import { Converters, fail, type Result } from '@fgv/ts-utils';
import { SaferFetch as CoreSaferFetch } from '@fgv/ts-extras';

import { SaferFetch } from '../..';

const { browserSaferFetchBytes, browserSaferFetchJson, browserSaferFetchText } = SaferFetch;

const URL_UNDER_TEST: string = 'https://example.com/thing';

/** Records what it was asked to fetch, and refuses — so no `Response` is ever needed. */
interface IRecordingTransport extends CoreSaferFetch.IFetchTransport {
  readonly urls: ReadonlyArray<string>;
}

function refusingTransport(message: string = 'scripted transport failure'): IRecordingTransport {
  const urls: string[] = [];
  return {
    name: 'refusingTransport',
    urls,
    fetch: async (url: URL): Promise<Result<Response>> => {
      urls.push(url.toString());
      return fail(message);
    }
  };
}

function options(
  transport: CoreSaferFetch.IFetchTransport,
  overrides?: Partial<SaferFetch.IBrowserSaferFetchOptions>
): SaferFetch.IBrowserSaferFetchOptions {
  // `allowAnyAddress()` is the only honest posture in a browser, and it is spelled at the call
  // site rather than supplied by the wrapper — the whole point of keeping `addressGuard`
  // required here.
  return { addressGuard: CoreSaferFetch.allowAnyAddress(), transport, ...overrides };
}

type Entry = (url: string, o: SaferFetch.IBrowserSaferFetchOptions) => Promise<unknown>;

const ENTRY_POINTS: ReadonlyArray<readonly [string, Entry]> = [
  ['Bytes', browserSaferFetchBytes],
  ['Text', browserSaferFetchText],
  ['Json', browserSaferFetchJson]
];

describe('browser safer-fetch entry points', () => {
  describe('delegation to the shared core', () => {
    test.each(ENTRY_POINTS)(
      'browserSaferFetch%s runs the core against the requested URL',
      async (__name: string, entry: Entry) => {
        const transport = refusingTransport();
        await expect(entry(URL_UNDER_TEST, options(transport))).resolves.toFailWithDetail(
          /scripted transport failure/i,
          { kind: 'network', detail: 'scripted transport failure' }
        );
        // The URL reached the transport unchanged, so options flowed through rather than being
        // reinterpreted on the way.
        expect(transport.urls).toEqual([URL_UNDER_TEST]);
      }
    );

    test('a browser address guard can still refuse on the URL it is handed', async () => {
      // A browser guard cannot resolve a hostname, but it can decide on scheme, host and port.
      // That is why the seam is worth keeping required here rather than wired to a passthrough.
      const transport = refusingTransport();
      const hostAllowlist: CoreSaferFetch.IAddressGuard = {
        name: 'onlyExampleCom',
        check: async (
          chain: ReadonlyArray<CoreSaferFetch.IRequestHop>
        ): Promise<Result<CoreSaferFetch.IGuardVerdict>> => {
          const url = chain[chain.length - 1].url;
          return url.hostname === 'example.com'
            ? CoreSaferFetch.allowAnyAddress().check(chain)
            : fail(`${url.hostname} is not allowed`);
        }
      };
      await expect(
        browserSaferFetchText(
          'https://elsewhere.example/x',
          options(transport, { addressGuard: hostAllowlist })
        )
      ).resolves.toFailWithDetail(/is not allowed/i, {
        kind: 'blocked-by-guard',
        url: 'https://elsewhere.example/x',
        hop: 0,
        guard: 'onlyExampleCom',
        detail: 'elsewhere.example is not allowed'
      });
      expect(transport.urls).toEqual([]);
      // And the same guard clears the host it does allow.
      await expect(
        browserSaferFetchText(URL_UNDER_TEST, options(transport, { addressGuard: hostAllowlist }))
      ).resolves.toFailWith(/scripted transport failure/i);
      expect(transport.urls).toEqual([URL_UNDER_TEST]);
    });

    test('the core’s scheme refusal applies here too', async () => {
      const transport = refusingTransport();
      await expect(
        browserSaferFetchText('ftp://example.com/x', options(transport))
      ).resolves.toFailWithDetail(/scheme "ftp:" is not supported/i, {
        kind: 'invalid-url',
        url: 'ftp://example.com/x',
        detail: expect.stringMatching(/not supported/i) as unknown as string
      });
      expect(transport.urls).toEqual([]);
    });

    test('retry is wired through, and re-walks from hop 0 as it does on Node', async () => {
      const transport = refusingTransport();
      await expect(
        browserSaferFetchText(
          URL_UNDER_TEST,
          options(transport, { retry: { attempts: 2, baseDelayMs: 1, maxDelayMs: 2 } })
        )
      ).resolves.toFail();
      expect(transport.urls).toEqual([URL_UNDER_TEST, URL_UNDER_TEST, URL_UNDER_TEST]);
    });

    test('browserSaferFetchJson dispatches both of its forms', async () => {
      // The converter-present and converter-absent overloads take different paths into the core;
      // whether the converter then validates correctly is the core's test, not this one's.
      const transport = refusingTransport();
      const converter = Converters.object<{ name: string }>({ name: Converters.string });
      await expect(browserSaferFetchJson(URL_UNDER_TEST, options(transport))).resolves.toFail();
      await expect(
        browserSaferFetchJson(URL_UNDER_TEST, { ...options(transport), converter })
      ).resolves.toFail();
      expect(transport.urls).toEqual([URL_UNDER_TEST, URL_UNDER_TEST]);
    });
  });

  describe("'validate-each-hop' is refused up front", () => {
    test.each(ENTRY_POINTS)(
      'browserSaferFetch%s names the runtime rather than the symptom',
      async (__name: string, entry: Entry) => {
        // Accepted by the shared type because one core serves both runtimes; refused here
        // because the runtime is not shared. A browser's manual redirect is opaque, so the mode
        // cannot do the one thing it names.
        const transport = refusingTransport();
        await expect(
          entry(URL_UNDER_TEST, options(transport, { redirectPolicy: 'validate-each-hop' }))
        ).resolves.toFailWithDetail(/cannot be honored in a browser/i, {
          kind: 'unknown',
          detail: expect.stringMatching(/opaque response with no readable Location/i) as unknown as string
        });
        // Refused before anything reached the wire: the failure is about the call, not about a
        // hop that happened to occur.
        expect(transport.urls).toEqual([]);
      }
    );

    test('fires whether or not the URL would have redirected', async () => {
      // The point of refusing up front: failing at the first redirect would let a caller whose
      // URLs happen not to redirect ship believing per-hop revalidation was in force.
      const transport = refusingTransport();
      await expect(
        browserSaferFetchText(URL_UNDER_TEST, options(transport, { redirectPolicy: 'validate-each-hop' }))
      ).resolves.toFailWith(/cannot be honored in a browser/i);
      expect(transport.urls).toEqual([]);
    });

    test("'reject' — the default — is accepted and left to the core", async () => {
      const transport = refusingTransport();
      await expect(
        browserSaferFetchText(URL_UNDER_TEST, options(transport, { redirectPolicy: 'reject' }))
      ).resolves.toFailWith(/scripted transport failure/i);
      expect(transport.urls).toEqual([URL_UNDER_TEST]);
    });
  });
});
