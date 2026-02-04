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
 * RuntimeProcedure - resolved procedure view with proper task resolution
 * @packageDocumentation
 */

import { Result, Success, fail, succeed } from '@fgv/ts-utils';

import {
  BaseProcedureId,
  Minutes,
  Model as CommonModel,
  ProcedureId,
  ProcedureType,
  TaskId
} from '../../common';
import { IProcedure, IProcedureStep, Tasks } from '../../entities';
import { RuntimeTask } from '../tasks';
import {
  IProcedureContext,
  IRuntimeProcedure,
  IRuntimeProcedureRenderContext,
  IRuntimeRenderedProcedure,
  IRuntimeRenderedStep
} from './model';

// ============================================================================
// RuntimeProcedure Class
// ============================================================================

/**
 * A resolved view of a procedure with proper task resolution.
 *
 * RuntimeProcedure wraps a data-layer Procedure and provides:
 * - Composite identity (ProcedureId) for cross-source references
 * - Proper task resolution (not placeholders like the data-layer)
 * - Computed timing properties
 *
 * Unlike the data-layer Procedure.render() which returns `[Task: taskId]` placeholders,
 * RuntimeProcedure.render() actually resolves task references and renders their templates.
 *
 * @public
 */
export class RuntimeProcedure implements IRuntimeProcedure {
  private readonly _context: IProcedureContext;
  private readonly _id: ProcedureId;
  private readonly _procedure: IProcedure;

  private constructor(context: IProcedureContext, id: ProcedureId, procedure: IProcedure) {
    this._context = context;
    this._id = id;
    this._procedure = procedure;
  }

  /**
   * Factory method for creating a RuntimeProcedure.
   * @param context - The runtime context for task resolution
   * @param id - The composite procedure ID
   * @param procedure - The procedure data
   * @returns Success with RuntimeProcedure
   */
  public static create(
    context: IProcedureContext,
    id: ProcedureId,
    procedure: IProcedure
  ): Result<RuntimeProcedure> {
    return Success.with(new RuntimeProcedure(context, id, procedure));
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * The composite procedure ID (e.g., "common.ganache-basic")
   */
  public get id(): ProcedureId {
    return this._id;
  }

  /**
   * The base procedure ID within the source
   */
  public get baseId(): BaseProcedureId {
    return this._procedure.baseId;
  }

  // ============================================================================
  // Core Properties (passthrough to underlying Procedure)
  // ============================================================================

  /**
   * Human-readable name of the procedure
   */
  public get name(): string {
    return this._procedure.name;
  }

  /**
   * Optional description
   */
  public get description(): string | undefined {
    return this._procedure.description;
  }

  /**
   * Optional category this procedure applies to
   */
  public get category(): ProcedureType | undefined {
    return this._procedure.category;
  }

  /**
   * Steps of the procedure in order
   */
  public get steps(): ReadonlyArray<IProcedureStep> {
    return this._procedure.steps;
  }

  /**
   * Optional tags
   */
  public get tags(): ReadonlyArray<string> | undefined {
    return this._procedure.tags;
  }

  /**
   * Optional categorized notes
   */
  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
    return this._procedure.notes;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Total active time for all steps
   */
  public get totalActiveTime(): Minutes | undefined {
    const total = this._procedure.steps.reduce((sum, step) => sum + (step.activeTime ?? 0), 0);
    return total > 0 ? (total as Minutes) : undefined;
  }

  /**
   * Total wait time for all steps
   */
  public get totalWaitTime(): Minutes | undefined {
    const total = this._procedure.steps.reduce((sum, step) => sum + (step.waitTime ?? 0), 0);
    return total > 0 ? (total as Minutes) : undefined;
  }

  /**
   * Total hold time for all steps
   */
  public get totalHoldTime(): Minutes | undefined {
    const total = this._procedure.steps.reduce((sum, step) => sum + (step.holdTime ?? 0), 0);
    return total > 0 ? (total as Minutes) : undefined;
  }

  /**
   * Total time (active + wait + hold)
   */
  public get totalTime(): Minutes | undefined {
    const active = this.totalActiveTime ?? 0;
    const wait = this.totalWaitTime ?? 0;
    const hold = this.totalHoldTime ?? 0;
    const total = active + wait + hold;
    return total > 0 ? (total as Minutes) : undefined;
  }

  /**
   * Number of steps
   */
  public get stepCount(): number {
    return this._procedure.steps.length;
  }

  /**
   * Whether this procedure is category-specific
   */
  public get isCategorySpecific(): boolean {
    return this._procedure.category !== undefined;
  }

  // ============================================================================
  // Operations - This is the KEY fix: proper task resolution
  // ============================================================================

  /**
   * Renders the procedure with the given context.
   * Resolves task references to actual task content (not placeholders).
   *
   * This is the main difference from the data-layer Procedure.render():
   * - Data layer: Returns `[Task: taskId]` placeholders for task references
   * - Runtime layer: Actually resolves task references and renders templates
   *
   * @param renderContext - The render context with recipe and library access
   * @returns Success with rendered procedure, or Failure if rendering fails
   */
  public render(renderContext: IRuntimeProcedureRenderContext): Result<IRuntimeRenderedProcedure> {
    const renderedStepsResults: Result<IRuntimeRenderedStep>[] = this._procedure.steps.map((step) =>
      this._renderStep(renderContext, step)
    );

    // Collect all failures
    const failures = renderedStepsResults.filter((r) => r.isFailure());
    if (failures.length > 0) {
      return fail(`Failed to render procedure steps: ${failures.map((f) => f.message).join('; ')}`);
    }

    const renderedSteps = renderedStepsResults.map((r) => r.value as IRuntimeRenderedStep);

    return succeed({
      name: this.name,
      description: this.description,
      steps: renderedSteps,
      totalActiveTime: this.totalActiveTime,
      totalWaitTime: this.totalWaitTime,
      totalHoldTime: this.totalHoldTime
    });
  }

  /**
   * Renders a single step's task to produce the description.
   * Unlike the data-layer, this actually resolves task references.
   *
   * @param renderContext - The render context
   * @param step - The procedure step to render
   * @returns Success with rendered step, or Failure if rendering fails
   */
  private _renderStep(
    renderContext: IRuntimeProcedureRenderContext,
    step: IProcedureStep
  ): Result<IRuntimeRenderedStep> {
    const invocation = step.task;

    if (Tasks.isTaskRef(invocation)) {
      // KEY FIX: Actually resolve the task reference using the context
      // This is what the data-layer couldn't do (returned placeholder instead)
      return renderContext.context
        .getRuntimeTask(invocation.taskId as TaskId)
        .onSuccess((runtimeTask) => {
          return runtimeTask.render(invocation.params).onSuccess((renderedDescription) => {
            return succeed({
              ...step,
              renderedDescription,
              resolvedTask: runtimeTask
            });
          });
        })
        .onFailure((msg) => fail(`${invocation.taskId}: ${msg}`));
    }

    // TODO: can we lazy initialize and cache this task
    if (Tasks.isInlineTask(invocation)) {
      // For inline tasks, create a RuntimeTask with a synthetic ID
      const syntheticId = `${this._id}.inline-${step.order}` as TaskId;
      return RuntimeTask.create(renderContext.context, syntheticId, invocation.task).onSuccess(
        (runtimeTask) => {
          return runtimeTask.render(invocation.params).onSuccess((renderedDescription) => {
            return succeed({
              ...step,
              renderedDescription
              // No resolvedTask for inline tasks
            });
          });
        }
      );
    }
    /* c8 ignore next 2 - defensive code: type system prevents this path */
    return fail('Step has invalid task structure');
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw procedure data
   */
  public get raw(): IProcedure {
    return this._procedure;
  }

  // ============================================================================
  // Context Access (for advanced use cases)
  // ============================================================================

  /**
   * Gets the procedure context for resolving tasks.
   * @internal
   */
  /* c8 ignore next 3 - protected internal accessor for subclass use */
  protected get context(): IProcedureContext {
    return this._context;
  }
}
