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
 * Undo/redo functionality using command pattern
 * @packageDocumentation
 */

import { captureResult, Result, fail, succeed } from '@fgv/ts-utils';

// ============================================================================
// Command Interface
// ============================================================================

/**
 * A reversible command that can be executed and undone.
 * Commands follow the Command pattern for undo/redo functionality.
 * @public
 */
export interface ICommand {
  /**
   * Description of the command for logging and UI display.
   */
  readonly description: string;

  /**
   * Execute the command.
   * @returns Result indicating success or failure
   */
  readonly execute: () => Result<void>;

  /**
   * Undo the command, reversing its effects.
   * Only called after execute() has succeeded.
   * @returns Result indicating success or failure
   */
  readonly undo: () => Result<void>;

  /**
   * Redo the command after it has been undone.
   * Default implementation re-executes the command.
   * @returns Result indicating success or failure
   */
  readonly redo?: () => Result<void>;
}

// ============================================================================
// Undo Manager
// ============================================================================

/**
 * Manages command history for undo/redo operations.
 * Maintains separate stacks for undo and redo operations.
 * @public
 */
export class UndoManager {
  private readonly _undoStack: ICommand[] = [];
  private readonly _redoStack: ICommand[] = [];
  private readonly _maxHistorySize: number;

  /**
   * Internal constructor - use {@link UndoManager.create} instead.
   * @param maxHistorySize - Maximum number of commands to keep in history
   * @internal
   */
  private constructor(maxHistorySize: number) {
    if (maxHistorySize < 1) {
      throw new Error('maxHistorySize must be at least 1');
    }
    this._maxHistorySize = maxHistorySize;
  }

  /**
   * Create a new undo manager.
   * @param maxHistorySize - Maximum number of commands to keep in history (default: 100)
   * @returns Result with UndoManager on success, or Failure if maxHistorySize is invalid
   */
  public static create(maxHistorySize: number = 100): Result<UndoManager> {
    return captureResult(() => new UndoManager(maxHistorySize));
  }

  /**
   * Get the maximum history size.
   */
  public get maxHistorySize(): number {
    return this._maxHistorySize;
  }

  /**
   * Check if there are commands to undo.
   */
  public get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  /**
   * Check if there are commands to redo.
   */
  public get canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  /**
   * Get number of commands in undo history.
   */
  public get undoCount(): number {
    return this._undoStack.length;
  }

  /**
   * Get number of commands in redo history.
   */
  public get redoCount(): number {
    return this._redoStack.length;
  }

  /**
   * Execute a command and add it to history.
   * Clears redo stack as new command invalidates redo history.
   * @param command - Command to execute
   * @returns Result indicating success or failure
   */
  public execute(command: ICommand): Result<void> {
    return command.execute().onSuccess(() => {
      // Add to undo stack
      this._undoStack.push(command);

      // Limit stack size
      if (this._undoStack.length > this._maxHistorySize) {
        this._undoStack.shift();
      }

      // Clear redo stack - new command invalidates redo history
      this._redoStack.length = 0;

      return succeed(undefined);
    });
  }

  /**
   * Undo the most recent command.
   * @returns Result indicating success or failure
   */
  public undo(): Result<void> {
    if (!this.canUndo) {
      return fail('No commands to undo');
    }

    const command = this._undoStack.pop();
    /* c8 ignore next 3 - defensive check, should never happen after canUndo check */
    if (!command) {
      return fail('Undo stack corrupted');
    }

    return command.undo().onSuccess(() => {
      // Add to redo stack
      this._redoStack.push(command);
      return succeed(undefined);
    });
  }

  /**
   * Redo the most recently undone command.
   * @returns Result indicating success or failure
   */
  public redo(): Result<void> {
    if (!this.canRedo) {
      return fail('No commands to redo');
    }

    const command = this._redoStack.pop();
    /* c8 ignore next 3 - defensive check, should never happen after canRedo check */
    if (!command) {
      return fail('Redo stack corrupted');
    }

    // Use redo() if provided, otherwise re-execute
    const redoOperation = command.redo ?? command.execute;

    return redoOperation().onSuccess(() => {
      // Add back to undo stack
      this._undoStack.push(command);
      return succeed(undefined);
    });
  }

  /**
   * Clear all history.
   */
  public clear(): void {
    this._undoStack.length = 0;
    this._redoStack.length = 0;
  }

  /**
   * Get descriptions of commands in undo stack (most recent first).
   */
  public getUndoHistory(): ReadonlyArray<string> {
    return this._undoStack.map((cmd) => cmd.description).reverse();
  }

  /**
   * Get descriptions of commands in redo stack (most recent first).
   */
  public getRedoHistory(): ReadonlyArray<string> {
    return this._redoStack.map((cmd) => cmd.description).reverse();
  }

  /**
   * Peek at the most recent undoable command without removing it.
   * @returns Command description or undefined if no commands
   */
  public peekUndo(): string | undefined {
    const command = this._undoStack[this._undoStack.length - 1];
    return command?.description;
  }

  /**
   * Peek at the most recent redoable command without removing it.
   * @returns Command description or undefined if no commands
   */
  public peekRedo(): string | undefined {
    const command = this._redoStack[this._redoStack.length - 1];
    return command?.description;
  }
}

// ============================================================================
// Command Builder Helpers
// ============================================================================

/**
 * Create a command from execute and undo functions.
 * @param description - Command description
 * @param execute - Execute function
 * @param undo - Undo function
 * @param redo - Optional redo function (defaults to re-executing)
 * @returns Command
 * @public
 */
export function createCommand(
  description: string,
  execute: () => Result<void>,
  undo: () => Result<void>,
  redo?: () => Result<void>
): ICommand {
  return {
    description,
    execute,
    undo,
    redo
  };
}
