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

import * as Model from '../../iana/language-tag-extensions/model';
import * as Converters from './converters';
import * as JarConverters from './jarConverters';

import { Result, captureResult } from '@fgv/ts-utils';

// eslint-disable-next-line @rushstack/packlets/mechanics
import defaultExtensions from '../../../data/iana/language-tag-extensions.json';
import { YearMonthDaySpec } from '../model';
import { TagExtensionsScope } from './extensionsScope';
/**
 * @public
 */
export class LanguageTagExtensionRegistry {
  public readonly fileDate: YearMonthDaySpec;
  public readonly extensions: TagExtensionsScope = new TagExtensionsScope();

  /**
   * @internal
   */
  protected readonly _all: Model.ILanguageTagExtension[];

  /**
   * Constructs an {@link Iana.LanguageTagExtensions.LanguageTagExtensionRegistry}.
   * @param registry - Registry file from which the registry is to be constructed.
   * @internal
   */
  protected constructor(registry: Model.LanguageTagExtensions) {
    this.fileDate = registry.fileDate;
    this._all = registry.entries;
    for (const entry of this._all) {
      this.extensions.add(entry).orThrow();
    }
  }

  public static create(registry: Model.LanguageTagExtensions): Result<LanguageTagExtensionRegistry> {
    return captureResult(() => {
      return new LanguageTagExtensionRegistry(registry);
    });
  }

  public static createFromJson(from: unknown): Result<LanguageTagExtensionRegistry> {
    return Converters.languageTagExtensions.convert(from).onSuccess(LanguageTagExtensionRegistry.create);
  }

  public static loadDefault(): Result<LanguageTagExtensionRegistry> {
    return this.createFromJson(defaultExtensions);
  }

  public static load(path: string): Result<LanguageTagExtensionRegistry> {
    return captureResult(() => {
      const registry = Converters.loadLanguageTagExtensionsJsonFileSync(path).orThrow();
      return new LanguageTagExtensionRegistry(registry);
    });
  }

  public static loadJsonRegistryFile(path: string): Result<LanguageTagExtensionRegistry> {
    return captureResult(() => {
      const registry = JarConverters.loadJsonLanguageTagExtensionsRegistryFileSync(path).orThrow();
      return new LanguageTagExtensionRegistry(registry);
    });
  }

  public static loadTxtRegistryFile(path: string): Result<LanguageTagExtensionRegistry> {
    return captureResult(() => {
      const registry = JarConverters.loadTxtLanguageTagExtensionsRegistryFileSync(path).orThrow();
      return new LanguageTagExtensionRegistry(registry);
    });
  }
}
