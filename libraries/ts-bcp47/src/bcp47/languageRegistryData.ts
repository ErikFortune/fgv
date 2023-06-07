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

import * as Bcp47 from '../bcp47';
import * as Iana from '../iana';

import { ISubtags, subtagsToString } from './common';

/**
 * Represents a single extlang subtag with corresponding registry data,
 * if present.
 * @public
 */
export interface IRegisteredExtLangValue {
  /**
   * A {@link Iana.LanguageSubtags.ExtLangSubtag | extlang subtag} from
   * the original language tag.
   */
  subtag: Iana.LanguageSubtags.ExtLangSubtag;
  /**
   * The {@link Iana.LanguageSubtag.Model.RegisteredExtLang | IANA subtag registry entry}
   * for this subtag, or `undefined` if the subtag is not registered.
   */
  registry?: Iana.LanguageSubtags.Model.IRegisteredExtLang;
}

/**
 * Represents a single variant subtag with corresponding registry data,
 * if present.
 * @public
 */
export interface IRegisteredVariantValue {
  /**
   * A {@link Iana.LanguageSubtags.VariantSubtag | variant subtag} from
   * the original language tag.
   */
  subtag: Iana.LanguageSubtags.VariantSubtag;
  /**
   * The {@link Iana.LanguageSubtag.Model.RegisteredVariant | IANA subtag registry entry}
   * for this subtag, or `undefined` if the subtag is not registered.
   */
  registry?: Iana.LanguageSubtags.Model.IRegisteredVariant;
}

/**
 * Represents a single extension subtag with corresponding registry data,
 * if present.
 * @public
 */
export interface IRegisteredExtensionValue extends Bcp47.ExtensionSubtagValue {
  /**
   * The lanugage extensions registry entry for the associated subtag,
   * or `undefined` if the extension is not registered.
   */
  registry?: Iana.LanguageTagExtensions.Model.ILanguageTagExtension;
}

/**
 * Returns all of the data in the IANA language subtags registry for
 * a set of supplied {@link Bcp47.Subtags | subtags}.
 * @public
 */
export class LanguageRegistryData {
  /**
   * @internal
   */
  protected _iana: Iana.LanguageRegistries;
  /**
   * @internal
   */
  protected _subtags: ISubtags;
  /**
   * @internal
   */
  protected _primaryLanguage?: Iana.LanguageSubtags.Model.IRegisteredLanguage | false;
  /**
   * @internal
   */
  protected _extlangs?: IRegisteredExtLangValue[] | false;
  /**
   * @internal
   */
  protected _script?: Iana.LanguageSubtags.Model.IRegisteredScript | false;
  /**
   * @internal
   */
  protected _effectiveScript?: Iana.LanguageSubtags.Model.IRegisteredScript | false;
  /**
   * @internal
   */
  protected _region?: Iana.LanguageSubtags.Model.IRegisteredRegion | false;
  /**
   * @internal
   */
  protected _variants?: IRegisteredVariantValue[] | false;
  /**
   * @internal
   */
  protected _extensions?: IRegisteredExtensionValue[] | false;
  /**
   * @internal
   */
  protected _grandfathered?: Iana.LanguageSubtags.Model.IRegisteredGrandfatheredTag | false;

  /**
   * Constructs a new {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * from a supplied {@link Bcp47.Subtags | subtags} and {@link Iana.LanguageRegistries | language registries}.
   * @public
   */
  public constructor(subtags: ISubtags, iana: Iana.LanguageRegistries) {
    this._iana = iana;
    this._subtags = subtags;
  }

  /**
   * Registry data associated with the primary language subtag of the language tag from
   * which this {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * was constructed, or `undefined` if the primary language is missing or invalid.
   * @public
   */
  public get primaryLanguage(): Iana.LanguageSubtags.Model.IRegisteredLanguage | undefined {
    if (this._primaryLanguage === undefined) {
      this._primaryLanguage = this._iana.subtags.languages.tryGet(this._subtags.primaryLanguage) ?? false;
    }
    return this._primaryLanguage ? this._primaryLanguage : undefined;
  }

  /**
   * Registry data associated with the extlang subtag of the language tag from
   * which this {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * was constructed, or `undefined` if extlang is missing or invalid.
   * @public
   */
  public get extlangs(): IRegisteredExtLangValue[] | undefined {
    if (this._extlangs === undefined) {
      if (this._subtags.extlangs !== undefined) {
        this._extlangs = this._subtags.extlangs.map((e) => {
          return {
            subtag: e,
            registry: this._iana.subtags.extlangs.tryGet(e)
          };
        });
      }
      if (!this._subtags.extlangs || this._subtags.extlangs.length === 0) {
        this._extlangs = false;
      }
    }
    return this._extlangs ? this._extlangs : undefined;
  }

  /**
   * Registry data associated with the script of the language tag from
   * which this {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * was constructed, or `undefined` if the script cannot be determined.
   *
   * @public
   */
  public get script(): Iana.LanguageSubtags.Model.IRegisteredScript | undefined {
    if (this._script === undefined) {
      if (this._subtags.script) {
        this._script = this._iana.subtags.scripts.tryGet(this._subtags.script);
      }
      if (!this._script) {
        this._script = false;
      }
    }
    return this._script ? this._script : undefined;
  }

  /**
   * Registry data associated with the script of the language tag from
   * which this {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * was constructed, or `undefined` if the script cannot be determined.
   *
   * Note that effectiveScript will default to the registry `Suppress-Script` value of the
   * primary language if no script subtag is present.
   * @public
   */
  public get effectiveScript(): Iana.LanguageSubtags.Model.IRegisteredScript | undefined {
    if (this._effectiveScript === undefined) {
      if (this._subtags.script) {
        this._effectiveScript = this._iana.subtags.scripts.tryGet(this._subtags.script);
      } else if (!this._effectiveScript) {
        const suppressed = this.primaryLanguage?.suppressScript;
        if (suppressed) {
          this._effectiveScript = this._iana.subtags.scripts.tryGet(suppressed);
        }
      }
      if (!this._effectiveScript) {
        this._effectiveScript = false;
      }
    }
    return this._effectiveScript ? this._effectiveScript : undefined;
  }

  /**
   * Registry data associated with the region subtag of the language tag from
   * which this {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * was constructed, or `undefined` if the region is missing or invalid.
   * @public
   */
  public get region(): Iana.LanguageSubtags.Model.IRegisteredRegion | undefined {
    if (this._region === undefined) {
      if (this._subtags.region) {
        this._region = this._iana.subtags.regions.tryGet(this._subtags.region);
      }
      if (!this._region) {
        this._region = false;
      }
    }
    return this._region ? this._region : undefined;
  }

  /**
   * Registry data associated with the variant subtags of the language tag from
   * which this {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * was constructed, or `undefined` if variant subtags are missing or invalid.
   * @public
   */
  public get variants(): IRegisteredVariantValue[] | undefined {
    if (this._variants === undefined) {
      if (this._subtags.variants !== undefined) {
        this._variants = this._subtags.variants.map((v) => {
          return {
            subtag: v,
            registry: this._iana.subtags.variants.tryGet(v)
          };
        });
      }
      if (!this._subtags.variants || this._subtags.variants.length === 0) {
        this._variants = false;
      }
    }
    return this._variants ? this._variants : undefined;
  }

  /**
   * Registry data associated with the extension subtags of the language tag from
   * which this {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * was constructed, or `undefined` if extension subtags are missing or invalid.
   * @public
   */
  public get extensions(): IRegisteredExtensionValue[] | undefined {
    if (this._extensions === undefined) {
      if (this._subtags.extensions !== undefined) {
        this._extensions = this._subtags.extensions.map((e) => {
          return {
            ...e,
            registry: this._iana.extensions.extensions.tryGet(e.singleton)
          };
        });
      }
      if (!this._subtags.variants || this._subtags.variants.length === 0) {
        this._variants = false;
      }
    }
    return this._extensions ? this._extensions : undefined;
  }

  /**
   * Registry data for grandfathered tags, or `undefined` if the tag is not recognized
   * as a grandfathered tag.
   * @public
   */
  public get grandfathered(): Iana.LanguageSubtags.Model.IRegisteredGrandfatheredTag | undefined {
    if (this._grandfathered === undefined) {
      if (this._subtags.grandfathered) {
        this._grandfathered = this._iana.subtags.grandfathered.tryGet(this._subtags.grandfathered);
      }
      if (!this._grandfathered) {
        this._grandfathered = false;
      }
    }
    return this._grandfathered ? this._grandfathered : undefined;
  }

  /**
   * @returns A string representation of the subtags from which this
   * {@link Bcp47.LanguageTagRegistryData | Bcp47.LanguageTagRegistryData}
   * was created.
   * @public
   */
  public toString(): string {
    return subtagsToString(this._subtags);
  }
}
