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
 * RuntimeConfectionVersionBase - abstract base class for runtime confection versions
 * @packageDocumentation
 */

import {
  ConfectionId,
  ConfectionVersionSpec,
  ICategorizedUrl,
  IOptionsWithPreferred,
  ProcedureId
} from '../../../common';
import {
  AnyConfectionVersion,
  IConfectionDecoration,
  IConfectionYield,
  isBarTruffleVersion,
  isMoldedBonBonVersion,
  isRolledTruffleVersion
} from '../../../entities';
import {
  IConfectionContext,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IRuntimeConfection,
  IRuntimeConfectionVersionBase
} from '../../model';

// Forward declarations to avoid circular imports
import type { RuntimeMoldedBonBonVersion } from './runtimeMoldedBonBonVersion';
import type { RuntimeBarTruffleVersion } from './runtimeBarTruffleVersion';
import type { RuntimeRolledTruffleVersion } from './runtimeRolledTruffleVersion';

// ============================================================================
// RuntimeConfectionVersionBase Abstract Class
// ============================================================================

/**
 * Abstract base class for runtime confection versions.
 * Provides common properties and resolution logic shared by all confection version types.
 * @public
 */
export abstract class RuntimeConfectionVersionBase implements IRuntimeConfectionVersionBase {
  protected readonly _context: IConfectionContext;
  protected readonly _confectionId: ConfectionId;
  protected readonly _version: AnyConfectionVersion;

  // Lazy-resolved caches (undefined = not yet resolved, null = no data)
  private _confection: IRuntimeConfection | undefined;
  private _resolvedFillings: ReadonlyArray<IResolvedFillingSlot> | undefined | null;
  private _resolvedProcedures:
    | IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined
    | null;

  /**
   * Creates a RuntimeConfectionVersionBase.
   * @param context - The runtime context for navigation
   * @param confectionId - The parent confection ID
   * @param version - The version data
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: AnyConfectionVersion
  ) {
    this._context = context;
    this._confectionId = confectionId;
    this._version = version;
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * Version specifier for this version.
   */
  public get versionSpec(): ConfectionVersionSpec {
    return this._version.versionSpec;
  }

  /**
   * Date this version was created (ISO 8601 format).
   */
  public get createdDate(): string {
    return this._version.createdDate;
  }

  /**
   * The parent confection ID.
   */
  public get confectionId(): ConfectionId {
    return this._confectionId;
  }

  /**
   * The parent confection - resolved.
   * Enables navigation: `version.confection.name`
   */
  public get confection(): IRuntimeConfection {
    if (this._confection === undefined) {
      // orThrow is safe - version was created from a valid confection
      this._confection = this._context.getRuntimeConfection(this._confectionId).value;
    }
    return this._confection!;
  }

  /**
   * The runtime context for navigation and resource resolution.
   * Used by editing sessions to access library resources.
   */
  public get context(): IConfectionContext {
    return this._context;
  }

  /**
   * The underlying confection version.
   * Use this to get the raw version data for persistence or journaling.
   */
  public get version(): AnyConfectionVersion {
    return this._version;
  }

  // ============================================================================
  // Version Properties
  // ============================================================================

  /**
   * Yield specification for this version.
   */
  public get yield(): IConfectionYield {
    return this._version.yield;
  }

  /**
   * Optional decorations for this version.
   */
  public get decorations(): ReadonlyArray<IConfectionDecoration> | undefined {
    return this._version.decorations;
  }

  /**
   * Optional notes about this version.
   */
  public get notes(): string | undefined {
    return this._version.notes;
  }

  // ============================================================================
  // Resolved References (lazy)
  // ============================================================================

  /**
   * Resolved filling slots for this version.
   * Undefined if the version has no fillings.
   */
  public get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined {
    if (this._resolvedFillings === undefined) {
      this._resolvedFillings = this._context.resolveFillingSlots(this._version.fillings) ?? null;
    }
    return this._resolvedFillings ?? undefined;
  }

  /**
   * Resolved procedures for this version.
   * Undefined if the version has no procedures.
   */
  public get procedures(): IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined {
    if (this._resolvedProcedures === undefined) {
      this._resolvedProcedures = this._context.resolveProcedures(this._version.procedures) ?? null;
    }
    return this._resolvedProcedures ?? undefined;
  }

  // ============================================================================
  // Effective Tags/URLs
  // ============================================================================

  /**
   * Effective tags for this version (base confection tags + version's additional tags).
   */
  public get effectiveTags(): ReadonlyArray<string> {
    const baseTags = this.confection.tags ?? [];
    const versionTags = this._version.additionalTags ?? [];
    // Deduplicate while preserving order (base first)
    return [...new Set([...baseTags, ...versionTags])];
  }

  /**
   * Effective URLs for this version (base confection URLs + version's additional URLs).
   */
  public get effectiveUrls(): ReadonlyArray<ICategorizedUrl> {
    const baseUrls = this.confection.urls ?? [];
    const versionUrls = this._version.additionalUrls ?? [];
    return [...baseUrls, ...versionUrls];
  }

  // ============================================================================
  // Type Guards
  // ============================================================================

  /**
   * Returns true if this is a molded bonbon version.
   */
  public isMoldedBonBonVersion(): this is RuntimeMoldedBonBonVersion {
    return isMoldedBonBonVersion(this._version);
  }

  /**
   * Returns true if this is a bar truffle version.
   */
  public isBarTruffleVersion(): this is RuntimeBarTruffleVersion {
    return isBarTruffleVersion(this._version);
  }

  /**
   * Returns true if this is a rolled truffle version.
   */
  public isRolledTruffleVersion(): this is RuntimeRolledTruffleVersion {
    return isRolledTruffleVersion(this._version);
  }

  // ============================================================================
  // Raw Access - must be overridden by subclasses to return typed data
  // ============================================================================

  /**
   * Gets the underlying raw version data (read-only)
   */
  public abstract get raw(): AnyConfectionVersion;
}
