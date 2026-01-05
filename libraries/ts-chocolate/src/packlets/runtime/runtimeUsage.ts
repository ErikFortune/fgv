// Copyright (c) 2026 Erik Fortune
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
 * RuntimeUsage - resolved usage record view
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { Grams, RecipeVersionSpec } from '../common';
import { IRecipeUsage } from '../recipes';
import { RuntimeVersion } from './runtimeVersion';
import { RuntimeRecipe } from './runtimeRecipe';

// ============================================================================
// RuntimeUsage Class
// ============================================================================

/**
 * A resolved view of a recipe usage record with linked versions.
 * @public
 */
export class RuntimeUsage {
  private readonly _recipe: RuntimeRecipe;
  private readonly _usage: IRecipeUsage;

  // Lazy-loaded versions
  private _version: RuntimeVersion | undefined;
  private _modifiedVersion: RuntimeVersion | undefined | null; // null means "checked but not found"

  /**
   * Creates a RuntimeUsage.
   * @internal
   */
  public constructor(recipe: RuntimeRecipe, usage: IRecipeUsage) {
    this._recipe = recipe;
    this._usage = usage;
  }

  /**
   * Factory method for creating a RuntimeUsage.
   * @param recipe - The parent RuntimeRecipe
   * @param usage - The raw usage data
   * @returns Success with RuntimeUsage
   */
  public static create(recipe: RuntimeRecipe, usage: IRecipeUsage): Result<RuntimeUsage> {
    return Success.with(new RuntimeUsage(recipe, usage));
  }

  // ============================================================================
  // Core Properties
  // ============================================================================

  /**
   * Date of use in ISO 8601 format
   */
  public get date(): string {
    return this._usage.date;
  }

  /**
   * Version that was used
   */
  public get versionSpec(): RecipeVersionSpec {
    return this._usage.versionSpec;
  }

  /**
   * Scaled weight used for this production run
   */
  public get scaledWeight(): Grams {
    return this._usage.scaledWeight;
  }

  /**
   * Optional scale factor for reference
   */
  public get scaleFactor(): number | undefined {
    return this._usage.scaleFactor;
  }

  /**
   * Optional notes about this usage
   */
  public get notes(): string | undefined {
    return this._usage.notes;
  }

  /**
   * Specifier for the modified version created during this usage (if any)
   */
  public get modifiedVersionSpec(): RecipeVersionSpec | undefined {
    return this._usage.modifiedVersionSpec;
  }

  // ============================================================================
  // Resolved References (lazy)
  // ============================================================================

  /**
   * The version that was used - resolved.
   * Resolved lazily on first access.
   * @throws if the version cannot be found
   */
  public get version(): RuntimeVersion {
    if (this._version === undefined) {
      const result = this._recipe.getVersion(this._usage.versionSpec);
      /* c8 ignore next 3 - defensive coding: missing version would indicate data corruption */
      if (result.isFailure()) {
        throw new Error(`Failed to resolve version ${this._usage.versionSpec}: ${result.message}`);
      }
      this._version = result.value;
    }
    return this._version;
  }

  /**
   * Attempts to get the used version, returning a Result.
   * @returns Success with RuntimeVersion, or Failure if not found
   */
  /* c8 ignore next 10 - version caching path tested through version property access */
  public tryGetVersion(): Result<RuntimeVersion> {
    if (this._version === undefined) {
      const result = this._recipe.getVersion(this._usage.versionSpec);
      if (result.isSuccess()) {
        this._version = result.value;
      }
      return result;
    }
    return Success.with(this._version);
  }

  /**
   * The modified version created during this usage (if any) - resolved.
   * Returns undefined if no modification was made.
   * @throws if the modified version ID exists but cannot be found
   */
  public get modifiedVersion(): RuntimeVersion | undefined {
    if (this._modifiedVersion === undefined) {
      if (this._usage.modifiedVersionSpec === undefined) {
        this._modifiedVersion = null; // Mark as checked
        return undefined;
      }

      const result = this._recipe.getVersion(this._usage.modifiedVersionSpec);
      /* c8 ignore next 5 - defensive coding: missing version would indicate data corruption */
      if (result.isFailure()) {
        throw new Error(
          `Failed to resolve modified version ${this._usage.modifiedVersionSpec}: ${result.message}`
        );
      }
      this._modifiedVersion = result.value;
    }

    /* c8 ignore next - ternary converts null sentinel to undefined */
    return this._modifiedVersion === null ? undefined : this._modifiedVersion;
  }

  /**
   * Attempts to get the modified version, returning a Result.
   * @returns Success with RuntimeVersion (or undefined if no modification), or Failure if resolution fails
   */
  public tryGetModifiedVersion(): Result<RuntimeVersion | undefined> {
    if (this._modifiedVersion === undefined) {
      if (this._usage.modifiedVersionSpec === undefined) {
        this._modifiedVersion = null;
        return Success.with(undefined);
      }

      const result = this._recipe.getVersion(this._usage.modifiedVersionSpec);
      /* c8 ignore next 3 - defensive coding: missing version would indicate data corruption */
      if (result.isFailure()) {
        return result;
      }
      this._modifiedVersion = result.value;
    }

    /* c8 ignore next - ternary converts null sentinel to undefined */
    return Success.with(this._modifiedVersion === null ? undefined : this._modifiedVersion);
  }

  /**
   * The parent recipe
   */
  public get recipe(): RuntimeRecipe {
    return this._recipe;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Whether this usage resulted in a modified version
   */
  public get hasModification(): boolean {
    return this._usage.modifiedVersionSpec !== undefined;
  }

  /**
   * The date as a Date object
   */
  public get dateAsDate(): Date {
    return new Date(this._usage.date);
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw usage data
   */
  public get raw(): IRecipeUsage {
    return this._usage;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates RuntimeUsage objects for all usage records in a recipe.
 * @param recipe - The parent RuntimeRecipe
 * @returns Array of RuntimeUsage objects
 * @internal
 */
export function createRuntimeUsages(recipe: RuntimeRecipe): RuntimeUsage[] {
  return recipe.usage.map((usage) => new RuntimeUsage(recipe, usage));
}

/**
 * Gets RuntimeUsage objects sorted by date (most recent first).
 * @param recipe - The parent RuntimeRecipe
 * @returns Array of RuntimeUsage objects sorted by date descending
 * @internal
 */
export function getUsagesSortedByDate(recipe: RuntimeRecipe): RuntimeUsage[] {
  return createRuntimeUsages(recipe).sort((a, b) => b.date.localeCompare(a.date));
}
