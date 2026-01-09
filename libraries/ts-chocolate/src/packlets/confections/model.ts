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
  BaseConfectionId,
  ConfectionName,
  ConfectionType,
  ConfectionVersionSpec,
  Grams,
  IngredientId,
  Millimeters,
  MoldId,
  ProcedureId,
  RecipeId,
  AdditionalChocolatePurpose
} from '../common';

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
  readonly weightPerPiece?: Grams;
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
 * Filling specification for a confection
 * Can reference recipes (e.g., ganache) or ingredients (e.g., praline paste)
 * @public
 */
export interface IConfectionFillings {
  /** Recipe IDs for fillings (e.g., ganache recipes) */
  readonly recipes?: ReadonlyArray<RecipeId>;
  /** Ingredient IDs for fillings (e.g., praline paste) */
  readonly ingredients?: ReadonlyArray<IngredientId>;
  /** Recommended filling ID (can be recipe or ingredient) */
  readonly recommendedFillingId?: RecipeId | IngredientId;
}

// ============================================================================
// Chocolate Specification Types
// ============================================================================

/**
 * Chocolate specification for shell, enrobing, or coating
 * @public
 */
export interface IChocolateSpec {
  /** Primary chocolate ingredient ID */
  readonly ingredientId: IngredientId;
  /** Alternate chocolate ingredient IDs */
  readonly alternateIngredientIds?: ReadonlyArray<IngredientId>;
}

/**
 * Additional chocolate specification with purpose
 * Used for seal chocolate, decoration chocolate, etc.
 * @public
 */
export interface IAdditionalChocolate extends IChocolateSpec {
  /** Purpose of this additional chocolate */
  readonly purpose: AdditionalChocolatePurpose;
}

// ============================================================================
// Mold Types (similar to recipes but for confections)
// ============================================================================

/**
 * Reference to a mold used for a confection
 * @public
 */
export interface IConfectionMoldRef {
  /** Composite mold ID */
  readonly moldId: MoldId;
  /** Optional notes specific to using this mold */
  readonly notes?: string;
}

/**
 * Collection of molds associated with a confection
 * @public
 */
export interface IConfectionMolds {
  /** Available molds for this confection */
  readonly molds: ReadonlyArray<IConfectionMoldRef>;
  /** ID of the recommended/default mold */
  readonly recommendedMoldId?: MoldId;
}

// ============================================================================
// Procedure Types (similar to recipes)
// ============================================================================

/**
 * Reference to a procedure that can be used with a confection
 * @public
 */
export interface IConfectionProcedureRef {
  /** Composite procedure ID */
  readonly procedureId: ProcedureId;
  /** Optional notes specific to using this procedure */
  readonly notes?: string;
}

/**
 * Collection of procedures associated with a confection
 * @public
 */
export interface IConfectionProcedures {
  /** Available procedures for this confection */
  readonly procedures: ReadonlyArray<IConfectionProcedureRef>;
  /** ID of the recommended/default procedure */
  readonly recommendedProcedureId?: ProcedureId;
}

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
 * Coating specification for rolled truffles
 * @public
 */
export interface ICoatings {
  /** Available coating ingredients */
  readonly ingredients: ReadonlyArray<IChocolateSpec>;
  /** Recommended coating ingredient ID */
  readonly recommendedIngredientId?: IngredientId;
}

// ============================================================================
// Version Types
// ============================================================================

/**
 * A version of a confection
 * @public
 */
export interface IConfectionVersion {
  /** Unique identifier for this version */
  readonly versionSpec: ConfectionVersionSpec;
  /** Date this version was created (ISO 8601 format) */
  readonly createdDate: string;
  /** Optional notes about this version */
  readonly notes?: string;
}

// ============================================================================
// Base Confection Interface
// ============================================================================

/**
 * Base confection interface - all confection types share these properties
 * @public
 */
export interface IConfection {
  /** Base identifier within source (no dots) */
  readonly baseId: BaseConfectionId;
  /** Confection type (discriminator) */
  readonly confectionType: ConfectionType;
  /** Human-readable name */
  readonly name: ConfectionName;
  /** Optional description */
  readonly description?: string;
  /** Optional decorations */
  readonly decorations?: ReadonlyArray<IConfectionDecoration>;
  /** Optional tags for searching/filtering */
  readonly tags?: ReadonlyArray<string>;
  /** Yield specification */
  readonly yield: IConfectionYield;
  /** Optional filling specification */
  readonly fillings?: IConfectionFillings;
  /** Optional procedures */
  readonly confectionProcedures?: IConfectionProcedures;
  /** Version history */
  readonly versions: ReadonlyArray<IConfectionVersion>;
  /** The ID of the golden (approved default) version */
  readonly goldenVersionSpec: ConfectionVersionSpec;
}

// ============================================================================
// Discriminated Confection Types
// ============================================================================

/**
 * Molded bonbon confection
 * Uses chocolate molds for shell formation
 * @public
 */
export interface IMoldedBonBon extends IConfection {
  /** Type discriminator */
  readonly confectionType: 'molded-bonbon';
  /** Required molds specification */
  readonly molds: IConfectionMolds;
  /** Required shell chocolate specification */
  readonly shellChocolate: IChocolateSpec;
  /** Optional additional chocolates (seal, decoration) */
  readonly additionalChocolates?: ReadonlyArray<IAdditionalChocolate>;
}

/**
 * Bar truffle confection
 * Ganache slab cut into squares and enrobed
 * @public
 */
export interface IBarTruffle extends IConfection {
  /** Type discriminator */
  readonly confectionType: 'bar-truffle';
  /** Frame dimensions for ganache slab */
  readonly frameDimensions: IFrameDimensions;
  /** Single bonbon dimensions for cutting */
  readonly singleBonBonDimensions: IBonBonDimensions;
  /** Optional enrobing chocolate specification */
  readonly enrobingChocolate?: IChocolateSpec;
}

/**
 * Rolled truffle confection
 * Hand-rolled ganache balls with various coatings
 * @public
 */
export interface IRolledTruffle extends IConfection {
  /** Type discriminator */
  readonly confectionType: 'rolled-truffle';
  /** Optional enrobing chocolate specification */
  readonly enrobingChocolate?: IChocolateSpec;
  /** Optional coatings (cocoa powder, nuts, etc.) */
  readonly coatings?: ICoatings;
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
