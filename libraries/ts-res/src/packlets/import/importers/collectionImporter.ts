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

import {
  captureResult,
  DetailedResult,
  failWithDetail,
  MessageAggregator,
  Result,
  succeed
} from '@fgv/ts-utils';
import { ResourceBuilder, ResourceCandidate, ResourceManagerBuilder } from '../../resources';
import { IImportable, isImportable } from '../importable';
import { IImporter, ImporterResultDetail } from './importer';
import * as ResourceJson from '../../resource-json';
import { ImportContext } from '../importContext';

/**
 * {@link Import.Importers.IImporter | Importer} implementation which imports
 * a {@link ResourceJson.ResourceDeclCollection | resource collection} or
 * {@link ResourceJson.ResourceDeclTree | resource tree} from an importable item.
 * @public
 */
export class CollectionImporter implements IImporter {
  /**
   * {@inheritdoc Import.Importers.IImporter.types}
   */
  public readonly types: string[] = ['resourceCollection', 'resourceTree'];

  /**
   * Protected {@link Import.Importers.CollectionImporter | CollectionImporter} constructor for derived classes
   */
  protected constructor() {}

  /**
   * Creates a new {@link Import.Importers.CollectionImporter | CollectionImporter} instance.
   * @returns `Success` with the new {@link Import.Importers.CollectionImporter | CollectionImporter} if successful,
   * `Failure` otherwise.
   */
  public static create(): Result<CollectionImporter> {
    return captureResult(() => new CollectionImporter());
  }

  /**
   * {@inheritdoc Import.Importers.IImporter.import}
   */
  public import(
    item: IImportable,
    manager: ResourceManagerBuilder
  ): DetailedResult<IImportable[], ImporterResultDetail> {
    if (!isImportable(item) || (item.type !== 'resourceCollection' && item.type !== 'resourceTree')) {
      /* c8 ignore next 1 - defense in depth */
      const name = item.context?.baseId ?? 'unknown';
      return failWithDetail(`${name}: not a valid resource collection importable (${item.type})`, 'skipped');
    }

    const container = item.type === 'resourceCollection' ? item.collection : item.tree;

    return ImportContext.forContainerImport(container.context, item.context)
      .onSuccess((context) => {
        const errors: MessageAggregator = new MessageAggregator();
        for (const resource of container.getImporterResources()) {
          this._addResource(manager, resource, context).aggregateError(errors);
        }

        for (const candidate of container.getImporterCandidates()) {
          this._addCandidate(manager, candidate, context).aggregateError(errors);
        }
        return errors.returnOrReport(succeed([]));
      })
      .withDetail('failed', 'consumed');
  }

  /**
   * Adds a {@link ResourceJson.Normalized.IImporterResourceDecl | declared resource} to
   * the supplied {@link Resources.ResourceManagerBuilder | resource manager builder}, merging an
   * optional {@link Import.ImportContext | import context} if provided.
   * @param manager - The {@link Resources.ResourceManagerBuilder | resource manager builder} to which
   * the resource will be added.
   * @param resource - The {@link ResourceJson.Normalized.IImporterResourceDecl | resource}
   * to add.
   * @param context - Optional {@link Import.ImportContext | import context} to merge
   * with the resource.
   * @returns `Success` with the {@link Resources.ResourceBuilder | resource builder}
   * for the resource if successful, `Failure` with an error message if not.
   */
  private _addResource(
    manager: ResourceManagerBuilder,
    resource: ResourceJson.Normalized.IImporterResourceDecl,
    context?: ImportContext
  ): Result<ResourceBuilder> {
    if (context) {
      return ResourceJson.Helpers.mergeLooseResource(resource, context.baseId, context.conditions).onSuccess(
        (merged) => manager.addResource(merged)
      );
    } else if (!ResourceJson.Json.isLooseResourceDecl(resource)) {
      return fail('cannot add child resource to manager');
    }
    return manager.addResource(resource);
  }

  /**
   * Adds a {@link ResourceJson.Normalized.IImporterResourceCandidateDecl | declared resource candidate}
   * to the supplied {@link Resources.ResourceManagerBuilder | resource manager builder}, merging an optional
   * {@link Import.ImportContext | import context} if provided.
   * @param manager - The {@link Resources.ResourceManagerBuilder | resource manager builder} to which the
   * candidate will be added.
   * @param candidate - The {@link ResourceJson.Normalized.IImporterResourceCandidateDecl | candidate}
   * to add.
   * @param context - Optional {@link Import.ImportContext | import context} to merge with the candidate.
   * @returns `Success` with the {@link Resources.ResourceCandidate | resource candidate} if successful,
   * `Failure` with an error message if not.
   */
  private _addCandidate(
    manager: ResourceManagerBuilder,
    candidate: ResourceJson.Normalized.IImporterResourceCandidateDecl,
    context?: ImportContext
  ): Result<ResourceCandidate> {
    if (context) {
      return ResourceJson.Helpers.mergeLooseCandidate(
        candidate,
        context.baseId,
        context.conditions
      ).onSuccess((merged) => manager.addLooseCandidate(merged));
    } else if (!ResourceJson.Json.isLooseResourceCandidateDecl(candidate)) {
      return fail('cannot add child resource candidate to manager');
    }
    return manager.addLooseCandidate(candidate);
  }
}
