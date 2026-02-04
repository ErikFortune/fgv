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
 * RuntimeContext - extends LibraryRuntimeContext with session capabilities
 * @packageDocumentation
 */

import { fail, Result, Success } from '@fgv/ts-utils';

import { Measurement } from '../common';
import {
  ChocolateLibrary,
  IChocolateLibraryCreateParams,
  IFillingRecipe,
  LibraryRuntimeContext
} from '../library-runtime';
import { EditingSession } from './session/editingSession';
import { ISessionContext, IRuntimeContext } from './model';

// ============================================================================
// RuntimeContext Parameters
// ============================================================================

/**
 * Parameters for creating a RuntimeContext with a new library
 * @public
 */
export interface IRuntimeContextCreateParams {
  /**
   * Parameters for creating the underlying ChocolateLibrary
   */
  readonly libraryParams?: IChocolateLibraryCreateParams;

  /**
   * Whether to pre-warm the reverse index on context creation.
   * @defaultValue false
   */
  readonly preWarm?: boolean;
}

// ============================================================================
// RuntimeContext Class
// ============================================================================

/**
 * Full runtime context with session creation capabilities.
 *
 * Extends LibraryRuntimeContext with the ability to create editing sessions
 * for filling recipes. This is the primary entry point for consumers who
 * need both library resolution and session management.
 *
 * @public
 */
export class RuntimeContext extends LibraryRuntimeContext implements ISessionContext, IRuntimeContext {
  /**
   * Creates a RuntimeContext.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  protected constructor(library: ChocolateLibrary, preWarm: boolean) {
    super(library, preWarm);
  }

  /**
   * Creates a RuntimeContext with a new or default ChocolateLibrary.
   * This is the primary factory method for most use cases.
   * @param params - Optional parameters for library and caching
   * @returns Success with RuntimeContext, or Failure if library creation fails
   */
  public static override create(params?: IRuntimeContextCreateParams): Result<RuntimeContext> {
    return ChocolateLibrary.create(params?.libraryParams).onSuccess((library) => {
      return Success.with(new RuntimeContext(library, params?.preWarm ?? false));
    });
  }

  /**
   * Creates a RuntimeContext wrapping an existing ChocolateLibrary.
   * Use this when you already have a configured library instance.
   * @param library - The ChocolateLibrary to wrap
   * @param preWarm - Whether to pre-warm the reverse index
   * @returns Success with RuntimeContext
   */
  public static override fromLibrary(library: ChocolateLibrary, preWarm?: boolean): Result<RuntimeContext> {
    return Success.with(new RuntimeContext(library, preWarm ?? false));
  }

  // ============================================================================
  // Session Creation (ISessionContext)
  // ============================================================================

  /**
   * Creates an editing session for a filling recipe at a target weight.
   * Used by confection sessions to manage filling scaling.
   * @param filling - The runtime filling recipe
   * @param targetWeight - Target weight for the filling in grams
   * @returns Success with EditingSession, or Failure if creation fails
   */
  public createFillingSession(filling: IFillingRecipe, targetWeight: Measurement): Result<EditingSession> {
    // Get the golden version (now safe - no cast needed)
    const version = filling.goldenVersion;

    // Calculate scale factor to achieve target weight
    const baseWeight = version.entity.baseWeight;
    if (baseWeight <= 0) {
      return fail(`Cannot create session: base weight must be positive (got ${baseWeight})`);
    }

    const scaleFactor = targetWeight / baseWeight;

    // Create editing session with scale factor
    return EditingSession.create(version, scaleFactor);
  }
}
