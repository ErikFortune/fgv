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

import * as CryptoUtils from '../../../packlets/crypto-utils';
import { KeyPairAlgorithm } from '../../../packlets/crypto-utils/model';

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
    const data = new Uint8Array(32).map((_, i) => i);
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
      // Replace the 'm' prefix with 'z'
      const badPrefixed = 'z' + encoded.slice(1);
      const result = await CryptoUtils.importPublicKeyFromMultibaseSpki(badPrefixed, 'ed25519', provider);
      expect(result).toFailWith(/invalid multibase prefix/i);
    });

    test('fails on malformed base64url body', async () => {
      const result = await CryptoUtils.importPublicKeyFromMultibaseSpki(
        'm!@#invalid!!!',
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
  });
});
