/*
 * Copyright (c) 2022 Erik Fortune
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

import { Result, captureResult } from '@fgv/ts-utils';

import { LanguageSubtagRegistry } from './language-subtags';
import { LanguageTagExtensionRegistry } from './language-tag-extensions';
import * as LanguageRegistriesLoader from './languageRegistriesLoader';
import { getIanaDataBuffer } from './iana-data-embedded';

/**
 * @public
 */
export class LanguageRegistries {
  public readonly subtags: LanguageSubtagRegistry;
  public readonly extensions: LanguageTagExtensionRegistry;
  private constructor(subtags: LanguageSubtagRegistry, extensions: LanguageTagExtensionRegistry) {
    this.subtags = subtags;
    this.extensions = extensions;
  }

  public static create(
    subtags: LanguageSubtagRegistry,
    extensions: LanguageTagExtensionRegistry
  ): Result<LanguageRegistries> {
    return captureResult(() => new LanguageRegistries(subtags, extensions));
  }

  public static loadDefault(): Result<LanguageRegistries> {
    return LanguageSubtagRegistry.loadDefault().onSuccess((subtags) => {
      return LanguageTagExtensionRegistry.loadDefault().onSuccess((extensions) => {
        return LanguageRegistries.create(subtags, extensions);
      });
    });
  }

  /**
   * Loads language registries with preferred compressed format, falling back to individual files.
   * This method uses embedded compressed ZIP data that works in both Node.js and browser environments
   * without requiring polyfills, then falls back to individual JSON files if decompression fails.
   * @returns A Result containing the loaded LanguageRegistries or an error.
   * @public
   */
  public static loadDefaultCompressed(): Result<LanguageRegistries> {
    return captureResult(() => {
      // Try to load from the embedded compressed ZIP data (browser-safe)
      const zipBuffer = getIanaDataBuffer();
      const zipResult = LanguageRegistriesLoader.loadLanguageRegistriesFromZipBuffer(zipBuffer);

      if (zipResult.isSuccess()) {
        return zipResult.orThrow();
      }

      // Fall back to individual JSON files if ZIP decompression fails
      return LanguageRegistries.loadDefault().orThrow();
    });
  }

  /**
   * Loads language registries from the IANA.org online registries.
   * @returns A Promise with a Result containing the loaded LanguageRegistries or an error.
   * @public
   */
  public static loadFromIanaOrg(): Promise<Result<LanguageRegistries>> {
    return LanguageRegistriesLoader.loadLanguageRegistriesFromIanaOrg();
  }

  /**
   * Loads language registries from custom URLs.
   * @param subtagsUrl - URL to the language subtags registry.
   * @param extensionsUrl - URL to the language tag extensions registry.
   * @returns A Promise with a Result containing the loaded LanguageRegistries or an error.
   * @public
   */
  public static loadFromUrls(subtagsUrl: string, extensionsUrl: string): Promise<Result<LanguageRegistries>> {
    return LanguageRegistriesLoader.loadLanguageRegistriesFromUrls(subtagsUrl, extensionsUrl);
  }

  /**
   * Loads language registries from a compressed ZIP file.
   * @param zipPath - Path to the ZIP file containing the registry data.
   * @returns A Result containing the loaded LanguageRegistries or an error.
   * @public
   */
  public static loadFromZip(zipPath: string): Result<LanguageRegistries> {
    return LanguageRegistriesLoader.loadLanguageRegistriesFromZip(zipPath);
  }

  /**
   * Loads language registries from a compressed ZIP buffer (web-compatible).
   * @param zipBuffer - ArrayBuffer or Uint8Array containing the ZIP file data.
   * @returns A Result containing the loaded LanguageRegistries or an error.
   * @public
   */
  public static loadFromZipBuffer(zipBuffer: ArrayBuffer | Uint8Array): Result<LanguageRegistries> {
    return LanguageRegistriesLoader.loadLanguageRegistriesFromZipBuffer(zipBuffer);
  }
}
