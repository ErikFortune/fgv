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

/**
 * Output format options for resource compilation
 */
export type OutputFormat = 'json' | 'js' | 'ts' | 'binary';

/**
 * Compilation mode options
 */
export type CompilationMode = 'development' | 'production';

/**
 * Options for resource compilation
 */
export interface ICompileOptions {
  /**
   * Input file or directory path
   */
  input: string;

  /**
   * Output file path
   */
  output: string;

  /**
   * Context filter for resources (e.g., '{"language": "en-US"}')
   */
  context?: string;

  /**
   * Output format
   */
  format: OutputFormat;

  /**
   * Compilation mode
   */
  mode: CompilationMode;

  /**
   * Whether to enable partial context matching
   */
  partialMatch: boolean;

  /**
   * Whether to include source maps
   */
  sourceMaps: boolean;

  /**
   * Whether to minify output
   */
  minify: boolean;

  /**
   * Whether to include debug information
   */
  debug: boolean;

  /**
   * Whether to run in verbose mode
   */
  verbose: boolean;

  /**
   * Whether to run in quiet mode
   */
  quiet: boolean;

  /**
   * Whether to validate resources during compilation
   */
  validate: boolean;

  /**
   * Whether to include resource metadata in output
   */
  includeMetadata: boolean;

  /**
   * Resource type filter (e.g., 'json,other')
   */
  resourceTypes?: string;

  /**
   * Maximum distance for language matching
   */
  maxDistance?: number;
}
