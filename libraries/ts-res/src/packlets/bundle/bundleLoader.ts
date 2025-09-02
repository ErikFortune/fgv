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

import { Result, succeed, fail, Collections, Hash } from '@fgv/ts-utils';
import { CompiledResourceCollection, IResourceManager } from '../runtime';
import { SystemConfiguration } from '../config';
import { ResourceType } from '../resource-types';
import { QualifierType } from '../qualifier-types';
import { IBundle } from './model';

/**
 * Parameters for creating a BundleLoader.
 * @public
 */
export interface IBundleLoaderCreateParams {
  /**
   * The bundle to load.
   */
  bundle: IBundle;

  /**
   * Whether to skip checksum verification during loading.
   * Default is false - checksum verification is performed.
   */
  skipChecksumVerification?: boolean;

  /**
   * Optional hash normalizer for verifying checksums. If not provided,
   * a CRC32 normalizer will be used for browser compatibility.
   * Must match the normalizer used during bundle creation.
   */
  hashNormalizer?: Hash.HashingNormalizer;
}

/**
 * Loader for creating an IResourceManager from a resource bundle.
 * Handles integrity verification and reconstruction of the runtime resource manager.
 * @public
 */
export class BundleLoader {
  /**
   * Creates an IResourceManager from a resource bundle.
   * @param params - Parameters for bundle loading including the bundle and options
   * @returns Success with the IResourceManager if successful, Failure with error message otherwise
   * @public
   */
  public static createManagerFromBundle(params: IBundleLoaderCreateParams): Result<IResourceManager> {
    /* c8 ignore next 1 - defense in depth */
    const hashNormalizer = params.hashNormalizer ?? new Hash.Crc32Normalizer();

    return BundleLoader._verifyBundleIntegrity(
      params.bundle,
      params.skipChecksumVerification ?? false,
      hashNormalizer
    ).onSuccess(() => {
      return BundleLoader._createSystemConfiguration(params.bundle).onSuccess((systemConfig) => {
        return BundleLoader._createCompiledResourceCollection(
          params.bundle,
          systemConfig.qualifierTypes,
          systemConfig.resourceTypes
        );
      });
    });
  }

  /**
   * Verifies the integrity of a bundle by checking its checksum.
   * @param bundle - The bundle to verify
   * @param skipVerification - Whether to skip verification
   * @param hashNormalizer - The hash normalizer to use for verification
   * @returns Success if verification passes or is skipped, Failure otherwise
   * @internal
   */
  private static _verifyBundleIntegrity(
    bundle: IBundle,
    skipVerification: boolean,
    hashNormalizer: Hash.HashingNormalizer
  ): Result<boolean> {
    if (skipVerification) {
      return succeed(true);
    }

    return BundleLoader._generateChecksum(bundle.compiledCollection, hashNormalizer).onSuccess(
      (calculatedChecksum) => {
        if (calculatedChecksum !== bundle.metadata.checksum) {
          return fail(
            `Bundle integrity verification failed: expected checksum ${bundle.metadata.checksum}, got ${calculatedChecksum}`
          );
        }
        return succeed(true);
      }
    );
  }

  /**
   * Generates a hash checksum for the compiled resource collection.
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

  /**
   * Creates a SystemConfiguration from the bundle's configuration.
   * @param bundle - The bundle containing the configuration
   * @returns Success with the SystemConfiguration if successful, Failure otherwise
   * @internal
   */
  private static _createSystemConfiguration(bundle: IBundle): Result<SystemConfiguration> {
    return SystemConfiguration.create(bundle.config);
  }

  /**
   * Creates a CompiledResourceCollection from the bundle.
   * @param bundle - The bundle to load
   * @param qualifierTypes - The qualifier type collector from the system configuration
   * @param resourceTypes - The resource type collector from the system configuration
   * @returns Success with the CompiledResourceCollection if successful, Failure otherwise
   * @internal
   */
  private static _createCompiledResourceCollection(
    bundle: IBundle,
    qualifierTypes: Collections.IReadOnlyResultMap<string, QualifierType>,
    resourceTypes: Collections.IReadOnlyResultMap<string, ResourceType>
  ): Result<CompiledResourceCollection> {
    return CompiledResourceCollection.create({
      compiledCollection: bundle.compiledCollection,
      qualifierTypes,
      resourceTypes
    });
  }
}
