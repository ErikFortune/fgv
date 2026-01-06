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
 * Recipe class implementation
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { BaseRecipeId, RecipeName, RecipeVersionSpec } from '../common';
import { IRecipe, IRecipeDerivation, IRecipeVersion } from './model';

// ============================================================================
// Recipe Class
// ============================================================================

/**
 * Recipe class with helper methods for version management
 * @public
 */
export class Recipe implements IRecipe {
  public readonly baseId: BaseRecipeId;
  public readonly name: RecipeName;
  public readonly description?: string;
  public readonly tags?: ReadonlyArray<string>;
  public readonly versions: ReadonlyArray<IRecipeVersion>;
  public readonly goldenVersionSpec: RecipeVersionSpec;
  public readonly derivedFrom?: IRecipeDerivation;

  public readonly goldenVersion: IRecipeVersion;

  private constructor(data: IRecipe, goldenVersion: IRecipeVersion) {
    this.baseId = data.baseId;
    this.name = data.name;
    this.description = data.description;
    this.tags = data.tags;
    this.versions = data.versions;
    this.goldenVersionSpec = data.goldenVersionSpec;
    this.derivedFrom = data.derivedFrom;
    this.goldenVersion = goldenVersion;
  }

  /**
   * Creates a Recipe instance from recipe data
   * @param data - Recipe data
   * @returns Success with Recipe instance, or Failure if golden version not found
   */
  public static create(data: IRecipe): Result<Recipe> {
    const goldenVersion = data.versions.find((v) => v.versionSpec === data.goldenVersionSpec);
    /* c8 ignore next 3 - defensive: converter validates golden version exists before calling create */
    if (!goldenVersion) {
      return Failure.with(`Golden version ${data.goldenVersionSpec} not found in recipe ${data.baseId}`);
    }
    return Success.with(new Recipe(data, goldenVersion));
  }

  /**
   * Gets a specific version by {@link RecipeVersionSpec | version specifier}
   * @param versionSpec - The version specifier to find
   * @returns Success with version, or Failure if not found
   */
  public getVersion(versionSpec: RecipeVersionSpec): Result<IRecipeVersion> {
    const version = this.versions.find((v) => v.versionSpec === versionSpec);
    if (!version) {
      return Failure.with(`Version ${versionSpec} not found in recipe ${this.baseId}`);
    }
    return Success.with(version);
  }
}
