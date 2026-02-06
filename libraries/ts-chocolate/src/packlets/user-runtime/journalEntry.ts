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
 * Concrete journal entry classes with resolved references.
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import {
  BaseJournalId,
  ConfectionRecipeVariationId,
  FillingRecipeVariationId,
  Helpers,
  JournalId
} from '../common';
import {
  AnyJournalEntryEntity,
  IConfectionEditJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  IFillingEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  Journal as JournalEntities
} from '../entities';
import {
  IConfectionBase,
  IConfectionRecipeVariationBase,
  IFillingRecipe,
  IFillingRecipeVariation
} from '../library-runtime';
import { ISessionContext } from '../runtime';
import { JournalEntryBase } from './journalEntryBase';
import {
  AnyJournalEntry,
  IConfectionEditJournalEntry,
  IConfectionProductionJournalEntry,
  IFillingEditJournalEntry,
  IFillingProductionJournalEntry
} from './model';

// ============================================================================
// Filling Edit Journal Entry
// ============================================================================

/**
 * Materialized filling edit journal entry with resolved recipe/version references.
 * @internal
 */
export class FillingEditJournalEntry
  extends JournalEntryBase<
    IFillingRecipe,
    IFillingRecipeVariation,
    FillingRecipeVariationId,
    IFillingEditJournalEntryEntity
  >
  implements IFillingEditJournalEntry
{
  /**
   * Creates a FillingEditJournalEntry.
   * @internal
   */
  private constructor(
    context: ISessionContext,
    id: JournalId,
    baseId: BaseJournalId,
    entity: IFillingEditJournalEntryEntity,
    recipe: IFillingRecipe,
    version: IFillingRecipeVariation,
    updated?: IFillingRecipeVariation
  ) {
    super(context, id, baseId, entity, recipe, version, updated);
  }

  /**
   * Factory method to create a materialized filling edit journal entry.
   * @param context - Session context for resolving references
   * @param id - Composite journal entry ID
   * @param entity - Filling edit journal entry entity
   * @returns Result with materialized journal entry
   * @internal
   */
  public static create(
    context: ISessionContext,
    id: JournalId,
    entity: IFillingEditJournalEntryEntity
  ): Result<FillingEditJournalEntry> {
    const baseId = Helpers.getJournalBaseId(id);
    const fillingId = Helpers.getFillingRecipeVariationFillingId(entity.variationId);

    return context.fillings
      .get(fillingId)
      .asResult.withErrorFormat((msg) => `journal ${id}: ${msg}`)
      .onSuccess((recipe) => {
        const variationSpec = Helpers.getFillingRecipeVariationSpec(entity.variationId);
        return recipe
          .getVariation(variationSpec)
          .withErrorFormat((msg) => `journal ${id}: ${msg}`)
          .onSuccess((variation) => {
            // TODO: Materialize updated variation if present
            const updated = undefined;
            return succeed(
              new FillingEditJournalEntry(context, id, baseId, entity, recipe, variation, updated)
            );
          });
      });
  }
}

// ============================================================================
// Confection Edit Journal Entry
// ============================================================================

/**
 * Materialized confection edit journal entry with resolved confection/version references.
 * @internal
 */
export class ConfectionEditJournalEntry
  extends JournalEntryBase<
    IConfectionBase,
    IConfectionRecipeVariationBase,
    ConfectionRecipeVariationId,
    IConfectionEditJournalEntryEntity
  >
  implements IConfectionEditJournalEntry
{
  /**
   * Creates a ConfectionEditJournalEntry.
   * @internal
   */
  private constructor(
    context: ISessionContext,
    id: JournalId,
    baseId: BaseJournalId,
    entity: IConfectionEditJournalEntryEntity,
    confection: IConfectionBase,
    version: IConfectionRecipeVariationBase,
    updated?: IConfectionRecipeVariationBase
  ) {
    super(context, id, baseId, entity, confection, version, updated);
  }

  /**
   * Factory method to create a materialized confection edit journal entry.
   * @param context - Session context for resolving references
   * @param id - Composite journal entry ID
   * @param entity - Confection edit journal entry entity
   * @returns Result with materialized journal entry
   * @internal
   */
  public static create(
    context: ISessionContext,
    id: JournalId,
    entity: IConfectionEditJournalEntryEntity
  ): Result<ConfectionEditJournalEntry> {
    const baseId = Helpers.getJournalBaseId(id);

    return Helpers.parseConfectionRecipeVariationId(entity.variationId)
      .withErrorFormat((msg) => `journal ${id}: ${msg}`)
      .onSuccess((parsed) => {
        return context.confections
          .get(parsed.collectionId)
          .asResult.withErrorFormat((msg) => `journal ${id}: ${msg}`)
          .onSuccess((confection) => {
            return confection
              .getVariation(parsed.itemId)
              .withErrorFormat((msg) => `journal ${id}: ${msg}`)
              .onSuccess((version) => {
                // TODO: Materialize updated version if present
                const updated = undefined;
                return succeed(
                  new ConfectionEditJournalEntry(context, id, baseId, entity, confection, version, updated)
                );
              });
          });
      });
  }
}

// ============================================================================
// Filling Production Journal Entry
// ============================================================================

/**
 * Materialized filling production journal entry with resolved recipe/version references.
 * @internal
 */
export class FillingProductionJournalEntry
  extends JournalEntryBase<
    IFillingRecipe,
    IFillingRecipeVariation,
    FillingRecipeVariationId,
    IFillingProductionJournalEntryEntity
  >
  implements IFillingProductionJournalEntry
{
  /**
   * Creates a FillingProductionJournalEntry.
   * @internal
   */
  private constructor(
    context: ISessionContext,
    id: JournalId,
    baseId: BaseJournalId,
    entity: IFillingProductionJournalEntryEntity,
    recipe: IFillingRecipe,
    version: IFillingRecipeVariation,
    updated?: IFillingRecipeVariation
  ) {
    super(context, id, baseId, entity, recipe, version, updated);
  }

  /**
   * Factory method to create a materialized filling production journal entry.
   * @param context - Session context for resolving references
   * @param id - Composite journal entry ID
   * @param entity - Filling production journal entry entity
   * @returns Result with materialized journal entry
   * @internal
   */
  public static create(
    context: ISessionContext,
    id: JournalId,
    entity: IFillingProductionJournalEntryEntity
  ): Result<FillingProductionJournalEntry> {
    const baseId = Helpers.getJournalBaseId(id);
    const fillingId = Helpers.getFillingRecipeVariationFillingId(entity.variationId);

    return context.fillings
      .get(fillingId)
      .asResult.withErrorFormat((msg) => `journal ${id}: ${msg}`)
      .onSuccess((recipe) => {
        const variationSpec = Helpers.getFillingRecipeVariationSpec(entity.variationId);
        return recipe
          .getVariation(variationSpec)
          .withErrorFormat((msg) => `journal ${id}: ${msg}`)
          .onSuccess((variation) => {
            // TODO: Materialize updated variation if present
            const updated = undefined;
            return succeed(
              new FillingProductionJournalEntry(context, id, baseId, entity, recipe, variation, updated)
            );
          });
      });
  }
}

// ============================================================================
// Confection Production Journal Entry
// ============================================================================

/**
 * Materialized confection production journal entry with resolved confection/version references.
 * @internal
 */
export class ConfectionProductionJournalEntry
  extends JournalEntryBase<
    IConfectionBase,
    IConfectionRecipeVariationBase,
    ConfectionRecipeVariationId,
    IConfectionProductionJournalEntryEntity
  >
  implements IConfectionProductionJournalEntry
{
  /**
   * Creates a ConfectionProductionJournalEntry.
   * @internal
   */
  private constructor(
    context: ISessionContext,
    id: JournalId,
    baseId: BaseJournalId,
    entity: IConfectionProductionJournalEntryEntity,
    confection: IConfectionBase,
    version: IConfectionRecipeVariationBase,
    updated?: IConfectionRecipeVariationBase
  ) {
    super(context, id, baseId, entity, confection, version, updated);
  }

  /**
   * Factory method to create a materialized confection production journal entry.
   * @param context - Session context for resolving references
   * @param id - Composite journal entry ID
   * @param entity - Confection production journal entry entity
   * @returns Result with materialized journal entry
   * @internal
   */
  public static create(
    context: ISessionContext,
    id: JournalId,
    entity: IConfectionProductionJournalEntryEntity
  ): Result<ConfectionProductionJournalEntry> {
    const baseId = Helpers.getJournalBaseId(id);

    return Helpers.parseConfectionRecipeVariationId(entity.variationId)
      .withErrorFormat((msg) => `journal ${id}: ${msg}`)
      .onSuccess((parsed) => {
        return context.confections
          .get(parsed.collectionId)
          .asResult.withErrorFormat((msg) => `journal ${id}: ${msg}`)
          .onSuccess((confection) => {
            return confection
              .getVariation(parsed.itemId)
              .withErrorFormat((msg) => `journal ${id}: ${msg}`)
              .onSuccess((version) => {
                // TODO: Materialize updated version if present
                const updated = undefined;
                return succeed(
                  new ConfectionProductionJournalEntry(
                    context,
                    id,
                    baseId,
                    entity,
                    confection,
                    version,
                    updated
                  )
                );
              });
          });
      });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Factory function to create a materialized journal entry from an entity.
 * Dispatches to the appropriate concrete class based on entry type.
 * @param context - Session context for resolving references
 * @param id - Composite journal entry ID
 * @param entity - Journal entry entity to materialize
 * @returns Result with materialized journal entry
 * @internal
 */
export function createJournalEntry(
  context: ISessionContext,
  id: JournalId,
  entity: AnyJournalEntryEntity
): Result<AnyJournalEntry> {
  if (JournalEntities.isFillingEditJournalEntryEntity(entity)) {
    return FillingEditJournalEntry.create(context, id, entity);
  }

  if (JournalEntities.isConfectionEditJournalEntryEntity(entity)) {
    return ConfectionEditJournalEntry.create(context, id, entity);
  }

  if (JournalEntities.isFillingProductionJournalEntryEntity(entity)) {
    return FillingProductionJournalEntry.create(context, id, entity);
  }

  if (JournalEntities.isConfectionProductionJournalEntryEntity(entity)) {
    return ConfectionProductionJournalEntry.create(context, id, entity);
  }

  return fail(`Unknown journal entry type for ${id}`);
}
