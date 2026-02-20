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
 * Reference scanner for cross-entity composite ID references.
 *
 * Used before move/delete operations to surface entities that reference
 * the entity being moved or deleted, so the UI can warn the user.
 *
 * @packageDocumentation
 */

import { LibraryRuntime, type Entities, type IngredientId, type Model } from '@fgv/ts-chocolate';

// ============================================================================
// Reference Hit
// ============================================================================

/**
 * A single entity that references the target composite ID.
 * @public
 */
export interface IEntityReferenceHit {
  /**
   * The composite ID of the referencing entity (e.g., "myCollection.ganache-v1").
   */
  readonly compositeId: string;

  /**
   * Human-readable entity type label (e.g., "filling", "confection").
   */
  readonly entityType: string;

  /**
   * Display name of the referencing entity, if available.
   */
  readonly displayName: string | undefined;
}

// ============================================================================
// Reference Scan Result
// ============================================================================

/**
 * Result of scanning for references to a composite ID.
 * @public
 */
export interface IReferenceScanResult {
  /**
   * The composite ID that was searched for.
   */
  readonly targetId: string;

  /**
   * All entities found that reference the target ID.
   */
  readonly hits: ReadonlyArray<IEntityReferenceHit>;

  /**
   * True if any references were found.
   */
  readonly hasReferences: boolean;
}

// ============================================================================
// Reference Scanner
// ============================================================================

/**
 * Scans the chocolate entity library for cross-entity references to a given
 * composite ID. Used to warn users before move/delete operations that would
 * break references.
 *
 * Covered reference types:
 * - IngredientId referenced by: fillings (ingredient lists), confections (chocolate specs)
 * - FillingId referenced by: confections (filling slots)
 * - MoldId referenced by: confections (mold refs)
 * - DecorationId referenced by: confections (decoration refs)
 * - ProcedureId referenced by: confections (procedure refs)
 *
 * @public
 */
export class EntityReferenceScanner {
  private readonly _entities: LibraryRuntime.ChocolateEntityLibrary;

  public constructor(entities: LibraryRuntime.ChocolateEntityLibrary) {
    this._entities = entities;
  }

  /**
   * Scan all entity libraries for references to the given composite ID.
   * @param targetId - Composite ID to search for (e.g., "myCollection.dark-chocolate")
   * @returns Scan result with all referencing entities
   */
  public scan(targetId: string): IReferenceScanResult {
    const hits: IEntityReferenceHit[] = [];

    this._scanFillings(targetId, hits);
    this._scanConfections(targetId, hits);

    return {
      targetId,
      hits,
      hasReferences: hits.length > 0
    };
  }

  // ============================================================================
  // Filling Scanner
  // ============================================================================

  private _scanFillings(targetId: string, hits: IEntityReferenceHit[]): void {
    for (const [collectionId, collection] of this._entities.fillings.collections.entries()) {
      for (const [baseId, filling] of collection.items.entries()) {
        const compositeId = `${collectionId}.${baseId}`;
        if (this._fillingReferencesId(filling, targetId)) {
          hits.push({
            compositeId,
            entityType: 'filling',
            displayName: filling.name
          });
        }
      }
    }
  }

  private _fillingReferencesId(filling: Entities.Fillings.IFillingRecipeEntity, targetId: string): boolean {
    for (const variation of filling.variations) {
      for (const ingredient of variation.ingredients) {
        if (ingredient.ingredient.ids.includes(targetId as IngredientId)) {
          return true;
        }
      }
    }
    return false;
  }

  // ============================================================================
  // Confection Scanner
  // ============================================================================

  private _scanConfections(targetId: string, hits: IEntityReferenceHit[]): void {
    for (const [collectionId, collection] of this._entities.confections.collections.entries()) {
      for (const [baseId, confection] of collection.items.entries()) {
        const compositeId = `${collectionId}.${baseId}`;
        if (this._confectionReferencesId(confection, targetId)) {
          hits.push({
            compositeId,
            entityType: 'confection',
            displayName: confection.name
          });
        }
      }
    }
  }

  private _confectionReferencesId(
    confection: Entities.Confections.AnyConfectionRecipeEntity,
    targetId: string
  ): boolean {
    for (const variation of confection.variations) {
      if (this._variationReferencesId(variation, targetId)) {
        return true;
      }
    }
    return false;
  }

  private _variationReferencesId(
    variation: Entities.Confections.AnyConfectionRecipeVariationEntity,
    targetId: string
  ): boolean {
    // Check filling slots (present on all variation types)
    for (const slot of variation.fillings ?? []) {
      for (const option of slot.filling.options) {
        if (option.id === targetId) {
          return true;
        }
      }
    }

    // Check decoration refs
    for (const decorationRef of variation.decorations?.options ?? []) {
      if (decorationRef.id === targetId) {
        return true;
      }
    }

    // Check procedure refs
    for (const procedureRef of variation.procedures?.options ?? []) {
      if (procedureRef.id === targetId) {
        return true;
      }
    }

    // Check molded-bonbon-specific fields (molds + shell/additional chocolates)
    const moldedVariation = variation as Entities.Confections.IMoldedBonBonRecipeVariationEntity;
    if (moldedVariation.molds) {
      for (const moldRef of moldedVariation.molds.options) {
        if (moldRef.id === targetId) {
          return true;
        }
      }
      if (this._idsWithPreferredContains(moldedVariation.shellChocolate, targetId)) {
        return true;
      }
      for (const additionalChoc of moldedVariation.additionalChocolates ?? []) {
        if (this._idsWithPreferredContains(additionalChoc.chocolate, targetId)) {
          return true;
        }
      }
    }

    // Check bar-truffle enrobing chocolate
    const barVariation = variation as Entities.Confections.IBarTruffleRecipeVariationEntity;
    if (barVariation.enrobingChocolate) {
      if (this._idsWithPreferredContains(barVariation.enrobingChocolate, targetId)) {
        return true;
      }
    }

    // Check rolled-truffle enrobing chocolate + coatings
    const rolledVariation = variation as Entities.Confections.IRolledTruffleRecipeVariationEntity;
    if (rolledVariation.coatings) {
      if (this._idsWithPreferredContains(rolledVariation.enrobingChocolate, targetId)) {
        return true;
      }
      if (this._idsWithPreferredContains(rolledVariation.coatings, targetId)) {
        return true;
      }
    }

    return false;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private _idsWithPreferredContains(
    spec: Model.IIdsWithPreferred<string> | undefined,
    targetId: string
  ): boolean {
    if (!spec) {
      return false;
    }
    return spec.ids.includes(targetId);
  }
}
