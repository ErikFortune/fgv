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

import { Result, fail, succeed, Logging, mapResults } from '@fgv/ts-utils';
import { ICellState, Puzzle, PuzzleState, DefaultSudokuLogger } from '../common';
import { ExplanationFormatter } from './explanations';
import { HintRegistry } from './hintRegistry';
import { HiddenSinglesProvider } from './hiddenSingles';
import { IHintApplicator, IHintRegistry } from './interfaces';
import { NakedSinglesProvider } from './nakedSingles';
import { ExplanationLevel, IHint, IHintGenerationOptions, TechniqueId } from './types';

/**
 * Configuration options for the hint system.
 * @public
 */
export interface IHintSystemConfig {
  readonly enableNakedSingles?: boolean;
  readonly enableHiddenSingles?: boolean;
  readonly defaultExplanationLevel?: ExplanationLevel;
  readonly logger?: Logging.LogReporter<unknown>;
}

/**
 * Default hint applicator that converts hints to cell state updates.
 * @public
 */
export class DefaultHintApplicator implements IHintApplicator {
  private readonly _log: Logging.LogReporter<unknown>;

  /**
   * Creates a new {@link Hints.DefaultHintApplicator | DefaultHintApplicator}.
   * @param logger - Optional logger for diagnostic output
   */
  public constructor(logger?: Logging.LogReporter<unknown>) {
    /* c8 ignore next 1 - defense in depth */
    this._log = logger ?? DefaultSudokuLogger;
  }

  /**
   * Validates that a hint can be safely applied to the given state.
   * @param hint - The hint to validate
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Result indicating validation success or failure with details
   */
  public canApplyHint(hint: IHint, puzzle: Puzzle, state: PuzzleState): Result<void> {
    const maxValue = Math.sqrt(puzzle.numRows * puzzle.numColumns);

    // Validate all cell actions
    const validations = hint.cellActions.map((action) => {
      // Only support set-value actions for now
      if (action.action !== 'set-value') {
        return fail(`Unsupported action type: ${action.action}`);
      }

      // Validate the value to be set
      if (action.value === undefined) {
        return fail(`No value specified for set-value action on cell ${action.cellId}`);
      }

      if (action.value < 1 || action.value > maxValue) {
        return fail(`Invalid value ${action.value} for cell ${action.cellId} (must be 1-${maxValue})`);
      }

      // Check that the cell exists and is empty
      return state
        .getCellContents(action.cellId)
        .withErrorFormat((e) => `Invalid cell ${action.cellId}: ${e}`)
        .onSuccess((cellContents) => {
          if (cellContents.value !== undefined) {
            return fail(`Cell ${action.cellId} already has value ${cellContents.value}`);
          }
          return succeed(undefined);
        });
    });

    return mapResults(validations).onSuccess(() => succeed(undefined));
  }

  /**
   * Applies a hint to the puzzle state, generating the necessary cell updates.
   * @param hint - The hint to apply
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Result containing the cell state updates needed to apply the hint
   */
  public applyHint(hint: IHint, puzzle: Puzzle, state: PuzzleState): Result<readonly ICellState[]> {
    this._log.detail(`Applying hint: ${hint.techniqueName} affecting ${hint.cellActions.length} cell(s)`);

    return this.canApplyHint(hint, puzzle, state).onSuccess(() => {
      const updates: ICellState[] = [];

      for (const action of hint.cellActions) {
        if (action.action === 'set-value' && action.value !== undefined) {
          // Get current cell contents to preserve notes
          const cellResult = state.getCellContents(action.cellId);
          /* c8 ignore next 3 - internal error should never happen in practice */
          if (cellResult.isFailure()) {
            return fail(`Failed to get cell contents: ${cellResult.message}`);
          }

          updates.push({
            id: action.cellId,
            value: action.value,
            notes: cellResult.value.notes // Preserve existing notes
          });
        }
      }

      this._log.info(`Successfully applied hint: ${hint.techniqueName}, updated ${updates.length} cell(s)`);
      return succeed(updates);
    });
  }
}

/**
 * Main hint system that provides comprehensive hint generation and management.
 * @public
 */
export class HintSystem {
  private readonly _registry: IHintRegistry;
  private readonly _applicator: IHintApplicator;
  private readonly _config: IHintSystemConfig;
  private readonly _log: Logging.LogReporter<unknown>;
  private readonly _logHints: Logging.LogReporter<ReadonlyArray<IHint>>;

  /**
   * Creates a new HintSystem instance.
   * @param registry - The hint registry to use
   * @param applicator - The hint applicator to use
   * @param config - Configuration options
   */
  public constructor(registry: IHintRegistry, applicator: IHintApplicator, config: IHintSystemConfig) {
    this._registry = registry;
    this._applicator = applicator;
    this._config = config;
    this._log = config.logger ?? DefaultSudokuLogger;
    this._logHints = this._log.withValueFormatter(
      (hints: readonly IHint[]) =>
        `Generated ${hints.length} hint(s) using ${
          new Set(hints.map((h) => h.techniqueId)).size
        } technique(s)`
    );
  }

  /**
   * Creates a new HintSystem with default providers and configuration.
   * @param config - Optional configuration options
   * @returns Result containing the new hint system
   */
  public static create(config?: IHintSystemConfig): Result<HintSystem> {
    const finalConfig: IHintSystemConfig = {
      enableNakedSingles: true,
      enableHiddenSingles: true,
      defaultExplanationLevel: 'detailed',
      ...config
    };

    return HintRegistry.create()
      .withErrorFormat((e) => `Failed to create hint registry: ${e}`)
      .onSuccess((registry) => {
        // Register naked singles provider if enabled
        if (finalConfig.enableNakedSingles) {
          const nakedResult = NakedSinglesProvider.create()
            .withErrorFormat((e) => `Failed to create naked singles provider: ${e}`)
            .onSuccess((provider) => registry.registerProvider(provider))
            .withErrorFormat((e) => `Failed to register naked singles provider: ${e}`);

          /* c8 ignore next 3 - defensive coding: provider creation/registration should not fail */
          if (nakedResult.isFailure()) {
            return fail<HintSystem>(nakedResult.message);
          }
        }

        // Register hidden singles provider if enabled
        if (finalConfig.enableHiddenSingles) {
          const hiddenResult = HiddenSinglesProvider.create()
            .withErrorFormat((e) => `Failed to create hidden singles provider: ${e}`)
            .onSuccess((provider) => registry.registerProvider(provider))
            .withErrorFormat((e) => `Failed to register hidden singles provider: ${e}`);

          /* c8 ignore next 3 - defensive coding: provider creation/registration should not fail */
          if (hiddenResult.isFailure()) {
            return fail<HintSystem>(hiddenResult.message);
          }
        }

        // Create applicator and return complete system
        const applicator = new DefaultHintApplicator(finalConfig.logger);
        return succeed(new HintSystem(registry, applicator, finalConfig));
      });
  }

  /**
   * Gets the hint registry.
   * @returns The hint registry
   */
  public get registry(): IHintRegistry {
    return this._registry;
  }

  /**
   * Gets the hint applicator.
   * @returns The hint applicator
   */
  public get applicator(): IHintApplicator {
    return this._applicator;
  }

  /**
   * Gets the system configuration.
   * @returns The configuration
   */
  public get config(): IHintSystemConfig {
    return this._config;
  }

  /**
   * Generates all available hints for the current puzzle state.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing array of hints
   */
  public generateHints(
    puzzle: Puzzle,
    state: PuzzleState,
    options?: IHintGenerationOptions
  ): Result<readonly IHint[]> {
    this._log.detail('Generating hints for puzzle state');

    return this._registry.generateAllHints(puzzle, state, options).report(this._logHints, {
      success: { level: 'info' },
      failure: {
        level: 'warning',
        message: (msg: string) => `Failed to generate hints: ${msg}`
      }
    });
  }

  /**
   * Gets the best available hint for the current puzzle state.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing the best hint
   */
  public getBestHint(puzzle: Puzzle, state: PuzzleState, options?: IHintGenerationOptions): Result<IHint> {
    return this._registry.getBestHint(puzzle, state, options);
  }

  /**
   * Applies a hint to generate cell state updates.
   * @param hint - The hint to apply
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Result containing the cell updates
   */
  public applyHint(hint: IHint, puzzle: Puzzle, state: PuzzleState): Result<readonly ICellState[]> {
    return this._applicator.applyHint(hint, puzzle, state);
  }

  /**
   * Validates that a hint can be applied to the current state.
   * @param hint - The hint to validate
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Result indicating validation success or failure
   */
  public validateHint(hint: IHint, puzzle: Puzzle, state: PuzzleState): Result<void> {
    return this._applicator.canApplyHint(hint, puzzle, state);
  }

  /**
   * Formats a hint explanation for display.
   * @param hint - The hint to format
   * @param level - The explanation level to use (defaults to config default)
   * @returns Formatted explanation string
   */
  public formatHintExplanation(hint: IHint, level?: ExplanationLevel): string {
    /* c8 ignore next 1 - ?? is defense in depth */
    const explanationLevel = level ?? this._config.defaultExplanationLevel ?? 'detailed';
    const explanation = hint.explanations.find((exp) => exp.level === explanationLevel);

    if (!explanation) {
      return `No explanation available at level ${explanationLevel} for ${hint.techniqueName}`;
    }

    return ExplanationFormatter.formatExplanation(explanation);
  }

  /**
   * Gets a summary of the hint system capabilities.
   * @returns System capabilities summary
   */
  public getSystemSummary(): string {
    const techniques = this._registry.getRegisteredTechniques();
    const techniqueNames = techniques.map((id: TechniqueId) => {
      const provider = this._registry.getProvider(id);
      /* c8 ignore next 1 - fallback to id should not happen in practice */
      return provider.isSuccess() ? provider.value.techniqueName : id;
    });

    /* c8 ignore next 1 - ?? is defense in depth */
    const defaultExplanationLevel = this._config.defaultExplanationLevel ?? 'detailed';
    return [
      'Sudoku Hint System',
      '='.repeat(20),
      `Registered Techniques: ${techniques.length}`,
      ...techniqueNames.map((name: string) => `• ${name}`),
      '',
      `Default Explanation Level: ${defaultExplanationLevel}`
    ].join('\n');
  }

  /**
   * Checks if the puzzle state has any available hints.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Result containing boolean indicating if hints are available
   */
  public hasHints(puzzle: Puzzle, state: PuzzleState): Result<boolean> {
    return this.generateHints(puzzle, state, { maxHints: 1 }).onSuccess((hints) => {
      return succeed(hints.length > 0);
    });
  }

  /**
   * Gets statistics about available hints for the current state.
   * @param puzzle - The puzzle structure containing constraints
   * @param state - The current puzzle state
   * @returns Result containing hint statistics
   */
  public getHintStatistics(
    puzzle: Puzzle,
    state: PuzzleState
  ): Result<{
    totalHints: number;
    hintsByTechnique: Map<string, number>;
    hintsByDifficulty: Map<string, number>;
  }> {
    return this.generateHints(puzzle, state).onSuccess((hints) => {
      const hintsByTechnique = new Map<string, number>();
      const hintsByDifficulty = new Map<string, number>();

      for (const hint of hints) {
        // Count by technique
        /* c8 ignore next 1 - ?? is defense in depth */
        const techniqueCount = hintsByTechnique.get(hint.techniqueName) ?? 0;
        hintsByTechnique.set(hint.techniqueName, techniqueCount + 1);

        // Count by difficulty
        const difficultyCount = hintsByDifficulty.get(hint.difficulty) ?? 0;
        hintsByDifficulty.set(hint.difficulty, difficultyCount + 1);
      }

      return succeed({
        totalHints: hints.length,
        hintsByTechnique,
        hintsByDifficulty
      });
    });
  }
}
