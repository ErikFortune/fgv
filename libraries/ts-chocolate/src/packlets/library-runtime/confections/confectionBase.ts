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
 * ConfectionBase - abstract base class for runtime confections
 * @packageDocumentation
 */

import { Failure, Result, Success, mapResults } from '@fgv/ts-utils';

import {
  BaseConfectionId,
  ConfectionId,
  ConfectionName,
  ConfectionType,
  ConfectionVersionSpec,
  Converters,
  Model as CommonModel,
  ProcedureId,
  CollectionId
} from '../../common';
import { Confections } from '../../entities';
import {
  AnyConfectionVersion,
  IConfectionContext,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IConfectionBase
} from '../model';

// Forward declarations to avoid circular imports
import type { MoldedBonBon } from './moldedBonBon';
import type { BarTruffle } from './barTruffle';
import type { RolledTruffle } from './rolledTruffle';

// ============================================================================
// ConfectionBase Abstract Class
// ============================================================================

/**
 * Abstract base class for runtime confections.
 * Provides common properties and version navigation shared by all confection types.
 *
 * @typeParam TVersion - The specific version type for this confection
 * @typeParam TEntity - The specific entity type for this confection
 * @public
 */
export abstract class ConfectionBase<
  TVersion extends AnyConfectionVersion = AnyConfectionVersion,
  TEntity extends Confections.AnyConfectionEntity = Confections.AnyConfectionEntity
> implements IConfectionBase<TVersion>
{
  protected readonly _context: IConfectionContext;
  protected readonly _id: ConfectionId;
  protected readonly _confection: TEntity;
  protected readonly _sourceId: CollectionId;
  protected readonly _baseId: BaseConfectionId;
  protected readonly _goldenVersionEntity: Confections.AnyConfectionVersionEntity;

  // Lazy-resolved version caches (undefined = not yet resolved)
  private _resolvedGoldenVersion: TVersion | undefined;
  private _resolvedVersions: ReadonlyArray<TVersion> | undefined;
  private _versionCache: Map<ConfectionVersionSpec, TVersion> | undefined;

  /**
   * Creates a ConfectionBase.
   * @param context - The runtime context for navigation
   * @param id - The composite confection ID
   * @param confection - The confection data
   * @internal
   */
  protected constructor(context: IConfectionContext, id: ConfectionId, confection: TEntity) {
    this._context = context;
    this._id = id;
    this._confection = confection;

    const parsed = Converters.parsedConfectionId.convert(id).orThrow();
    this._sourceId = parsed.collectionId;
    this._baseId = parsed.itemId;

    // Find and cache the golden version entity
    const goldenVersion = confection.versions.find((v) => v.versionSpec === confection.goldenVersionSpec);
    /* c8 ignore next 3 - defensive: converter validates golden version exists */
    if (!goldenVersion) {
      throw new Error(`Golden version ${confection.goldenVersionSpec} not found in confection ${id}`);
    }
    this._goldenVersionEntity = goldenVersion;
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
  public get collectionId(): CollectionId {
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
  public get urls(): ReadonlyArray<CommonModel.ICategorizedUrl> | undefined {
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
  public get decorations(): ReadonlyArray<Confections.IConfectionDecoration> | undefined {
    return this._goldenVersionEntity.decorations;
  }

  /**
   * Yield specification from the golden version
   */
  public get yield(): Confections.IConfectionYield {
    return this._goldenVersionEntity.yield;
  }

  /**
   * Resolved filling slots from the golden version (lazy-loaded)
   */
  public abstract get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined;

  /**
   * Resolved procedures from the golden version (lazy-loaded)
   */
  public abstract get procedures():
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined;

  // ============================================================================
  // Version Navigation (lazy)
  // ============================================================================

  /**
   * Gets the golden (default) version - resolved.
   * Resolved lazily on first access.
   * @returns Result with golden version, or Failure if creation fails
   * @public
   */
  public getGoldenVersion(): Result<TVersion> {
    if (this._resolvedGoldenVersion === undefined) {
      return this._createVersion(this._goldenVersionEntity).onSuccess((version) => {
        this._resolvedGoldenVersion = version;
        return Success.with(version);
      });
    }
    return Success.with(this._resolvedGoldenVersion);
  }

  /**
   * The golden (default) version - resolved.
   * Resolved lazily on first access.
   * @throws if version creation fails - prefer getGoldenVersion() for proper error handling
   */
  public get goldenVersion(): TVersion {
    return this.getGoldenVersion().orThrow();
  }

  /**
   * Gets all versions - resolved.
   * Resolved lazily on first access.
   * @returns Result with all versions, or Failure if any version creation fails
   * @public
   */
  public getVersions(): Result<ReadonlyArray<TVersion>> {
    if (this._resolvedVersions === undefined) {
      return mapResults(this._confection.versions.map((v) => this._getOrCreateVersion(v))).onSuccess(
        (versions) => {
          this._resolvedVersions = versions;
          return Success.with(versions);
        }
      );
    }
    return Success.with(this._resolvedVersions);
  }

  /**
   * All versions - resolved.
   * Resolved lazily on first access.
   * @throws if version creation fails - prefer getVersions() for proper error handling
   */
  public get versions(): ReadonlyArray<TVersion> {
    return this.getVersions().orThrow();
  }

  /**
   * Gets a specific version by version specifier.
   * @param versionSpec - The version specifier to find
   * @returns Success with runtime version, or Failure if not found or creation fails
   */
  public getVersion(versionSpec: ConfectionVersionSpec): Result<TVersion> {
    const entity = this._confection.versions.find((v) => v.versionSpec === versionSpec);
    if (!entity) {
      return Failure.with(`Version ${versionSpec} not found in confection ${this._id}`);
    }
    return this._getOrCreateVersion(entity);
  }

  /**
   * Gets or creates a runtime version from a data layer entity, using caching.
   * @param entity - The data layer entity
   * @returns Result with runtime version (from cache or newly created), or Failure if creation fails
   * @internal
   */
  private _getOrCreateVersion(entity: Confections.AnyConfectionVersionEntity): Result<TVersion> {
    // Initialize cache if needed
    if (this._versionCache === undefined) {
      this._versionCache = new Map();
    }

    // Check cache
    const cached = this._versionCache.get(entity.versionSpec);
    if (cached !== undefined) {
      return Success.with(cached);
    }

    // Create new version and cache it
    return this._createVersion(entity).onSuccess((version) => {
      this._versionCache!.set(entity.versionSpec, version);
      return Success.with(version);
    });
  }

  /**
   * Creates a runtime version from a data layer entity.
   * Must be overridden by subclasses to return the appropriate typed version.
   * @param entity - The data layer entity
   * @returns Result with runtime version, or Failure if creation fails
   * @internal
   */
  protected abstract _createVersion(entity: Confections.AnyConfectionVersionEntity): Result<TVersion>;

  // ============================================================================
  // Effective Tags/URLs (merged from base + version)
  // ============================================================================

  /**
   * Gets effective tags for the golden version (base tags + version's additional tags).
   */
  public get effectiveTags(): ReadonlyArray<string> {
    return this.getEffectiveTags(this._goldenVersionEntity);
  }

  /**
   * Gets effective URLs for the golden version (base URLs + version's additional URLs).
   */
  public get effectiveUrls(): ReadonlyArray<CommonModel.ICategorizedUrl> {
    return this.getEffectiveUrls(this._goldenVersionEntity);
  }

  /**
   * Gets effective tags for a specific version (base tags + version's additional tags).
   * @param version - The version to get tags for (defaults to golden version)
   */
  public getEffectiveTags(version?: Confections.AnyConfectionVersionEntity): ReadonlyArray<string> {
    const targetVersion = version ?? this._goldenVersionEntity;
    const baseTags = this._confection.tags ?? [];
    const versionTags = targetVersion.additionalTags ?? [];
    // Deduplicate while preserving order (base first)
    return [...new Set([...baseTags, ...versionTags])];
  }

  /**
   * Gets effective URLs for a specific version (base URLs + version's additional URLs).
   * @param version - The version to get URLs for (defaults to golden version)
   */
  public getEffectiveUrls(
    version?: Confections.AnyConfectionVersionEntity
  ): ReadonlyArray<CommonModel.ICategorizedUrl> {
    const targetVersion = version ?? this._goldenVersionEntity;
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
  public isMoldedBonBon(): this is MoldedBonBon {
    return Confections.isMoldedBonBonEntity(this._confection);
  }

  /**
   * Returns true if this is a bar truffle confection.
   */
  public isBarTruffle(): this is BarTruffle {
    return Confections.isBarTruffleEntity(this._confection);
  }

  /**
   * Returns true if this is a rolled truffle confection.
   */
  public isRolledTruffle(): this is RolledTruffle {
    return Confections.isRolledTruffleEntity(this._confection);
  }

  /**
   * Gets the underlying confection data entity (read-only)
   */
  public abstract get entity(): Confections.AnyConfectionEntity;
}
