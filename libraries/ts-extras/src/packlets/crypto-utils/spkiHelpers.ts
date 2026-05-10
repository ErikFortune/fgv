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

import { Result, fail, succeed } from '@fgv/ts-utils';
import { ICryptoProvider, KeyPairAlgorithm } from './model';

/**
 * Encodes a `Uint8Array` as a multibase base64url (no-padding) string.
 *
 * The multibase prefix `'m'` identifies the encoding as RFC 4648 base64url
 * without padding. The body uses base64url alphabet: `+` → `-`, `/` → `_`,
 * and trailing `=` padding is stripped.
 *
 * @param data - The binary data to encode.
 * @returns A multibase-prefixed base64url string (`'m' + base64url-no-pad`).
 * @public
 */
export function multibaseBase64UrlEncode(data: Uint8Array): string {
  let base64: string;
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(data).toString('base64');
  } else {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    base64 = btoa(binary);
  }
  // Convert to base64url: + → -, / → _, strip = padding
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return 'm' + base64url;
}

/**
 * Decodes a multibase base64url (no-padding) string back to a `Uint8Array`.
 *
 * Validates that the first character is `'m'` (the multibase prefix for
 * RFC 4648 base64url without padding), then decodes the remaining body.
 *
 * @param encoded - A multibase-prefixed base64url string.
 * @returns `Success` with the decoded bytes, or `Failure` with error context.
 * @public
 */
export function multibaseBase64UrlDecode(encoded: string): Result<Uint8Array> {
  if (!encoded.startsWith('m')) {
    return fail(
      `multibaseBase64UrlDecode: invalid multibase prefix '${
        encoded[0] ?? '(empty)'
      }' — expected 'm' (base64url)`
    );
  }
  const body = encoded.slice(1);
  // Convert base64url back to standard base64 and restore padding
  const base64 = body.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    let bytes: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      bytes = new Uint8Array(Buffer.from(padded, 'base64'));
    } else {
      const binary = atob(padded);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    }
    return succeed(bytes);
  } catch {
    return fail(`multibaseBase64UrlDecode: malformed base64url body`);
  }
}

/**
 * Exports a public `CryptoKey` as a multibase base64url-encoded SPKI blob.
 *
 * The SPKI (SubjectPublicKeyInfo) format is the standard DER-encoded structure
 * for public keys defined in RFC 5480 and RFC 5958. It is algorithm-agnostic
 * and suitable for storage and transmission.
 *
 * @param key - The `CryptoKey` to export. Must have `key.type === 'public'`.
 * @param provider - The {@link ICryptoProvider} to use for the export operation.
 * @returns `Success` with the multibase SPKI string, or `Failure` with error context.
 * @public
 */
export async function exportPublicKeyAsMultibaseSpki(
  key: CryptoKey,
  provider: ICryptoProvider
): Promise<Result<string>> {
  return (await provider.exportPublicKeySpki(key))
    .withErrorFormat((e) => `exportPublicKeyAsMultibaseSpki: ${e}`)
    .onSuccess((buf) => succeed(multibaseBase64UrlEncode(buf)));
}

/**
 * Imports a public key from a multibase base64url-encoded SPKI blob.
 *
 * Decodes the multibase prefix, decodes the base64url body, then uses
 * the provider to import the key with the algorithm parameters from
 * {@link keyPairAlgorithmParams}.
 *
 * @param encoded - A multibase SPKI string produced by {@link exportPublicKeyAsMultibaseSpki}.
 * @param algorithm - The {@link KeyPairAlgorithm} the key was generated for.
 * @param provider - The {@link ICryptoProvider} to use for the import operation.
 * @returns `Success` with the imported public `CryptoKey`, or `Failure` with error context.
 * @public
 */
export async function importPublicKeyFromMultibaseSpki(
  encoded: string,
  algorithm: KeyPairAlgorithm,
  provider: ICryptoProvider
): Promise<Result<CryptoKey>> {
  const decodeResult = multibaseBase64UrlDecode(encoded);
  if (decodeResult.isFailure()) {
    return fail(`importPublicKeyFromMultibaseSpki: ${decodeResult.message}`);
  }
  return (await provider.importPublicKeySpki(decodeResult.value, algorithm)).withErrorFormat(
    (e) => `importPublicKeyFromMultibaseSpki: ${e}`
  );
}
