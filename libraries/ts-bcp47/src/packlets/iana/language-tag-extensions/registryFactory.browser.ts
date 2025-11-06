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

// Browser-safe factory functions for creating LanguageTagExtensionRegistry instances
// NOTE: This file re-implements createFromJson and createFromTxtContent from
// extensionsRegistry.ts without the Node.js filesystem dependencies.

import { Result, captureResult } from '@fgv/ts-utils';
import { RecordJar } from '@fgv/ts-extras';
import * as Converters from './converters';
import * as Model from './model';
import { TagExtensionsScope } from './extensionsScope';
import type { YearMonthDaySpec } from '../common/model';

// Browser-safe implementation of LanguageTagExtensionRegistry
// This class has the same structure as the original but without Node.js dependencies
// Note: We don't use 'implements' because TypeScript doesn't allow implementing classes with protected members
class BrowserLanguageTagExtensionRegistry {
  public readonly fileDate: YearMonthDaySpec;
  public readonly extensions: TagExtensionsScope = new TagExtensionsScope();
  // Note: This is protected in the original class, but we make it public here for type compatibility
  // since we're not extending the base class (to avoid pulling in Node.js dependencies)
  public readonly _all: Model.ILanguageTagExtension[];

  public constructor(registry: Model.LanguageTagExtensions) {
    this.fileDate = registry.fileDate;
    this._all = registry.entries;
    for (const entry of this._all) {
      this.extensions.add(entry).orThrow();
    }
  }
}

/**
 * Creates a LanguageTagExtensionRegistry from JSON data.
 * Browser-safe implementation that doesn't require Node.js filesystem access.
 * @param from - The JSON data to convert.
 * @returns A Result containing the created registry or an error.
 * @public
 */
export function createFromJson(from: unknown): Result<BrowserLanguageTagExtensionRegistry> {
  return Converters.languageTagExtensions.convert(from).onSuccess((registry) => {
    return captureResult(() => new BrowserLanguageTagExtensionRegistry(registry));
  });
}

/**
 * Creates a LanguageTagExtensionRegistry from IANA.org text format content.
 * Browser-safe implementation that doesn't require Node.js filesystem access.
 * @param content - The text content to parse.
 * @returns A Result containing the created registry or an error.
 * @public
 */
export function createFromTxtContent(content: string): Result<BrowserLanguageTagExtensionRegistry> {
  return RecordJar.parseRecordJarLines(content.split(/\r?\n/))
    .onSuccess((records) => Converters.languageTagExtensions.convert({ records }))
    .onSuccess((registry) => {
      return captureResult(() => new BrowserLanguageTagExtensionRegistry(registry));
    });
}
