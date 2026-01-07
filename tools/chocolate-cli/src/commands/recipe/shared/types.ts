// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Output format options for recipe commands
 */
export type OutputFormat = 'json' | 'yaml' | 'table' | 'human';

/**
 * Data source options shared across recipe subcommands
 */
export interface IDataSourceOptions {
  /**
   * File paths to additional recipe libraries (can be repeated)
   */
  library?: string[];

  /**
   * Exclude built-in recipes
   */
  noBuiltin?: boolean;

  /**
   * Base64-encoded encryption key for single-key mode
   */
  key?: string;

  /**
   * Secret name for single-key mode
   */
  secretName?: string;

  /**
   * Path to secrets file (YAML/JSON) mapping secret names to base64 keys
   */
  secretsFile?: string;
}

/**
 * Base options shared by all recipe subcommands
 */
export interface IRecipeBaseOptions extends IDataSourceOptions {
  /**
   * Output format
   */
  format?: OutputFormat;
}

/**
 * Options for the recipe list command
 */
export interface IRecipeListOptions extends IRecipeBaseOptions {
  /**
   * Filter by tag (can be repeated, AND logic)
   */
  tag?: string[];

  /**
   * Filter by source collection ID
   */
  source?: string;

  /**
   * Filter by name (case-insensitive substring match)
   */
  name?: string;
}

/**
 * Options for the recipe show command
 */
export interface IRecipeShowOptions extends IRecipeBaseOptions {
  /**
   * Specific version to show (default: golden)
   */
  version?: string;

  /**
   * Scale target: weight in grams or multiplier with 'x' suffix
   */
  scale?: string;

  /**
   * Decimal places for scaled amounts (default: 1)
   */
  precision?: string;
}
