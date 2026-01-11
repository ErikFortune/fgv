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
 * Confection class implementation
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  BaseConfectionId,
  ConfectionName,
  ConfectionType,
  ConfectionVersionSpec,
  ICategorizedUrl
} from '../common';
import { AnyConfectionVersion, ConfectionData, IConfectionBase } from './model';

// ============================================================================
// Confection Class
// ============================================================================

/**
 * Confection class with helper methods for version management.
 * Provides computed properties for effective tags/urls (merged base + version).
 * @public
 */
export class Confection implements IConfectionBase {
  public readonly baseId: BaseConfectionId;
  public readonly confectionType: ConfectionType;
  public readonly name: ConfectionName;
  public readonly description?: string;
  public readonly tags?: ReadonlyArray<string>;
  public readonly urls?: ReadonlyArray<ICategorizedUrl>;
  public readonly goldenVersionSpec: ConfectionVersionSpec;
  public readonly versions: ReadonlyArray<AnyConfectionVersion>;

  public readonly goldenVersion: AnyConfectionVersion;

  private constructor(data: ConfectionData, goldenVersion: AnyConfectionVersion) {
    this.baseId = data.baseId;
    this.confectionType = data.confectionType;
    this.name = data.name;
    this.description = data.description;
    this.tags = data.tags;
    this.urls = data.urls;
    this.goldenVersionSpec = data.goldenVersionSpec;
    this.versions = data.versions;
    this.goldenVersion = goldenVersion;
  }

  /**
   * Creates a Confection instance from confection data
   * @param data - Confection data
   * @returns Success with Confection instance, or Failure if golden version not found
   */
  public static create(data: ConfectionData): Result<Confection> {
    const goldenVersion = data.versions.find((v) => v.versionSpec === data.goldenVersionSpec);
    /* c8 ignore next 3 - defensive: converter validates golden version exists before calling create */
    if (!goldenVersion) {
      return Failure.with(`Golden version ${data.goldenVersionSpec} not found in confection ${data.baseId}`);
    }
    return Success.with(new Confection(data, goldenVersion));
  }

  /**
   * Gets a specific version by {@link ConfectionVersionSpec | version specifier}
   * @param versionSpec - The version specifier to find
   * @returns Success with version, or Failure if not found
   */
  public getVersion(versionSpec: ConfectionVersionSpec): Result<AnyConfectionVersion> {
    const version = this.versions.find((v) => v.versionSpec === versionSpec);
    if (!version) {
      return Failure.with(`Version ${versionSpec} not found in confection ${this.baseId}`);
    }
    return Success.with(version);
  }

  /**
   * Gets effective tags for a specific version (base tags + version's additional tags).
   * Tags are deduplicated while preserving order (base tags first).
   * @param version - The version to get effective tags for (defaults to golden version)
   * @returns Array of effective tags
   */
  public getEffectiveTags(version?: AnyConfectionVersion): ReadonlyArray<string> {
    const targetVersion = version ?? this.goldenVersion;
    const baseTags = this.tags ?? [];
    const versionTags = targetVersion.additionalTags ?? [];
    // Deduplicate while preserving order (base first)
    return [...new Set([...baseTags, ...versionTags])];
  }

  /**
   * Gets effective URLs for a specific version (base URLs + version's additional URLs).
   * @param version - The version to get effective URLs for (defaults to golden version)
   * @returns Array of effective URLs
   */
  public getEffectiveUrls(version?: AnyConfectionVersion): ReadonlyArray<ICategorizedUrl> {
    const targetVersion = version ?? this.goldenVersion;
    const baseUrls = this.urls ?? [];
    const versionUrls = targetVersion.additionalUrls ?? [];
    return [...baseUrls, ...versionUrls];
  }

  /**
   * Gets effective tags for the golden version.
   * Convenience property equivalent to getEffectiveTags(goldenVersion).
   */
  public get effectiveTags(): ReadonlyArray<string> {
    return this.getEffectiveTags(this.goldenVersion);
  }

  /**
   * Gets effective URLs for the golden version.
   * Convenience property equivalent to getEffectiveUrls(goldenVersion).
   */
  public get effectiveUrls(): ReadonlyArray<ICategorizedUrl> {
    return this.getEffectiveUrls(this.goldenVersion);
  }
}
