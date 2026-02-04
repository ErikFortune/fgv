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
 * BarTruffle - concrete bar truffle confection implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, ConfectionVersionSpec, Model as CommonModel, ProcedureId } from '../../common';
import { Confections } from '../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedFillingSlot,
  IBarTruffle,
  IBarTruffleVersion,
  IResolvedConfectionProcedure
} from '../model';
import { ConfectionBase } from './confectionBase';
import { BarTruffleVersion } from './versions';

// ============================================================================
// BarTruffle Class
// ============================================================================

/**
 * A resolved view of a bar truffle confection with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class BarTruffle extends ConfectionBase implements IBarTruffle {
  private readonly _barTruffle: Confections.IBarTruffleEntity;

  /**
   * Creates a BarTruffle.
   * Use Confection.create() or BarTruffle.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.IBarTruffleEntity
  ) {
    super(context, id, confection);
    this._barTruffle = confection;
  }

  /**
   * Factory method for creating a BarTruffle.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The bar truffle data
   * @returns Success with BarTruffle
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.IBarTruffleEntity
  ): Result<BarTruffle> {
    return Success.with(new BarTruffle(context, id, confection));
  }

  // ============================================================================
  // Confection Type Override
  // ============================================================================

  /**
   * Confection type is always 'bar-truffle' for this type
   */
  public get confectionType(): 'bar-truffle' {
    return 'bar-truffle';
  }

  // ============================================================================
  // Version Access (typed)
  // ============================================================================

  /**
   * Golden version typed as IBarTruffleVersion.
   */
  public override get goldenVersion(): IBarTruffleVersion {
    return super.goldenVersion as IBarTruffleVersion;
  }

  /**
   * All versions typed as IBarTruffleVersion.
   */
  public override get versions(): ReadonlyArray<IBarTruffleVersion> {
    return super.versions as ReadonlyArray<IBarTruffleVersion>;
  }

  /**
   * Gets a specific version by version specifier.
   * @param versionSpec - The version specifier to find
   * @returns Success with typed  version, or Failure if not found
   */
  public override getVersion(versionSpec: ConfectionVersionSpec): Result<IBarTruffleVersion> {
    return super.getVersion(versionSpec) as Result<IBarTruffleVersion>;
  }

  /**
   * Creates a runtime version from a data layer entity
   * @param entity - The data layer entity
   * @returns The new {@link LibraryRuntime.BarTruffle | BarTruffle}.
   * @internal
   */
  protected override _createVersion(entity: Confections.AnyConfectionVersionEntity): IBarTruffleVersion {
    return BarTruffleVersion.create(
      this._context,
      this._id,
      entity as Confections.IBarTruffleVersionEntity
    ).orThrow();
  }

  // ============================================================================
  // Bar Truffle-Specific Properties (delegate to golden version)
  // ============================================================================

  /**
   * Frame dimensions for ganache slab (from golden version).
   */
  public get frameDimensions(): Confections.IFrameDimensions {
    return this.goldenVersion.frameDimensions;
  }

  /**
   * Single bonbon dimensions for cutting (from golden version).
   */
  public get singleBonBonDimensions(): Confections.IBonBonDimensions {
    return this.goldenVersion.singleBonBonDimensions;
  }

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
   * Resolved enrobing chocolate specification (from golden version, optional).
   */
  public get enrobingChocolate(): IResolvedChocolateSpec | undefined {
    return this.goldenVersion.enrobingChocolate;
  }

  /**
   * Gets the underlying raw bar truffle data
   */
  public get entity(): Confections.IBarTruffleEntity {
    return this._barTruffle;
  }
}
