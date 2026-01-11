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
 * Task class with Mustache template integration
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';
import { Mustache as MustacheModule } from '@fgv/ts-extras';

import { BaseTaskId, Celsius, Minutes } from '../common';
import { ITask, ITaskData, ITaskRefValidation } from './model';

/**
 * Task class with pre-parsed Mustache template for efficient rendering.
 * Accepts ITaskData (persisted format) and computes requiredVariables from template.
 * @public
 */
export class Task implements ITask {
  /**
   * Base task identifier (unique within source)
   */
  public readonly baseId: BaseTaskId;

  /**
   * Human-readable name of the task
   */
  public readonly name: string;

  /**
   * The original Mustache template string
   */
  public readonly template: string;

  /**
   * Required variables extracted from the template (runtime-computed, not persisted)
   */
  public readonly requiredVariables: ReadonlyArray<string>;

  /**
   * Optional default active time
   */
  public readonly defaultActiveTime?: Minutes;

  /**
   * Optional default wait time
   */
  public readonly defaultWaitTime?: Minutes;

  /**
   * Optional default hold time
   */
  public readonly defaultHoldTime?: Minutes;

  /**
   * Optional default temperature
   */
  public readonly defaultTemperature?: Celsius;

  /**
   * Optional notes about the task
   */
  public readonly notes?: string;

  /**
   * Optional tags for categorization
   */
  public readonly tags?: ReadonlyArray<string>;

  /**
   * Optional default values for template placeholders
   */
  public readonly defaults?: Readonly<Record<string, unknown>>;

  private readonly _parsedTemplate: MustacheModule.MustacheTemplate;

  private constructor(data: ITaskData, parsedTemplate: MustacheModule.MustacheTemplate) {
    this.baseId = data.baseId;
    this.name = data.name;
    this.template = data.template;
    // Extract required variables from the template - this is the single source of truth
    this.requiredVariables = parsedTemplate.extractVariableNames();
    this.defaultActiveTime = data.defaultActiveTime;
    this.defaultWaitTime = data.defaultWaitTime;
    this.defaultHoldTime = data.defaultHoldTime;
    this.defaultTemperature = data.defaultTemperature;
    this.notes = data.notes;
    this.tags = data.tags;
    this.defaults = data.defaults;
    this._parsedTemplate = parsedTemplate;
  }

  /**
   * Creates a Task instance from persisted data, pre-parsing the Mustache template.
   * Required variables are extracted from the template automatically.
   * @param data - The persisted task data to create from
   * @returns Success with Task instance, or Failure if template parsing fails
   * @public
   */
  public static create(data: ITaskData): Result<Task> {
    return MustacheModule.MustacheTemplate.create(data.template).onSuccess((parsed) => {
      return succeed(new Task(data, parsed));
    });
  }

  /**
   * Gets the variable names extracted from the template.
   * @returns Array of variable names found in the template
   * @public
   */
  public getTemplateVariables(): readonly string[] {
    return this._parsedTemplate.extractVariableNames();
  }

  /**
   * Merges defaults with provided params. Params override defaults.
   * @param params - The parameter values provided by the caller
   * @returns Merged context with defaults filled in
   * @internal
   */
  private _mergeContext(params: Record<string, unknown>): Record<string, unknown> {
    if (!this.defaults) {
      return params;
    }
    return { ...this.defaults, ...params };
  }

  /**
   * Validates that params (combined with defaults) satisfy required variables.
   * @param params - The parameter values to validate
   * @returns Validation result with details about present/missing variables
   * @public
   */
  public validateParams(params: Record<string, unknown>): Result<ITaskRefValidation> {
    const mergedParams = this._mergeContext(params);
    return this._parsedTemplate.validateContext(mergedParams).onSuccess((validation) => {
      // Find extra variables (params provided but not in template)
      const templateVars = new Set(this._parsedTemplate.extractVariableNames());
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
   * @public
   */
  public render(params: Record<string, unknown>): Result<string> {
    return this._parsedTemplate.render(this._mergeContext(params));
  }

  /**
   * Validates params (merged with defaults) and renders the template if validation passes.
   * @param params - The parameter values to validate and render with
   * @returns Success with rendered string, or Failure with validation or render errors
   * @public
   */
  public validateAndRender(params: Record<string, unknown>): Result<string> {
    return this._parsedTemplate.validateAndRender(this._mergeContext(params));
  }

  /**
   * Converts the Task back to its persisted data representation.
   * Note: requiredVariables is not included as it's computed from the template.
   * @returns The persisted task data
   * @public
   */
  public toData(): ITaskData {
    return {
      baseId: this.baseId,
      name: this.name,
      template: this.template,
      defaultActiveTime: this.defaultActiveTime,
      defaultWaitTime: this.defaultWaitTime,
      defaultHoldTime: this.defaultHoldTime,
      defaultTemperature: this.defaultTemperature,
      notes: this.notes,
      tags: this.tags,
      defaults: this.defaults
    };
  }
}
