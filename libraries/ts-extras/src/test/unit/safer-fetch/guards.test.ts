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

import { SaferFetch } from '../../..';

const { allowAnyAddress, allowContentTypes } = SaferFetch;

function head(contentType?: string): SaferFetch.ISaferFetchResponseHead {
  return {
    status: 200,
    statusText: 'OK',
    headers: contentType !== undefined ? { 'content-type': contentType } : {},
    contentType
  };
}

describe('allowAnyAddress', () => {
  test('is named so the absence of the guarantee is greppable at the call site', () => {
    expect(allowAnyAddress().name).toBe('allowAnyAddress');
  });

  test('clears the last hop in the chain', async () => {
    const chain: SaferFetch.IRequestHop[] = [
      { url: new URL('https://first.example/') },
      { url: new URL('https://second.example/') }
    ];
    await expect(allowAnyAddress().check(chain)).resolves.toSucceedAndSatisfy(
      (verdict: SaferFetch.IGuardVerdict) => {
        expect(verdict.url.toString()).toBe('https://second.example/');
      }
    );
  });

  test('never pins an address, because it validated none', async () => {
    const chain: SaferFetch.IRequestHop[] = [{ url: new URL('https://example.com/') }];
    await expect(allowAnyAddress().check(chain)).resolves.toSucceedAndSatisfy(
      (verdict: SaferFetch.IGuardVerdict) => {
        expect(verdict.pinnedAddress).toBeUndefined();
      }
    );
  });

  test('fails rather than guessing when the chain is empty', async () => {
    await expect(allowAnyAddress().check([])).resolves.toFailWith(/hop chain is empty/i);
  });
});

describe('allowContentTypes', () => {
  describe('construction', () => {
    test('requires at least one media type', () => {
      expect(allowContentTypes([])).toFailWith(/at least one media type/i);
    });

    test.each([
      ['json', /not a media type/i],
      ['', /not a media type/i],
      ['text/htm l', /not a valid media subtype/i],
      ['te xt/html', /not a valid media type/i]
    ])(
      'rejects the malformed entry "%s" rather than compiling a pattern that never matches',
      (entry: string, expected: RegExp) => {
        expect(allowContentTypes([entry])).toFailWith(expected);
      }
    );

    test('rejects a wildcard type paired with a concrete subtype', () => {
      expect(allowContentTypes(['*/json'])).toFailWith(/wildcard type requires a wildcard subtype/i);
    });

    test('reports the guard name and the normalized accepted list', () => {
      expect(allowContentTypes(['Application/JSON', 'text/*'])).toSucceedAndSatisfy(
        (guard: SaferFetch.IResponseHeadersGuard) => {
          expect(guard.name).toBe('allowContentTypes');
          expect(guard.acceptedContentTypes).toEqual(['application/json', 'text/*']);
        }
      );
    });
  });

  describe('matching', () => {
    let guard: SaferFetch.IResponseHeadersGuard;

    beforeEach(() => {
      guard = allowContentTypes(['application/json', 'text/*']).orThrow();
    });

    test.each([
      'application/json',
      'application/json; charset=utf-8',
      'APPLICATION/JSON',
      '  application/json  ',
      'text/html',
      'text/plain; charset=iso-8859-1'
    ])('accepts "%s"', async (contentType: string) => {
      expect(await guard.check(head(contentType), [])).toSucceedWith(true);
    });

    test.each(['text/html', 'image/png', 'application/xml'])(
      'rejects "%s" when it is not in the list',
      async (contentType: string) => {
        const strict = allowContentTypes(['application/json']).orThrow();
        await expect(strict.check(head(contentType), [])).resolves.toFailWith(/is not accepted/i);
      }
    );

    test('rejects a response that declares no content type at all', async () => {
      await expect(guard.check(head(), [])).resolves.toFailWith(/no content-type/i);
    });

    test('rejects a malformed content-type rather than guessing at its essence', async () => {
      await expect(guard.check(head('nonsense'), [])).resolves.toFailWith(/not a media type/i);
    });

    test('a wildcard type with a wildcard subtype accepts anything typed', async () => {
      const any = allowContentTypes(['*/*']).orThrow();
      expect(await any.check(head('image/png'), [])).toSucceedWith(true);
      await expect(any.check(head(), [])).resolves.toFailWith(/no content-type/i);
    });
  });
});
