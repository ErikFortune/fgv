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
 * Options for launching the ts-res browser
 */
export interface IBrowseOptions {
  /**
   * Input file or directory path
   */
  input?: string;

  /**
   * System configuration file path (JSON file in ISystemConfiguration format)
   * or predefined configuration name
   */
  config?: string;

  /**
   * Context filter token (pipe-separated qualifier=value pairs, e.g., 'language=en-US|territory=US')
   */
  contextFilter?: string;

  /**
   * Qualifier default values token (pipe-separated qualifier=value pairs, e.g., 'language=en-US,en-CA|territory=US')
   */
  qualifierDefaults?: string;

  /**
   * Resource types filter (comma-separated, e.g., 'json,string')
   */
  resourceTypes?: string;

  /**
   * Maximum distance for language matching
   */
  maxDistance?: number;

  /**
   * Whether to reduce qualifiers when filtering by context
   */
  reduceQualifiers?: boolean;

  /**
   * Whether to run in verbose mode
   */
  verbose?: boolean;

  /**
   * Whether to run in quiet mode
   */
  quiet?: boolean;

  /**
   * Port to run the development server on (for launching locally)
   */
  port?: number;

  /**
   * Whether to open the browser automatically
   */
  open?: boolean;

  /**
   * Whether to launch in interactive mode (with sample data)
   */
  interactive?: boolean;

  /**
   * Browser URL to launch (for remote instances)
   */
  url?: string;

  /**
   * Whether to automatically start the development server
   */
  dev?: boolean;

  /**
   * Whether to use ZIP loading mode (internal flag)
   */
  loadZip?: boolean;

  /**
   * Path to ZIP file to load (internal flag)
   */
  zipPath?: string;

  /**
   * Name of ZIP file to load (internal flag)
   */
  zipFile?: string;
}

/**
 * Command-line options for the browse command
 */
export interface IBrowseCommandOptions {
  input?: string;
  config?: string;
  context?: string;
  contextFilter?: string;
  qualifierDefaults?: string;
  resourceTypes?: string;
  maxDistance?: number;
  reduceQualifiers?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  port?: number;
  open?: boolean;
  interactive?: boolean;
  url?: string;
  dev?: boolean;
}
