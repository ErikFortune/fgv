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
  ConfectionRecipeVariationId,
  ConfectionRecipeVariationSpec,
  IngredientId,
  Measurement,
  Millimeters,
  Model,
  MoldId,
  DecorationId,
  ProcedureId,
  FillingId,
  SlotId,
  Percentage
} from '../../common';

import { IProducedFillingEntity, IProcedureRefEntity } from '../fillings';
import { IDecorationRefEntity } from '../decorations';

// ============================================================================
// Yield Types — Recipe Variation Layer (template defaults, no bufferPercentage)
// ============================================================================

/**
 * Yield specification for a molded bon-bon recipe variation.
 * Stores only the number of frames as a template default.
 * Weight-per-piece and cavities-per-frame come from the mold at runtime.
 * @public
 */
export interface IYieldInFrames {
  /** Number of frames to produce (template default) */
  readonly numFrames: number;
}

/**
 * Yield specification for bar truffle and rolled truffle recipe variations.
 * Stores count and weight-per-piece as template defaults.
 * @public
 */
export interface IYieldInPieces {
  /** Number of pieces to produce (template default) */
  readonly numPieces: number;
  /** Weight per piece in grams */
  readonly weightPerPiece: Measurement;
}

/**
 * Yield specification for a bar truffle recipe variation.
 * Stores count, weight-per-piece, and piece dimensions as template defaults.
 * @public
 */
export interface IBarTruffleYield {
  /** Number of pieces to produce (template default) */
  readonly numPieces: number;
  /** Weight per piece in grams */
  readonly weightPerPiece: Measurement;
  /** Cut dimensions of a single piece */
  readonly dimensions: IPieceDimensions;
}

/**
 * Union type for yield specifications.
 * @public
 */
export type ConfectionYield = IYieldInFrames | IYieldInPieces | IBarTruffleYield;

// ============================================================================
// Yield Type Guards
// ============================================================================

/**
 * Type guard for {@link IYieldInFrames} (molded bon-bon variation yield).
 * @param y - Yield specification to check
 * @returns True if the yield is frame-based
 * @public
 */
export function isYieldInFrames(y: ConfectionYield): y is IYieldInFrames {
  return 'numFrames' in y;
}

/**
 * Type guard for {@link IBarTruffleYield} (bar truffle variation yield).
 * @param y - Yield specification to check
 * @returns True if the yield includes piece dimensions
 * @public
 */
export function isBarTruffleYield(y: ConfectionYield): y is IBarTruffleYield {
  return 'dimensions' in y;
}

/**
 * Type guard for {@link IYieldInPieces} (rolled truffle variation yield).
 * @param y - Yield specification to check
 * @returns True if the yield is piece-based without dimensions
 * @public
 */
export function isYieldInPieces(y: ConfectionYield): y is IYieldInPieces {
  return !isYieldInFrames(y) && !isBarTruffleYield(y);
}

// ============================================================================
// Yield Types — Produced/Session Layer (actual values, includes bufferPercentage)
// ============================================================================

/**
 * Yield specification for a produced molded bon-bon.
 * Stores the minimal essential values; count, weightPerPiece and targetWeight are derived at runtime.
 * @public
 */
export interface IBufferedYieldInFrames {
  /** Number of frames produced */
  readonly numFrames: number;
  /** Buffer percentage (e.g., 10 for 10% overfill) */
  readonly bufferPercentage: Percentage;
  // Derived at runtime from mold:
  //   count = numFrames × mold.cavitiesPerFrame
  //   weightPerPiece = mold.cavityWeight
  //   targetWeight = count × weightPerPiece × (1 + bufferPercentage)
}

/**
 * Yield specification for a produced bar truffle or rolled truffle.
 * Stores the minimal essential values; targetWeight is derived at runtime.
 * @public
 */
export interface IBufferedYieldInPieces {
  /** Number of pieces produced */
  readonly count: number;
  /** Weight per piece in grams */
  readonly weightPerPiece: Measurement;
  /** Buffer percentage (e.g., 10 for 10% overfill) */
  readonly bufferPercentage: Percentage;
  // Derived at runtime:
  //   targetWeight = count × weightPerPiece × (1 + bufferPercentage)
}

/**
 * Yield specification for a produced bar truffle.
 * Stores the minimal essential values; targetWeight is derived at runtime.
 * @public
 */
export interface IBufferedBarTruffleYield {
  /** Number of pieces produced */
  readonly count: number;
  /** Weight per piece in grams */
  readonly weightPerPiece: Measurement;
  /** Buffer percentage (e.g., 10 for 10% overfill) */
  readonly bufferPercentage: Percentage;
  /** Cut dimensions of a single piece */
  readonly dimensions: IPieceDimensions;
}

/**
 * Union type for buffered yield specifications.
 * @public
 */
export type BufferedConfectionYield =
  | IBufferedYieldInFrames
  | IBufferedYieldInPieces
  | IBufferedBarTruffleYield;

// ============================================================================
// Buffered Yield Type Guards
// ============================================================================

/**
 * Type guard for {@link IBufferedYieldInFrames} (produced molded bon-bon yield).
 * @param y - Buffered yield specification to check
 * @returns True if the yield is frame-based
 * @public
 */
export function isBufferedYieldInFrames(y: BufferedConfectionYield): y is IBufferedYieldInFrames {
  return 'numFrames' in y;
}

/**
 * Type guard for {@link IBufferedBarTruffleYield} (produced bar truffle yield).
 * @param y - Buffered yield specification to check
 * @returns True if the yield includes piece dimensions
 * @public
 */
export function isBufferedBarTruffleYield(y: BufferedConfectionYield): y is IBufferedBarTruffleYield {
  return 'dimensions' in y;
}

/**
 * Type guard for {@link IBufferedYieldInPieces} (produced rolled truffle yield).
 * @param y - Buffered yield specification to check
 * @returns True if the yield is piece-based without dimensions
 * @public
 */
export function isBufferedYieldInPieces(y: BufferedConfectionYield): y is IBufferedYieldInPieces {
  return !isBufferedYieldInFrames(y) && !isBufferedBarTruffleYield(y);
}

// ============================================================================
// Decoration Types (legacy)
// ============================================================================

/**
 * @deprecated Use {@link Entities.Decorations.IDecorationRefEntity | IDecorationRefEntity} instead.
 * Decoration specification for a {@link Entities.Confections.AnyConfectionEntity | confection}.
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
export interface IRecipeFillingOptionEntity {
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
export interface IIngredientFillingOptionEntity {
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
export type AnyFillingOptionEntity = IRecipeFillingOptionEntity | IIngredientFillingOptionEntity;

/**
 * A single filling slot with its own options and preferred selection.
 * Each slot can hold recipes OR ingredients (or both).
 * @public
 */
export interface IFillingSlotEntity {
  /** Unique identifier for this slot within the confection (e.g., "layer1", "center") */
  readonly slotId: SlotId;
  /** Human-readable name for display (e.g., "Inner Layer", "Ganache Center") */
  readonly name?: string;
  /** Available filling options with preferred selection */
  readonly filling: Model.IOptionsWithPreferred<AnyFillingOptionEntity, FillingOptionId>;
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
export interface IAdditionalChocolateEntity {
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
 * Single bonbon dimensions for bar truffle cutting.
 * Used to store the actual size of each piece; frame dimensions are derived at runtime.
 * @public
 */
export interface IPieceDimensions {
  /** Width of a single bonbon in millimeters */
  readonly width: Millimeters;
  /** Height of a single bonbon in millimeters */
  readonly height: Millimeters;
  /** Depth/thickness of a single bonbon (= ganache slab depth) in millimeters */
  readonly depth: Millimeters;
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
export type ICoatingsEntity = Model.IIdsWithPreferred<IngredientId>;

// ============================================================================
// Variation Types
// ============================================================================

/**
 * Base variation interface - shared by all confection variation types.
 * Contains the configuration details that can change between variations.
 * The yield field is typed as ConfectionYield on the base; each subtype narrows it.
 * @public
 */
export interface IConfectionRecipeVariationEntityBase {
  /** Unique identifier for this variation */
  readonly variationSpec: ConfectionRecipeVariationSpec;
  /** Optional human-readable name for this variation */
  readonly name?: string;
  /** Date this variation was created (ISO 8601 format) */
  readonly createdDate: string;
  /** Yield specification for this variation */
  readonly yield: ConfectionYield;
  /** Optional filling slots - each slot has independent options with a preferred selection */
  readonly fillings?: ReadonlyArray<IFillingSlotEntity>;
  /** Optional decoration references with preferred selection */
  readonly decorations?: Model.IOptionsWithPreferred<IDecorationRefEntity, DecorationId>;
  /** Optional procedures with preferred selection */
  readonly procedures?: Model.IOptionsWithPreferred<IProcedureRefEntity, ProcedureId>;
  /** Optional categorized notes about this variation */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
  /** Additional tags (merged with base confection tags) */
  readonly additionalTags?: ReadonlyArray<string>;
  /** Additional URLs (merged with base confection URLs) */
  readonly additionalUrls?: ReadonlyArray<Model.ICategorizedUrl>;
}

/**
 * Variation interface for molded bonbon confections.
 * Includes mold and chocolate shell specifications.
 * Yield stores only numFrames as a template default; weight and cavity count come from mold at runtime.
 * @public
 */
export interface IMoldedBonBonRecipeVariationEntity extends IConfectionRecipeVariationEntityBase {
  /** Template yield: number of frames to produce */
  readonly yield: IYieldInFrames;
  /** Required molds with preferred selection */
  readonly molds: Model.IOptionsWithPreferred<IConfectionMoldRef, MoldId>;
  /** Required shell chocolate specification */
  readonly shellChocolate: IChocolateSpec;
  /** Optional additional chocolates (seal, decoration) */
  readonly additionalChocolates?: ReadonlyArray<IAdditionalChocolateEntity>;
}

/**
 * Variation interface for bar truffle confections.
 * Stores bonbon dimensions (including depth = ganache slab depth).
 * Frame dimensions are derived at runtime from count + bonbon dimensions.
 * @public
 */
export interface IBarTruffleRecipeVariationEntity extends IConfectionRecipeVariationEntityBase {
  /** Template yield: count, weight per piece, and piece dimensions */
  readonly yield: IBarTruffleYield;
  /** Optional enrobing chocolate specification */
  readonly enrobingChocolate?: IChocolateSpec;
}

/**
 * Variation interface for rolled truffle confections.
 * Includes enrobing and coating specifications.
 * @public
 */
export interface IRolledTruffleRecipeVariationEntity extends IConfectionRecipeVariationEntityBase {
  /** Template yield: count and weight per piece */
  readonly yield: IYieldInPieces;
  /** Optional enrobing chocolate specification */
  readonly enrobingChocolate?: IChocolateSpec;
  /** Optional coatings (cocoa powder, nuts, etc.) */
  readonly coatings?: ICoatingsEntity;
}

/**
 * Union type for all confection variation types.
 * @public
 */
export type AnyConfectionRecipeVariationEntity =
  | IMoldedBonBonRecipeVariationEntity
  | IBarTruffleRecipeVariationEntity
  | IRolledTruffleRecipeVariationEntity;

/**
 * Discriminator type for confection variation snapshots (e.g. in journal entries).
 * @public
 */
export type ConfectionVariationType = 'molded-bonbon' | 'bar-truffle' | 'rolled-truffle';

// ============================================================================
// Derivation Tracking
// ============================================================================

/**
 * Reference to a source confection recipe+variation from which a confection recipe was derived.
 * Used to track lineage when a user edits a read-only confection recipe and creates
 * a new confection recipe in a writable collection.
 * @public
 */
export interface IConfectionDerivationEntity {
  /**
   * Source confection recipe variation ID (format: "sourceId.confectionId\@variationSpec")
   */
  readonly sourceVariationId: ConfectionRecipeVariationId;

  /**
   * Date of derivation (ISO 8601 format)
   */
  readonly derivedDate: string;

  /**
   * Optional categorized notes about the derivation
   */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}

// ============================================================================
// Base Confection Interface
// ============================================================================

/**
 * Base confection interface - all confection types share these properties.
 * Contains stable identity and metadata; configuration details are in variations.
 * @public
 */
export interface IConfectionRecipeEntityBase<
  TType extends ConfectionType = ConfectionType,
  TVariation extends AnyConfectionRecipeVariationEntity = AnyConfectionRecipeVariationEntity
> {
  /** Base identifier within source (no dots) */
  readonly baseId: BaseConfectionId;
  /** Confection type (discriminator) */
  readonly confectionType: TType;
  /** Human-readable name */
  readonly name: ConfectionName;
  /** Optional description */
  readonly description?: string;
  /** Optional tags for searching/filtering */
  readonly tags?: ReadonlyArray<string>;
  /** Optional categorized URLs for external resources (tutorials, videos, etc.) */
  readonly urls?: ReadonlyArray<Model.ICategorizedUrl>;
  /** The ID of the golden (approved default) variation */
  readonly goldenVariationSpec: ConfectionRecipeVariationSpec;
  /** Variations history - contains type-specific configuration details */
  readonly variations: ReadonlyArray<TVariation>;
  /**
   * Optional derivation info - tracks lineage if this confection recipe was forked
   * from another confection recipe (e.g., when editing a read-only confection recipe)
   */
  readonly derivedFrom?: IConfectionDerivationEntity;
}

// ============================================================================
// Discriminated Confection Types
// ============================================================================

/**
 * Molded bonbon confection
 * Uses chocolate molds for shell formation
 * @public
 */
export type MoldedBonBonRecipeEntity = IConfectionRecipeEntityBase<
  'molded-bonbon',
  IMoldedBonBonRecipeVariationEntity
>;

/**
 * Bar truffle confection
 * Ganache slab cut into squares and enrobed
 * @public
 */
export type BarTruffleRecipeEntity = IConfectionRecipeEntityBase<
  'bar-truffle',
  IBarTruffleRecipeVariationEntity
>;

/**
 * Rolled truffle confection
 * Hand-rolled ganache balls with various coatings
 * @public
 */
export type RolledTruffleRecipeEntity = IConfectionRecipeEntityBase<
  'rolled-truffle',
  IRolledTruffleRecipeVariationEntity
>;

// ============================================================================
// Confection Union Type
// ============================================================================

/**
 * Discriminated union of all confection data types.
 * Use this when working with raw confection data.
 * @public
 */
export type AnyConfectionRecipeEntity =
  | MoldedBonBonRecipeEntity
  | BarTruffleRecipeEntity
  | RolledTruffleRecipeEntity;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for {@link Entities.Confections.MoldedBonBonRecipeEntity | molded bon-bon recipe entity}.
 * @param confection - Confection data to check
 * @returns True if the confection is a molded bonbon
 * @public
 */
export function isMoldedBonBonRecipeEntity(
  confection: AnyConfectionRecipeEntity
): confection is MoldedBonBonRecipeEntity {
  return confection.confectionType === 'molded-bonbon';
}

/**
 * Type guard for {@link Entities.Confections.BarTruffleRecipeEntity | bar truffle recipe entity}.
 * @param confection - Confection data to check
 * @returns True if the confection is a bar truffle
 * @public
 */
export function isBarTruffleEntity(
  confection: AnyConfectionRecipeEntity
): confection is BarTruffleRecipeEntity {
  return confection.confectionType === 'bar-truffle';
}

/**
 * Type guard for {@link Entities.Confections.RolledTruffleRecipeEntity | rolled truffle recipe entity}.
 * @param confection - Confection data to check
 * @returns True if the confection is a rolled truffle
 * @public
 */
export function isRolledTruffleRecipeEntity(
  confection: AnyConfectionRecipeEntity
): confection is RolledTruffleRecipeEntity {
  return confection.confectionType === 'rolled-truffle';
}

// ============================================================================
// Variation Type Guards
// ============================================================================

/**
 * Type guard for {@link Entities.Confections.IMoldedBonBonRecipeVariationEntity | molded bon-bon recipe variation entity}.
 * @param variation - Variation to check
 * @returns True if the variation is a molded bonbon variation
 * @public
 */
export function isMoldedBonBonRecipeVariationEntity(
  variation: AnyConfectionRecipeVariationEntity
): variation is IMoldedBonBonRecipeVariationEntity {
  return 'molds' in variation && 'shellChocolate' in variation;
}

/**
 * Type guard for {@link Entities.Confections.IBarTruffleRecipeVariationEntity | bar truffle recipe variation entity}.
 * @param variation - Variation to check
 * @returns True if the variation is a bar truffle variation
 * @public
 */
export function isBarTruffleRecipeVariationEntity(
  variation: AnyConfectionRecipeVariationEntity
): variation is IBarTruffleRecipeVariationEntity {
  return !('molds' in variation) && 'dimensions' in (variation.yield as unknown as Record<string, unknown>);
}

/**
 * Type guard for {@link Entities.Confections.IRolledTruffleRecipeVariationEntity | rolled truffle recipe variation entity}.
 * @param variation - Variation to check
 * @returns True if the variation is a rolled truffle variation
 * @public
 */
export function isRolledTruffleRecipeVariationEntity(
  variation: AnyConfectionRecipeVariationEntity
): variation is IRolledTruffleRecipeVariationEntity {
  return !isMoldedBonBonRecipeVariationEntity(variation) && !isBarTruffleRecipeVariationEntity(variation);
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
export interface IResolvedFillingSlotEntity {
  /** Slot type discriminator */
  readonly slotType: 'recipe';
  /** Slot identifier */
  readonly slotId: SlotId;
  /** Resolved filling recipe ID */
  readonly fillingId: FillingId;
  /** Full produced filling snapshot (populated in journal entries) */
  readonly produced?: IProducedFillingEntity;
}

/**
 * Resolved slot with ingredient filling.
 * @public
 */
export interface IResolvedIngredientSlotEntity {
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
export type AnyResolvedFillingSlotEntity = IResolvedFillingSlotEntity | IResolvedIngredientSlotEntity;

/**
 * Type guard for IResolvedFillingSlot
 * @param slot - Resolved slot to check
 * @returns True if the slot contains a recipe filling
 * @public
 */
export function isResolvedFillingSlotEntity(
  slot: AnyResolvedFillingSlotEntity
): slot is IResolvedFillingSlotEntity {
  return slot.slotType === 'recipe';
}

/**
 * Type guard for IResolvedIngredientSlot
 * @param slot - Resolved slot to check
 * @returns True if the slot contains an ingredient filling
 * @public
 */
export function isResolvedIngredientSlotEntity(
  slot: AnyResolvedFillingSlotEntity
): slot is IResolvedIngredientSlotEntity {
  return slot.slotType === 'ingredient';
}

// ============================================================================
// Produced Confection Types (for Journal/Runtime)
// ============================================================================

/**
 * Base interface for all produced confection types.
 * Contains common fields shared by all confection productions.
 * Note: yield is NOT on the base — each concrete subtype declares its own yield type.
 * @public
 */
export interface IProducedConfectionEntityBase {
  /** Confection type discriminator (matches ConfectionType) */
  readonly confectionType: ConfectionType;
  /** Confection variation ID that was produced */
  readonly variationId: ConfectionRecipeVariationId;
  /** Resolved filling slots with concrete selections */
  readonly fillings?: ReadonlyArray<AnyResolvedFillingSlotEntity>;
  /** Resolved procedure ID if one was used */
  readonly procedureId?: ProcedureId;
  /** Resolved decoration ID if one was selected */
  readonly decorationId?: DecorationId;
  /** Optional categorized notes about production */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}

/**
 * Produced molded bonbon with concrete choices.
 * Yield stores only numFrames + bufferPercentage; count/weightPerPiece/targetWeight are derived.
 * @public
 */
export interface IProducedMoldedBonBonEntity extends IProducedConfectionEntityBase {
  /** Confection type discriminator */
  readonly confectionType: 'molded-bonbon';
  /** Frame-based yield: numFrames + bufferPercentage stored; rest derived from mold */
  readonly yield: IBufferedYieldInFrames;
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
 * Yield stores count + weightPerPiece + bufferPercentage; targetWeight is derived.
 * Frame dimensions are derived at runtime from count + bonBonDimensions.
 * @public
 */
export interface IProducedBarTruffleEntity extends IProducedConfectionEntityBase {
  /** Confection type discriminator */
  readonly confectionType: 'bar-truffle';
  /** Yield with piece dimensions; targetWeight and frameDimensions derived at runtime */
  readonly yield: IBufferedBarTruffleYield;
  /** Resolved enrobing chocolate ingredient ID (if used) */
  readonly enrobingChocolateId?: IngredientId;
}

/**
 * Produced rolled truffle with concrete choices.
 * Yield stores count + weightPerPiece + bufferPercentage; targetWeight is derived.
 * @public
 */
export interface IProducedRolledTruffleEntity extends IProducedConfectionEntityBase {
  /** Confection type discriminator */
  readonly confectionType: 'rolled-truffle';
  /** Count-based yield: count + weightPerPiece + bufferPercentage stored; targetWeight derived */
  readonly yield: IBufferedYieldInPieces;
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
export type AnyProducedConfectionEntity =
  | IProducedMoldedBonBonEntity
  | IProducedBarTruffleEntity
  | IProducedRolledTruffleEntity;

/**
 * Type guard for IProducedMoldedBonBon
 * @param produced - Produced confection to check
 * @returns True if this is a produced molded bonbon
 * @public
 */
export function isProducedMoldedBonBonEntity(
  produced: AnyProducedConfectionEntity
): produced is IProducedMoldedBonBonEntity {
  return produced.confectionType === 'molded-bonbon';
}

/**
 * Type guard for IProducedBarTruffle
 * @param produced - Produced confection to check
 * @returns True if this is a produced bar truffle
 * @public
 */
export function isProducedBarTruffleEntity(
  produced: AnyProducedConfectionEntity
): produced is IProducedBarTruffleEntity {
  return produced.confectionType === 'bar-truffle';
}

/**
 * Type guard for IProducedRolledTruffle
 * @param produced - Produced confection to check
 * @returns True if this is a produced rolled truffle
 * @public
 */
export function isProducedRolledTruffleEntity(
  produced: AnyProducedConfectionEntity
): produced is IProducedRolledTruffleEntity {
  return produced.confectionType === 'rolled-truffle';
}
