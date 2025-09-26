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
import { CellId, ICage, Puzzle, PuzzleState } from '../common';
import { BaseHintProvider } from './baseHintProvider';
import { ConfidenceLevels, IHint, IHintGenerationOptions, TechniqueIds } from './types';

/**
 * Represents a unit type for hidden single analysis.
 * Supports any cage type including standard constraints and variants.
 */
type UnitType = string;

/**
 * Information about a hidden single found in a specific unit.
 */
interface IHiddenSingleInfo {
  cellId: CellId;
  value: number;
  unitType: UnitType;
  unitIndex: number;
  otherCandidateCells: CellId[];
}

/**
 * Hint provider for the Hidden Singles technique.
 *
 * A Hidden Single occurs when a value can only be placed in one cell within
 * a row, column, or 3x3 box, even though that cell may have multiple candidates.
 *
 * @public
 */
export class HiddenSinglesProvider extends BaseHintProvider {
  /**
   * Creates a new HiddenSinglesProvider instance.
   */
  public constructor() {
    super({
      techniqueId: TechniqueIds.HIDDEN_SINGLES,
      techniqueName: 'Hidden Singles',
      difficulty: 'beginner',
      priority: 2, // Second priority after naked singles
      defaultConfidence: ConfidenceLevels.HIGH
    });
  }

  /**
   * Determines if this provider can potentially generate hints for the given puzzle.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns true if there are empty cells that might have hidden singles
   */
  public canProvideHints(puzzle: Puzzle, state: PuzzleState): boolean {
    const emptyCells = this.getEmptyCells(puzzle, state);
    return emptyCells.length > 0;
  }

  /**
   * Generates all hidden single hints for the given puzzle.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing array of hidden single hints
   */
  public generateHints(
    puzzle: Puzzle,
    state: PuzzleState,
    options?: IHintGenerationOptions
  ): Result<readonly IHint[]> {
    return this.validateOptions(options).onSuccess(() => {
      const hints: IHint[] = [];
      const hiddenSingles = this._findAllHiddenSingles(puzzle, state);

      for (const hiddenSingle of hiddenSingles) {
        const hint = this._createHiddenSingleHint(hiddenSingle, puzzle, state);
        hints.push(hint);
      }

      return succeed(this.filterHints(hints, options));
    });
  }

  /**
   * Finds all hidden singles in the puzzle using cage-based analysis.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Array of hidden single information
   */
  private _findAllHiddenSingles(puzzle: Puzzle, state: PuzzleState): IHiddenSingleInfo[] {
    const hiddenSingles: IHiddenSingleInfo[] = [];

    // Check all cages for hidden singles
    for (const cage of puzzle.cages) {
      hiddenSingles.push(...this._findHiddenSinglesInCage(cage, puzzle, state));
    }

    // Remove duplicates (a cell might be found as hidden single in multiple cages)
    return this._removeDuplicateHiddenSingles(hiddenSingles);
  }

  /**
   * Finds hidden singles in a specific cage using dynamic value analysis.
   * @param cage - The cage to analyze
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Array of hidden singles in this cage
   */
  private _findHiddenSinglesInCage(cage: ICage, puzzle: Puzzle, state: PuzzleState): IHiddenSingleInfo[] {
    const hiddenSingles: IHiddenSingleInfo[] = [];
    const maxValue = Math.sqrt(puzzle.numRows * puzzle.numColumns);

    // For each possible value, check if it can only go in one cell in this cage
    for (let value = 1; value <= maxValue; value++) {
      const possibleCells: CellId[] = [];

      for (const cellId of cage.cellIds) {
        const candidates = this.getCandidates(cellId, puzzle, state);
        if (candidates.includes(value)) {
          possibleCells.push(cellId);
        }
      }

      // Hidden single: exactly one cell can contain this value
      if (possibleCells.length === 1) {
        const cellId = possibleCells[0];
        const otherCandidateCells = cage.cellIds.filter((id: CellId) => id !== cellId && !state.hasValue(id));

        hiddenSingles.push({
          cellId,
          value,
          unitType: cage.cageType as UnitType,
          unitIndex: this._getCageDisplayIndex(cage),
          otherCandidateCells
        });
      }
    }

    return hiddenSingles;
  }

  /**
   * Gets a display-friendly index for a cage.
   * @param cage - The cage to get index for
   * @returns Display index for the cage
   */
  private _getCageDisplayIndex(cage: ICage): number {
    // Extract numeric part from cage ID if available
    const match = cage.id.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Removes duplicate hidden singles (same cell and value).
   * @param hiddenSingles - Array of potentially duplicate hidden singles
   * @returns Array with duplicates removed
   */
  private _removeDuplicateHiddenSingles(hiddenSingles: IHiddenSingleInfo[]): IHiddenSingleInfo[] {
    const seen = new Set<string>();
    const unique: IHiddenSingleInfo[] = [];

    for (const hiddenSingle of hiddenSingles) {
      const key = `${hiddenSingle.cellId}-${hiddenSingle.value}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(hiddenSingle);
      }
    }

    return unique;
  }

  /**
   * Creates a hint for a specific hidden single.
   * @param hiddenSingle - The hidden single information
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns A complete hint for this hidden single
   */
  private _createHiddenSingleHint(
    hiddenSingle: IHiddenSingleInfo,
    __puzzle: Puzzle,
    __state: PuzzleState
  ): IHint {
    const { cellId, value, unitType, unitIndex } = hiddenSingle;

    // Create cell action to set the value
    const cellAction = this.createCellAction(
      cellId,
      'set-value',
      value,
      `Only cell in ${unitType} ${unitIndex} that can contain ${value}`
    );

    // Create relevant cells grouping
    const relevantCells = this.createRelevantCells(
      [cellId], // Primary: the cell with the hidden single
      hiddenSingle.otherCandidateCells, // Secondary: other empty cells in the unit
      [] // Affected: none for hidden singles
    );

    // Create explanations at different levels
    const unitName = this._getUnitName(unitType, unitIndex);
    const explanations = [
      this.createExplanation(
        'brief',
        'Hidden Single',
        `In ${unitName}, the value ${value} can only go in cell ${cellId}.`,
        [`Set ${cellId} = ${value}`],
        ['Look for values that can only go in one cell within a unit']
      ),

      this.createExplanation(
        'detailed',
        'Hidden Single Analysis',
        `In ${unitName}, the value ${value} can only be placed in cell ${cellId}. While this cell ` +
          `may have other candidates, ${value} has no other valid positions in this ${unitType}.`,
        [
          `Examine all empty cells in ${unitName}`,
          `For each empty cell, determine which values are possible candidates`,
          `Check where the value ${value} can be placed`,
          `Identify that ${value} can only go in ${cellId}`,
          `Set ${cellId} = ${value}`
        ],
        [
          'Hidden singles focus on where a value can go, not what can go in a cell',
          'Check each value 1-9 systematically within each unit',
          'A value with only one possible position must go there'
        ]
      ),

      this.createExplanation(
        'educational',
        'Understanding Hidden Singles',
        `A hidden single occurs when a particular value can only be placed in one cell within a ` +
          `row, column, or 3x3 box. In ${unitName}, we need to place the value ${value} somewhere, ` +
          `but due to constraints from other filled cells, it can only go in ${cellId}. This technique ` +
          `is called "hidden" because the single placement might not be obvious when looking at the ` +
          `cell's candidates alone - you need to consider the entire unit.`,
        [
          `Focus on ${unitName}`,
          `Identify that this unit needs the value ${value} to be placed somewhere`,
          `Examine each empty cell in this ${unitType} to see if ${value} could be placed there`,
          `Consider the constraints from the cell's row, column, and box`,
          `Eliminate cells where ${value} cannot go due to conflicts`,
          `Confirm that ${cellId} is the only remaining option for ${value}`,
          `Place ${value} in cell ${cellId}`
        ],
        [
          'Hidden singles complement naked singles - use both techniques together',
          'Systematically check each value 1-9 in each row, column, and box',
          'This technique often reveals itself after placing other numbers',
          'Hidden singles can exist even when a cell has many candidates'
        ]
      )
    ];

    return this.createHint([cellAction], relevantCells, explanations, ConfidenceLevels.HIGH);
  }

  /**
   * Gets a human-readable name for a unit.
   * @param unitType - The type of unit
   * @param unitIndex - The index of the unit
   * @returns Human-readable unit name
   */
  private _getUnitName(unitType: UnitType, unitIndex: number): string {
    switch (unitType) {
      case 'row':
        return `row ${unitIndex + 1}`;
      case 'column':
        return `column ${unitIndex + 1}`;
      case 'box':
        const boxRow = Math.floor(unitIndex / 3);
        const boxCol = unitIndex % 3;
        return `box (${boxRow + 1},${boxCol + 1})`;
      default:
        return `${unitType} ${unitIndex}`;
    }
  }

  /**
   * Static factory method to create a new HiddenSinglesProvider.
   * @returns Result containing the new provider
   */
  public static create(): Result<HiddenSinglesProvider> {
    return succeed(new HiddenSinglesProvider());
  }
}
