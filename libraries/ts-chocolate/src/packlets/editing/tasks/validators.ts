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
 * Semantic validators for raw task entities.
 * These validators handle cross-field and business rule validation.
 * Type/format/constraint validation is handled by converters.
 * @packageDocumentation
 */

import { Result, Success, Failure } from '@fgv/ts-utils';
import { Tasks } from '../../entities';

type IRawTaskEntity = Tasks.IRawTaskEntity;

/**
 * Validate that the task name is non-empty.
 * @param entity - Raw task entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateTaskName(entity: IRawTaskEntity): Result<true> {
  if (entity.name.trim().length === 0) {
    return Failure.with('task name must not be empty');
  }
  return Success.with(true);
}

/**
 * Validate that the template is non-empty.
 * @param entity - Raw task entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateTaskTemplate(entity: IRawTaskEntity): Result<true> {
  if (entity.template.trim().length === 0) {
    return Failure.with('task template must not be empty');
  }
  return Success.with(true);
}

/**
 * Validate that default times are non-negative when present.
 * @param entity - Raw task entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateTaskTiming(entity: IRawTaskEntity): Result<true> {
  if (entity.defaultActiveTime !== undefined && entity.defaultActiveTime < 0) {
    return Failure.with(`defaultActiveTime must be non-negative (got ${entity.defaultActiveTime})`);
  }
  if (entity.defaultWaitTime !== undefined && entity.defaultWaitTime < 0) {
    return Failure.with(`defaultWaitTime must be non-negative (got ${entity.defaultWaitTime})`);
  }
  if (entity.defaultHoldTime !== undefined && entity.defaultHoldTime < 0) {
    return Failure.with(`defaultHoldTime must be non-negative (got ${entity.defaultHoldTime})`);
  }
  return Success.with(true);
}

/**
 * Validate entity-level constraints that span multiple fields.
 * This should be called after individual field validation.
 * @param entity - Complete raw task entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateRawTaskEntity(entity: IRawTaskEntity): Result<IRawTaskEntity> {
  return validateTaskName(entity)
    .onSuccess(() => validateTaskTemplate(entity))
    .onSuccess(() => validateTaskTiming(entity))
    .onSuccess(() => Success.with(entity));
}
