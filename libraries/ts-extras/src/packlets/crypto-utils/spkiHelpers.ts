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
import { ICryptoProvider, KeyPairAlgorithm, MultibaseSpkiPublicKey } from './model';

/**
 * Shared shape check for a base64url (no-padding) body: only base64url alphabet
 * characters (`A-Z`, `a-z`, `0-9`, `-`, `_`) and a length that is never `% 4 === 1`
 * (an impossible base64 remainder). Factored so the decoder and the
 * {@link isValidMultibaseSpkiPublicKey} guard agree on exactly one rule.
 */
function isBase64UrlNoPadBody(body: string): boolean {
  return /^[A-Za-z0-9_-]*$/.test(body) && body.length % 4 !== 1;
}

/**
 * Encodes a `Uint8Array` as a base64url (no-padding) string (RFC 4648 §5).
 *
 * The body uses the base64url alphabet (`+` → `-`, `/` → `_`) and trailing `=`
 * padding is stripped. This is the bare primitive with no multibase prefix; use
 * {@link CryptoUtils.multibaseBase64UrlEncode} when a multibase-`'m'`-prefixed value is required.
 *
 * @param data - The binary data to encode.
 * @returns The base64url-no-pad string.
 * @public
 */
export function base64UrlNoPadEncode(data: Uint8Array): string {
  let base64: string;
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(data).toString('base64');
    /* c8 ignore start - browser-only: btoa path not available in Node tests */
  } else {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    base64 = btoa(binary);
  }
  /* c8 ignore stop */
  // Convert to base64url: + → -, / → _, strip = padding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes a base64url (no-padding) string (RFC 4648 §5) back to a `Uint8Array`.
 *
 * This is the bare primitive with no multibase prefix; use
 * {@link CryptoUtils.multibaseBase64UrlDecode} to decode a multibase-`'m'`-prefixed value.
 *
 * @param encoded - The base64url-no-pad body to decode.
 * @returns `Success` with the decoded bytes, or `Failure` with error context.
 * @public
 */
export function base64UrlNoPadDecode(encoded: string): Result<Uint8Array> {
  if (!isBase64UrlNoPadBody(encoded)) {
    return fail(`base64UrlNoPadDecode: malformed base64url body`);
  }
  // Convert base64url back to standard base64 and restore padding
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    let bytes: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      bytes = new Uint8Array(Buffer.from(padded, 'base64'));
      /* c8 ignore start - browser-only: atob path not available in Node tests */
    } else {
      const binary = atob(padded);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    }
    /* c8 ignore stop */
    return succeed(bytes);
    /* c8 ignore next 3 - defensive: shape check above prevents invalid chars from reaching here */
  } catch {
    return fail(`base64UrlNoPadDecode: malformed base64url body`);
  }
}

/**
 * The structural *shape* of a {@link CryptoUtils.MultibaseSpkiPublicKey}: the
 * multibase `'m'` prefix followed by a non-empty base64url-no-pad body
 * (`A-Z`, `a-z`, `0-9`, `-`, `_`).
 *
 * This is a shape prefilter, not full validation: it does not decode the DER
 * SPKI or verify the key material or algorithm (that happens in
 * {@link CryptoUtils.importPublicKeyFromMultibaseSpki}). The authoritative guard
 * is {@link CryptoUtils.isValidMultibaseSpkiPublicKey}, which enforces this
 * pattern **and** additionally rejects a body whose length is an impossible
 * base64 remainder. Exposed for callers that need the pattern directly (e.g. a
 * JSON-schema `pattern` field); prefer the guard/converter for validation.
 *
 * @public
 */
export const MultibaseSpkiPublicKeyRegExp: RegExp = /^m[A-Za-z0-9_-]+$/;

/**
 * Type guard for {@link CryptoUtils.MultibaseSpkiPublicKey}: a string matching
 * {@link CryptoUtils.MultibaseSpkiPublicKeyRegExp} (multibase `'m'` prefix + a
 * non-empty base64url-no-pad body) whose body also satisfies the base64url-no-pad
 * length rule shared with {@link CryptoUtils.base64UrlNoPadDecode}. This is a
 * structural *shape* check, not full validation — it does not decode the DER SPKI
 * or verify the key material/algorithm (a malformed-but-well-shaped string fails
 * later, with clear context, in {@link CryptoUtils.importPublicKeyFromMultibaseSpki}).
 *
 * @param value - The value to test.
 * @returns `true` if `value` is a well-formed multibase SPKI public key string.
 * @public
 */
export function isValidMultibaseSpkiPublicKey(value: unknown): value is MultibaseSpkiPublicKey {
  return (
    typeof value === 'string' &&
    MultibaseSpkiPublicKeyRegExp.test(value) &&
    isBase64UrlNoPadBody(value.slice(1))
  );
}

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
  return 'm' + base64UrlNoPadEncode(data);
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
  // Intentionally pin the exact original message (the delegate has a single failure
  // mode) to keep this established public function byte-for-byte behavior-preserving
  // after the extract-and-delegate refactor — do not "fix" this into composing the
  // delegate's message without updating the delegation-equivalence tests.
  return base64UrlNoPadDecode(encoded.slice(1)).withErrorFormat(
    () => `multibaseBase64UrlDecode: malformed base64url body`
  );
}

/**
 * Exports a public `CryptoKey` as a multibase base64url-encoded SPKI blob.
 *
 * The SPKI (SubjectPublicKeyInfo) format is the standard DER-encoded structure
 * for public keys defined in RFC 5280, RFC 5480, and RFC 8410. It is
 * algorithm-agnostic and suitable for storage and transmission.
 *
 * @param key - The `CryptoKey` to export. Must have `key.type === 'public'`.
 * @param provider - The {@link CryptoUtils.ICryptoProvider} to use for the export operation.
 * @returns `Success` with the multibase SPKI string, or `Failure` with error context.
 * @public
 */
export async function exportPublicKeyAsMultibaseSpki(
  key: CryptoKey,
  provider: ICryptoProvider
): Promise<Result<MultibaseSpkiPublicKey>> {
  return (await provider.exportPublicKeySpki(key))
    .withErrorFormat((e) => `exportPublicKeyAsMultibaseSpki: ${e}`)
    .onSuccess((buf) =>
      // The output is a freshly-built valid multibase SPKI string (`'m'` prefix +
      // base64url-no-pad body), so brand it at the construction site — no re-validation needed.
      succeed(multibaseBase64UrlEncode(buf) as MultibaseSpkiPublicKey)
    );
}

/**
 * Imports a public key from a multibase base64url-encoded SPKI blob.
 *
 * Decodes the multibase prefix, decodes the base64url body, then uses
 * the provider to import the key with the algorithm parameters from
 * {@link CryptoUtils.keyPairAlgorithmParams}.
 *
 * Accepts a plain `string` (not only a branded {@link CryptoUtils.MultibaseSpkiPublicKey}),
 * so callers holding an unbranded value read from storage or the wire can import
 * it directly; a malformed value fails with error context rather than throwing.
 *
 * @param encoded - A multibase SPKI string produced by {@link CryptoUtils.exportPublicKeyAsMultibaseSpki}.
 * @param algorithm - The {@link CryptoUtils.KeyPairAlgorithm} the key was generated for.
 * @param provider - The {@link CryptoUtils.ICryptoProvider} to use for the import operation.
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
