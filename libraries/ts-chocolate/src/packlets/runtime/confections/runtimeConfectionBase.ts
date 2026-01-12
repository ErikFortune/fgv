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
 * RuntimeConfectionBase - abstract base class for runtime confections
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  BaseConfectionId,
  ConfectionId,
  ConfectionName,
  ConfectionType,
  ConfectionVersionSpec,
  ICategorizedUrl,
  ID_SEPARATOR,
  IOptionsWithPreferred,
  ProcedureId,
  SourceId
} from '../../common';
import { AnyFillingOption, FillingOptionId, IFillingSlot, IProcedureRef } from '../../entities';
import {
  AnyConfectionVersion,
  ConfectionData,
  IConfectionDecoration,
  IConfectionYield,
  isMoldedBonBon,
  isBarTruffle,
  isRolledTruffle
} from '../../entities';
import {
  IConfectionContext,
  IResolvedConfectionProcedure,
  IResolvedFillingOption,
  IResolvedFillingSlot,
  IRuntimeConfection
} from '../model';

// Forward declarations to avoid circular imports
import type { RuntimeMoldedBonBon } from './runtimeMoldedBonBon';
import type { RuntimeBarTruffle } from './runtimeBarTruffle';
import type { RuntimeRolledTruffle } from './runtimeRolledTruffle';

// ============================================================================
// RuntimeConfectionBase Abstract Class
// ============================================================================

/**
 * Abstract base class for runtime confections.
 * Provides common properties and version navigation shared by all confection types.
 * @public
 */
export abstract class RuntimeConfectionBase implements IRuntimeConfection {
  protected readonly _context: IConfectionContext;
  protected readonly _id: ConfectionId;
  protected readonly _confection: ConfectionData;
  protected readonly _sourceId: SourceId;
  protected readonly _baseId: BaseConfectionId;
  protected readonly _goldenVersion: AnyConfectionVersion;

  /**
   * Creates a RuntimeConfectionBase.
   * @param context - The runtime context for navigation
   * @param id - The composite confection ID
   * @param confection - The confection data
   * @internal
   */
  protected constructor(context: IConfectionContext, id: ConfectionId, confection: ConfectionData) {
    this._context = context;
    this._id = id;
    this._confection = confection;

    // Parse the composite ID
    const parts = (id as string).split(ID_SEPARATOR);
    this._sourceId = parts[0] as SourceId;
    this._baseId = parts[1] as BaseConfectionId;

    // Find and cache the golden version
    const goldenVersion = confection.versions.find((v) => v.versionSpec === confection.goldenVersionSpec);
    /* c8 ignore next 3 - defensive: converter validates golden version exists */
    if (!goldenVersion) {
      throw new Error(`Golden version ${confection.goldenVersionSpec} not found in confection ${id}`);
    }
    this._goldenVersion = goldenVersion;
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * The composite confection ID (e.g., "common.dark-dome-bonbon")
   */
  public get id(): ConfectionId {
    return this._id;
  }

  /**
   * The source ID part of the composite ID
   */
  public get sourceId(): SourceId {
    return this._sourceId;
  }

  /**
   * The base confection ID within the source
   */
  public get baseId(): BaseConfectionId {
    return this._baseId;
  }

  // ============================================================================
  // Core Properties (identity/metadata from confection, config from golden version)
  // ============================================================================

  /**
   * Confection type - must be overridden by subclasses
   */
  public abstract get confectionType(): ConfectionType;

  /**
   * Human-readable name
   */
  public get name(): ConfectionName {
    return this._confection.name;
  }

  /**
   * Optional description
   */
  public get description(): string | undefined {
    return this._confection.description;
  }

  /**
   * Base tags for searching/filtering (version may add more via additionalTags)
   */
  public get tags(): ReadonlyArray<string> | undefined {
    return this._confection.tags;
  }

  /**
   * Base URLs (version may add more via additionalUrls)
   */
  public get urls(): ReadonlyArray<ICategorizedUrl> | undefined {
    return this._confection.urls;
  }

  /**
   * The ID of the golden (approved default) version
   */
  public get goldenVersionSpec(): ConfectionVersionSpec {
    return this._confection.goldenVersionSpec;
  }

  // ============================================================================
  // Properties from Golden Version (convenience accessors)
  // ============================================================================

  /**
   * Decorations from the golden version
   */
  public get decorations(): ReadonlyArray<IConfectionDecoration> | undefined {
    return this._goldenVersion.decorations;
  }

  /**
   * Yield specification from the golden version
   */
  public get yield(): IConfectionYield {
    return this._goldenVersion.yield;
  }

  /**
   * Resolved filling slots from the golden version (lazy-loaded)
   */
  public abstract get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined;

  /**
   * Resolved procedures from the golden version (lazy-loaded)
   */
  public abstract get procedures():
    | IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined;

  // ============================================================================
  // Version Navigation
  // ============================================================================

  /**
   * The golden (default) version
   */
  /* c8 ignore next 3 - base class getter overridden by all concrete subclasses */
  public get goldenVersion(): AnyConfectionVersion {
    return this._goldenVersion;
  }

  /**
   * All versions
   */
  /* c8 ignore next 3 - base class getter overridden by all concrete subclasses */
  public get versions(): ReadonlyArray<AnyConfectionVersion> {
    return this._confection.versions;
  }

  /**
   * Gets a specific version by version specifier
   * @param versionSpec - The version specifier to find
   * @returns Success with version, or Failure if not found
   */
  public getVersion(versionSpec: ConfectionVersionSpec): Result<AnyConfectionVersion> {
    const version = this._confection.versions.find((v) => v.versionSpec === versionSpec);
    if (!version) {
      return Failure.with(`Version ${versionSpec} not found in confection ${this._id}`);
    }
    return Success.with(version);
  }

  // ============================================================================
  // Effective Tags/URLs (merged from base + version)
  // ============================================================================

  /**
   * Gets effective tags for the golden version (base tags + version's additional tags).
   */
  public get effectiveTags(): ReadonlyArray<string> {
    return this.getEffectiveTags(this._goldenVersion);
  }

  /**
   * Gets effective URLs for the golden version (base URLs + version's additional URLs).
   */
  public get effectiveUrls(): ReadonlyArray<ICategorizedUrl> {
    return this.getEffectiveUrls(this._goldenVersion);
  }

  /**
   * Gets effective tags for a specific version (base tags + version's additional tags).
   * @param version - The version to get tags for (defaults to golden version)
   */
  public getEffectiveTags(version?: AnyConfectionVersion): ReadonlyArray<string> {
    const targetVersion = version ?? this._goldenVersion;
    const baseTags = this._confection.tags ?? [];
    const versionTags = targetVersion.additionalTags ?? [];
    // Deduplicate while preserving order (base first)
    return [...new Set([...baseTags, ...versionTags])];
  }

  /**
   * Gets effective URLs for a specific version (base URLs + version's additional URLs).
   * @param version - The version to get URLs for (defaults to golden version)
   */
  public getEffectiveUrls(version?: AnyConfectionVersion): ReadonlyArray<ICategorizedUrl> {
    const targetVersion = version ?? this._goldenVersion;
    const baseUrls = this._confection.urls ?? [];
    const versionUrls = targetVersion.additionalUrls ?? [];
    return [...baseUrls, ...versionUrls];
  }

  // ============================================================================
  // Type Guards - delegate to confection module helpers for consistency
  // ============================================================================

  /**
   * Returns true if this is a molded bonbon confection.
   */
  public isMoldedBonBon(): this is RuntimeMoldedBonBon {
    return isMoldedBonBon(this._confection);
  }

  /**
   * Returns true if this is a bar truffle confection.
   */
  public isBarTruffle(): this is RuntimeBarTruffle {
    return isBarTruffle(this._confection);
  }

  /**
   * Returns true if this is a rolled truffle confection.
   */
  public isRolledTruffle(): this is RuntimeRolledTruffle {
    return isRolledTruffle(this._confection);
  }

  // ============================================================================
  // Resolution Helper Methods (protected for use by subclasses)
  // ============================================================================

  /**
   * Resolves filling options for a filling slot.
   * Skips options that fail to resolve (graceful degradation).
   * @param options - The raw filling options to resolve
   * @returns Resolved filling options
   * @internal
   */
  protected _resolveFillingOptions(
    options: IOptionsWithPreferred<AnyFillingOption, FillingOptionId>
  ): IOptionsWithPreferred<IResolvedFillingOption, FillingOptionId> {
    const resolvedOptions = options.options
      .map((opt) => this._resolveFillingOption(opt))
      .filter((r): r is IResolvedFillingOption => r !== undefined);

    return {
      options: resolvedOptions,
      preferredId: options.preferredId
    };
  }

  /**
   * Resolves a single filling option to either a recipe or ingredient.
   * @param option - The raw filling option
   * @returns Resolved filling option, or undefined if resolution fails
   * @internal
   */
  protected _resolveFillingOption(option: AnyFillingOption): IResolvedFillingOption | undefined {
    if (option.type === 'recipe') {
      const filling = this._context.getRuntimeFilling(option.id);
      /* c8 ignore next - defensive: skip fillings that fail to resolve */
      if (filling.isFailure()) return undefined;
      return {
        type: 'recipe',
        id: option.id,
        filling: filling.value,
        notes: option.notes,
        raw: option
      };
    } else {
      const ingredient = this._context.getRuntimeIngredient(option.id);
      /* c8 ignore next - defensive: skip ingredients that fail to resolve */
      if (ingredient.isFailure()) return undefined;
      return {
        type: 'ingredient',
        id: option.id,
        ingredient: ingredient.value,
        notes: option.notes,
        raw: option
      };
    }
  }

  /**
   * Resolves filling slots.
   * Skips slots where all options fail to resolve (graceful degradation).
   * @param slots - The raw filling slots to resolve
   * @returns Resolved filling slots, or null if no slots
   * @internal
   */
  protected _resolveFillingSlots(
    slots: ReadonlyArray<IFillingSlot> | undefined
  ): ReadonlyArray<IResolvedFillingSlot> | null {
    if (!slots || slots.length === 0) {
      return null;
    }

    return slots.map((slot) => ({
      slotId: slot.slotId,
      name: slot.name,
      filling: this._resolveFillingOptions(slot.filling)
    }));
  }

  /**
   * Resolves procedures.
   * Skips procedures that fail to resolve (graceful degradation).
   * @param procedures - The raw procedures to resolve
   * @returns Resolved procedures, or null if no procedures or all fail
   * @internal
   */
  protected _resolveProcedures(
    procedures: IOptionsWithPreferred<IProcedureRef, ProcedureId> | undefined
  ): IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | null {
    if (!procedures || procedures.options.length === 0) {
      return null;
    }

    const resolvedOptions: IResolvedConfectionProcedure[] = [];
    for (const ref of procedures.options) {
      const procedureResult = this._context.getRuntimeProcedure(ref.id);
      if (procedureResult.isSuccess()) {
        resolvedOptions.push({
          id: ref.id,
          procedure: procedureResult.value,
          notes: ref.notes,
          raw: ref
        });
      }
      // Skip procedures that fail to resolve
    }

    /* c8 ignore next 4 - defensive: return null if all procedures failed to resolve */
    if (resolvedOptions.length === 0) {
      return null;
    }

    return {
      options: resolvedOptions,
      preferredId: procedures.preferredId
    };
  }

  // ============================================================================
  // Raw Access - must be overridden by subclasses to return typed data
  // ============================================================================

  /**
   * Gets the underlying raw confection data (read-only)
   */
  public abstract get raw(): ConfectionData;
}
