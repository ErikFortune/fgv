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
 * Journal identifier within a single collection
 * Format: YYYY-MM-DD-HHMMSS-xxxxxxxx (e.g., "2026-01-15-143025-a1b2c3d4")
 * @public
 */
export type JournalBaseId = Brand<string, 'JournalBaseId'>;

/**
 * Globally unique journal identifier (composite)
 * Format: "collectionId.baseJournalId"
 * Must contain exactly one dot separator
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
 * Format: YYYY-MM-DD-HHMMSS-xxxxxxxx
 * @public
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Session identifier within a single collection (user library session storage).
 * Format: YYYY-MM-DD-HHMMSS-xxxxxxxx (same as SessionId)
 * @public
 */
export type SessionBaseId = Brand<string, 'SessionBaseId'>;

/**
 * Globally unique persisted session identifier (composite).
 * Format: "collectionId.baseSessionId"
 * Must contain exactly one dot separator.
 * @public
 */
export type PersistedSessionId = Brand<string, 'PersistedSessionId'>;

/**
 * Unique identifier for a filling slot within a confection or recipe
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
 * Zero measurement constant
 * @public
 */
export const ZeroMeasurement: Measurement = 0 as Measurement;

/**
 * Percentage value (0-100)
 * @public
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Zero percent constant
 * @public
 */
export const ZeroPercent: Percentage = 0 as Percentage;

/**
 * One hundred percent constant
 * @public
 */
export const HundredPercent: Percentage = 100 as Percentage;

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
 * Types of chocolate
 * @public
 */
export type ChocolateType = 'dark' | 'milk' | 'white' | 'caramelized' | 'ruby' | 'flavored';

/**
 * Varieties of cacao beans
 * @public
 */
export type CacaoVariety = 'Blend' | 'Criollo' | 'Forastero' | 'Nacional' | 'Trinitario';

/**
 * Fluidity in Callebaut star ratings (1-5)
 * Lower stars = more fluid, higher stars = more viscous
 * @public
 */
export type FluidityStars = 1 | 2 | 3 | 4 | 5;

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
 * Supported weight units for output conversion
 * @public
 */
export type WeightUnit = 'g' | 'oz' | 'lb' | 'kg';

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
 * Spoon measurement units that share the same scaling system
 * @public
 */
export type SpoonUnit = 'tsp' | 'Tbsp';

/**
 * Spoon level indicator for dry measurements.
 * This is a display hint only and does not affect scaling calculations.
 * @public
 */
export type SpoonLevel = 'level' | 'heaping';

/**
 * Physical phase of an ingredient - display hint for UI.
 * Used to determine action verbs (e.g., "pour" vs "add").
 * @public
 */
export type IngredientPhase = 'solid' | 'liquid';

/**
 * Common allergens that may be present in ingredients
 * @public
 */
export type Allergen = 'milk' | 'soy' | 'nuts' | 'gluten' | 'eggs' | 'peanuts';

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
 * Well-known built-in source identifiers
 * @public
 */
export type BuiltInSource = 'built-in';

/**
 * Chocolate World mold format series.
 * Each series corresponds to a specific frame size:
 * - series-1000: 275x135mm
 * - series-2000: 275x175mm
 * @public
 */
export type MoldFormat = 'series-1000' | 'series-2000' | 'other';

/**
 * Types of confections (discriminator for confection union)
 * @public
 */
export type ConfectionType = 'molded-bonbon' | 'bar-truffle' | 'rolled-truffle';

/**
 * Role that a chocolate plays in a confection.
 * Used for tracking chocolate selections during editing sessions.
 * @public
 */
export type ChocolateRole = 'shell' | 'seal' | 'decoration' | 'enrobing' | 'coating';

/**
 * Purpose for additional chocolates in molded bonbons.
 * These values align with {@link ChocolateRole | ChocolateRole} for type safety
 * when converting between confection data and journal entries.
 * @public
 */
export type AdditionalChocolatePurpose = 'seal' | 'decoration';

/**
 * Filling recipe category for classification
 * @public
 */
export type FillingCategory = 'ganache' | 'caramel' | 'gianduja' | 'other';

/**
 * Procedure type - can be a filling category, confection type, or other
 * @public
 */
export type ProcedureType = FillingCategory | ConfectionType | 'other';

/**
 * Category for notes associated with an entity.
 * Uses the standard base ID pattern (alphanumeric, dashes, underscores).
 * Examples: 'general', 'tasting', 'production'
 * @public
 */
export type NoteCategory = Brand<string, 'NoteCategory'>;

/**
 * Default note category for general/unspecified notes.
 * @public
 */
export const DefaultNoteCategory: NoteCategory = 'general' as NoteCategory;

/**
 * Category for a URL associated with an entity.
 * Uses the standard base ID pattern (alphanumeric, dashes, underscores).
 * Examples: 'manufacturer', 'product-page', 'documentation', 'video', 'purchase'
 * @public
 */
export type UrlCategory = Brand<string, 'UrlCategory'>;

/**
 * Default URL category for general/unspecified URLs.
 * @public
 */
export const DefaultUrlCategory: UrlCategory = 'general' as UrlCategory;
