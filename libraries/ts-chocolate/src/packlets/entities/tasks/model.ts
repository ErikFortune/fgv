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
 * Task model types and interfaces
 * @packageDocumentation
 */

import { BaseTaskId, Celsius, ICategorizedNote, Minutes, TaskId } from '../../common';

// ============================================================================
// Task Interfaces
// ============================================================================

/**
 * Persisted task data - the data model stored in YAML/JSON files.
 * Does not include requiredVariables as those are extracted from the template at runtime.
 * @public
 */
export interface ITaskData {
  /**
   * Base task identifier (unique within source)
   * Pattern: /^[a-zA-Z0-9_-]+$/
   */
  readonly baseId: BaseTaskId;

  /**
   * Human-readable name of the task
   */
  readonly name: string;

  /**
   * Mustache template for the task description.
   * Variables can be flat (e.g., temp) or dotted (e.g., ingredient.name)
   */
  readonly template: string;

  /**
   * Optional default active time (can be overridden by step)
   */
  readonly defaultActiveTime?: Minutes;

  /**
   * Optional default wait time (can be overridden by step)
   */
  readonly defaultWaitTime?: Minutes;

  /**
   * Optional default hold time (can be overridden by step)
   */
  readonly defaultHoldTime?: Minutes;

  /**
   * Optional default temperature (can be overridden by step)
   */
  readonly defaultTemperature?: Celsius;

  /**
   * Optional categorized notes about the task
   */
  readonly notes?: ReadonlyArray<ICategorizedNote>;

  /**
   * Optional tags for categorization and search
   */
  readonly tags?: ReadonlyArray<string>;

  /**
   * Optional default values for template placeholders.
   * Placeholders with defaults become optional when rendering.
   */
  readonly defaults?: Readonly<Record<string, unknown>>;
}

/**
 * A reusable task template with runtime-computed properties.
 * Extends ITaskData with requiredVariables extracted from the template.
 * @public
 */
export interface ITask extends ITaskData {
  /**
   * Required variables extracted from the template at runtime.
   * This is computed from parsing the Mustache template, not persisted.
   */
  readonly requiredVariables: ReadonlyArray<string>;
}

// ============================================================================
// Task Reference Interfaces
// ============================================================================

/**
 * Represents a step's reference to a reusable task with parameter values.
 * @public
 */
export interface ITaskRef {
  /**
   * Full task ID (sourceId.baseTaskId)
   */
  readonly taskId: TaskId;

  /**
   * Parameter values to pass to the task template.
   * Keys are variable names, values can be primitives or nested objects.
   * Common values are flat (e.g., temp: 45)
   * Complex data can be dotted (e.g., ingredient: name: 'chocolate', type: 'dark')
   */
  readonly params: Record<string, unknown>;
}

/**
 * Validation status for a step's task reference.
 * Used at load time to mark incomplete references without hard failing.
 * @public
 */
export type TaskRefStatus = 'valid' | 'task-not-found' | 'missing-variables' | 'invalid-params';

/**
 * Result of validating a task reference against a task definition.
 * @public
 */
export interface ITaskRefValidation {
  /**
   * Whether the reference is valid (all required variables provided)
   */
  readonly isValid: boolean;

  /**
   * True if the referenced task was found
   */
  readonly taskFound: boolean;

  /**
   * Variables that are missing from params
   */
  readonly missingVariables: ReadonlyArray<string>;

  /**
   * Variables provided but not required (warning only)
   */
  readonly extraVariables: ReadonlyArray<string>;

  /**
   * Human-readable validation messages
   */
  readonly messages: ReadonlyArray<string>;
}

// ============================================================================
// Inline Task Interface
// ============================================================================

/**
 * An inline task defined directly in a procedure step.
 * Contains a full ITaskData definition with a synthetic baseId (derived from procedure/step)
 * plus params for rendering.
 * @public
 */
export interface IInlineTask {
  /**
   * Full task definition with synthetic baseId (e.g., `procedureId.step-N`)
   */
  readonly task: ITaskData;

  /**
   * Parameter values for rendering the template
   */
  readonly params: Record<string, unknown>;
}

// ============================================================================
// Task Invocation Union Type
// ============================================================================

/**
 * A task invocation - either a reference to a library task or an inline task definition.
 * Discriminated by the presence of `task` (inline) vs `taskId` (ref).
 * @public
 */
export type ITaskInvocation = IInlineTask | ITaskRef;

/**
 * Type guard for task ref - discriminates by presence of `taskId`
 * @param invocation - The task invocation to check
 * @returns True if the invocation is a task reference
 * @public
 */
export function isTaskRef(invocation: ITaskInvocation): invocation is ITaskRef {
  return 'taskId' in invocation;
}

/**
 * Type guard for inline task - discriminates by presence of `task`
 * @param invocation - The task invocation to check
 * @returns True if the invocation is an inline task
 * @public
 */
export function isInlineTask(invocation: ITaskInvocation): invocation is IInlineTask {
  return 'task' in invocation;
}

// ============================================================================
// Render Options
// ============================================================================

/**
 * How to handle validation issues during rendering
 * @public
 */
export type ValidationBehavior = 'ignore' | 'warn' | 'fail';

/**
 * Options for rendering procedure steps.
 * @public
 */
export interface IRenderOptions {
  /**
   * How to handle steps with invalid task references
   * - 'ignore': Skip rendering, use empty or placeholder description
   * - 'warn': Log warning, render with placeholder
   * - 'fail': Return Failure result
   * Default: 'warn'
   */
  readonly onInvalidTaskRef?: ValidationBehavior;

  /**
   * How to handle missing variables during template rendering
   * - 'ignore': Render with empty values for missing variables
   * - 'warn': Log warning, render with empty values
   * - 'fail': Return Failure result
   * Default: 'warn'
   */
  readonly onMissingVariables?: ValidationBehavior;

  /**
   * Additional context values available to all templates
   * (e.g., recipe data, ingredient info from render context)
   */
  readonly additionalContext?: Record<string, unknown>;
}

/**
 * Default render options
 * @public
 */
export const defaultRenderOptions: Required<Omit<IRenderOptions, 'additionalContext'>> = {
  onInvalidTaskRef: 'warn',
  onMissingVariables: 'warn'
};
