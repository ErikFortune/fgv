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
import { Result } from '@fgv/ts-utils';
import { EncryptedCollectionErrorMode, ICryptoProvider, INamedSecret } from '../crypto';

// ============================================================================
// Collection Source Metadata Types
// ============================================================================

/**
 * Optional metadata for collection source files.
 * When present in source files, provides additional information about the collection.
 * @public
 */
export interface ICollectionSourceMetadata {
  /**
   * Secret name for encryption/decryption.
   * If provided, the publish command uses this to look up the encryption key.
   */
  readonly secretName?: string;

  /**
   * Human-readable name for the collection.
   */
  readonly name?: string;

  /**
   * Description of the collection's purpose/contents.
   */
  readonly description?: string;

  /**
   * Version identifier for the collection.
   */
  readonly version?: string;

  /**
   * Tags for categorization/search.
   */
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Structure of collection source files (YAML/JSON).
 * @public
 */
export interface ICollectionSourceFile<T = JsonObject> {
  /**
   * Optional metadata about the collection.
   */
  readonly metadata?: ICollectionSourceMetadata;

  /**
   * The actual collection items, keyed by item ID.
   */
  readonly items: Record<string, T>;
}

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
  /**
   * Optional metadata from the source file.
   * May be undefined for collections created programmatically.
   */
  readonly metadata?: ICollectionSourceMetadata;
}

// ============================================================================
// Full Library Loading Types
// ============================================================================

/**
 * Identifiers for sub-libraries within the chocolate library system.
 * @public
 */
export type SubLibraryId = 'ingredients' | 'recipes' | 'journals' | 'molds' | 'procedures';

/**
 * All valid sub-library identifiers.
 * @public
 */
export const allSubLibraryIds: ReadonlyArray<SubLibraryId> = [
  'ingredients',
  'recipes',
  'journals',
  'molds',
  'procedures'
] as const;

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
 * Specifies a file tree source for a single sub-library (ingredients or recipes).
 *
 * This is the common base type for sub-library-specific file tree sources.
 * Each sub-library navigates to its standard path within the tree and
 * loads collections according to the load spec.
 *
 * @typeParam TCollectionId - The type of collection identifiers (defaults to SourceId)
 * @public
 */
export interface IFileTreeSource<TCollectionId extends string = string> {
  /**
   * Root directory of the library tree.
   * The loader will navigate to the appropriate sub-path (e.g., 'data/ingredients' or 'data/recipes').
   */
  readonly directory: FileTree.IFileTreeDirectoryItem;

  /**
   * Controls which collections to load from this source.
   *
   * - `true` (default): Load all collections.
   * - `false`: Load no collections.
   * - `TCollectionId[]`: Load only the specified collections by name.
   * - `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.
   */
  readonly load?: LibraryLoadSpec<TCollectionId>;

  /**
   * Mutability specification for collections from this source.
   * Default: false (all collections immutable)
   */
  readonly mutable?: MutabilitySpec;
}

/**
 * Specifies a file tree source for the full library (all sub-libraries).
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

// ============================================================================
// Library Merging Types
// ============================================================================

/**
 * Specifies a library to merge with optional collection filtering.
 *
 * Used when creating a new library that should include collections from
 * an existing library instance. The filter parameter allows selective
 * merging of collections.
 *
 * @typeParam TLibrary - The type of library being merged
 * @typeParam TCollectionId - The type of collection identifiers (defaults to string)
 * @public
 */
export interface IMergeLibrarySource<TLibrary, TCollectionId extends string = string> {
  /**
   * The library to merge collections from.
   */
  readonly library: TLibrary;

  /**
   * Controls which collections to merge from this library.
   *
   * - `true` (default): Merge all collections.
   * - `false`: Merge no collections (skip this library).
   * - `TCollectionId[]`: Merge only the specified collections by name.
   * - `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.
   */
  readonly filter?: LibraryLoadSpec<TCollectionId>;
}

// ============================================================================
// Encryption Types
// ============================================================================

/**
 * Function type for providing encryption keys by secret name.
 * Used for dynamic key lookup (e.g., from environment variables or key stores).
 * @public
 */
export type SecretProvider = (secretName: string) => Promise<Result<Uint8Array>>;

/**
 * Configuration for handling encrypted collections during loading.
 * @public
 */
export interface IEncryptionConfig {
  /**
   * Array of named secrets to use for decryption.
   * Each secret has a name and a 32-byte key for AES-256 encryption.
   */
  readonly secrets?: ReadonlyArray<INamedSecret>;

  /**
   * Optional function to dynamically provide keys by secret name.
   * Called when a secret is not found in the `secrets` array.
   */
  readonly secretProvider?: SecretProvider;

  /**
   * The crypto provider to use for decryption.
   * Use `nodeCryptoProvider` for Node.js or `BrowserCryptoProvider` for browsers.
   */
  readonly cryptoProvider: ICryptoProvider;

  /**
   * How to handle encrypted files when the required secret is not available.
   * - `'fail'` (default): Fail the entire load operation.
   * - `'skip'`: Skip the encrypted file and continue loading other files.
   * - `'warn'`: Log a warning and skip the encrypted file.
   */
  readonly onMissingKey?: EncryptedCollectionErrorMode;

  /**
   * How to handle decryption errors (e.g., wrong key, corrupted data).
   * - `'fail'` (default): Fail the entire load operation.
   * - `'skip'`: Skip the file and continue loading other files.
   * - `'warn'`: Log a warning and skip the file.
   */
  readonly onDecryptionError?: EncryptedCollectionErrorMode;
}
