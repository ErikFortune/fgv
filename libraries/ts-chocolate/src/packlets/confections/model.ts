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
 * Confection model interfaces and types
 * @packageDocumentation
 */

import {
  AdditionalChocolatePurpose,
  BaseConfectionId,
  ConfectionName,
  ConfectionType,
  ConfectionVersionSpec,
  ICategorizedUrl,
  IIdsWithPreferred,
  IngredientId,
  IOptionsWithPreferred,
  IRefWithNotes,
  Measurement,
  Millimeters,
  MoldId,
  ProcedureId,
  RecipeId,
  SlotId
} from '../common';

import { IProcedureRef } from '../recipes';

// ============================================================================
// Yield and Decoration Types
// ============================================================================

/**
 * Yield specification for a confection
 * @public
 */
export interface IConfectionYield {
  /** Number of pieces produced */
  readonly count: number;
  /** Unit description (default: 'pieces') */
  readonly unit?: string;
  /** Weight per piece in grams */
  readonly weightPerPiece?: Measurement;
}

/**
 * Decoration specification for a confection
 * @public
 */
export interface IConfectionDecoration {
  /** Description of the decoration */
  readonly description: string;
  /** Whether this is the preferred/recommended decoration */
  readonly preferred?: boolean;
}

// ============================================================================
// Filling Types
// ============================================================================

/**
 * Discriminator for filling option types
 * @public
 */
export type FillingOptionType = 'recipe' | 'ingredient';

/**
 * Union type for filling option IDs.
 * Can be either a RecipeId or IngredientId - disambiguation happens via the type discriminator.
 * @public
 */
export type FillingOptionId = RecipeId | IngredientId;

/**
 * Recipe filling option - references a recipe (e.g., ganache)
 * @public
 */
export interface IRecipeFillingOption {
  /** Discriminator for recipe filling */
  readonly type: 'recipe';
  /** The recipe ID */
  readonly id: RecipeId;
  /** Optional notes specific to this filling option */
  readonly notes?: string;
}

/**
 * Ingredient filling option - references an ingredient (e.g., praline paste)
 * @public
 */
export interface IIngredientFillingOption {
  /** Discriminator for ingredient filling */
  readonly type: 'ingredient';
  /** The ingredient ID */
  readonly id: IngredientId;
  /** Optional notes specific to this filling option */
  readonly notes?: string;
}

/**
 * Discriminated union of filling options.
 * Satisfies IHasId<FillingOptionId> for use with IOptionsWithPreferred.
 * @public
 */
export type AnyFillingOption = IRecipeFillingOption | IIngredientFillingOption;

/**
 * A single filling slot with its own options and preferred selection.
 * Each slot can hold recipes OR ingredients (or both).
 * @public
 */
export interface IFillingSlot {
  /** Unique identifier for this slot within the confection (e.g., "layer1", "center") */
  readonly slotId: SlotId;
  /** Human-readable name for display (e.g., "Inner Layer", "Ganache Center") */
  readonly name?: string;
  /** Available filling options with preferred selection */
  readonly filling: IOptionsWithPreferred<AnyFillingOption, FillingOptionId>;
}

// ============================================================================
// Chocolate Specification Types
// ============================================================================

/**
 * Chocolate specification for shell, enrobing, or coating.
 * Uses IIdsWithPreferred pattern - `ids` contains all valid chocolates,
 * `preferredId` indicates the default/recommended one.
 * @public
 */
export type IChocolateSpec = IIdsWithPreferred<IngredientId>;

/**
 * Additional chocolate specification with purpose.
 * Used for seal chocolate, decoration chocolate, etc.
 * @public
 */
export interface IAdditionalChocolate {
  /** Available chocolate options with preferred selection */
  readonly chocolate: IIdsWithPreferred<IngredientId>;
  /** Purpose of this additional chocolate */
  readonly purpose: AdditionalChocolatePurpose;
}

// ============================================================================
// Mold Types (similar to recipes but for confections)
// ============================================================================

/**
 * Reference to a mold used for a confection.
 * Satisfies IHasId for use with IOptionsWithPreferred.
 * @public
 */
export type IConfectionMoldRef = IRefWithNotes<MoldId>;

// ============================================================================
// Dimension Types (for bar truffles)
// ============================================================================

/**
 * Frame dimensions for bar truffle production
 * @public
 */
export interface IFrameDimensions {
  /** Width of the frame in millimeters */
  readonly width: Millimeters;
  /** Height of the frame in millimeters */
  readonly height: Millimeters;
  /** Depth/thickness of the frame in millimeters */
  readonly depth: Millimeters;
}

/**
 * Single bonbon dimensions for bar truffle cutting
 * @public
 */
export interface IBonBonDimensions {
  /** Width of a single bonbon in millimeters */
  readonly width: Millimeters;
  /** Height of a single bonbon in millimeters */
  readonly height: Millimeters;
}

// ============================================================================
// Coating Types (for rolled truffles)
// ============================================================================

/**
 * Coating specification for rolled truffles.
 * Uses IIdsWithPreferred pattern - `ids` contains all valid coating ingredients,
 * `preferredId` indicates the default/recommended one.
 * @public
 */
export type ICoatings = IIdsWithPreferred<IngredientId>;

// ============================================================================
// Version Types
// ============================================================================

/**
 * Base version interface - shared by all confection version types.
 * Contains the configuration details that can change between versions.
 * @public
 */
export interface IConfectionVersionBase {
  /** Unique identifier for this version */
  readonly versionSpec: ConfectionVersionSpec;
  /** Date this version was created (ISO 8601 format) */
  readonly createdDate: string;
  /** Yield specification for this version */
  readonly yield: IConfectionYield;
  /** Optional filling slots - each slot has independent options with a preferred selection */
  readonly fillings?: ReadonlyArray<IFillingSlot>;
  /** Optional decorations for this version */
  readonly decorations?: ReadonlyArray<IConfectionDecoration>;
  /** Optional procedures with preferred selection */
  readonly procedures?: IOptionsWithPreferred<IProcedureRef, ProcedureId>;
  /** Optional notes about this version */
  readonly notes?: string;
  /** Additional tags (merged with base confection tags) */
  readonly additionalTags?: ReadonlyArray<string>;
  /** Additional URLs (merged with base confection URLs) */
  readonly additionalUrls?: ReadonlyArray<ICategorizedUrl>;
}

/**
 * Version interface for molded bonbon confections.
 * Includes mold and chocolate shell specifications.
 * @public
 */
export interface IMoldedBonBonVersion extends IConfectionVersionBase {
  /** Required molds with preferred selection */
  readonly molds: IOptionsWithPreferred<IConfectionMoldRef, MoldId>;
  /** Required shell chocolate specification */
  readonly shellChocolate: IChocolateSpec;
  /** Optional additional chocolates (seal, decoration) */
  readonly additionalChocolates?: ReadonlyArray<IAdditionalChocolate>;
}

/**
 * Version interface for bar truffle confections.
 * Includes frame and cutting dimensions.
 * @public
 */
export interface IBarTruffleVersion extends IConfectionVersionBase {
  /** Frame dimensions for ganache slab */
  readonly frameDimensions: IFrameDimensions;
  /** Single bonbon dimensions for cutting */
  readonly singleBonBonDimensions: IBonBonDimensions;
  /** Optional enrobing chocolate specification */
  readonly enrobingChocolate?: IChocolateSpec;
}

/**
 * Version interface for rolled truffle confections.
 * Includes enrobing and coating specifications.
 * @public
 */
export interface IRolledTruffleVersion extends IConfectionVersionBase {
  /** Optional enrobing chocolate specification */
  readonly enrobingChocolate?: IChocolateSpec;
  /** Optional coatings (cocoa powder, nuts, etc.) */
  readonly coatings?: ICoatings;
}

/**
 * Union type for all confection version types.
 * @public
 */
export type AnyConfectionVersion = IMoldedBonBonVersion | IBarTruffleVersion | IRolledTruffleVersion;

// ============================================================================
// Base Confection Interface
// ============================================================================

/**
 * Base confection interface - all confection types share these properties.
 * Contains stable identity and metadata; configuration details are in versions.
 * @public
 */
export interface IConfectionBase {
  /** Base identifier within source (no dots) */
  readonly baseId: BaseConfectionId;
  /** Confection type (discriminator) */
  readonly confectionType: ConfectionType;
  /** Human-readable name */
  readonly name: ConfectionName;
  /** Optional description */
  readonly description?: string;
  /** Optional tags for searching/filtering */
  readonly tags?: ReadonlyArray<string>;
  /** Optional categorized URLs for external resources (tutorials, videos, etc.) */
  readonly urls?: ReadonlyArray<ICategorizedUrl>;
  /** The ID of the golden (approved default) version */
  readonly goldenVersionSpec: ConfectionVersionSpec;
  /** Version history - contains type-specific configuration details */
  readonly versions: ReadonlyArray<AnyConfectionVersion>;
}

// ============================================================================
// Discriminated Confection Types
// ============================================================================

/**
 * Molded bonbon confection
 * Uses chocolate molds for shell formation
 * @public
 */
export interface IMoldedBonBon extends IConfectionBase {
  /** Type discriminator */
  readonly confectionType: 'molded-bonbon';
  /** Version history with molded bonbon specific details */
  readonly versions: ReadonlyArray<IMoldedBonBonVersion>;
}

/**
 * Bar truffle confection
 * Ganache slab cut into squares and enrobed
 * @public
 */
export interface IBarTruffle extends IConfectionBase {
  /** Type discriminator */
  readonly confectionType: 'bar-truffle';
  /** Version history with bar truffle specific details */
  readonly versions: ReadonlyArray<IBarTruffleVersion>;
}

/**
 * Rolled truffle confection
 * Hand-rolled ganache balls with various coatings
 * @public
 */
export interface IRolledTruffle extends IConfectionBase {
  /** Type discriminator */
  readonly confectionType: 'rolled-truffle';
  /** Version history with rolled truffle specific details */
  readonly versions: ReadonlyArray<IRolledTruffleVersion>;
}

// ============================================================================
// Confection Union Type
// ============================================================================

/**
 * Discriminated union of all confection data types.
 * Use this when working with raw confection data.
 * @public
 */
export type ConfectionData = IMoldedBonBon | IBarTruffle | IRolledTruffle;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for IMoldedBonBon
 * @param confection - Confection data to check
 * @returns True if the confection is a molded bonbon
 * @public
 */
export function isMoldedBonBon(confection: ConfectionData): confection is IMoldedBonBon {
  return confection.confectionType === 'molded-bonbon';
}

/**
 * Type guard for IBarTruffle
 * @param confection - Confection data to check
 * @returns True if the confection is a bar truffle
 * @public
 */
export function isBarTruffle(confection: ConfectionData): confection is IBarTruffle {
  return confection.confectionType === 'bar-truffle';
}

/**
 * Type guard for IRolledTruffle
 * @param confection - Confection data to check
 * @returns True if the confection is a rolled truffle
 * @public
 */
export function isRolledTruffle(confection: ConfectionData): confection is IRolledTruffle {
  return confection.confectionType === 'rolled-truffle';
}

// ============================================================================
// Version Type Guards
// ============================================================================

/**
 * Type guard for IMoldedBonBonVersion
 * @param version - Version to check
 * @returns True if the version is a molded bonbon version
 * @public
 */
export function isMoldedBonBonVersion(version: AnyConfectionVersion): version is IMoldedBonBonVersion {
  return 'molds' in version && 'shellChocolate' in version;
}

/**
 * Type guard for IBarTruffleVersion
 * @param version - Version to check
 * @returns True if the version is a bar truffle version
 * @public
 */
export function isBarTruffleVersion(version: AnyConfectionVersion): version is IBarTruffleVersion {
  return 'frameDimensions' in version && 'singleBonBonDimensions' in version;
}

/**
 * Type guard for IRolledTruffleVersion
 * @param version - Version to check
 * @returns True if the version is a rolled truffle version
 * @public
 */
export function isRolledTruffleVersion(version: AnyConfectionVersion): version is IRolledTruffleVersion {
  return !isMoldedBonBonVersion(version) && !isBarTruffleVersion(version);
}
