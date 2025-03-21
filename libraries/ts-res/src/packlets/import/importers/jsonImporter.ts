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

import { captureResult, DetailedResult, failWithDetail, Result, succeed } from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { IImporter, ImporterResultDetail } from './importer';
import { ResourceManager } from '../../resources';
import { IImportable, isImportable } from '../importable';
import * as ResourceJson from '../../resource-json';

/**
 * {@link Import.Importers.IImporter | Importer} implementation which imports resources from a JSON object.
 * @public
 */
export class JsonImporter implements IImporter {
  /**
   * {@inheritdoc Import.Importers.IImporter.types}
   */
  public readonly types: ReadonlyArray<string> = ['json'];

  /**
   * Protected {@link Import.Importers.JsonImporter | JsonImporter} constructor for derived classes.
   */
  protected constructor() {}

  /**
   * Creates a new {@link Import.Importers.JsonImporter | JsonImporter} instance.
   * @returns `Success` with the new {@link Import.Importers.JsonImporter | JsonImporter} if successful,
   * `Failure` otherwise.
   */
  public static create(): Result<JsonImporter> {
    return captureResult(() => new JsonImporter());
  }

  /**
   * {@inheritdoc Import.Importers.IImporter.import}
   */
  public import(
    item: IImportable,
    manager: ResourceManager
  ): DetailedResult<IImportable[], ImporterResultDetail> {
    if (!isImportable(item) || item.type !== 'json') {
      /* c8 ignore next 1 - defense in depth */
      const name = item.context?.baseId ?? 'unknown';
      return failWithDetail(`${name}: not a valid JSON importable (${item.type})`, 'skipped');
    }
    const items: IImportable[] = [];
    return JsonConverters.jsonObject
      .convert(item.json)
      .onSuccess((json) => {
        /* c8 ignore next 2 - defense in depth */
        const id = item.context?.baseId ?? '';
        const conditions = item.context?.conditions;
        const candidate: ResourceJson.Json.ILooseResourceCandidateDecl = { id, conditions, json };
        return manager.addCandidate(candidate);
      })
      .onSuccess(() => {
        return succeed(items);
      })
      .withDetail('failed', 'consumed');
  }
}
