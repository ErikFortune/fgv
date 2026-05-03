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

import { Brand } from './brand';

/**
 * A spec-compliant UUID string (canonical 8-4-4-4-12 lowercase hex form).
 * @public
 */
export type Uuid = Brand<string, 'Uuid'>;

/**
 * Canonical UUID format: 8-4-4-4-12 lowercase hex digits with the version
 * nibble in the third group and the variant nibble (8, 9, a, or b) at the
 * start of the fourth group. Matches what `crypto.randomUUID()` returns.
 */
const uuidRegex: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Type guard that returns `true` when the input is a canonical UUID string.
 * @param value - The string to test.
 * @returns `true` if `value` is a canonical UUID, narrowing it to {@link Uuid}.
 * @public
 */
export function isValidUuid(value: string): value is Uuid {
  return uuidRegex.test(value);
}

/**
 * Generates a cryptographically random UUIDv4 using the platform's Web Crypto
 * API (`globalThis.crypto.randomUUID`). Works in Node.js \>= 18 and modern
 * browsers without per-call runtime checks.
 * @returns A new {@link Uuid}.
 * @throws An `Error` if the runtime does not expose `globalThis.crypto.randomUUID`\.
 * This indicates an unsupported platform, not a per-call failure mode, so it is
 * surfaced as a thrown error rather than a `Result`.
 * @public
 */
export function generateUuid(): Uuid {
  const cryptoObj = globalThis.crypto;
  /* c8 ignore next 5 - all supported runtimes (node >= 18, modern browsers) expose globalThis.crypto.randomUUID */
  if (typeof cryptoObj?.randomUUID !== 'function') {
    throw new Error(
      'generateUuid: globalThis.crypto.randomUUID is not available; requires Node.js >= 18 or a modern browser'
    );
  }
  return cryptoObj.randomUUID() as Uuid;
}
