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
import { SeedDerivableAlgorithm } from '../../../packlets/crypto-utils';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// RFC 8032 §7.1 "-----TEST 1" Ed25519 known-answer vector.
// SECRET KEY (seed) → PUBLIC KEY, plus the deterministic signature over the empty message.
const RFC8032_TEST1_SEED_HEX: string = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const RFC8032_TEST1_PUBLIC_RAW_HEX: string =
  'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
const RFC8032_TEST1_SIGNATURE_HEX: string =
  'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b';

describe('Crypto.seedDerivedKeyPair (Ed25519 from seed)', () => {
  const provider = CryptoUtils.nodeCryptoProvider;
  const seed = hexToBytes(RFC8032_TEST1_SEED_HEX);

  async function deriveSpki(fromSeed: Uint8Array, extractable: boolean): Promise<Uint8Array> {
    const pair = (await provider.importKeyPairFromSeed('ed25519', fromSeed, extractable)).orThrow();
    return (await provider.exportPublicKeySpki(pair.publicKey)).orThrow();
  }

  describe('RFC 8032 known-answer vector', () => {
    test('derives the RFC 8032 Test 1 public key from the Test 1 seed', async () => {
      const result = await provider.importKeyPairFromSeed('ed25519', seed, true);
      expect(result).toSucceed();
      const pair = result.orThrow();
      const raw = new Uint8Array(await crypto.webcrypto.subtle.exportKey('raw', pair.publicKey));
      expect(bytesToHex(raw)).toBe(RFC8032_TEST1_PUBLIC_RAW_HEX);
    });

    test('the derived keypair produces the RFC 8032 Test 1 signature over the empty message', async () => {
      const pair = (await provider.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const signature = (await provider.sign(pair.privateKey, new Uint8Array(0))).orThrow();
      expect(bytesToHex(signature)).toBe(RFC8032_TEST1_SIGNATURE_HEX);
    });

    test('the derived public SPKI embeds the RFC 8032 Test 1 raw public key', async () => {
      const pair = (await provider.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const spki = (await provider.exportPublicKeySpki(pair.publicKey)).orThrow();
      // An Ed25519 SPKI is a fixed 12-byte prefix followed by the 32-byte raw key.
      expect(bytesToHex(spki.slice(12))).toBe(RFC8032_TEST1_PUBLIC_RAW_HEX);
    });
  });

  describe('determinism', () => {
    test('the same seed yields byte-identical public SPKI on repeated derivation', async () => {
      const spkiA = await deriveSpki(seed, true);
      const spkiB = await deriveSpki(seed, false);
      expect(spkiB).toEqual(spkiA);
    });

    test('a different seed yields a different public key', async () => {
      const otherSeed = new Uint8Array(32).fill(0x42);
      const spkiRfc = await deriveSpki(seed, true);
      const spkiOther = await deriveSpki(otherSeed, true);
      expect(spkiOther).not.toEqual(spkiRfc);
    });
  });

  describe('sign/verify round-trip', () => {
    test('a derived keypair signs data that verifies against its own public key', async () => {
      const pair = (await provider.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const message = new TextEncoder().encode('deterministic edwards');
      const signature = (await provider.sign(pair.privateKey, message)).orThrow();
      expect(await provider.verify(pair.publicKey, signature, message)).toSucceedWith(true);
    });

    test("a different seed's public key rejects the signature", async () => {
      const pair = (await provider.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const otherPair = (
        await provider.importKeyPairFromSeed('ed25519', new Uint8Array(32).fill(0x07), true)
      ).orThrow();
      const message = new TextEncoder().encode('deterministic edwards');
      const signature = (await provider.sign(pair.privateKey, message)).orThrow();
      expect(await provider.verify(otherPair.publicKey, signature, message)).toSucceedWith(false);
    });
  });

  describe('extractable matrix', () => {
    test('extractable=true returns an extractable private key that still signs', async () => {
      const pair = (await provider.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      expect(pair.privateKey.extractable).toBe(true);
      const signature = (await provider.sign(pair.privateKey, new Uint8Array(0))).orThrow();
      expect(bytesToHex(signature)).toBe(RFC8032_TEST1_SIGNATURE_HEX);
    });

    test('extractable=false returns a non-extractable private key that still signs', async () => {
      const pair = (await provider.importKeyPairFromSeed('ed25519', seed, false)).orThrow();
      expect(pair.privateKey.extractable).toBe(false);
      const signature = (await provider.sign(pair.privateKey, new Uint8Array(0))).orThrow();
      expect(bytesToHex(signature)).toBe(RFC8032_TEST1_SIGNATURE_HEX);
    });

    test('the public key is identical for the same seed regardless of the extractable flag', async () => {
      const spkiExtractable = await deriveSpki(seed, true);
      const spkiNonExtractable = await deriveSpki(seed, false);
      expect(spkiNonExtractable).toEqual(spkiExtractable);
    });
  });

  describe('escrow window (transient extractable key must not leak)', () => {
    test('when extractable=false, the returned private key cannot be exported', async () => {
      const pair = (await provider.importKeyPairFromSeed('ed25519', seed, false)).orThrow();
      expect(pair.privateKey.extractable).toBe(false);
      // The transient extractable key used to recover the public half is never
      // returned — exporting the returned private key must throw.
      await expect(crypto.webcrypto.subtle.exportKey('pkcs8', pair.privateKey)).rejects.toThrow();
    });

    test('the public key is always extractable so the deterministic public half is recoverable', async () => {
      const pair = (await provider.importKeyPairFromSeed('ed25519', seed, false)).orThrow();
      expect(pair.publicKey.extractable).toBe(true);
      expect(pair.publicKey.type).toBe('public');
    });
  });

  describe('validation', () => {
    test.each([31, 33, 0, 64])('rejects a seed of %d bytes', async (len) => {
      const badSeed = new Uint8Array(len);
      expect(await provider.importKeyPairFromSeed('ed25519', badSeed, true)).toFailWith(
        /seed must be exactly 32 bytes/i
      );
    });

    test('rejects an unsupported seed-derivable algorithm', async () => {
      const badAlgorithm = 'ed448' as unknown as SeedDerivableAlgorithm;
      expect(await provider.importKeyPairFromSeed(badAlgorithm, seed, true)).toFailWith(
        /unsupported seed-derivable algorithm 'ed448'/i
      );
    });
  });

  describe('shared helper direct surface', () => {
    test('deriveKeyPairFromSeed is the same primitive the provider delegates to', async () => {
      const helperPair = (await CryptoUtils.deriveKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const viaHelper = (await provider.exportPublicKeySpki(helperPair.publicKey)).orThrow();
      const viaProvider = await deriveSpki(seed, true);
      expect(viaHelper).toEqual(viaProvider);
    });
  });
});

// RFC 7748 §6.1 X25519 Diffie-Hellman example: Alice's private scalar and the
// public key that WebCrypto derives from it (clamping applied internally). Used
// as the deterministic known-answer vector for x25519 seed derivation.
const RFC7748_ALICE_PRIVATE_HEX: string = '77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a';
const RFC7748_ALICE_PUBLIC_HEX: string = '8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a';

describe('Crypto.seedDerivedKeyPair (X25519 from seed)', () => {
  const provider = CryptoUtils.nodeCryptoProvider;
  const seed = hexToBytes(RFC7748_ALICE_PRIVATE_HEX);

  async function derivePublicRaw(fromSeed: Uint8Array, extractable: boolean): Promise<string> {
    const pair = (await provider.importKeyPairFromSeed('x25519', fromSeed, extractable)).orThrow();
    const raw = new Uint8Array(await crypto.webcrypto.subtle.exportKey('raw', pair.publicKey));
    return bytesToHex(raw);
  }

  describe('RFC 7748 known-answer vector', () => {
    test("derives Alice's public key from her private scalar", async () => {
      expect(await derivePublicRaw(seed, true)).toBe(RFC7748_ALICE_PUBLIC_HEX);
    });

    test('the derived keypair carries X25519 deriveBits usage on the private key', async () => {
      const pair = (await provider.importKeyPairFromSeed('x25519', seed, true)).orThrow();
      expect(pair.privateKey.algorithm.name).toBe('X25519');
      expect(pair.privateKey.usages).toContain('deriveBits');
      // X25519 public keys carry no usages.
      expect(pair.publicKey.usages).toEqual([]);
    });
  });

  describe('determinism', () => {
    test('the same seed yields the byte-identical public key on repeated derivation', async () => {
      expect(await derivePublicRaw(seed, true)).toBe(await derivePublicRaw(seed, false));
    });

    test('a different seed yields a different public key', async () => {
      const other = await derivePublicRaw(new Uint8Array(32).fill(0x07), true);
      expect(other).not.toBe(RFC7748_ALICE_PUBLIC_HEX);
    });
  });

  describe('extractable matrix', () => {
    test('extractable=false returns a non-extractable private key; public stays recoverable', async () => {
      const pair = (await provider.importKeyPairFromSeed('x25519', seed, false)).orThrow();
      expect(pair.privateKey.extractable).toBe(false);
      // The transient extractable key must not leak the seed through the returned private key.
      await expect(crypto.webcrypto.subtle.exportKey('pkcs8', pair.privateKey)).rejects.toThrow();
      // The public half is always extractable and matches the vector.
      const raw = new Uint8Array(await crypto.webcrypto.subtle.exportKey('raw', pair.publicKey));
      expect(bytesToHex(raw)).toBe(RFC7748_ALICE_PUBLIC_HEX);
    });
  });

  describe('validation', () => {
    test.each([31, 33, 0, 64])('rejects a seed of %d bytes', async (len) => {
      expect(await provider.importKeyPairFromSeed('x25519', new Uint8Array(len), true)).toFailWith(
        /x25519 seed must be exactly 32 bytes/i
      );
    });
  });
});
