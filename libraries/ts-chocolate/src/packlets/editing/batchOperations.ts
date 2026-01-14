// Copyright (c) 2024 Erik Fortune
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
 * Batch operations support for editing workflows
 * @packageDocumentation
 */

import { Result, fail, succeed, MessageAggregator } from '@fgv/ts-utils';

// ============================================================================
// Batch Operation Types
// ============================================================================

/**
 * A single operation in a batch.
 * Operations execute in order and can be rolled back if any operation fails.
 * @public
 */
export interface IBatchOperation<T = void> {
  /**
   * Description of the operation for logging and error messages.
   */
  readonly description: string;

  /**
   * Execute the operation.
   * @returns Result indicating success or failure
   */
  readonly execute: () => Result<T>;

  /**
   * Rollback the operation if it was successfully executed.
   * Only called if execute() succeeded but a later operation failed.
   * @returns Result indicating success or failure of rollback
   */
  readonly rollback: () => Result<void>;
}

/**
 * Result of executing a batch of operations.
 * @public
 */
export interface IBatchResult<T = void> {
  /**
   * Whether all operations succeeded.
   */
  readonly success: boolean;

  /**
   * Results of all executed operations (before any failure).
   */
  readonly results: ReadonlyArray<T>;

  /**
   * Error messages if any operations failed.
   */
  readonly errors: ReadonlyArray<string>;

  /**
   * Number of operations that were successfully executed.
   */
  readonly successCount: number;

  /**
   * Number of operations that failed.
   */
  readonly failureCount: number;

  /**
   * Whether rollback was attempted.
   */
  readonly rolledBack: boolean;

  /**
   * Any errors that occurred during rollback.
   */
  readonly rollbackErrors: ReadonlyArray<string>;
}

// ============================================================================
// Batch Executor
// ============================================================================

/**
 * Executes a batch of operations with automatic rollback on failure.
 * Operations execute in order. If any operation fails, all successfully
 * executed operations are rolled back in reverse order.
 * @public
 */
export class BatchExecutor {
  /**
   * Execute a batch of operations with automatic rollback.
   * @param operations - Operations to execute in order
   * @returns Result containing batch execution results
   */
  public static execute<T>(operations: ReadonlyArray<IBatchOperation<T>>): Result<IBatchResult<T>> {
    if (operations.length === 0) {
      return succeed({
        success: true,
        results: [],
        errors: [],
        successCount: 0,
        failureCount: 0,
        rolledBack: false,
        rollbackErrors: []
      });
    }

    const results: T[] = [];
    const errors: string[] = [];
    const executedOps: Array<IBatchOperation<T>> = [];

    // Execute operations in order
    for (const operation of operations) {
      const result = operation.execute();

      if (result.isSuccess()) {
        results.push(result.value);
        executedOps.push(operation);
      } else {
        // Operation failed - record error and rollback
        errors.push(`${operation.description}: ${result.message}`);

        const rollbackResult = this._rollback(executedOps);

        return succeed({
          success: false,
          results,
          errors,
          successCount: executedOps.length,
          failureCount: 1,
          rolledBack: true,
          rollbackErrors: rollbackResult.errors
        });
      }
    }

    // All operations succeeded
    return succeed({
      success: true,
      results,
      errors: [],
      successCount: operations.length,
      failureCount: 0,
      rolledBack: false,
      rollbackErrors: []
    });
  }

  /**
   * Execute operations and return aggregated failure message if any fail.
   * @param operations - Operations to execute
   * @returns Result of void if all succeed, or failure with aggregated errors
   */
  public static executeOrFail<T>(operations: ReadonlyArray<IBatchOperation<T>>): Result<void> {
    return this.execute(operations).onSuccess((batchResult) => {
      if (!batchResult.success) {
        const aggregator = new MessageAggregator();
        batchResult.errors.forEach((error) => aggregator.addMessage(error));

        if (batchResult.rollbackErrors.length > 0) {
          aggregator.addMessage('Rollback errors occurred:');
          batchResult.rollbackErrors.forEach((error) => aggregator.addMessage(`  ${error}`));
        }

        return fail(aggregator.toString('; '));
      }
      return succeed(undefined);
    });
  }

  /**
   * Rollback executed operations in reverse order.
   * @param executedOps - Operations to rollback (in execution order)
   * @returns Rollback results with any errors
   */
  private static _rollback<T>(executedOps: ReadonlyArray<IBatchOperation<T>>): {
    success: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Rollback in reverse order
    for (let i = executedOps.length - 1; i >= 0; i--) {
      const operation = executedOps[i];
      const rollbackResult = operation.rollback();

      if (rollbackResult.isFailure()) {
        errors.push(`Failed to rollback "${operation.description}": ${rollbackResult.message}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// Operation Builder Helpers
// ============================================================================

/**
 * Create a batch operation from execute and rollback functions.
 * @param description - Operation description
 * @param execute - Execute function
 * @param rollback - Rollback function
 * @returns Batch operation
 * @public
 */
export function createOperation<T>(
  description: string,
  execute: () => Result<T>,
  rollback: () => Result<void>
): IBatchOperation<T> {
  return {
    description,
    execute,
    rollback
  };
}

/**
 * Create a no-op rollback function for operations that cannot be rolled back.
 * @returns Rollback function that always succeeds
 * @public
 */
export function noOpRollback(): () => Result<void> {
  return () => succeed(undefined);
}
