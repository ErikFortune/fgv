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
  ID_SEPARATOR,
  SourceId
} from '../../common';
import {
  ConfectionData,
  IConfectionDecoration,
  IConfectionProcedureRef,
  IConfectionVersion,
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
  protected readonly _goldenVersion: IConfectionVersion;

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
  // Core Properties (passthrough to underlying Confection)
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
   * Optional decorations
   */
  public get decorations(): ReadonlyArray<IConfectionDecoration> | undefined {
    return this._confection.decorations;
  }

  /**
   * Tags for searching/filtering
   */
  public get tags(): ReadonlyArray<string> | undefined {
    return this._confection.tags;
  }

  /**
   * Yield specification
   */
  public get yield(): IConfectionYield {
    return this._confection.yield;
  }

  /**
   * Optional filling slots
   */
  public get fillings(): ReadonlyArray<IFillingSlot> | undefined {
    return this._confection.fillings;
  }

  /**
   * Optional procedures with preferred selection
   */
  public get confectionProcedures(): IOptionsWithPreferred<IConfectionProcedureRef, ProcedureId> | undefined {
    return this._confection.confectionProcedures;
  }

  /**
   * The ID of the golden (approved default) version
   */
  public get goldenVersionSpec(): ConfectionVersionSpec {
    return this._confection.goldenVersionSpec;
  }

  // ============================================================================
  // Version Navigation
  // ============================================================================

  /**
   * The golden (default) version
   */
  public get goldenVersion(): IConfectionVersion {
    return this._goldenVersion;
  }

  /**
   * All versions
   */
  public get versions(): ReadonlyArray<IConfectionVersion> {
    return this._confection.versions;
  }

  /**
   * Gets a specific version by version specifier
   * @param versionSpec - The version specifier to find
   * @returns Success with version, or Failure if not found
   */
  public getVersion(versionSpec: ConfectionVersionSpec): Result<IConfectionVersion> {
    const version = this._confection.versions.find((v) => v.versionSpec === versionSpec);
    if (!version) {
      return Failure.with(`Version ${versionSpec} not found in confection ${this._id}`);
    }
    return Success.with(version);
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
