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
 * RuntimeTask - resolved task view with rendering capabilities
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';
import { Mustache as MustacheModule } from '@fgv/ts-extras';

import { BaseTaskId, Celsius, ICategorizedNote, Minutes, TaskId } from '../../common';
import { ITaskData, ITaskRefValidation } from '../../entities';
import { ITaskContext, IRuntimeTask } from './model';

// ============================================================================
// RuntimeTask Class
// ============================================================================

/**
 * A resolved view of a task with rendering capabilities.
 *
 * RuntimeTask wraps a data-layer Task and provides:
 * - Composite identity (TaskId) for cross-source references
 * - Template parsing and required variable extraction
 * - Parameter validation
 * - Template rendering
 * - Context access for resolving task references (future use)
 *
 * @public
 */
export class RuntimeTask implements IRuntimeTask {
  private readonly _context: ITaskContext;
  private readonly _id: TaskId;
  private readonly _task: ITaskData;
  private readonly _parsedTemplate: MustacheModule.MustacheTemplate;
  private readonly _requiredVariables: ReadonlyArray<string>;

  private constructor(
    context: ITaskContext,
    id: TaskId,
    task: ITaskData,
    parsedTemplate: MustacheModule.MustacheTemplate
  ) {
    this._context = context;
    this._id = id;
    this._task = task;
    this._parsedTemplate = parsedTemplate;
    this._requiredVariables = parsedTemplate.extractVariableNames();
  }

  /**
   * Factory method for creating a RuntimeTask.
   * Parses the Mustache template and extracts required variables.
   * @param context - The runtime context for task resolution
   * @param id - The composite task ID
   * @param task - The raw task data
   * @returns Success with RuntimeTask, or Failure if template parsing fails
   */
  public static create(context: ITaskContext, id: TaskId, task: ITaskData): Result<RuntimeTask> {
    return MustacheModule.MustacheTemplate.create(task.template).onSuccess((parsedTemplate) => {
      return succeed(new RuntimeTask(context, id, task, parsedTemplate));
    });
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * The composite task ID (e.g., "common.melt-chocolate")
   */
  public get id(): TaskId {
    return this._id;
  }

  /**
   * The base task ID within the source
   */
  public get baseId(): BaseTaskId {
    return this._task.baseId;
  }

  // ============================================================================
  // Core Properties (passthrough to underlying Task)
  // ============================================================================

  /**
   * Human-readable name of the task
   */
  public get name(): string {
    return this._task.name;
  }

  /**
   * The Mustache template string
   */
  public get template(): string {
    return this._task.template;
  }

  /**
   * Required variables extracted from the template.
   * This is computed at RuntimeTask creation, not stored in the data layer.
   */
  public get requiredVariables(): ReadonlyArray<string> {
    return this._requiredVariables;
  }

  /**
   * Optional default active time
   */
  public get defaultActiveTime(): Minutes | undefined {
    return this._task.defaultActiveTime;
  }

  /**
   * Optional default wait time
   */
  /* c8 ignore next 3 - simple getter */
  public get defaultWaitTime(): Minutes | undefined {
    return this._task.defaultWaitTime;
  }

  /**
   * Optional default hold time
   */
  /* c8 ignore next 3 - simple getter */
  public get defaultHoldTime(): Minutes | undefined {
    return this._task.defaultHoldTime;
  }

  /**
   * Optional default temperature
   */
  public get defaultTemperature(): Celsius | undefined {
    return this._task.defaultTemperature;
  }

  /**
   * Optional categorized notes
   */
  public get notes(): ReadonlyArray<ICategorizedNote> | undefined {
    return this._task.notes;
  }

  /**
   * Optional tags
   */
  public get tags(): ReadonlyArray<string> | undefined {
    return this._task.tags;
  }

  /**
   * Optional default values for template placeholders
   */
  public get defaults(): Readonly<Record<string, unknown>> | undefined {
    return this._task.defaults;
  }

  // ============================================================================
  // Operations
  // ============================================================================

  /**
   * Merges defaults with provided params. Params override defaults.
   * @param params - The parameter values provided by the caller
   * @returns Merged context with defaults filled in
   */
  private _mergeContext(params: Record<string, unknown>): Record<string, unknown> {
    if (!this._task.defaults) {
      return params;
    }
    return { ...this._task.defaults, ...params };
  }

  /**
   * Validates that params (combined with defaults) satisfy required variables.
   * @param params - The parameter values to validate
   * @returns Validation result with details about present/missing variables
   */
  public validateParams(params: Record<string, unknown>): Result<ITaskRefValidation> {
    const mergedParams = this._mergeContext(params);
    return this._parsedTemplate.validateContext(mergedParams).onSuccess((validation) => {
      // Find extra variables (params provided but not in template)
      const templateVars = new Set(this._requiredVariables);
      const extraVariables: string[] = [];

      for (const key of Object.keys(params)) {
        if (!templateVars.has(key)) {
          extraVariables.push(key);
        }
      }

      // Build messages
      const messages: string[] = [];
      if (validation.missingVariables.length > 0) {
        messages.push(`Missing required variables: ${validation.missingVariables.join(', ')}`);
      }
      if (extraVariables.length > 0) {
        messages.push(`Extra variables provided: ${extraVariables.join(', ')}`);
      }

      return succeed({
        isValid: validation.isValid,
        taskFound: true,
        missingVariables: validation.missingVariables,
        extraVariables,
        messages
      });
    });
  }

  /**
   * Renders the task template with the given params (merged with defaults).
   * @param params - The parameter values for template rendering
   * @returns Success with rendered string, or Failure if rendering fails
   */
  public render(params: Record<string, unknown>): Result<string> {
    return this._parsedTemplate.render(this._mergeContext(params));
  }

  /**
   * Validates params and renders the template if validation passes.
   * @param params - The parameter values to validate and render with
   * @returns Success with rendered string, or Failure with validation or render errors
   */
  public validateAndRender(params: Record<string, unknown>): Result<string> {
    return this._parsedTemplate.validateAndRender(this._mergeContext(params));
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw task data
   */
  public get raw(): ITaskData {
    return this._task;
  }

  // ============================================================================
  // Context Access (for advanced use cases)
  // ============================================================================

  /**
   * Gets the task context for resolving other tasks.
   * @internal
   */
  /* c8 ignore next 3 - protected internal accessor for subclass use */
  protected get context(): ITaskContext {
    return this._context;
  }
}
