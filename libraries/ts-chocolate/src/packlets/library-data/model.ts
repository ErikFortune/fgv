// Copyright (c) 2024 Erik Fortune
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

import { JsonObject } from '@fgv/ts-json-base';

/**
 * A pattern for matching collection or item names. Can be a string (exact match) or RegExp.
 * @public
 */
export type FilterPattern = string | RegExp;

/**
 * Specifies which collections should be mutable.
 * - `true`: All collections are mutable.
 * - `false`: All collections are immutable.
 * - `ReadonlyArray<string>`: Only the specified collections are mutable, all others are immutable.
 * - `{ immutable: ReadonlyArray<string> }`: Only the specified collections are immutable, all others are mutable.
 * @public
 */
export type MutabilitySpec = boolean | ReadonlyArray<string> | { readonly immutable: ReadonlyArray<string> };

/**
 * Representation of a collection of items loaded from a file tree.
 * @public
 */
export interface ICollection<
  T = JsonObject,
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string
> {
  readonly id: TCOLLECTIONID;
  readonly isMutable: boolean;
  readonly items: Record<TITEMID, T>;
}
