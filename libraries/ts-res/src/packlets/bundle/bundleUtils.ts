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

import { Result, succeed, fail } from '@fgv/ts-utils';
import { SystemConfiguration } from '../config';
import { Compiled as ResourceJsonCompiled } from '../resource-json';
import { IBundleMetadata } from './model';
import { bundle as bundleConverter } from './convert';

/**
 * Components extracted from a bundle for reuse in different contexts.
 * @public
 */
export interface IBundleComponents {
  /**
   * The system configuration from the bundle.
   */
  systemConfiguration: SystemConfiguration;

  /**
   * The compiled resource collection from the bundle.
   */
  compiledCollection: ResourceJsonCompiled.ICompiledResourceCollection;

  /**
   * The bundle metadata including build information.
   */
  metadata: IBundleMetadata;
}

/**
 * Utility functions for working with resource bundles.
 * Provides reusable logic for bundle detection, parsing, and component extraction.
 * @public
 */
export class BundleUtils {
  /**
   * Checks if the given object appears to be a bundle file by examining its structure.
   * This is a lightweight check that doesn't perform full validation.
   * @param data - The data to check
   * @returns True if the data appears to be a bundle structure
   * @public
   */
  public static isBundleFile(data: unknown): boolean {
    return bundleConverter.convert(data).isSuccess();
  }

  /**
   * Extracts and validates components from a bundle for reuse.
   * Performs full validation of the bundle structure and creates typed components.
   * @param bundleData - The raw bundle data to extract components from
   * @returns Success with bundle components if valid, Failure with error message otherwise
   * @public
   */
  public static extractBundleComponents(bundleData: unknown): Result<IBundleComponents> {
    // First validate and convert the bundle
    const bundleResult = bundleConverter.convert(bundleData);
    if (bundleResult.isFailure()) {
      return fail(`Invalid bundle structure: ${bundleResult.message}`);
    }

    const bundle = bundleResult.value;

    // Create SystemConfiguration from the bundle config
    const systemConfigResult = SystemConfiguration.create(bundle.config);
    if (systemConfigResult.isFailure()) {
      return fail(`Invalid system configuration in bundle: ${systemConfigResult.message}`);
    }

    const systemConfiguration = systemConfigResult.value;

    return succeed({
      systemConfiguration,
      compiledCollection: bundle.compiledCollection,
      metadata: bundle.metadata
    });
  }

  /**
   * Extracts just the metadata from potential bundle data without full validation.
   * Useful for displaying bundle information without processing the entire bundle.
   * @param data - The data to extract metadata from
   * @returns Success with metadata if found and valid, Failure otherwise
   * @public
   */
  public static extractBundleMetadata(data: unknown): Result<IBundleMetadata> {
    return bundleConverter
      .convert(data)
      .onSuccess((bundle) => {
        return succeed(bundle.metadata);
      })
      .withErrorFormat((err) => {
        return `Not a bundle file: ${err}`;
      });
  }

  /**
   * Parses bundle data from a JSON string.
   * Convenience method that combines JSON parsing with bundle component extraction.
   * @param jsonString - The JSON string containing bundle data
   * @returns Success with bundle components if valid, Failure with error message otherwise
   * @public
   */
  public static parseBundleFromJson(jsonString: string): Result<IBundleComponents> {
    try {
      const data = JSON.parse(jsonString);
      return BundleUtils.extractBundleComponents(data);
    } catch (error) {
      return fail(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Checks if a file name suggests it might be a bundle file.
   * This is a heuristic check based on file naming conventions.
   * @param fileName - The file name to check
   * @returns True if the file name suggests a bundle file
   * @public
   */
  public static isBundleFileName(fileName: string): boolean {
    const lowerName = fileName.toLowerCase();
    return (
      lowerName.endsWith('.bundle.json') ||
      lowerName.endsWith('-bundle.json') ||
      lowerName.endsWith('_bundle.json') ||
      (lowerName.includes('bundle') && lowerName.endsWith('.json'))
    );
  }
}
