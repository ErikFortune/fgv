/*
 * Copyright (c) 2023 Erik Fortune
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

import { HashingNormalizer } from './hashingNormalizer';

const textEncoder: TextEncoder = new TextEncoder();

const POLYNOMIAL: number = 0xedb88320;

const crc32Table: number[] = [];

function crc32(bytes: Uint8Array, crc: number = 0xffffffff): number {
  if (crc32Table.length === 0) {
    buildCrc32Table();
  }
  for (let i = 0; i < bytes.length; ++i) {
    // eslint-disable-next-line no-bitwise
    crc = crc32Table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

const toUInt32 = (n: number): number => {
  if (n >= 0) {
    return n;
  }
  return 0xffffffff - n * -1 + 1;
};

function buildCrc32Table(): void {
  if (crc32Table.length === 0) {
    for (let n = 0; n < 256; n++) {
      let r = n;
      for (let i = 0; i < 8; i++) {
        // eslint-disable-next-line no-bitwise
        if (r & 1) {
          r = (r >>> 1) ^ POLYNOMIAL;
        } else {
          r = r >>> 1;
        }
      }
      crc32Table.push(toUInt32(r));
    }
  }
}

/**
 * A {@link Hash.HashingNormalizer | hashing normalizer} which computes object
 * hash using the CRC32 algorithm.
 * @public
 */
export class Crc32Normalizer extends HashingNormalizer {
  public constructor() {
    super(Crc32Normalizer.crc32Hash);
  }

  public static crc32Hash(parts: string[]): string {
    return String(crc32(textEncoder.encode(parts.join('|'))));
  }
}
