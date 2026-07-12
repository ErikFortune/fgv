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

import * as crypto from 'crypto';
import * as CryptoUtils from '../../../packlets/crypto-utils';
import type { KeyPairAlgorithm, MultibaseSpkiPublicKey } from '../../../packlets/crypto-utils';

const provider = CryptoUtils.nodeCryptoProvider;

describe('multibaseBase64UrlEncode / multibaseBase64UrlDecode', () => {
  test('encode returns a string starting with m', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = CryptoUtils.multibaseBase64UrlEncode(data);
    expect(encoded.startsWith('m')).toBe(true);
  });

  test('encode uses base64url alphabet (no +, /, or = chars after prefix)', () => {
    // Test with data that produces + and / in standard base64
    const data = new Uint8Array([0xfb, 0xff, 0xfe]); // produces '+//+' in base64
    const encoded = CryptoUtils.multibaseBase64UrlEncode(data);
    const body = encoded.slice(1);
    expect(body).not.toMatch(/[+/=]/);
  });

  test('encode/decode round-trip for empty array', () => {
    const data = new Uint8Array(0);
    const encoded = CryptoUtils.multibaseBase64UrlEncode(data);
    expect(CryptoUtils.multibaseBase64UrlDecode(encoded)).toSucceedWith(data);
  });

  test('encode/decode round-trip for arbitrary bytes', () => {
    const data = new Uint8Array([0, 1, 2, 3, 253, 254, 255]);
    const encoded = CryptoUtils.multibaseBase64UrlEncode(data);
    expect(CryptoUtils.multibaseBase64UrlDecode(encoded)).toSucceedWith(data);
  });

  test('encode/decode round-trip for 32-byte data (typical key size)', () => {
    const data = new Uint8Array([...Array(32).keys()]);
    const encoded = CryptoUtils.multibaseBase64UrlEncode(data);
    expect(CryptoUtils.multibaseBase64UrlDecode(encoded)).toSucceedWith(data);
  });

  test('decode fails when multibase prefix is not m', () => {
    expect(CryptoUtils.multibaseBase64UrlDecode('uSGVsbG8')).toFailWith(/invalid multibase prefix/i);
    expect(CryptoUtils.multibaseBase64UrlDecode('zSGVsbG8')).toFailWith(/invalid multibase prefix/i);
  });

  test('decode fails when string is empty', () => {
    expect(CryptoUtils.multibaseBase64UrlDecode('')).toFailWith(/invalid multibase prefix/i);
  });

  test('decode fails on malformed base64url body', () => {
    // 'm' prefix followed by invalid base64 characters (spaces, special chars)
    expect(CryptoUtils.multibaseBase64UrlDecode('m!@#$%')).toFailWith(/malformed base64url/i);
  });
});

describe('exportPublicKeyAsMultibaseSpki / importPublicKeyFromMultibaseSpki', () => {
  const algorithms: KeyPairAlgorithm[] = ['ed25519', 'x25519', 'ecdh-p256', 'ecdsa-p256', 'rsa-oaep-2048'];

  describe('round-trip for each algorithm', () => {
    test.each(algorithms)('%s: export then import produces a usable public key', async (algorithm) => {
      const pair = (await provider.generateKeyPair(algorithm, true)).orThrow();

      const exported = await CryptoUtils.exportPublicKeyAsMultibaseSpki(pair.publicKey, provider);
      expect(exported).toSucceed();
      const encoded = exported.orThrow();
      expect(typeof encoded).toBe('string');
      expect(encoded.startsWith('m')).toBe(true);

      const imported = await CryptoUtils.importPublicKeyFromMultibaseSpki(encoded, algorithm, provider);
      expect(imported).toSucceedAndSatisfy((key) => {
        expect(key.type).toBe('public');
        expect(key.extractable).toBe(true);
      });
    });
  });

  describe('exportPublicKeyAsMultibaseSpki', () => {
    test('fails when key is not a public key', async () => {
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const result = await CryptoUtils.exportPublicKeyAsMultibaseSpki(pair.privateKey, provider);
      expect(result).toFailWith(/requires a public CryptoKey, got 'private'/i);
    });

    test('exports produce consistent multibase prefix m', async () => {
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const result = await CryptoUtils.exportPublicKeyAsMultibaseSpki(pair.publicKey, provider);
      expect(result).toSucceedAndSatisfy((encoded) => {
        expect(encoded[0]).toBe('m');
      });
    });
  });

  describe('importPublicKeyFromMultibaseSpki', () => {
    test('fails on bad multibase prefix', async () => {
      // Use a valid base64url body but wrong prefix
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const encoded = (await CryptoUtils.exportPublicKeyAsMultibaseSpki(pair.publicKey, provider)).orThrow();
      // Replace the 'm' prefix with 'z' (intentionally invalid — cast the test brand)
      const badPrefixed = ('z' + encoded.slice(1)) as MultibaseSpkiPublicKey;
      const result = await CryptoUtils.importPublicKeyFromMultibaseSpki(badPrefixed, 'ed25519', provider);
      expect(result).toFailWith(/invalid multibase prefix/i);
    });

    test('fails on malformed base64url body', async () => {
      const result = await CryptoUtils.importPublicKeyFromMultibaseSpki(
        'm!@#invalid!!!' as MultibaseSpkiPublicKey,
        'ed25519',
        provider
      );
      expect(result).toFailWith(/malformed base64url/i);
    });

    test('fails when SPKI bytes of wrong algorithm are passed', async () => {
      // Export ed25519 key, try to import as ecdsa-p256
      const edPair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const encoded = (
        await CryptoUtils.exportPublicKeyAsMultibaseSpki(edPair.publicKey, provider)
      ).orThrow();
      const result = await CryptoUtils.importPublicKeyFromMultibaseSpki(encoded, 'ecdsa-p256', provider);
      expect(result).toFail();
    });

    test('accepts a value produced by exportPublicKeyAsMultibaseSpki via the guard and converter', async () => {
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const encoded = (await CryptoUtils.exportPublicKeyAsMultibaseSpki(pair.publicKey, provider)).orThrow();
      expect(CryptoUtils.isValidMultibaseSpkiPublicKey(encoded)).toBe(true);
      expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert(encoded)).toSucceedWith(encoded);
    });

    test('accepts a plain (unbranded) string, not only the branded type', async () => {
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const branded = (await CryptoUtils.exportPublicKeyAsMultibaseSpki(pair.publicKey, provider)).orThrow();
      // A plain string variable — e.g. a value read from storage or the wire —
      // imports directly, without first branding it through the guard/converter.
      const raw: string = branded;
      const result = await CryptoUtils.importPublicKeyFromMultibaseSpki(raw, 'ed25519', provider);
      expect(result).toSucceedAndSatisfy((key) => {
        expect(key.type).toBe('public');
      });
    });
  });
});

describe('base64UrlNoPadEncode / base64UrlNoPadDecode', () => {
  test('round-trips the empty array', () => {
    const data = new Uint8Array(0);
    const encoded = CryptoUtils.base64UrlNoPadEncode(data);
    expect(encoded).toBe('');
    expect(CryptoUtils.base64UrlNoPadDecode(encoded)).toSucceedWith(data);
  });

  // 1 byte -> 2 pad chars pre-strip; 2 bytes -> 1 pad char; 3 bytes -> 0 pads.
  test.each([1, 2, 3, 4, 5, 15, 16, 31, 32, 64])(
    'round-trips %d bytes across all pad-count boundaries',
    (length) => {
      const data = new Uint8Array(Array.from({ length }, (__unused, i) => (i * 37 + 11) % 256));
      const encoded = CryptoUtils.base64UrlNoPadEncode(data);
      // no padding, no standard-base64-only characters
      expect(encoded).not.toMatch(/[+/=]/);
      expect(CryptoUtils.base64UrlNoPadDecode(encoded)).toSucceedWith(data);
    }
  );

  test('uses the base64url alphabet for bytes that produce + and / in standard base64', () => {
    const data = new Uint8Array([0xfb, 0xff, 0xfe]); // '+//+' territory in base64
    const encoded = CryptoUtils.base64UrlNoPadEncode(data);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(encoded).toMatch(/[-_]/);
    expect(CryptoUtils.base64UrlNoPadDecode(encoded)).toSucceedWith(data);
  });

  test('decode rejects bodies with non-base64url characters', () => {
    expect(CryptoUtils.base64UrlNoPadDecode('!@#$')).toFailWith(/malformed base64url/i);
    expect(CryptoUtils.base64UrlNoPadDecode('ab cd')).toFailWith(/malformed base64url/i);
    expect(CryptoUtils.base64UrlNoPadDecode('has=pad')).toFailWith(/malformed base64url/i);
  });

  test('decode rejects a body whose length is % 4 === 1 (impossible base64 remainder)', () => {
    expect(CryptoUtils.base64UrlNoPadDecode('A')).toFailWith(/malformed base64url/i);
    expect(CryptoUtils.base64UrlNoPadDecode('AAAAA')).toFailWith(/malformed base64url/i);
  });
});

describe('multibase delegation equivalence (behavior-preserving refactor)', () => {
  const samples: Uint8Array[] = [
    new Uint8Array(0),
    new Uint8Array([0]),
    new Uint8Array([0xfb, 0xff, 0xfe]),
    new Uint8Array([...Array(32).keys()]),
    new Uint8Array(Array.from({ length: 65 }, (__unused, i) => (i * 53 + 7) % 256))
  ];

  test.each(samples.map((s, i) => [i, s] as const))(
    'sample %d: multibaseBase64UrlEncode(x) === "m" + base64UrlNoPadEncode(x)',
    (__i, data) => {
      expect(CryptoUtils.multibaseBase64UrlEncode(data)).toBe('m' + CryptoUtils.base64UrlNoPadEncode(data));
    }
  );

  test.each(samples.map((s, i) => [i, s] as const))(
    'sample %d: multibase decode delegates to base64UrlNoPadDecode of the body',
    (__i, data) => {
      const multibase = CryptoUtils.multibaseBase64UrlEncode(data);
      const bare = CryptoUtils.base64UrlNoPadEncode(data);
      expect(CryptoUtils.multibaseBase64UrlDecode(multibase)).toSucceedWith(data);
      expect(CryptoUtils.base64UrlNoPadDecode(bare)).toSucceedWith(data);
      // The multibase body is exactly the bare encoding.
      expect(multibase.slice(1)).toBe(bare);
    }
  );

  test('multibase decode preserves its own malformed-body error message after delegation', () => {
    expect(CryptoUtils.multibaseBase64UrlDecode('m!@#$%')).toFailWith(
      /multibaseBase64UrlDecode: malformed base64url body/
    );
  });
});

describe('isValidMultibaseSpkiPublicKey', () => {
  test('accepts well-formed multibase base64url-no-pad values', () => {
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('mSGVsbG8')).toBe(true);
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('mAAAA')).toBe(true);
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('mabc-_ABC')).toBe(true);
  });

  test('rejects non-string values', () => {
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey(undefined)).toBe(false);
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey(null)).toBe(false);
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey(42)).toBe(false);
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey(new Uint8Array([1, 2, 3]))).toBe(false);
  });

  test('rejects missing or wrong multibase prefix', () => {
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('')).toBe(false);
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('zSGVsbG8')).toBe(false);
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('SGVsbG8')).toBe(false);
  });

  test('rejects malformed base64url body', () => {
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('m!@#$%')).toBe(false);
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('mA')).toBe(false); // body length % 4 === 1
  });

  test('rejects the degenerate empty body ("m" alone)', () => {
    // A real key never encodes to an empty body; the shape guard requires a
    // non-empty base64url body, matching MultibaseSpkiPublicKeyRegExp.
    expect(CryptoUtils.isValidMultibaseSpkiPublicKey('m')).toBe(false);
  });
});

describe('MultibaseSpkiPublicKeyRegExp', () => {
  test('is the shape underlying the guard (matches iff the guard accepts, minus the base64 length rule)', () => {
    // The exported pattern is the multibase-m + non-empty base64url-no-pad shape.
    expect(CryptoUtils.MultibaseSpkiPublicKeyRegExp.test('mSGVsbG8')).toBe(true);
    expect(CryptoUtils.MultibaseSpkiPublicKeyRegExp.test('mabc-_ABC')).toBe(true);
    // Rejects: empty body, wrong/missing prefix, and non-base64url characters.
    expect(CryptoUtils.MultibaseSpkiPublicKeyRegExp.test('m')).toBe(false);
    expect(CryptoUtils.MultibaseSpkiPublicKeyRegExp.test('zSGVsbG8')).toBe(false);
    expect(CryptoUtils.MultibaseSpkiPublicKeyRegExp.test('SGVsbG8')).toBe(false);
    expect(CryptoUtils.MultibaseSpkiPublicKeyRegExp.test('m!@#$%')).toBe(false);
  });
});

describe('Converters.multibaseSpkiPublicKey', () => {
  test('succeeds with the branded value for valid input', () => {
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert('mSGVsbG8')).toSucceedWith(
      'mSGVsbG8' as MultibaseSpkiPublicKey
    );
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert('mabc-_ABC')).toSucceedWith(
      'mabc-_ABC' as MultibaseSpkiPublicKey
    );
  });

  test('fails on the degenerate empty body ("m" alone)', () => {
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert('m')).toFail();
  });

  test('fails on a non-string input', () => {
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert(42)).toFail();
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert(undefined)).toFail();
  });

  test('fails with prefix context on a bad multibase prefix', () => {
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert('zSGVsbG8')).toFailWith(
      /invalid multibase prefix 'z'/i
    );
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert('')).toFailWith(
      /invalid multibase prefix '\(empty\)'/i
    );
  });

  test('fails with malformed-body context on a bad base64url body', () => {
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert('m!@#$%')).toFailWith(
      /malformed base64url body/i
    );
    expect(CryptoUtils.Converters.multibaseSpkiPublicKey.convert('mA')).toFailWith(
      /malformed base64url body/i
    );
  });
});

describe('spkiToRawX25519', () => {
  test('strips the DER prefix, matching the raw-exported public key', async () => {
    const pair = (await provider.generateKeyPair('x25519', true)).orThrow();
    const spki = (await provider.exportPublicKeySpki(pair.publicKey)).orThrow();
    const raw = CryptoUtils.spkiToRawX25519(spki);
    expect(raw).toSucceed();

    const subtle = (crypto as { webcrypto: { subtle: SubtleCrypto } }).webcrypto.subtle;
    const expectedRaw = new Uint8Array(await subtle.exportKey('raw', pair.publicKey));
    expect(raw.orThrow()).toEqual(expectedRaw);
  });

  test('fails on a wrong-length blob', () => {
    expect(CryptoUtils.spkiToRawX25519(new Uint8Array(43))).toFailWith(/expected 44 bytes, got 43/i);
    expect(CryptoUtils.spkiToRawX25519(new Uint8Array(45))).toFailWith(/expected 44 bytes, got 45/i);
  });

  test('fails on a valid-length blob with the wrong prefix', () => {
    const wrongPrefix = new Uint8Array(44);
    wrongPrefix.fill(0xff);
    expect(CryptoUtils.spkiToRawX25519(wrongPrefix)).toFailWith(
      /does not match the expected X25519 SPKI prefix/i
    );
  });

  test('integrates with HpkeProvider.openBase: SPKI-exported key feeds openBase directly', async () => {
    const subtle = (crypto as { webcrypto: { subtle: SubtleCrypto } }).webcrypto.subtle;
    const pair = (await subtle.generateKey({ name: 'X25519' }, false, ['deriveBits'])) as CryptoKeyPair;
    const spkiPublicKey = new Uint8Array(await subtle.exportKey('spki', pair.publicKey));
    const rawPublicKey = CryptoUtils.spkiToRawX25519(spkiPublicKey).orThrow();

    const hpke = CryptoUtils.HpkeProvider.create(subtle).orThrow();
    const info = new TextEncoder().encode('ctx');
    const aad = new Uint8Array(0);
    const plaintext = new TextEncoder().encode('spki round-trip');

    const sealed = (await hpke.sealBase(pair.publicKey, info, aad, plaintext)).orThrow();
    expect(
      await hpke.openBase(pair.privateKey, info, aad, sealed.enc, sealed.ciphertext, rawPublicKey)
    ).toSucceedAndSatisfy((pt) => {
      expect(pt).toEqual(plaintext);
    });
  });
});
