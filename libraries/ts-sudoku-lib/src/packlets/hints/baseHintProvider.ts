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

import { Result, fail, succeed } from '@fgv/ts-utils';
import { CellId, Ids, PuzzleState } from '../common';
import { IHintProvider } from './interfaces';
import {
  ConfidenceLevel,
  ConfidenceLevels,
  DifficultyLevel,
  ExplanationLevel,
  ICellAction,
  IHint,
  IHintExplanation,
  IHintGenerationOptions,
  IRelevantCells,
  TechniqueId
} from './types';

/**
 * Configuration for a BaseHintProvider instance.
 * @public
 */
export interface IBaseHintProviderConfig {
  readonly techniqueId: TechniqueId;
  readonly techniqueName: string;
  readonly difficulty: DifficultyLevel;
  readonly priority: number;
  readonly defaultConfidence?: ConfidenceLevel;
}

/**
 * Abstract base class providing common functionality for hint providers.
 * @public
 */
export abstract class BaseHintProvider implements IHintProvider {
  public readonly techniqueId: TechniqueId;
  public readonly techniqueName: string;
  public readonly difficulty: DifficultyLevel;
  public readonly priority: number;

  protected readonly defaultConfidence: ConfidenceLevel;

  protected constructor(config: IBaseHintProviderConfig) {
    this.techniqueId = config.techniqueId;
    this.techniqueName = config.techniqueName;
    this.difficulty = config.difficulty;
    this.priority = config.priority;
    this.defaultConfidence = config.defaultConfidence ?? ConfidenceLevels.MEDIUM;
  }

  /**
   * Abstract method to be implemented by concrete providers.
   * Determines if this provider can potentially generate hints for the given puzzle state.
   */
  public abstract canProvideHints(state: PuzzleState): boolean;

  /**
   * Abstract method to be implemented by concrete providers.
   * Generates all possible hints using this technique for the given puzzle state.
   */
  public abstract generateHints(
    state: PuzzleState,
    options?: IHintGenerationOptions
  ): Result<readonly IHint[]>;

  /**
   * Utility method to create a hint with consistent structure.
   * @param cellActions - The actions to be performed on cells
   * @param relevantCells - The cells relevant to understanding the hint
   * @param explanations - The explanations for the hint
   * @param confidence - The confidence level for this hint
   * @returns A complete hint object
   */
  protected createHint(
    cellActions: readonly ICellAction[],
    relevantCells: IRelevantCells,
    explanations: readonly IHintExplanation[],
    confidence?: ConfidenceLevel
  ): IHint {
    return {
      techniqueId: this.techniqueId,
      techniqueName: this.techniqueName,
      difficulty: this.difficulty,
      confidence: confidence ?? this.defaultConfidence,
      cellActions,
      relevantCells,
      explanations,
      priority: this.priority
    };
  }

  /**
   * Utility method to create cell actions.
   * @param cellId - The ID of the cell to act upon
   * @param action - The type of action to perform
   * @param value - Optional value for set-value actions
   * @param reason - Optional reason for the action
   * @returns A cell action object
   */
  protected createCellAction(
    cellId: CellId,
    action: ICellAction['action'],
    value?: number,
    reason?: string
  ): ICellAction {
    return {
      cellId,
      action,
      value,
      reason
    };
  }

  /**
   * Utility method to create relevant cells grouping.
   * @param primary - Primary cells that are the focus of the hint
   * @param secondary - Secondary cells that provide context
   * @param affected - Cells that will be affected by applying the hint
   * @returns A relevant cells object
   */
  protected createRelevantCells(
    primary: readonly CellId[],
    secondary: readonly CellId[] = [],
    affected: readonly CellId[] = []
  ): IRelevantCells {
    return {
      primary,
      secondary,
      affected
    };
  }

  /**
   * Utility method to create hint explanations.
   * @param level - The level of detail for the explanation
   * @param title - The title of the explanation
   * @param description - The main description
   * @param steps - Optional step-by-step instructions
   * @param tips - Optional tips for understanding the technique
   * @returns A hint explanation object
   */
  protected createExplanation(
    level: ExplanationLevel,
    title: string,
    description: string,
    steps?: readonly string[],
    tips?: readonly string[]
  ): IHintExplanation {
    return {
      level,
      title,
      description,
      steps,
      tips
    };
  }

  /**
   * Filters hints based on generation options.
   * @param hints - The hints to filter
   * @param options - The filtering options
   * @returns Filtered array of hints
   */
  protected filterHints(hints: readonly IHint[], options?: IHintGenerationOptions): readonly IHint[] {
    if (!options) {
      return hints;
    }

    let filtered = [...hints];

    // Filter by minimum confidence
    if (options.minConfidence) {
      filtered = filtered.filter((hint) => hint.confidence >= options.minConfidence!);
    }

    // Filter by enabled techniques
    if (options.enabledTechniques && options.enabledTechniques.length > 0) {
      filtered = filtered.filter((hint) => options.enabledTechniques!.includes(hint.techniqueId));
    }

    // Limit number of hints
    if (options.maxHints && options.maxHints > 0) {
      // Sort by confidence (descending) then priority (ascending)
      filtered.sort((a, b) => {
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence;
        }
        return a.priority - b.priority;
      });
      filtered = filtered.slice(0, options.maxHints);
    }

    return filtered;
  }

  /**
   * Validates generation options for consistency.
   * @param options - The options to validate
   * @returns Result indicating validation success or failure
   */
  protected validateOptions(options?: IHintGenerationOptions): Result<void> {
    if (!options) {
      return succeed(undefined);
    }

    if (options.maxHints !== undefined && options.maxHints < 0) {
      return fail('maxHints cannot be negative');
    }

    if (options.minConfidence !== undefined && (options.minConfidence < 1 || options.minConfidence > 5)) {
      return fail('minConfidence must be between 1 and 5');
    }

    return succeed(undefined);
  }

  /**
   * Gets all empty cells in the puzzle state.
   * @param state - The puzzle state to analyze
   * @returns Array of cell IDs that are empty
   */
  protected getEmptyCells(state: PuzzleState): CellId[] {
    const emptyCells: CellId[] = [];

    // Iterate through all possible cell positions (assuming 9x9 grid)
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cellIdResult = Ids.cellId({ row, col });
        if (cellIdResult.isSuccess() && !state.hasValue(cellIdResult.value)) {
          emptyCells.push(cellIdResult.value);
        }
      }
    }

    return emptyCells;
  }

  /**
   * Gets the possible candidate values for a specific cell.
   * This is a basic implementation that can be overridden by subclasses.
   * @param cellId - The cell to analyze
   * @param state - The current puzzle state
   * @returns Array of possible values (1-9) for the cell
   */
  protected getCandidates(cellId: CellId, state: PuzzleState): number[] {
    if (state.hasValue(cellId)) {
      return [];
    }

    const candidates: number[] = [];
    const usedValues = new Set<number>();

    // Extract row and column from cellId (format "[A-Z][0-9]", e.g., "A1", "B2")
    const cellStr = cellId.toString();
    if (cellStr.length !== 2) {
      return [];
    }

    const rowChar = cellStr.charCodeAt(0);
    const colChar = cellStr.charCodeAt(1);

    // Validate format and extract coordinates
    if (
      rowChar < 'A'.charCodeAt(0) ||
      rowChar > 'I'.charCodeAt(0) ||
      colChar < '1'.charCodeAt(0) ||
      colChar > '9'.charCodeAt(0)
    ) {
      return [];
    }

    const row = rowChar - 'A'.charCodeAt(0); // A=0, B=1, ..., I=8
    const col = colChar - '1'.charCodeAt(0); // 1=0, 2=1, ..., 9=8

    // Check row for used values
    for (let c = 0; c < 9; c++) {
      const checkIdResult = Ids.cellId({ row, col: c });
      if (checkIdResult.isSuccess()) {
        const contents = state.getCellContents(checkIdResult.value).orDefault();
        if (contents?.value) {
          usedValues.add(contents.value);
        }
      }
    }

    // Check column for used values
    for (let r = 0; r < 9; r++) {
      const checkIdResult = Ids.cellId({ row: r, col });
      if (checkIdResult.isSuccess()) {
        const contents = state.getCellContents(checkIdResult.value).orDefault();
        if (contents?.value) {
          usedValues.add(contents.value);
        }
      }
    }

    // Check 3x3 box for used values
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;

    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
      for (let c = boxStartCol; c < boxStartCol + 3; c++) {
        const checkIdResult = Ids.cellId({ row: r, col: c });
        if (checkIdResult.isSuccess()) {
          const contents = state.getCellContents(checkIdResult.value).orDefault();
          if (contents?.value) {
            usedValues.add(contents.value);
          }
        }
      }
    }

    // Generate candidates (values not used in row, column, or box)
    for (let value = 1; value <= 9; value++) {
      if (!usedValues.has(value)) {
        candidates.push(value);
      }
    }

    return candidates;
  }
}
