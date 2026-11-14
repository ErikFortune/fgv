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

import fs from 'fs';
import path from 'path';

interface IExportsMap {
  readonly [key: string]: unknown;
}

const projectRoot = path.resolve(__dirname, '../../..');

function getPackageJson(): IExportsMap {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')) as IExportsMap;
}

describe('ts-extras package exports', () => {
  test('should map the crypto subpaths to the crypto-utils build output', () => {
    const packageJson = getPackageJson();
    const exportsMap = packageJson.exports as IExportsMap;
    const cryptoExport = exportsMap['./crypto'] as IExportsMap;
    const keystoreExport = exportsMap['./crypto/keystore'] as IExportsMap;

    expect(cryptoExport.node).toMatchObject({
      import: './lib/packlets/crypto-utils/index.js',
      require: './lib/packlets/crypto-utils/index.js'
    });
    expect(cryptoExport.default).toMatchObject({
      import: './lib/packlets/crypto-utils/index.browser.js',
      require: './lib/packlets/crypto-utils/index.browser.js'
    });
    // The keystore subpath splits the same way as ./crypto: Node gets the full
    // barrel (with the node:crypto-backed EncryptedFilePrivateKeyStorage), the
    // browser/default condition gets the browser-safe barrel.
    expect(keystoreExport.node).toMatchObject({
      import: './lib/packlets/crypto-utils/keystore/index.js',
      require: './lib/packlets/crypto-utils/keystore/index.js'
    });
    expect(keystoreExport.default).toMatchObject({
      import: './lib/packlets/crypto-utils/keystore/index.browser.js',
      require: './lib/packlets/crypto-utils/keystore/index.browser.js'
    });
  });

  // Guards the recurring failure mode: a per-condition (node/browser) JS split
  // MUST NOT pin a single top-level `types` to the package-wide rollup, or
  // browser TypeScript consumers see the Node-only export that the browser JS
  // entry does not provide. Mirroring ./crypto (no `types` field) lets the
  // resolver pick the co-located .d.ts next to whichever JS condition resolved.
  test('condition-split crypto subpaths omit a top-level types rollup', () => {
    const exportsMap = getPackageJson().exports as IExportsMap;
    for (const subpath of ['./crypto', './crypto/keystore']) {
      const entry = exportsMap[subpath] as IExportsMap;
      expect(entry.node).toBeDefined();
      expect(entry.default).toBeDefined();
      // A top-level `types` here would resolve identically for node and browser,
      // re-introducing the JS/types mismatch. Per-condition co-located d.ts is
      // the contract.
      expect(entry.types).toBeUndefined();
    }
  });

  test('keystore barrel declarations match their JS condition (browser omits the Node-only export)', () => {
    const nodeDts = fs.readFileSync(
      path.join(projectRoot, 'lib/packlets/crypto-utils/keystore/index.d.ts'),
      'utf8'
    );
    const browserDts = fs.readFileSync(
      path.join(projectRoot, 'lib/packlets/crypto-utils/keystore/index.browser.d.ts'),
      'utf8'
    );
    // The Node barrel re-exports the node:crypto-backed storage; the browser
    // barrel must not, so the .d.ts the browser condition resolves matches the
    // browser .js (which also omits it).
    expect(nodeDts).toMatch(/EncryptedFilePrivateKeyStorage/);
    expect(browserDts).not.toMatch(/EncryptedFilePrivateKeyStorage/);
  });
});
