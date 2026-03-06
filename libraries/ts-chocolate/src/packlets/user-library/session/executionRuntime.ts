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
 * Runtime materializer for execution state.
 *
 * Wraps the persisted {@link IExecutionState} and derives production-relevant
 * properties like "next activity", "time remaining", and step completion
 * summaries. The persisted entity stores only raw data; all business logic
 * lives here.
 *
 * @packageDocumentation
 */

import { fail, Result, succeed } from '@fgv/ts-utils';

import { Model as CommonModel } from '../../common';
import {
  IExecutionState,
  IProcedureStepEntity,
  IStepExecutionEntry,
  StepExecutionStatus
} from '../../entities';
import { getCurrentTimestamp } from './sessionUtils';

// ============================================================================
// Step Summary
// ============================================================================

/**
 * Materialized summary of a procedure step's execution state.
 *
 * Combines the static procedure step definition with its dynamic
 * execution status for UI consumption.
 *
 * @public
 */
export interface IStepSummary {
  /** Index into the procedure's step array (0-based) */
  readonly stepIndex: number;
  /** The procedure step definition (task, timing, temperature) */
  readonly step: IProcedureStepEntity;
  /** Most recent execution status for this step */
  readonly status: StepExecutionStatus;
  /** Whether this is the currently active step */
  readonly isCurrent: boolean;
  /** How many times this step has been executed (including current) */
  readonly executionCount: number;
  /** Most recent execution log entry for this step (if any) */
  readonly latestEntry: IStepExecutionEntry | undefined;
}

// ============================================================================
// Execution Runtime
// ============================================================================

/**
 * Materializes execution state by combining persisted data with procedure
 * step definitions to derive production-relevant properties.
 *
 * This class is intentionally lightweight and stateless — it reads from
 * a persisted {@link IExecutionState} and procedure steps, deriving all
 * computed properties on access. Mutations produce a new
 * {@link IExecutionState} rather than mutating in place.
 *
 * @public
 */
export class ExecutionRuntime {
  private readonly _state: IExecutionState;
  private readonly _steps: ReadonlyArray<IProcedureStepEntity>;

  private constructor(state: IExecutionState, steps: ReadonlyArray<IProcedureStepEntity>) {
    this._state = state;
    this._steps = steps;
  }

  // ============================================================================
  // Factory
  // ============================================================================

  /**
   * Creates an ExecutionRuntime from persisted state and procedure steps.
   * @param state - Persisted execution state
   * @param steps - Procedure step definitions
   * @returns ExecutionRuntime instance
   * @public
   */
  public static from(state: IExecutionState, steps: ReadonlyArray<IProcedureStepEntity>): ExecutionRuntime {
    return new ExecutionRuntime(state, steps);
  }

  /**
   * Creates initial execution state for a procedure with the given steps.
   * All steps start as pending with currentStepIndex at 0.
   * @param steps - Procedure step definitions
   * @returns Initial execution state
   * @public
   */
  public static initialize(steps: ReadonlyArray<IProcedureStepEntity>): IExecutionState {
    const now = getCurrentTimestamp();
    const log: IStepExecutionEntry[] = [];

    if (steps.length > 0) {
      log.push({
        stepIndex: 0,
        status: 'active',
        startedAt: now
      });
    }

    return {
      currentStepIndex: 0,
      executionLog: log,
      startedAt: now
    };
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  /** The underlying persisted execution state. */
  public get state(): IExecutionState {
    return this._state;
  }

  /** Index of the currently active step (0-based). */
  public get currentStepIndex(): number {
    return this._state.currentStepIndex;
  }

  /** Total number of procedure steps. */
  public get totalSteps(): number {
    return this._steps.length;
  }

  /** Whether all steps have been completed or skipped. */
  public get isComplete(): boolean {
    return this._state.currentStepIndex >= this._steps.length;
  }

  /** The current procedure step definition, or undefined if complete. */
  public get currentStep(): IProcedureStepEntity | undefined {
    return this._steps[this._state.currentStepIndex];
  }

  /** ISO 8601 timestamp when production started. */
  public get startedAt(): string {
    return this._state.startedAt;
  }

  // ============================================================================
  // Derived Properties
  // ============================================================================

  /**
   * Returns a summary for each procedure step, combining the step definition
   * with its execution status.
   * @public
   */
  public getStepSummaries(): ReadonlyArray<IStepSummary> {
    return this._steps.map((step, idx) => {
      const entries = this._state.executionLog.filter((e) => e.stepIndex === idx);
      const latestEntry = entries.length > 0 ? entries[entries.length - 1] : undefined;
      const status = latestEntry?.status ?? 'pending';

      return {
        stepIndex: idx,
        step,
        status,
        isCurrent: idx === this._state.currentStepIndex,
        executionCount: entries.filter((e) => e.status === 'completed').length,
        latestEntry
      };
    });
  }

  /**
   * Returns the number of completed steps (unique step indices that have
   * at least one 'completed' entry).
   * @public
   */
  public get completedStepCount(): number {
    const completed = new Set<number>();
    for (const entry of this._state.executionLog) {
      if (entry.status === 'completed') {
        completed.add(entry.stepIndex);
      }
    }
    return completed.size;
  }

  /**
   * Returns a progress string like "3/7".
   * @public
   */
  public get progressLabel(): string {
    return `${this.completedStepCount}/${this.totalSteps}`;
  }

  // ============================================================================
  // Mutations (produce new IExecutionState)
  // ============================================================================

  /**
   * Marks the current step as completed and advances to the next step.
   * @returns Result with updated execution state
   * @public
   */
  public advanceStep(): Result<IExecutionState> {
    if (this.isComplete) {
      return fail('All steps are already complete');
    }

    const now = getCurrentTimestamp();
    const log = [...this._state.executionLog];

    // Complete the current active entry
    const activeIdx = this._findActiveEntryIndex(this._state.currentStepIndex);
    if (activeIdx >= 0) {
      log[activeIdx] = { ...log[activeIdx], status: 'completed', completedAt: now };
    } else {
      log.push({
        stepIndex: this._state.currentStepIndex,
        status: 'completed',
        completedAt: now
      });
    }

    const nextIndex = this._state.currentStepIndex + 1;

    // Start the next step if there is one
    if (nextIndex < this._steps.length) {
      log.push({
        stepIndex: nextIndex,
        status: 'active',
        startedAt: now
      });
    }

    return succeed({
      ...this._state,
      currentStepIndex: nextIndex,
      executionLog: log
    });
  }

  /**
   * Marks the current step as skipped and advances to the next step.
   * @returns Result with updated execution state
   * @public
   */
  public skipStep(): Result<IExecutionState> {
    if (this.isComplete) {
      return fail('All steps are already complete');
    }

    const now = getCurrentTimestamp();
    const log = [...this._state.executionLog];

    // Skip the current active entry
    const activeIdx = this._findActiveEntryIndex(this._state.currentStepIndex);
    if (activeIdx >= 0) {
      log[activeIdx] = { ...log[activeIdx], status: 'skipped', completedAt: now };
    } else {
      log.push({
        stepIndex: this._state.currentStepIndex,
        status: 'skipped',
        completedAt: now
      });
    }

    const nextIndex = this._state.currentStepIndex + 1;

    // Start the next step if there is one
    if (nextIndex < this._steps.length) {
      log.push({
        stepIndex: nextIndex,
        status: 'active',
        startedAt: now
      });
    }

    return succeed({
      ...this._state,
      currentStepIndex: nextIndex,
      executionLog: log
    });
  }

  /**
   * Jumps to a specific step, appending a new active entry.
   * Supports repeating earlier steps — the log always rolls forward.
   * @param stepIndex - Target step index (0-based)
   * @returns Result with updated execution state
   * @public
   */
  public jumpToStep(stepIndex: number): Result<IExecutionState> {
    if (stepIndex < 0 || stepIndex >= this._steps.length) {
      return fail(`Step index ${stepIndex} out of bounds (0..${this._steps.length - 1})`);
    }

    const now = getCurrentTimestamp();
    const log = [...this._state.executionLog];

    // If current step is active, mark it as completed before jumping
    if (!this.isComplete) {
      const activeIdx = this._findActiveEntryIndex(this._state.currentStepIndex);
      if (activeIdx >= 0) {
        log[activeIdx] = { ...log[activeIdx], status: 'completed', completedAt: now };
      }
    }

    // Append new active entry for the target step
    log.push({
      stepIndex,
      status: 'active',
      startedAt: now
    });

    return succeed({
      ...this._state,
      currentStepIndex: stepIndex,
      executionLog: log
    });
  }

  /**
   * Adds a note to the current step's active log entry.
   * @param notes - Notes to add
   * @returns Result with updated execution state
   * @public
   */
  public addStepNotes(notes: ReadonlyArray<CommonModel.ICategorizedNote>): Result<IExecutionState> {
    if (this.isComplete) {
      return fail('Cannot add notes: all steps are complete');
    }

    const log = [...this._state.executionLog];
    const activeIdx = this._findActiveEntryIndex(this._state.currentStepIndex);

    if (activeIdx < 0) {
      return fail('No active entry for current step');
    }

    const existing = log[activeIdx].notes ?? [];
    log[activeIdx] = {
      ...log[activeIdx],
      notes: [...existing, ...notes]
    };

    return succeed({
      ...this._state,
      executionLog: log
    });
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Finds the index of the most recent 'active' entry for a given step.
   */
  private _findActiveEntryIndex(stepIndex: number): number {
    for (let i = this._state.executionLog.length - 1; i >= 0; i--) {
      const entry = this._state.executionLog[i];
      if (entry.stepIndex === stepIndex && entry.status === 'active') {
        return i;
      }
    }
    return -1;
  }
}
