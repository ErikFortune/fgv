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

import { FileTree, JsonObject } from '@fgv/ts-json-base';

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

// ============================================================================
// Full Library Loading Types
// ============================================================================

/**
 * Identifiers for sub-libraries within the chocolate library system.
 * @public
 */
export type SubLibraryId = 'ingredients' | 'recipes';

/**
 * All valid sub-library identifiers.
 * @public
 */
export const allSubLibraryIds: ReadonlyArray<SubLibraryId> = ['ingredients', 'recipes'] as const;

/**
 * Controls loading for each sub-library within a library source.
 *
 * - `true`: Load all sub-libraries with default settings (all collections)
 * - `false`: Load no sub-libraries
 * - `Record<SubLibraryId | 'default', LibraryLoadSpec>`: Per-sub-library control
 *   - Named sub-libraries get their specific spec
 *   - 'default' applies to unspecified sub-libraries
 *
 * @public
 */
export type FullLibraryLoadSpec = boolean | Partial<Record<SubLibraryId | 'default', LibraryLoadSpec>>;

/**
 * Resolves a FullLibraryLoadSpec to a LibraryLoadSpec for a specific sub-library.
 *
 * @param spec - The full library load spec
 * @param subLibraryId - The sub-library to resolve for
 * @returns The resolved LibraryLoadSpec for the sub-library
 * @public
 */
export function resolveSubLibraryLoadSpec(
  spec: FullLibraryLoadSpec,
  subLibraryId: SubLibraryId
): LibraryLoadSpec {
  if (typeof spec === 'boolean') {
    return spec;
  }

  // Check for specific sub-library spec
  const subSpec = spec[subLibraryId];
  if (subSpec !== undefined) {
    return subSpec;
  }

  // Fall back to default
  const defaultSpec = spec.default;
  if (defaultSpec !== undefined) {
    return defaultSpec;
  }

  // If no default specified and sub-library not mentioned, load nothing
  return false;
}

// ============================================================================
// File Tree Source Types
// ============================================================================

/**
 * Specifies a file tree source for library data.
 *
 * Navigates to standard paths (data/ingredients, data/recipes) within the tree
 * and loads collections according to the specified load spec.
 *
 * @public
 */
export interface ILibraryFileTreeSource {
  /**
   * Root directory of the library tree.
   * The loader will navigate to sub-paths like 'data/ingredients' and 'data/recipes'.
   */
  readonly directory: FileTree.IFileTreeDirectoryItem;

  /**
   * Which sub-libraries to load from this source.
   * Default: true (load all sub-libraries)
   */
  readonly load?: FullLibraryLoadSpec;

  /**
   * Mutability specification for collections from this source.
   * Default: false (all collections immutable)
   */
  readonly mutable?: MutabilitySpec;
}
