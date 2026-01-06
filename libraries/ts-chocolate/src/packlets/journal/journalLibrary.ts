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

import { captureResult, Failure, Result, Success } from '@fgv/ts-utils';

import { JournalId, RecipeId, RecipeVersionId, Converters as CommonConverters } from '../common';
import { IJournalRecord } from './model';
import { journalRecord as journalRecordConverter } from './converters';

/**
 * Parameters for creating a {@link Journal.JournalLibrary | JournalLibrary} instance
 * @public
 */
export interface IJournalLibraryParams {
  /**
   * Initial journal records to populate the library with
   */
  readonly journals?: ReadonlyArray<IJournalRecord>;
}

/**
 * A library for managing cooking {@link Journal.IJournalRecord | journal records}.
 *
 * Provides:
 * - Storage for journal records indexed by {@link JournalId | JournalId}
 * - Lookup by recipe ID (all journals for a recipe)
 * - Lookup by version ID (all journals for a specific version)
 * - Add/retrieve journal records
 *
 * @public
 */
export class JournalLibrary {
  /**
   * Map of {@link Journal.IJournalRecord | journal records} by {@link JournalId | JournalId}
   */
  private readonly _journals: Map<JournalId, IJournalRecord>;

  /**
   * Index from {@link RecipeId | recipe ID} to {@link JournalId | journal IDs}
   */
  private readonly _byRecipeId: Map<RecipeId, Set<JournalId>>;

  /**
   * Index from {@link RecipeVersionId | recipe version ID} to {@link JournalId | journal IDs}
   */
  private readonly _byVersionId: Map<RecipeVersionId, Set<JournalId>>;

  private constructor(params?: IJournalLibraryParams) {
    this._journals = new Map();
    this._byRecipeId = new Map();
    this._byVersionId = new Map();

    // Add initial journals if provided
    if (params?.journals) {
      for (const journal of params.journals) {
        this._addJournalInternal(journal);
      }
    }
  }

  /**
   * Creates a new {@link Journal.JournalLibrary | JournalLibrary} instance.
   * @param params - Optional {@link Journal.IJournalLibraryParams | creation parameters} with initial journals.
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IJournalLibraryParams): Result<JournalLibrary> {
    return captureResult(() => new JournalLibrary(params));
  }

  /**
   * Gets a {@link Journal.IJournalRecord | journal record} by its ID
   * @param journalId - The journal ID to look up
   * @returns `Success` with the journal record, or `Failure` if not found
   * @public
   */
  public getJournal(journalId: JournalId): Result<IJournalRecord> {
    const journal = this._journals.get(journalId);
    if (journal === undefined) {
      return Failure.with(`Journal not found: ${journalId}`);
    }
    return Success.with(journal);
  }

  /**
   * Gets all {@link Journal.IJournalRecord | journal records} for a recipe (across all versions)
   * @param recipeId - The {@link RecipeId | recipe ID} to search for
   * @returns Array of journal records (empty if none found)
   * @public
   */
  public getJournalsForRecipe(recipeId: RecipeId): ReadonlyArray<IJournalRecord> {
    const journalIds = this._byRecipeId.get(recipeId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is IJournalRecord => j !== undefined);
  }

  /**
   * Gets all {@link Journal.IJournalRecord | journal records} for a specific recipe version
   * @param versionId - The {@link RecipeVersionId | recipe version ID} to search for
   * @returns Array of journal records (empty if none found)
   * @public
   */
  public getJournalsForVersion(versionId: RecipeVersionId): ReadonlyArray<IJournalRecord> {
    const journalIds = this._byVersionId.get(versionId);
    if (!journalIds) {
      return [];
    }
    return Array.from(journalIds)
      .map((id) => this._journals.get(id))
      .filter((j): j is IJournalRecord => j !== undefined);
  }

  /**
   * Gets all journal records in the library
   * @returns Array of all journal records
   * @public
   */
  public getAllJournals(): ReadonlyArray<IJournalRecord> {
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
   * Adds a {@link Journal.IJournalRecord | journal record} to the library
   * @param journal - The journal record to add (validated)
   * @returns `Success` with the JournalId, or `Failure` if journal already exists or invalid
   * @public
   */
  public addJournal(journal: IJournalRecord): Result<JournalId> {
    // Validate the journal using the converter
    return journalRecordConverter.convert(journal).onSuccess((validated) => {
      if (this._journals.has(validated.journalId)) {
        return Failure.with(`Journal already exists: ${validated.journalId}`);
      }
      this._addJournalInternal(validated);
      return Success.with(validated.journalId);
    });
  }

  /**
   * Removes a {@link Journal.IJournalRecord | journal record} from the library
   * @param journalId - The ID of the journal to remove
   * @returns `Success` with the removed journal, or `Failure` if not found
   * @public
   */
  public removeJournal(journalId: JournalId): Result<IJournalRecord> {
    const journal = this._journals.get(journalId);
    if (journal === undefined) {
      return Failure.with(`Journal not found: ${journalId}`);
    }

    // Remove from main storage
    this._journals.delete(journalId);

    // Remove from recipe index
    const recipeId = this._extractRecipeId(journal.recipeVersionId);
    const recipeJournals = this._byRecipeId.get(recipeId);
    if (recipeJournals) {
      recipeJournals.delete(journalId);
      if (recipeJournals.size === 0) {
        this._byRecipeId.delete(recipeId);
      }
    }

    // Remove from version index
    const versionJournals = this._byVersionId.get(journal.recipeVersionId);
    if (versionJournals) {
      versionJournals.delete(journalId);
      if (versionJournals.size === 0) {
        this._byVersionId.delete(journal.recipeVersionId);
      }
    }

    return Success.with(journal);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Internal method to add a journal without validation (used during construction)
   */
  private _addJournalInternal(journal: IJournalRecord): void {
    // Add to main storage
    this._journals.set(journal.journalId, journal);

    // Extract recipe ID from version ID for the recipe index
    const recipeId = this._extractRecipeId(journal.recipeVersionId);

    // Add to recipe index
    let recipeJournals = this._byRecipeId.get(recipeId);
    if (!recipeJournals) {
      recipeJournals = new Set();
      this._byRecipeId.set(recipeId, recipeJournals);
    }
    recipeJournals.add(journal.journalId);

    // Add to version index
    let versionJournals = this._byVersionId.get(journal.recipeVersionId);
    if (!versionJournals) {
      versionJournals = new Set();
      this._byVersionId.set(journal.recipeVersionId, versionJournals);
    }
    versionJournals.add(journal.journalId);
  }

  /**
   * Extracts the RecipeId from a RecipeVersionId
   * RecipeVersionId format: "recipeId\@versionSpec"
   */
  private _extractRecipeId(versionId: RecipeVersionId): RecipeId {
    return CommonConverters.parsedRecipeVersionId.convert(versionId).orThrow().collectionId;
  }
}
