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

import { captureResult, MessageAggregator, Result, succeed } from '@fgv/ts-utils';
import { ResourceManager } from '../resources';
import { ImportContext } from './importContext';
import { IImportable, IImportablePath } from './importable';
import { FileTreeImporter } from './importers/fileTreeImporter';
import { IImporter, JsonImporter } from './importers';

/**
 * Parameters for creating an {@link  Import.ImportManager | ImportManager}.
 * @public
 */
export interface IImporterCreateParams {
  /**
   * The {@link Resources.ResourceManager | resource manager} into which resources
   * will be imported.
   */
  resources: ResourceManager;

  /**
   * An optional initial {@link Import.ImportContext | import context} for the import operation.
   */
  initialContext?: ImportContext;
}

/**
 * Class to manage the import of resources from various sources.
 * @public
 */
export class ImportManager {
  /**
   * The {@link Resources.ResourceManager | resource manager} into which resources
   * will be imported.
   */
  public readonly resources: ResourceManager;

  /**
   * The initial {@link Import.ImportContext | import context} for the import operation.
   */
  public initialContext: ImportContext;

  protected _stack: IImportable[] = [];
  protected _importers: IImporter[] = [];

  /**
   * Protected constructor for the {@link Import.ImportManager | ImportManager}.
   * @param params - Parameters for creating the {@link Import.ImportManager | ImportManager}.
   */
  protected constructor(params: IImporterCreateParams) {
    this.resources = params.resources;
    this.initialContext = params.initialContext ?? ImportContext.create().orThrow();
    this._importers = [
      FileTreeImporter.create({
        qualifiers: this.resources.qualifiers
      }).orThrow(),
      JsonImporter.create().orThrow()
    ];
  }

  /**
   * Factory method to create a new {@link Import.ImportManager | ImportManager}.
   * @param params - Parameters for creating the {@link Import.ImportManager | ImportManager}.
   * @returns `Success` with the new {@link Import.ImportManager | ImportManager}
   * if successful, or `Failure` with an error message if creation fails.
   */
  public static create(params: IImporterCreateParams): Result<ImportManager> {
    return captureResult(() => new ImportManager(params));
  }

  /**
   * Imports resources from a file system path.
   * @param filePath - The path to import resources from.
   * @returns `Success` with the {@link Import.ImportManager | ImportManager} if successful,
   * or `Failure` with an error message if the import fails.
   */
  public importFromFileSystem(filePath: string): Result<ImportManager> {
    const importable: IImportablePath = { type: 'path', path: filePath };
    this._stack.push(importable);
    return this._import();
  }

  /**
   * Imports any items on the import stack.
   * @returns `Success` with the {@link Import.ImportManager | ImportManager} if successful,
   * or `Failure` with an error message if the import fails.
   * @public
   */
  protected _import(): Result<ImportManager> {
    const errors: MessageAggregator = new MessageAggregator();

    while (this._stack.length > 0) {
      const item = this._stack.pop();
      if (item !== undefined) {
        let processed: boolean = false;
        for (const importer of this._importers) {
          const result = importer.import(item, this.resources).aggregateError(errors);
          if (result.isSuccess()) {
            this._stack.push(...result.value);
            processed = true;
            if (result.detail === 'failed') {
              break;
            }
          }
        }
        if (!processed) {
          errors.addMessage(`${item.type}: No matching importer found`);
        }
      }
    }

    return errors.returnOrReport(succeed(this));
  }
}
