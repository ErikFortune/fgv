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

import { Hash } from '@fgv/ts-utils';

/**
 * Browser-compatible MD5 normalizer that uses CRC32 hashing for cross-platform compatibility.
 * This provides the same interface as the Node.js MD5 version but uses CRC32 algorithm
 * which works consistently across both Node.js and browser environments.
 *
 * Note: While this is named Md5Normalizer for API compatibility, it actually uses CRC32
 * hashing to ensure cross-platform compatibility between Node.js and browser environments.
 * @public
 */
export class Md5Normalizer extends Hash.Crc32Normalizer {
  // CRC32 normalizer is already cross-platform compatible
  // No additional implementation needed - inherits everything from Crc32Normalizer
}
