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
import { CellId, Puzzle, PuzzleState } from '../common';
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
 * Configuration for a {@link Hints.BaseHintProvider | BaseHintProvider} instance.
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
   * Determines if this provider can potentially generate hints for the given puzzle.
   */
  public abstract canProvideHints(puzzle: Puzzle, state: PuzzleState): boolean;

  /**
   * Abstract method to be implemented by concrete providers.
   * Generates all possible hints using this technique for the given puzzle.
   */
  public abstract generateHints(
    puzzle: Puzzle,
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
    /* c8 ignore next 1 - defense in depth */
    confidence = confidence ?? this.defaultConfidence;
    return {
      techniqueId: this.techniqueId,
      techniqueName: this.techniqueName,
      difficulty: this.difficulty,
      confidence,
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
   * Gets all empty cells in the puzzle.
   * @param puzzle - The puzzle structure
   * @param state - The puzzle state to analyze
   * @returns Array of cell IDs that are empty
   */
  protected getEmptyCells(puzzle: Puzzle, state: PuzzleState): CellId[] {
    return puzzle.getEmptyCells(state).map((cell) => cell.id);
  }

  /**
   * Gets the possible candidate values for a specific cell using cage-based constraints.
   * This implementation works with any puzzle variant by checking all applicable cages.
   * @param cellId - The cell to analyze
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Array of possible values for the cell
   */
  protected getCandidates(cellId: CellId, puzzle: Puzzle, state: PuzzleState): number[] {
    if (state.hasValue(cellId)) {
      return [];
    }

    // Get maximum value based on grid size (typically sqrt of total cells)
    const maxValue = Math.sqrt(puzzle.numRows * puzzle.numColumns);

    // Find all cages that contain this cell
    const applicableCages = puzzle.cages.filter((cage) => cage.containsCell(cellId));

    // Collect all values that are forbidden due to cage constraints
    const usedValues = new Set<number>();

    for (const cage of applicableCages) {
      const cageValues = cage.containedValues(state);
      cageValues.forEach((value) => usedValues.add(value));
    }

    // Generate candidates (values not used in any applicable cage)
    const candidates: number[] = [];
    for (let value = 1; value <= maxValue; value++) {
      if (!usedValues.has(value)) {
        candidates.push(value);
      }
    }

    return candidates;
  }
}
