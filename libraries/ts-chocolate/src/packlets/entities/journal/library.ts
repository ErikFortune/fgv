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
 * Journal library for managing cooking session records
 * @packageDocumentation
 */

import { captureResult, Failure, Logging, mapResults, Result, Success } from '@fgv/ts-utils';

import {
  ConfectionId,
  ConfectionVersionId,
  FillingId,
  FillingVersionId,
  JournalId,
  Converters as CommonConverters
} from '../../common';
import {
  AnyJournalRecord,
  IConfectionJournalRecord,
  IFillingRecipeJournalRecord,
  isConfectionJournalRecord,
  isFillingRecipeJournalRecord
} from './model';
import { anyJournalRecord as anyJournalRecordConverter } from './converters';

/**
 * Result of importing journals into the library
 * @public
 */
export interface IJournalImportResult {
  /**
   * Number of journals successfully imported
   */
  readonly imported: number;
  /**
   * Number of journals that were skipped (already exist)
   */
  readonly skipped: number;
  /**
   * IDs of journals that were skipped
   */
  readonly skippedIds: ReadonlyArray<JournalId>;
}

/**
 * Parameters for creating a {@link Entities.Journal.JournalLibrary | JournalLibrary} instance
 * @public
 */
export interface IJournalLibraryParams {
  /**
   * Initial journal records to populate the library with.
   * Accepts both recipe and confection journal records.
   */
  readonly journals?: ReadonlyArray<AnyJournalRecord>;

  /**
   * Optional logger for reporting operations
   */
  readonly logger?: Logging.LogReporter<unknown>;
}

/**
 * A library for managing cooking {@link Entities.Journal.AnyJournalRecord | journal records}.
 *
 * Provides:
 * - Storage for journal records indexed by {@link JournalId | JournalId}
 * - Lookup by recipe ID (all journals for a recipe)
 * - Lookup by recipe version ID (all journals for a specific recipe version)
 * - Lookup by confection ID (all journals for a confection)
 * - Lookup by confection version ID (all journals for a specific confection version)
 * - Add/retrieve journal records
 *
 * @public
 */
export class JournalLibrary {
  /**
   * Map of {@link Entities.Journal.AnyJournalRecord | journal records} by {@link JournalId | JournalId}
   */
  private readonly _journals: Map<JournalId, AnyJournalRecord>;

  /**
   * Index from {@link FillingId | filling ID} to {@link JournalId | journal IDs}
   */
  private readonly _byFillingId: Map<FillingId, Set<JournalId>>;

  /**
   * Index from {@link FillingVersionId | filling version ID} to {@link JournalId | journal IDs}
   */
  private readonly _byFillingVersionId: Map<FillingVersionId, Set<JournalId>>;

  /**
   * Index from {@link ConfectionId | confection ID} to {@link JournalId | journal IDs}
   */
  private readonly _byConfectionId: Map<ConfectionId, Set<JournalId>>;

  /**
   * Index from {@link ConfectionVersionId | confection version ID} to {@link JournalId | journal IDs}
   */
  private readonly _byConfectionVersionId: Map<ConfectionVersionId, Set<JournalId>>;

  /**
   * Logger for reporting operations
   */
  private readonly _logger: Logging.LogReporter<unknown>;

  private constructor(params?: IJournalLibraryParams) {
    this._journals = new Map();
    this._byFillingId = new Map();
    this._byFillingVersionId = new Map();
    this._byConfectionId = new Map();
    this._byConfectionVersionId = new Map();
    this._logger = params?.logger ?? Logging.LogReporter.createDefault().orThrow();

    // Add initial journals if provided
    if (params?.journals) {
      for (const journal of params.journals) {
        this._addJournalInternal(journal);
      }
    }
  }

  /**
   * Creates a new {@link Entities.Journal.JournalLibrary | JournalLibrary} instance.
   * @param params - Optional {@link Entities.Journal.IJournalLibraryParams | creation parameters} with initial journals.
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IJournalLibraryParams): Result<JournalLibrary> {
    return captureResult(() => new JournalLibrary(params));
  }

  /**
   * Gets a {@link Entities.Journal.AnyJournalRecord | journal record} by its ID
   * @param journalId - The journal ID to look up
   * @returns `Success` with the journal record, or `Failure` if not found
   * @public
   */
  public getJournal(journalId: JournalId): Result<AnyJournalRecord> {
    const journal = this._journals.get(journalId);
    if (journal === undefined) {
      return Failure.with(`Journal not found: ${journalId}`);
    }
    return Success.with(journal);
  }

  /**
   * Gets all {@link Entities.Journal.IFillingRecipeJournalRecord | filling recipe journal records} for a filling (across all versions)
   * @param fillingId - The {@link FillingId | filling ID} to search for
   * @returns Array of filling recipe journal records (empty if none found)
   * @public
   */
  public getJournalsForFilling(fillingId: FillingId): ReadonlyArray<IFillingRecipeJournalRecord> {
    const journalIds = this._byFillingId.get(fillingId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is IFillingRecipeJournalRecord => j !== undefined && isFillingRecipeJournalRecord(j));
  }

  /**
   * Gets all {@link Entities.Journal.IFillingRecipeJournalRecord | filling recipe journal records} for a specific filling version
   * @param versionId - The {@link FillingVersionId | filling version ID} to search for
   * @returns Array of filling recipe journal records (empty if none found)
   * @public
   */
  public getJournalsForFillingVersion(
    versionId: FillingVersionId
  ): ReadonlyArray<IFillingRecipeJournalRecord> {
    const journalIds = this._byFillingVersionId.get(versionId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is IFillingRecipeJournalRecord => j !== undefined && isFillingRecipeJournalRecord(j));
  }

  /**
   * Gets all {@link Entities.Journal.IConfectionJournalRecord | confection journal records} for a confection (across all versions)
   * @param confectionId - The {@link ConfectionId | confection ID} to search for
   * @returns Array of confection journal records (empty if none found)
   * @public
   */
  public getJournalsForConfection(confectionId: ConfectionId): ReadonlyArray<IConfectionJournalRecord> {
    const journalIds = this._byConfectionId.get(confectionId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is IConfectionJournalRecord => j !== undefined && isConfectionJournalRecord(j));
  }

  /**
   * Gets all {@link Entities.Journal.IConfectionJournalRecord | confection journal records} for a specific confection version
   * @param versionId - The {@link ConfectionVersionId | confection version ID} to search for
   * @returns Array of confection journal records (empty if none found)
   * @public
   */
  public getJournalsForConfectionVersion(
    versionId: ConfectionVersionId
  ): ReadonlyArray<IConfectionJournalRecord> {
    const journalIds = this._byConfectionVersionId.get(versionId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is IConfectionJournalRecord => j !== undefined && isConfectionJournalRecord(j));
  }

  /**
   * Gets all journal records in the library
   * @returns Array of all journal records
   * @public
   */
  public getAllJournals(): ReadonlyArray<AnyJournalRecord> {
    return Array.from(this._journals.values());
  }

  /**
   * Gets the number of journals in the library
   * @public
   */
  public get size(): number {
    return this._journals.size;
  }

  /**
   * Adds a {@link Entities.Journal.AnyJournalRecord | journal record} to the library.
   * Accepts both recipe and confection journal records.
   * @param journal - The journal record to add (validated)
   * @returns `Success` with the JournalId, or `Failure` if journal already exists or invalid
   * @public
   */
  public addJournal(journal: AnyJournalRecord): Result<JournalId> {
    // Validate the journal using the converter - report validation errors (unexpected)
    return anyJournalRecordConverter
      .convert(journal)
      .onSuccess((validated) => {
        if (this._journals.has(validated.journalId)) {
          return Failure.with<JournalId>(`Journal already exists: ${validated.journalId}`);
        }
        this._addJournalInternal(validated);
        return Success.with(validated.journalId);
      })
      .report(this._logger);
  }

  /**
   * Adds a filling recipe journal record to the library.
   * @param journal - The filling recipe journal record to add (validated)
   * @returns `Success` with the JournalId, or `Failure` if journal already exists or invalid
   * @deprecated Use addJournal instead which accepts both filling recipe and confection journals
   * @public
   */
  public addFillingJournal(journal: IFillingRecipeJournalRecord): Result<JournalId> {
    return this.addJournal(journal);
  }

  /**
   * Removes a {@link Entities.Journal.AnyJournalRecord | journal record} from the library
   * @param journalId - The ID of the journal to remove
   * @returns `Success` with the removed journal, or `Failure` if not found
   * @public
   */
  public removeJournal(journalId: JournalId): Result<AnyJournalRecord> {
    const journal = this._journals.get(journalId);
    if (journal === undefined) {
      return Failure.with(`Journal not found: ${journalId}`);
    }

    // Remove from main storage
    this._journals.delete(journalId);

    // Remove from type-specific indices
    if (isFillingRecipeJournalRecord(journal)) {
      this._removeRecipeJournalFromIndices(journal);
    } else if (isConfectionJournalRecord(journal)) {
      this._removeConfectionJournalFromIndices(journal);
    }

    return Success.with(journal);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Internal method to add a journal without validation (used during construction)
   */
  private _addJournalInternal(journal: AnyJournalRecord): void {
    // Add to main storage
    this._journals.set(journal.journalId, journal);

    // Add to type-specific indices
    if (isFillingRecipeJournalRecord(journal)) {
      this._addRecipeJournalToIndices(journal);
    } else if (isConfectionJournalRecord(journal)) {
      this._addConfectionJournalToIndices(journal);
    }
  }

  /**
   * Adds a recipe journal to the recipe-specific indices
   */
  private _addRecipeJournalToIndices(journal: IFillingRecipeJournalRecord): void {
    // Extract recipe ID from version ID for the recipe index
    const recipeId = this._extractFillingId(journal.fillingVersionId);

    // Add to recipe index
    let recipeJournals = this._byFillingId.get(recipeId);
    if (!recipeJournals) {
      recipeJournals = new Set();
      this._byFillingId.set(recipeId, recipeJournals);
    }
    recipeJournals.add(journal.journalId);

    // Add to version index
    let versionJournals = this._byFillingVersionId.get(journal.fillingVersionId);
    if (!versionJournals) {
      versionJournals = new Set();
      this._byFillingVersionId.set(journal.fillingVersionId, versionJournals);
    }
    versionJournals.add(journal.journalId);
  }

  /**
   * Adds a confection journal to the confection-specific indices
   */
  private _addConfectionJournalToIndices(journal: IConfectionJournalRecord): void {
    // Extract confection ID from version ID for the confection index
    const confectionId = this._extractConfectionId(journal.confectionVersionId);

    // Add to confection index
    let confectionJournals = this._byConfectionId.get(confectionId);
    if (!confectionJournals) {
      confectionJournals = new Set();
      this._byConfectionId.set(confectionId, confectionJournals);
    }
    confectionJournals.add(journal.journalId);

    // Add to version index
    let versionJournals = this._byConfectionVersionId.get(journal.confectionVersionId);
    if (!versionJournals) {
      versionJournals = new Set();
      this._byConfectionVersionId.set(journal.confectionVersionId, versionJournals);
    }
    versionJournals.add(journal.journalId);
  }

  /**
   * Removes a recipe journal from the recipe-specific indices
   */
  private _removeRecipeJournalFromIndices(journal: IFillingRecipeJournalRecord): void {
    const recipeId = this._extractFillingId(journal.fillingVersionId);

    // Remove from recipe index
    const recipeJournals = this._byFillingId.get(recipeId);
    if (recipeJournals) {
      recipeJournals.delete(journal.journalId);
      if (recipeJournals.size === 0) {
        this._byFillingId.delete(recipeId);
      }
    }

    // Remove from version index
    const versionJournals = this._byFillingVersionId.get(journal.fillingVersionId);
    if (versionJournals) {
      versionJournals.delete(journal.journalId);
      if (versionJournals.size === 0) {
        this._byFillingVersionId.delete(journal.fillingVersionId);
      }
    }
  }

  /**
   * Removes a confection journal from the confection-specific indices
   */
  private _removeConfectionJournalFromIndices(journal: IConfectionJournalRecord): void {
    const confectionId = this._extractConfectionId(journal.confectionVersionId);

    // Remove from confection index
    const confectionJournals = this._byConfectionId.get(confectionId);
    if (confectionJournals) {
      confectionJournals.delete(journal.journalId);
      if (confectionJournals.size === 0) {
        this._byConfectionId.delete(confectionId);
      }
    }

    // Remove from version index
    const versionJournals = this._byConfectionVersionId.get(journal.confectionVersionId);
    if (versionJournals) {
      versionJournals.delete(journal.journalId);
      if (versionJournals.size === 0) {
        this._byConfectionVersionId.delete(journal.confectionVersionId);
      }
    }
  }

  /**
   * Extracts the FillingId from a FillingVersionId
   * FillingVersionId format: "fillingId\@versionSpec"
   */
  private _extractFillingId(versionId: FillingVersionId): FillingId {
    return CommonConverters.parsedFillingVersionId.convert(versionId).orThrow().collectionId;
  }

  /**
   * Extracts the ConfectionId from a ConfectionVersionId
   * ConfectionVersionId format: "confectionId\@versionSpec"
   */
  private _extractConfectionId(versionId: ConfectionVersionId): ConfectionId {
    return CommonConverters.parsedConfectionVersionId.convert(versionId).orThrow().collectionId;
  }

  // ============================================================================
  // Import/Export Methods
  // ============================================================================

  /**
   * Imports journal records from an array.
   * Validates each journal and adds it to the library.
   * Journals that already exist are skipped.
   * Accepts both recipe and confection journal records.
   *
   * @param journals - Array of journal records to import
   * @returns `Success` with import results, or `Failure` if validation fails
   * @public
   */
  public importJournals(journals: ReadonlyArray<unknown>): Result<IJournalImportResult> {
    // First validate all journals using the discriminated union converter
    return mapResults(journals.map((j) => anyJournalRecordConverter.convert(j)))
      .report(this._logger)
      .onSuccess((validated) => {
        let imported = 0;
        let skipped = 0;
        const skippedIds: JournalId[] = [];

        for (const journal of validated) {
          if (this._journals.has(journal.journalId)) {
            skipped++;
            skippedIds.push(journal.journalId);
          } else {
            this._addJournalInternal(journal);
            imported++;
          }
        }

        // Log import summary
        this._logger.info(`Imported ${imported} journals, skipped ${skipped} duplicates`);

        return Success.with({ imported, skipped, skippedIds });
      });
  }

  /**
   * Exports all journal records as an array.
   * The returned array can be serialized to JSON for persistence.
   *
   * @returns Array of all journal records
   * @public
   */
  public exportJournals(): ReadonlyArray<AnyJournalRecord> {
    return this.getAllJournals();
  }

  /**
   * Checks if a journal with the given ID exists in the library.
   *
   * @param journalId - The journal ID to check
   * @returns `true` if the journal exists
   * @public
   */
  public hasJournal(journalId: JournalId): boolean {
    return this._journals.has(journalId);
  }

  /**
   * Clears all journals from the library.
   * @public
   */
  public clear(): void {
    this._journals.clear();
    this._byFillingId.clear();
    this._byFillingVersionId.clear();
    this._byConfectionId.clear();
    this._byConfectionVersionId.clear();
  }
}
