/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Result, succeed } from '@fgv/ts-utils';
import { ICellState, IRowColumn, Ids, ICell, PuzzleSession } from '../common';
import { HintSystem, IHintSystemConfig } from './hints';
import { ExplanationLevel, IHint, IHintGenerationOptions } from './types';

/**
 * Cache key for hint generation based on puzzle state.
 * @internal
 */
interface IHintCacheKey {
  readonly stateHash: string;
  readonly options: string;
}

/**
 * Cached hint data with generation timestamp.
 * @internal
 */
interface ICachedHints {
  readonly hints: readonly IHint[];
  readonly generatedAt: number;
  readonly cacheKey: IHintCacheKey;
}

/**
 * Configuration options for the PuzzleSessionHints integration.
 * @public
 */
export interface IPuzzleSessionHintsConfig extends IHintSystemConfig {
  readonly cacheTimeoutMs?: number;
  readonly maxCacheEntries?: number;
}

/**
 * Wrapper class that integrates hint functionality with PuzzleSession.
 * Provides hint generation, application, and explanation capabilities while
 * maintaining integration with existing state management and undo/redo functionality.
 * @public
 */
export class PuzzleSessionHints {
  private readonly _session: PuzzleSession;
  private readonly _hintSystem: HintSystem;
  private readonly _config: IPuzzleSessionHintsConfig;
  private _hintCache: ICachedHints | undefined;

  /**
   * @internal
   */
  private constructor(session: PuzzleSession, hintSystem: HintSystem, config: IPuzzleSessionHintsConfig) {
    this._session = session;
    this._hintSystem = hintSystem;
    this._config = config;
    this._hintCache = undefined;
  }

  /**
   * Creates a new PuzzleSessionHints wrapper for an existing PuzzleSession.
   * @param session - The PuzzleSession to wrap
   * @param config - Optional configuration for the hint system
   * @returns Result containing the new PuzzleSessionHints wrapper
   */
  public static create(
    session: PuzzleSession,
    config?: IPuzzleSessionHintsConfig
  ): Result<PuzzleSessionHints> {
    const finalConfig: IPuzzleSessionHintsConfig = {
      enableNakedSingles: true,
      enableHiddenSingles: true,
      defaultExplanationLevel: 'detailed' as ExplanationLevel,
      cacheTimeoutMs: 5000, // 5 second cache timeout
      maxCacheEntries: 1, // Simple single-entry cache for now
      ...config
    };

    return HintSystem.create(finalConfig).onSuccess((hintSystem) => {
      return succeed(new PuzzleSessionHints(session, hintSystem, finalConfig));
    });
  }

  /**
   * Gets the wrapped PuzzleSession instance.
   * @returns The underlying PuzzleSession
   */
  public get session(): PuzzleSession {
    return this._session;
  }

  /**
   * Gets the HintSystem instance.
   * @returns The hint system
   */
  public get hintSystem(): HintSystem {
    return this._hintSystem;
  }

  /**
   * Gets the configuration.
   * @returns The configuration
   */
  public get config(): IPuzzleSessionHintsConfig {
    return this._config;
  }

  // Delegate all PuzzleSession methods for transparent access

  /**
   * Gets the puzzle ID.
   * @returns The puzzle ID
   */
  public get id(): string | undefined {
    return this._session.id;
  }

  /**
   * Gets the puzzle description.
   * @returns The puzzle description
   */
  public get description(): string {
    return this._session.description;
  }

  /**
   * Gets the number of rows in the puzzle.
   * @returns The number of rows
   */
  public get numRows(): number {
    return this._session.numRows;
  }

  /**
   * Gets the number of columns in the puzzle.
   * @returns The number of columns
   */
  public get numColumns(): number {
    return this._session.numColumns;
  }

  /**
   * Gets the current puzzle state.
   * @returns The current state
   */
  public get state(): import('../common').PuzzleState {
    return this._session.state;
  }

  /**
   * Gets whether undo is possible.
   * @returns true if undo is possible
   */
  public get canUndo(): boolean {
    return this._session.canUndo;
  }

  /**
   * Gets whether redo is possible.
   * @returns true if redo is possible
   */
  public get canRedo(): boolean {
    return this._session.canRedo;
  }

  /**
   * Checks if the puzzle is solved.
   * @returns true if the puzzle is solved
   */
  public checkIsSolved(): boolean {
    return this._session.checkIsSolved();
  }

  /**
   * Checks if the puzzle is valid.
   * @returns true if the puzzle is valid
   */
  public checkIsValid(): boolean {
    return this._session.checkIsValid();
  }

  /**
   * Updates a cell value.
   * @param spec - Cell specification
   * @param value - New value
   * @returns Result with this instance
   */
  public updateCellValue(spec: string | IRowColumn | ICell, value: number | undefined): Result<this> {
    return this._session.updateCellValue(spec, value).onSuccess(() => {
      this._invalidateCache();
      return succeed(this);
    });
  }

  /**
   * Updates cell notes.
   * @param spec - Cell specification
   * @param notes - New notes
   * @returns Result with this instance
   */
  public updateCellNotes(spec: string | IRowColumn | ICell, notes: number[]): Result<this> {
    return this._session.updateCellNotes(spec, notes).onSuccess(() => {
      this._invalidateCache();
      return succeed(this);
    });
  }

  /**
   * Updates multiple cells.
   * @param updates - Array of cell updates
   * @returns Result with this instance
   */
  public updateCells(updates: ICellState[]): Result<this> {
    return this._session.updateCells(updates).onSuccess(() => {
      this._invalidateCache();
      return succeed(this);
    });
  }

  /**
   * Performs an undo operation.
   * @returns Result with this instance
   */
  public undo(): Result<this> {
    return this._session.undo().onSuccess(() => {
      this._invalidateCache();
      return succeed(this);
    });
  }

  /**
   * Performs a redo operation.
   * @returns Result with this instance
   */
  public redo(): Result<this> {
    return this._session.redo().onSuccess(() => {
      this._invalidateCache();
      return succeed(this);
    });
  }

  // Hint-specific functionality

  /**
   * Gets the best available hint for the current puzzle state.
   * @param options - Optional hint generation options
   * @returns Result containing the best hint
   */
  public getHint(options?: IHintGenerationOptions): Result<IHint> {
    return this._hintSystem.getBestHint(this._session.puzzle, this._session.state, options);
  }

  /**
   * Gets all available hints for the current puzzle state.
   * @param options - Optional hint generation options
   * @returns Result containing array of hints
   */
  public getAllHints(options?: IHintGenerationOptions): Result<readonly IHint[]> {
    // Check cache first
    const cachedHints = this._getCachedHints(options);
    if (cachedHints) {
      return succeed(cachedHints);
    }

    // Generate new hints
    return this._hintSystem
      .generateHints(this._session.puzzle, this._session.state, options)
      .onSuccess((hints) => {
        this._updateCache(hints, options);
        return succeed(hints);
      });
  }

  /**
   * Applies a hint to the puzzle, updating the state and adding to undo history.
   * @param hint - The hint to apply
   * @returns Result with this instance if successful
   */
  public applyHint(hint: IHint): Result<this> {
    return this._hintSystem
      .applyHint(hint, this._session.puzzle, this._session.state)
      .onSuccess((updates) => {
        // Convert readonly array to mutable array for PuzzleSession.updateCells
        const mutableUpdates: ICellState[] = [...updates];
        return this._session.updateCells(mutableUpdates).onSuccess(() => {
          this._invalidateCache();
          return succeed(this);
        });
      });
  }

  /**
   * Gets hints that specifically affect a given cell.
   * @param spec - Cell specification (ID, row/column, or cell object)
   * @param options - Optional hint generation options
   * @returns Result containing hints affecting the specified cell
   */
  public getHintsForCell(
    spec: string | IRowColumn | ICell,
    options?: IHintGenerationOptions
  ): Result<readonly IHint[]> {
    const cellIdResult = Ids.cellId(spec);
    return cellIdResult.onSuccess((cellId) => {
      return this.getAllHints(options).onSuccess((allHints) => {
        const relevantHints = allHints.filter((hint) => {
          // Check if the hint affects this specific cell
          return (
            hint.cellActions.some((action) => action.cellId === cellId) ||
            hint.relevantCells.primary.includes(cellId) ||
            hint.relevantCells.secondary.includes(cellId) ||
            hint.relevantCells.affected.includes(cellId)
          );
        });
        return succeed(relevantHints);
      });
    });
  }

  /**
   * Gets a formatted explanation for a hint.
   * @param hint - The hint to explain
   * @param level - The explanation level (defaults to configured default)
   * @returns Formatted explanation string
   */
  public getExplanation(hint: IHint, level?: ExplanationLevel): string {
    return this._hintSystem.formatHintExplanation(hint, level);
  }

  /**
   * Validates that a hint can be applied to the current state.
   * @param hint - The hint to validate
   * @returns Result indicating validation success or failure
   */
  public validateHint(hint: IHint): Result<void> {
    return this._hintSystem.validateHint(hint, this._session.puzzle, this._session.state);
  }

  /**
   * Checks if hints are available for the current state.
   * @param options - Optional hint generation options
   * @returns Result containing boolean indicating availability
   */
  public hasHints(options?: IHintGenerationOptions): Result<boolean> {
    return this._hintSystem.hasHints(this._session.puzzle, this._session.state);
  }

  /**
   * Gets statistics about available hints.
   * @param options - Optional hint generation options
   * @returns Result containing hint statistics
   */
  public getHintStatistics(options?: IHintGenerationOptions): Result<{
    totalHints: number;
    hintsByTechnique: Map<string, number>;
    hintsByDifficulty: Map<string, number>;
  }> {
    return this._hintSystem.getHintStatistics(this._session.puzzle, this._session.state);
  }

  /**
   * Gets a summary of the hint system capabilities.
   * @returns System capabilities summary
   */
  public getSystemSummary(): string {
    return this._hintSystem.getSystemSummary();
  }

  // Delegate remaining PuzzleSession methods for complete transparency

  /**
   * Gets the rows.
   * @returns Array of row cages
   */
  public get rows(): import('../common').ICage[] {
    return this._session.rows;
  }

  /**
   * Gets the columns.
   * @returns Array of column cages
   */
  public get cols(): import('../common').ICage[] {
    return this._session.cols;
  }

  /**
   * Gets the sections.
   * @returns Array of section cages
   */
  public get sections(): import('../common').ICage[] {
    return this._session.sections;
  }

  /**
   * Gets all cages.
   * @returns Array of all cages
   */
  public get cages(): import('../common').ICage[] {
    return this._session.cages;
  }

  /**
   * Gets all cells.
   * @returns Array of all cells
   */
  public get cells(): ICell[] {
    return this._session.cells;
  }

  /**
   * Gets the next step index.
   * @returns Next step index
   */
  public get nextStep(): number {
    return this._session.nextStep;
  }

  /**
   * Gets the number of steps.
   * @returns Number of steps
   */
  public get numSteps(): number {
    return this._session.numSteps;
  }

  /**
   * Gets empty cells.
   * @returns Array of empty cells
   */
  public getEmptyCells(): ICell[] {
    return this._session.getEmptyCells();
  }

  /**
   * Gets invalid cells.
   * @returns Array of invalid cells
   */
  public getInvalidCells(): ICell[] {
    return this._session.getInvalidCells();
  }

  /**
   * Checks if a cell is valid.
   * @param spec - Cell specification
   * @returns true if valid
   */
  public cellIsValid(spec: string | IRowColumn | ICell): boolean {
    return this._session.cellIsValid(spec);
  }

  /**
   * Checks if a cell has a value.
   * @param spec - Cell specification
   * @returns true if cell has value
   */
  public cellHasValue(spec: string | IRowColumn | ICell): boolean {
    return this._session.cellHasValue(spec);
  }

  /**
   * Checks if a value is valid for a cell.
   * @param spec - Cell specification
   * @param value - Value to check
   * @returns true if valid
   */
  public isValidForCell(spec: string | IRowColumn | ICell, value: number): boolean {
    return this._session.isValidForCell(spec, value);
  }

  /**
   * Gets a cell neighbor.
   * @param spec - Cell specification
   * @param direction - Navigation direction
   * @param wrap - Wrap behavior
   * @returns Result containing neighbor cell
   */
  public getCellNeighbor(
    spec: string | IRowColumn | ICell,
    direction: import('../common').NavigationDirection,
    wrap: import('../common').NavigationWrap
  ): Result<ICell> {
    return this._session.getCellNeighbor(spec, direction, wrap);
  }

  /**
   * Gets cell contents.
   * @param spec - Cell specification
   * @returns Result containing cell and contents
   */
  public getCellContents(
    spec: string | IRowColumn
  ): Result<{ cell: ICell; contents: import('../common').ICellContents }> {
    return this._session.getCellContents(spec);
  }

  /**
   * Checks if a cage contains a value.
   * @param spec - Cage specification
   * @param value - Value to check
   * @returns true if cage contains value
   */
  public cageContainsValue(spec: string | import('../common').ICage, value: number): boolean {
    return this._session.cageContainsValue(spec, value);
  }

  /**
   * Gets contained values in a cage.
   * @param spec - Cage specification
   * @returns Set of contained values
   */
  public cageContainedValues(spec: string | import('../common').ICage): Set<number> {
    return this._session.cageContainedValues(spec);
  }

  /**
   * Gets string representation of the puzzle.
   * @returns Array of strings representing puzzle rows
   */
  public toStrings(): string[] {
    return this._session.toStrings();
  }

  // Private cache management methods

  /**
   * Generates a cache key for the current state and options.
   * @param options - Hint generation options
   * @returns Cache key
   */
  private _generateCacheKey(options?: IHintGenerationOptions): IHintCacheKey {
    // Simple state hash based on cell values and notes
    const stateString = this._session.toStrings().join('|');
    const notesString = this._session.cells
      .map((cell) => {
        const contents = this._session
          .getCellContents(cell.id)
          .orDefault({ cell, contents: { value: undefined, notes: [] } });
        return `${cell.id}:${contents.contents.notes.join(',')}`;
      })
      .join('|');

    const stateHash = `${stateString}#${notesString}`;
    const optionsString = options ? JSON.stringify(options) : '';

    return { stateHash, options: optionsString };
  }

  /**
   * Gets cached hints if valid.
   * @param options - Hint generation options
   * @returns Cached hints or undefined
   */
  private _getCachedHints(options?: IHintGenerationOptions): readonly IHint[] | undefined {
    if (!this._hintCache) {
      return undefined;
    }

    const cacheKey = this._generateCacheKey(options);
    /* c8 ignore next 1 - ?? is defense in depth */
    const timeoutMs = this._config.cacheTimeoutMs ?? 5000;
    const now = Date.now();

    // Check if cache is still valid
    if (
      this._hintCache.cacheKey.stateHash === cacheKey.stateHash &&
      this._hintCache.cacheKey.options === cacheKey.options &&
      now - this._hintCache.generatedAt < timeoutMs
    ) {
      return this._hintCache.hints;
    }

    return undefined;
  }

  /**
   * Updates the cache with new hints.
   * @param hints - Generated hints
   * @param options - Generation options
   */
  private _updateCache(hints: readonly IHint[], options?: IHintGenerationOptions): void {
    const cacheKey = this._generateCacheKey(options);
    this._hintCache = {
      hints,
      generatedAt: Date.now(),
      cacheKey
    };
  }

  /**
   * Invalidates the current hint cache.
   */
  private _invalidateCache(): void {
    this._hintCache = undefined;
  }
}
