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

import * as Iana from '../../iana';
import * as Converters from './converters';
import * as Model from './model';

import { Result, mapResults, succeed } from '@fgv/ts-utils';
// eslint-disable-next-line @rushstack/packlets/mechanics
import defaultOverrides from '../../../data/bcp/overrides.json';

/**
 * @public
 */
export interface ILanguageOverride {
  language: Iana.LanguageSubtags.LanguageSubtag;
  preferredRegion?: Iana.LanguageSubtags.RegionSubtag;
  defaultAffinity?: string;
  affinity?: Map<Iana.LanguageSubtags.RegionSubtag, string>;
}

/**
 * @public
 */
export class OverridesRegistry {
  public readonly overrides: Map<Iana.LanguageSubtags.LanguageSubtag, ILanguageOverride>;

  protected constructor() {
    this.overrides = new Map();
  }

  public static create(overrides: ILanguageOverride[]): Result<OverridesRegistry> {
    const registry = new OverridesRegistry();
    overrides.forEach((o) => registry.overrides.set(o.language, o));
    return succeed(registry);
  }

  public static createFromJson(from: unknown): Result<OverridesRegistry> {
    return Converters.languageOverridesFile
      .convert(from)
      .onSuccess((records) => {
        return mapResults(records.map(OverridesRegistry._overrideFromRecord));
      })
      .onSuccess((overrides) => {
        return OverridesRegistry.create(overrides);
      });
  }

  public static loadDefault(): Result<OverridesRegistry> {
    return this.createFromJson(defaultOverrides);
  }

  public static loadJson(path: string): Result<OverridesRegistry> {
    return Converters.loadLanguageOverridesFileSync(path).onSuccess(OverridesRegistry.createFromJson);
  }

  /**
   * Converts a file {@link Bcp47.Overrides.Model.LanguageOverrideRecord | LanguageOverrideRecord }
   * to a runtime {@link Bcp47.Overrides.LanguageOverride | LanguageOverride}.
   * @param record - The {@link Bcp47.Overrides.Model.LanguageOverrideRecord | LanguageOverrideRecord } to
   * be converted.
   * @returns `Success` with the resulting {@link Bcp47.Overrides.LanguageOverride | LanguageOverride}
   * or `Error` with details if an error occurs.
   * @internal
   */
  protected static _overrideFromRecord(record: Model.ILanguageOverrideRecord): Result<ILanguageOverride> {
    const override: ILanguageOverride = { language: record.language };
    if (record.preferredRegion) {
      override.preferredRegion = record.preferredRegion;
    }
    if (record.defaultAffinity) {
      override.defaultAffinity = record.defaultAffinity;
    }
    if (record.affinity) {
      const affinity = new Map<Iana.LanguageSubtags.RegionSubtag, string>();
      for (const kvp of Object.entries(record.affinity)) {
        for (const region of kvp[1]) {
          affinity.set(region, kvp[0]);
        }
      }
      override.affinity = affinity;
    }
    return succeed(override);
  }
}
