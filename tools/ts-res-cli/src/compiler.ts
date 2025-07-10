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

import { Result, succeed, fail } from '@fgv/ts-utils';
import { JsonObject } from '@fgv/ts-json-base';
import * as TsRes from '@fgv/ts-res';
import { ICompileOptions } from './options';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Information about compiled resources
 */
export interface IResourceInfo {
  totalResources: number;
  totalCandidates: number;
  filteredResources: number;
  filteredCandidates: number;
  resourceTypes: string[];
  qualifiers: string[];
  context?: JsonObject;
}

/**
 * Compiled resource blob
 */
export interface IResourceBlob {
  resources?: JsonObject;
  compiledCollection?: TsRes.ResourceJson.Compiled.ICompiledResourceCollection;
  metadata?: IResourceInfo;
}

/**
 * Main resource compiler class
 */
export class ResourceCompiler {
  private readonly _options: ICompileOptions;

  public constructor(options: ICompileOptions) {
    this._options = options;
  }

  /**
   * Compiles resources according to the configured options
   */
  public async compile(): Promise<Result<void>> {
    try {
      // Load resources from input
      const loadResult = await this._loadResources();
      if (loadResult.isFailure()) {
        return fail(`Failed to load resources: ${loadResult.message}`);
      }

      const manager = loadResult.value;

      // Apply context filtering if specified
      const filteredResult = this._applyContextFiltering(manager);
      if (filteredResult.isFailure()) {
        return fail(`Failed to apply context filtering: ${filteredResult.message}`);
      }

      // Generate output blob
      const blobResult = await this._generateBlob(filteredResult.value, manager);
      if (blobResult.isFailure()) {
        return fail(`Failed to generate output blob: ${blobResult.message}`);
      }

      // Write output
      const writeResult = await this._writeOutput(blobResult.value);
      if (writeResult.isFailure()) {
        return fail(`Failed to write output: ${writeResult.message}`);
      }

      return succeed(undefined);
    } catch (error) {
      return fail(`Compilation failed: ${error}`);
    }
  }

  /**
   * Validates resources without compilation
   */
  public async validate(): Promise<Result<void>> {
    try {
      const loadResult = await this._loadResources();
      if (loadResult.isFailure()) {
        return fail(`Validation failed: ${loadResult.message}`);
      }

      // Build all resources to trigger validation
      const buildResult = loadResult.value.build();
      if (buildResult.isFailure()) {
        return fail(`Resource validation failed: ${buildResult.message}`);
      }

      return succeed(undefined);
    } catch (error) {
      return fail(`Validation failed: ${error}`);
    }
  }

  /**
   * Gets information about the resources
   */
  public async getInfo(): Promise<Result<IResourceInfo>> {
    try {
      const loadResult = await this._loadResources();
      if (loadResult.isFailure()) {
        return fail(`Failed to load resources: ${loadResult.message}`);
      }

      const manager = loadResult.value;
      const filteredResult = this._applyContextFiltering(manager);
      if (filteredResult.isFailure()) {
        return fail(`Failed to apply context filtering: ${filteredResult.message}`);
      }

      const info = this._generateResourceInfo(filteredResult.value, manager);
      return succeed(info);
    } catch (error) {
      return fail(`Failed to get resource info: ${error}`);
    }
  }

  /**
   * Loads resources from the input path
   */
  private async _loadResources(): Promise<Result<TsRes.Resources.ResourceManagerBuilder>> {
    try {
      // Create standard qualifier types and qualifiers
      const qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
        qualifierTypes: [
          TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
          TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
          TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
        ]
      });

      if (qualifierTypes.isFailure()) {
        return fail(`Failed to create qualifier types: ${qualifierTypes.message}`);
      }

      const qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes: qualifierTypes.value,
        qualifiers: [
          { name: 'language', typeName: 'language', defaultPriority: 600 },
          { name: 'territory', typeName: 'territory', defaultPriority: 500 },
          { name: 'variant', typeName: 'literal', defaultPriority: 400 }
        ]
      });

      if (qualifiers.isFailure()) {
        return fail(`Failed to create qualifiers: ${qualifiers.message}`);
      }

      const resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
        resourceTypes: [
          TsRes.ResourceTypes.JsonResourceType.create().orThrow(),
          TsRes.ResourceTypes.JsonResourceType.create({ key: 'other' }).orThrow()
        ]
      });

      if (resourceTypes.isFailure()) {
        return fail(`Failed to create resource types: ${resourceTypes.message}`);
      }

      const manager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers: qualifiers.value,
        resourceTypes: resourceTypes.value
      });

      if (manager.isFailure()) {
        return fail(`Failed to create resource manager: ${manager.message}`);
      }

      // Load resources from input path
      const importResult = await this._importResources(manager.value);
      if (importResult.isFailure()) {
        return fail(`Failed to import resources: ${importResult.message}`);
      }

      return succeed(manager.value);
    } catch (error) {
      return fail(`Failed to load resources: ${error}`);
    }
  }

  /**
   * Imports resources from the input path
   */
  private async _importResources(manager: TsRes.Resources.ResourceManagerBuilder): Promise<Result<void>> {
    try {
      const inputPath = path.resolve(this._options.input);
      const stat = await fs.stat(inputPath);

      if (stat.isFile()) {
        return await this._importFile(manager, inputPath);
      } else if (stat.isDirectory()) {
        return await this._importDirectory(manager, inputPath);
      } else {
        return fail(`Input path is neither file nor directory: ${inputPath}`);
      }
    } catch (error) {
      return fail(`Failed to import resources: ${error}`);
    }
  }

  /**
   * Imports resources from a single file
   */
  private async _importFile(
    manager: TsRes.Resources.ResourceManagerBuilder,
    filePath: string
  ): Promise<Result<void>> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        // Array of resource candidates
        for (const item of data) {
          const result = manager.addLooseCandidate(item);
          if (result.isFailure()) {
            return fail(`Failed to add candidate: ${result.message}`);
          }
        }
      } else if (data.resources && Array.isArray(data.resources)) {
        // Resource collection format
        for (const resource of data.resources) {
          const result = manager.addResource(resource);
          if (result.isFailure()) {
            return fail(`Failed to add resource: ${result.message}`);
          }
        }
      } else {
        return fail(`Unrecognized resource file format: ${filePath}`);
      }

      return succeed(undefined);
    } catch (error) {
      return fail(`Failed to import file ${filePath}: ${error}`);
    }
  }

  /**
   * Imports resources from a directory
   */
  private async _importDirectory(
    manager: TsRes.Resources.ResourceManagerBuilder,
    dirPath: string
  ): Promise<Result<void>> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const filePath = path.join(dirPath, entry.name);
          const result = await this._importFile(manager, filePath);
          if (result.isFailure()) {
            return result;
          }
        } else if (entry.isDirectory()) {
          const subDirPath = path.join(dirPath, entry.name);
          const result = await this._importDirectory(manager, subDirPath);
          if (result.isFailure()) {
            return result;
          }
        }
      }

      return succeed(undefined);
    } catch (error) {
      return fail(`Failed to import directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Applies context filtering to resources
   */
  private _applyContextFiltering(manager: TsRes.Resources.ResourceManagerBuilder): Result<{
    resources: ReadonlyArray<TsRes.Resources.ResourceBuilder>;
    candidates: ReadonlyArray<TsRes.Resources.ResourceCandidate>;
  }> {
    try {
      if (!this._options.context) {
        return succeed({
          resources: manager.getAllResources(),
          candidates: manager.getAllCandidates()
        });
      }

      const contextData = JSON.parse(this._options.context);
      const context = TsRes.Context.Convert.validatedContextDecl.convert(contextData, {
        qualifiers: manager.qualifiers
      });

      if (context.isFailure()) {
        return fail(`Invalid context: ${context.message}`);
      }

      const contextOptions: TsRes.Context.IContextMatchOptions = {
        partialContextMatch: this._options.partialMatch
      };

      const resources = manager.getResourcesForContext(context.value, contextOptions);
      const candidates = manager.getCandidatesForContext(context.value, contextOptions);

      return succeed({ resources, candidates });
    } catch (error) {
      return fail(`Failed to apply context filtering: ${error}`);
    }
  }

  /**
   * Generates the output blob
   */
  private async _generateBlob(
    filtered: {
      resources: ReadonlyArray<TsRes.Resources.ResourceBuilder>;
      candidates: ReadonlyArray<TsRes.Resources.ResourceCandidate>;
    },
    manager: TsRes.Resources.ResourceManagerBuilder
  ): Promise<Result<IResourceBlob>> {
    try {
      if (this._options.format === 'compiled') {
        return this._generateCompiledBlob(manager);
      } else {
        return this._generateSourceBlob(filtered, manager);
      }
    } catch (error) {
      return fail(`Failed to generate blob: ${error}`);
    }
  }

  /**
   * Generates a compiled resource collection blob
   */
  private async _generateCompiledBlob(
    manager: TsRes.Resources.ResourceManagerBuilder
  ): Promise<Result<IResourceBlob>> {
    try {
      // Build all resources to ensure they're ready for compilation
      const buildResult = manager.build();
      if (buildResult.isFailure()) {
        return fail(`Failed to build resources for compilation: ${buildResult.message}`);
      }

      // Get the compiled resource collection
      const compiledResult = manager.getCompiledResourceCollection();
      if (compiledResult.isFailure()) {
        return fail(`Failed to get compiled resource collection: ${compiledResult.message}`);
      }

      const blob: IResourceBlob = {
        compiledCollection: compiledResult.value
      };

      if (this._options.includeMetadata) {
        blob.metadata = this._generateResourceInfo(
          {
            resources: manager.getAllResources(),
            candidates: manager.getAllCandidates()
          },
          manager
        );
      }

      return succeed(blob);
    } catch (error) {
      return fail(`Failed to generate compiled blob: ${error}`);
    }
  }

  /**
   * Generates a source format blob (legacy format)
   */
  private async _generateSourceBlob(
    filtered: {
      resources: ReadonlyArray<TsRes.Resources.ResourceBuilder>;
      candidates: ReadonlyArray<TsRes.Resources.ResourceCandidate>;
    },
    manager: TsRes.Resources.ResourceManagerBuilder
  ): Promise<Result<IResourceBlob>> {
    try {
      const resources: JsonObject = {};

      // Build filtered resources
      for (const resourceBuilder of filtered.resources) {
        const built = resourceBuilder.build();
        if (built.isFailure()) {
          return fail(`Failed to build resource ${resourceBuilder.id}: ${built.message}`);
        }

        const resource = built.value;
        const resourceData: JsonObject = {};

        // Filter candidates based on context if specified
        const candidatesToInclude = this._options.context
          ? resource.getCandidatesForContext(
              TsRes.Context.Convert.validatedContextDecl
                .convert(JSON.parse(this._options.context), { qualifiers: manager.qualifiers })
                .orThrow(),
              { partialContextMatch: this._options.partialMatch }
            )
          : resource.candidates;

        for (const candidate of candidatesToInclude) {
          const conditionKey =
            candidate.conditions.conditions.length > 0 ? candidate.conditions.toString() : 'default';
          resourceData[conditionKey] = candidate.json;
        }

        resources[resource.id] = resourceData;
      }

      const blob: IResourceBlob = { resources };

      if (this._options.includeMetadata) {
        blob.metadata = this._generateResourceInfo(filtered, manager);
      }

      return succeed(blob);
    } catch (error) {
      return fail(`Failed to generate source blob: ${error}`);
    }
  }

  /**
   * Generates resource information
   */
  private _generateResourceInfo(
    filtered: {
      resources: ReadonlyArray<TsRes.Resources.ResourceBuilder>;
      candidates: ReadonlyArray<TsRes.Resources.ResourceCandidate>;
    },
    manager: TsRes.Resources.ResourceManagerBuilder
  ): IResourceInfo {
    const resourceTypes = Array.from(
      new Set(
        manager
          .getAllCandidates()
          .map((c) => c.resourceType?.key)
          .filter(Boolean)
      )
    ) as string[];

    const qualifiers = Array.from(manager.qualifiers.keys());

    const info: IResourceInfo = {
      totalResources: manager.getAllResources().length,
      totalCandidates: manager.getAllCandidates().length,
      filteredResources: filtered.resources.length,
      filteredCandidates: filtered.candidates.length,
      resourceTypes,
      qualifiers
    };

    if (this._options.context) {
      try {
        info.context = JSON.parse(this._options.context);
      } catch {
        // Ignore parsing errors for metadata
      }
    }

    return info;
  }

  /**
   * Writes the output blob to the specified output path
   */
  private async _writeOutput(blob: IResourceBlob): Promise<Result<void>> {
    try {
      const outputPath = path.resolve(this._options.output);
      const outputDir = path.dirname(outputPath);

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      let content: string;

      switch (this._options.format) {
        case 'compiled':
          // If metadata is included, write the full blob; otherwise, write just the compiled collection
          const compiledData = this._options.includeMetadata ? blob : blob.compiledCollection;
          content = JSON.stringify(compiledData, null, this._options.minify ? 0 : 2);
          break;
        case 'source':
          content = JSON.stringify(blob, null, this._options.minify ? 0 : 2);
          break;
        case 'js':
          const jsData = blob.compiledCollection || blob;
          content = `module.exports = ${JSON.stringify(jsData, null, this._options.minify ? 0 : 2)};`;
          break;
        case 'ts':
          const tsData = blob.compiledCollection || blob;
          content = `export const resources = ${JSON.stringify(
            tsData,
            null,
            this._options.minify ? 0 : 2
          )} as const;`;
          break;
        case 'binary':
          // For binary format, we could use a more efficient serialization
          // For now, use JSON as a placeholder
          const binaryData = blob.compiledCollection || blob;
          content = JSON.stringify(binaryData);
          break;
        default:
          return fail(`Unsupported output format: ${this._options.format}`);
      }

      await fs.writeFile(outputPath, content, 'utf-8');
      return succeed(undefined);
    } catch (error) {
      return fail(`Failed to write output: ${error}`);
    }
  }
}
