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
  AnyJournalEntry,
  IConfectionEditJournalEntry,
  IConfectionProductionJournalEntry,
  IFillingEditJournalEntry,
  IFillingProductionJournalEntry,
  isConfectionEditJournalEntry,
  isConfectionProductionJournalEntry,
  isFillingEditJournalEntry,
  isFillingProductionJournalEntry
} from './model';
import { anyJournalEntry as anyJournalEntryConverter } from './converters';

/**
 * Union type for filling journal entries (edit or production)
 * @public
 */
export type AnyFillingJournalEntry = IFillingEditJournalEntry | IFillingProductionJournalEntry;

/**
 * Union type for confection journal entries (edit or production)
 * @public
 */
export type AnyConfectionJournalEntry = IConfectionEditJournalEntry | IConfectionProductionJournalEntry;

/**
 * Type guard for filling journal entries
 * @param entry - Journal entry to check
 * @returns True if the entry is a filling journal entry (edit or production)
 * @public
 */
export function isFillingJournalEntry(entry: AnyJournalEntry): entry is AnyFillingJournalEntry {
  return isFillingEditJournalEntry(entry) || isFillingProductionJournalEntry(entry);
}

/**
 * Type guard for confection journal entries
 * @param entry - Journal entry to check
 * @returns True if the entry is a confection journal entry (edit or production)
 * @public
 */
export function isConfectionJournalEntry(entry: AnyJournalEntry): entry is AnyConfectionJournalEntry {
  return isConfectionEditJournalEntry(entry) || isConfectionProductionJournalEntry(entry);
}

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
   * Initial journal entries to populate the library with.
   * Accepts filling and confection journal entries (both edit and production types).
   */
  readonly journals?: ReadonlyArray<AnyJournalEntry>;

  /**
   * Optional logger for reporting operations
   */
  readonly logger?: Logging.LogReporter<unknown>;
}

/**
 * A library for managing cooking {@link Entities.Journal.AnyJournalEntry | journal entries}.
 *
 * Provides:
 * - Storage for journal entries indexed by {@link JournalId | JournalId}
 * - Lookup by filling ID (all journals for a filling)
 * - Lookup by filling version ID (all journals for a specific filling version)
 * - Lookup by confection ID (all journals for a confection)
 * - Lookup by confection version ID (all journals for a specific confection version)
 * - Add/retrieve journal entries
 *
 * @public
 */
export class JournalLibrary {
  /**
   * Map of {@link Entities.Journal.AnyJournalEntry | journal entries} by {@link JournalId | JournalId}
   */
  private readonly _journals: Map<JournalId, AnyJournalEntry>;

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
   * Gets a {@link Entities.Journal.AnyJournalEntry | journal entry} by its ID
   * @param journalId - The journal ID to look up
   * @returns `Success` with the journal entry, or `Failure` if not found
   * @public
   */
  public getJournal(journalId: JournalId): Result<AnyJournalEntry> {
    const journal = this._journals.get(journalId);
    if (journal === undefined) {
      return Failure.with(`Journal not found: ${journalId}`);
    }
    return Success.with(journal);
  }

  /**
   * Gets all filling journal entries for a filling (across all versions)
   * @param fillingId - The {@link FillingId | filling ID} to search for
   * @returns Array of filling journal entries (empty if none found)
   * @public
   */
  public getJournalsForFilling(fillingId: FillingId): ReadonlyArray<AnyFillingJournalEntry> {
    const journalIds = this._byFillingId.get(fillingId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is AnyFillingJournalEntry => j !== undefined && isFillingJournalEntry(j));
  }

  /**
   * Gets all filling journal entries for a specific filling version
   * @param versionId - The {@link FillingVersionId | filling version ID} to search for
   * @returns Array of filling journal entries (empty if none found)
   * @public
   */
  public getJournalsForFillingVersion(versionId: FillingVersionId): ReadonlyArray<AnyFillingJournalEntry> {
    const journalIds = this._byFillingVersionId.get(versionId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is AnyFillingJournalEntry => j !== undefined && isFillingJournalEntry(j));
  }

  /**
   * Gets all confection journal entries for a confection (across all versions)
   * @param confectionId - The {@link ConfectionId | confection ID} to search for
   * @returns Array of confection journal entries (empty if none found)
   * @public
   */
  public getJournalsForConfection(confectionId: ConfectionId): ReadonlyArray<AnyConfectionJournalEntry> {
    const journalIds = this._byConfectionId.get(confectionId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is AnyConfectionJournalEntry => j !== undefined && isConfectionJournalEntry(j));
  }

  /**
   * Gets all confection journal entries for a specific confection version
   * @param versionId - The {@link ConfectionVersionId | confection version ID} to search for
   * @returns Array of confection journal entries (empty if none found)
   * @public
   */
  public getJournalsForConfectionVersion(
    versionId: ConfectionVersionId
  ): ReadonlyArray<AnyConfectionJournalEntry> {
    const journalIds = this._byConfectionVersionId.get(versionId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is AnyConfectionJournalEntry => j !== undefined && isConfectionJournalEntry(j));
  }

  /**
   * Gets all journal entries in the library
   * @returns Array of all journal entries
   * @public
   */
  public getAllJournals(): ReadonlyArray<AnyJournalEntry> {
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
   * Adds a {@link Entities.Journal.AnyJournalEntry | journal entry} to the library.
   * Accepts filling and confection journal entries (both edit and production types).
   * @param journal - The journal entry to add (validated)
   * @returns `Success` with the JournalId, or `Failure` if journal already exists or invalid
   * @public
   */
  public addJournal(journal: AnyJournalEntry): Result<JournalId> {
    // Validate the journal using the converter - report validation errors (unexpected)
    return anyJournalEntryConverter
      .convert(journal)
      .onSuccess((validated) => {
        if (this._journals.has(validated.id)) {
          return Failure.with<JournalId>(`Journal already exists: ${validated.id}`);
        }
        this._addJournalInternal(validated);
        return Success.with(validated.id);
      })
      .report(this._logger);
  }

  /**
   * Removes a {@link Entities.Journal.AnyJournalEntry | journal entry} from the library
   * @param journalId - The ID of the journal to remove
   * @returns `Success` with the removed journal, or `Failure` if not found
   * @public
   */
  public removeJournal(journalId: JournalId): Result<AnyJournalEntry> {
    const journal = this._journals.get(journalId);
    if (journal === undefined) {
      return Failure.with(`Journal not found: ${journalId}`);
    }

    // Remove from main storage
    this._journals.delete(journalId);

    // Remove from type-specific indices
    if (isFillingJournalEntry(journal)) {
      this._removeFillingJournalFromIndices(journal);
    } else if (isConfectionJournalEntry(journal)) {
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
  private _addJournalInternal(journal: AnyJournalEntry): void {
    // Add to main storage
    this._journals.set(journal.id, journal);

    // Add to type-specific indices
    if (isFillingJournalEntry(journal)) {
      this._addFillingJournalToIndices(journal);
    } else if (isConfectionJournalEntry(journal)) {
      this._addConfectionJournalToIndices(journal);
    }
  }

  /**
   * Adds a filling journal to the filling-specific indices
   */
  private _addFillingJournalToIndices(journal: AnyFillingJournalEntry): void {
    // Extract filling ID from version ID for the filling index
    const fillingId = this._extractFillingId(journal.versionId);

    // Add to filling index
    let fillingJournals = this._byFillingId.get(fillingId);
    if (!fillingJournals) {
      fillingJournals = new Set();
      this._byFillingId.set(fillingId, fillingJournals);
    }
    fillingJournals.add(journal.id);

    // Add to version index
    let versionJournals = this._byFillingVersionId.get(journal.versionId);
    if (!versionJournals) {
      versionJournals = new Set();
      this._byFillingVersionId.set(journal.versionId, versionJournals);
    }
    versionJournals.add(journal.id);
  }

  /**
   * Adds a confection journal to the confection-specific indices
   */
  private _addConfectionJournalToIndices(journal: AnyConfectionJournalEntry): void {
    // Extract confection ID from version ID for the confection index
    const confectionId = this._extractConfectionId(journal.versionId);

    // Add to confection index
    let confectionJournals = this._byConfectionId.get(confectionId);
    if (!confectionJournals) {
      confectionJournals = new Set();
      this._byConfectionId.set(confectionId, confectionJournals);
    }
    confectionJournals.add(journal.id);

    // Add to version index
    let versionJournals = this._byConfectionVersionId.get(journal.versionId);
    if (!versionJournals) {
      versionJournals = new Set();
      this._byConfectionVersionId.set(journal.versionId, versionJournals);
    }
    versionJournals.add(journal.id);
  }

  /**
   * Removes a filling journal from the filling-specific indices
   */
  private _removeFillingJournalFromIndices(journal: AnyFillingJournalEntry): void {
    const fillingId = this._extractFillingId(journal.versionId);

    // Remove from filling index
    const fillingJournals = this._byFillingId.get(fillingId);
    if (fillingJournals) {
      fillingJournals.delete(journal.id);
      if (fillingJournals.size === 0) {
        this._byFillingId.delete(fillingId);
      }
    }

    // Remove from version index
    const versionJournals = this._byFillingVersionId.get(journal.versionId);
    if (versionJournals) {
      versionJournals.delete(journal.id);
      if (versionJournals.size === 0) {
        this._byFillingVersionId.delete(journal.versionId);
      }
    }
  }

  /**
   * Removes a confection journal from the confection-specific indices
   */
  private _removeConfectionJournalFromIndices(journal: AnyConfectionJournalEntry): void {
    const confectionId = this._extractConfectionId(journal.versionId);

    // Remove from confection index
    const confectionJournals = this._byConfectionId.get(confectionId);
    if (confectionJournals) {
      confectionJournals.delete(journal.id);
      if (confectionJournals.size === 0) {
        this._byConfectionId.delete(confectionId);
      }
    }

    // Remove from version index
    const versionJournals = this._byConfectionVersionId.get(journal.versionId);
    if (versionJournals) {
      versionJournals.delete(journal.id);
      if (versionJournals.size === 0) {
        this._byConfectionVersionId.delete(journal.versionId);
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
   * Imports journal entries from an array.
   * Validates each journal and adds it to the library.
   * Journals that already exist are skipped.
   * Accepts filling and confection journal entries (both edit and production types).
   *
   * @param journals - Array of journal entries to import
   * @returns `Success` with import results, or `Failure` if validation fails
   * @public
   */
  public importJournals(journals: ReadonlyArray<unknown>): Result<IJournalImportResult> {
    // First validate all journals using the discriminated union converter
    return mapResults(journals.map((j) => anyJournalEntryConverter.convert(j)))
      .report(this._logger)
      .onSuccess((validated) => {
        let imported = 0;
        let skipped = 0;
        const skippedIds: JournalId[] = [];

        for (const journal of validated) {
          if (this._journals.has(journal.id)) {
            skipped++;
            skippedIds.push(journal.id);
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
   * Exports all journal entries as an array.
   * The returned array can be serialized to JSON for persistence.
   *
   * @returns Array of all journal entries
   * @public
   */
  public exportJournals(): ReadonlyArray<AnyJournalEntry> {
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
