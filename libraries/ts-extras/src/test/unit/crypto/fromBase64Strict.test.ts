/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { CryptoUtils } from '../../../index';

describe('CryptoUtils.fromBase64Strict', () => {
  it('round-trips every byte value 0-255', () => {
    // The decode walks a "binary string" one UTF-16 code unit per byte. Asserting
    // the whole range beats arguing that it holds.
    const allBytes: Uint8Array = Uint8Array.from({ length: 256 }, (__v, i) => i);
    const encoded: string = CryptoUtils.toBase64(allBytes);
    expect(CryptoUtils.fromBase64Strict(encoded)).toSucceedWith(allBytes);
  });

  it('decodes ordinary text', () => {
    const bytes: Uint8Array = new TextEncoder().encode('héllo — em dash');
    expect(CryptoUtils.fromBase64Strict(CryptoUtils.toBase64(bytes))).toSucceedWith(bytes);
  });

  it('decodes the empty string to an empty array', () => {
    expect(CryptoUtils.fromBase64Strict('')).toSucceedWith(new Uint8Array());
  });

  it('rejects out-of-alphabet characters instead of salvaging them', () => {
    // This is the whole reason the strict variant exists — see the lenient
    // comparison below.
    expect(CryptoUtils.fromBase64Strict('not!valid!base64!')).toFailWith(/invalid base64/i);
  });

  it('rejects a truncated / bad-length payload', () => {
    expect(CryptoUtils.fromBase64Strict('aGVsbG8=x')).toFailWith(/invalid base64/i);
  });

  it('differs from the lenient sibling exactly where it matters', () => {
    // `fromBase64` is Buffer-first under Node and Buffer silently DROPS characters
    // outside the alphabet, so a corrupt payload decodes to plausible garbage with
    // no complaint. Pinned here so the two functions' contracts stay legibly
    // different and nobody "simplifies" one into the other.
    const corrupt: string = 'aGVs!!bG8=';
    expect(() => CryptoUtils.fromBase64(corrupt)).not.toThrow();
    expect(CryptoUtils.fromBase64Strict(corrupt)).toFail();
  });

  it('tolerates embedded ASCII whitespace, as the forgiving-base64 algorithm specifies', () => {
    // Line-wrapped base64 is common and benign; this leniency is inherited from
    // `atob` deliberately and does not weaken the corrupt-bytes guarantee.
    const bytes: Uint8Array = new TextEncoder().encode('hello');
    const wrapped: string = CryptoUtils.toBase64(bytes).replace(/(.{2})/, '$1\n');
    expect(CryptoUtils.fromBase64Strict(wrapped)).toSucceedWith(bytes);
  });
});
