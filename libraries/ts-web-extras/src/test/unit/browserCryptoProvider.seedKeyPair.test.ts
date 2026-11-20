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

import { CryptoUtils } from '@fgv/ts-extras';
import { BrowserCryptoProvider } from '../../packlets/crypto-utils';

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
const RFC8032_TEST1_SEED_HEX: string = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const RFC8032_TEST1_PUBLIC_RAW_HEX: string =
  'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';

describe('BrowserCryptoProvider — importKeyPairFromSeed (Ed25519)', () => {
  const browser = new BrowserCryptoProvider();
  const node = CryptoUtils.nodeCryptoProvider;
  const seed = hexToBytes(RFC8032_TEST1_SEED_HEX);

  describe('RFC 8032 known-answer vector', () => {
    test('the browser provider derives the RFC 8032 Test 1 public key from the Test 1 seed', async () => {
      const pair = (await browser.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const spki = (await browser.exportPublicKeySpki(pair.publicKey)).orThrow();
      // Ed25519 SPKI: fixed 12-byte prefix + 32-byte raw key.
      expect(bytesToHex(spki.slice(12))).toBe(RFC8032_TEST1_PUBLIC_RAW_HEX);
    });
  });

  describe('cross-provider parity (Node vs browser, same seed)', () => {
    test('produces byte-identical public SPKI', async () => {
      const browserPair = (await browser.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const nodePair = (await node.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const browserSpki = (await browser.exportPublicKeySpki(browserPair.publicKey)).orThrow();
      const nodeSpki = (await node.exportPublicKeySpki(nodePair.publicKey)).orThrow();
      expect(bytesToHex(browserSpki)).toBe(bytesToHex(nodeSpki));
    });

    test('produces byte-identical multibase SPKI', async () => {
      const browserPair = (await browser.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const nodePair = (await node.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      const browserMb = (
        await CryptoUtils.exportPublicKeyAsMultibaseSpki(browserPair.publicKey, browser)
      ).orThrow();
      const nodeMb = (await CryptoUtils.exportPublicKeyAsMultibaseSpki(nodePair.publicKey, node)).orThrow();
      expect(browserMb).toBe(nodeMb);
    });

    test('parity holds regardless of the extractable flag', async () => {
      const browserPair = (await browser.importKeyPairFromSeed('ed25519', seed, false)).orThrow();
      const nodePair = (await node.importKeyPairFromSeed('ed25519', seed, false)).orThrow();
      const browserSpki = (await browser.exportPublicKeySpki(browserPair.publicKey)).orThrow();
      const nodeSpki = (await node.exportPublicKeySpki(nodePair.publicKey)).orThrow();
      expect(bytesToHex(browserSpki)).toBe(bytesToHex(nodeSpki));
    });
  });

  describe('determinism, extractable matrix, and validation on the browser provider', () => {
    test('the same seed yields the same public SPKI (idempotent)', async () => {
      const first = (await browser.importKeyPairFromSeed('ed25519', seed, true)).orThrow().publicKey;
      const second = (await browser.importKeyPairFromSeed('ed25519', seed, true)).orThrow().publicKey;
      const firstSpki = (await browser.exportPublicKeySpki(first)).orThrow();
      const secondSpki = (await browser.exportPublicKeySpki(second)).orThrow();
      expect(bytesToHex(secondSpki)).toBe(bytesToHex(firstSpki));
    });

    test('extractable=false returns a non-extractable private key that still signs', async () => {
      const pair = (await browser.importKeyPairFromSeed('ed25519', seed, false)).orThrow();
      expect(pair.privateKey.extractable).toBe(false);
      const message = new TextEncoder().encode('parity');
      const signature = (await browser.sign(pair.privateKey, message)).orThrow();
      expect(await browser.verify(pair.publicKey, signature, message)).toSucceedWith(true);
    });

    test('escrow window: the transient extractable key never leaks when extractable=false', async () => {
      const pair = (await browser.importKeyPairFromSeed('ed25519', seed, false)).orThrow();
      expect(pair.privateKey.extractable).toBe(false);
      // The transient extractable key used to recover the public half is never
      // returned — exporting the returned private key must reject.
      await expect(globalThis.crypto.subtle.exportKey('pkcs8', pair.privateKey)).rejects.toThrow();
      // The public key stays extractable so the deterministic public half is recoverable.
      expect(pair.publicKey.extractable).toBe(true);
    });

    test('extractable=true returns an extractable private key', async () => {
      const pair = (await browser.importKeyPairFromSeed('ed25519', seed, true)).orThrow();
      expect(pair.privateKey.extractable).toBe(true);
    });

    test('rejects a wrong-length seed', async () => {
      expect(await browser.importKeyPairFromSeed('ed25519', new Uint8Array(31), true)).toFailWith(
        /seed must be exactly 32 bytes/i
      );
    });

    test('rejects an unsupported seed-derivable algorithm', async () => {
      const badAlgorithm = 'ed448' as unknown as CryptoUtils.SeedDerivableAlgorithm;
      expect(await browser.importKeyPairFromSeed(badAlgorithm, seed, true)).toFailWith(
        /unsupported seed-derivable algorithm/i
      );
    });
  });

  describe('X25519 from seed (RFC 7748) — cross-provider parity', () => {
    // RFC 7748 §6.1 Alice private scalar + its derived X25519 public key.
    const x25519Seed = hexToBytes('77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a');
    const RFC7748_ALICE_PUBLIC_HEX: string =
      '8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a';

    async function rawPublic(provider: CryptoUtils.ICryptoProvider, extractable: boolean): Promise<string> {
      const pair = (await provider.importKeyPairFromSeed('x25519', x25519Seed, extractable)).orThrow();
      const raw = new Uint8Array(await globalThis.crypto.subtle.exportKey('raw', pair.publicKey));
      return bytesToHex(raw);
    }

    test("the browser provider derives Alice's public key from her private scalar", async () => {
      expect(await rawPublic(browser, true)).toBe(RFC7748_ALICE_PUBLIC_HEX);
    });

    test('Node and browser derive the byte-identical X25519 public key from the same seed', async () => {
      expect(await rawPublic(browser, false)).toBe(await rawPublic(node, false));
    });

    test('the derived private key carries X25519 deriveBits usage', async () => {
      const pair = (await browser.importKeyPairFromSeed('x25519', x25519Seed, false)).orThrow();
      expect(pair.privateKey.algorithm.name).toBe('X25519');
      expect(pair.privateKey.usages).toContain('deriveBits');
      expect(pair.privateKey.extractable).toBe(false);
    });
  });
});
