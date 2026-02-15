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
 * Semantic validators for mold entities.
 * These validators handle cross-field and business rule validation.
 * Type/format/constraint validation is handled by converters.
 * @packageDocumentation
 */

import { Result, Success, Failure } from '@fgv/ts-utils';
import { Molds } from '../../entities';

type IMoldEntity = Molds.IMoldEntity;

/**
 * Validate cavity counts are positive.
 * @param entity - Mold entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateCavities(entity: IMoldEntity): Result<true> {
  const cavities = entity.cavities;

  if (cavities.kind === 'grid') {
    if (cavities.columns < 1) {
      return Failure.with(`cavities.columns must be at least 1 (got ${cavities.columns})`);
    }
    if (cavities.rows < 1) {
      return Failure.with(`cavities.rows must be at least 1 (got ${cavities.rows})`);
    }
  } else {
    if (cavities.count < 1) {
      return Failure.with(`cavities.count must be at least 1 (got ${cavities.count})`);
    }
  }

  return Success.with(true);
}

/**
 * Validate cavity dimensions are positive when present.
 * @param entity - Mold entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateCavityDimensions(entity: IMoldEntity): Result<true> {
  const dims = entity.cavities.info?.dimensions;
  if (!dims) {
    return Success.with(true);
  }

  if (dims.width <= 0) {
    return Failure.with(`cavities.info.dimensions.width must be positive (got ${dims.width})`);
  }
  if (dims.length <= 0) {
    return Failure.with(`cavities.info.dimensions.length must be positive (got ${dims.length})`);
  }
  if (dims.depth <= 0) {
    return Failure.with(`cavities.info.dimensions.depth must be positive (got ${dims.depth})`);
  }

  return Success.with(true);
}

/**
 * Validate cavity weight is positive when present.
 * @param entity - Mold entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateCavityWeight(entity: IMoldEntity): Result<true> {
  const weight = entity.cavities.info?.weight;
  if (weight === undefined) {
    return Success.with(true);
  }

  if (weight <= 0) {
    return Failure.with(`cavities.info.weight must be positive (got ${weight})`);
  }

  return Success.with(true);
}

/**
 * Validate entity-level constraints that span multiple fields.
 * This should be called after individual field validation.
 * @param entity - Complete mold entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateMoldEntity(entity: IMoldEntity): Result<IMoldEntity> {
  return validateCavities(entity)
    .onSuccess(() => validateCavityDimensions(entity))
    .onSuccess(() => validateCavityWeight(entity))
    .onSuccess(() => Success.with(entity));
}
