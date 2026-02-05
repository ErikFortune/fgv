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
 * ConfectionVersionBase - abstract base class for runtime confection versions
 * @packageDocumentation
 */

import { Result, mapResults, succeed } from '@fgv/ts-utils';

import { ConfectionId, ConfectionVersionSpec, Model as CommonModel, ProcedureId } from '../../../common';
import { Confections } from '../../../entities';
import {
  IConfectionContext,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IResolvedFillingOption,
  IConfectionBase,
  IConfectionVersionBase
} from '../../model';

// Forward declarations to avoid circular imports
import type { MoldedBonBonVersion } from './moldedBonBonVersion';
import type { BarTruffleVersion } from './barTruffleVersion';
import type { RolledTruffleVersion } from './rolledTruffleVersion';

/**
 * Abstract base class for runtime confection versions.
 * Provides common properties and resolution logic shared by all confection version types.
 * @public
 */
export abstract class ConfectionVersionBase implements IConfectionVersionBase {
  protected readonly _context: IConfectionContext;
  protected readonly _confectionId: ConfectionId;
  protected readonly _version: Confections.AnyConfectionVersionEntity;

  // Lazy-resolved caches (undefined = not yet resolved)
  private _confection: IConfectionBase | undefined;
  private _resolvedFillings: ReadonlyArray<IResolvedFillingSlot> | undefined;
  private _resolvedProcedures:
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined;

  /**
   * Creates a ConfectionVersionBase.
   * @param context - The runtime context for navigation
   * @param confectionId - The parent confection ID
   * @param version - The version data
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: Confections.AnyConfectionVersionEntity
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
  public get confection(): IConfectionBase {
    if (this._confection === undefined) {
      // orThrow is safe - version was created from a valid confection
      this._confection = this._context.confections.get(this._confectionId).value;
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
   * Use this to get the version data entity for persistence or journaling.
   */
  public get version(): Confections.AnyConfectionVersionEntity {
    return this._version;
  }

  // ============================================================================
  // Version Properties
  // ============================================================================

  /**
   * Yield specification for this version.
   */
  public get yield(): Confections.IConfectionYield {
    return this._version.yield;
  }

  /**
   * Optional decorations for this version.
   */
  public get decorations(): ReadonlyArray<Confections.IConfectionDecoration> | undefined {
    return this._version.decorations;
  }

  /**
   * Optional categorized notes about this version.
   */
  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
    return this._version.notes;
  }

  // ============================================================================
  // Resolved References (lazy)
  // ============================================================================

  /**
   * Gets resolved filling slots for this version.
   * @returns Result with resolved fillings (empty array if none), or Failure if resolution fails
   * @public
   */
  public getFillings(): Result<ReadonlyArray<IResolvedFillingSlot>> {
    if (this._resolvedFillings === undefined) {
      const slots = this._version.fillings ?? [];
      return mapResults(slots.map((slot) => this._resolveFillingSlot(slot))).onSuccess((slots) => {
        this._resolvedFillings = slots;
        return succeed(slots);
      });
    }
    return succeed(this._resolvedFillings);
  }

  /**
   * Resolves a single filling slot.
   * @param slot - The filling slot to resolve
   * @returns Result with resolved filling slot, or Failure if resolution fails
   * @internal
   */
  private _resolveFillingSlot(slot: Confections.IFillingSlotEntity): Result<IResolvedFillingSlot> {
    return this._resolveFillingOptions(slot.filling)
      .withErrorFormat((msg) => `slot ${slot.name}: failed to resolve fillings: ${msg}`)
      .onSuccess((filling) =>
        succeed({
          slotId: slot.slotId,
          name: slot.name,
          filling
        })
      );
  }

  /**
   * Resolved filling slots for this version.
   * Undefined if the version has no fillings.
   * @throws if resolution fails - prefer getFillings() for proper error handling
   */
  public get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined {
    const result = this.getFillings().orThrow();
    return result.length > 0 ? result : undefined;
  }

  /**
   * Gets resolved procedures for this version.
   * @returns Result with resolved procedures (undefined if none), or Failure if resolution fails
   * @public
   */
  public getProcedures(): Result<
    CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined
  > {
    if (this._resolvedProcedures === undefined) {
      const procedures = this._version.procedures;
      if (!procedures || procedures.options.length === 0) {
        return succeed(undefined);
      }

      return this._context.procedures
        .getRefsWithAlternates(procedures)
        .withErrorFormat((msg) => `confection ${this._confectionId}: failed to resolve procedures: ${msg}`)
        .onSuccess((resolved) => {
          const options: IResolvedConfectionProcedure[] = [
            {
              id: resolved.primaryId,
              procedure: resolved.primary,
              notes: resolved.primaryNotes,
              entity: procedures.options.find((r) => r.id === resolved.primaryId)!
            },
            ...resolved.alternates.map((alt) => ({
              id: alt.id,
              procedure: alt.item,
              notes: alt.notes,
              entity: procedures.options.find((r) => r.id === alt.id)!
            }))
          ];
          this._resolvedProcedures = { options, preferredId: procedures.preferredId };
          return succeed(this._resolvedProcedures);
        });
    }
    return succeed(this._resolvedProcedures);
  }

  /**
   * Resolved procedures for this version.
   * Undefined if the version has no procedures.
   * @throws if resolution fails - prefer getProcedures() for proper error handling
   */
  public get procedures():
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined {
    return this.getProcedures().orThrow();
  }

  /**
   * Resolves filling options for a slot.
   * @internal
   */
  private _resolveFillingOptions(
    options: CommonModel.IOptionsWithPreferred<
      Confections.AnyFillingOptionEntity,
      Confections.FillingOptionId
    >
  ): Result<CommonModel.IOptionsWithPreferred<IResolvedFillingOption, Confections.FillingOptionId>> {
    return mapResults(options.options.map((opt) => this._resolveFillingOption(opt))).onSuccess((resolved) =>
      succeed({ options: resolved, preferredId: options.preferredId })
    );
  }

  /**
   * Resolves a single filling option (recipe or ingredient).
   * @internal
   */
  private _resolveFillingOption(opt: Confections.AnyFillingOptionEntity): Result<IResolvedFillingOption> {
    if (opt.type === 'recipe') {
      return this._context.fillings
        .get(opt.id)
        .asResult.withErrorFormat((msg) => `filling recipe '${opt.id}': ${msg}`)
        .onSuccess((filling) =>
          succeed({
            type: 'recipe' as const,
            id: opt.id,
            filling,
            notes: opt.notes,
            entity: opt
          })
        );
    } else {
      return this._context.ingredients
        .get(opt.id)
        .asResult.withErrorFormat((msg) => `filling ingredient '${opt.id}': ${msg}`)
        .onSuccess((ingredient) =>
          succeed({
            type: 'ingredient' as const,
            id: opt.id,
            ingredient,
            notes: opt.notes,
            entity: opt
          })
        );
    }
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
  public get effectiveUrls(): ReadonlyArray<CommonModel.ICategorizedUrl> {
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
  public isMoldedBonBonVersion(): this is MoldedBonBonVersion {
    return Confections.isMoldedBonBonVersionEntity(this._version);
  }

  /**
   * Returns true if this is a bar truffle version.
   */
  public isBarTruffleVersion(): this is BarTruffleVersion {
    return Confections.isBarTruffleVersionEntity(this._version);
  }

  /**
   * Returns true if this is a rolled truffle version.
   */
  public isRolledTruffleVersion(): this is RolledTruffleVersion {
    return Confections.isRolledTruffleVersionEntity(this._version);
  }

  /**
   * Gets the underlying version data entity (read-only)
   */
  public abstract get entity(): Confections.AnyConfectionVersionEntity;
}
