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
 * Model interfaces for user-specific library data.
 * @packageDocumentation
 */

import { Logging } from '@fgv/ts-utils';

import {
  IngredientInventoryLibrary,
  JournalLibrary,
  MoldInventoryLibrary,
  SessionLibrary
} from '../entities';
import { ILibraryFileTreeSource } from '../library-data';

// ============================================================================
// User Library Interface
// ============================================================================

/**
 * User-specific library data (journals, sessions, inventory).
 * Separate from shared library data (ingredients, recipes, etc.).
 * @public
 */
export interface IUserEntityLibrary {
  /**
   * Journal library for production records.
   */
  readonly journals: JournalLibrary;

  /**
   * Session library for persisted editing sessions.
   */
  readonly sessions: SessionLibrary;

  /**
   * Mold inventory library for tracking owned molds.
   */
  readonly moldInventory: MoldInventoryLibrary;

  /**
   * Ingredient inventory library for tracking ingredient stock.
   */
  readonly ingredientInventory: IngredientInventoryLibrary;
}

// ============================================================================
// Pre-instantiated User Library Sources
// ============================================================================

/**
 * Pre-built user library instances to include in a {@link UserEntities.UserEntityLibrary | UserEntityLibrary}.
 * @public
 */
export interface IInstantiatedUserEntityLibrarySource {
  /**
   * Pre-built journals library
   */
  readonly journals?: JournalLibrary;

  /**
   * Pre-built sessions library
   */
  readonly sessions?: SessionLibrary;

  /**
   * Pre-built mold inventory library
   */
  readonly moldInventory?: MoldInventoryLibrary;

  /**
   * Pre-built ingredient inventory library
   */
  readonly ingredientInventory?: IngredientInventoryLibrary;
}

// ============================================================================
// User Library Creation Parameters
// ============================================================================

/**
 * Parameters for creating a {@link UserEntities.UserEntityLibrary | UserEntityLibrary}.
 *
 * User libraries have no built-in data - all data is user-provided.
 *
 * Sources are processed in order:
 * 1. File tree sources (in array order)
 * 2. Pre-instantiated libraries (merged in)
 *
 * @public
 */
export interface IUserEntityLibraryCreateParams {
  /**
   * File tree sources to load data from.
   */
  readonly fileSources?: ILibraryFileTreeSource | ReadonlyArray<ILibraryFileTreeSource>;

  /**
   * Pre-instantiated library sources.
   */
  readonly libraries?: IInstantiatedUserEntityLibrarySource;

  /**
   * Logger for library operations.
   */
  readonly logger?: Logging.ILogger;
}
