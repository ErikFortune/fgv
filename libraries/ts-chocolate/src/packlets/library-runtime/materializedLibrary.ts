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
 * MaterializedLibrary - a read-only library providing lazily-materialized, cached runtime objects
 * @packageDocumentation
 */

import { Collections, DetailedResult, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { Helpers, Model } from '../common';
import { IFindOptions } from './indexers';
import { IFindOrchestrator } from './validatingLibrary';

/**
 * Result of resolving an IIdsWithPreferred to materialized objects.
 * @public
 */
export interface IResolvedWithAlternates<TMaterialized, TSpec> {
  /** The primary/preferred materialized item */
  readonly primary: TMaterialized;
  /** All alternate materialized items (excluding primary) */
  readonly alternates: ReadonlyArray<TMaterialized>;
  /** The original specification entity */
  readonly entity: TSpec;
}

/**
 * Result of resolving an IOptionsWithPreferred (with notes) to materialized objects.
 * @public
 */
export interface IResolvedRefWithAlternates<TId extends string, TMaterialized> {
  /** The primary/preferred materialized item */
  readonly primary: TMaterialized;
  /** The ID of the primary item */
  readonly primaryId: TId;
  /** Notes associated with the primary reference, if any */
  readonly primaryNotes?: ReadonlyArray<Model.ICategorizedNote>;
  /** All alternate materialized items with their metadata */
  readonly alternates: ReadonlyArray<{
    readonly id: TId;
    readonly item: TMaterialized;
    readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
  }>;
}

/**
 * Parameters for constructing a MaterializedLibrary.
 * @public
 */
export interface IMaterializedLibraryParams<TId extends string, TEntity, TMaterialized, TQuerySpec = never> {
  /**
   * The underlying data library (SubLibraryBase or similar).
   */
  inner: Collections.IReadOnlyResultMap<TId, TEntity>;

  /**
   * Converter function: (entity, id) =\> Result\<TMaterialized\>
   */
  converter: (entity: TEntity, id: TId) => Result<TMaterialized>;

  /**
   * Optional orchestrator for find/query support.
   */
  orchestrator?: IFindOrchestrator<TMaterialized, TQuerySpec>;

  /**
   * Optional logger for conversion warnings.
   */
  logger?: Logging.ILogger;

  /**
   * Error handling behavior for conversion failures during iteration.
   * Defaults to `'warn'` for chocolate libraries.
   */
  onConversionError?: Collections.ConversionErrorHandling;
}

/**
 * A read-only library providing lazily-materialized, cached runtime objects.
 * Wraps a data-layer library and converts entities to materialized objects on demand.
 *
 * @typeParam TId - The ID type (branded string)
 * @typeParam TEntity - The data-layer entity type
 * @typeParam TMaterialized - The materialized runtime object type
 * @typeParam TQuerySpec - The query specification type (for find support)
 *
 * @public
 */
export class MaterializedLibrary<
  TId extends string,
  TEntity,
  TMaterialized,
  TQuerySpec = never
> extends Collections.ReadOnlyConvertingResultMap<TId, TEntity, TMaterialized> {
  private readonly _orchestrator?: IFindOrchestrator<TMaterialized, TQuerySpec>;

  /**
   * Creates a new MaterializedLibrary.
   * @param params - Parameters including inner library, converter, and optional orchestrator
   */
  public constructor(params: IMaterializedLibraryParams<TId, TEntity, TMaterialized, TQuerySpec>) {
    super({
      inner: params.inner,
      converter: params.converter,
      /* c8 ignore next 1 - defensive: onConversionError defaults to 'warn' */
      onConversionError: params.onConversionError ?? 'warn',
      logger: params.logger
    });
    this._orchestrator = params.orchestrator;
  }

  /**
   * Finds materialized objects matching a query specification.
   * @param spec - Query specification
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching materialized objects
   */
  public find(spec: TQuerySpec, options?: IFindOptions): Result<ReadonlyArray<TMaterialized>> {
    if (!this._orchestrator) {
      return fail('Find not supported on this library');
    }
    return this._orchestrator.find(spec, options);
  }

  /**
   * Whether find is supported on this library.
   */
  public get hasFindSupport(): boolean {
    return this._orchestrator !== undefined;
  }

  // ============================================================================
  // IIdsWithPreferred Resolution Helpers
  // ============================================================================

  /**
   * Gets the preferred (or first) materialized item from an IIdsWithPreferred.
   * @param spec - The IIdsWithPreferred specification
   * @returns DetailedResult with the preferred materialized item
   */
  public getPreferred(
    spec: Model.IIdsWithPreferred<TId>
  ): DetailedResult<TMaterialized, Collections.ResultMapResultDetail> {
    const primaryId = spec.preferredId ?? spec.ids[0];
    if (!primaryId) {
      return fail('No IDs provided in specification') as DetailedResult<
        TMaterialized,
        Collections.ResultMapResultDetail
      >;
    }
    return this.get(primaryId);
  }

  /**
   * Gets the preferred item and all alternates from an IIdsWithPreferred.
   * Returns a structured result with the primary item, alternates array, and original entity.
   *
   * @param spec - The IIdsWithPreferred specification
   * @returns Result with resolved primary, alternates, and entity
   */
  public getWithAlternates(
    spec: Model.IIdsWithPreferred<TId>
  ): Result<IResolvedWithAlternates<TMaterialized, Model.IIdsWithPreferred<TId>>> {
    const primaryId = spec.preferredId ?? spec.ids[0];
    if (!primaryId) {
      return fail('No IDs provided in specification');
    }

    return this.get(primaryId)
      .asResult.withErrorFormat((msg) => `Failed to resolve primary item ${primaryId}: ${msg}`)
      .onSuccess((primary) => {
        const alternates: TMaterialized[] = [];
        for (const id of spec.ids) {
          if (id !== primaryId) {
            const altResult = this.get(id);
            if (altResult.isSuccess()) {
              alternates.push(altResult.value);
            }
          }
        }

        return succeed({
          primary,
          alternates,
          entity: spec
        });
      });
  }

  /**
   * Gets the preferred (or first) materialized item from an IOptionsWithPreferred<IRefWithNotes>.
   * Only materializes the primary item - more efficient when alternates aren't needed.
   *
   * @param spec - The IOptionsWithPreferred specification with refs
   * @returns Result with the preferred materialized item and its notes
   */
  public getPreferredRef(spec: Model.IOptionsWithPreferred<Model.IRefWithNotes<TId>, TId>): Result<{
    readonly item: TMaterialized;
    readonly id: TId;
    readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
  }> {
    const primaryId = Helpers.getPreferredOptionIdOrFirst(spec);
    if (!primaryId) {
      return fail('No options provided in specification');
    }

    const primaryRef = Helpers.findById(primaryId, spec.options);
    if (!primaryRef) {
      return fail(`Preferred ID ${primaryId} not found in options`);
    }

    return this.get(primaryId)
      .asResult.withErrorFormat((msg) => `Failed to resolve item ${primaryId}: ${msg}`)
      .onSuccess((item) =>
        succeed({
          item,
          id: primaryId,
          notes: primaryRef.notes
        })
      );
  }

  /**
   * Gets the preferred item and all alternates from an IOptionsWithPreferred containing IRefWithNotes.
   * Preserves notes from each reference.
   *
   * @param spec - The IOptionsWithPreferred specification with refs containing notes
   * @returns Result with resolved primary and alternates with their notes
   */
  public getRefsWithAlternates(
    spec: Model.IOptionsWithPreferred<Model.IRefWithNotes<TId>, TId>
  ): Result<IResolvedRefWithAlternates<TId, TMaterialized>> {
    const primaryId = Helpers.getPreferredOptionIdOrFirst(spec);
    if (!primaryId) {
      return fail('No options provided in specification');
    }

    const primaryRef = Helpers.findById(primaryId, spec.options);
    if (!primaryRef) {
      return fail(`Preferred ID ${primaryId} not found in options`);
    }

    return this.get(primaryId)
      .asResult.withErrorFormat((msg) => `Failed to resolve primary item ${primaryId}: ${msg}`)
      .onSuccess((primary) => {
        const alternates: Array<{
          readonly id: TId;
          readonly item: TMaterialized;
          readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
        }> = [];

        for (const ref of spec.options) {
          if (ref.id !== primaryId) {
            const altResult = this.get(ref.id);
            if (altResult.isSuccess()) {
              alternates.push({
                id: ref.id,
                item: altResult.value,
                notes: ref.notes
              });
            }
          }
        }

        return succeed({
          primary,
          primaryId,
          primaryNotes: primaryRef.notes,
          alternates
        });
      });
  }

  /**
   * Clears all cached materialized objects.
   *
   * Call this after the underlying entity data has been mutated so that
   * subsequent `get()` calls re-materialize from the current entity state.
   */
  public clearCache(): void {
    this._clearCache();
  }

  /**
   * Clears a single cached materialized object by ID.
   *
   * More targeted than {@link MaterializedLibrary.clearCache | clearCache()}: only
   * evicts the specified entry, leaving all other cached objects intact.
   *
   * @param id - The composite ID of the entry to evict
   */
  public clearCacheEntry(id: TId): void {
    this._clearCacheEntry(id);
  }
}
