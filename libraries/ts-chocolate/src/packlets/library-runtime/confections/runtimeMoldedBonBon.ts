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
 * RuntimeMoldedBonBon - concrete molded bonbon confection implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, ConfectionVersionSpec, Model as CommonModel, MoldId, ProcedureId } from '../../common';
import { AnyConfectionVersion, IMoldedBonBon, IMoldedBonBonVersion } from '../../entities';
import {
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IRuntimeMoldedBonBon,
  IRuntimeMoldedBonBonVersion
} from '../model';
import { RuntimeConfectionBase } from './runtimeConfectionBase';
import { RuntimeMoldedBonBonVersion } from './versions';

// ============================================================================
// RuntimeMoldedBonBon Class
// ============================================================================

/**
 * A resolved view of a molded bonbon confection with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeMoldedBonBon extends RuntimeConfectionBase implements IRuntimeMoldedBonBon {
  private readonly _moldedBonBon: IMoldedBonBon;

  /**
   * Creates a RuntimeMoldedBonBon.
   * Use RuntimeConfection.create() or RuntimeMoldedBonBon.create() instead.
   * @internal
   */
  protected constructor(context: IConfectionContext, id: ConfectionId, confection: IMoldedBonBon) {
    super(context, id, confection);
    this._moldedBonBon = confection;
  }

  /**
   * Factory method for creating a RuntimeMoldedBonBon.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The molded bonbon data
   * @returns Success with RuntimeMoldedBonBon
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: IMoldedBonBon
  ): Result<RuntimeMoldedBonBon> {
    return Success.with(new RuntimeMoldedBonBon(context, id, confection));
  }

  // ============================================================================
  // Confection Type Override
  // ============================================================================

  /**
   * Confection type is always 'molded-bonbon' for this type
   */
  public get confectionType(): 'molded-bonbon' {
    return 'molded-bonbon';
  }

  // ============================================================================
  // Version Access (typed)
  // ============================================================================

  /**
   * Golden version typed as IRuntimeMoldedBonBonVersion.
   */
  public override get goldenVersion(): IRuntimeMoldedBonBonVersion {
    return super.goldenVersion as IRuntimeMoldedBonBonVersion;
  }

  /**
   * All versions typed as IRuntimeMoldedBonBonVersion.
   */
  public override get versions(): ReadonlyArray<IRuntimeMoldedBonBonVersion> {
    return super.versions as ReadonlyArray<IRuntimeMoldedBonBonVersion>;
  }

  /**
   * Gets a specific version by version specifier.
   * @param versionSpec - The version specifier to find
   * @returns Success with typed runtime version, or Failure if not found
   */
  public override getVersion(versionSpec: ConfectionVersionSpec): Result<IRuntimeMoldedBonBonVersion> {
    return super.getVersion(versionSpec) as Result<IRuntimeMoldedBonBonVersion>;
  }

  /**
   * Creates a runtime version from a raw version.
   * @param rawVersion - The raw version data
   * @returns The runtime version
   * @internal
   */
  protected override _createVersion(rawVersion: AnyConfectionVersion): IRuntimeMoldedBonBonVersion {
    return RuntimeMoldedBonBonVersion.create(
      this._context,
      this._id,
      rawVersion as IMoldedBonBonVersion
    ).orThrow();
  }

  // ============================================================================
  // Molded BonBon-Specific Properties (delegate to golden version)
  // ============================================================================

  /**
   * Resolved filling slots from the golden version.
   */
  public get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined {
    return this.goldenVersion.fillings;
  }

  /**
   * Resolved procedures from the golden version.
   */
  public get procedures():
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined {
    return this.goldenVersion.procedures;
  }

  /**
   * Resolved molds with preferred selection (from golden version).
   */
  public get molds(): CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    return this.goldenVersion.molds;
  }

  /**
   * Resolved shell chocolate specification (from golden version).
   */
  public get shellChocolate(): IResolvedChocolateSpec {
    return this.goldenVersion.shellChocolate;
  }

  /**
   * Resolved additional chocolates (from golden version).
   */
  public get additionalChocolates(): ReadonlyArray<IResolvedAdditionalChocolate> | undefined {
    return this.goldenVersion.additionalChocolates;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw molded bonbon data
   */
  public get raw(): IMoldedBonBon {
    return this._moldedBonBon;
  }
}
