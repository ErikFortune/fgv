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

import { Result, succeed, Hash } from '@fgv/ts-utils';
import { ResourceManagerBuilder } from '../resources';
import {
  SystemConfiguration,
  PredefinedSystemConfiguration,
  getPredefinedSystemConfiguration
} from '../config';
import { IBundle, IBundleCreateParams, IBundleMetadata } from './model';
import { BundleNormalizer } from './bundleNormalizer';

/**
 * Builder for creating resource bundles from a ResourceManagerBuilder.
 * Handles the compilation, configuration extraction, and integrity verification
 * needed to create a complete, portable bundle.
 * @public
 */
export class BundleBuilder {
  /**
   * Creates a resource bundle from a ResourceManagerBuilder.
   * @param builder - The ResourceManagerBuilder containing the resources to bundle
   * @param systemConfig - The SystemConfiguration used to create the builder
   * @param params - Optional parameters for bundle creation
   * @returns Success with the created bundle if successful, Failure with error message otherwise
   * @public
   */
  public static create(
    builder: ResourceManagerBuilder,
    systemConfig: SystemConfiguration,
    params?: IBundleCreateParams
  ): Result<IBundle> {
    /* c8 ignore next 1 */
    params = params ?? {};
    const hashNormalizer = params.hashNormalizer ?? new Hash.Crc32Normalizer();

    // Determine which builder to use based on normalization setting
    const builderToUse = params.normalize
      ? BundleNormalizer.normalize(builder, systemConfig)
      : succeed(builder);

    return builderToUse.onSuccess((targetBuilder) => {
      return systemConfig.getConfig().onSuccess((config) => {
        return targetBuilder.getCompiledResourceCollection().onSuccess((compiledCollection) => {
          return BundleBuilder._generateChecksum(compiledCollection, hashNormalizer).onSuccess((checksum) => {
            const dateBuilt = params.dateBuilt ?? new Date().toISOString();

            const metadata: IBundleMetadata = {
              dateBuilt,
              checksum,
              version: params.version,
              description: params.description
            };

            const bundle: IBundle = {
              metadata,
              config,
              compiledCollection
            };

            return succeed(bundle);
          });
        });
      });
    });
  }

  /**
   * Creates a resource bundle from a ResourceManagerBuilder using a predefined system configuration.
   * This is a convenience method for the common case of using predefined configurations.
   * @param builder - The ResourceManagerBuilder containing the resources to bundle
   * @param configName - The name of the predefined system configuration used
   * @param params - Optional parameters for bundle creation
   * @returns Success with the created bundle if successful, Failure with error message otherwise
   * @public
   */
  public static createFromPredefined(
    builder: ResourceManagerBuilder,
    configName: PredefinedSystemConfiguration,
    params?: IBundleCreateParams
  ): Result<IBundle> {
    /* c8 ignore next 1 */
    params = params ?? {};
    const hashNormalizer = params.hashNormalizer ?? new Hash.Crc32Normalizer();

    // Determine which builder to use based on normalization setting
    const builderToUse = params.normalize
      ? BundleNormalizer.normalizeFromPredefined(builder, configName)
      : succeed(builder);

    return builderToUse.onSuccess((targetBuilder) => {
      return getPredefinedSystemConfiguration(configName).onSuccess((systemConfig) => {
        return systemConfig.getConfig().onSuccess((config) => {
          return targetBuilder.getCompiledResourceCollection().onSuccess((compiledCollection) => {
            return BundleBuilder._generateChecksum(compiledCollection, hashNormalizer).onSuccess(
              (checksum) => {
                const dateBuilt = params.dateBuilt ?? new Date().toISOString();

                const metadata: IBundleMetadata = {
                  dateBuilt,
                  checksum,
                  version: params.version,
                  description: params?.description
                };

                const bundle: IBundle = {
                  metadata,
                  config,
                  compiledCollection
                };

                return succeed(bundle);
              }
            );
          });
        });
      });
    });
  }

  /**
   * Generates a hash checksum for the compiled resource collection.
   * The checksum is calculated using the provided hash normalizer.
   * @param compiledCollection - The compiled resource collection to generate checksum for
   * @param hashNormalizer - The hash normalizer to use for checksum generation
   * @returns Success with the checksum string if successful, Failure otherwise
   * @internal
   */
  private static _generateChecksum(
    compiledCollection: unknown,
    hashNormalizer: Hash.HashingNormalizer
  ): Result<string> {
    return hashNormalizer.computeHash(compiledCollection);
  }
}
