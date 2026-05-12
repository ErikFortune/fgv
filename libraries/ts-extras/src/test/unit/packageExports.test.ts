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

function getPackageJson(): IExportsMap {
  const packagePath = path.resolve(__dirname, '../../../package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as IExportsMap;
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
    expect(keystoreExport).toMatchObject({
      import: './lib/packlets/crypto-utils/keystore/index.js',
      require: './lib/packlets/crypto-utils/keystore/index.js'
    });
  });
});
