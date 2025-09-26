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

import { Result, fail, succeed, mapResults } from '@fgv/ts-utils';
import { PuzzleState } from '../common';
import { IHintProvider, IHintRegistry } from './interfaces';
import { DifficultyLevel, IHint, IHintGenerationOptions, TechniqueId } from './types';

/**
 * Implementation of the hint registry that manages and coordinates multiple hint providers.
 * @public
 */
export class HintRegistry implements IHintRegistry {
  private readonly _providers: Map<TechniqueId, IHintProvider>;

  /**
   * Creates a new HintRegistry instance.
   */
  public constructor() {
    this._providers = new Map();
  }

  /**
   * Creates a new HintRegistry with the specified providers pre-registered.
   * @param providers - The providers to register
   * @returns Result containing the new registry or failure if registration fails
   */
  public static create(providers?: readonly IHintProvider[]): Result<HintRegistry> {
    const registry = new HintRegistry();

    if (providers && providers.length > 0) {
      for (const provider of providers) {
        const result = registry.registerProvider(provider);
        if (result.isFailure()) {
          return fail(`Failed to register provider ${provider.techniqueId}: ${result.message}`);
        }
      }
    }

    return succeed(registry);
  }

  /**
   * Registers a new hint provider.
   * @param provider - The provider to register
   * @returns Result indicating success or failure of registration
   */
  public registerProvider(provider: IHintProvider): Result<void> {
    if (this._providers.has(provider.techniqueId)) {
      return fail(`Provider for technique ${provider.techniqueId} is already registered`);
    }

    this._providers.set(provider.techniqueId, provider);
    return succeed(undefined);
  }

  /**
   * Unregisters a hint provider.
   * @param techniqueId - The ID of the technique to unregister
   * @returns Result indicating success or failure of unregistration
   */
  public unregisterProvider(techniqueId: TechniqueId): Result<void> {
    if (!this._providers.has(techniqueId)) {
      return fail(`No provider registered for technique ${techniqueId}`);
    }

    this._providers.delete(techniqueId);
    return succeed(undefined);
  }

  /**
   * Gets a specific provider by technique ID.
   * @param techniqueId - The ID of the technique
   * @returns Result containing the provider, or failure if not found
   */
  public getProvider(techniqueId: TechniqueId): Result<IHintProvider> {
    const provider = this._providers.get(techniqueId);
    return provider ? succeed(provider) : fail(`No provider found for technique ${techniqueId}`);
  }

  /**
   * Gets all registered providers, optionally filtered by criteria.
   * @param options - Optional filtering options
   * @returns Array of providers matching the criteria
   */
  public getProviders(options?: IHintGenerationOptions): readonly IHintProvider[] {
    const providers = Array.from(this._providers.values());

    if (!options) {
      return providers;
    }

    let filtered = providers;

    // Filter by enabled techniques
    if (options.enabledTechniques && options.enabledTechniques.length > 0) {
      filtered = filtered.filter((provider) => options.enabledTechniques!.includes(provider.techniqueId));
    }

    // Filter by preferred difficulty (exact match for now)
    if (options.preferredDifficulty) {
      filtered = filtered.filter((provider) => provider.difficulty === options.preferredDifficulty);
    }

    return filtered;
  }

  /**
   * Generates hints using all applicable providers.
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing array of hints from all providers
   */
  public generateAllHints(state: PuzzleState, options?: IHintGenerationOptions): Result<readonly IHint[]> {
    const applicableProviders = this.getProviders(options).filter((provider) =>
      provider.canProvideHints(state)
    );

    if (applicableProviders.length === 0) {
      return succeed([]);
    }

    // Generate hints from all applicable providers
    const hintResults = applicableProviders.map((provider) => provider.generateHints(state, options));

    return mapResults(hintResults).onSuccess((allHints) => {
      // Flatten the array of hint arrays
      const flatHints = allHints.flat();

      // Sort by priority (ascending) then confidence (descending)
      const sortedHints = flatHints.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return b.confidence - a.confidence;
      });

      // Apply global filtering options
      return this._applyGlobalFiltering(sortedHints, options);
    });
  }

  /**
   * Gets the best available hint based on difficulty and confidence.
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing the best hint, or failure if no hints available
   */
  public getBestHint(state: PuzzleState, options?: IHintGenerationOptions): Result<IHint> {
    return this.generateAllHints(state, options).onSuccess((hints) => {
      if (hints.length === 0) {
        return fail('No hints available for the current puzzle state');
      }

      // Return the first hint (already sorted by priority and confidence)
      return succeed(hints[0]);
    });
  }

  /**
   * Gets the number of registered providers.
   * @returns The number of registered providers
   */
  public get providerCount(): number {
    return this._providers.size;
  }

  /**
   * Gets all registered technique IDs.
   * @returns Array of technique IDs
   */
  public getRegisteredTechniques(): readonly TechniqueId[] {
    return Array.from(this._providers.keys());
  }

  /**
   * Checks if a specific technique is registered.
   * @param techniqueId - The technique ID to check
   * @returns true if the technique is registered
   */
  public hasProvider(techniqueId: TechniqueId): boolean {
    return this._providers.has(techniqueId);
  }

  /**
   * Clears all registered providers.
   * @returns Result indicating success
   */
  public clear(): Result<void> {
    this._providers.clear();
    return succeed(undefined);
  }

  /**
   * Gets providers grouped by difficulty level.
   * @returns Map of difficulty levels to providers
   */
  public getProvidersByDifficulty(): Map<DifficultyLevel, readonly IHintProvider[]> {
    const providersByDifficulty = new Map<DifficultyLevel, IHintProvider[]>();

    for (const provider of this._providers.values()) {
      const existing = providersByDifficulty.get(provider.difficulty) ?? [];
      existing.push(provider);
      providersByDifficulty.set(provider.difficulty, existing);
    }

    // Convert to readonly arrays
    const result = new Map<DifficultyLevel, readonly IHintProvider[]>();
    for (const [difficulty, providers] of providersByDifficulty.entries()) {
      result.set(difficulty, providers);
    }

    return result;
  }

  /**
   * Applies global filtering options to the collected hints.
   * @param hints - The hints to filter
   * @param options - The filtering options
   * @returns Result containing the filtered hints
   */
  private _applyGlobalFiltering(
    hints: readonly IHint[],
    options?: IHintGenerationOptions
  ): Result<readonly IHint[]> {
    if (!options) {
      return succeed(hints);
    }

    let filtered = [...hints];

    // Apply minimum confidence filter
    if (options.minConfidence) {
      filtered = filtered.filter((hint) => hint.confidence >= options.minConfidence!);
    }

    // Apply maximum hints limit
    if (options.maxHints && options.maxHints > 0 && filtered.length > options.maxHints) {
      filtered = filtered.slice(0, options.maxHints);
    }

    return succeed(filtered);
  }
}
