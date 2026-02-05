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
 * RolledTruffleVersion - runtime version for rolled truffle confections
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, Helpers } from '../../../common';
import { Confections } from '../../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedCoatings,
  IResolvedCoatingOption,
  IResolvedConfectionProcedure,
  IRolledTruffle,
  IRolledTruffleVersion
} from '../../model';
import { ConfectionVersionBase } from './confectionVersionBase';

// ============================================================================
// RolledTruffleVersion Class
// ============================================================================

/**
 * A resolved view of a rolled truffle version with all references resolved.
 * @public
 */
export class RolledTruffleVersion extends ConfectionVersionBase implements IRolledTruffleVersion {
  private readonly _rolledTruffleVersion: Confections.IRolledTruffleVersionEntity;

  // Lazy-resolved caches (undefined = not yet resolved, null = no data)
  private _resolvedEnrobingChocolate: IResolvedChocolateSpec | undefined | null;
  private _resolvedCoatings: IResolvedCoatings | undefined | null;

  /**
   * Creates a RolledTruffleVersion.
   * Use RolledTruffleVersion.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: Confections.IRolledTruffleVersionEntity
  ) {
    super(context, confectionId, version);
    this._rolledTruffleVersion = version;
  }

  /**
   * Factory method for creating a RolledTruffleVersion.
   * @param context - The runtime context
   * @param confectionId - The parent confection ID
   * @param version - The rolled truffle version data
   * @returns Success with RolledTruffleVersion
   */
  public static create(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: Confections.IRolledTruffleVersionEntity
  ): Result<RolledTruffleVersion> {
    return Success.with(new RolledTruffleVersion(context, confectionId, version));
  }

  // ============================================================================
  // Parent Navigation (narrowed type)
  // ============================================================================

  /**
   * Parent confection narrowed to rolled truffle type.
   */
  public override get confection(): IRolledTruffle {
    return super.confection as IRolledTruffle;
  }

  // ============================================================================
  // Rolled Truffle-Specific Properties (lazy)
  // ============================================================================

  /**
   * Resolved enrobing chocolate specification (lazy-loaded).
   */
  public get enrobingChocolate(): IResolvedChocolateSpec | undefined {
    if (this._resolvedEnrobingChocolate === undefined) {
      const spec = this._rolledTruffleVersion.enrobingChocolate;
      if (!spec) {
        this._resolvedEnrobingChocolate = null;
      } else {
        const resolved = this._context.ingredients.getWithAlternates(spec);

        /* c8 ignore next 3 - defensive */
        if (resolved.isFailure() || !resolved.value.primary.isChocolate()) {
          throw new Error(`Failed to resolve enrobing chocolate for confection ${this._confectionId}`);
        }

        this._resolvedEnrobingChocolate = {
          chocolate: resolved.value.primary,
          alternates: resolved.value.alternates.filter((i) => i.isChocolate()),
          entity: spec
        };
      }
    }
    return this._resolvedEnrobingChocolate ?? undefined;
  }

  /**
   * Resolved coatings specification (lazy-loaded).
   */
  public get coatings(): IResolvedCoatings | undefined {
    if (this._resolvedCoatings === undefined) {
      const coatings = this._rolledTruffleVersion.coatings;
      if (!coatings) {
        this._resolvedCoatings = null;
      } else {
        const resolved = this._context.ingredients.getWithAlternates(coatings);
        if (resolved.isFailure()) {
          this._resolvedCoatings = null;
        } else {
          const primaryId = coatings.preferredId ?? coatings.ids[0];
          const resolvedOptions: IResolvedCoatingOption[] = [
            { id: primaryId, ingredient: resolved.value.primary },
            ...resolved.value.alternates.map((ingredient, idx) => ({
              id: coatings.ids.filter((id) => id !== primaryId)[idx],
              ingredient
            }))
          ];

          this._resolvedCoatings = {
            options: resolvedOptions,
            preferred: { id: primaryId, ingredient: resolved.value.primary },
            entity: coatings
          };
        }
      }
    }
    return this._resolvedCoatings ?? undefined;
  }

  /**
   * Gets the preferred procedure, falling back to first available.
   * @public
   */
  public get preferredProcedure(): IResolvedConfectionProcedure | undefined {
    return this.procedures ? Helpers.getPreferredOrFirst(this.procedures) : undefined;
  }

  /**
   * Gets the underlying rolled truffle version entity data.
   */
  public override get entity(): Confections.IRolledTruffleVersionEntity {
    return this._rolledTruffleVersion;
  }
}
