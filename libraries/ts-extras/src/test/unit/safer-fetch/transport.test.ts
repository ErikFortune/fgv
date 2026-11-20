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

const { platformFetchTransport } = SaferFetch;

describe('platformFetchTransport', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test('is named so a failure can say which transport produced it', () => {
    expect(platformFetchTransport.name).toBe('platformFetchTransport');
  });

  test('delegates to globalThis.fetch, passing the URL and init through', async () => {
    const response = new Response('ok');
    fetchSpy.mockResolvedValue(response);

    const init: RequestInit = { method: 'GET', redirect: 'manual' };
    expect(await platformFetchTransport.fetch(new URL('https://example.com/thing'), init, {})).toSucceedWith(
      response
    );
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/thing', init);
  });

  test('converts a rejected fetch into a Failure rather than letting it throw', async () => {
    fetchSpy.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

    await expect(platformFetchTransport.fetch(new URL('https://example.com/'), {}, {})).resolves.toFailWith(
      /ENOTFOUND/
    );
  });

  describe('the pin interlock', () => {
    // This is the property that keeps the deferred pinned-connect work additive rather than
    // breaking. A transport that ignored a pin it cannot honor would hand a deployment which
    // wired a pinning guard but forgot the matching transport exactly the DNS-rebinding
    // exposure it believed it had closed, and hand it over silently.
    test('fails, rather than connecting by hostname, when asked to honor a pinnedAddress', async () => {
      await expect(
        platformFetchTransport.fetch(new URL('https://example.com/'), {}, { pinnedAddress: '93.184.216.34' })
      ).resolves.toFailWith(/cannot honor pinnedAddress 93\.184\.216\.34/);
      await expect(
        platformFetchTransport.fetch(new URL('https://example.com/'), {}, { pinnedAddress: '93.184.216.34' })
      ).resolves.toFailWith(/connects by hostname/);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('treats a null pinnedAddress as absent rather than as a pin it cannot honor', async () => {
      const response = new Response('ok');
      fetchSpy.mockResolvedValue(response);

      const hints = { pinnedAddress: null } as unknown as SaferFetch.IFetchTransportHints;
      expect(await platformFetchTransport.fetch(new URL('https://example.com/'), {}, hints)).toSucceedWith(
        response
      );
      expect(fetchSpy).toHaveBeenCalled();
    });
  });
});
