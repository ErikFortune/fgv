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
  ConfectionVersionId,
  ConfectionVersionSpec,
  IngredientId,
  Measurement,
  Millimeters,
  Model,
  MoldId,
  ProcedureId,
  FillingId,
  SlotId
} from '../../common';

import { IProcedureRef } from '../fillings';

// ============================================================================
// Yield and Decoration Types
// ============================================================================

/**
 * Yield specification for a {@link Entities.Confections.ConfectionData | confection}.
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
 * Frame-based yield specification for molded bonbons.
 * Stores frames + buffer percentage as primary values; count is computed from mold.
 * @public
 */
export interface IMoldedBonBonYield {
  /** Discriminator for yield type */
  readonly yieldType: 'frames';
  /** Number of frames to produce (primary storage) */
  readonly frames: number;
  /** Buffer percentage (e.g., 0.1 for 10% overfill) */
  readonly bufferPercentage: number;
  /** Computed count: frames × cavitiesPerFrame */
  readonly count: number;
  /** Unit description (usually 'pieces') */
  readonly unit?: string;
  /** Weight per piece in grams (from mold.cavityWeight) */
  readonly weightPerPiece?: Measurement;
}

/**
 * Discriminated union of all yield types.
 * @public
 */
export type AnyConfectionYield = IConfectionYield | IMoldedBonBonYield;

/**
 * Type guard to check if a yield is frame-based (for molded bonbons).
 * @param yieldSpec - The yield specification to check
 * @returns True if the yield is a {@link Entities.Confections.IMoldedBonBonYield | frame-based yield}
 * @public
 */
export function isMoldedBonBonYield(yieldSpec: AnyConfectionYield): yieldSpec is IMoldedBonBonYield {
  return 'yieldType' in yieldSpec && yieldSpec.yieldType === 'frames';
}

/**
 * Decoration specification for a {@link Entities.Confections.ConfectionData | confection}.
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
export type FillingOptionId = FillingId | IngredientId;

/**
 * Recipe filling option - references a recipe (e.g., ganache)
 * @public
 */
export interface IRecipeFillingOption {
  /** Discriminator for recipe filling */
  readonly type: 'recipe';
  /** The filling recipe ID */
  readonly id: FillingId;
  /** Optional categorized notes specific to this filling option */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
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
  /** Optional categorized notes specific to this filling option */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
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
  readonly filling: Model.IOptionsWithPreferred<AnyFillingOption, FillingOptionId>;
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
export type IChocolateSpec = Model.IIdsWithPreferred<IngredientId>;

/**
 * Additional chocolate specification with purpose.
 * Used for seal chocolate, decoration chocolate, etc.
 * @public
 */
export interface IAdditionalChocolate {
  /** Available chocolate options with preferred selection */
  readonly chocolate: Model.IIdsWithPreferred<IngredientId>;
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
export type IConfectionMoldRef = Model.IRefWithNotes<MoldId>;

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
export type ICoatings = Model.IIdsWithPreferred<IngredientId>;

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
  readonly procedures?: Model.IOptionsWithPreferred<IProcedureRef, ProcedureId>;
  /** Optional categorized notes about this version */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
  /** Additional tags (merged with base confection tags) */
  readonly additionalTags?: ReadonlyArray<string>;
  /** Additional URLs (merged with base confection URLs) */
  readonly additionalUrls?: ReadonlyArray<Model.ICategorizedUrl>;
}

/**
 * Version interface for molded bonbon confections.
 * Includes mold and chocolate shell specifications.
 * @public
 */
export interface IMoldedBonBonVersion extends IConfectionVersionBase {
  /** Required molds with preferred selection */
  readonly molds: Model.IOptionsWithPreferred<IConfectionMoldRef, MoldId>;
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
  readonly urls?: ReadonlyArray<Model.ICategorizedUrl>;
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

// ============================================================================
// Resolved Filling Slot Types (for Journal/Runtime)
// ============================================================================

/**
 * Resolved slot type discriminator.
 * @public
 */
export type ResolvedSlotType = 'recipe' | 'ingredient';

/**
 * All resolved slot types.
 * @public
 */
export const allResolvedSlotTypes: ResolvedSlotType[] = ['recipe', 'ingredient'];

/**
 * Resolved slot with recipe filling.
 * @public
 */
export interface IResolvedFillingSlot {
  /** Slot type discriminator */
  readonly slotType: 'recipe';
  /** Slot identifier */
  readonly slotId: SlotId;
  /** Resolved filling recipe ID */
  readonly fillingId: FillingId;
}

/**
 * Resolved slot with ingredient filling.
 * @public
 */
export interface IResolvedIngredientSlot {
  /** Slot type discriminator */
  readonly slotType: 'ingredient';
  /** Slot identifier */
  readonly slotId: SlotId;
  /** Resolved ingredient ID */
  readonly ingredientId: IngredientId;
}

/**
 * Union of resolved filling slot types.
 * Discriminated on the `slotType` field.
 * @public
 */
export type AnyResolvedFillingSlot = IResolvedFillingSlot | IResolvedIngredientSlot;

/**
 * Type guard for IResolvedFillingSlot
 * @param slot - Resolved slot to check
 * @returns True if the slot contains a recipe filling
 * @public
 */
export function isResolvedFillingSlot(slot: AnyResolvedFillingSlot): slot is IResolvedFillingSlot {
  return slot.slotType === 'recipe';
}

/**
 * Type guard for IResolvedIngredientSlot
 * @param slot - Resolved slot to check
 * @returns True if the slot contains an ingredient filling
 * @public
 */
export function isResolvedIngredientSlot(slot: AnyResolvedFillingSlot): slot is IResolvedIngredientSlot {
  return slot.slotType === 'ingredient';
}

// ============================================================================
// Produced Confection Types (for Journal/Runtime)
// ============================================================================

/**
 * Base interface for all produced confection types.
 * Contains common fields shared by all confection productions.
 * @public
 */
export interface IProducedConfectionBase {
  /** Confection type discriminator (matches ConfectionType) */
  readonly confectionType: ConfectionType;
  /** Confection version ID that was produced */
  readonly versionId: ConfectionVersionId;
  /** Yield specification for this production */
  readonly yield: IConfectionYield;
  /** Resolved filling slots with concrete selections */
  readonly fillings?: ReadonlyArray<AnyResolvedFillingSlot>;
  /** Resolved procedure ID if one was used */
  readonly procedureId?: ProcedureId;
  /** Optional categorized notes about production */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}

/**
 * Produced molded bonbon with concrete choices.
 * @public
 */
export interface IProducedMoldedBonBon extends IProducedConfectionBase {
  /** Confection type discriminator */
  readonly confectionType: 'molded-bonbon';
  /** Resolved mold ID */
  readonly moldId: MoldId;
  /** Resolved shell chocolate ingredient ID */
  readonly shellChocolateId: IngredientId;
  /** Resolved seal chocolate ingredient ID (if used) */
  readonly sealChocolateId?: IngredientId;
  /** Resolved decoration chocolate ingredient ID (if used) */
  readonly decorationChocolateId?: IngredientId;
}

/**
 * Produced bar truffle with concrete choices.
 * @public
 */
export interface IProducedBarTruffle extends IProducedConfectionBase {
  /** Confection type discriminator */
  readonly confectionType: 'bar-truffle';
  /** Resolved enrobing chocolate ingredient ID (if used) */
  readonly enrobingChocolateId?: IngredientId;
}

/**
 * Produced rolled truffle with concrete choices.
 * @public
 */
export interface IProducedRolledTruffle extends IProducedConfectionBase {
  /** Confection type discriminator */
  readonly confectionType: 'rolled-truffle';
  /** Resolved enrobing chocolate ingredient ID (if used) */
  readonly enrobingChocolateId?: IngredientId;
  /** Resolved coating ingredient ID (if used) */
  readonly coatingId?: IngredientId;
}

/**
 * Discriminated union of produced confection types.
 * Discriminated on the `confectionType` field.
 * @public
 */
export type AnyProducedConfection = IProducedMoldedBonBon | IProducedBarTruffle | IProducedRolledTruffle;

/**
 * Type guard for IProducedMoldedBonBon
 * @param produced - Produced confection to check
 * @returns True if this is a produced molded bonbon
 * @public
 */
export function isProducedMoldedBonBon(produced: AnyProducedConfection): produced is IProducedMoldedBonBon {
  return produced.confectionType === 'molded-bonbon';
}

/**
 * Type guard for IProducedBarTruffle
 * @param produced - Produced confection to check
 * @returns True if this is a produced bar truffle
 * @public
 */
export function isProducedBarTruffle(produced: AnyProducedConfection): produced is IProducedBarTruffle {
  return produced.confectionType === 'bar-truffle';
}

/**
 * Type guard for IProducedRolledTruffle
 * @param produced - Produced confection to check
 * @returns True if this is a produced rolled truffle
 * @public
 */
export function isProducedRolledTruffle(produced: AnyProducedConfection): produced is IProducedRolledTruffle {
  return produced.confectionType === 'rolled-truffle';
}
