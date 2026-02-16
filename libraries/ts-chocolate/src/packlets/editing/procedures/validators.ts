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
 * Semantic validators for procedure entities.
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { Procedures, Tasks } from '../../entities';

type IProcedureEntity = Procedures.IProcedureEntity;

/**
 * Validate that the procedure name is non-empty.
 * @param entity - Procedure entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateProcedureName(entity: IProcedureEntity): Result<true> {
  if (entity.name.trim().length === 0) {
    return Failure.with('procedure name must not be empty');
  }
  return Success.with(true);
}

/**
 * Validate that step order values are contiguous and 1-based.
 * @param entity - Procedure entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateStepOrder(entity: IProcedureEntity): Result<true> {
  for (let i = 0; i < entity.steps.length; i += 1) {
    const expected = i + 1;
    const actual = entity.steps[i]?.order;
    if (actual !== expected) {
      return Failure.with(
        `step order must be contiguous and 1-based (expected ${expected}, got ${String(actual)})`
      );
    }
  }
  return Success.with(true);
}

/**
 * Validate that each step has a non-empty task reference/inline template.
 * @param entity - Procedure entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateStepTaskContent(entity: IProcedureEntity): Result<true> {
  for (const step of entity.steps) {
    if (Tasks.isTaskRefEntity(step.task)) {
      if (step.task.taskId.trim().length === 0) {
        return Failure.with(`step ${step.order}: taskId must not be empty`);
      }
      continue;
    }

    if (step.task.task.name.trim().length === 0) {
      return Failure.with(`step ${step.order}: inline task name must not be empty`);
    }
    if (step.task.task.template.trim().length === 0) {
      return Failure.with(`step ${step.order}: inline task template must not be empty`);
    }
  }

  return Success.with(true);
}

/**
 * Validate entity-level constraints that span multiple fields.
 * @param entity - Complete procedure entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateProcedureEntity(entity: IProcedureEntity): Result<IProcedureEntity> {
  return validateProcedureName(entity)
    .onSuccess(() => validateStepOrder(entity))
    .onSuccess(() => validateStepTaskContent(entity))
    .onSuccess(() => Success.with(entity));
}
