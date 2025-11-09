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
import * as TsRes from '@fgv/ts-res';
import { promises as fs } from 'fs';
import * as path from 'path';

import { IBrowseOptions, IBrowseCommandOptions, IConfigCommandOptions } from './options';
import { SimpleBrowserLauncher } from './simpleBrowserLauncher';

/**
 * Main CLI class for ts-res-browser-cli
 */
export class TsResBrowserCliApp {
  private readonly _program: Command;
  private readonly _launcher: SimpleBrowserLauncher;

  public constructor() {
    this._program = new Command();
    this._launcher = new SimpleBrowserLauncher();
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
      .name('ts-res-browser-cli')
      .description('Launch ts-res-browser with specified resources and configuration')
      .version('1.0.0');

    // Default behavior (no command) - launch with options or show help
    this._program
      .option('-i, --input <path>', 'Input file or directory path')
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
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Quiet output', false)
      .option('-p, --port <number>', 'Port for local browser instance', parseInt)
      .option('--url <url>', 'URL of remote browser instance')
      .option('--no-open', 'Do not open browser automatically')
      .option('--interactive', 'Launch in interactive mode with sample data', false)
      .option('--dev', 'Automatically start development server locally', false)
      .option(
        '--serve',
        'Start server (dev in monorepo, serve in published packages) and connect automatically',
        false
      )
      .action(async (options) => {
        // If no options provided, show help
        if (!this._hasOptions(options)) {
          this._program.help();
        } else {
          await this._handleBrowseCommand(options);
        }
      });

    // Browse command (explicit)
    this._program
      .command('browse')
      .description('Launch browser with specified resources and configuration')
      .option('-i, --input <path>', 'Input file or directory path')
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
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Quiet output', false)
      .option('-p, --port <number>', 'Port for local browser instance', parseInt)
      .option('--url <url>', 'URL of remote browser instance')
      .option('--no-open', 'Do not open browser automatically')
      .option('--interactive', 'Launch in interactive mode with sample data', false)
      .option('--dev', 'Automatically start development server locally', false)
      .option(
        '--serve',
        'Start server (dev in monorepo, serve in published packages) and connect automatically',
        false
      )
      .action(async (options) => {
        await this._handleBrowseCommand(options);
      });

    // Config command (similar to ts-res-cli)
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
   * Check if any meaningful options were provided
   */
  private _hasOptions(options: IBrowseCommandOptions): boolean {
    return !!(
      options.input ||
      options.config ||
      options.context ||
      options.contextFilter ||
      options.qualifierDefaults ||
      options.resourceTypes ||
      options.maxDistance !== undefined ||
      options.reduceQualifiers ||
      options.interactive ||
      options.url ||
      options.dev ||
      options.serve
    );
  }

  /**
   * Handles the browse command
   */
  private async _handleBrowseCommand(options: IBrowseCommandOptions): Promise<void> {
    const browseOptions = this._parseBrowseOptions(options);
    if (browseOptions.isFailure()) {
      console.error(`Error: ${browseOptions.message}`);
      process.exit(1);
    }

    const result = await this._launcher.launch(browseOptions.value);
    if (result.isFailure()) {
      console.error(`Error: ${result.message}`);
      process.exit(1);
    }
  }

  /**
   * Handles the config command (similar to ts-res-cli)
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

      console.log(JSON.stringify(defaultResult.value, null, 2));
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Parses and validates browse options
   */
  private _parseBrowseOptions(options: IBrowseCommandOptions): Result<IBrowseOptions> {
    try {
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

      const browseOptions: IBrowseOptions = {
        input: options.input,
        config: options.config,
        contextFilter,
        qualifierDefaults: options.qualifierDefaults,
        resourceTypes: options.resourceTypes,
        maxDistance: options.maxDistance,
        reduceQualifiers: options.reduceQualifiers || false,
        verbose: options.verbose || false,
        quiet: options.quiet || false,
        port: options.port,
        url: options.url,
        open: options.open,
        interactive: options.interactive || false,
        dev: options.dev || false,
        serve: options.serve || false
      };

      return succeed(browseOptions);
    } catch (error) {
      return fail(`Failed to parse options: ${error}`);
    }
  }
}
