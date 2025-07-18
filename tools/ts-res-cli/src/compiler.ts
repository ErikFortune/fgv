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

import { Result, succeed, fail, FileTree } from '@fgv/ts-utils';
import { JsonObject } from '@fgv/ts-json-base';
import * as TsRes from '@fgv/ts-res';
import { ICompileOptions } from './options';
import { DEFAULT_SYSTEM_CONFIGURATION } from './defaultConfiguration';
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

export interface IFilteredManager {
  original: TsRes.Resources.ResourceManagerBuilder;
  manager: TsRes.Resources.ResourceManagerBuilder;
  context?: JsonObject;
}

/**
 * Compiled resource blob
 */
export interface IResourceBlob {
  resources?: TsRes.ResourceJson.Json.IResourceCollectionDecl;
  compiledCollection?: TsRes.ResourceJson.Compiled.ICompiledResourceCollection;
  metadata?: IResourceInfo;
}

/**
 * Main resource compiler class
 */
export class ResourceCompiler {
  private readonly _options: ICompileOptions;
  private _systemConfiguration?: TsRes.Config.Model.ISystemConfiguration;

  public constructor(options: ICompileOptions) {
    this._options = options;
  }

  /**
   * Compiles resources according to the configured options
   */
  public async compile(): Promise<Result<IResourceBlob>> {
    try {
      if (this._options.debug) {
        console.error('Starting resource compilation...');
        console.error('Options:', JSON.stringify(this._options, null, 2));
      }

      // Load and validate configuration
      const config = (await this._loadConfiguration()).orThrow(
        (err) => `Failed to load configuration: ${err}`
      );

      if (this._options.debug) {
        console.error('Configuration loaded successfully');
      }

      // Load resources from input
      const original = (await this._loadResources(config)).orThrow(
        (err) => `Failed to load resources: ${err}`
      );

      if (this._options.verbose) {
        console.error(`Loaded ${original.numResources} resources with ${original.numCandidates} candidates`);
      }

      // Apply context filtering if specified
      const filtered = this._applyFilters(original).orThrow(
        (err) => `Failed to apply context filtering: ${err}`
      );

      if (this._options.verbose && filtered.manager !== filtered.original) {
        console.error(
          `After context filtering: ${filtered.manager.numResources} resources, ${filtered.manager.numCandidates} candidates`
        );
      }

      // Generate output blob
      const blob = (await this._generateBlob(filtered)).orThrow(
        (err) => `Failed to generate output blob: ${err}`
      );

      if (this._options.debug) {
        console.error(`Generated ${this._options.format} format output blob`);
      }

      // Write output
      (await this._writeOutput(blob)).orThrow((err) => `Failed to write output: ${err}`);

      if (this._options.debug) {
        console.error(`Output written to: ${this._options.output}`);
      }

      return succeed(blob);
    } catch (error) {
      return fail(`Compilation failed: ${error}`);
    }
  }

  /**
   * Validates resources without compilation
   */
  public async validate(): Promise<Result<TsRes.Resources.ResourceManagerBuilder>> {
    try {
      // Load and validate configuration
      const config = (await this._loadConfiguration()).orThrow(
        (err) => `Failed to load configuration: ${err}`
      );

      const manager = (await this._loadResources(config)).orThrow(
        (err) => `Failed to load resources: ${err}`
      );

      const filtered = this._applyFilters(manager).orThrow(
        (err) => `Failed to apply context filtering: ${err}`
      );

      // Build all resources to trigger validation
      return filtered.manager.build().onSuccess((manager) => {
        if (this._options.verbose) {
          console.error(
            `Resource validation successful with ${manager.numResources} resources and ${manager.numCandidates} candidates`
          );
        }
        return succeed(manager);
      });
    } catch (error) {
      return fail(`Validation failed: ${error}`);
    }
  }

  /**
   * Gets information about the resources
   */
  public async getInfo(): Promise<Result<IResourceInfo>> {
    try {
      // Load and validate configuration
      const config = (await this._loadConfiguration()).orThrow(
        (err) => `Failed to load configuration: ${err}`
      );

      const manager = (await this._loadResources(config)).orThrow(
        (err) => `Failed to load resources: ${err}`
      );

      const filtered = this._applyFilters(manager).orThrow(
        (err) => `Failed to apply context filtering: ${err}`
      );

      return succeed(this._generateResourceInfo(filtered));
    } catch (error) {
      return fail(`Failed to get resource info: ${error}`);
    }
  }

  /**
   * Loads and validates the system configuration
   */
  private async _loadConfiguration(): Promise<Result<TsRes.Config.Model.ISystemConfiguration>> {
    try {
      if (this._options.config) {
        // Load custom configuration from file
        const configPath = path.resolve(this._options.config);
        if (this._options.debug) {
          console.error(`Loading configuration from: ${configPath}`);
        }
        const configContent = await fs.readFile(configPath, 'utf-8');
        const configData = JSON.parse(configContent);

        // Validate the configuration using ts-res converter
        const configResult = TsRes.Config.Convert.systemConfiguration.convert(configData);
        if (configResult.isFailure()) {
          return fail(`Invalid configuration file: ${configResult.message}`);
        }

        this._systemConfiguration = configResult.value;
        if (this._options.verbose) {
          console.error(`Using custom configuration: ${this._systemConfiguration.name}`);
        }
      } else {
        // Use default configuration
        this._systemConfiguration = DEFAULT_SYSTEM_CONFIGURATION;
        if (this._options.verbose) {
          console.error(`Using default configuration: ${this._systemConfiguration.name}`);
        }
      }

      return succeed(this._systemConfiguration);
    } catch (error) {
      return fail(`Failed to load configuration: ${error}`);
    }
  }

  /**
   * Loads resources from the input path using the configured system
   */
  private async _loadResources(
    config: TsRes.Config.Model.ISystemConfiguration
  ): Promise<Result<TsRes.Resources.ResourceManagerBuilder>> {
    try {
      if (!this._systemConfiguration) {
        return fail('System configuration not loaded');
      }

      // Create system configuration and ts-res system
      const systemConfigResult = TsRes.Config.SystemConfiguration.create(this._systemConfiguration);
      if (systemConfigResult.isFailure()) {
        return fail(`Failed to create system configuration: ${systemConfigResult.message}`);
      }

      const systemConfig = systemConfigResult.value;

      // Create resource manager from system configuration
      const manager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers: systemConfig.qualifiers,
        resourceTypes: systemConfig.resourceTypes
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
   * Imports resources from the input path using ImportManager
   */
  private async _importResources(manager: TsRes.Resources.ResourceManagerBuilder): Promise<Result<void>> {
    try {
      const inputPath = path.resolve(this._options.input);

      // Create FileTree for file system operations
      const fileTree = FileTree.forFilesystem();
      if (fileTree.isFailure()) {
        return fail(`Failed to create file tree: ${fileTree.message}`);
      }

      // Create ImportManager with the resource manager and file tree
      const importManager = TsRes.Import.ImportManager.create({
        resources: manager,
        fileTree: fileTree.value
      });

      if (importManager.isFailure()) {
        return fail(`Failed to create import manager: ${importManager.message}`);
      }

      // Use ImportManager to handle both files and directories automatically
      if (this._options.debug) {
        console.error(`Importing resources from: ${inputPath}`);
      }
      const importResult = importManager.value.importFromFileSystem(inputPath);
      if (importResult.isFailure()) {
        return fail(`Failed to import from ${inputPath}: ${importResult.message}`);
      }

      if (this._options.verbose) {
        console.error(`Successfully imported resources from: ${inputPath}`);
      }

      return succeed(undefined);
    } catch (error) {
      return fail(`Failed to import resources: ${error}`);
    }
  }

  /**
   * Applies filters to imported resources
   */
  private _applyFilters(original: TsRes.Resources.ResourceManagerBuilder): Result<IFilteredManager> {
    if (this._options.contextFilter) {
      const tokens = new TsRes.Context.ContextTokens(original.qualifiers);
      return tokens.contextTokenToPartialContext(this._options.contextFilter).onSuccess((context) => {
        return original.clone({ validatedFilterContext: context }).onSuccess((manager) => {
          return succeed({ original, manager, context });
        });
      });
    }
    return succeed({ original, manager: original });
  }

  /**
   * Generates the output blob
   */
  private async _generateBlob(filtered: IFilteredManager): Promise<Result<IResourceBlob>> {
    try {
      if (this._options.format === 'compiled') {
        return this._generateCompiledBlob(filtered);
      } else {
        return this._generateSourceBlob(filtered);
      }
    } catch (error) {
      return fail(`Failed to generate blob: ${error}`);
    }
  }

  /**
   * Generates a compiled resource collection blob
   */
  private _generateCompiledBlob(filtered: IFilteredManager): Result<IResourceBlob> {
    // Build all resources to ensure they're ready for compilation
    return filtered.manager.getCompiledResourceCollection().onSuccess((compiled) => {
      const blob: IResourceBlob = {
        compiledCollection: compiled
      };

      if (this._options.includeMetadata) {
        blob.metadata = this._generateResourceInfo(filtered);
      }
      return succeed(blob);
    });
  }

  /**
   * Generates a source format blob (legacy format)
   */
  private _generateSourceBlob(filtered: IFilteredManager): Result<IResourceBlob> {
    return filtered.manager.getResourceCollectionDecl().onSuccess((resources) => {
      const blob: IResourceBlob = { resources };

      if (this._options.includeMetadata) {
        blob.metadata = this._generateResourceInfo(filtered);
      }

      return succeed(blob);
    });
  }

  /**
   * Generates resource information
   */
  private _generateResourceInfo(filtered: IFilteredManager): IResourceInfo {
    const resourceTypes = Array.from(
      new Set(
        filtered.manager
          .getAllCandidates()
          .map((c) => c.resourceType?.key)
          .filter(Boolean)
      )
    ) as string[];

    const qualifiers = Array.from(filtered.manager.qualifiers.keys());

    const info: IResourceInfo = {
      totalResources: filtered.original.numResources,
      totalCandidates: filtered.original.numCandidates,
      filteredResources: filtered.manager.numResources,
      filteredCandidates: filtered.manager.numCandidates,
      resourceTypes,
      qualifiers,
      ...(filtered.context ? { context: filtered.context } : undefined)
    };

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
          content = JSON.stringify(compiledData, null, 2);
          break;
        case 'source':
          content = JSON.stringify(blob, null, 2);
          break;
        case 'js':
          const jsData = blob.compiledCollection || blob;
          content = `module.exports = ${JSON.stringify(jsData, null, 2)};`;
          break;
        case 'ts':
          const tsData = blob.compiledCollection || blob;
          content = `export const resources = ${JSON.stringify(tsData, null, 2)} as const;`;
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
