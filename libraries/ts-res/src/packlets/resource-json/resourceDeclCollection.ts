/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { captureResult, mapResults, MessageAggregator, Result, succeed } from '@fgv/ts-utils';
import { IResourceDeclContainer } from './resourceDeclContainer';
import * as Convert from './convert';
import * as Normalized from './normalized';
import * as Json from './json';
import { mergeContextDecl, mergeLooseCandidate, mergeLooseResource } from './helpers';

/**
 * Class that extracts resources and candidates from a
 * {@link ResourceJson.Json.IResourceCollectionDecl | resource collection declaration}.
 * @public
 */
export class ResourceDeclCollection implements IResourceDeclContainer {
  /**
   * The {@link ResourceJson.Normalized.IResourceCollectionDecl | resource collection declaration}
   * being processed.
   */
  public readonly collection: Normalized.IResourceCollectionDecl;

  /**
   * {@inheritdoc ResourceJson.IResourceDeclContainer.context}
   */
  public get context(): Normalized.IResourceContextDecl | undefined {
    return this.collection.context;
  }

  protected _resources: Normalized.ILooseResourceDecl[] = [];
  protected _candidates: Normalized.ILooseResourceCandidateDecl[] = [];

  protected constructor(collection: Normalized.IResourceCollectionDecl) {
    this.collection = collection;
    this._extract(collection).orThrow();
  }

  /**
   * Creates a new {@link ResourceJson.ResourceDeclCollection | ResourceDeclCollection} from an
   * untyped {@link ResourceJson.Json.IResourceCollectionDecl | resource collection declaration}.
   * @param from - The JSON object to convert.
   * @returns `Success` with the new collection if the JSON object is valid, otherwise `Failure`.
   */
  public static create(from: unknown): Result<ResourceDeclCollection> {
    return Convert.resourceCollectionDecl
      .convert(from)
      .withErrorFormat((err) => `Invalid resource collection: ${err}`)
      .onSuccess((decl) => {
        return captureResult(() => new ResourceDeclCollection(decl));
      });
  }

  /**
   * Gets the loose resources extracted from the collection.
   * @returns The {@link ResourceJson.Normalized.ILooseResourceDecl | loose resource declarations}
   * extracted from the collection.
   */
  public getLooseResources(): ReadonlyArray<Normalized.ILooseResourceDecl> {
    return this._resources;
  }

  /**
   * Gets the loose candidates extracted from the collection.
   * @returns The {@link ResourceJson.Normalized.ILooseResourceCandidateDecl | loose resource candidate declarations}
   * extracted from the collection.
   */
  public getLooseCandidates(): ReadonlyArray<Normalized.ILooseResourceCandidateDecl> {
    return this._candidates;
  }

  private _extract(
    collection: Normalized.IResourceCollectionDecl,
    parentName?: string,
    parentConditions?: ReadonlyArray<Json.ILooseConditionDecl>
  ): Result<this> {
    const errors: MessageAggregator = new MessageAggregator();
    return mergeContextDecl(collection.context, parentName, parentConditions).onSuccess(
      ({ baseId: baseName, conditions: baseConditions }) => {
        const mergedCandidates =
          collection.candidates?.map((candidate) =>
            mergeLooseCandidate(candidate, baseName, baseConditions)
          ) ?? [];
        this._candidates.push(...mapResults(mergedCandidates).aggregateError(errors).orDefault([]));

        const mergedResources =
          collection.resources?.map((resource) => mergeLooseResource(resource, baseName, baseConditions)) ??
          [];
        this._resources.push(...mapResults(mergedResources).aggregateError(errors).orDefault([]));

        collection.collections?.forEach((subCollection) => {
          this._extract(subCollection, baseName, baseConditions).aggregateError(errors);
        });
        return errors.returnOrReport(succeed(this));
      }
    );
  }
}
