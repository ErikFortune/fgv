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
 * Library-runtime packlet - materialized projections of library entities
 *
 * Provides resolved views of ingredients, fillings, confections, and other
 * library entities with automatic reference resolution, navigation helpers,
 * and rich query capabilities.
 *
 * This packlet contains the core runtime wrappers and resolution infrastructure.
 * For session management, use the runtime packlet.
 *
 * @packageDocumentation
 */

// Core library
export * from './chocolateEntityLibrary';

// Runtime model types
export * from './model';

// Library runtime context
export { LibraryRuntimeContext, ILibraryRuntimeContextCreateParams } from './libraryRuntimeContext';

// Reverse index
export { RuntimeReverseIndex } from './runtimeReverseIndex';

// ValidatingLibrary - extends ValidatingResultMap with find functionality
export {
  IFindOrchestrator,
  IReadOnlyValidatingLibrary,
  IValidatingLibraryParams,
  ValidatingLibrary
} from './validatingLibrary';

// MaterializedLibrary - lazy, cached materialization with find support
export { MaterializedLibrary, IMaterializedLibraryParams } from './materializedLibrary';

// Ingredient classes
export {
  IngredientBase,
  ChocolateIngredient,
  DairyIngredient,
  SugarIngredient,
  FatIngredient,
  AlcoholIngredient,
  Ingredient,
  AnyIngredient
} from './ingredients';

// Filling recipe classes
export { FillingRecipe, FillingRecipeVariation } from './fillings';

// Confection classes
export {
  ConfectionBase,
  MoldedBonBonRecipe,
  BarTruffleRecipe,
  RolledTruffleRecipe,
  Confection,
  AnyConfection,
  ConfectionRecipeVariationBase,
  MoldedBonBonRecipeVariation,
  BarTruffleRecipeVariation,
  RolledTruffleRecipeVariation
} from './confections';

// Query builders
export * from './queries';

// Indexer infrastructure (as namespace to avoid cluttering the main namespace)
import * as Indexers from './indexers';
export { Indexers };

// Runtime tasks
export { ITaskContext, ITask, Task } from './tasks';

// Procedures
export {
  IProcedureContext,
  IProcedure,
  IProcedureRenderContext,
  IRenderedProcedure,
  IRenderedStep,
  Procedure
} from './procedures';

// Molds
export { IMoldContext, IMold, Mold } from './molds';

// Produced wrappers (mutable editing containers)
export * from './produced';

import * as Internal from './internal';
export { Internal };
