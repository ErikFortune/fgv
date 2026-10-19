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

  describe('namespace member parity', () => {
    // Members the Node entry exports that the browser entry omits ON PURPOSE, because the
    // module behind each one imports a Node builtin (`node:crypto`, `fs`, `node:dns`).
    // Anything else the Node entry exports from a namespace MUST exist on the browser
    // entry: `@fgv/ts-web-extras` type-checks against the Node declarations, so a member
    // missing here compiles cleanly and fails only at runtime in a browser.
    const nodeOnlyMembers: ReadonlySet<string> = new Set([
      'CryptoUtils.NodeCryptoProvider',
      'CryptoUtils.nodeCryptoProvider',
      'CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage',
      'Csv.readCsvFileSync',
      'RecordJar.readRecordJarFileSync',
      'SaferFetch.blockPrivateNetworks',
      'SaferFetch.nodeHostResolver'
    ]);

    function isNamespace(value: unknown): value is Record<string, unknown> {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    function resolvePath(root: unknown, path: string): unknown {
      return path.split('.').reduce<unknown>((cur, key) => (isNamespace(cur) ? cur[key] : undefined), root);
    }

    function findMissingMembers(node: unknown, browser: unknown, path: string): string[] {
      if (!isNamespace(node)) {
        return [];
      }
      return Object.keys(node).flatMap((key) => {
        const memberPath = path === '' ? key : `${path}.${key}`;
        if (!isNamespace(browser) || !Object.prototype.hasOwnProperty.call(browser, key)) {
          return nodeOnlyMembers.has(memberPath) ? [] : [memberPath];
        }
        return findMissingMembers(node[key], browser[key], memberPath);
      });
    }

    test('browser entry exports every namespace member the Node entry exports, bar the allowlist', () => {
      expect(findMissingMembers(TsExtrasNode, TsExtrasBrowser, '')).toEqual([]);
    });

    test('every allowlisted Node-only member exists on the Node entry and is absent from the browser entry', () => {
      const stale = Array.from(nodeOnlyMembers).filter(
        (path) =>
          resolvePath(TsExtrasNode, path) === undefined || resolvePath(TsExtrasBrowser, path) !== undefined
      );
      expect(stale).toEqual([]);
    });

    test('reports a member the browser entry lacks', () => {
      const node = { Ns: { present: 1, absent: 2, Deeper: { gone: 3 } } };
      const browser = { Ns: { present: 1, Deeper: {} } };
      expect(findMissingMembers(node, browser, '')).toEqual(['Ns.absent', 'Ns.Deeper.gone']);
    });
  });
});
