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
 * Procedure - resolved procedure view with proper task resolution
 * @packageDocumentation
 */

import { Result, Success, fail, mapResults, succeed } from '@fgv/ts-utils';

import {
  BaseProcedureId,
  Minutes,
  Model as CommonModel,
  ProcedureId,
  ProcedureType,
  TaskId
} from '../../common';
import { IProcedureEntity, IProcedureStepEntity, Tasks } from '../../entities';
import { Task } from '../tasks';
import {
  IProcedureContext,
  IProcedure,
  IProcedureRenderContext,
  IRenderedProcedure,
  IRenderedStep,
  IResolvedProcedureStep
} from './model';

// ============================================================================
// Procedure Class
// ============================================================================

/**
 * A resolved view of a procedure with proper task resolution.
 *
 * Procedure wraps a data-layer Procedure and provides:
 * - Composite identity (ProcedureId) for cross-source references
 * - Proper task resolution (not placeholders like the data-layer)
 * - Computed timing properties
 *
 * Unlike the data-layer Procedure.render() which returns `[Task: taskId]` placeholders,
 * Procedure.render() actually resolves task references and renders their templates.
 *
 * @public
 */
export class Procedure implements IProcedure {
  private readonly _context: IProcedureContext;
  private readonly _id: ProcedureId;
  private readonly _procedure: IProcedureEntity;
  private _resolvedSteps: Result<ReadonlyArray<IResolvedProcedureStep>> | undefined;

  private constructor(context: IProcedureContext, id: ProcedureId, procedure: IProcedureEntity) {
    this._context = context;
    this._id = id;
    this._procedure = procedure;
  }

  /**
   * Factory method for creating a Procedure.
   * @param context - The runtime context for task resolution
   * @param id - The composite procedure ID
   * @param procedure - The procedure data
   * @returns Success with Procedure
   */
  public static create(
    context: IProcedureContext,
    id: ProcedureId,
    procedure: IProcedureEntity
  ): Result<Procedure> {
    return Success.with(new Procedure(context, id, procedure));
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
   * Gets the procedure steps with fully materialized runtime tasks.
   * Resolution is lazy (on first call) and cached.
   * @returns Success with resolved steps, or Failure if task materialization fails
   */
  public getSteps(): Result<ReadonlyArray<IResolvedProcedureStep>> {
    if (this._resolvedSteps === undefined) {
      this._resolvedSteps = mapResults(this._procedure.steps.map((step) => this._resolveStep(step)));
    }
    return this._resolvedSteps;
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
  public render(renderContext: IProcedureRenderContext): Result<IRenderedProcedure> {
    const suppliedParams = renderContext.params ?? {};
    return this.getSteps()
      .onSuccess((resolvedSteps) =>
        mapResults(resolvedSteps.map((step) => this._renderResolvedStep(step, suppliedParams)))
      )
      .onSuccess((renderedSteps) => {
        return succeed({
          name: this.name,
          description: this.description,
          steps: renderedSteps,
          totalActiveTime: this.totalActiveTime,
          totalWaitTime: this.totalWaitTime,
          totalHoldTime: this.totalHoldTime
        });
      });
  }

  /**
   * Resolves a single step's task invocation into a materialized step.
   * For task refs, looks up the runtime Task from the context.
   * For inline tasks, creates a runtime Task from the raw entity.
   *
   * @param step - The procedure step entity to resolve
   * @returns Success with resolved step, or Failure if task resolution fails
   */
  private _resolveStep(step: IProcedureStepEntity): Result<IResolvedProcedureStep> {
    const invocation = step.task;
    const stepFields = {
      order: step.order,
      activeTime: step.activeTime,
      waitTime: step.waitTime,
      holdTime: step.holdTime,
      temperature: step.temperature,
      notes: step.notes
    };

    if (Tasks.isTaskRefEntity(invocation)) {
      return this._context.tasks
        .get(invocation.taskId as TaskId)
        .asResult.withErrorFormat((msg) => `step ${step.order}: task ${invocation.taskId}: ${msg}`)
        .onSuccess((resolvedTask) => {
          return succeed({
            ...stepFields,
            resolvedTask,
            params: invocation.params,
            isInline: false
          });
        });
    }

    if (Tasks.isInlineTaskEntity(invocation)) {
      const syntheticId = `${this._id}.inline-${step.order}` as TaskId;
      return Task.create(this._context, syntheticId, invocation.task)
        .withErrorFormat((msg) => `step ${step.order}: inline task: ${msg}`)
        .onSuccess((resolvedTask) => {
          return succeed({
            ...stepFields,
            resolvedTask,
            params: invocation.params,
            isInline: true
          });
        });
    }
    /* c8 ignore next 2 - defensive code: type system prevents this path */
    return fail(`step ${step.order}: invalid task structure`);
  }

  /**
   * Renders a single resolved step by rendering its task template.
   *
   * @param resolvedStep - The resolved step with materialized task
   * @returns Success with rendered step, or Failure if rendering fails
   */
  private _renderResolvedStep(
    resolvedStep: IResolvedProcedureStep,
    suppliedParams: Readonly<Record<string, unknown>>
  ): Result<IRenderedStep> {
    const mergedParams: Record<string, unknown> = {
      ...resolvedStep.params,
      ...suppliedParams
    };

    return resolvedStep.resolvedTask
      .render(mergedParams)
      .withErrorFormat((msg) => `step ${resolvedStep.order}: ${msg}`)
      .onSuccess((renderedDescription) => {
        return succeed({
          ...resolvedStep,
          renderedDescription
        });
      });
  }

  /**
   * Gets the underlying procedure data entity
   */
  public get entity(): IProcedureEntity {
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
