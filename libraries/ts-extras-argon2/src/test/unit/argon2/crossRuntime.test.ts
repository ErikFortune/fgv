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
import { NodeArgon2Provider } from '../../../packlets/argon2';
import { BrowserArgon2Provider } from '@fgv/ts-web-extras-argon2';
import { CryptoUtils } from '@fgv/ts-extras';

// RFC 9106 §B.3 parameter set (no secret/AD — our IArgon2idParams interface does not expose
// those optional Argon2 fields). Both implementations must agree on this exact output.
const RFC_PARAMS: CryptoUtils.IArgon2idParams = {
  memoryKiB: 32,
  iterations: 3,
  parallelism: 4,
  outputBytes: 32
};
const RFC_PASSWORD = new Uint8Array(32).fill(0x01);
const RFC_SALT = new Uint8Array(16).fill(0x02);

// Verified independently against both argon2 (kelektiv) and hash-wasm.
const RFC_EXPECTED_HEX = '03aab965c12001c9d7d0d2de33192c0494b684bb148196d73c1df1acaf6d0c2e';

// Parameter sweep — covers variation in each dimension independently.
interface ITestCase {
  label: string;
  password: Uint8Array | string;
  salt: Uint8Array;
  params: CryptoUtils.IArgon2idParams;
}

const SWEEP: ITestCase[] = [
  {
    label: 'RFC §B.3 base case',
    password: RFC_PASSWORD,
    salt: RFC_SALT,
    params: RFC_PARAMS
  },
  {
    label: 'string password',
    password: 'correct horse battery staple',
    salt: RFC_SALT,
    params: RFC_PARAMS
  },
  {
    label: 'higher memoryKiB',
    password: RFC_PASSWORD,
    salt: RFC_SALT,
    params: { ...RFC_PARAMS, memoryKiB: 64 }
  },
  {
    label: 'more iterations',
    password: RFC_PASSWORD,
    salt: RFC_SALT,
    params: { ...RFC_PARAMS, iterations: 5 }
  },
  {
    label: 'parallelism=1',
    password: RFC_PASSWORD,
    salt: RFC_SALT,
    params: { ...RFC_PARAMS, parallelism: 1 }
  },
  {
    label: 'longer output (64 bytes)',
    password: RFC_PASSWORD,
    salt: RFC_SALT,
    params: { ...RFC_PARAMS, outputBytes: 64 }
  },
  {
    label: 'different salt',
    password: RFC_PASSWORD,
    salt: new Uint8Array(16).fill(0x07),
    params: RFC_PARAMS
  }
];

describe('cross-runtime equivalence: NodeArgon2Provider vs BrowserArgon2Provider', () => {
  let node: NodeArgon2Provider;
  let browser: BrowserArgon2Provider;

  beforeEach(() => {
    node = NodeArgon2Provider.create().orThrow();
    browser = BrowserArgon2Provider.create().orThrow();
  });

  test('RFC §B.3 parameter set matches known-good hex output', async () => {
    const nodeBytes = (await node.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS)).orThrow();
    expect(Buffer.from(nodeBytes).toString('hex')).toBe(RFC_EXPECTED_HEX);
  });

  test.each(SWEEP)('$label: outputs are byte-identical', async ({ password, salt, params }) => {
    const nodeBytes = (await node.argon2id(password, salt, params)).orThrow();
    const browserBytes = (await browser.argon2id(password, salt, params)).orThrow();
    expect(nodeBytes).toEqual(browserBytes);
  });

  // A secret (RFC 9106 keyed hashing) is supported by both backends and must
  // stay byte-identical across them. Small params keep this fast.
  test('secret-only keyed hashing is byte-identical across runtimes', async () => {
    const params: CryptoUtils.IArgon2idParams = {
      memoryKiB: 8,
      iterations: 1,
      parallelism: 1,
      outputBytes: 32
    };
    const secret = new Uint8Array(8).fill(0x03);
    const nodeBytes = (await node.argon2id(RFC_PASSWORD, RFC_SALT, params, { secret })).orThrow();
    const browserBytes = (await browser.argon2id(RFC_PASSWORD, RFC_SALT, params, { secret })).orThrow();
    expect(nodeBytes).toEqual(browserBytes);
  });

  // Associated data is Node-only: Node honors it, the WASM browser backend
  // rejects it loudly rather than silently dropping it (which would diverge).
  test('associatedData is Node-only: Node succeeds, browser rejects', async () => {
    const associatedData = new Uint8Array(12).fill(0x04);
    expect(await node.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS, { associatedData })).toSucceed();
    expect(await browser.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS, { associatedData })).toFailWith(
      /associatedData is not supported.*node-only/i
    );
  });
});
