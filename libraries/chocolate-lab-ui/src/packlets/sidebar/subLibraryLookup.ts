/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Shared sub-library lookup utilities for mapping tabs to entity sub-libraries.
 *
 * Provides a single source of truth for resolving the entity sub-library
 * and file-tree path for any application tab, including both shared library
 * tabs (ingredients, fillings, etc.) and user library tabs (sessions, journals, etc.).
 *
 * @packageDocumentation
 */

import { LibraryData, type LibraryRuntime, type UserEntities } from '@fgv/ts-chocolate';

import type { AppTab } from '../navigation';

// ============================================================================
// Sub-Library Lookup
// ============================================================================

/**
 * Returns the entity-layer sub-library for a given tab.
 *
 * Handles both shared library tabs (ingredients, fillings, confections, etc.)
 * and user library tabs (sessions, journals, inventory). Returns `undefined`
 * only for tabs that genuinely have no sub-library (e.g., settings).
 *
 * @param entities - The shared chocolate entity library
 * @param userEntities - The user entity library
 * @param tab - The active application tab
 * @returns The sub-library for the tab, or `undefined` for settings
 * @public
 */
export function getSubLibraryForTab(
  entities: LibraryRuntime.ChocolateEntityLibrary,
  userEntities: UserEntities.IUserEntityLibrary,
  tab: AppTab
): LibraryData.SubLibraryBase<string, string, unknown> | undefined {
  switch (tab) {
    // Shared library tabs
    case 'ingredients':
      return entities.ingredients;
    case 'fillings':
      return entities.fillings;
    case 'confections':
      return entities.confections;
    case 'decorations':
      return entities.decorations;
    case 'molds':
      return entities.molds;
    case 'procedures':
      return entities.procedures;
    case 'tasks':
      return entities.tasks;
    // User library tabs
    case 'sessions':
      return userEntities.sessions;
    case 'journal':
      return userEntities.journals;
    case 'mold-inventory':
      return userEntities.moldInventory;
    case 'ingredient-inventory':
      return userEntities.ingredientInventory;
    case 'locations':
      return userEntities.locations;
    // No sub-library
    case 'settings':
      return undefined;
  }
}

// ============================================================================
// Sub-Library Path Lookup
// ============================================================================

/**
 * Maps a tab name to the sub-library path within a library file tree.
 *
 * Used by collection actions that need to navigate file trees
 * (e.g., add directory, open from file).
 *
 * @param tab - The active application tab
 * @returns The file-tree path for the tab's sub-library, or `undefined` for settings
 * @public
 */
export function getSubLibraryPathForTab(tab: AppTab): string | undefined {
  switch (tab) {
    // Shared library tabs
    case 'ingredients':
      return LibraryData.LibraryPaths.ingredients;
    case 'fillings':
      return LibraryData.LibraryPaths.fillings;
    case 'confections':
      return LibraryData.LibraryPaths.confections;
    case 'decorations':
      return LibraryData.LibraryPaths.decorations;
    case 'molds':
      return LibraryData.LibraryPaths.molds;
    case 'procedures':
      return LibraryData.LibraryPaths.procedures;
    case 'tasks':
      return LibraryData.LibraryPaths.tasks;
    // User library tabs
    case 'sessions':
      return LibraryData.LibraryPaths.sessions;
    case 'journal':
      return LibraryData.LibraryPaths.journals;
    case 'mold-inventory':
      return LibraryData.LibraryPaths.moldInventory;
    case 'ingredient-inventory':
      return LibraryData.LibraryPaths.ingredientInventory;
    case 'locations':
      return LibraryData.LibraryPaths.locations;
    // No path
    case 'settings':
      return undefined;
  }
}
