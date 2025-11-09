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

import { Command } from 'commander';
import { Result, succeed, fail, Logging } from '@fgv/ts-utils';
import { ICompileOptions, OutputFormat } from './options';
import * as TsRes from '@fgv/ts-res';

/**
 * Command-line options for the compile command
 */
interface ICompileCommandOptions {
  input: string;
  output: string;
  config?: string;
  context?: string;
  contextFilter?: string;
  qualifierDefaults?: string;
  format: string;
  debug?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  validate?: boolean;
  includeMetadata?: boolean;
  resourceTypes?: string;
  maxDistance?: number;
  reduceQualifiers?: boolean;
}

/**
 * Command-line options for the validate command
 */
interface IValidateCommandOptions {
  input: string;
  config?: string;
  context?: string;
  contextFilter?: string;
  qualifierDefaults?: string;
  verbose?: boolean;
  quiet?: boolean;
  reduceQualifiers?: boolean;
}

/**
 * Command-line options for the info command
 */
interface IInfoCommandOptions {
  input: string;
  config?: string;
  context?: string;
  contextFilter?: string;
  qualifierDefaults?: string;
  resourceTypes?: string;
  maxDistance?: number;
  reduceQualifiers?: boolean;
}

/**
 * Command-line options for the config command
 */
interface IConfigCommandOptions {
  name?: string;
  output?: string;
  validate?: string;
  normalize?: string;
  qualifierDefaults?: string;
  list?: boolean;
}

/**
 * Command-line options for the archive command
 */
interface IArchiveCommandOptions {
  input?: string;
  config?: string;
  output: string;
  verbose?: boolean;
  quiet?: boolean;
}

/**
 * Command-line options for the delta command
 */
interface IDeltaCommandOptions {
  baseline: string;
  target: string;
  output: string;
  config?: string;
  contextFilter?: string;
  qualifierDefaults?: string;
  resourceIds?: string;
  skipUnchanged?: boolean;
  format: string;
  verbose?: boolean;
  quiet?: boolean;
  includeMetadata?: boolean;
}

import { ResourceCompiler } from './compiler';

/**
 * Main CLI class for ts-res-compile
 */
export class TsResCliApp {
  private readonly _program: Command;

  public constructor() {
    this._program = new Command();
    this._setupCommands();
  }

  /**
   * Runs the CLI with the provided arguments
   */
  public async run(argv: string[]): Promise<void> {
    await this._program.parseAsync(argv);
  }

  /**
   * Sets up the CLI commands and options
   */
  private _setupCommands(): void {
    this._program
      .name('ts-res-compile')
      .description('Compile and optimize ts-res resources')
      .version('1.0.0');

    this._program
      .command('compile')
      .description('Compile resources from input to output format')
      .requiredOption('-i, --input <path>', 'Input file or directory path')
      .requiredOption('-o, --output <path>', 'Output file path')
      .option(
        '--config <name|path>',
        'Predefined configuration name or system configuration file path (JSON, ISystemConfiguration format)'
      )
      .option('-c, --context <json>', 'Context filter for resources (JSON string)')
      .option(
        '--context-filter <token>',
        'Context filter token (pipe-separated, e.g., "language=en-US|territory=US")'
      )
      .option(
        '--qualifier-defaults <token>',
        'Qualifier default values token (pipe-separated, e.g., "language=en-US,en-CA|territory=US")'
      )
      .option('-f, --format <format>', 'Output format (compiled, source, js, ts, binary, bundle)', 'compiled')
      .option('--debug', 'Include debug information', false)
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Quiet output', false)
      .option('--validate', 'Validate resources during compilation', true)
      .option('--include-metadata', 'Include resource metadata in output', false)
      .option('--resource-types <types>', 'Resource type filter (comma-separated)')
      .option('--max-distance <number>', 'Maximum distance for language matching', parseInt)
      .option(
        '--reduce-qualifiers',
        'Remove perfectly matching qualifier conditions from filtered resources',
        false
      )
      .action(async (options) => {
        await this._handleCompileCommand(options);
      });

    this._program
      .command('validate')
      .description('Validate resources without compilation')
      .requiredOption('-i, --input <path>', 'Input file or directory path')
      .option(
        '--config <name|path>',
        'Predefined configuration name or system configuration file path (JSON, ISystemConfiguration format)'
      )
      .option('-c, --context <json>', 'Context filter for resources (JSON string)')
      .option(
        '--context-filter <token>',
        'Context filter token (pipe-separated, e.g., "language=en-US|territory=US")'
      )
      .option(
        '--qualifier-defaults <token>',
        'Qualifier default values token (pipe-separated, e.g., "language=en-US,en-CA|territory=US")'
      )
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Quiet output', false)
      .option(
        '--reduce-qualifiers',
        'Remove perfectly matching qualifier conditions from filtered resources',
        false
      )
      .action(async (options) => {
        await this._handleValidateCommand(options);
      });

    this._program
      .command('info')
      .description('Show information about resources')
      .requiredOption('-i, --input <path>', 'Input file or directory path')
      .option(
        '--config <name|path>',
        'Predefined configuration name or system configuration file path (JSON, ISystemConfiguration format)'
      )
      .option('-c, --context <json>', 'Context filter for resources (JSON string)')
      .option(
        '--context-filter <token>',
        'Context filter token (pipe-separated, e.g., "language=en-US|territory=US")'
      )
      .option(
        '--qualifier-defaults <token>',
        'Qualifier default values token (pipe-separated, e.g., "language=en-US,en-CA|territory=US")'
      )
      .option('--resource-types <types>', 'Resource type filter (comma-separated)')
      .option('--max-distance <number>', 'Maximum distance for language matching', parseInt)
      .option(
        '--reduce-qualifiers',
        'Remove perfectly matching qualifier conditions from filtered resources',
        false
      )
      .action(async (options) => {
        await this._handleInfoCommand(options);
      });

    this._program
      .command('config')
      .description('Manage system configurations')
      .option('-n, --name <name>', 'Predefined configuration name to print')
      .option('-o, --output <path>', 'Output file path to save configuration')
      .option('--validate <path>', 'Validate a configuration file')
      .option('--normalize <path>', 'Normalize and validate a configuration file')
      .option(
        '--qualifier-defaults <token>',
        'Qualifier default values token (pipe-separated, e.g., "language=en-US,en-CA|territory=US")'
      )
      .option('-l, --list', 'List all available predefined configurations')
      .action(async (options) => {
        await this._handleConfigCommand(options);
      });

    this._program
      .command('archive')
      .description('Create ZIP archive of resources and configuration')
      .option('-i, --input <path>', 'Input file or directory path')
      .option('--config <path>', 'Configuration file path')
      .requiredOption('-o, --output <path>', 'Output ZIP file path')
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Quiet output', false)
      .action(async (options) => {
        await this._handleArchiveCommand(options);
      });

    this._program
      .command('delta')
      .description('Generate delta between baseline and target resources')
      .requiredOption('--baseline <path>', 'Baseline resource file or directory path')
      .requiredOption('--target <path>', 'Target resource file or directory path')
      .requiredOption('-o, --output <path>', 'Output file path')
      .option(
        '--config <name|path>',
        'Predefined configuration name or system configuration file path (JSON, ISystemConfiguration format)'
      )
      .option(
        '--context-filter <token>',
        'Context filter token (pipe-separated, e.g., "language=en-US|territory=US")'
      )
      .option(
        '--qualifier-defaults <token>',
        'Qualifier default values token (pipe-separated, e.g., "language=en-US,en-CA|territory=US")'
      )
      .option(
        '--resource-ids <ids>',
        'Comma-separated list of specific resource IDs to include in delta generation'
      )
      .option('--skip-unchanged', 'Skip resources that have not changed between baseline and target', true)
      .option('-f, --format <format>', 'Output format (compiled, source, js, ts, binary, bundle)', 'compiled')
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Quiet output', false)
      .option('--include-metadata', 'Include resource metadata in output', false)
      .action(async (options) => {
        await this._handleDeltaCommand(options);
      });
  }

  /**
   * Handles the compile command
   */
  private async _handleCompileCommand(options: ICompileCommandOptions): Promise<void> {
    const compileOptions = this._parseCompileOptions(options);
    if (compileOptions.isFailure()) {
      console.error(`Error: ${compileOptions.message}`);
      process.exit(1);
    }

    const compiler = new ResourceCompiler(compileOptions.value);
    const result = await compiler.compile();

    if (result.isFailure()) {
      console.error(`Error: ${result.message}`);
      process.exit(1);
    }

    if (!options.quiet && options.output) {
      console.log(`Successfully compiled resources to ${options.output}`);
    }
  }

  /**
   * Handles the validate command
   */
  private async _handleValidateCommand(options: IValidateCommandOptions): Promise<void> {
    // Convert JSON context to contextFilter if provided
    let contextFilter = options.contextFilter;
    if (options.context && !contextFilter) {
      try {
        const contextObj = JSON.parse(options.context);
        const tokens: string[] = [];
        for (const [key, value] of Object.entries(contextObj)) {
          tokens.push(`${key}=${value}`);
        }
        contextFilter = tokens.join('|');
      } catch (error) {
        console.error(`Error: Invalid context JSON: ${error}`);
        process.exit(1);
      }
    }

    const validateOptions: ICompileOptions = {
      input: options.input,
      output: '', // Not used for validation
      config: options.config,
      contextFilter,
      qualifierDefaults: options.qualifierDefaults,
      format: 'compiled',
      debug: false,
      verbose: options.verbose || false,
      quiet: options.quiet || false,
      validate: true,
      includeMetadata: false,
      reduceQualifiers: options.reduceQualifiers || false
    };

    const compiler = new ResourceCompiler(validateOptions);
    const result = await compiler.validate();

    if (result.isFailure()) {
      console.error(`Validation failed: ${result.message}`);
      process.exit(1);
    }

    if (!options.quiet) {
      console.log('Resources validated successfully');
    }
  }

  /**
   * Handles the info command
   */
  private async _handleInfoCommand(options: IInfoCommandOptions): Promise<void> {
    // Convert JSON context to contextFilter if provided
    let contextFilter = options.contextFilter;
    if (options.context && !contextFilter) {
      try {
        const contextObj = JSON.parse(options.context);
        const tokens: string[] = [];
        for (const [key, value] of Object.entries(contextObj)) {
          tokens.push(`${key}=${value}`);
        }
        contextFilter = tokens.join('|');
      } catch (error) {
        console.error(`Error: Invalid context JSON: ${error}`);
        process.exit(1);
      }
    }

    const infoOptions: ICompileOptions = {
      input: options.input,
      output: '', // Not used for info
      config: options.config,
      format: 'compiled',
      debug: false,
      verbose: false,
      quiet: false,
      validate: false,
      includeMetadata: true,
      contextFilter,
      qualifierDefaults: options.qualifierDefaults,
      resourceTypes: options.resourceTypes,
      maxDistance: options.maxDistance,
      reduceQualifiers: options.reduceQualifiers || false
    };

    const compiler = new ResourceCompiler(infoOptions);
    const result = await compiler.getInfo();

    if (result.isFailure()) {
      console.error(`Error: ${result.message}`);
      process.exit(1);
    }

    console.log(JSON.stringify(result.value, null, 2));
  }

  /**
   * Handles the config command
   */
  private async _handleConfigCommand(options: IConfigCommandOptions): Promise<void> {
    try {
      // List all predefined configurations
      if (options.list) {
        console.log('Available predefined configurations:');
        console.log('- default');
        console.log('- language-priority');
        console.log('- territory-priority');
        console.log('- extended-example');
        return;
      }

      // Print a specific predefined configuration
      if (options.name) {
        const predefinedNames: TsRes.Config.PredefinedSystemConfiguration[] = [
          'default',
          'language-priority',
          'territory-priority',
          'extended-example'
        ];

        if (!predefinedNames.includes(options.name as TsRes.Config.PredefinedSystemConfiguration)) {
          console.error(`Error: Predefined configuration '${options.name}' not found`);
          console.error(
            'Available configurations: default, language-priority, territory-priority, extended-example'
          );
          process.exit(1);
        }

        const configResult = TsRes.Config.getPredefinedDeclaration(
          options.name as TsRes.Config.PredefinedSystemConfiguration
        );
        if (configResult.isFailure()) {
          console.error(
            `Error: Failed to load predefined configuration '${options.name}': ${configResult.message}`
          );
          process.exit(1);
        }

        let config = configResult.value;

        // Apply qualifier defaults if provided
        if (options.qualifierDefaults) {
          const tempSystemConfigResult = TsRes.Config.SystemConfiguration.create(config);
          if (tempSystemConfigResult.isFailure()) {
            console.error(`Error: Failed to create system configuration: ${tempSystemConfigResult.message}`);
            process.exit(1);
          }

          const tokens = new TsRes.Qualifiers.QualifierDefaultValueTokens(
            tempSystemConfigResult.value.qualifiers
          );
          const defaultsResult = tokens.qualifierDefaultValuesTokenToDecl(options.qualifierDefaults);
          if (defaultsResult.isFailure()) {
            console.error(`Error: Failed to parse qualifier defaults: ${defaultsResult.message}`);
            process.exit(1);
          }

          const updatedConfigResult = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(
            config,
            defaultsResult.value
          );
          if (updatedConfigResult.isFailure()) {
            console.error(`Error: Failed to apply qualifier defaults: ${updatedConfigResult.message}`);
            process.exit(1);
          }

          config = updatedConfigResult.value;
        }

        const output = JSON.stringify(config, null, 2);

        if (options.output) {
          const fs = await import('fs').then((m) => m.promises);
          const path = await import('path');
          const outputPath = path.resolve(options.output);
          const outputDir = path.dirname(outputPath);

          await fs.mkdir(outputDir, { recursive: true });
          await fs.writeFile(outputPath, output, 'utf-8');
          console.log(`Configuration saved to: ${outputPath}`);
        } else {
          console.log(output);
        }
        return;
      }

      // Validate a configuration file
      if (options.validate) {
        const fs = await import('fs').then((m) => m.promises);
        const path = await import('path');

        const configPath = path.resolve(options.validate);
        const configContent = await fs.readFile(configPath, 'utf-8');
        const configData = JSON.parse(configContent);

        const configResult = TsRes.Config.Convert.systemConfiguration.convert(configData);
        if (configResult.isFailure()) {
          console.error(`Validation failed: ${configResult.message}`);
          process.exit(1);
        }

        console.log(`Configuration file '${configPath}' is valid`);
        return;
      }

      // Normalize a configuration file
      if (options.normalize) {
        const fs = await import('fs').then((m) => m.promises);
        const path = await import('path');

        const configPath = path.resolve(options.normalize);
        const configContent = await fs.readFile(configPath, 'utf-8');
        const configData = JSON.parse(configContent);

        const configResult = TsRes.Config.Convert.systemConfiguration.convert(configData);
        if (configResult.isFailure()) {
          console.error(`Normalization failed: ${configResult.message}`);
          process.exit(1);
        }

        let normalizedConfig = configResult.value;

        // Apply qualifier defaults if provided
        if (options.qualifierDefaults) {
          const tempSystemConfigResult = TsRes.Config.SystemConfiguration.create(normalizedConfig);
          if (tempSystemConfigResult.isFailure()) {
            console.error(`Error: Failed to create system configuration: ${tempSystemConfigResult.message}`);
            process.exit(1);
          }

          const tokens = new TsRes.Qualifiers.QualifierDefaultValueTokens(
            tempSystemConfigResult.value.qualifiers
          );
          const defaultsResult = tokens.qualifierDefaultValuesTokenToDecl(options.qualifierDefaults);
          if (defaultsResult.isFailure()) {
            console.error(`Error: Failed to parse qualifier defaults: ${defaultsResult.message}`);
            process.exit(1);
          }

          const updatedConfigResult = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(
            normalizedConfig,
            defaultsResult.value
          );
          if (updatedConfigResult.isFailure()) {
            console.error(`Error: Failed to apply qualifier defaults: ${updatedConfigResult.message}`);
            process.exit(1);
          }

          normalizedConfig = updatedConfigResult.value;
        }

        const output = JSON.stringify(normalizedConfig, null, 2);

        if (options.output) {
          const outputPath = path.resolve(options.output);
          const outputDir = path.dirname(outputPath);

          await fs.mkdir(outputDir, { recursive: true });
          await fs.writeFile(outputPath, output, 'utf-8');
          console.log(`Normalized configuration saved to: ${outputPath}`);
        } else {
          console.log(output);
        }
        return;
      }

      // If no specific action, print default configuration
      const defaultResult = TsRes.Config.getPredefinedDeclaration('default');
      if (defaultResult.isFailure()) {
        console.error(`Error: Default configuration not available`);
        process.exit(1);
      }

      let defaultConfig = defaultResult.value;

      // Apply qualifier defaults if provided
      if (options.qualifierDefaults) {
        const tempSystemConfigResult = TsRes.Config.SystemConfiguration.create(defaultConfig);
        if (tempSystemConfigResult.isFailure()) {
          console.error(`Error: Failed to create system configuration: ${tempSystemConfigResult.message}`);
          process.exit(1);
        }

        const tokens = new TsRes.Qualifiers.QualifierDefaultValueTokens(
          tempSystemConfigResult.value.qualifiers
        );
        const defaultsResult = tokens.qualifierDefaultValuesTokenToDecl(options.qualifierDefaults);
        if (defaultsResult.isFailure()) {
          console.error(`Error: Failed to parse qualifier defaults: ${defaultsResult.message}`);
          process.exit(1);
        }

        const updatedConfigResult = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(
          defaultConfig,
          defaultsResult.value
        );
        if (updatedConfigResult.isFailure()) {
          console.error(`Error: Failed to apply qualifier defaults: ${updatedConfigResult.message}`);
          process.exit(1);
        }

        defaultConfig = updatedConfigResult.value;
      }

      console.log(JSON.stringify(defaultConfig, null, 2));
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Handles the delta command
   */
  private async _handleDeltaCommand(options: IDeltaCommandOptions): Promise<void> {
    const deltaOptions = this._parseDeltaOptions(options);
    if (deltaOptions.isFailure()) {
      console.error(`Error: ${deltaOptions.message}`);
      process.exit(1);
    }

    const result = await this._generateDelta(deltaOptions.value);

    if (result.isFailure()) {
      console.error(`Error: ${result.message}`);
      process.exit(1);
    }

    if (!options.quiet) {
      console.log(`Successfully generated delta to ${options.output}`);
    }
  }

  /**
   * Handles the archive command
   */
  private async _handleArchiveCommand(options: IArchiveCommandOptions): Promise<void> {
    try {
      // Import ZipArchive dynamically to avoid loading if not needed
      const { ZipArchive } = await import('@fgv/ts-res');

      if (!options.input && !options.config) {
        console.error('Error: At least one of --input or --config must be specified');
        process.exit(1);
      }

      if (!options.quiet) {
        console.log('Creating ZIP archive...');
        if (options.input) console.log(`Input: ${options.input}`);
        if (options.config) console.log(`Config: ${options.config}`);
        console.log(`Output: ${options.output}`);
      }

      // Create ZIP archive using the new zip-archive packlet
      const creator = new ZipArchive.ZipArchiveCreator();
      const createResult = await creator.createFromBuffer(
        {
          inputPath: options.input,
          configPath: options.config
        },
        options.verbose
          ? (phase, progress, message) => {
              console.log(`[${phase}] ${progress}% - ${message}`);
            }
          : undefined
      );

      if (createResult.isFailure()) {
        console.error(`Error: Failed to create ZIP archive: ${createResult.message}`);
        process.exit(1);
      }

      const { zipBuffer, manifest, size } = createResult.value;

      // Write the ZIP buffer to the specified output file
      const fs = await import('fs').then((m) => m.promises);
      const path = await import('path');
      const outputPath = path.resolve(options.output);
      const outputDir = path.dirname(outputPath);

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Write ZIP file
      await fs.writeFile(outputPath, zipBuffer);

      if (!options.quiet) {
        console.log(`ZIP archive created successfully: ${outputPath}`);
        console.log(`Archive size: ${(size / 1024).toFixed(2)} KB`);
        console.log(`Manifest:`);
        console.log(JSON.stringify(manifest, null, 2));
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  /**
   * Parses and validates delta options
   */
  private _parseDeltaOptions(options: IDeltaCommandOptions): Result<IDeltaOptions> {
    try {
      const format = options.format as OutputFormat;
      if (!['compiled', 'source', 'js', 'ts', 'binary', 'bundle'].includes(format)) {
        return fail(`Invalid format: ${format}`);
      }

      // Parse resource IDs if provided
      let resourceIds: string[] | undefined;
      if (options.resourceIds) {
        resourceIds = options.resourceIds
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0);
        if (resourceIds.length === 0) {
          return fail('Resource IDs list cannot be empty');
        }
      }

      const deltaOptions: IDeltaOptions = {
        baseline: options.baseline,
        target: options.target,
        output: options.output,
        config: options.config,
        contextFilter: options.contextFilter,
        qualifierDefaults: options.qualifierDefaults,
        resourceIds,
        skipUnchanged: options.skipUnchanged ?? true,
        format,
        verbose: options.verbose || false,
        quiet: options.quiet || false,
        includeMetadata: options.includeMetadata || false
      };

      return succeed(deltaOptions);
    } catch (error) {
      return fail(`Failed to parse delta options: ${error}`);
    }
  }

  /**
   * Parses and validates compile options
   */
  private _parseCompileOptions(options: ICompileCommandOptions): Result<ICompileOptions> {
    try {
      const format = options.format as OutputFormat;
      if (!['compiled', 'source', 'js', 'ts', 'binary', 'bundle'].includes(format)) {
        return fail(`Invalid format: ${format}`);
      }

      // Convert JSON context to contextFilter if provided
      let contextFilter = options.contextFilter;
      if (options.context && !contextFilter) {
        try {
          const contextObj = JSON.parse(options.context);
          const tokens: string[] = [];
          for (const [key, value] of Object.entries(contextObj)) {
            tokens.push(`${key}=${value}`);
          }
          contextFilter = tokens.join('|');
        } catch (error) {
          return fail(`Invalid context JSON: ${error}`);
        }
      }

      const compileOptions: ICompileOptions = {
        input: options.input,
        output: options.output,
        config: options.config,
        contextFilter,
        qualifierDefaults: options.qualifierDefaults,
        format,
        debug: options.debug || false,
        verbose: options.verbose || false,
        quiet: options.quiet || false,
        validate: options.validate !== false,
        includeMetadata: options.includeMetadata || false,
        resourceTypes: options.resourceTypes,
        maxDistance: options.maxDistance,
        reduceQualifiers: options.reduceQualifiers || false
      };

      return succeed(compileOptions);
    } catch (error) {
      return fail(`Failed to parse options: ${error}`);
    }
  }

  /**
   * Generates delta between baseline and target resources
   */
  private async _generateDelta(options: IDeltaOptions): Promise<Result<void>> {
    try {
      if (options.verbose) {
        console.error('Starting delta generation...');
        console.error(`Baseline: ${options.baseline}`);
        console.error(`Target: ${options.target}`);
        console.error(`Output: ${options.output}`);
      }

      // Load system configuration
      const config = await this._loadSystemConfiguration(options.config, options.verbose);
      if (config.isFailure()) {
        return fail(`Failed to load configuration: ${config.message}`);
      }

      if (options.verbose) {
        console.error('Configuration loaded successfully');
      }

      // Create resource managers for baseline and target
      const baselineManager = await this._createResourceManager(
        config.value,
        options.baseline,
        options.qualifierDefaults,
        options.verbose
      );
      if (baselineManager.isFailure()) {
        return fail(`Failed to load baseline resources: ${baselineManager.message}`);
      }

      const targetManager = await this._createResourceManager(
        config.value,
        options.target,
        options.qualifierDefaults,
        options.verbose
      );
      if (targetManager.isFailure()) {
        return fail(`Failed to load target resources: ${targetManager.message}`);
      }

      if (options.verbose) {
        console.error(
          `Baseline loaded: ${baselineManager.value.numResources} resources, ${baselineManager.value.numCandidates} candidates`
        );
        console.error(
          `Target loaded: ${targetManager.value.numResources} resources, ${targetManager.value.numCandidates} candidates`
        );
      }

      // Create resource resolvers
      const baselineResolver = await this._createResourceResolver(
        baselineManager.value,
        options.contextFilter,
        options.verbose,
        config.value
      );
      if (baselineResolver.isFailure()) {
        return fail(`Failed to create baseline resolver: ${baselineResolver.message}`);
      }

      const targetResolver = await this._createResourceResolver(
        targetManager.value,
        options.contextFilter,
        options.verbose,
        config.value
      );
      if (targetResolver.isFailure()) {
        return fail(`Failed to create target resolver: ${targetResolver.message}`);
      }

      // Create delta generator
      const deltaGenerator = TsRes.Resources.DeltaGenerator.create({
        baselineResolver: baselineResolver.value,
        deltaResolver: targetResolver.value,
        resourceManager: baselineManager.value,
        logger: options.verbose ? new Logging.ConsoleLogger() : undefined
      });

      if (deltaGenerator.isFailure()) {
        return fail(`Failed to create delta generator: ${deltaGenerator.message}`);
      }

      // Parse context filter for delta generation options
      let context: TsRes.Context.IContextDecl | undefined;
      if (options.contextFilter) {
        const contextTokens = new TsRes.Context.ContextTokens(baselineManager.value.qualifiers);
        const contextResult = contextTokens.contextTokenToPartialContext(options.contextFilter);
        if (contextResult.isFailure()) {
          return fail(`Failed to parse context filter: ${contextResult.message}`);
        }
        context = contextResult.value;
      }

      // Generate delta
      const deltaOptions: TsRes.Resources.IDeltaGeneratorOptions = {
        context,
        resourceIds: options.resourceIds,
        skipUnchanged: options.skipUnchanged
      };

      if (options.verbose) {
        console.error('Generating delta...');
      }

      const deltaResult = deltaGenerator.value.generate(deltaOptions);
      if (deltaResult.isFailure()) {
        return fail(`Delta generation failed: ${deltaResult.message}`);
      }

      const deltaManager = deltaResult.value;
      if (options.verbose) {
        console.error(
          `Delta generated: ${deltaManager.numResources} resources, ${deltaManager.numCandidates} candidates`
        );
      }

      // Generate output blob
      const blob = await this._generateDeltaBlob(deltaManager, options, config.value);
      if (blob.isFailure()) {
        return fail(`Failed to generate output blob: ${blob.message}`);
      }

      // Write output
      const writeResult = await this._writeDeltaOutput(blob.value, options);
      if (writeResult.isFailure()) {
        return fail(`Failed to write output: ${writeResult.message}`);
      }

      if (options.verbose) {
        console.error(`Delta output written to: ${options.output}`);
      }

      return succeed(undefined);
    } catch (error) {
      return fail(`Delta generation failed: ${error}`);
    }
  }

  /**
   * Loads system configuration (reused from ResourceCompiler pattern)
   */
  private async _loadSystemConfiguration(
    configOption: string | undefined,
    verbose: boolean
  ): Promise<Result<TsRes.Config.Model.ISystemConfiguration>> {
    try {
      if (configOption) {
        // Check if it's a predefined configuration name
        const predefinedNames: TsRes.Config.PredefinedSystemConfiguration[] = [
          'default',
          'language-priority',
          'territory-priority',
          'extended-example'
        ];

        if (predefinedNames.includes(configOption as TsRes.Config.PredefinedSystemConfiguration)) {
          const predefinedResult = TsRes.Config.getPredefinedDeclaration(
            configOption as TsRes.Config.PredefinedSystemConfiguration
          );
          if (predefinedResult.isSuccess()) {
            if (verbose) {
              console.error(`Using predefined configuration: ${predefinedResult.value.name}`);
            }
            return succeed(predefinedResult.value);
          }
        }

        // Try to load as file path
        try {
          const path = await import('path');
          const fs = await import('fs').then((m) => m.promises);

          const configPath = path.resolve(configOption);
          const configContent = await fs.readFile(configPath, 'utf-8');
          const configData = JSON.parse(configContent);

          const configResult = TsRes.Config.Convert.systemConfiguration.convert(configData);
          if (configResult.isFailure()) {
            return fail(`Invalid configuration file: ${configResult.message}`);
          }

          if (verbose) {
            console.error(`Using custom configuration: ${configResult.value.name}`);
          }
          return succeed(configResult.value);
        } catch (fileError) {
          return fail(
            `Configuration '${configOption}' is not a predefined configuration name and failed to load as file: ${fileError}`
          );
        }
      } else {
        // Use default configuration
        const defaultResult = TsRes.Config.getPredefinedDeclaration('default');
        if (defaultResult.isSuccess()) {
          if (verbose) {
            console.error(`Using default configuration: ${defaultResult.value.name}`);
          }
          return succeed(defaultResult.value);
        } else {
          return fail('Failed to load default configuration');
        }
      }
    } catch (error) {
      return fail(`Failed to load system configuration: ${error}`);
    }
  }

  /**
   * Creates a resource manager from a path (reused from ResourceCompiler pattern)
   */
  private async _createResourceManager(
    systemConfig: TsRes.Config.Model.ISystemConfiguration,
    inputPath: string,
    qualifierDefaults: string | undefined,
    verbose: boolean
  ): Promise<Result<TsRes.Resources.ResourceManagerBuilder>> {
    try {
      // Parse qualifier defaults if provided
      let qualifierDefaultValues: Record<string, string | null> | undefined;
      if (qualifierDefaults) {
        const tempSystemConfigResult = TsRes.Config.SystemConfiguration.create(systemConfig);
        if (tempSystemConfigResult.isFailure()) {
          return fail(`Failed to create temporary system configuration: ${tempSystemConfigResult.message}`);
        }

        const tokens = new TsRes.Qualifiers.QualifierDefaultValueTokens(
          tempSystemConfigResult.value.qualifiers
        );
        const defaultsResult = tokens.qualifierDefaultValuesTokenToDecl(qualifierDefaults);
        if (defaultsResult.isFailure()) {
          return fail(`Failed to parse qualifier defaults: ${defaultsResult.message}`);
        }

        qualifierDefaultValues = defaultsResult.value;
      }

      // Create system configuration
      const systemConfigResult = TsRes.Config.SystemConfiguration.create(
        systemConfig,
        qualifierDefaultValues ? { qualifierDefaultValues } : undefined
      );
      if (systemConfigResult.isFailure()) {
        return fail(`Failed to create system configuration: ${systemConfigResult.message}`);
      }

      const config = systemConfigResult.value;

      // Create resource manager
      const manager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers: config.qualifiers,
        resourceTypes: config.resourceTypes
      });

      if (manager.isFailure()) {
        return fail(`Failed to create resource manager: ${manager.message}`);
      }

      // Import resources from path
      const importResult = await this._importResourcesFromPath(manager.value, inputPath, verbose);
      if (importResult.isFailure()) {
        return fail(`Failed to import resources from ${inputPath}: ${importResult.message}`);
      }

      return succeed(manager.value);
    } catch (error) {
      return fail(`Failed to create resource manager: ${error}`);
    }
  }

  /**
   * Imports resources from a file path (reused from ResourceCompiler pattern)
   */
  private async _importResourcesFromPath(
    manager: TsRes.Resources.ResourceManagerBuilder,
    inputPath: string,
    verbose: boolean
  ): Promise<Result<void>> {
    try {
      const path = await import('path');
      const { FileTree } = await import('@fgv/ts-json-base');

      const resolvedPath = path.resolve(inputPath);

      // Create FileTree for file system operations
      const fileTree = FileTree.forFilesystem();
      if (fileTree.isFailure()) {
        return fail(`Failed to create file tree: ${fileTree.message}`);
      }

      // Create ImportManager
      const importManager = TsRes.Import.ImportManager.create({
        resources: manager,
        fileTree: fileTree.value
      });

      if (importManager.isFailure()) {
        return fail(`Failed to create import manager: ${importManager.message}`);
      }

      // Import resources
      if (verbose) {
        console.error(`Importing resources from: ${resolvedPath}`);
      }

      const importResult = importManager.value.importFromFileSystem(resolvedPath);
      if (importResult.isFailure()) {
        return fail(`Failed to import from ${resolvedPath}: ${importResult.message}`);
      }

      if (verbose) {
        console.error(`Successfully imported resources from: ${resolvedPath}`);
      }

      return succeed(undefined);
    } catch (error) {
      return fail(`Failed to import resources: ${error}`);
    }
  }

  /**
   * Creates a resource resolver from a resource manager and system configuration
   */
  private async _createResourceResolver(
    manager: TsRes.Resources.ResourceManagerBuilder,
    contextFilter: string | undefined,
    verbose: boolean,
    systemConfig?: TsRes.Config.Model.ISystemConfiguration
  ): Promise<Result<TsRes.IResourceResolver>> {
    try {
      // Apply context filtering if specified
      let finalManager = manager;
      if (contextFilter) {
        const contextTokens = new TsRes.Context.ContextTokens(manager.qualifiers);
        const contextResult = contextTokens.contextTokenToPartialContext(contextFilter);
        if (contextResult.isFailure()) {
          return fail(`Failed to parse context filter: ${contextResult.message}`);
        }

        const filteredManagerResult = manager.clone({
          filterForContext: contextResult.value,
          reduceQualifiers: false // Don't reduce qualifiers for delta generation
        });
        if (filteredManagerResult.isFailure()) {
          return fail(`Failed to apply context filter: ${filteredManagerResult.message}`);
        }

        finalManager = filteredManagerResult.value;

        if (verbose) {
          console.error(
            `After context filtering: ${finalManager.numResources} resources, ${finalManager.numCandidates} candidates`
          );
        }
      }

      // Build the manager to create the resolver
      const builtManager = finalManager.build();
      if (builtManager.isFailure()) {
        return fail(`Failed to build resource manager: ${builtManager.message}`);
      }

      // Create qualifier types from system config or use default
      const qualifierTypesResult = systemConfig
        ? TsRes.Config.SystemConfiguration.create(systemConfig).onSuccess((config) =>
            succeed(config.qualifierTypes)
          )
        : TsRes.QualifierTypes.QualifierTypeCollector.create({
            qualifierTypes: [
              TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
              TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
            ]
          });

      if (qualifierTypesResult.isFailure()) {
        return fail(`Failed to create qualifier types: ${qualifierTypesResult.message}`);
      }

      // Create context provider - use empty context for default
      const contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers: finalManager.qualifiers,
        qualifierValues: {} // Empty context for most general resolution
      });

      if (contextProvider.isFailure()) {
        return fail(`Failed to create context provider: ${contextProvider.message}`);
      }

      // Create resolver with required parameters
      const resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: builtManager.value,
        qualifierTypes: qualifierTypesResult.value,
        contextQualifierProvider: contextProvider.value
      });
      if (resolver.isFailure()) {
        return fail(`Failed to create resource resolver: ${resolver.message}`);
      }

      return succeed(resolver.value);
    } catch (error) {
      return fail(`Failed to create resource resolver: ${error}`);
    }
  }

  /**
   * Generates output blob for delta resources
   */
  private async _generateDeltaBlob(
    deltaManager: TsRes.Resources.ResourceManagerBuilder,
    options: IDeltaOptions,
    systemConfig: TsRes.Config.Model.ISystemConfiguration
  ): Promise<Result<IDeltaBlob>> {
    try {
      if (options.format === 'compiled') {
        return deltaManager.getCompiledResourceCollection().onSuccess((compiled) => {
          const blob: IDeltaBlob = {
            compiledCollection: compiled
          };

          if (options.includeMetadata) {
            blob.metadata = this._generateDeltaResourceInfo(deltaManager);
          }

          return succeed(blob);
        });
      } else if (options.format === 'bundle') {
        // Create bundle using BundleBuilder
        const systemConfigResult = TsRes.Config.SystemConfiguration.create(systemConfig);
        if (systemConfigResult.isFailure()) {
          return fail(`Failed to create system configuration for bundle: ${systemConfigResult.message}`);
        }

        const bundleParams: TsRes.Bundle.IBundleCreateParams = {
          version: '1.0.0',
          description: 'Generated delta bundle from ts-res-cli',
          normalize: true
        };

        return TsRes.Bundle.BundleBuilder.create(
          deltaManager,
          systemConfigResult.value,
          bundleParams
        ).onSuccess((bundle) => {
          const blob: IDeltaBlob = {
            bundle
          };

          if (options.includeMetadata) {
            blob.metadata = this._generateDeltaResourceInfo(deltaManager);
          }

          return succeed(blob);
        });
      } else {
        // Source format
        return deltaManager.getResourceCollectionDecl().onSuccess((resources) => {
          const blob: IDeltaBlob = {
            resources
          };

          if (options.includeMetadata) {
            blob.metadata = this._generateDeltaResourceInfo(deltaManager);
          }

          return succeed(blob);
        });
      }
    } catch (error) {
      return fail(`Failed to generate delta blob: ${error}`);
    }
  }

  /**
   * Generates resource information for delta output
   */
  private _generateDeltaResourceInfo(
    deltaManager: TsRes.Resources.ResourceManagerBuilder
  ): IDeltaResourceInfo {
    const resourceTypes = Array.from(
      new Set(
        deltaManager
          .getAllCandidates()
          .map((c) => c.resourceType?.key)
          .filter(Boolean)
      )
    ) as string[];

    const qualifiers = Array.from(deltaManager.qualifiers.keys());

    return {
      totalResources: deltaManager.numResources,
      totalCandidates: deltaManager.numCandidates,
      resourceTypes,
      qualifiers
    };
  }

  /**
   * Writes delta output to file
   */
  private async _writeDeltaOutput(blob: IDeltaBlob, options: IDeltaOptions): Promise<Result<void>> {
    try {
      const path = await import('path');
      const fs = await import('fs').then((m) => m.promises);

      const outputPath = path.resolve(options.output);
      const outputDir = path.dirname(outputPath);

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      let content: string;

      switch (options.format) {
        case 'compiled':
          const compiledData = options.includeMetadata ? blob : blob.compiledCollection;
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
          const binaryData = blob.compiledCollection || blob;
          content = JSON.stringify(binaryData);
          break;
        case 'bundle':
          const bundleData = options.includeMetadata ? blob : blob.bundle;
          content = JSON.stringify(bundleData, null, 2);
          break;
        default:
          return fail(`Unsupported output format: ${options.format}`);
      }

      await fs.writeFile(outputPath, content, 'utf-8');
      return succeed(undefined);
    } catch (error) {
      return fail(`Failed to write delta output: ${error}`);
    }
  }
}

/**
 * Options for delta generation
 */
interface IDeltaOptions {
  baseline: string;
  target: string;
  output: string;
  config?: string;
  contextFilter?: string;
  qualifierDefaults?: string;
  resourceIds?: string[];
  skipUnchanged: boolean;
  format: OutputFormat;
  verbose: boolean;
  quiet: boolean;
  includeMetadata: boolean;
}

/**
 * Delta resource blob
 */
interface IDeltaBlob {
  resources?: TsRes.ResourceJson.Json.IResourceCollectionDecl;
  compiledCollection?: TsRes.ResourceJson.Compiled.ICompiledResourceCollection;
  bundle?: TsRes.Bundle.IBundle;
  metadata?: IDeltaResourceInfo;
}

/**
 * Information about delta resources
 */
interface IDeltaResourceInfo {
  totalResources: number;
  totalCandidates: number;
  resourceTypes: string[];
  qualifiers: string[];
}
