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
import { Helpers as CommonHelpers } from '../common';
import { mergeChildResource } from './helpers';

/**
 * Class that extracts resources and candidates from a
 * {@link ResourceJson.Json.IResourceTreeRootDecl | resource tree root}.
 * @public
 */
export class ResourceDeclTree implements IResourceDeclContainer {
  /**
   * The {@link ResourceJson.Normalized.IResourceTreeRootDecl | resource tree root declaration}
   * being processed.
   */
  public readonly tree: Normalized.IResourceTreeRootDecl;

  protected _resources: Normalized.ILooseResourceDecl[] = [];
  protected _candidates: Normalized.ILooseResourceCandidateDecl[] = [];

  protected constructor(tree: Normalized.IResourceTreeRootDecl) {
    this.tree = tree;
    const id = tree.context?.id;
    const conditions = tree.context?.conditions;
    this._extract(tree, id, conditions).orThrow();
  }

  /**
   * Creates a new {@link ResourceJson.ResourceDeclTree | ResourceDeclTree} from an
   * untyped {@link ResourceJson.Json.IResourceTreeRootDecl | resource tree root declaration}.
   * @param from - The JSON object to convert.
   * @returns `Success` with the new tree if the JSON object is valid, otherwise `Failure`.
   */
  public static create(from: unknown): Result<ResourceDeclTree> {
    return Convert.resourceTreeRootDecl
      .convert(from)
      .withErrorFormat((err) => `Invalid resource tree: ${err}`)
      .onSuccess((decl) => {
        return captureResult(() => new ResourceDeclTree(decl));
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
    node: Normalized.IResourceTreeChildNodeDecl,
    parentName?: string,
    parentConditions?: ReadonlyArray<Json.ILooseConditionDecl>
  ): Result<this> {
    const errors: MessageAggregator = new MessageAggregator();

    const resourceEntries = Array.from(Object.entries(node.resources ?? {}));
    const mergedResources = resourceEntries.map(([name, resource]) =>
      mergeChildResource(resource, name, parentName, parentConditions)
    );
    this._resources.push(...mapResults(mergedResources).aggregateError(errors).orDefault([]));

    const children = Array.from(Object.entries(node.children ?? {}));
    children.forEach(([name, childNode]) => {
      CommonHelpers.joinResourceIds(parentName, name)
        .onSuccess((childName) => {
          return this._extract(childNode, childName, parentConditions).aggregateError(errors);
        })
        .aggregateError(errors);
    });
    return errors.returnOrReport(succeed(this));
  }
}
