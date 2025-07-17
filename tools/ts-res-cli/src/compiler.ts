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
  private _systemConfiguration?: TsRes.Config.Model.ISystemConfiguration;

  public constructor(options: ICompileOptions) {
    this._options = options;
  }

  /**
   * Compiles resources according to the configured options
   */
  public async compile(): Promise<Result<void>> {
    try {
      if (this._options.debug) {
        console.error('Starting resource compilation...');
        console.error('Options:', JSON.stringify(this._options, null, 2));
      }

      // Load and validate configuration
      const configResult = await this._loadConfiguration();
      if (configResult.isFailure()) {
        return fail(`Failed to load configuration: ${configResult.message}`);
      }

      if (this._options.debug) {
        console.error('Configuration loaded successfully');
      }

      // Load resources from input
      const loadResult = await this._loadResources();
      if (loadResult.isFailure()) {
        return fail(`Failed to load resources: ${loadResult.message}`);
      }

      const manager = loadResult.value;

      if (this._options.verbose) {
        console.error(
          `Loaded ${manager.getAllResources().length} resources with ${
            manager.getAllCandidates().length
          } candidates`
        );
      }

      // Apply context filtering if specified
      const filteredResult = this._applyContextFiltering(manager);
      if (filteredResult.isFailure()) {
        return fail(`Failed to apply context filtering: ${filteredResult.message}`);
      }

      if (this._options.verbose && this._options.context) {
        console.error(
          `After context filtering: ${filteredResult.value.resources.length} resources, ${filteredResult.value.candidates.length} candidates`
        );
      }

      // Generate output blob
      const blobResult = await this._generateBlob(filteredResult.value, manager);
      if (blobResult.isFailure()) {
        return fail(`Failed to generate output blob: ${blobResult.message}`);
      }

      if (this._options.debug) {
        console.error(`Generated ${this._options.format} format output blob`);
      }

      // Write output
      const writeResult = await this._writeOutput(blobResult.value);
      if (writeResult.isFailure()) {
        return fail(`Failed to write output: ${writeResult.message}`);
      }

      if (this._options.debug) {
        console.error(`Output written to: ${this._options.output}`);
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
      // Load and validate configuration
      const configResult = await this._loadConfiguration();
      if (configResult.isFailure()) {
        return fail(`Failed to load configuration: ${configResult.message}`);
      }

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
      // Load and validate configuration
      const configResult = await this._loadConfiguration();
      if (configResult.isFailure()) {
        return fail(`Failed to load configuration: ${configResult.message}`);
      }

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
   * Loads and validates the system configuration
   */
  private async _loadConfiguration(): Promise<Result<void>> {
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

      return succeed(undefined);
    } catch (error) {
      return fail(`Failed to load configuration: ${error}`);
    }
  }

  /**
   * Loads resources from the input path using the configured system
   */
  private async _loadResources(): Promise<Result<TsRes.Resources.ResourceManagerBuilder>> {
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
   * Applies context filtering to resources
   */
  private _applyContextFiltering(manager: TsRes.Resources.ResourceManagerBuilder): Result<{
    resources: ReadonlyArray<TsRes.Resources.ResourceBuilder>;
    candidates: ReadonlyArray<TsRes.Resources.ResourceCandidate>;
  }> {
    try {
      // If no context filtering, return all resources
      if (!this._options.context && !this._options.contextFilter) {
        return succeed({
          resources: manager.getAllResources(),
          candidates: manager.getAllCandidates()
        });
      }

      // Determine the context to use for filtering
      let validatedFilterContext: TsRes.Context.IValidatedContextDecl | undefined;

      // Apply context filtering (JSON format)
      if (this._options.context) {
        const contextData = JSON.parse(this._options.context);
        const context = TsRes.Context.Convert.validatedContextDecl.convert(contextData, {
          qualifiers: manager.qualifiers
        });

        if (context.isFailure()) {
          return fail(`Invalid context: ${context.message}`);
        }

        validatedFilterContext = context.value;
      }

      // Apply context filter token (pipe-separated format)
      if (this._options.contextFilter) {
        const contextResult = this._parseContextFilterToken(manager);
        if (contextResult.isFailure()) {
          return fail(`Failed to parse context filter: ${contextResult.message}`);
        }

        validatedFilterContext = contextResult.value;
      }

      // Clone the manager with the validated filter context
      const clonedManagerResult = manager.clone({ validatedFilterContext });
      if (clonedManagerResult.isFailure()) {
        return fail(`Failed to clone manager: ${clonedManagerResult.message}`);
      }

      const clonedManager = clonedManagerResult.value;

      // TODO: Restore resource ID filtering with proper filename prefix handling
      // TODO: Restore path filtering functionality

      return succeed({
        resources: clonedManager.getAllResources(),
        candidates: clonedManager.getAllCandidates()
      });
    } catch (error) {
      return fail(`Failed to apply context filtering: ${error}`);
    }
  }

  /**
   * Parses context filter token into validated partial context
   */
  private _parseContextFilterToken(
    manager: TsRes.Resources.ResourceManagerBuilder
  ): Result<TsRes.Context.IValidatedContextDecl> {
    try {
      if (!this._options.contextFilter) {
        return fail('No context filter provided');
      }

      // Create ContextTokens instance for parsing
      const contextTokens = new TsRes.Context.ContextTokens(manager.qualifiers);

      // Parse the context filter token into a validated partial context
      return contextTokens.contextTokenToPartialContext(this._options.contextFilter);
    } catch (error) {
      return fail(`Failed to parse context filter token: ${error}`);
    }
  }

  // TODO: Add back resource ID filtering helper
  // TODO: Add back path filtering helper

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
