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
 * - Type-specific orchestrators for unified query execution
 *
 * @packageDocumentation
 */

// Model and interfaces
export * from './model';

// Base classes
export { BaseIndexer } from './baseIndexer';
export { BaseIndexerOrchestrator } from './baseIndexerOrchestrator';

// Concrete indexers - recipes by ingredient
export {
  IRecipesByIngredientConfig,
  IngredientUsageType,
  RecipesByIngredientIndexer,
  recipesByIngredientConfig,
  recipesByIngredientConfigConverter
} from './recipesByIngredientIndexer';

// Concrete indexers - recipes by tag
export {
  IRecipesByTagConfig,
  RecipesByTagIndexer,
  recipesByTagConfig,
  recipesByTagConfigConverter
} from './recipesByTagIndexer';

// Concrete indexers - ingredients by tag
export {
  IIngredientsByTagConfig,
  IngredientsByTagIndexer,
  ingredientsByTagConfig,
  ingredientsByTagConfigConverter
} from './ingredientsByTagIndexer';

// Concrete indexers - recipes by chocolate type
export {
  IRecipesByChocolateTypeConfig,
  RecipesByChocolateTypeIndexer,
  recipesByChocolateTypeConfig,
  recipesByChocolateTypeConfigConverter
} from './recipesByChocolateTypeIndexer';

// Concrete indexers - recipes by category
export {
  IRecipesByCategoryConfig,
  RecipesByCategoryIndexer,
  recipesByCategoryConfig,
  recipesByCategoryConfigConverter
} from './recipesByCategoryIndexer';

// Recipe orchestrator with query spec types
export {
  IRecipeQuerySpec,
  RecipeIndexerName,
  RecipeIndexerOrchestrator,
  RecipeResolver,
  recipeQuerySpecConverter
} from './recipeIndexerOrchestrator';

// Ingredient orchestrator with query spec types
export {
  IIngredientQuerySpec,
  IngredientIndexerName,
  IngredientIndexerOrchestrator,
  IngredientResolver,
  ingredientQuerySpecConverter
} from './ingredientIndexerOrchestrator';
