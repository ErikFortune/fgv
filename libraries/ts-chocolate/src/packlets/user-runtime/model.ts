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
 * Model interfaces for user library runtime materialization.
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import {
  BaseJournalId,
  CollectionId,
  ConfectionRecipeVariationId,
  FillingRecipeVariationId,
  JournalId,
  SessionId,
  Model as CommonModel
} from '../common';
import {
  AnyJournalEntryEntity,
  AnySessionEntity,
  IConfectionEditJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  IFillingEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  IFillingSessionEntity,
  IIngredientInventoryEntryEntity,
  IMoldInventoryEntryEntity,
  Inventory,
  PersistedSessionStatus
} from '../entities';
import {
  IConfectionBase,
  IConfectionRecipeVariationBase,
  IFillingRecipe,
  IFillingRecipeVariation,
  IIngredient,
  IMold,
  MaterializedLibrary
} from '../library-runtime';
import { Session } from '../runtime';

// ============================================================================
// Materialized Session Types
// ============================================================================

/**
 * Union type for any materialized editing session.
 * @public
 */
export type AnyMaterializedSession = Session.EditingSession | Session.AnyConfectionEditingSession;

/**
 * Options for creating a new persisted filling session.
 * @public
 */
export interface ICreateFillingSessionOptions {
  /** Target collection for the persisted session */
  readonly collectionId: CollectionId;
  /** Initial session status (default: 'active') */
  readonly status?: PersistedSessionStatus;
  /** Optional user-provided label */
  readonly label?: string;
}

// ============================================================================
// Materialized Journal Entry Types
// ============================================================================

/**
 * Base interface for materialized journal entries with resolved references.
 * @typeParam TRecipe - The recipe/confection interface type
 * @typeParam TVariation - The variation interface type
 * @typeParam TVariationId - The variation ID type
 * @typeParam TEntity - The specific journal entry entity type
 * @public
 */
export interface IJournalEntryBase<
  TRecipe,
  TVariation,
  TVariationId,
  TEntity extends AnyJournalEntryEntity = AnyJournalEntryEntity
> {
  /** Composite journal entry ID (collectionId.baseId) */
  readonly id: JournalId;
  /** Base identifier within collection (no collection prefix) */
  readonly baseId: BaseJournalId;
  /** Timestamp when this entry was created (ISO 8601 format) */
  readonly timestamp: string;
  /** Source variation ID for indexing and lookup */
  readonly variationId: TVariationId;
  /** Resolved source recipe/confection */
  readonly recipe: TRecipe;
  /** Resolved source variation */
  readonly variation: TVariation;
  /** Resolved updated variation if modifications were made */
  readonly updated?: TVariation;
  /** ID of the updated variation if it was saved */
  readonly updatedId?: TVariationId;
  /** Optional categorized notes about this entry */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** The underlying entity */
  readonly entity: TEntity;
}

/**
 * Materialized journal entry for filling recipe edits.
 * @public
 */
export interface IFillingEditJournalEntry
  extends IJournalEntryBase<
    IFillingRecipe,
    IFillingRecipeVariation,
    FillingRecipeVariationId,
    IFillingEditJournalEntryEntity
  > {}

/**
 * Materialized journal entry for confection edits.
 * @public
 */
export interface IConfectionEditJournalEntry
  extends IJournalEntryBase<
    IConfectionBase,
    IConfectionRecipeVariationBase,
    ConfectionRecipeVariationId,
    IConfectionEditJournalEntryEntity
  > {}

/**
 * Materialized journal entry for filling production sessions.
 * @public
 */
export interface IFillingProductionJournalEntry
  extends IJournalEntryBase<
    IFillingRecipe,
    IFillingRecipeVariation,
    FillingRecipeVariationId,
    IFillingProductionJournalEntryEntity
  > {}

/**
 * Materialized journal entry for confection production sessions.
 * @public
 */
export interface IConfectionProductionJournalEntry
  extends IJournalEntryBase<
    IConfectionBase,
    IConfectionRecipeVariationBase,
    ConfectionRecipeVariationId,
    IConfectionProductionJournalEntryEntity
  > {}

/**
 * Union type for any materialized journal entry.
 * @public
 */
export type AnyJournalEntry =
  | IFillingEditJournalEntry
  | IConfectionEditJournalEntry
  | IFillingProductionJournalEntry
  | IConfectionProductionJournalEntry;

// ============================================================================
// Materialized Inventory Types
// ============================================================================

/**
 * Base interface for materialized inventory entries with resolved references.
 * @typeParam TId - The inventory entry ID type
 * @typeParam TItem - The resolved item interface type (IMold or AnyIngredient)
 * @typeParam TEntity - The specific inventory entry entity type
 * @public
 */
export interface IInventoryEntryBase<TId, TItem, TEntity> {
  /** Composite inventory entry ID (collectionId.baseId) */
  readonly id: TId;
  /** The resolved item being inventoried */
  readonly item: TItem;
  /** Quantity on hand */
  readonly quantity: number;
  /** Optional storage location */
  readonly location?: string;
  /** Optional categorized notes */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** The underlying entity */
  readonly entity: TEntity;
}

/**
 * Materialized mold inventory entry with resolved mold reference.
 * @public
 */
export interface IMoldInventoryEntry
  extends IInventoryEntryBase<Inventory.MoldInventoryEntryId, IMold, IMoldInventoryEntryEntity> {}

/**
 * Materialized ingredient inventory entry with resolved ingredient reference.
 * @public
 */
export interface IIngredientInventoryEntry
  extends IInventoryEntryBase<
    Inventory.IngredientInventoryEntryId,
    IIngredient,
    IIngredientInventoryEntryEntity
  > {}

/**
 * Union type for any materialized inventory entry.
 * @public
 */
export type AnyInventoryEntry = IMoldInventoryEntry | IIngredientInventoryEntry;

// ============================================================================
// User Library Runtime Interface
// ============================================================================

/**
 * Runtime materialization layer for user library data.
 *
 * Follows the library-runtime pattern:
 * - Exposes underlying entity library for direct access
 * - Provides MaterializedLibrary instances for sessions, journals, and inventory
 * - Lazy resolution and caching of materialized objects
 *
 * @public
 */
export interface IUserLibraryRuntime {
  /**
   * A materialized library of all sessions, keyed by composite ID.
   * Sessions are materialized lazily on access and cached.
   */
  readonly sessions: MaterializedLibrary<SessionId, AnySessionEntity, AnyMaterializedSession, never>;

  /**
   * A materialized library of all journal entries, keyed by composite ID.
   * Journal entries are materialized lazily on access and cached.
   */
  readonly journals: MaterializedLibrary<JournalId, AnyJournalEntryEntity, AnyJournalEntry, never>;

  /**
   * A materialized library of mold inventory entries, keyed by composite ID.
   * Inventory entries are materialized lazily on access and cached.
   */
  readonly moldInventory: MaterializedLibrary<
    Inventory.MoldInventoryEntryId,
    IMoldInventoryEntryEntity,
    IMoldInventoryEntry,
    never
  >;

  /**
   * A materialized library of ingredient inventory entries, keyed by composite ID.
   * Inventory entries are materialized lazily on access and cached.
   */
  readonly ingredientInventory: MaterializedLibrary<
    Inventory.IngredientInventoryEntryId,
    IIngredientInventoryEntryEntity,
    IIngredientInventoryEntry,
    never
  >;

  /**
   * Creates a new persisted filling session from a filling variation.
   * The session is created and persisted immediately.
   * @param variationId - Source filling variation to create session for
   * @param options - Creation options including target collection
   * @returns Result with the created persisted session
   */
  createFillingSession(
    variationId: FillingRecipeVariationId,
    options: ICreateFillingSessionOptions
  ): Result<IFillingSessionEntity>;

  /**
   * Saves an active session back to the library.
   * @param sessionId - Session to save
   * @returns Result with the updated persisted session
   */
  saveSession(sessionId: SessionId): Result<AnySessionEntity>;
}
