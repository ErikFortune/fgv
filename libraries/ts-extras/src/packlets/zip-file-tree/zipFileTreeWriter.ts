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

import { zipSync, strToU8 } from 'fflate';
import { Result, captureResult } from '@fgv/ts-utils';

/**
 * Simple interface for a file to be added to a zip file.
 * @public
 */
export interface IZipTextFile {
  readonly path: string;
  readonly contents: string;
}

/**
 * Supported compression levels for zip files.
 * @public
 */
export type ZipCompressionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Options for creating a zip file from text files.
 * @public
 */
export interface ICreateZipOptions {
  readonly level?: ZipCompressionLevel;
}

/**
 * Creates a zip file from an array of text files.
 * @public
 */
export function createZipFromTextFiles(
  files: ReadonlyArray<IZipTextFile>,
  options?: ICreateZipOptions
): Result<Uint8Array> {
  return captureResult(() => {
    const out: Record<string, Uint8Array> = {};
    for (const f of files) {
      const normalizedPath = f.path.replace(/^\/+/, '');
      out[normalizedPath] = strToU8(f.contents);
    }
    return zipSync(out, { level: options?.level ?? 6 });
  }).withErrorFormat((e) => `Failed to create zip: ${e}`);
}
