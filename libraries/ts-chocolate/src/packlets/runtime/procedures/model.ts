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
 * Runtime procedure model types
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import { BaseProcedureId, Minutes, ProcedureId, TaskId } from '../../common';
import { FillingCategory, IComputedScaledFillingRecipe } from '../../fillings';
import { IMold } from '../../molds';
import { IProcedure, IProcedureStep } from '../../procedures';
import { ITaskData } from '../../tasks';
import { RuntimeTask } from '../tasks';

// ============================================================================
// Runtime Procedure Context
// ============================================================================

/**
 * Minimal context interface for RuntimeProcedure.
 * Provides task resolution capabilities.
 * @internal
 */
export interface IProcedureContext {
  /**
   * Gets a task by its composite ID.
   * @param id - The task ID (composite format: sourceId.baseTaskId)
   * @returns Success with ITaskData, or Failure if not found
   */
  getTask(id: TaskId): Result<ITaskData>;

  /**
   * Gets a runtime task by its composite ID.
   * @param id - The task ID (composite format: sourceId.baseTaskId)
   * @returns Success with RuntimeTask, or Failure if not found
   */
  getRuntimeTask(id: TaskId): Result<RuntimeTask>;
}

// ============================================================================
// Runtime Procedure Render Context
// ============================================================================

/**
 * Context for rendering a procedure with full library access.
 *
 * Unlike the data-layer IProcedureRenderContext (which uses `unknown` for library),
 * this interface has properly typed library access for task resolution.
 *
 * @public
 */
export interface IRuntimeProcedureRenderContext {
  /**
   * The procedure context for task resolution.
   * This provides type-safe access to tasks, unlike the data-layer's `unknown` library.
   */
  readonly context: IProcedureContext;

  /**
   * The specific scaled filling recipe this procedure is being rendered for
   */
  readonly recipe: IComputedScaledFillingRecipe;

  /**
   * Optional mold being used for this recipe
   */
  readonly mold?: IMold;
}

// ============================================================================
// Runtime Rendered Step
// ============================================================================

/**
 * A rendered procedure step with resolved template values.
 * @public
 */
export interface IRuntimeRenderedStep extends IProcedureStep {
  /**
   * The rendered description with all template values resolved.
   * Unlike the data-layer placeholder, this contains actual rendered content.
   */
  readonly renderedDescription: string;

  /**
   * The resolved task that was used for rendering (if a task ref was used).
   * Undefined for inline tasks.
   */
  readonly resolvedTask?: RuntimeTask;
}

// ============================================================================
// Runtime Rendered Procedure
// ============================================================================

/**
 * A rendered procedure with all template values resolved.
 * @public
 */
export interface IRuntimeRenderedProcedure {
  /**
   * Name of the procedure
   */
  readonly name: string;

  /**
   * Optional description
   */
  readonly description?: string;

  /**
   * Rendered steps with resolved task templates
   */
  readonly steps: ReadonlyArray<IRuntimeRenderedStep>;

  /**
   * Total active time for all steps
   */
  readonly totalActiveTime?: Minutes;

  /**
   * Total wait time for all steps
   */
  readonly totalWaitTime?: Minutes;

  /**
   * Total hold time for all steps
   */
  readonly totalHoldTime?: Minutes;
}

// ============================================================================
// Runtime Procedure Interface
// ============================================================================

/**
 * A resolved runtime view of a procedure with rendering capabilities.
 *
 * This interface provides runtime-layer access to procedure data with:
 * - Composite identity (`id`, `sourceId`) for cross-source references
 * - Proper task resolution (not placeholders)
 * - Computed timing properties
 *
 * @public
 */
export interface IRuntimeProcedure {
  // ---- Composite Identity ----

  /**
   * The composite procedure ID (e.g., "common.ganache-basic").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: ProcedureId;

  /**
   * The base procedure ID within the source.
   */
  readonly baseId: BaseProcedureId;

  // ---- Core Properties ----

  /** Human-readable name */
  readonly name: string;

  /** Optional description */
  readonly description?: string;

  /** Optional category this procedure applies to */
  readonly category?: FillingCategory;

  /** Steps of the procedure in order */
  readonly steps: ReadonlyArray<IProcedureStep>;

  /** Optional tags */
  readonly tags?: ReadonlyArray<string>;

  /** Optional notes */
  readonly notes?: string;

  // ---- Computed Properties ----

  /** Total active time for all steps */
  readonly totalActiveTime: Minutes | undefined;

  /** Total wait time for all steps */
  readonly totalWaitTime: Minutes | undefined;

  /** Total hold time for all steps */
  readonly totalHoldTime: Minutes | undefined;

  /** Total time (active + wait + hold) */
  readonly totalTime: Minutes | undefined;

  /** Number of steps */
  readonly stepCount: number;

  /** Whether this procedure is category-specific */
  readonly isCategorySpecific: boolean;

  // ---- Operations ----

  /**
   * Renders the procedure with the given context.
   * Resolves task references to actual task content (not placeholders).
   * @param context - The render context with recipe and library access
   * @returns Success with rendered procedure, or Failure if rendering fails
   */
  render(context: IRuntimeProcedureRenderContext): Result<IRuntimeRenderedProcedure>;

  // ---- Raw Access ----

  /**
   * Gets the underlying raw procedure data.
   */
  readonly raw: IProcedure;
}
