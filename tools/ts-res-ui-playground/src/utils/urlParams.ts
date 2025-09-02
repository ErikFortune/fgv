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
 * Configuration options that can be passed via URL parameters
 */
export interface IUrlConfigOptions {
  /**
   * Input file path
   */
  input?: string;

  /**
   * Configuration name or path
   */
  config?: string;

  /**
   * Context filter token (pipe-separated)
   */
  contextFilter?: string;

  /**
   * Qualifier defaults token (pipe-separated)
   */
  qualifierDefaults?: string;

  /**
   * Resource types filter (comma-separated)
   */
  resourceTypes?: string;

  /**
   * Maximum distance for language matching
   */
  maxDistance?: number;

  /**
   * Whether to reduce qualifiers
   */
  reduceQualifiers?: boolean;

  /**
   * Whether to launch in interactive mode
   */
  interactive?: boolean;

  /**
   * Starting directory for input file picker (derived from input path)
   */
  inputStartDir?: string;

  /**
   * Starting directory for config file picker (derived from config path)
   */
  configStartDir?: string;

  /**
   * Whether to use ZIP loading mode
   */
  loadZip?: boolean;

  /**
   * Path to ZIP file to load (for CLI-generated ZIPs)
   */
  zipPath?: string;

  /**
   * Name of ZIP file to load from Downloads (filename only)
   */
  zipFile?: string;
}

/**
 * Parses URL parameters and extracts configuration options
 */
export function parseUrlParameters(): IUrlConfigOptions {
  const params = new URLSearchParams(window.location.search);

  const options: IUrlConfigOptions = {};

  // Parse string parameters
  const input = params.get('input');
  if (input) {
    options.input = input;
    // Set starting directory for input file picker
    if (isFilePath(input)) {
      options.inputStartDir = extractDirectoryPath(input);
    }
  }

  const config = params.get('config');
  if (config) {
    options.config = config;
    // Set starting directory for config file picker
    if (isFilePath(config)) {
      options.configStartDir = extractDirectoryPath(config);
    }
  }

  const contextFilter = params.get('contextFilter');
  if (contextFilter) options.contextFilter = contextFilter;

  const qualifierDefaults = params.get('qualifierDefaults');
  if (qualifierDefaults) options.qualifierDefaults = qualifierDefaults;

  const resourceTypes = params.get('resourceTypes');
  if (resourceTypes) options.resourceTypes = resourceTypes;

  // Parse numeric parameters
  const maxDistance = params.get('maxDistance');
  if (maxDistance) {
    const parsed = parseInt(maxDistance, 10);
    if (!isNaN(parsed)) options.maxDistance = parsed;
  }

  // Parse boolean parameters
  const reduceQualifiers = params.get('reduceQualifiers');
  if (reduceQualifiers === 'true') options.reduceQualifiers = true;

  const interactive = params.get('interactive');
  if (interactive === 'true') options.interactive = true;

  // Parse ZIP loading parameters
  const loadZip = params.get('loadZip');
  if (loadZip === 'true') options.loadZip = true;

  const zipPath = params.get('zipPath');
  if (zipPath) options.zipPath = zipPath;

  const zipFile = params.get('zipFile');
  if (zipFile) options.zipFile = zipFile;

  return options;
}

/**
 * Converts context filter token to context object
 * Example: "language=en-US|territory=US" -> { language: "en-US", territory: "US" }
 */
export function parseContextFilter(contextFilter: string): Record<string, string> {
  const context: Record<string, string> = {};

  const tokens = contextFilter.split('|');
  for (const token of tokens) {
    const [key, value] = token.split('=');
    if (key && value) {
      context[key.trim()] = value.trim();
    }
  }

  return context;
}

/**
 * Converts qualifier defaults token to structured format
 * Example: "language=en-US,en-CA|territory=US" -> { language: ["en-US", "en-CA"], territory: ["US"] }
 */
export function parseQualifierDefaults(qualifierDefaults: string): Record<string, string[]> {
  const defaults: Record<string, string[]> = {};

  const tokens = qualifierDefaults.split('|');
  for (const token of tokens) {
    const [key, values] = token.split('=');
    if (key && values) {
      defaults[key.trim()] = values.split(',').map((v) => v.trim());
    }
  }

  return defaults;
}

/**
 * Converts resource types string to array
 * Example: "json,string" -> ["json", "string"]
 */
export function parseResourceTypes(resourceTypes: string): string[] {
  return resourceTypes
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Extracts the directory path from a file or directory path
 * If the path appears to be a directory (no extension), returns it as-is
 * If the path appears to be a file, returns the parent directory
 */
export function extractDirectoryPath(path: string): string {
  if (!path) return '';

  // Normalize path separators
  const normalizedPath = path.replace(/\\/g, '/');

  // Check if it looks like a file (has an extension)
  const parts = normalizedPath.split('/');
  const lastPart = parts[parts.length - 1];

  // If the last part has an extension, treat as file and return directory
  if (lastPart.includes('.') && !lastPart.startsWith('.')) {
    return parts.slice(0, -1).join('/') || '/';
  }

  // Otherwise, treat as directory
  return normalizedPath;
}

/**
 * Determines if a path appears to be a file (has extension) or directory
 */
export function isFilePath(path: string): boolean {
  if (!path) return false;

  const parts = path.split('/');
  const lastPart = parts[parts.length - 1];

  // Has extension and doesn't start with dot (hidden files)
  return lastPart.includes('.') && !lastPart.startsWith('.');
}
