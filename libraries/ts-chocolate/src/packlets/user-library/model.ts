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
  BaseSessionId,
  CollectionId,
  ConfectionId,
  ConfectionRecipeVariationId,
  FillingRecipeVariationId,
  GroupName,
  JournalId,
  Measurement,
  SessionId,
  Model as CommonModel
} from '../common';
import {
  AnyJournalEntryEntity,
  AnyRecipeJournalEntryEntity,
  AnySessionEntity,
  IConfectionEditJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  IFillingEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  IIngredientInventoryEntryEntity,
  IMoldInventoryEntryEntity,
  Inventory,
  PersistedSessionStatus,
  PersistedSessionType
} from '../entities';
import {
  IConfectionBase,
  IConfectionContext,
  IConfectionRecipeVariationBase,
  IFillingRecipe,
  IFillingRecipeVariation,
  IIngredient,
  IMold,
  MaterializedLibrary
} from '../library-runtime';
import { IUserEntityLibrary } from '../user-entities';
import * as Session from './session';

// ============================================================================
// Materialized Session Base Interface
// ============================================================================

/**
 * Common metadata interface for all materialized editing sessions.
 *
 * Follows the library-runtime pattern where materialized classes store a data
 * entity and expose its properties via typed accessors. The UI layer consumes
 * this interface (never raw entity interfaces).
 *
 * @public
 */
// TODO: conssider templating with session type & entity type for better typing
export interface IMaterializedSessionBase {
  /** Base identifier within the collection (no collection prefix) */
  readonly baseId: BaseSessionId;
  /** Session type discriminator */
  readonly sessionType: PersistedSessionType;
  /** Current lifecycle status */
  readonly status: PersistedSessionStatus;
  /** User-provided label for the session */
  readonly label: string | undefined;
  /** Optional group identifier for organizing related sessions */
  readonly group: GroupName | undefined;
  /** ISO 8601 timestamp when session was created */
  readonly createdAt: string;
  /** ISO 8601 timestamp when session was last updated */
  readonly updatedAt: string;
  /** Optional categorized notes */
  readonly notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined;
  /** Source variation ID for this session */
  readonly sourceVariationId: FillingRecipeVariationId | ConfectionRecipeVariationId;
  /** The underlying persisted entity */
  readonly entity: AnySessionEntity;

  /**
   * Resets the change-detection baseline to the current produced state.
   * Call after a successful save so that `hasChanges` returns false
   * until the next mutation.
   */
  markSaved(): void;
}

// ============================================================================
// Session Context Interface
// ============================================================================

/**
 * Context interface for session creation and management.
 * Extends IConfectionContext with the ability to create filling editing sessions.
 *
 * This interface is used by confection editing sessions to manage filling scaling.
 *
 * @public
 */
export interface ISessionContext extends IConfectionContext {
  /**
   * Creates an editing session for a filling recipe at a target weight.
   * Used by confection sessions to manage filling scaling.
   * @param filling - The runtime filling recipe to create a session for
   * @param targetWeight - Target weight for the filling in grams
   * @returns Success with EditingSession, or Failure if creation fails
   */
  createFillingSession(filling: IFillingRecipe, targetWeight: Measurement): Result<Session.EditingSession>;
}

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
  /** Initial session status (default: 'planning') */
  readonly status?: PersistedSessionStatus;
  /** Optional user-provided label */
  readonly label?: string;
  /** Optional slug appended to the generated session ID as kebab-case */
  readonly slug?: string;
}

/**
 * Options for creating a new persisted confection session.
 * @public
 */
export interface ICreateConfectionSessionOptions {
  /** Target collection for the persisted session */
  readonly collectionId: CollectionId;
  /** Initial session status (default: 'planning') */
  readonly status?: PersistedSessionStatus;
  /** Optional user-provided label */
  readonly label?: string;
  /** Optional slug appended to the generated session ID as kebab-case */
  readonly slug?: string;
  /** Optional confection editing session parameters (yield, sessionId) */
  readonly params?: Session.IConfectionEditingSessionParams;
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
  TEntity extends AnyRecipeJournalEntryEntity = AnyRecipeJournalEntryEntity
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
// User Library Interface
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
export interface IUserLibrary {
  /**
   * The underlying user entity library for collection management operations.
   * Parallels `workspace.data.entities` for shared library data.
   */
  readonly entities: IUserEntityLibrary;

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
   * The session is created, persisted to the entity library, and the composite SessionId is returned.
   * @param variationId - Source filling variation to create session for
   * @param options - Creation options including target collection
   * @returns Result with the composite SessionId
   */
  createPersistedFillingSession(
    variationId: FillingRecipeVariationId,
    options: ICreateFillingSessionOptions
  ): Result<SessionId>;

  /**
   * Creates a new persisted confection session from a confection recipe.
   * The session is created, persisted to the entity library, and the composite SessionId is returned.
   * @param confectionId - Source confection to create session for
   * @param options - Creation options including target collection and optional session params
   * @returns Result with the composite SessionId
   */
  createPersistedConfectionSession(
    confectionId: ConfectionId,
    options: ICreateConfectionSessionOptions
  ): Result<SessionId>;

  /**
   * Saves an active session back to the library.
   * @param sessionId - Session to save
   * @returns Result with the composite SessionId
   */
  saveSession(sessionId: SessionId): Result<SessionId>;

  /**
   * Updates the status of an existing persisted session.
   * @param sessionId - Session to update
   * @param status - New session status
   * @returns Result with the composite SessionId
   */
  updateSessionStatus(sessionId: SessionId, status: PersistedSessionStatus): Result<SessionId>;

  /**
   * Removes a session from the library.
   * @param sessionId - Session to remove
   * @returns Result with the composite SessionId of the removed session
   */
  removeSession(sessionId: SessionId): Result<SessionId>;
}
