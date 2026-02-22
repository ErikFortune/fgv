// Copyright (c) 2026 Erik Fortune
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

/**
 * Post-construction settings validation.
 *
 * Validates resolved settings against the actual workspace state (loaded sources,
 * available collections) and returns a list of warnings for any inconsistencies.
 * Warnings drive the three-option recovery dialog in the UI.
 *
 * @packageDocumentation
 */

import { CollectionId } from '../common';
import { SubLibraryId } from '../library-data';
import { IResolvedSettings, StorageRootId } from './model';

// ============================================================================
// Warning Categories
// ============================================================================

/**
 * A storage root referenced in settings is not available.
 * @public
 */
export interface IMissingRootWarning {
  readonly kind: 'missing-root';
  /** The storage root ID that could not be found */
  readonly rootId: StorageRootId;
  /** Human-readable description of where this root was referenced */
  readonly context: string;
}

/**
 * A collection referenced in defaultTargets does not exist in the workspace.
 * @public
 */
export interface IMissingCollectionWarning {
  readonly kind: 'missing-collection';
  /** The sub-library this target belongs to */
  readonly subLibraryId: SubLibraryId;
  /** The collection ID that could not be found */
  readonly collectionId: CollectionId;
  /** Human-readable description of where this collection was referenced */
  readonly context: string;
}

/**
 * The preferences file location references an unavailable root.
 * @public
 */
export interface IMissingPreferencesLocationWarning {
  readonly kind: 'missing-preferences-location';
  /** The root name that could not be found */
  readonly rootName: string;
  /** Human-readable description */
  readonly context: string;
}

/**
 * Union of all settings validation warning types.
 * @public
 */
export type ISettingsValidationWarning =
  | IMissingRootWarning
  | IMissingCollectionWarning
  | IMissingPreferencesLocationWarning;

// ============================================================================
// Validation Context
// ============================================================================

/**
 * Context provided to the validator describing what is actually available
 * in the workspace at runtime.
 * @public
 */
export interface ISettingsValidationContext {
  /**
   * The set of storage root IDs that are currently loaded and available.
   * These are the `sourceName` values from loaded file tree sources.
   */
  readonly availableRoots: ReadonlySet<StorageRootId>;

  /**
   * The set of collection IDs available per sub-library.
   * Used to validate `defaultTargets`.
   */
  readonly availableCollections?: Partial<Record<SubLibraryId, ReadonlySet<CollectionId>>>;
}

// ============================================================================
// Validation Function
// ============================================================================

/**
 * Validates resolved settings against the actual workspace state.
 *
 * Checks:
 * - `defaultStorageTargets.globalDefault` references a loaded root
 * - `defaultStorageTargets.sublibraryOverrides` all reference loaded roots
 * - `defaultTargets` collection IDs exist in the workspace (when collections provided)
 *
 * @param resolved - The resolved settings to validate
 * @param context - What is actually available in the workspace
 * @returns Array of warnings (empty = all settings are valid)
 * @public
 */
export function validateResolvedSettings(
  resolved: IResolvedSettings,
  context: ISettingsValidationContext
): ISettingsValidationWarning[] {
  const warnings: ISettingsValidationWarning[] = [];

  // Check defaultStorageTargets
  const dst = resolved.defaultStorageTargets;
  if (dst !== undefined) {
    if (dst.globalDefault !== undefined && !context.availableRoots.has(dst.globalDefault)) {
      warnings.push({
        kind: 'missing-root',
        rootId: dst.globalDefault,
        context: 'defaultStorageTargets.globalDefault'
      });
    }

    if (dst.sublibraryOverrides !== undefined) {
      for (const [subLib, rootId] of Object.entries(dst.sublibraryOverrides)) {
        if (rootId !== undefined && !context.availableRoots.has(rootId as StorageRootId)) {
          warnings.push({
            kind: 'missing-root',
            rootId: rootId as StorageRootId,
            context: `defaultStorageTargets.sublibraryOverrides.${subLib}`
          });
        }
      }
    }
  }

  // Check defaultTargets collection IDs (only when collections are provided)
  if (context.availableCollections !== undefined) {
    for (const [subLib, collectionId] of Object.entries(resolved.defaultTargets)) {
      /* c8 ignore next 3 - defensive: typed as CollectionId, undefined only possible via unsafe cast */
      if (collectionId === undefined) {
        continue;
      }
      const available = context.availableCollections[subLib as SubLibraryId];
      if (available !== undefined && !available.has(collectionId as CollectionId)) {
        warnings.push({
          kind: 'missing-collection',
          subLibraryId: subLib as SubLibraryId,
          collectionId: collectionId as CollectionId,
          context: `defaultTargets.${subLib}`
        });
      }
    }
  }

  return warnings;
}
