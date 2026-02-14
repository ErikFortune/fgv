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

/* c8 ignore file - interface definitions only, no runtime code */

/**
 * Runtime decoration model types
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import {
  BaseDecorationId,
  DecorationId,
  IngredientId,
  Measurement,
  Model as CommonModel,
  ProcedureId
} from '../../common';
import { Decorations, Fillings, IDecorationEntity, IProcedureEntity } from '../../entities';
import type { AnyIngredient } from '../ingredients/ingredient';
import type { MaterializedLibrary } from '../materializedLibrary';
import type { Procedure } from '../procedures/procedure';

// ============================================================================
// Decoration Context
// ============================================================================

/**
 * Minimal context interface for Decoration.
 * Provides ingredient and procedure resolution capabilities.
 * @internal
 */
export interface IDecorationContext {
  /**
   * Resolves a runtime ingredient by ID.
   */
  _getIngredient(id: IngredientId): Result<AnyIngredient>;

  /**
   * Materialized library of runtime procedures.
   */
  readonly procedures: MaterializedLibrary<ProcedureId, IProcedureEntity, Procedure, never>;
}

// ============================================================================
// Resolved Decoration Ingredient
// ============================================================================

/**
 * A resolved decoration ingredient with runtime ingredient reference.
 * @public
 */
export interface IResolvedDecorationIngredient {
  /**
   * The resolved preferred ingredient.
   */
  readonly ingredient: AnyIngredient;

  /**
   * All ingredient IDs (including alternates).
   */
  readonly ingredientIds: CommonModel.IIdsWithPreferred<IngredientId>;

  /**
   * Amount of this ingredient in grams.
   */
  readonly amount: Measurement;

  /**
   * Optional categorized notes about this ingredient usage.
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

// ============================================================================
// Resolved Decoration Procedure
// ============================================================================

/**
 * A resolved procedure reference for a decoration.
 * @public
 */
export interface IResolvedDecorationProcedure {
  /** The procedure ID (for IOptionsWithPreferred compatibility) */
  readonly id: ProcedureId;
  /** The resolved procedure object */
  readonly procedure: Procedure;
  /** Optional notes specific to using this procedure */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** The original procedure reference entity data */
  readonly entity: Fillings.IProcedureRefEntity;
}

// ============================================================================
// Decoration Interface
// ============================================================================

/**
 * A resolved view of a decoration with materialized ingredient and procedure references.
 *
 * This interface provides runtime-layer access to decoration data with:
 * - Composite identity (`id`, `baseId`) for cross-source references
 * - Resolved ingredient references (preferred ingredient materialized)
 * - Resolved procedure references (lazily materialized)
 * - Ratings, notes, and tags
 *
 * @public
 */
export interface IDecoration {
  // ---- Composite Identity ----

  /**
   * The composite decoration ID (e.g., "common.gold-leaf-accent").
   */
  readonly id: DecorationId;

  /**
   * The base decoration ID within the source.
   */
  readonly baseId: BaseDecorationId;

  // ---- Core Properties ----

  /** Human-readable name */
  readonly name: string;

  /** Optional description */
  readonly description?: string;

  /** Resolved ingredients with materialized preferred ingredient */
  readonly ingredients: ReadonlyArray<IResolvedDecorationIngredient>;

  /** Optional resolved procedures with preferred selection */
  readonly procedures?: CommonModel.IOptionsWithPreferred<IResolvedDecorationProcedure, ProcedureId>;

  /** Optional ratings */
  readonly ratings?: ReadonlyArray<Decorations.IDecorationRating>;

  /** Optional tags */
  readonly tags?: ReadonlyArray<string>;

  /** Optional categorized notes */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

  // ---- Entity Access ----

  /**
   * Gets the underlying decoration data entity.
   */
  readonly entity: IDecorationEntity;
}
