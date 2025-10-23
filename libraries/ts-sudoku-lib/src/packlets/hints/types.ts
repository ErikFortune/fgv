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

import { Brand } from '@fgv/ts-utils';
import { CellId } from '../common';

/**
 * Nominal identifier for a hint generation technique.
 * @public
 */
export type TechniqueId = Brand<string, 'TechniqueId'>;

/**
 * Confidence level for a generated hint, ranging from 1 (low) to 5 (high).
 * @public
 */
export type ConfidenceLevel = Brand<1 | 2 | 3 | 4 | 5, 'ConfidenceLevel'>;

/**
 * The type of action that should be taken on a cell as part of a hint.
 * @public
 */
export type CellAction = 'set-value' | 'eliminate-candidate' | 'add-candidate' | 'highlight';

/**
 * The level of detail for hint explanations.
 * @public
 */
export type ExplanationLevel = 'brief' | 'detailed' | 'educational';

/**
 * Standard difficulty classifications for Sudoku techniques.
 * @public
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Describes an action to be taken on a specific cell as part of a hint.
 * @public
 */
export interface ICellAction {
  readonly cellId: CellId;
  readonly action: CellAction;
  readonly value?: number;
  readonly reason?: string;
}

/**
 * Information about the cells that are relevant to understanding a hint.
 * @public
 */
export interface IRelevantCells {
  readonly primary: readonly CellId[];
  readonly secondary: readonly CellId[];
  readonly affected: readonly CellId[];
}

/**
 * A hint explanation at a specific level of detail.
 * @public
 */
export interface IHintExplanation {
  readonly level: ExplanationLevel;
  readonly title: string;
  readonly description: string;
  readonly steps?: readonly string[];
  readonly tips?: readonly string[];
}

/**
 * A complete hint with all necessary information for display and application.
 * @public
 */
export interface IHint {
  readonly techniqueId: TechniqueId;
  readonly techniqueName: string;
  readonly difficulty: DifficultyLevel;
  readonly confidence: ConfidenceLevel;
  readonly cellActions: readonly ICellAction[];
  readonly relevantCells: IRelevantCells;
  readonly explanations: readonly IHintExplanation[];
  readonly priority: number;
}

/**
 * Configuration options for hint generation.
 * @public
 */
export interface IHintGenerationOptions {
  readonly maxHints?: number;
  readonly minConfidence?: ConfidenceLevel;
  readonly preferredDifficulty?: DifficultyLevel;
  readonly enabledTechniques?: readonly TechniqueId[];
  readonly explanationLevel?: ExplanationLevel;
}

/**
 * Standard technique identifiers for built-in solving techniques.
 * @public
 */
export const TechniqueIds = {
  NAKED_SINGLES: 'naked-singles' as TechniqueId,
  HIDDEN_SINGLES: 'hidden-singles' as TechniqueId
} as const;

/**
 * Standard confidence levels as branded types.
 * @public
 */
export const ConfidenceLevels = {
  LOW: 1 as ConfidenceLevel,
  MEDIUM_LOW: 2 as ConfidenceLevel,
  MEDIUM: 3 as ConfidenceLevel,
  MEDIUM_HIGH: 4 as ConfidenceLevel,
  HIGH: 5 as ConfidenceLevel
} as const;
