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
import { Confections } from '../../entities';
import {
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IMoldedBonBon,
  IMoldedBonBonVersion
} from '../model';
import { ConfectionBase } from './confectionBase';
import { MoldedBonBonVersion } from './versions';

// ============================================================================
// RuntimeMoldedBonBon Class
// ============================================================================

/**
 * A resolved view of a molded bonbon confection with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class MoldedBonBon extends ConfectionBase implements IMoldedBonBon {
  private readonly _moldedBonBon: Confections.IMoldedBonBonEntity;

  /**
   * Creates a MoldedBonBon.
   * Use Confection.create() or MoldedBonBon.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.IMoldedBonBonEntity
  ) {
    super(context, id, confection);
    this._moldedBonBon = confection;
  }

  /**
   * Factory method for creating a MoldedBonBon.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The molded bonbon data
   * @returns Success with MoldedBonBon
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.IMoldedBonBonEntity
  ): Result<MoldedBonBon> {
    return Success.with(new MoldedBonBon(context, id, confection));
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
   * Golden version typed as IMoldedBonBonVersion.
   */
  public override get goldenVersion(): IMoldedBonBonVersion {
    return super.goldenVersion as IMoldedBonBonVersion;
  }

  /**
   * All versions typed as IMoldedBonBonVersion.
   */
  public override get versions(): ReadonlyArray<IMoldedBonBonVersion> {
    return super.versions as ReadonlyArray<IMoldedBonBonVersion>;
  }

  /**
   * Gets a specific version by version specifier.
   * @param versionSpec - The version specifier to find
   * @returns Success with typed runtime version, or Failure if not found
   */
  public override getVersion(versionSpec: ConfectionVersionSpec): Result<IMoldedBonBonVersion> {
    return super.getVersion(versionSpec) as Result<IMoldedBonBonVersion>;
  }

  /**
   * Creates a runtime version from a data layer entity.
   * @param entity - The data layer entity
   * @returns The runtime version
   * @internal
   */
  protected override _createVersion(entity: Confections.AnyConfectionVersionEntity): IMoldedBonBonVersion {
    return MoldedBonBonVersion.create(
      this._context,
      this._id,
      entity as Confections.IMoldedBonBonVersionEntity
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

  /**
   * Gets the underlying molded bonbon data entity
   */
  public get entity(): Confections.IMoldedBonBonEntity {
    return this._moldedBonBon;
  }
}
