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
 * Internal utility for resolving confection-related references
 * @packageDocumentation
 */

import { ConfectionId, MoldId, ProcedureId, Model as CommonModel } from '../../common';
import { Confections, Fillings } from '../../entities';
import {
  IChocolateIngredient,
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedCoatingOption,
  IResolvedCoatings,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IResolvedFillingOption,
  IResolvedFillingSlot
} from '../model';

/**
 * Resolves a chocolate specification to runtime ingredient objects.
 * @param context - The confection context with materialized libraries
 * @param spec - The chocolate entity specification
 * @param confectionId - The confection ID (for error messages)
 * @returns Resolved chocolate specification with primary chocolate + alternates
 * @internal
 */
export function resolveChocolateSpec(
  context: IConfectionContext,
  spec: Confections.IChocolateSpec,
  confectionId: ConfectionId
): IResolvedChocolateSpec {
  const primaryId = spec.preferredId ?? spec.ids[0];
  const primaryResult = context.ingredients.get(primaryId);

  /* c8 ignore next 3 - defensive: library validation ensures chocolate ingredients exist */
  if (primaryResult.isFailure() || !primaryResult.value.isChocolate()) {
    throw new Error(`Failed to resolve primary chocolate ${primaryId} for confection ${confectionId}`);
  }

  const chocolate = primaryResult.value;

  const alternates: IChocolateIngredient[] = [];
  for (const id of spec.ids) {
    /* c8 ignore next 6 - defensive: skip alternates that fail to resolve or aren't chocolate */
    if (id !== primaryId) {
      const altResult = context.ingredients.get(id);
      if (altResult.isSuccess() && altResult.value.isChocolate()) {
        alternates.push(altResult.value);
      }
    }
  }

  return {
    chocolate,
    alternates,
    entity: spec
  };
}

/**
 * Resolves coating specifications to runtime ingredient objects.
 * @param context - The confection context with materialized libraries
 * @param coatings - The coatings entity specification
 * @returns Resolved coatings specification
 * @internal
 */
export function resolveCoatings(
  context: IConfectionContext,
  coatings: Confections.ICoatingsEntity
): IResolvedCoatings {
  const resolvedOptions: IResolvedCoatingOption[] = [];
  for (const id of coatings.ids) {
    const ingredientResult = context.ingredients.get(id);
    if (ingredientResult.isSuccess()) {
      resolvedOptions.push({
        id,
        ingredient: ingredientResult.value
      });
    }
  }

  const preferredId = coatings.preferredId ?? coatings.ids[0];
  const preferred = resolvedOptions.find((opt) => opt.id === preferredId);

  return {
    options: resolvedOptions,
    preferred,
    entity: coatings
  };
}

/**
 * Resolves mold references to runtime mold objects.
 * @param context - The confection context with materialized libraries
 * @param molds - The mold entity references with preferred selection
 * @returns Resolved mold references
 * @internal
 */
export function resolveMoldRefs(
  context: IConfectionContext,
  molds: CommonModel.IOptionsWithPreferred<Confections.IConfectionMoldRef, MoldId>
): CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
  const resolvedOptions: IResolvedConfectionMoldRef[] = [];
  for (const ref of molds.options) {
    const moldResult = context.molds.get(ref.id);
    if (moldResult.isSuccess()) {
      resolvedOptions.push({
        id: ref.id,
        mold: moldResult.value,
        notes: ref.notes,
        entity: ref
      });
    }
  }

  return {
    options: resolvedOptions,
    preferredId: molds.preferredId
  };
}

/**
 * Resolves additional chocolates to runtime objects.
 * @param context - The confection context with materialized libraries
 * @param additional - The additional chocolates entities
 * @param confectionId - The confection ID (for error messages)
 * @returns Resolved additional chocolates, or undefined if none
 * @internal
 */
export function resolveAdditionalChocolates(
  context: IConfectionContext,
  additional: ReadonlyArray<Confections.IAdditionalChocolateEntity> | undefined,
  confectionId: ConfectionId
): ReadonlyArray<IResolvedAdditionalChocolate> | undefined {
  if (!additional || additional.length === 0) {
    return undefined;
  }

  return additional.map((item) => ({
    chocolate: resolveChocolateSpec(context, item.chocolate, confectionId),
    purpose: item.purpose,
    entity: item
  }));
}

/**
 * Resolves filling slots to runtime objects.
 * @param context - The confection context with materialized libraries
 * @param slots - The filling slots entities
 * @returns Resolved filling slots, or undefined if none
 * @internal
 */
export function resolveFillingSlots(
  context: IConfectionContext,
  slots: ReadonlyArray<Confections.IFillingSlotEntity> | undefined
): ReadonlyArray<IResolvedFillingSlot> | undefined {
  if (!slots || slots.length === 0) {
    return undefined;
  }

  return slots.map((slot) => ({
    slotId: slot.slotId,
    name: slot.name,
    filling: resolveFillingOptions(context, slot.filling)
  }));
}

/**
 * Resolves procedure references to runtime objects.
 * @param context - The confection context with materialized libraries
 * @param procedures - The procedure reference entities
 * @returns Resolved procedures, or undefined if none
 * @internal
 */
export function resolveProcedures(
  context: IConfectionContext,
  procedures: CommonModel.IOptionsWithPreferred<Fillings.IProcedureRefEntity, ProcedureId> | undefined
): CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined {
  if (!procedures || procedures.options.length === 0) {
    return undefined;
  }

  const resolvedOptions: IResolvedConfectionProcedure[] = [];
  for (const ref of procedures.options) {
    const procedureResult = context.procedures.get(ref.id);
    if (procedureResult.isSuccess()) {
      resolvedOptions.push({
        id: ref.id,
        procedure: procedureResult.value,
        notes: ref.notes,
        entity: ref
      });
    }
  }

  /* c8 ignore next 4 - defensive: return undefined if all procedures failed to resolve */
  if (resolvedOptions.length === 0) {
    return undefined;
  }

  return {
    options: resolvedOptions,
    preferredId: procedures.preferredId
  };
}

/**
 * Resolves filling options for a filling slot.
 * @param context - The confection context with materialized libraries
 * @param options - The raw filling options to resolve
 * @returns Resolved filling options
 * @internal
 */
function resolveFillingOptions(
  context: IConfectionContext,
  options: CommonModel.IOptionsWithPreferred<Confections.AnyFillingOptionEntity, Confections.FillingOptionId>
): CommonModel.IOptionsWithPreferred<IResolvedFillingOption, Confections.FillingOptionId> {
  const resolvedOptions = options.options
    .map((opt) => resolveFillingOption(context, opt))
    .filter((r): r is IResolvedFillingOption => r !== undefined);

  return {
    options: resolvedOptions,
    preferredId: options.preferredId
  };
}

/**
 * Resolves a single filling option.
 * @param context - The confection context with materialized libraries
 * @param option - The filling option to resolve
 * @returns Resolved filling option, or undefined if resolution fails
 * @internal
 */
function resolveFillingOption(
  context: IConfectionContext,
  option: Confections.AnyFillingOptionEntity
): IResolvedFillingOption | undefined {
  if (option.type === 'ingredient') {
    const ingredientResult = context.ingredients.get(option.id);
    if (ingredientResult.isFailure()) {
      return undefined;
    }
    return {
      type: 'ingredient',
      id: option.id,
      ingredient: ingredientResult.value,
      entity: option
    };
  }

  const recipeResult = context.fillings.get(option.id);
  if (recipeResult.isFailure()) {
    return undefined;
  }
  return {
    type: 'recipe',
    id: option.id,
    filling: recipeResult.value,
    entity: option
  };
}
