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
 * UserLibrary - materializes user library data with resolved references.
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import {
  CollectionId,
  ConfectionId,
  ConfectionType,
  FillingId,
  FillingRecipeVariationId,
  Helpers,
  IngredientId,
  JournalId,
  Measurement,
  MoldId,
  ProcedureId,
  SessionId
} from '../common';
import {
  AnyConfectionRecipeEntity,
  AnyJournalEntryEntity,
  AnySessionEntity,
  IConfectionSessionEntity,
  IFillingRecipeEntity,
  IFillingSessionEntity,
  IMoldEntity,
  IProcedureEntity,
  IProducedBarTruffleEntity,
  IProducedMoldedBonBonEntity,
  IProducedRolledTruffleEntity,
  IngredientEntity,
  Inventory,
  Session as SessionEntities
} from '../entities';
import {
  IConfectionBase,
  IConfectionContext,
  IFillingRecipe,
  IIngredient,
  IMold,
  Indexers,
  IProcedure,
  MaterializedLibrary
} from '../library-runtime';
import * as Session from './session';
import { IUserEntityLibrary } from '../user-entities';
import { createJournalEntry } from './journalEntry';
import { IngredientInventoryEntry, MoldInventoryEntry } from './inventoryEntry';
import {
  AnyJournalEntry,
  AnyMaterializedSession,
  ICreateFillingSessionOptions,
  IIngredientInventoryEntry,
  IMoldInventoryEntry,
  ISessionContext,
  IUserLibrary
} from './model';

/**
 * Implementation of user library runtime materialization.
 *
 * Follows the library-runtime pattern:
 * - Exposes MaterializedLibrary instances for sessions, journals, and inventory
 * - Lazy resolution and caching of materialized objects
 * - Specialized methods for session creation and persistence
 * - Implements ISessionContext for confection editing sessions
 *
 * @public
 */
export class UserLibrary implements IUserLibrary, ISessionContext {
  private readonly _entities: IUserEntityLibrary;
  private readonly _confectionContext: IConfectionContext;

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

  private constructor(userEntityLibrary: IUserEntityLibrary, confectionContext: IConfectionContext) {
    this._entities = userEntityLibrary;
    this._confectionContext = confectionContext;
  }

  /**
   * Creates a new UserLibrary.
   * @param userEntityLibrary - The user library containing persisted data
   * @param confectionContext - The confection context for materializing recipes and confections
   * @returns Result with the UserLibrary
   * @public
   */
  public static create(
    userEntityLibrary: IUserEntityLibrary,
    confectionContext: IConfectionContext
  ): Result<UserLibrary> {
    return succeed(new UserLibrary(userEntityLibrary, confectionContext));
  }

  /**
   * {@inheritDoc IUserLibrary.sessions}
   */
  public get sessions(): MaterializedLibrary<SessionId, AnySessionEntity, AnyMaterializedSession, never> {
    return this._getSessions();
  }

  /**
   * {@inheritDoc IUserLibrary.journals}
   */
  public get journals(): MaterializedLibrary<JournalId, AnyJournalEntryEntity, AnyJournalEntry, never> {
    return this._getJournals();
  }

  /**
   * {@inheritDoc IUserLibrary.moldInventory}
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
   * {@inheritDoc IUserLibrary.ingredientInventory}
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
  // ISessionContext Implementation
  // ============================================================================

  /**
   * {@inheritDoc ISessionContext.createFillingSession}
   */
  public createFillingSession(
    filling: IFillingRecipe,
    targetWeight: Measurement
  ): Result<Session.EditingSession> {
    // Get the golden variation (now safe - no cast needed)
    const variation = filling.goldenVariation;

    // Calculate scale factor to achieve target weight
    const baseWeight = variation.entity.baseWeight;
    if (baseWeight <= 0) {
      return fail(`Cannot create session: base weight must be positive (got ${baseWeight})`);
    }

    const scaleFactor = targetWeight / baseWeight;

    // Create editing session with scale factor
    return Session.EditingSession.create(variation, scaleFactor);
  }

  /**
   * Gets the materialized fillings library from the confection context.
   * Required by IConfectionContext.
   */
  public get fillings(): MaterializedLibrary<
    FillingId,
    IFillingRecipeEntity,
    IFillingRecipe,
    Indexers.IFillingRecipeQuerySpec
  > {
    return this._confectionContext.fillings;
  }

  /**
   * Gets the materialized confections library from the confection context.
   * Required by IConfectionContext.
   */
  public get confections(): MaterializedLibrary<
    ConfectionId,
    AnyConfectionRecipeEntity,
    IConfectionBase,
    never
  > {
    return this._confectionContext.confections;
  }

  /**
   * Gets the materialized molds library from the confection context.
   * Required by IConfectionContext.
   */
  public get molds(): MaterializedLibrary<MoldId, IMoldEntity, IMold, never> {
    return this._confectionContext.molds;
  }

  /**
   * Gets the materialized ingredients library from the confection context.
   * Required by IVariationContext.
   */
  public get ingredients(): MaterializedLibrary<
    IngredientId,
    IngredientEntity,
    IIngredient,
    Indexers.IIngredientQuerySpec
  > {
    return this._confectionContext.ingredients;
  }

  /**
   * Gets the materialized procedures library from the confection context.
   * Required by IVariationContext.
   */
  public get procedures(): MaterializedLibrary<ProcedureId, IProcedureEntity, IProcedure, never> {
    return this._confectionContext.procedures;
  }

  /**
   * Checks if a collection is mutable.
   * Required by IVariationContext.
   * @param collectionId - The collection ID to check
   * @returns Success with boolean indicating mutability, or Failure if collection not found
   */
  public isCollectionMutable(collectionId: CollectionId): Result<boolean> {
    return this._confectionContext.isCollectionMutable(collectionId);
  }

  // ============================================================================
  // User Library Methods
  // ============================================================================

  /**
   * {@inheritDoc IUserLibrary.createPersistedFillingSession}
   */
  public createPersistedFillingSession(
    variationId: FillingRecipeVariationId,
    options: ICreateFillingSessionOptions
  ): Result<IFillingSessionEntity> {
    const fillingId = Helpers.getFillingRecipeVariationFillingId(variationId);
    return this._confectionContext.fillings.get(fillingId).asResult.onSuccess((filling) => {
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
   * {@inheritDoc IUserLibrary.saveSession}
   */
  public saveSession(sessionId: SessionId): Result<AnySessionEntity> {
    // Get the materialized session from the cache
    const sessionResult = this._getSessions().get(sessionId);
    if (sessionResult.isFailure()) {
      return fail(`Session ${sessionId} is not materialized: ${sessionResult.message}`);
    }

    const session = sessionResult.value;

    // Get the existing persisted session
    const existingResult = this._entities.sessions.get(sessionId);
    /* c8 ignore next 3 - defensive: session already validated before save */
    if (existingResult.isFailure()) {
      return fail(`Session ${sessionId} not found: ${existingResult.message}`);
    }

    const existing = existingResult.value;
    const collectionId = Helpers.getSessionCollectionId(sessionId);
    const baseId = Helpers.getSessionBaseId(sessionId);

    const persistOptions = {
      collectionId,
      baseId,
      status: existing.status,
      label: existing.label,
      notes: existing.notes ? [...existing.notes] : undefined
    };

    // Create updated persisted state
    const persistedResult = session.toPersistedState(persistOptions);

    return persistedResult.onSuccess((persisted) => {
      return this._entities.sessions.upsertSession(collectionId, persisted).onSuccess(() => {
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
        inner: this._entities.sessions,
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
        inner: this._entities.journals,
        converter: (entity, id) => createJournalEntry(this, id, entity)
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
        inner: this._entities.moldInventory,
        converter: (entity, id) => MoldInventoryEntry.create(this, id, entity)
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
        inner: this._entities.ingredientInventory,
        converter: (entity, id) => IngredientInventoryEntry.create(this, id, entity)
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
    /* c8 ignore next 2 - defensive: exhaustive session type check */
    return fail(`Unknown session type for ${sessionId}`);
  }

  /**
   * Materializes a filling session from persisted state.
   * @internal
   */
  private _materializeFillingSession(persisted: IFillingSessionEntity): Result<Session.EditingSession> {
    const fillingId = Helpers.getFillingRecipeVariationFillingId(persisted.sourceVariationId);
    return this._confectionContext.fillings.get(fillingId).asResult.onSuccess((filling) => {
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
      return this._confectionContext.confections.get(parsed.collectionId).asResult.onSuccess((confection) => {
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
    if (confection.isMoldedBonBon() && persisted.confectionType === ('molded-bonbon' as ConfectionType)) {
      return Session.MoldedBonBonEditingSession.fromPersistedState(
        confection,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity>,
        this
      );
    }

    if (confection.isBarTruffle() && persisted.confectionType === ('bar-truffle' as ConfectionType)) {
      return Session.BarTruffleEditingSession.fromPersistedState(
        confection,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedBarTruffleEntity>,
        this
      );
    }

    if (confection.isRolledTruffle() && persisted.confectionType === ('rolled-truffle' as ConfectionType)) {
      return Session.RolledTruffleEditingSession.fromPersistedState(
        confection,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedRolledTruffleEntity>,
        this
      );
    }
    /* c8 ignore next 2 - defensive: exhaustive confection type check */
    return fail(`Confection type mismatch: expected ${persisted.confectionType}`);
  }
}
