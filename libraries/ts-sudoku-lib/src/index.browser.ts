/*
 * MIT License
 *
 * Copyright (c) 2025 Erik Fortune
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

// Browser entry point - excludes Node.js filesystem dependencies

// eslint-disable-next-line @rushstack/packlets/mechanics -- browser-specific entry point excludes Node.js fs dependencies
import * as Files from './packlets/files/index.browser';
import * as Hints from './packlets/hints';
import * as Puzzles from './packlets/puzzles';

export * from './packlets/collections';
export * from './packlets/common';
export { Files, Hints, Puzzles };

// Excluded from browser:
// - Files.loadJsonPuzzlesFileSync (requires Node.js fs via JsonFile.convertJsonFileSync)
//
// Included in browser (via FileTree):
// - Files.loadJsonPuzzlesFromTree (browser-compatible via FileTree)
