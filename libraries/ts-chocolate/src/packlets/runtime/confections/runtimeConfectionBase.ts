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
  SourceId
} from '../../common';
import { IProcedureRef } from '../../fillings';
import {
  AnyConfectionVersion,
  ConfectionData,
  IConfectionDecoration,
  IConfectionYield,
  IFillingSlot,
  isMoldedBonBon,
  isBarTruffle,
  isRolledTruffle
} from '../../confections';
import { IOptionsWithPreferred, ProcedureId } from '../../common';
import { IConfectionContext, IRuntimeConfection } from '../model';

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
   * Optional filling slots from the golden version
   */
  public get fillings(): ReadonlyArray<IFillingSlot> | undefined {
    return this._goldenVersion.fillings;
  }

  /**
   * Optional procedures with preferred selection from the golden version
   */
  public get procedures(): IOptionsWithPreferred<IProcedureRef, ProcedureId> | undefined {
    return this._goldenVersion.procedures;
  }

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
  // Raw Access - must be overridden by subclasses to return typed data
  // ============================================================================

  /**
   * Gets the underlying raw confection data (read-only)
   */
  public abstract get raw(): ConfectionData;
}
