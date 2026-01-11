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
 * Procedure class implementation
 * @packageDocumentation
 */

import { Result, Success, fail, succeed } from '@fgv/ts-utils';

import { BaseProcedureId, Minutes } from '../common';
import { FillingCategory } from '../fillings';
import { isInlineTask, isTaskRef, Task } from '../tasks';
import { IProcedure, IProcedureStep } from './model';
import { IProcedureRenderContext, IRenderedProcedure, IRenderedProcedureStep } from './renderContext';

// ============================================================================
// Procedure Class
// ============================================================================

/**
 * Procedure class with helper methods
 * @public
 */
export class Procedure implements IProcedure {
  public readonly baseId: BaseProcedureId;
  public readonly name: string;
  public readonly description?: string;
  public readonly category?: FillingCategory;
  public readonly steps: ReadonlyArray<IProcedureStep>;
  public readonly tags?: ReadonlyArray<string>;
  public readonly notes?: string;

  private constructor(data: IProcedure) {
    this.baseId = data.baseId;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.steps = data.steps;
    this.tags = data.tags;
    this.notes = data.notes;
  }

  /**
   * Creates a Procedure instance from procedure data
   * @param data - Procedure data
   * @returns Success with Procedure instance
   */
  public static create(data: IProcedure): Result<Procedure> {
    return Success.with(new Procedure(data));
  }

  /**
   * Gets the total active time for all steps
   * @returns Total active time in minutes, or undefined if no steps have active time
   */
  public get totalActiveTime(): Minutes | undefined {
    const total = this.steps.reduce((sum, step) => sum + (step.activeTime ?? 0), 0);
    return total > 0 ? (total as Minutes) : undefined;
  }

  /**
   * Gets the total wait time for all steps
   * @returns Total wait time in minutes, or undefined if no steps have wait time
   */
  public get totalWaitTime(): Minutes | undefined {
    const total = this.steps.reduce((sum, step) => sum + (step.waitTime ?? 0), 0);
    return total > 0 ? (total as Minutes) : undefined;
  }

  /**
   * Gets the total hold time for all steps
   * @returns Total hold time in minutes, or undefined if no steps have hold time
   */
  public get totalHoldTime(): Minutes | undefined {
    const total = this.steps.reduce((sum, step) => sum + (step.holdTime ?? 0), 0);
    return total > 0 ? (total as Minutes) : undefined;
  }

  /**
   * Gets the total time for all steps (active + wait + hold)
   * @returns Total time in minutes, or undefined if no timing data
   */
  public get totalTime(): Minutes | undefined {
    const active = this.totalActiveTime ?? 0;
    const wait = this.totalWaitTime ?? 0;
    const hold = this.totalHoldTime ?? 0;
    const total = active + wait + hold;
    return total > 0 ? (total as Minutes) : undefined;
  }

  /**
   * Gets the number of steps in this procedure
   * @returns Number of steps
   */
  public get stepCount(): number {
    return this.steps.length;
  }

  /**
   * Checks if this procedure is category-specific
   * @returns true if the procedure has a category, false if it's general
   */
  public get isCategorySpecific(): boolean {
    return this.category !== undefined;
  }

  /**
   * Renders the procedure with the given context.
   * Renders task templates for each step using the task's params.
   * @param _context - The render context (currently unused, for future recipe context integration)
   * @returns Success with rendered procedure, or Failure if rendering fails
   */
  public render(context: IProcedureRenderContext): Result<IRenderedProcedure> {
    const renderedStepsResults: Result<IRenderedProcedureStep>[] = this.steps.map((step) =>
      this._renderStep(context, step)
    );

    // Collect all failures
    const failures = renderedStepsResults.filter((r) => r.isFailure());
    /* c8 ignore next 3 - defensive: step rendering currently cannot fail */
    if (failures.length > 0) {
      return fail(`Failed to render procedure steps: ${failures.map((f) => f.message).join('; ')}`);
    }

    const renderedSteps = renderedStepsResults.map((r) => r.value as IRenderedProcedureStep);

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
   * Renders a single step's task to produce the description
   * @param __context - The render context
   * @param step - The procedure step to render
   * @returns Success with rendered step, or Failure if rendering fails
   */
  private _renderStep(
    __context: IProcedureRenderContext,
    step: IProcedureStep
  ): Result<IRenderedProcedureStep> {
    const invocation = step.task;

    if (isTaskRef(invocation)) {
      // For ref tasks, we need the TasksLibrary to resolve the task
      // For now, return a placeholder indicating the task reference
      return succeed({
        ...step,
        renderedDescription: `[Task: ${invocation.taskId}]`
      });
    }

    if (isInlineTask(invocation)) {
      // For inline tasks, instantiate a Task and use its render method
      return Task.create(invocation.task).onSuccess((task) => {
        return task.render(invocation.params).onSuccess((renderedDescription) => {
          return succeed({
            ...step,
            renderedDescription
          });
        });
      });
    }
    /* c8 ignore next 2 - defensive code: type system prevents this path */
    return fail('Step has invalid task structure');
  }
}
