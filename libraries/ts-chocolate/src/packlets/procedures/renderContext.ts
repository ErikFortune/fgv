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
 * Procedure render context types for future templating support
 * @packageDocumentation
 */

import { IComputedScaledRecipe } from '../recipes';
import { IMold } from '../molds';
import { IProcedureStep } from './model';

// Forward declaration - actual ChocolateLibrary will be imported at runtime
// This avoids circular dependencies

/**
 * Context for rendering a procedure with templating.
 * Designed for future templating support - the interface is defined
 * but the actual templating implementation is deferred.
 * @public
 */
export interface IProcedureRenderContext {
  /**
   * The full chocolate library for ingredient/recipe lookups
   * Using unknown to avoid circular dependency with runtime package
   */
  readonly library: unknown;

  /**
   * The specific scaled recipe this procedure is being rendered for
   */
  readonly recipe: IComputedScaledRecipe;

  /**
   * Optional mold being used for this recipe
   */
  readonly mold?: IMold;
}

/**
 * A rendered procedure step with resolved template values
 * @public
 */
export interface IRenderedProcedureStep extends IProcedureStep {
  /**
   * The rendered description with all template values resolved
   */
  readonly renderedDescription: string;
}

/**
 * A rendered procedure with all template values resolved
 * @public
 */
export interface IRenderedProcedure {
  /**
   * Name of the procedure
   */
  readonly name: string;

  /**
   * Optional description
   */
  readonly description?: string;

  /**
   * Rendered steps
   */
  readonly steps: ReadonlyArray<IRenderedProcedureStep>;

  /**
   * Total active time for all steps
   */
  readonly totalActiveTime?: number;

  /**
   * Total wait time for all steps
   */
  readonly totalWaitTime?: number;

  /**
   * Total hold time for all steps
   */
  readonly totalHoldTime?: number;
}
