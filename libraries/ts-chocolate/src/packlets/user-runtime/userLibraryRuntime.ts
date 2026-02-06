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
 * UserLibraryRuntime - materializes user library data with resolved references.
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import { ConfectionType, FillingRecipeVariationId, Helpers, JournalId, SessionId } from '../common';
import {
  AnyJournalEntryEntity,
  AnySessionEntity,
  IConfectionSessionEntity,
  IFillingSessionEntity,
  IProducedBarTruffleEntity,
  IProducedMoldedBonBonEntity,
  IProducedRolledTruffleEntity,
  Inventory,
  Session as SessionEntities
} from '../entities';
import {
  BarTruffleRecipe,
  IConfectionBase,
  MaterializedLibrary,
  MoldedBonBonRecipe,
  RolledTruffleRecipe
} from '../library-runtime';
import { ISessionContext, Session } from '../runtime';
import { IUserLibrary } from '../user-library';
import { createJournalEntry } from './journalEntry';
import { IngredientInventoryEntry, MoldInventoryEntry } from './inventoryEntry';
import {
  AnyJournalEntry,
  AnyMaterializedSession,
  ICreateFillingSessionOptions,
  IIngredientInventoryEntry,
  IMoldInventoryEntry,
  IUserLibraryRuntime
} from './model';

/**
 * Implementation of user library runtime materialization.
 *
 * Follows the library-runtime pattern:
 * - Exposes MaterializedLibrary instances for sessions, journals, and inventory
 * - Lazy resolution and caching of materialized objects
 * - Specialized methods for session creation and persistence
 *
 * @public
 */
export class UserLibraryRuntime implements IUserLibraryRuntime {
  private readonly _userLibrary: IUserLibrary;
  private readonly _sessionContext: ISessionContext;

  // Lazy-initialized MaterializedLibrary instances
  private _sessions:
    | MaterializedLibrary<SessionId, AnySessionEntity, AnyMaterializedSession, never>
    | undefined;
  private _journals:
    | MaterializedLibrary<JournalId, AnyJournalEntryEntity, AnyJournalEntry, never>
    | undefined;
  private _moldInventory:
    | MaterializedLibrary<
        Inventory.MoldInventoryEntryId,
        Inventory.IMoldInventoryEntryEntity,
        IMoldInventoryEntry,
        never
      >
    | undefined;
  private _ingredientInventory:
    | MaterializedLibrary<
        Inventory.IngredientInventoryEntryId,
        Inventory.IIngredientInventoryEntryEntity,
        IIngredientInventoryEntry,
        never
      >
    | undefined;

  private constructor(userLibrary: IUserLibrary, sessionContext: ISessionContext) {
    this._userLibrary = userLibrary;
    this._sessionContext = sessionContext;
  }

  /**
   * Creates a new UserLibraryRuntime.
   * @param userLibrary - The user library containing persisted data
   * @param sessionContext - The session context for materializing recipes and confections
   * @returns Result with the UserLibraryRuntime
   * @public
   */
  public static create(
    userLibrary: IUserLibrary,
    sessionContext: ISessionContext
  ): Result<UserLibraryRuntime> {
    return succeed(new UserLibraryRuntime(userLibrary, sessionContext));
  }

  // ============================================================================
  // MaterializedLibrary Properties (IUserLibraryRuntime)
  // ============================================================================

  /**
   * {@inheritDoc IUserLibraryRuntime.sessions}
   */
  public get sessions(): MaterializedLibrary<SessionId, AnySessionEntity, AnyMaterializedSession, never> {
    return this._getSessions();
  }

  /**
   * {@inheritDoc IUserLibraryRuntime.journals}
   */
  public get journals(): MaterializedLibrary<JournalId, AnyJournalEntryEntity, AnyJournalEntry, never> {
    return this._getJournals();
  }

  /**
   * {@inheritDoc IUserLibraryRuntime.moldInventory}
   */
  public get moldInventory(): MaterializedLibrary<
    Inventory.MoldInventoryEntryId,
    Inventory.IMoldInventoryEntryEntity,
    IMoldInventoryEntry,
    never
  > {
    return this._getMoldInventory();
  }

  /**
   * {@inheritDoc IUserLibraryRuntime.ingredientInventory}
   */
  public get ingredientInventory(): MaterializedLibrary<
    Inventory.IngredientInventoryEntryId,
    Inventory.IIngredientInventoryEntryEntity,
    IIngredientInventoryEntry,
    never
  > {
    return this._getIngredientInventory();
  }

  // ============================================================================
  // Specialized Session Methods (IUserLibraryRuntime)
  // ============================================================================

  /**
   * {@inheritDoc IUserLibraryRuntime.createFillingSession}
   */
  public createFillingSession(
    variationId: FillingRecipeVariationId,
    options: ICreateFillingSessionOptions
  ): Result<IFillingSessionEntity> {
    const fillingId = Helpers.getFillingRecipeVariationFillingId(variationId);
    return this._sessionContext.fillings.get(fillingId).asResult.onSuccess((filling) => {
      const variationSpec = Helpers.getFillingRecipeVariationSpec(variationId);
      return filling.getVariation(variationSpec).onSuccess((variation) => {
        return Session.EditingSession.create(variation).onSuccess((session) => {
          return session.toPersistedState({
            collectionId: options.collectionId,
            status: options.status,
            label: options.label
          });
        });
      });
    });
  }

  /**
   * {@inheritDoc IUserLibraryRuntime.saveSession}
   */
  public saveSession(sessionId: SessionId): Result<AnySessionEntity> {
    // Get the materialized session from the cache
    const sessionResult = this._getSessions().get(sessionId);
    if (sessionResult.isFailure()) {
      return fail(`Session ${sessionId} is not materialized: ${sessionResult.message}`);
    }

    const session = sessionResult.value;

    // Currently only filling sessions support persistence
    if (!('toPersistedState' in session)) {
      return fail(
        `Session ${sessionId} does not support persistence (confection sessions not yet implemented)`
      );
    }

    // Get the existing persisted session
    const existingResult = this._userLibrary.sessions.get(sessionId);
    if (existingResult.isFailure()) {
      return fail(`Session ${sessionId} not found: ${existingResult.message}`);
    }

    const existing = existingResult.value;
    const collectionId = Helpers.getSessionCollectionId(sessionId);
    const baseId = Helpers.getSessionBaseId(sessionId);

    // Create updated persisted state
    const fillingSession = session as Session.EditingSession;
    return fillingSession
      .toPersistedState({
        collectionId,
        baseId,
        status: existing.status,
        label: existing.label,
        notes: existing.notes ? [...existing.notes] : undefined
      })
      .onSuccess((persisted) => {
        return this._userLibrary.sessions.upsertSession(collectionId, persisted).onSuccess(() => {
          return succeed(persisted as AnySessionEntity);
        });
      });
  }

  // ============================================================================
  // Private MaterializedLibrary Factories
  // ============================================================================

  /**
   * Gets or creates the materialized sessions library.
   * @internal
   */
  private _getSessions(): MaterializedLibrary<SessionId, AnySessionEntity, AnyMaterializedSession, never> {
    if (!this._sessions) {
      this._sessions = new MaterializedLibrary({
        inner: this._userLibrary.sessions,
        converter: (entity, id) => this._materializeSession(id, entity)
      });
    }
    return this._sessions;
  }

  /**
   * Gets or creates the materialized journals library.
   * @internal
   */
  private _getJournals(): MaterializedLibrary<JournalId, AnyJournalEntryEntity, AnyJournalEntry, never> {
    if (!this._journals) {
      this._journals = new MaterializedLibrary({
        inner: this._userLibrary.journals,
        converter: (entity, id) => createJournalEntry(this._sessionContext, id, entity)
      });
    }
    return this._journals;
  }

  /**
   * Gets or creates the materialized mold inventory library.
   * @internal
   */
  private _getMoldInventory(): MaterializedLibrary<
    Inventory.MoldInventoryEntryId,
    Inventory.IMoldInventoryEntryEntity,
    IMoldInventoryEntry,
    never
  > {
    if (!this._moldInventory) {
      this._moldInventory = new MaterializedLibrary({
        inner: this._userLibrary.moldInventory,
        converter: (entity, id) => MoldInventoryEntry.create(this._sessionContext, id, entity)
      });
    }
    return this._moldInventory;
  }

  /**
   * Gets or creates the materialized ingredient inventory library.
   * @internal
   */
  private _getIngredientInventory(): MaterializedLibrary<
    Inventory.IngredientInventoryEntryId,
    Inventory.IIngredientInventoryEntryEntity,
    IIngredientInventoryEntry,
    never
  > {
    if (!this._ingredientInventory) {
      this._ingredientInventory = new MaterializedLibrary({
        inner: this._userLibrary.ingredientInventory,
        converter: (entity, id) => IngredientInventoryEntry.create(this._sessionContext, id, entity)
      });
    }
    return this._ingredientInventory;
  }

  // ============================================================================
  // Private Session Materialization Helpers
  // ============================================================================

  /**
   * Materializes a session from persisted state.
   * Dispatches to type-specific materialization.
   * @internal
   */
  private _materializeSession(
    sessionId: SessionId,
    entity: AnySessionEntity
  ): Result<AnyMaterializedSession> {
    if (SessionEntities.isFillingSessionEntity(entity)) {
      return this._materializeFillingSession(entity);
    }

    if (SessionEntities.isConfectionSessionEntity(entity)) {
      return this._materializeConfectionSession(entity);
    }

    return fail(`Unknown session type for ${sessionId}`);
  }

  /**
   * Materializes a filling session from persisted state.
   * @internal
   */
  private _materializeFillingSession(persisted: IFillingSessionEntity): Result<Session.EditingSession> {
    const fillingId = Helpers.getFillingRecipeVariationFillingId(persisted.sourceVariationId);
    return this._sessionContext.fillings.get(fillingId).asResult.onSuccess((filling) => {
      const variationSpec = Helpers.getFillingRecipeVariationSpec(persisted.sourceVariationId);
      return filling.getVariation(variationSpec).onSuccess((variation) => {
        return Session.EditingSession.fromPersistedState(persisted, variation);
      });
    });
  }

  /**
   * Materializes a confection session from persisted state.
   * @internal
   */
  private _materializeConfectionSession(
    persisted: IConfectionSessionEntity
  ): Result<Session.AnyConfectionEditingSession> {
    return Helpers.parseConfectionRecipeVariationId(persisted.sourceVariationId).onSuccess((parsed) => {
      return this._sessionContext.confections.get(parsed.collectionId).asResult.onSuccess((confection) => {
        return this._materializeTypedConfectionSession(persisted, confection);
      });
    });
  }

  /**
   * Dispatches to type-specific confection session materialization.
   * @internal
   */
  private _materializeTypedConfectionSession(
    persisted: IConfectionSessionEntity,
    confection: IConfectionBase
  ): Result<Session.AnyConfectionEditingSession> {
    if (confection.isMoldedBonBon() && persisted.confectionType === ('moldedBonBon' as ConfectionType)) {
      return Session.MoldedBonBonEditingSession.fromPersistedState(
        confection as unknown as MoldedBonBonRecipe,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity>,
        this._sessionContext
      );
    }

    if (confection.isBarTruffle() && persisted.confectionType === ('barTruffle' as ConfectionType)) {
      return Session.BarTruffleEditingSession.fromPersistedState(
        confection as unknown as BarTruffleRecipe,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedBarTruffleEntity>,
        this._sessionContext
      );
    }

    if (confection.isRolledTruffle() && persisted.confectionType === ('rolledTruffle' as ConfectionType)) {
      return Session.RolledTruffleEditingSession.fromPersistedState(
        confection as unknown as RolledTruffleRecipe,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedRolledTruffleEntity>,
        this._sessionContext
      );
    }

    return fail(`Confection type mismatch: expected ${persisted.confectionType}`);
  }
}
