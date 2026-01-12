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
 * Task class - pure data layer representation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { BaseTaskId, Celsius, Minutes } from '../common';
import { ITaskData } from './model';

/**
 * Task class - pure data representation of a task definition.
 *
 * @public
 */
export class Task implements ITaskData {
  /**
   * Base task identifier (unique within source)
   */
  public readonly baseId: BaseTaskId;

  /**
   * Human-readable name of the task
   */
  public readonly name: string;

  /**
   * The Mustache template string (unparsed)
   */
  public readonly template: string;

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

  private constructor(data: ITaskData) {
    this.baseId = data.baseId;
    this.name = data.name;
    this.template = data.template;
    this.defaultActiveTime = data.defaultActiveTime;
    this.defaultWaitTime = data.defaultWaitTime;
    this.defaultHoldTime = data.defaultHoldTime;
    this.defaultTemperature = data.defaultTemperature;
    this.notes = data.notes;
    this.tags = data.tags;
    this.defaults = data.defaults;
  }

  /**
   * Creates a Task instance from persisted data.
   * This is a pure data class - template parsing happens in RuntimeTask.
   * @param data - The persisted task data
   * @returns Success with Task instance
   * @public
   */
  public static create(data: ITaskData): Result<Task> {
    return Success.with(new Task(data));
  }

  /**
   * Converts the Task back to its persisted data representation.
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
