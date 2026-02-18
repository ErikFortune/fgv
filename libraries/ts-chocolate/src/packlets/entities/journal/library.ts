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
 * Journal library for managing cooking session entries
 * @packageDocumentation
 */

import { captureResult, Logging, Result } from '@fgv/ts-utils';

import {
  ConfectionId,
  ConfectionRecipeVariationId,
  FillingId,
  FillingRecipeVariationId,
  BaseJournalId,
  JournalId,
  Converters as CommonConverters
} from '../../common';
import {
  getJournalsDirectory,
  ISubLibraryAsyncParams,
  ISubLibraryCreateParams,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../../library-data';
import { BuiltInData } from '../../built-in';
import {
  AnyJournalEntryEntity,
  IConfectionEditJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  IFillingEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  isConfectionEditJournalEntryEntity,
  isConfectionProductionJournalEntryEntity,
  isFillingEditJournalEntryEntity,
  isFillingProductionJournalEntryEntity
} from './model';
import { anyJournalEntryEntity as anyJournalEntryConverter } from './converters';
import { JournalCollectionEntryInit } from './collection';

// ============================================================================
// Re-export collection types for convenience
// ============================================================================

export {
  JournalCollectionEntry,
  JournalCollectionEntryInit,
  JournalCollectionValidator,
  JournalCollection
} from './collection';

// ============================================================================
// Type Aliases and Guards
// ============================================================================

/**
 * Union type for filling journal entries (edit or production)
 * @public
 */
export type AnyFillingJournalEntry = IFillingEditJournalEntryEntity | IFillingProductionJournalEntryEntity;

/**
 * Union type for confection journal entries (edit or production)
 * @public
 */
export type AnyConfectionJournalEntry =
  | IConfectionEditJournalEntryEntity
  | IConfectionProductionJournalEntryEntity;

/**
 * Type guard for filling journal entries
 * @param entry - Journal entry to check
 * @returns True if the entry is a filling journal entry (edit or production)
 * @public
 */
export function isFillingJournalEntry(entry: AnyJournalEntryEntity): entry is AnyFillingJournalEntry {
  return isFillingEditJournalEntryEntity(entry) || isFillingProductionJournalEntryEntity(entry);
}

/**
 * Type guard for confection journal entries
 * @param entry - Journal entry to check
 * @returns True if the entry is a confection journal entry (edit or production)
 * @public
 */
export function isConfectionJournalEntry(entry: AnyJournalEntryEntity): entry is AnyConfectionJournalEntry {
  return isConfectionEditJournalEntryEntity(entry) || isConfectionProductionJournalEntryEntity(entry);
}

// ============================================================================
// Parameters Interfaces
// ============================================================================

/**
 * File tree source for journal data.
 * @public
 */
export type IJournalFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies a journals library to merge into a new library.
 * @public
 */
export type JournalsMergeSource = SubLibraryMergeSource<JournalLibrary>;

/**
 * Parameters for creating a JournalLibrary instance synchronously.
 * @public
 */
export type IJournalLibraryParams = ISubLibraryParams<JournalLibrary, JournalCollectionEntryInit>;

/**
 * Parameters for creating a JournalLibrary instance asynchronously with encryption support.
 * @public
 */
export type IJournalLibraryAsyncParams = ISubLibraryAsyncParams<JournalLibrary, JournalCollectionEntryInit>;

// ============================================================================
// JournalLibrary Class
// ============================================================================

/**
 * A library for managing cooking {@link Entities.Journal.AnyJournalEntryEntity | journal entries}.
 *
 * Journals are organized into user-defined collections (e.g., by person, location, time period).
 * The library provides cross-collection indexing for efficient queries by filling/confection.
 *
 * Provides:
 * - Multi-collection storage with FileTree persistence
 * - Cross-collection lookup by filling ID (all journals for a filling)
 * - Cross-collection lookup by filling variation ID (all journals for a specific filling variation)
 * - Cross-collection lookup by confection ID (all journals for a confection)
 * - Cross-collection lookup by confection variation ID (all journals for a specific confection variation)
 * - Lazy index rebuilding for efficient queries
 *
 * @public
 */
export class JournalLibrary extends SubLibraryBase<JournalId, BaseJournalId, AnyJournalEntryEntity> {
  /**
   * Index from {@link FillingId | filling ID} to {@link JournalId | journal IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byFillingId: Map<FillingId, Set<JournalId>>;

  /**
   * Index from {@link FillingRecipeVariationId | filling recipe variation ID} to {@link JournalId | journal IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byFillingVariationId: Map<FillingRecipeVariationId, Set<JournalId>>;

  /**
   * Index from {@link ConfectionId | confection ID} to {@link JournalId | journal IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byConfectionId: Map<ConfectionId, Set<JournalId>>;

  /**
   * Index from {@link ConfectionRecipeVariationId | confection recipe variation ID} to {@link JournalId | journal IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byConfectionVariationId: Map<ConfectionRecipeVariationId, Set<JournalId>>;

  /**
   * Flag indicating whether indices are valid
   * Set to false when collections change, rebuilt lazily on first query
   */
  private _indicesValid: boolean = false;

  private constructor(params?: IJournalLibraryParams) {
    super({
      itemIdConverter: CommonConverters.baseJournalId,
      itemConverter: anyJournalEntryConverter,
      directoryNavigator: getJournalsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
    });
    this._byFillingId = new Map();
    this._byFillingVariationId = new Map();
    this._byConfectionId = new Map();
    this._byConfectionVariationId = new Map();
  }

  /**
   * Creates a new {@link Entities.Journal.JournalLibrary | JournalLibrary} instance.
   * @param params - Optional {@link Entities.Journal.IJournalLibraryParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IJournalLibraryParams): Result<JournalLibrary> {
    return captureResult(() => {
      const lib = new JournalLibrary(params);
      lib._invalidateIndices();
      return lib;
    });
  }

  /**
   * Creates a JournalLibrary instance asynchronously with encrypted file support.
   * @param params - {@link Entities.Journal.IJournalLibraryAsyncParams | Async creation parameters}
   * @returns Promise resolving to Success with new instance, or Failure
   * @public
   */
  public static async createAsync(params?: IJournalLibraryAsyncParams): Promise<Result<JournalLibrary>> {
    /* c8 ignore next 1 - default fallback to empty params */
    params = params ?? {};
    const logger = Logging.LogReporter.createDefault(params.logger).orThrow();
    const createParams: ISubLibraryCreateParams<JournalLibrary, BaseJournalId, AnyJournalEntryEntity> = {
      itemIdConverter: CommonConverters.baseJournalId,
      itemConverter: anyJournalEntryConverter,
      directoryNavigator: getJournalsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params,
      logger
    };

    const loadResult = (await SubLibraryBase.loadAllCollectionsAsync(createParams)).report(logger);
    return loadResult.onSuccess((loaded) =>
      JournalLibrary.create({
        ...params,
        builtin: false,
        fileSources: undefined,
        collections: loaded.collections,
        protectedCollections: loaded.protectedCollections
      })
    );
  }

  // ============================================================================
  // Index Management
  // ============================================================================

  /**
   * Invalidates indices - they will be rebuilt lazily on next query
   */
  private _invalidateIndices(): void {
    this._indicesValid = false;
  }

  /**
   * Ensures indices are valid, rebuilding if necessary
   */
  private _ensureIndicesValid(): void {
    if (this._indicesValid) return;

    this._byFillingId.clear();
    this._byFillingVariationId.clear();
    this._byConfectionId.clear();
    this._byConfectionVariationId.clear();

    // Rebuild from all items across all collections
    // Iterate over entries to get both composite ID (key) and journal (value)
    for (const [journalId, journal] of this.entries()) {
      this._addToIndices(journalId, journal);
    }

    this._indicesValid = true;
  }

  /**
   * Adds a journal to the appropriate indices based on its type
   */
  private _addToIndices(journalId: JournalId, journal: AnyJournalEntryEntity): void {
    if (isFillingJournalEntry(journal)) {
      this._addFillingJournalToIndices(journalId, journal);
    } else if (isConfectionJournalEntry(journal)) {
      this._addConfectionJournalToIndices(journalId, journal);
    }
  }

  /**
   * Adds a filling journal to the filling-specific indices
   */
  private _addFillingJournalToIndices(journalId: JournalId, journal: AnyFillingJournalEntry): void {
    const fillingId = this._extractFillingId(journal.variationId);

    let fillingJournals = this._byFillingId.get(fillingId);
    if (!fillingJournals) {
      fillingJournals = new Set();
      this._byFillingId.set(fillingId, fillingJournals);
    }
    fillingJournals.add(journalId);

    let variationJournals = this._byFillingVariationId.get(journal.variationId);
    if (!variationJournals) {
      variationJournals = new Set();
      this._byFillingVariationId.set(journal.variationId, variationJournals);
    }
    variationJournals.add(journalId);
  }

  /**
   * Adds a confection journal to the confection-specific indices
   */
  private _addConfectionJournalToIndices(journalId: JournalId, journal: AnyConfectionJournalEntry): void {
    const confectionId = this._extractConfectionId(journal.variationId);

    let confectionJournals = this._byConfectionId.get(confectionId);
    if (!confectionJournals) {
      confectionJournals = new Set();
      this._byConfectionId.set(confectionId, confectionJournals);
    }
    confectionJournals.add(journalId);

    let variationJournals = this._byConfectionVariationId.get(journal.variationId);
    if (!variationJournals) {
      variationJournals = new Set();
      this._byConfectionVariationId.set(journal.variationId, variationJournals);
    }
    variationJournals.add(journalId);
  }

  /**
   * Extracts the {@link FillingId | FillingId} from a {@link FillingRecipeVariationId | FillingRecipeVariationId}
   */
  private _extractFillingId(variationId: FillingRecipeVariationId): FillingId {
    return CommonConverters.parsedFillingRecipeVariationId.convert(variationId).orThrow().collectionId;
  }

  /**
   * Extracts the {@link ConfectionId | ConfectionId} from a {@link ConfectionRecipeVariationId | ConfectionRecipeVariationId}
   */
  private _extractConfectionId(variationId: ConfectionRecipeVariationId): ConfectionId {
    return CommonConverters.parsedConfectionRecipeVariationId.convert(variationId).orThrow().collectionId;
  }

  // ============================================================================
  // Query Methods (Cross-Collection)
  // ============================================================================

  /**
   * Gets all filling journal entries for a filling (across all variations and collections)
   * @param fillingId - The {@link FillingId | filling ID} to search for
   * @returns Array of filling journal entries (empty if none found)
   * @public
   */
  public getJournalsForFilling(fillingId: FillingId): ReadonlyArray<AnyFillingJournalEntry> {
    this._ensureIndicesValid();
    const journalIds = this._byFillingId.get(fillingId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this.get(id).value)
      .filter((j): j is AnyFillingJournalEntry => j !== undefined && isFillingJournalEntry(j));
  }

  /**
   * Gets all filling journal entries for a specific filling variation (across all collections)
   * @param variationId - The {@link FillingRecipeVariationId | filling recipe variation ID} to search for
   * @returns Array of filling journal entries (empty if none found)
   * @public
   */
  public getJournalsForFillingVariation(
    variationId: FillingRecipeVariationId
  ): ReadonlyArray<AnyFillingJournalEntry> {
    this._ensureIndicesValid();
    const journalIds = this._byFillingVariationId.get(variationId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this.get(id).value)
      .filter((j): j is AnyFillingJournalEntry => j !== undefined && isFillingJournalEntry(j));
  }

  /**
   * Gets all confection journal entries for a confection (across all variations and collections)
   * @param confectionId - The {@link ConfectionId | confection ID} to search for
   * @returns Array of confection journal entries (empty if none found)
   * @public
   */
  public getJournalsForConfection(confectionId: ConfectionId): ReadonlyArray<AnyConfectionJournalEntry> {
    this._ensureIndicesValid();
    const journalIds = this._byConfectionId.get(confectionId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this.get(id).value)
      .filter((j): j is AnyConfectionJournalEntry => j !== undefined && isConfectionJournalEntry(j));
  }

  /**
   * Gets all confection journal entries for a specific confection variations (across all collections)
   * @param variationId - The {@link ConfectionRecipeVariationId | confection variation ID} to search for
   * @returns Array of confection journal entries (empty if none found)
   * @public
   */
  public getJournalsForConfectionVariation(
    variationId: ConfectionRecipeVariationId
  ): ReadonlyArray<AnyConfectionJournalEntry> {
    this._ensureIndicesValid();
    const journalIds = this._byConfectionVariationId.get(variationId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this.get(id).value)
      .filter((j): j is AnyConfectionJournalEntry => j !== undefined && isConfectionJournalEntry(j));
  }

  /**
   * Gets a journal entry by ID (searches all collections)
   * @param journalId - The journal ID to look up
   * @returns Success with the journal entry, or Failure if not found
   * @public
   */
  public getJournal(journalId: JournalId): Result<AnyJournalEntryEntity> {
    return this.get(journalId);
  }

  /**
   * Gets all journal entries across all collections
   * @returns Array of all journal entries
   * @public
   */
  public getAllJournals(): ReadonlyArray<AnyJournalEntryEntity> {
    return Array.from(this.values());
  }

  /**
   * Checks if a journal with the given ID exists (searches all collections)
   * @param journalId - The journal ID to check
   * @returns `true` if the journal exists
   * @public
   */
  public hasJournal(journalId: JournalId): boolean {
    return this.has(journalId);
  }
}
