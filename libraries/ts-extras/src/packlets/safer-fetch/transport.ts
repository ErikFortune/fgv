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

import { captureAsyncResult, fail, Result } from '@fgv/ts-utils';

import type { IFetchTransport, IFetchTransportHints } from './model';

/**
 * The {@link SaferFetch.IFetchTransport | transport} that wraps `globalThis.fetch`.
 *
 * @remarks
 * **Fails loudly when asked to honor a `pinnedAddress`.** `globalThis.fetch` connects by
 * hostname and re-resolves DNS itself, so it cannot honor a pin. Ignoring the hint instead
 * would mean that a deployment which wired an address-pinning guard but forgot the matching
 * pinning transport gets exactly the DNS-rebinding exposure it believed it had closed, and
 * gets it silently. A primitive that advertises a guarantee it does not have is worse than no
 * primitive — and that applies to future versions of itself.
 *
 * No guard in this release populates `pinnedAddress`, so the interlock is dormant. It is here
 * so that populating it later is an additive change that cannot be made unsafely.
 * @public
 */
export const platformFetchTransport: IFetchTransport = {
  name: 'platformFetchTransport',

  fetch: async (url: URL, init: RequestInit, hints: IFetchTransportHints): Promise<Result<Response>> => {
    // `?? undefined` rather than `!== undefined`: a `null` from a JavaScript caller or an
    // `unknown` escape hatch means "no pin", and must not be mistaken for one.
    const pinnedAddress = hints.pinnedAddress ?? undefined;
    if (pinnedAddress !== undefined) {
      return fail(
        `platformFetchTransport cannot honor pinnedAddress ${pinnedAddress}: it connects by ` +
          'hostname. Use a pinning transport, or a guard that does not pin.'
      );
    }
    return captureAsyncResult(async () => globalThis.fetch(url.toString(), init));
  }
};
