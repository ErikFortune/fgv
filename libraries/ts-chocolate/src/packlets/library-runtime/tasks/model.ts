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
 * Runtime task model types
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import { BaseTaskId, Celsius, ICategorizedNote, Minutes, TaskId } from '../../common';
import { ITaskData, ITaskRefValidation } from '../../entities';

// ============================================================================
// Runtime Task Context
// ============================================================================

/**
 * Minimal context interface for RuntimeTask.
 * Provides task resolution capabilities.
 * @internal
 */
export interface ITaskContext {
  /**
   * Gets a task by its composite ID.
   * @param id - The task ID (composite format: sourceId.baseTaskId)
   * @returns Success with ITaskData, or Failure if not found
   */
  getTask(id: TaskId): Result<ITaskData>;
}

// ============================================================================
// Runtime Task Interface
// ============================================================================

/**
 * A resolved runtime view of a task with rendering capabilities.
 *
 * This interface provides runtime-layer access to task data with:
 * - Composite identity (`id`, `sourceId`) for cross-source references
 * - Rendering with library context
 * - Parameter validation
 *
 * @public
 */
export interface IRuntimeTask {
  // ---- Composite Identity ----

  /**
   * The composite task ID (e.g., "common.melt-chocolate").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: TaskId;

  /**
   * The base task ID within the source.
   */
  readonly baseId: BaseTaskId;

  // ---- Core Properties ----

  /** Human-readable name */
  readonly name: string;

  /** The Mustache template string */
  readonly template: string;

  /** Required variables extracted from the template */
  readonly requiredVariables: ReadonlyArray<string>;

  /** Optional default active time */
  readonly defaultActiveTime?: Minutes;

  /** Optional default wait time */
  readonly defaultWaitTime?: Minutes;

  /** Optional default hold time */
  readonly defaultHoldTime?: Minutes;

  /** Optional default temperature */
  readonly defaultTemperature?: Celsius;

  /** Optional categorized notes */
  readonly notes?: ReadonlyArray<ICategorizedNote>;

  /** Optional tags */
  readonly tags?: ReadonlyArray<string>;

  /** Optional default values for template placeholders */
  readonly defaults?: Readonly<Record<string, unknown>>;

  // ---- Operations ----

  /**
   * Validates that params (combined with defaults) satisfy required variables.
   * @param params - The parameter values to validate
   * @returns Validation result with details about present/missing variables
   */
  validateParams(params: Record<string, unknown>): Result<ITaskRefValidation>;

  /**
   * Renders the task template with the given params (merged with defaults).
   * @param params - The parameter values for template rendering
   * @returns Success with rendered string, or Failure if rendering fails
   */
  render(params: Record<string, unknown>): Result<string>;

  /**
   * Validates params and renders the template if validation passes.
   * @param params - The parameter values to validate and render with
   * @returns Success with rendered string, or Failure with validation or render errors
   */
  validateAndRender(params: Record<string, unknown>): Result<string>;

  // ---- Raw Access ----

  /**
   * Gets the underlying raw task data.
   */
  readonly raw: ITaskData;
}
