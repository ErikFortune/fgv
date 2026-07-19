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
import { BrowserArgon2Provider } from '../../../packlets/argon2';
import { CryptoUtils } from '@fgv/ts-extras';

// RFC 9106 §B.3 parameter set (no secret/AD — our interface does not expose those fields).
// t=3, m=32, p=4, tag=32. Used for determinism and cross-runtime agreement.
const RFC_PARAMS: CryptoUtils.IArgon2idParams = {
  memoryKiB: 32,
  iterations: 3,
  parallelism: 4,
  outputBytes: 32
};
const RFC_PASSWORD = new Uint8Array(32).fill(0x01);
const RFC_SALT = new Uint8Array(16).fill(0x02);

describe('BrowserArgon2Provider', () => {
  let provider: BrowserArgon2Provider;

  beforeEach(() => {
    provider = BrowserArgon2Provider.create().orThrow();
  });

  describe('create()', () => {
    test('returns a provider instance', () => {
      expect(BrowserArgon2Provider.create()).toSucceedAndSatisfy((p) => {
        expect(p).toBeInstanceOf(BrowserArgon2Provider);
      });
    });
  });

  describe('argon2id()', () => {
    test('derives a key with Uint8Array password', async () => {
      expect(await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS)).toSucceedAndSatisfy((bytes) => {
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(RFC_PARAMS.outputBytes);
      });
    });

    test('derives a key with string password', async () => {
      expect(await provider.argon2id('password', RFC_SALT, RFC_PARAMS)).toSucceedAndSatisfy((bytes) => {
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(RFC_PARAMS.outputBytes);
      });
    });

    test('is deterministic — same inputs produce identical bytes', async () => {
      const r1 = (await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS)).orThrow();
      const r2 = (await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS)).orThrow();
      expect(r1).toEqual(r2);
    });

    test('different passwords produce different bytes', async () => {
      const a = (await provider.argon2id(new Uint8Array(32).fill(0x01), RFC_SALT, RFC_PARAMS)).orThrow();
      const b = (await provider.argon2id(new Uint8Array(32).fill(0x02), RFC_SALT, RFC_PARAMS)).orThrow();
      expect(a).not.toEqual(b);
    });

    test('different salts produce different bytes', async () => {
      const a = (await provider.argon2id(RFC_PASSWORD, new Uint8Array(16).fill(0x02), RFC_PARAMS)).orThrow();
      const b = (await provider.argon2id(RFC_PASSWORD, new Uint8Array(16).fill(0x03), RFC_PARAMS)).orThrow();
      expect(a).not.toEqual(b);
    });

    test('respects outputBytes', async () => {
      expect(
        await provider.argon2id(RFC_PASSWORD, RFC_SALT, { ...RFC_PARAMS, outputBytes: 64 })
      ).toSucceedAndSatisfy((bytes) => {
        expect(bytes.length).toBe(64);
      });
    });
  });

  describe('keyed hashing (secret / associatedData)', () => {
    const SECRET = new Uint8Array(8).fill(0x03);
    const AD = new Uint8Array(12).fill(0x04);

    test('honors a secret — output differs from the no-secret derivation', async () => {
      const withoutSecret = (await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS)).orThrow();
      expect(
        await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS, { secret: SECRET })
      ).toSucceedAndSatisfy((withSecret) => {
        expect(withSecret).not.toEqual(withoutSecret);
      });
    });

    test('empty secret is a no-op (byte-identical to omitting options)', async () => {
      const baseline = (await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS)).orThrow();
      expect(
        await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS, { secret: new Uint8Array(0) })
      ).toSucceedWith(baseline);
    });

    test('rejects non-empty associatedData as a Node-only feature', async () => {
      expect(await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS, { associatedData: AD })).toFailWith(
        /associatedData is not supported.*node-only/i
      );
    });

    test('empty associatedData is accepted (no-op, byte-identical to omitting options)', async () => {
      const baseline = (await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS)).orThrow();
      expect(
        await provider.argon2id(RFC_PASSWORD, RFC_SALT, RFC_PARAMS, {
          associatedData: new Uint8Array(0)
        })
      ).toSucceedWith(baseline);
    });
  });

  describe('parameter validation', () => {
    test('fails when memoryKiB < 8', async () => {
      expect(await provider.argon2id(RFC_PASSWORD, RFC_SALT, { ...RFC_PARAMS, memoryKiB: 7 })).toFailWith(
        /memoryKiB must be >= 8/i
      );
    });

    test('fails when iterations < 1', async () => {
      expect(await provider.argon2id(RFC_PASSWORD, RFC_SALT, { ...RFC_PARAMS, iterations: 0 })).toFailWith(
        /iterations must be >= 1/i
      );
    });

    test('fails when parallelism < 1', async () => {
      expect(await provider.argon2id(RFC_PASSWORD, RFC_SALT, { ...RFC_PARAMS, parallelism: 0 })).toFailWith(
        /parallelism must be 1\.\.255/i
      );
    });

    test('fails when parallelism > 255', async () => {
      expect(await provider.argon2id(RFC_PASSWORD, RFC_SALT, { ...RFC_PARAMS, parallelism: 256 })).toFailWith(
        /parallelism must be 1\.\.255/i
      );
    });

    test('fails when outputBytes < 4', async () => {
      expect(await provider.argon2id(RFC_PASSWORD, RFC_SALT, { ...RFC_PARAMS, outputBytes: 3 })).toFailWith(
        /outputBytes must be >= 4/i
      );
    });
  });
});
