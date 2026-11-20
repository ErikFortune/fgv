/*
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

/**
 * The Node atomic-write protocol — the implementation of
 * `IAtomicFileTreeAccessors` for `FsFileTreeAccessors`, and nothing else.
 *
 * @remarks
 * **Internal to this packlet. Neither packlet barrel may re-export it.**
 * `index.ts` and `index.browser.ts` export the atomic *contracts* (from
 * `fileTreeAccessors`); what lives here is how one accessor satisfies them.
 *
 * The distinction is load-bearing for the browser build. These modules import
 * `node:fs`, and they are unreachable from `index.browser.ts` only because
 * nothing it exports reaches them — `fsTree` is its sole consumer, and the
 * browser barrel deliberately omits `fsTree`. Re-exporting this directory from
 * either barrel would put `fs` in the browser bundle.
 *
 * It is a subdirectory for the same reason `in-memory` is one: it is one
 * accessor's implementation, not a peer of the abstraction. Sitting flat beside
 * `fileTree.ts` and `fileTreeAccessors.ts`, these files read as a new layer,
 * which is what prompted the move.
 */

export * from './atomicFsOperations';
export * from './atomicFileCommit';
export * from './atomicRootQualification';
