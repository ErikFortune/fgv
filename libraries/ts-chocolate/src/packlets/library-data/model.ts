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

// ============================================================================
// Library Loading Types
// ============================================================================

/**
 * Fine-grained parameters for controlling which collections from a library to load.
 * @public
 */
export interface ILibraryLoadParams {
  /**
   * Patterns to include. If specified, only collection names matching at least one pattern are included.
   * Strings are matched exactly, RegExp patterns use `.test()`.
   */
  readonly included?: ReadonlyArray<FilterPattern>;
  /**
   * Patterns to exclude. Collection names matching any pattern are excluded (takes precedence over included).
   * Strings are matched exactly, RegExp patterns use `.test()`.
   */
  readonly excluded?: ReadonlyArray<FilterPattern>;
  /**
   * Whether to recurse into subdirectories and use a delimiter to form composite collection names.
   */
  readonly recurseWithDelimiter?: string;
}

/**
 * Specifies which collections from a library should be loaded.
 *
 * - `true`: Load all collections (default).
 * - `false`: Load no collections.
 * - `ReadonlyArray<TCollectionId>`: Load only the specified collections by name.
 * - `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.
 *
 * @public
 */
export type LibraryLoadSpec<TCollectionId extends string = string> =
  | boolean
  | ReadonlyArray<TCollectionId>
  | ILibraryLoadParams;

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
