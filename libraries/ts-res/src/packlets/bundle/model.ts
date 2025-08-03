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

import { Hash } from '@fgv/ts-utils';
import { Model as ConfigModel } from '../config';
import { Compiled as ResourceJsonCompiled } from '../resource-json';

/**
 * Metadata for a resource bundle, including build information and integrity verification.
 * @public
 */
export interface IBundleMetadata {
  /**
   * ISO timestamp indicating when the bundle was built.
   */
  dateBuilt: string;

  /**
   * SHA-256 checksum of the serialized compiled resource collection for integrity verification.
   */
  checksum: string;

  /**
   * Optional version identifier for the bundle.
   */
  version?: string;

  /**
   * Optional human-readable description of the bundle.
   */
  description?: string;
}

/**
 * A complete resource bundle that encapsulates built resources, configuration, and metadata.
 * Bundles provide a portable, integrity-verified way to distribute pre-compiled resource collections.
 * @public
 */
export interface IBundle {
  /**
   * Metadata about the bundle including build date and integrity checksum.
   */
  metadata: IBundleMetadata;

  /**
   * The system configuration that was used to build the resources in this bundle.
   */
  config: ConfigModel.ISystemConfiguration;

  /**
   * The compiled resource collection containing all resources, conditions, and decisions.
   */
  compiledCollection: ResourceJsonCompiled.ICompiledResourceCollection;
}

/**
 * Optional parameters for bundle creation.
 * @public
 */
export interface IBundleCreateParams {
  /**
   * Optional version identifier to include in the bundle metadata.
   */
  version?: string;

  /**
   * Optional description to include in the bundle metadata.
   */
  description?: string;

  /**
   * Optional custom build date. If not provided, the current date will be used.
   */
  dateBuilt?: string;

  /**
   * Optional hash normalizer for generating checksums. If not provided,
   * a CRC32 normalizer will be used for browser compatibility.
   */
  hashNormalizer?: Hash.HashingNormalizer;
}
