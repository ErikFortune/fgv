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
 * Output format options for CLI commands
 */
export type OutputFormat = 'json' | 'yaml' | 'table' | 'human';

/**
 * Data source options shared across entity subcommands
 */
export interface IDataSourceOptions {
  /**
   * File paths to additional libraries (can be repeated)
   */
  library?: string[];

  /**
   * Exclude built-in data
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
 * Base options shared by all entity subcommands
 */
export interface IEntityBaseOptions extends IDataSourceOptions {
  /**
   * Output format
   */
  format?: OutputFormat;
}

/**
 * Common list options for filtering
 */
export interface IEntityListOptions extends IEntityBaseOptions {
  /**
   * Filter by tag (can be repeated, AND logic)
   */
  tag?: string[];

  /**
   * Filter by source collection ID
   */
  collection?: string;

  /**
   * Filter by name (case-insensitive substring match)
   */
  name?: string;
}
