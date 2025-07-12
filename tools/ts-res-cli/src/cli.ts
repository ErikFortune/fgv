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
import { ICompileOptions, OutputFormat, CompilationMode } from './options';

/**
 * Command-line options for the compile command
 */
interface ICompileCommandOptions {
  input: string;
  output: string;
  context?: string;
  format: string;
  mode: string;
  partialMatch?: boolean;
  sourceMaps?: boolean;
  minify?: boolean;
  debug?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  validate?: boolean;
  includeMetadata?: boolean;
  resourceTypes?: string;
  maxDistance?: number;
}

/**
 * Command-line options for the validate command
 */
interface IValidateCommandOptions {
  input: string;
  verbose?: boolean;
  quiet?: boolean;
}

/**
 * Command-line options for the info command
 */
interface IInfoCommandOptions {
  input: string;
  context?: string;
  partialMatch?: boolean;
  resourceTypes?: string;
  maxDistance?: number;
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
      .option('-c, --context <json>', 'Context filter for resources (JSON string)')
      .option('-f, --format <format>', 'Output format', 'compiled')
      .option('-m, --mode <mode>', 'Compilation mode', 'development')
      .option('--partial-match', 'Enable partial context matching', false)
      .option('--source-maps', 'Include source maps', false)
      .option('--minify', 'Minify output', false)
      .option('--debug', 'Include debug information', false)
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Quiet output', false)
      .option('--validate', 'Validate resources during compilation', true)
      .option('--include-metadata', 'Include resource metadata in output', false)
      .option('--resource-types <types>', 'Resource type filter (comma-separated)')
      .option('--max-distance <number>', 'Maximum distance for language matching', parseInt)
      .action(async (options) => {
        await this._handleCompileCommand(options);
      });

    this._program
      .command('validate')
      .description('Validate resources without compilation')
      .requiredOption('-i, --input <path>', 'Input file or directory path')
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Quiet output', false)
      .action(async (options) => {
        await this._handleValidateCommand(options);
      });

    this._program
      .command('info')
      .description('Show information about resources')
      .requiredOption('-i, --input <path>', 'Input file or directory path')
      .option('-c, --context <json>', 'Context filter for resources (JSON string)')
      .option('--partial-match', 'Enable partial context matching', false)
      .option('--resource-types <types>', 'Resource type filter (comma-separated)')
      .option('--max-distance <number>', 'Maximum distance for language matching', parseInt)
      .action(async (options) => {
        await this._handleInfoCommand(options);
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

    if (!options.quiet) {
      console.log(`Successfully compiled resources to ${options.output}`);
    }
  }

  /**
   * Handles the validate command
   */
  private async _handleValidateCommand(options: IValidateCommandOptions): Promise<void> {
    const validateOptions: ICompileOptions = {
      input: options.input,
      output: '', // Not used for validation
      format: 'compiled',
      mode: 'development',
      partialMatch: false,
      sourceMaps: false,
      minify: false,
      debug: false,
      verbose: options.verbose || false,
      quiet: options.quiet || false,
      validate: true,
      includeMetadata: false
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
    const infoOptions: ICompileOptions = {
      input: options.input,
      output: '', // Not used for info
      format: 'compiled',
      mode: 'development',
      partialMatch: options.partialMatch || false,
      sourceMaps: false,
      minify: false,
      debug: false,
      verbose: true,
      quiet: false,
      validate: false,
      includeMetadata: true,
      context: options.context,
      resourceTypes: options.resourceTypes,
      maxDistance: options.maxDistance
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
   * Parses and validates compile options
   */
  private _parseCompileOptions(options: ICompileCommandOptions): Result<ICompileOptions> {
    try {
      const format = options.format as OutputFormat;
      if (!['compiled', 'source', 'js', 'ts', 'binary'].includes(format)) {
        return fail(`Invalid format: ${format}`);
      }

      const mode = options.mode as CompilationMode;
      if (!['development', 'production'].includes(mode)) {
        return fail(`Invalid mode: ${mode}`);
      }

      const compileOptions: ICompileOptions = {
        input: options.input,
        output: options.output,
        context: options.context,
        format,
        mode,
        partialMatch: options.partialMatch || false,
        sourceMaps: options.sourceMaps || false,
        minify: options.minify || false,
        debug: options.debug || false,
        verbose: options.verbose || false,
        quiet: options.quiet || false,
        validate: options.validate !== false,
        includeMetadata: options.includeMetadata || false,
        resourceTypes: options.resourceTypes,
        maxDistance: options.maxDistance
      };

      return succeed(compileOptions);
    } catch (error) {
      return fail(`Failed to parse options: ${error}`);
    }
  }
}
