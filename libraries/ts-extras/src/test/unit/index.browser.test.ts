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

import * as TsExtrasBrowser from '../../index.browser';
import * as TsExtrasNode from '../../index';

describe('ts-extras browser root exports', () => {
  test('should expose CryptoUtils and preserve the Crypto alias', () => {
    expect(TsExtrasBrowser.CryptoUtils).toBeDefined();
    expect(TsExtrasBrowser.Crypto).toBeDefined();
    expect(TsExtrasBrowser.CryptoUtils.KeyStore).toBeDefined();
    expect(TsExtrasBrowser.Crypto.KeyStore).toBeDefined();
    expect(TsExtrasBrowser.CryptoUtils.KeyStore).toBe(TsExtrasBrowser.Crypto.KeyStore);
  });

  test('browser entry exports every top-level name the Node entry exports (L13 parity)', () => {
    // Per TECH_DEBT.md L13 ("Cross-runtime entry-point export parity"):
    // every top-level name exported from `index.ts` MUST also be exported
    // from `index.browser.ts`. The browser entry MAY have additional names
    // (e.g. the `Crypto` back-compat alias), but nothing the Node entry
    // ships may go missing on browser — that has bitten the team multiple
    // times (most recently: `Yaml` was missing from the browser entry,
    // surfacing only when the sample app tried to launch).
    const nodeKeys = Object.keys(TsExtrasNode).sort();
    const browserKeys = Object.keys(TsExtrasBrowser).sort();
    const missingFromBrowser = nodeKeys.filter((k) => !browserKeys.includes(k));
    expect(missingFromBrowser).toEqual([]);
  });
});
