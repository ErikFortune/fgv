/*
 * Copyright (c) 2020 Erik Fortune
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

/* c8 ignore start - Browser-specific export used conditionally in package.json */
// eslint-disable-next-line @rushstack/packlets/mechanics
import * as Csv from './packlets/csv/index.browser';
import * as Experimental from './packlets/experimental';
// eslint-disable-next-line @rushstack/packlets/mechanics
import * as Hash from './packlets/hash/index.browser';
// eslint-disable-next-line @rushstack/packlets/mechanics
import * as RecordJar from './packlets/record-jar/index.browser';
import * as ZipFileTree from './packlets/zip-file-tree';

import { Converters } from './packlets/conversion';

// Browser-safe exports - Node.js crypto-based hash excluded (using CRC32 instead)
export { Converters, Csv, Experimental, Hash, RecordJar, ZipFileTree };
/* c8 ignore stop */
