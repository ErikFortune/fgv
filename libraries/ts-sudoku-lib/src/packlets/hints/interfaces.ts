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

import { Result } from '@fgv/ts-utils';
import { Puzzle, PuzzleState, ISudokuLoggingContext } from '../common';
import { DifficultyLevel, IHint, IHintGenerationOptions, TechniqueId } from './types';

/**
 * Interface for classes that can provide hints using a specific solving technique.
 * @public
 */
export interface IHintProvider {
  readonly techniqueId: TechniqueId;
  readonly techniqueName: string;
  readonly difficulty: DifficultyLevel;
  readonly priority: number;

  /**
   * Determines if this provider can potentially generate hints for the given puzzle.
   * This should be a fast check to avoid expensive hint generation when not applicable.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns true if this provider might be able to generate hints
   */
  canProvideHints(puzzle: Puzzle, state: PuzzleState): boolean;

  /**
   * Generates all possible hints using this technique for the given puzzle.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing array of hints, or failure if generation fails
   */
  generateHints(
    puzzle: Puzzle,
    state: PuzzleState,
    options?: IHintGenerationOptions
  ): Result<readonly IHint[]>;
}

/**
 * Interface for managing and coordinating multiple hint providers.
 * @public
 */
export interface IHintRegistry {
  /**
   * Registers a new hint provider.
   * @param provider - The provider to register
   * @returns Result indicating success or failure of registration
   */
  registerProvider(provider: IHintProvider): Result<void>;

  /**
   * Unregisters a hint provider.
   * @param techniqueId - The ID of the technique to unregister
   * @returns Result indicating success or failure of unregistration
   */
  unregisterProvider(techniqueId: TechniqueId): Result<void>;

  /**
   * Gets a specific provider by technique ID.
   * @param techniqueId - The ID of the technique
   * @returns Result containing the provider, or failure if not found
   */
  getProvider(techniqueId: TechniqueId): Result<IHintProvider>;

  /**
   * Gets all registered providers, optionally filtered by criteria.
   * @param options - Optional filtering options
   * @returns Array of providers matching the criteria
   */
  getProviders(options?: IHintGenerationOptions): readonly IHintProvider[];

  /**
   * Generates hints using all applicable providers.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing array of hints from all providers
   */
  generateAllHints(
    puzzle: Puzzle,
    state: PuzzleState,
    options?: IHintGenerationOptions
  ): Result<readonly IHint[]>;

  /**
   * Gets the best available hint based on difficulty and confidence.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing the best hint, or failure if no hints available
   */
  getBestHint(puzzle: Puzzle, state: PuzzleState, options?: IHintGenerationOptions): Result<IHint>;

  /**
   * Gets all registered technique IDs.
   * @returns Array of technique IDs
   */
  getRegisteredTechniques(): readonly TechniqueId[];
}

/**
 * Interface for hint explanation generation and formatting.
 * @public
 */
export interface IHintExplanationProvider {
  /**
   * Gets the technique ID this explanation provider supports.
   */
  readonly techniqueId: TechniqueId;

  /**
   * Generates explanations for a specific hint.
   * @param hint - The hint to explain
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The puzzle state context
   * @returns Result containing array of explanations at different levels
   */
  generateExplanations(
    hint: IHint,
    puzzle: Puzzle,
    state: PuzzleState
  ): Result<readonly import('./types').IHintExplanation[]>;
}

/**
 * Interface for hint application and validation.
 * @public
 */
export interface IHintApplicator {
  /**
   * Validates that a hint can be safely applied to the given state.
   * @param hint - The hint to validate
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @param loggingContext - Optional logging context for diagnostic output
   * @returns Result indicating validation success or failure with details
   */
  validateHint(
    hint: IHint,
    puzzle: Puzzle,
    state: PuzzleState,
    loggingContext?: ISudokuLoggingContext
  ): Result<void>;

  /**
   * Applies a hint to the puzzle state, generating the necessary cell updates.
   * @param hint - The hint to apply
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @param loggingContext - Optional logging context for diagnostic output
   * @returns Result containing the cell state updates needed to apply the hint
   */
  applyHint(
    hint: IHint,
    puzzle: Puzzle,
    state: PuzzleState,
    loggingContext?: ISudokuLoggingContext
  ): Result<readonly import('../common').ICellState[]>;
}
