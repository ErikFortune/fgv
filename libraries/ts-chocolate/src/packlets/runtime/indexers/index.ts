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
 * Extensible indexer infrastructure for efficient reverse lookups
 *
 * This module provides:
 * - Base indexer class with common functionality
 * - Concrete indexers for various query types
 * - Index orchestrator for unified query execution
 *
 * @packageDocumentation
 */

// Model and interfaces
export {
  AggregationMode,
  IEntityResolver,
  IFindOptions,
  IIndexer,
  IIndexerConfig,
  IIndexOrchestrator,
  IIndexOrchestratorConfig,
  IndexerIds,
  indexerId,
  QuerySpec
} from './model';

// Base class
export { BaseIndexer } from './baseIndexer';

// Concrete indexers
export {
  IRecipesByIngredientConfig,
  IngredientUsageType,
  RecipesByIngredientIndexer,
  recipesByIngredientConfig,
  recipesByIngredientConfigConverter
} from './recipesByIngredientIndexer';

export {
  IRecipesByTagConfig,
  RecipesByTagIndexer,
  recipesByTagConfig,
  recipesByTagConfigConverter
} from './recipesByTagIndexer';

export {
  IIngredientsByTagConfig,
  IngredientsByTagIndexer,
  ingredientsByTagConfig,
  ingredientsByTagConfigConverter
} from './ingredientsByTagIndexer';

export {
  IRecipesByChocolateTypeConfig,
  RecipesByChocolateTypeIndexer,
  recipesByChocolateTypeConfig,
  recipesByChocolateTypeConfigConverter
} from './recipesByChocolateTypeIndexer';

// Orchestrators
export { IndexOrchestrator } from './indexOrchestrator';
export { RecipeIndexerOrchestrator, RecipeResolver } from './recipeIndexerOrchestrator';
export { IngredientIndexerOrchestrator, IngredientResolver } from './ingredientIndexerOrchestrator';

// Query spec types for JSON input
export { JsonQuerySpec, IndexerIdStrings } from './querySpecConverter';
