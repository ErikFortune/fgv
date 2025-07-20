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
import { Result, succeed, fail } from '@fgv/ts-utils';
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
      .option('-f, --format <format>', 'Output format', 'compiled')
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
   * Parses and validates compile options
   */
  private _parseCompileOptions(options: ICompileCommandOptions): Result<ICompileOptions> {
    try {
      const format = options.format as OutputFormat;
      if (!['compiled', 'source', 'js', 'ts', 'binary'].includes(format)) {
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
}
