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
 * UserLibrary - aggregates user-specific data libraries (journals, future inventory).
 * @packageDocumentation
 */

import { Logging, Result, succeed } from '@fgv/ts-utils';

import { CollectionId } from '../common';
import {
  IngredientInventoryLibrary,
  JournalLibrary,
  MoldInventoryLibrary,
  SessionLibrary
} from '../entities';
import { IFileTreeSource, ILibraryFileTreeSource, normalizeFileSources, SubLibraryId } from '../library-data';
import { IUserLibrary, IUserLibraryCreateParams } from './model';

// ============================================================================
// UserLibrary Class
// ============================================================================

/**
 * Aggregates user-specific data libraries.
 *
 * Unlike ChocolateLibrary (shared data), UserLibrary contains only
 * user/installation-specific data with no built-in collections.
 *
 * @public
 */
export class UserLibrary implements IUserLibrary {
  private readonly _journals: JournalLibrary;
  private readonly _sessions: SessionLibrary;
  private readonly _moldInventory: MoldInventoryLibrary;
  private readonly _ingredientInventory: IngredientInventoryLibrary;

  /**
   * Logger used by this library and its sub-libraries.
   */
  public readonly logger: Logging.LogReporter<unknown>;

  private constructor(
    journals: JournalLibrary,
    sessions: SessionLibrary,
    moldInventory: MoldInventoryLibrary,
    ingredientInventory: IngredientInventoryLibrary,
    logger: Logging.LogReporter<unknown>
  ) {
    this._journals = journals;
    this._sessions = sessions;
    this._moldInventory = moldInventory;
    this._ingredientInventory = ingredientInventory;
    this.logger = logger;
  }

  /**
   * Creates a new {@link UserLibrary.UserLibrary | UserLibrary} instance.
   * @param params - Optional {@link UserLibrary.IUserLibraryCreateParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IUserLibraryCreateParams): Result<UserLibrary> {
    params = params ?? {};
    const fileSources = normalizeFileSources(params.fileSources);
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params.logger ?? new Logging.NoOpLogger();
    const logReporter = new Logging.LogReporter({ logger });

    // Create journals library (no built-in data for user libraries)
    // User data typically starts empty, so we handle missing/empty sources gracefully
    const journalSources = UserLibrary._toFileSources(fileSources, 'journals');
    const journalsResult = JournalLibrary.create({
      builtin: false,
      fileSources: journalSources.length > 0 ? journalSources : undefined,
      mergeLibraries: params.libraries?.journals,
      logger: logReporter
    });

    // Create sessions library
    const sessionSources = UserLibrary._toFileSources(fileSources, 'sessions');
    const sessionsResult = SessionLibrary.create({
      builtin: false,
      fileSources: sessionSources.length > 0 ? sessionSources : undefined,
      mergeLibraries: params.libraries?.sessions,
      logger: logReporter
    });

    // Create mold inventory library
    const moldInventorySources = UserLibrary._toFileSources(fileSources, 'moldInventory');
    const moldInventoryResult = MoldInventoryLibrary.create({
      builtin: false,
      fileSources: moldInventorySources.length > 0 ? moldInventorySources : undefined,
      mergeLibraries: params.libraries?.moldInventory,
      logger: logReporter
    });

    // Create ingredient inventory library
    const ingredientInventorySources = UserLibrary._toFileSources(fileSources, 'ingredientInventory');
    const ingredientInventoryResult = IngredientInventoryLibrary.create({
      builtin: false,
      fileSources: ingredientInventorySources.length > 0 ? ingredientInventorySources : undefined,
      mergeLibraries: params.libraries?.ingredientInventory,
      logger: logReporter
    });

    return journalsResult.onSuccess((journals) => {
      return sessionsResult.onSuccess((sessions) => {
        return moldInventoryResult.onSuccess((moldInventory) => {
          return ingredientInventoryResult.onSuccess((ingredientInventory) => {
            return succeed(
              new UserLibrary(journals, sessions, moldInventory, ingredientInventory, logReporter)
            );
          });
        });
      });
    });
  }

  /**
   * Converts generic file sources to sub-library specific sources.
   * User libraries have no built-in data, so we just map the directory and mutable flag.
   * @param sources - Generic file tree sources
   * @param subLibraryId - The sub-library to extract sources for (unused for user libraries)
   * @returns Array of sub-library specific sources
   * @internal
   */
  private static _toFileSources(
    sources: ReadonlyArray<ILibraryFileTreeSource>,
    subLibraryId: SubLibraryId
  ): ReadonlyArray<IFileTreeSource<CollectionId>> {
    // User libraries have no built-in data, so we ignore the subLibraryId
    // and just map directory/mutable from the source
    return sources.map((source) => ({
      directory: source.directory,
      load: false, // No built-in data for user libraries
      mutable: source.mutable
    }));
  }

  // ============================================================================
  // Sub-Library Access (IUserLibrary)
  // ============================================================================

  /**
   * {@inheritDoc UserLibrary.IUserLibrary.journals}
   */
  public get journals(): JournalLibrary {
    return this._journals;
  }

  /**
   * {@inheritDoc UserLibrary.IUserLibrary.sessions}
   */
  public get sessions(): SessionLibrary {
    return this._sessions;
  }

  /**
   * {@inheritDoc UserLibrary.IUserLibrary.moldInventory}
   */
  public get moldInventory(): MoldInventoryLibrary {
    return this._moldInventory;
  }

  /**
   * {@inheritDoc UserLibrary.IUserLibrary.ingredientInventory}
   */
  public get ingredientInventory(): IngredientInventoryLibrary {
    return this._ingredientInventory;
  }
}
