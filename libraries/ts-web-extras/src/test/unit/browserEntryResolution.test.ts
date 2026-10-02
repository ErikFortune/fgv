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

import '@fgv/ts-utils-jest';
import * as path from 'path';

// The rest of this suite resolves `@fgv/ts-extras` to its Node entry, which exports
// everything the browser entry omits, so a symbol missing from the browser entry
// cannot fail anywhere else. These tests load the code under test against the
// browser entry instead, so that what a browser bundle actually resolves is what runs.
const BROWSER_ENTRY = path.join(path.dirname(require.resolve('@fgv/ts-extras')), 'index.browser.js');

describe('ts-web-extras against the ts-extras browser entry', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('@fgv/ts-extras', () => jest.requireActual(BROWSER_ENTRY));
  });

  afterEach(() => {
    jest.dontMock('@fgv/ts-extras');
    jest.resetModules();
  });

  describe('BrowserCryptoProvider', () => {
    const key = new Uint8Array(Array.from({ length: 32 }, (__unused, i) => i));

    test('round-trips AES-GCM, which reads the Constants namespace', async () => {
      const { BrowserCryptoProvider } = await import('../../packlets/crypto-utils');
      const provider = new BrowserCryptoProvider();
      expect(
        await (
          await provider.encrypt('browser entry plaintext', key)
        ).thenOnSuccess((encrypted) =>
          provider.decrypt(encrypted.encryptedData, key, encrypted.iv, encrypted.authTag)
        )
      ).toSucceedWith('browser entry plaintext');
    });

    test('decodes base64, which needs fromBase64Strict', async () => {
      const { BrowserCryptoProvider } = await import('../../packlets/crypto-utils');
      const provider = new BrowserCryptoProvider();
      expect(provider.fromBase64('AQID')).toSucceedWith(new Uint8Array([1, 2, 3]));
      expect(provider.fromBase64('not base64!')).toFailWith(/invalid base64/i);
    });
  });

  describe('HttpTreeAccessors', () => {
    test('decodes a base64 storage response, which needs fromBase64Strict', async () => {
      const { HttpTreeAccessors } = await import('../../packlets/file-tree');
      const fetchImpl = (async (input: RequestInfo | URL) => {
        const body = String(input).includes('/tree/children')
          ? { path: '/', children: [{ path: '/blob.bin', name: 'blob.bin', type: 'file' }] }
          : { path: '/blob.bin', contents: 'AQID', encoding: 'base64' };
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => body,
          text: async () => JSON.stringify(body)
        } as unknown as Response;
      }) as unknown as typeof fetch;

      expect(
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'https://corpus.example/api',
          contentEncoding: 'base64',
          fetchImpl
        })
      ).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileBytes('/blob.bin')).toSucceedWith(new Uint8Array([1, 2, 3]));
      });
    });
  });
});
