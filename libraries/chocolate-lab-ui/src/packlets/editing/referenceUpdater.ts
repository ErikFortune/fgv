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
 * Reference updater for rewriting cross-entity composite ID references.
 *
 * Used after collection rename/merge operations to update all entities that
 * reference items in the renamed/merged collection.
 *
 * @packageDocumentation
 */

import { type Result, succeed, fail, MessageAggregator } from '@fgv/ts-utils';
import { LibraryRuntime, type Entities, type Model } from '@fgv/ts-chocolate';

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result of updating entity references.
 * @public
 */
export interface IReferenceUpdateResult {
  /** Number of entities that were modified */
  readonly updatedEntityCount: number;
  /** Total number of individual ID references that were rewritten */
  readonly updatedReferenceCount: number;
}

// ============================================================================
// ID Rewriter
// ============================================================================

/**
 * Function that maps an old composite ID to a new one, or returns undefined
 * if the ID should not be changed.
 */
type IdRewriter = (id: string) => string | undefined;

/**
 * Creates an ID rewriter that replaces a collection prefix.
 * E.g., "oldCollection.foo" → "newCollection.foo"
 */
function collectionPrefixRewriter(oldCollectionId: string, newCollectionId: string): IdRewriter {
  const oldPrefix = `${oldCollectionId}.`;
  const newPrefix = `${newCollectionId}.`;
  return (id: string): string | undefined => {
    if (id.startsWith(oldPrefix)) {
      return newPrefix + id.slice(oldPrefix.length);
    }
    return undefined;
  };
}

/**
 * Creates an ID rewriter from an explicit mapping.
 */
function mappingRewriter(idMapping: ReadonlyMap<string, string>): IdRewriter {
  return (id: string): string | undefined => {
    return idMapping.get(id);
  };
}

// ============================================================================
// Entity Reference Updater
// ============================================================================

/**
 * Updates cross-entity composite ID references throughout the chocolate entity library.
 *
 * Walks all filling and confection entities, creates modified copies with
 * rewritten composite IDs, and replaces them in their owning collections.
 *
 * @public
 */
export class EntityReferenceUpdater {
  private readonly _entities: LibraryRuntime.ChocolateEntityLibrary;

  public constructor(entities: LibraryRuntime.ChocolateEntityLibrary) {
    this._entities = entities;
  }

  /**
   * Update all references from one collection's composite IDs to another.
   *
   * Rewrites any composite ID starting with `oldCollectionId.` to start with
   * `newCollectionId.` instead. Used after collection rename.
   *
   * @param oldCollectionId - The old collection prefix to search for
   * @param newCollectionId - The new collection prefix to replace with
   * @returns Result with update statistics
   */
  public updateCollectionReferences(
    oldCollectionId: string,
    newCollectionId: string
  ): Result<IReferenceUpdateResult> {
    return this._updateWithRewriter(collectionPrefixRewriter(oldCollectionId, newCollectionId));
  }

  /**
   * Update references using an explicit ID mapping.
   *
   * Rewrites any composite ID found as a key in the mapping to its corresponding
   * value. Used after collection merge with renamed items.
   *
   * @param idMapping - Map of old composite IDs to new composite IDs
   * @returns Result with update statistics
   */
  public updateEntityReferences(idMapping: ReadonlyMap<string, string>): Result<IReferenceUpdateResult> {
    if (idMapping.size === 0) {
      return succeed({ updatedEntityCount: 0, updatedReferenceCount: 0 });
    }
    return this._updateWithRewriter(mappingRewriter(idMapping));
  }

  // ============================================================================
  // Core Update Logic
  // ============================================================================

  private _updateWithRewriter(rewrite: IdRewriter): Result<IReferenceUpdateResult> {
    const errors = new MessageAggregator();
    let updatedEntityCount = 0;
    let updatedReferenceCount = 0;

    // Update fillings
    const fillingResult = this._updateFillings(rewrite);
    if (fillingResult.isFailure()) {
      errors.addMessage(fillingResult.message);
    } else {
      updatedEntityCount += fillingResult.value.updatedEntityCount;
      updatedReferenceCount += fillingResult.value.updatedReferenceCount;
    }

    // Update confections
    const confectionResult = this._updateConfections(rewrite);
    if (confectionResult.isFailure()) {
      errors.addMessage(confectionResult.message);
    } else {
      updatedEntityCount += confectionResult.value.updatedEntityCount;
      updatedReferenceCount += confectionResult.value.updatedReferenceCount;
    }

    if (errors.hasMessages) {
      return fail(`Failed to update references: ${errors.toString('; ')}`);
    }

    return succeed({ updatedEntityCount, updatedReferenceCount });
  }

  // ============================================================================
  // Filling Updates
  // ============================================================================

  private _updateFillings(rewrite: IdRewriter): Result<IReferenceUpdateResult> {
    let updatedEntityCount = 0;
    let updatedReferenceCount = 0;
    const errors = new MessageAggregator();

    for (const [collectionId, collection] of this._entities.fillings.collections.entries()) {
      if (!collection.isMutable) continue;

      for (const [baseId, filling] of collection.items.entries()) {
        const result = this._rewriteFilling(filling, rewrite);
        if (result.refCount > 0) {
          const setResult = this._entities.fillings.setInCollection(collectionId, baseId, result.entity);
          if (setResult.isFailure()) {
            errors.addMessage(`Failed to update filling ${collectionId}.${baseId}: ${setResult.message}`);
          } else {
            updatedEntityCount++;
            updatedReferenceCount += result.refCount;
          }
        }
      }
    }

    if (errors.hasMessages) {
      return fail(errors.toString('; '));
    }
    return succeed({ updatedEntityCount, updatedReferenceCount });
  }

  private _rewriteFilling(
    filling: Entities.Fillings.IFillingRecipeEntity,
    rewrite: IdRewriter
  ): { entity: Entities.Fillings.IFillingRecipeEntity; refCount: number } {
    let refCount = 0;

    const variations = filling.variations.map((variation) => {
      const ingredients = variation.ingredients.map((ing) => {
        const rewritten = this._rewriteIdsWithPreferred(ing.ingredient, rewrite);
        refCount += rewritten.refCount;
        if (rewritten.refCount > 0) {
          return { ...ing, ingredient: rewritten.value };
        }
        return ing;
      });

      const procedures = variation.procedures
        ? this._rewriteOptionsWithPreferred(variation.procedures, rewrite)
        : undefined;
      if (procedures) {
        refCount += procedures.refCount;
      }

      if (refCount > 0) {
        return {
          ...variation,
          ingredients,
          ...(procedures && procedures.refCount > 0 ? { procedures: procedures.value } : {})
        };
      }
      return variation;
    });

    if (refCount > 0) {
      return { entity: { ...filling, variations }, refCount };
    }
    return { entity: filling, refCount: 0 };
  }

  // ============================================================================
  // Confection Updates
  // ============================================================================

  private _updateConfections(rewrite: IdRewriter): Result<IReferenceUpdateResult> {
    let updatedEntityCount = 0;
    let updatedReferenceCount = 0;
    const errors = new MessageAggregator();

    for (const [collectionId, collection] of this._entities.confections.collections.entries()) {
      if (!collection.isMutable) continue;

      for (const [baseId, confection] of collection.items.entries()) {
        const result = this._rewriteConfection(confection, rewrite);
        if (result.refCount > 0) {
          const setResult = this._entities.confections.setInCollection(collectionId, baseId, result.entity);
          if (setResult.isFailure()) {
            errors.addMessage(`Failed to update confection ${collectionId}.${baseId}: ${setResult.message}`);
          } else {
            updatedEntityCount++;
            updatedReferenceCount += result.refCount;
          }
        }
      }
    }

    if (errors.hasMessages) {
      return fail(errors.toString('; '));
    }
    return succeed({ updatedEntityCount, updatedReferenceCount });
  }

  private _rewriteConfection(
    confection: Entities.Confections.AnyConfectionRecipeEntity,
    rewrite: IdRewriter
  ): { entity: Entities.Confections.AnyConfectionRecipeEntity; refCount: number } {
    let totalRefCount = 0;

    const variations = confection.variations.map((variation) => {
      const result = this._rewriteConfectionVariation(variation, rewrite);
      totalRefCount += result.refCount;
      return result.refCount > 0 ? result.value : variation;
    });

    if (totalRefCount > 0) {
      return {
        entity: { ...confection, variations } as Entities.Confections.AnyConfectionRecipeEntity,
        refCount: totalRefCount
      };
    }
    return { entity: confection, refCount: 0 };
  }

  private _rewriteConfectionVariation(
    variation: Entities.Confections.AnyConfectionRecipeVariationEntity,
    rewrite: IdRewriter
  ): { value: Entities.Confections.AnyConfectionRecipeVariationEntity; refCount: number } {
    let refCount = 0;
    const updates: Record<string, unknown> = {};

    // Filling slots
    if (variation.fillings) {
      const fillings = variation.fillings.map((slot) => {
        const rewritten = this._rewriteOptionsWithPreferred(slot.filling, rewrite);
        if (rewritten.refCount > 0) {
          refCount += rewritten.refCount;
          return { ...slot, filling: rewritten.value };
        }
        return slot;
      });
      if (refCount > 0) {
        updates.fillings = fillings;
      }
    }

    // Decorations
    if (variation.decorations) {
      const rewritten = this._rewriteOptionsWithPreferred(variation.decorations, rewrite);
      if (rewritten.refCount > 0) {
        refCount += rewritten.refCount;
        updates.decorations = rewritten.value;
      }
    }

    // Procedures
    if (variation.procedures) {
      const rewritten = this._rewriteOptionsWithPreferred(variation.procedures, rewrite);
      if (rewritten.refCount > 0) {
        refCount += rewritten.refCount;
        updates.procedures = rewritten.value;
      }
    }

    // Molded-bonbon-specific fields
    const moldedVariation = variation as Entities.Confections.IMoldedBonBonRecipeVariationEntity;
    if (moldedVariation.molds) {
      const moldsRewritten = this._rewriteOptionsWithPreferred(moldedVariation.molds, rewrite);
      if (moldsRewritten.refCount > 0) {
        refCount += moldsRewritten.refCount;
        updates.molds = moldsRewritten.value;
      }

      const shellRewritten = this._rewriteIdsWithPreferred(moldedVariation.shellChocolate, rewrite);
      if (shellRewritten.refCount > 0) {
        refCount += shellRewritten.refCount;
        updates.shellChocolate = shellRewritten.value;
      }

      if (moldedVariation.additionalChocolates) {
        let additionalChanged = false;
        const additionalChocolates = moldedVariation.additionalChocolates.map((ac) => {
          const chocRewritten = this._rewriteIdsWithPreferred(ac.chocolate, rewrite);
          if (chocRewritten.refCount > 0) {
            refCount += chocRewritten.refCount;
            additionalChanged = true;
            return { ...ac, chocolate: chocRewritten.value };
          }
          return ac;
        });
        if (additionalChanged) {
          updates.additionalChocolates = additionalChocolates;
        }
      }
    }

    // Bar-truffle enrobing chocolate
    const barVariation = variation as Entities.Confections.IBarTruffleRecipeVariationEntity;
    if (barVariation.enrobingChocolate) {
      const rewritten = this._rewriteIdsWithPreferred(barVariation.enrobingChocolate, rewrite);
      if (rewritten.refCount > 0) {
        refCount += rewritten.refCount;
        updates.enrobingChocolate = rewritten.value;
      }
    }

    // Rolled-truffle enrobing chocolate + coatings
    const rolledVariation = variation as Entities.Confections.IRolledTruffleRecipeVariationEntity;
    if (rolledVariation.coatings) {
      const enrobingRewritten = this._rewriteIdsWithPreferred(rolledVariation.enrobingChocolate, rewrite);
      if (enrobingRewritten.refCount > 0) {
        refCount += enrobingRewritten.refCount;
        updates.enrobingChocolate = enrobingRewritten.value;
      }

      const coatingsRewritten = this._rewriteIdsWithPreferred(rolledVariation.coatings, rewrite);
      if (coatingsRewritten.refCount > 0) {
        refCount += coatingsRewritten.refCount;
        updates.coatings = coatingsRewritten.value;
      }
    }

    if (refCount > 0) {
      return {
        value: { ...variation, ...updates } as Entities.Confections.AnyConfectionRecipeVariationEntity,
        refCount
      };
    }
    return { value: variation, refCount: 0 };
  }

  // ============================================================================
  // Generic ID Rewriting Helpers
  // ============================================================================

  /**
   * Rewrite IDs in an IIdsWithPreferred structure.
   */
  private _rewriteIdsWithPreferred<TId extends string>(
    spec: Model.IIdsWithPreferred<TId> | undefined,
    rewrite: IdRewriter
  ): { value: Model.IIdsWithPreferred<TId>; refCount: number } {
    if (!spec) {
      return { value: spec as unknown as Model.IIdsWithPreferred<TId>, refCount: 0 };
    }
    let refCount = 0;
    const ids = spec.ids.map((id) => {
      const newId = rewrite(id);
      if (newId !== undefined) {
        refCount++;
        return newId as TId;
      }
      return id;
    });
    const preferredId = spec.preferredId
      ? (rewrite(spec.preferredId) as TId | undefined) ?? spec.preferredId
      : undefined;
    if (preferredId !== spec.preferredId) {
      refCount++;
    }

    if (refCount > 0) {
      return {
        value: { ...spec, ids, ...(preferredId !== undefined ? { preferredId } : {}) },
        refCount
      };
    }
    return { value: spec, refCount: 0 };
  }

  /**
   * Rewrite IDs in an IOptionsWithPreferred structure.
   */
  private _rewriteOptionsWithPreferred<TOption extends Model.IHasId<TId>, TId extends string>(
    spec: Model.IOptionsWithPreferred<TOption, TId>,
    rewrite: IdRewriter
  ): { value: Model.IOptionsWithPreferred<TOption, TId>; refCount: number } {
    let refCount = 0;
    const options = spec.options.map((option) => {
      const newId = rewrite(option.id);
      if (newId !== undefined) {
        refCount++;
        return { ...option, id: newId as TId };
      }
      return option;
    });
    const preferredId = spec.preferredId
      ? (rewrite(spec.preferredId) as TId | undefined) ?? spec.preferredId
      : undefined;
    if (preferredId !== spec.preferredId) {
      refCount++;
    }

    if (refCount > 0) {
      return {
        value: { ...spec, options, ...(preferredId !== undefined ? { preferredId } : {}) },
        refCount
      };
    }
    return { value: spec, refCount: 0 };
  }
}
