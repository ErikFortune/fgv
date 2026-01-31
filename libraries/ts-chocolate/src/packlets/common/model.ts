// Copyright (c) 2024 Erik Fortune
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
 * Branded types and enumerations for the chocolate library
 * @packageDocumentation
 */

import { Brand } from '@fgv/ts-utils';

// ============================================================================
// Branded String Types - Base IDs (no dots allowed)
// ============================================================================

/**
 * Unique identifier for a source (collection of ingredients/recipes)
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type SourceId = Brand<string, 'SourceId'>;

/**
 * Ingredient identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseIngredientId = Brand<string, 'BaseIngredientId'>;

/**
 * Filling recipe identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseFillingId = Brand<string, 'BaseFillingId'>;

/**
 * Mold identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseMoldId = Brand<string, 'BaseMoldId'>;

/**
 * Procedure identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseProcedureId = Brand<string, 'BaseProcedureId'>;

/**
 * Task identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseTaskId = Brand<string, 'BaseTaskId'>;

// ============================================================================
// Branded String Types - Composite IDs (exactly one dot)
// ============================================================================

/**
 * Globally unique ingredient identifier (composite)
 * Format: "sourceId.baseIngredientId"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type IngredientId = Brand<string, 'IngredientId'>;

/**
 * Globally unique filling recipe identifier (composite)
 * Format: "sourceId.baseFillingId"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type FillingId = Brand<string, 'FillingId'>;

/**
 * Globally unique mold identifier (composite)
 * Format: "sourceId.baseMoldId"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type MoldId = Brand<string, 'MoldId'>;

/**
 * Globally unique procedure identifier (composite)
 * Format: "sourceId.baseProcedureId"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type ProcedureId = Brand<string, 'ProcedureId'>;

/**
 * Globally unique task identifier (composite)
 * Format: "sourceId.baseTaskId"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type TaskId = Brand<string, 'TaskId'>;

/**
 * Non-unique filling recipe name used for display and grouping
 * @public
 */
export type FillingName = Brand<string, 'FillingName'>;

/**
 * Specifier for a filling recipe version within a filling recipe
 * Format: YYYY-MM-DD-NN with optional label where NN is a 2-digit counter
 * Examples: "2026-01-03-01", "2026-01-03-02-less-sugar"
 * @public
 */
export type FillingVersionSpec = Brand<string, 'FillingVersionSpec'>;

/**
 * Unique identifier for an indexer in the reverse index system
 * Used to identify indexer types and key query specifications
 * @public
 */
export type IndexerId = Brand<string, 'IndexerId'>;

/**
 * Globally unique filling recipe version identifier (composite)
 * Format: "fillingId\@versionSpec" where fillingId is "sourceId.baseFillingId"
 * Examples: "user.ganache\@2026-01-03-01", "felchlin.truffle\@2026-01-03-02-less-sugar"
 * @public
 */
export type FillingVersionId = Brand<string, 'FillingVersionId'>;

/**
 * Unique identifier for a cooking journal record
 * Format: UUID or "fillingId\@versionSpec\@date"
 * @public
 */
export type JournalId = Brand<string, 'JournalId'>;

/**
 * Confection identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseConfectionId = Brand<string, 'BaseConfectionId'>;

/**
 * Globally unique confection identifier (composite)
 * Format: "sourceId.baseConfectionId"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type ConfectionId = Brand<string, 'ConfectionId'>;

/**
 * Non-unique confection name used for display
 * @public
 */
export type ConfectionName = Brand<string, 'ConfectionName'>;

/**
 * Specifier for a confection version within a confection
 * Format: YYYY-MM-DD-NN with optional label where NN is a 2-digit counter
 * Examples: "2026-01-03-01", "2026-01-03-02-less-sugar"
 * @public
 */
export type ConfectionVersionSpec = Brand<string, 'ConfectionVersionSpec'>;

/**
 * Globally unique confection version identifier (composite)
 * Format: "confectionId\@versionSpec" where confectionId is "sourceId.baseConfectionId"
 * Examples: "user.dark-dome-bonbon\@2026-01-03-01"
 * @public
 */
export type ConfectionVersionId = Brand<string, 'ConfectionVersionId'>;

/**
 * Unique identifier for an editing session
 * Format: UUID
 * @public
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Unique identifier for a filling slot within a confection
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * Examples: "center", "outer-layer", "layer1"
 * @public
 */
export type SlotId = Brand<string, 'SlotId'>;

// ============================================================================
// Branded Numeric Types
// ============================================================================

/**
 * Measurement amount (non-negative number in the specified unit).
 * Used for recipe ingredient amounts in any unit (g, mL, tsp, Tbsp, pinch).
 * @public
 */
export type Measurement = Brand<number, 'Measurement'>;

/**
 * Percentage value (0-100)
 * @public
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Temperature in Celsius
 * @public
 */
export type Celsius = Brand<number, 'Celsius'>;

/**
 * Viscosity in degrees MacMichael
 * @public
 */
export type DegreesMacMichael = Brand<number, 'DegreesMacMichael'>;

/**
 * Rating score (1-5 scale)
 * @public
 */
export type RatingScore = Brand<number, 'RatingScore'>;

/**
 * Time in minutes
 * @public
 */
export type Minutes = Brand<number, 'Minutes'>;

/**
 * Length in millimeters
 * @public
 */
export type Millimeters = Brand<number, 'Millimeters'>;

// ============================================================================
// Enumerations
// ============================================================================

/**
 * Base categories of ingredients (discriminated union tag)
 * @public
 */
export type IngredientCategory =
  | 'chocolate'
  | 'sugar'
  | 'dairy'
  | 'fat'
  | 'liquid'
  | 'flavor'
  | 'alcohol'
  | 'other';

/**
 * All possible ingredient categories
 * @public
 */
export const allIngredientCategories: IngredientCategory[] = [
  'chocolate',
  'sugar',
  'dairy',
  'fat',
  'liquid',
  'flavor',
  'alcohol',
  'other'
];

/**
 * Types of chocolate
 * @public
 */
export type ChocolateType = 'dark' | 'milk' | 'white' | 'caramelized' | 'ruby' | 'flavored';

/**
 * All possible chocolate types
 * @public
 */
export const allChocolateTypes: ChocolateType[] = [
  'dark',
  'milk',
  'white',
  'caramelized',
  'ruby',
  'flavored'
];

/**
 * Varieties of cacao beans
 * @public
 */
export type CacaoVariety = 'Blend' | 'Criollo' | 'Forastero' | 'Nacional' | 'Trinitario';

/**
 * All possible chocolate varieties.
 * @public
 */
export const allCacaoVarieties: CacaoVariety[] = ['Blend', 'Criollo', 'Forastero', 'Nacional', 'Trinitario'];

/**
 * Fluidity in Callebaut star ratings (1-5)
 * Lower stars = more fluid, higher stars = more viscous
 * @public
 */
export type FluidityStars = 1 | 2 | 3 | 4 | 5;

/**
 * All possible fluidity star ratings
 * @public
 */
export const allFluidityStars: FluidityStars[] = [1, 2, 3, 4, 5];

/**
 * Recommended applications for chocolate
 * @public
 */
export type ChocolateApplication =
  | 'baking'
  | 'confectionary'
  | 'cookies'
  | 'cremeux'
  | 'drinks'
  | 'enrobing'
  | 'frozen-desserts'
  | 'ganache'
  | 'glazes'
  | 'ice-cream'
  | 'molding'
  | 'mousse'
  | 'pralines'
  | 'sauces'
  | 'sorbet';

/**
 * All possible chocolate applications
 * @public
 */
export const allChocolateApplications: ChocolateApplication[] = [
  'baking',
  'confectionary',
  'baking',
  'cookies',
  'cremeux',
  'drinks',
  'enrobing',
  'frozen-desserts',
  'ganache',
  'glazes',
  'ice-cream',
  'molding',
  'mousse',
  'pralines',
  'sauces',
  'sorbet'
];

/**
 * Supported weight units for output conversion
 * @public
 */
export type WeightUnit = 'g' | 'oz' | 'lb' | 'kg';

/**
 * All possible weight units
 * @public
 */
export const allWeightUnits: WeightUnit[] = ['g', 'oz', 'lb', 'kg'];

/**
 * Measurement unit types for recipe ingredients.
 * - 'g': Grams (default)
 * - 'mL': Milliliters
 * - 'tsp': Teaspoons
 * - 'Tbsp': Tablespoons
 * - 'pinch': A small imprecise amount
 * - 'seeds': Individual seeds (e.g., vanilla seeds)
 * - 'pods': Whole pods (e.g., vanilla pods)
 * @public
 */
export type MeasurementUnit = 'g' | 'mL' | 'tsp' | 'Tbsp' | 'pinch' | 'seeds' | 'pods';

/**
 * All possible measurement units
 * @public
 */
export const allMeasurementUnits: MeasurementUnit[] = ['g', 'mL', 'tsp', 'Tbsp', 'pinch', 'seeds', 'pods'];

/**
 * Spoon measurement units that share the same scaling system
 * @public
 */
export type SpoonUnit = 'tsp' | 'Tbsp';

/**
 * All spoon measurement units
 * @public
 */
export const allSpoonUnits: SpoonUnit[] = ['tsp', 'Tbsp'];

/**
 * Spoon level indicator for dry measurements.
 * This is a display hint only and does not affect scaling calculations.
 * @public
 */
export type SpoonLevel = 'level' | 'heaping';

/**
 * All spoon level indicators
 * @public
 */
export const allSpoonLevels: SpoonLevel[] = ['level', 'heaping'];

/**
 * Physical phase of an ingredient - display hint for UI.
 * Used to determine action verbs (e.g., "pour" vs "add").
 * @public
 */
export type IngredientPhase = 'solid' | 'liquid';

/**
 * All ingredient phases
 * @public
 */
export const allIngredientPhases: IngredientPhase[] = ['solid', 'liquid'];

/**
 * Option wrapper for measurement units (for use with IOptionsWithPreferred).
 * Wraps a MeasurementUnit to satisfy IHasId requirement.
 * @public
 */
export interface IMeasurementUnitOption {
  /** The measurement unit */
  readonly id: MeasurementUnit;
}

/**
 * Common allergens that may be present in ingredients
 * @public
 */
export type Allergen = 'milk' | 'soy' | 'nuts' | 'gluten' | 'eggs' | 'peanuts';

/**
 * All possible common allergens
 * @public
 */
export const allAllergens: Allergen[] = ['milk', 'soy', 'nuts', 'gluten', 'eggs', 'peanuts'];

/**
 * Certifications that an ingredient may have.
 * @public
 */
export type Certification =
  | 'all-natural'
  | 'cocoa-horizons'
  | 'fair-trade'
  | 'gluten-free'
  | 'halal'
  | 'kosher-dairy'
  | 'non-gmo'
  | 'organic'
  | 'peanut-free'
  | 'real-vanilla'
  | 'traceable-beans'
  | 'vegan'
  | 'vegetarian'
  | 'without-lecithin';

/**
 * All possible certifications
 * @public
 */
export const allCertifications: Certification[] = [
  'all-natural',
  'cocoa-horizons',
  'fair-trade',
  'gluten-free',
  'halal',
  'kosher-dairy',
  'non-gmo',
  'organic',
  'peanut-free',
  'real-vanilla',
  'traceable-beans',
  'vegan',
  'vegetarian',
  'without-lecithin'
];

/**
 * Well-known built-in source identifiers
 * @public
 */
export type BuiltInSource = 'built-in';

/**
 * All possible built-in source identifiers
 * @public
 */
export const allBuiltInSources: BuiltInSource[] = ['built-in'];

/**
 * Chocolate World mold format series.
 * Each series corresponds to a specific frame size:
 * - series-1000: 275x135mm
 * - series-2000: 275x175mm
 * @public
 */
export type MoldFormat = 'series-1000' | 'series-2000' | 'other';

/**
 * All possible mold formats
 * @public
 */
export const allMoldFormats: MoldFormat[] = ['series-1000', 'series-2000', 'other'];

/**
 * Types of confections (discriminator for confection union)
 * @public
 */
export type ConfectionType = 'molded-bonbon' | 'bar-truffle' | 'rolled-truffle';

/**
 * All possible confection types
 * @public
 */
export const allConfectionTypes: ConfectionType[] = ['molded-bonbon', 'bar-truffle', 'rolled-truffle'];

/**
 * Purpose for additional chocolates in molded bonbons.
 * These values align with {@link Entities.Journal.ChocolateRole | ChocolateRole} for type safety
 * when converting between confection data and journal entries.
 * @public
 */
export type AdditionalChocolatePurpose = 'seal' | 'decoration';

/**
 * All possible additional chocolate purposes
 * @public
 */
export const allAdditionalChocolatePurposes: AdditionalChocolatePurpose[] = ['seal', 'decoration'];

/**
 * Filling recipe category for classification
 * @public
 */
export type FillingCategory = 'ganache' | 'caramel' | 'gianduja' | 'other';

/**
 * All possible filling recipe categories
 * @public
 */
export const allFillingCategories: FillingCategory[] = ['ganache', 'caramel', 'gianduja', 'other'];

/**
 * Procedure type - can be a filling category, confection type, or other
 * @public
 */
export type ProcedureType = FillingCategory | ConfectionType | 'other';

/**
 * All possible procedure types
 * @public
 */
export const allProcedureTypes: ProcedureType[] = [...allFillingCategories, ...allConfectionTypes, 'other'];

// ============================================================================
// URLs
// ============================================================================

/**
 * Category for a URL associated with an entity.
 * Uses the standard base ID pattern (alphanumeric, dashes, underscores).
 * Examples: 'manufacturer', 'product-page', 'documentation', 'video', 'purchase'
 * @public
 */
export type UrlCategory = Brand<string, 'UrlCategory'>;

/**
 * A categorized URL for linking to external resources.
 * Used on ingredients, recipes, molds, and confections.
 * @public
 */
export interface ICategorizedUrl {
  /** Category of the URL (e.g., 'manufacturer', 'product-page', 'video') */
  readonly category: UrlCategory;
  /** The URL string */
  readonly url: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Separator character used in composite IDs
 * @public
 */
export const ID_SEPARATOR: string = '.';

/**
 * Pattern for valid base IDs (no dots allowed)
 * @public
 */
export const BASE_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+$/;

/**
 * Pattern for valid composite IDs (exactly one dot)
 * @public
 */
export const COMPOSITE_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;

/**
 * Pattern for valid filling version specs
 * Format: YYYY-MM-DD-NN with optional label (lowercase alphanumeric with dashes)
 * @public
 */
export const FILLING_VERSION_SPEC_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;

/**
 * Separator character used in filling version IDs (between FillingId and FillingVersionSpec)
 * @public
 */
export const VERSION_ID_SEPARATOR: string = '@';

/**
 * Pattern for valid filling version IDs
 * Format: fillingId\@versionSpec where fillingId is sourceId.baseFillingId
 * @public
 */
export const FILLING_VERSION_ID_PATTERN: RegExp =
  /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+@\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;

/**
 * Pattern for valid session IDs
 * Format: YYYY-MM-DD-HHMMSS-[0-9a-f]\{8\}
 * Example: "2026-01-15-143025-a1b2c3d4"
 * @public
 */
export const SESSION_ID_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/;

/**
 * Pattern for valid journal IDs
 * Format: YYYY-MM-DD-HHMMSS-[0-9a-f]\{8\}
 * Example: "2026-01-15-143025-a1b2c3d4"
 * @public
 */
export const JOURNAL_ID_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/;

/**
 * Pattern for valid confection version specs
 * Format: YYYY-MM-DD-NN with optional label (lowercase alphanumeric with dashes)
 * Same pattern as recipe version specs
 * @public
 */
export const CONFECTION_VERSION_SPEC_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;

/**
 * Pattern for valid confection version IDs
 * Format: confectionId\@versionSpec where confectionId is sourceId.baseConfectionId
 * @public
 */
export const CONFECTION_VERSION_ID_PATTERN: RegExp =
  /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+@\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;

// ============================================================================
// Options with Preferred Interfaces
// ============================================================================

/**
 * Base interface that option types must extend for use with IOptionsWithPreferred.
 * Enables generic helpers that work with any option type.
 * @typeParam TId - The type of the identifier
 * @public
 */
export interface IHasId<TId extends string> {
  readonly id: TId;
}

/**
 * Collection of options (objects with IDs) with a preferred selection.
 * Use when options are objects containing IDs plus additional metadata.
 *
 * @typeParam TOption - The option object type (must have an `id` property)
 * @typeParam TId - The ID type for the preferred selection
 * @public
 */
export interface IOptionsWithPreferred<TOption extends IHasId<TId>, TId extends string> {
  /** Available options */
  readonly options: ReadonlyArray<TOption>;
  /** ID of the preferred/recommended option */
  readonly preferredId?: TId;
}

/**
 * Collection of simple IDs with a preferred selection.
 * Use when options are just IDs without additional metadata.
 *
 * @typeParam TId - The ID type
 * @public
 */
export interface IIdsWithPreferred<TId extends string> {
  /** Available option IDs */
  readonly ids: ReadonlyArray<TId>;
  /** The preferred/recommended ID */
  readonly preferredId?: TId;
}

/**
 * Generic reference type with an ID and optional notes.
 * Use as base for mold refs, procedure refs, etc.
 * Satisfies IHasId for use with IOptionsWithPreferred.
 *
 * @typeParam TId - The ID type
 * @public
 */
export interface IRefWithNotes<TId extends string> extends IHasId<TId> {
  /** The referenced entity's ID */
  readonly id: TId;
  /** Optional notes specific to this reference */
  readonly notes?: string;
}
