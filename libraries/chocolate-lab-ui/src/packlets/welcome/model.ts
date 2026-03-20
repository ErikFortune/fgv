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
 * Types and interfaces for the welcome/setup screen.
 * @packageDocumentation
 */

import type { LibraryData, Settings } from '@fgv/ts-chocolate';

// ============================================================================
// Cold Start Context
// ============================================================================

/**
 * Server-provided context captured during cold start detection.
 * Passed from the boot flow to the welcome screen so it can write
 * the correct bootstrap and preferences settings on completion.
 * @public
 */
export interface IColdStartContext {
  readonly serverConfig: {
    readonly cloudStorage?: {
      readonly enabled: boolean;
      readonly baseUrl: string;
      readonly userId?: string;
    };
    readonly proxyAvailable?: boolean;
    readonly keystoreInCloud?: boolean;
    readonly error?: string;
  };
  readonly defaultCloudStorage:
    | { readonly enabled: boolean; readonly baseUrl: string; readonly userId?: string }
    | undefined;
}

// ============================================================================
// Setup Choice
// ============================================================================

/**
 * The user's choice on the welcome screen.
 * @public
 */
export type SetupChoice = 'restore' | 'setup-new' | 'skip';

// ============================================================================
// Setup New Configuration
// ============================================================================

/**
 * Configuration for a single default collection to create.
 * @public
 */
export interface IDefaultCollectionConfig {
  readonly subLibraryId: LibraryData.SubLibraryId;
  readonly name: string;
  readonly enabled: boolean;
}

// ============================================================================
// Sub-Library Labels
// ============================================================================

/**
 * Human-readable labels for each sub-library, used for default collection names.
 * @public
 */
export const SUB_LIBRARY_LABELS: Readonly<Record<LibraryData.SubLibraryId, string>> = {
  ingredients: 'Ingredients',
  fillings: 'Fillings',
  confections: 'Confections',
  decorations: 'Decorations',
  molds: 'Molds',
  procedures: 'Procedures',
  tasks: 'Tasks',
  sessions: 'Sessions',
  journals: 'Journal',
  moldInventory: 'Mold Inventory',
  ingredientInventory: 'Ingredient Inventory',
  locations: 'Locations'
};

/**
 * Mapping from SubLibraryId to the IDefaultCollectionTargets key.
 * Most are identity mappings but 'journals' maps to 'journals' in the targets.
 * @public
 */
export const SUB_LIBRARY_TO_TARGET_KEY: Readonly<
  Record<LibraryData.SubLibraryId, keyof Settings.IDefaultCollectionTargets>
> = {
  ingredients: 'ingredients',
  fillings: 'fillings',
  confections: 'confections',
  decorations: 'decorations',
  molds: 'molds',
  procedures: 'procedures',
  tasks: 'tasks',
  sessions: 'sessions',
  journals: 'journals',
  moldInventory: 'moldInventory',
  ingredientInventory: 'ingredientInventory',
  locations: 'locations'
};
