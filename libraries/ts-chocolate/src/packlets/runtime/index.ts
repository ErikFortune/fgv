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
 * Runtime object access layer
 *
 * Provides resolved views of ingredients and recipes with automatic
 * reference resolution, navigation helpers, and rich query capabilities.
 *
 * @packageDocumentation
 */

// Core library (existing)
export * from './chocolateLibrary';

// Runtime model types (includes cache statistics)
export * from './model';

// Reverse index
export { RuntimeReverseIndex } from './runtimeReverseIndex';

// Runtime context
export { RuntimeContext, IRuntimeContextCreateParams } from './runtimeContext';

// ValidatingLibrary - extends ValidatingResultMap with find functionality
export {
  IFindOrchestrator,
  IReadOnlyValidatingLibrary,
  IValidatingLibraryParams,
  ValidatingLibrary
} from './validatingLibrary';

// Runtime ingredient classes
export {
  RuntimeIngredientBase,
  RuntimeChocolateIngredient,
  RuntimeDairyIngredient,
  RuntimeSugarIngredient,
  RuntimeFatIngredient,
  RuntimeAlcoholIngredient,
  RuntimeIngredient,
  AnyRuntimeIngredient
} from './ingredients';

// Runtime filling recipe classes
export {
  RuntimeFillingRecipe,
  RuntimeFillingRecipeVersion,
  RuntimeScaledFillingRecipeVersion
} from './fillings';

// Runtime confection classes
export {
  RuntimeConfectionBase,
  RuntimeMoldedBonBon,
  RuntimeBarTruffle,
  RuntimeRolledTruffle,
  RuntimeConfection,
  AnyRuntimeConfection
} from './confections';

// Query builders
export * from './queries';

// Indexer infrastructure (as namespace to avoid cluttering the main namespace)
import * as Indexers from './indexers';
export { Indexers };

// Session infrastructure (as namespace)
import * as Session from './session';
export { Session };

// Runtime tasks
export { ITaskContext, IRuntimeTask, RuntimeTask } from './tasks';

// Runtime procedures
export {
  IProcedureContext,
  IRuntimeProcedure,
  IRuntimeProcedureRenderContext,
  IRuntimeRenderedProcedure,
  IRuntimeRenderedStep,
  RuntimeProcedure
} from './procedures';

// Runtime molds
export { IMoldContext, IRuntimeMold, RuntimeMold } from './molds';
