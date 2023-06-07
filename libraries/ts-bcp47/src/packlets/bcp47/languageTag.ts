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

import * as Iana from '../iana';

import { Result, captureResult, succeed } from '@fgv/ts-utils';
import { ISubtags, UndeterminedLanguage, subtagsToString } from './common';
import { TagNormalization, mostNormalized } from './normalization/common';
import { TagValidity, mostValid } from './validation/common';

import { LanguageRegistryData } from './languageRegistryData';
import { LanguageTagParser } from './languageTagParser';
import { NormalizeTag } from './normalization';
import { ValidateTag } from './validation';

/**
 * Initialization options for parsing or creation of {@link Bcp47.LanguageTag | language tag} objects.
 * @public
 */
export interface ILanguageTagInitOptions {
  /**
   * Desired {@link Bcp47.TagValidity | validity level} (optional).
   */
  validity?: TagValidity;
  /**
   * Desired {@link Bcp47.TagNormalization | normalization level} (optional).
   */
  normalization?: TagNormalization;
  /**
   * The {@link Iana.LanguageRegistries | IANA language subtag and extension registries} to
   * be used for the request (optional).
   */
  iana?: Iana.LanguageRegistries;
}

/**
 * Represents a single BCP-47 language tag.
 * @public
 */
export class LanguageTag {
  /**
   * The individual {@link Bcp47.Subtags | subtags} for
   * this language tag.
   */
  public readonly subtags: Readonly<ISubtags>;

  /**
   * A string representation of this language tag.
   */
  public readonly tag: string;

  /**
   * Details about this language tag from the IANA language
   * registries.
   */
  public readonly registry: LanguageRegistryData;

  /**
   * @internal
   */
  protected readonly _iana: Iana.LanguageRegistries;

  /**
   * @internal
   */
  protected _validity: TagValidity;

  /**
   * @internal
   */
  protected _normalization: TagNormalization;

  /**
   * @internal
   */
  protected _isValid: undefined | boolean;

  /**
   * @internal
   */
  protected _isStrictlyValid: undefined | boolean;

  /**
   * @internal
   */
  protected _isCanonical: undefined | boolean;

  /**
   * @internal
   */
  protected _isPreferred: undefined | boolean;

  /**
   * @internal
   */
  protected _suppressedScript: undefined | Iana.LanguageSubtags.ScriptSubtag | false;

  /**
   * Constructs a {@link Bcp47.LanguageTag | LanguageTag }.
   * @param subtags - The {@link Bcp47.Subtags | subtags } from
   * which the tag is constructed.
   * @param validity - Known {@link Bcp47.TagValidity | validation level} of the
   * supplied subtags.
   * @param normalization - Known {@link Bcp47.TagNormalization | normalization level}
   * of the supplied subtags.
   * @param iana - The {@link Iana.LanguageRegistries} used to validate and normalize
   * this tag.
   * @internal
   */
  protected constructor(
    subtags: ISubtags,
    validity: TagValidity,
    normalization: TagNormalization,
    iana: Iana.LanguageRegistries
  ) {
    this.subtags = Object.freeze({ ...subtags });
    this._normalization = normalization;
    this._validity = validity;
    this.tag = subtagsToString(subtags);
    this._iana = iana;
    this.registry = new LanguageRegistryData(this.subtags, iana);

    if (validity === 'strictly-valid') {
      this._isStrictlyValid = true;
      this._isValid = true;
    } else if (validity === 'valid') {
      this._isValid = true;
    }

    if (normalization === 'preferred') {
      this._isPreferred = true;
      this._isCanonical = true;
    } else if (normalization === 'canonical') {
      this._isCanonical = true;
    }
  }

  /**
   * The effective script of this language tag, if known.
   * The effective script is the script subtag in the tag itself,
   * if present, or the `Suppress-Script` defined in the
   * {@link https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry | IANA subtag registry}
   * for the primary language of this tag.  Can be `undefined`
   * if neither the tag nor the IANA registry define a script.
   */
  public get effectiveScript(): Iana.LanguageSubtags.ScriptSubtag | undefined {
    return this.subtags.script ?? this.getSuppressedScript();
  }

  /**
   * Determines if this tag represents the special `undetermined` language.
   */
  public get isUndetermined(): boolean {
    /* c8 ignore next */
    return this.subtags.primaryLanguage?.toLowerCase() === UndeterminedLanguage;
  }

  /**
   * Whether this language tag is valid.
   */
  public get isValid(): boolean {
    if (this._isValid === undefined) {
      this._isValid = ValidateTag.isValid(this.subtags);
      if (this._isValid) {
        this._validity = 'valid';
      }
    }
    return this._isValid === true;
  }

  /**
   * Whether if this language tag is strictly valid.
   */
  public get isStrictlyValid(): boolean {
    if (this._isStrictlyValid === undefined) {
      this._isStrictlyValid = ValidateTag.isStrictlyValid(this.subtags);
      if (this._isStrictlyValid) {
        this._validity = 'strictly-valid';
      }
    }
    return this._isStrictlyValid === true;
  }

  /**
   * Whether this language tag is in canonical form.
   */
  public get isCanonical(): boolean {
    if (this._isCanonical === undefined) {
      this._isCanonical = ValidateTag.isCanonical(this.subtags);
      if (this._isCanonical) {
        this._normalization = 'canonical';
      }
    }
    return this._isCanonical === true;
  }

  /**
   * Whether this language tag is in preferred form.
   */
  public get isPreferred(): boolean {
    if (this._isPreferred === undefined) {
      this._isPreferred = ValidateTag.isInPreferredForm(this.subtags);
      if (this._isPreferred) {
        this._normalization = 'preferred';
      }
    }
    return this._isPreferred === true;
  }

  /**
   * Whether this language tag is a grandfathered tag.
   */
  public get isGrandfathered(): boolean {
    return this.subtags.grandfathered !== undefined;
  }

  /**
   * Gets a text description of this tag.
   */
  public get description(): string {
    const parts: string[] = [];
    if (!this.subtags.grandfathered) {
      if (this.registry.primaryLanguage || this.subtags.primaryLanguage) {
        parts.push((this.registry.primaryLanguage?.description[0] ?? this.subtags.primaryLanguage)!);
      }
      if (this.registry.extlangs) {
        for (const e of this.registry.extlangs) {
          parts.push(`/ ${e.registry?.description[0] ?? e.subtag}`);
        }
      }
      if (this.subtags.script) {
        parts.push(`in ${this.registry.script?.description[0] ?? this.subtags.script} script`);
      }
      if (this.subtags.region) {
        parts.push(`as spoken in ${this.registry.region?.description[0] ?? this.subtags.region}`);
      }
      if (this.registry.variants && this.registry.variants.length > 0) {
        for (const e of this.registry.variants) {
          parts.push(`(${e.registry?.description[0] ?? e.subtag})`);
        }
      }
      if (this.registry.extensions && this.registry.extensions.length > 0) {
        for (const e of this.registry.extensions) {
          parts.push(`(${e.registry?.description[0] ?? `-${e.singleton}`} "${e.value}")`);
        }
      }
      if (this.subtags.privateUse && this.subtags.privateUse.length > 0) {
        parts.push(`(-x "${this.subtags.privateUse.join('-')}")`);
      }
    } else {
      parts.push(`${this.tag} (grandfathered)`);
    }
    return parts.join(' ');
  }

  /**
   * Creates a new {@link Bcp47.LanguageTag | language tag} from a supplied `string` tag
   * using optional configuration, if supplied.
   * @param tag - The `string` tag from which the {@link Bcp47.LanguageTag | language tag}
   * is te be constructed.
   * @param options - (optional) set of {@link Bcp47.LanguageTagInitOptions | init options}
   * to guide the validation and normalization of this tag.
   * @returns `Success` with the new {@link Bcp47.LanguageTag | language tag} or `Failure`
   * with details if an error occurs.
   */
  public static createFromTag(tag: string, options?: ILanguageTagInitOptions): Result<LanguageTag> {
    options = this._getOptions(options);

    return LanguageTagParser.parse(tag, options.iana).onSuccess((subtags) => {
      return this._createTransformed(subtags, 'unknown', 'unknown', options);
    });
  }

  /**
   * Creates a new {@link Bcp47.LanguageTag | language tag} from a supplied
   * {@link Bcp47.Subtags | subtags} using optional configuration,
   * if supplied.
   * @param tag - The {@link Bcp47.Subtags | subtags} from which the
   * {@link Bcp47.LanguageTag | language tag} is te be constructed.
   * @param options - (optional) set of {@link Bcp47.LanguageTagInitOptions | init options}
   * to guide the validation and normalization of this tag.
   * @returns `Success` with the new {@link Bcp47.LanguageTag | language tag} or `Failure`
   * with details if an error occurs.
   */
  public static createFromSubtags(subtags: ISubtags, options?: ILanguageTagInitOptions): Result<LanguageTag> {
    return this._createTransformed(subtags, 'unknown', 'unknown', options);
  }

  /**
   * Creates a new {@link Bcp47.LanguageTag | language tag} from a supplied `string`
   * tag or {@link Bcp47.Subtags | subtags} using optional configuration,
   * if supplied.
   * @param from - The `string` tag or {@link Bcp47.Subtags | subtags} from
   * which the {@link Bcp47.LanguageTag | language tag} is te be constructed.
   * @param options - (optional) set of {@link Bcp47.LanguageTagInitOptions | init options}
   * to guide the validation and normalization of this tag.
   * @returns `Success` with the new {@link Bcp47.LanguageTag | language tag} or `Failure`
   * with details if an error occurs.
   */
  public static create(from: string | ISubtags, options?: ILanguageTagInitOptions): Result<LanguageTag> {
    if (typeof from === 'string') {
      return this.createFromTag(from, options);
    } else {
      return this.createFromSubtags(from, options);
    }
  }

  /**
   * Constructs a new {@link Bcp47.LanguageTag | language tag} by applying appropriate transformations
   * to as supplied {@link Bcp47.Subtags | Bcp47.Subtags}.
   * @param subtags - The {@link Bcp47.Subtags | subtags} which represent the tag.
   * @param fromValidity - The {@link Bcp47.TagValidity | validation level} of the supplied subtags.
   * @param fromNormalization - The {@link Bcp47.TagNormalization | normalization level} fo the
   * supplied subtags.
   * @param partialOptions - Any {@link Bcp47.LanguageTagInitOptions | initialization options}.
   * @returns `Success` with the corresponding {@link Bcp47.LanguageTag | language tag} or `Failure`
   * with details if an error occurs.
   * @internal
   */
  protected static _createTransformed(
    subtags: ISubtags,
    fromValidity: TagValidity,
    fromNormalization: TagNormalization,
    partialOptions?: ILanguageTagInitOptions
  ): Result<LanguageTag> {
    const options = this._getOptions(partialOptions);
    return ValidateTag.validateSubtags(subtags, options.validity, fromValidity)
      .onSuccess(() => {
        return NormalizeTag.normalizeSubtags(subtags, options.normalization, fromNormalization);
      })
      .onSuccess((normalized) => {
        const validity = mostValid(fromValidity, options.validity);
        const normalization = mostNormalized(fromNormalization, options.normalization);
        return captureResult(() => new LanguageTag(normalized, validity, normalization, options.iana));
      });
  }

  /**
   * Gets a fully-specified {@link Bcp47.LanguageTagInitOptions} from partial or undefined
   * options, substituting defaults as appropriate.
   * @param options - The {@link Bcp47.LanguageTagInitOptions} to be expanded, or `undefined`
   * for default options.
   * @returns Fully-specified {@link Bcp47.LanguageTagInitOptions | init options}.
   * @internal
   */
  protected static _getOptions(options?: ILanguageTagInitOptions): Required<ILanguageTagInitOptions> {
    return {
      iana: options?.iana ?? Iana.DefaultRegistries.languageRegistries,
      validity: options?.validity ?? 'well-formed',
      normalization: options?.normalization ?? 'none'
    };
  }

  /**
   * Returns the `Suppress-Script` value defined for the primary language of this tag,
   * regardless of whether a different script is defined in this subtag.
   * @returns The suppress-script defined for the primary language, or undefined if
   * the primary language is invalid or has no defined suppressed script.
   */
  public getSuppressedScript(): Iana.LanguageSubtags.ScriptSubtag | undefined {
    if (this._suppressedScript === undefined) {
      this._suppressedScript = false;
      if (this.subtags.primaryLanguage) {
        const language = this._iana.subtags.languages.tryGet(this.subtags.primaryLanguage);
        if (language?.suppressScript !== undefined) {
          this._suppressedScript = language.suppressScript;
        }
      }
    }
    return this._suppressedScript ? this._suppressedScript : undefined;
  }

  /**
   * Gets a confirmed valid representation of this language tag.
   * @returns `Success` with a valid representation of this {@link Bcp47.LanguageTag | language tag},
   * or `Failure` with details if the tag cannot be validated.
   */
  public toValid(): Result<LanguageTag> {
    if (this.isValid) {
      return succeed(this);
    }
    const options: ILanguageTagInitOptions = {
      iana: this._iana,
      validity: 'valid',
      normalization: this._normalization
    };
    return LanguageTag._createTransformed(this.subtags, this._validity, this._normalization, options);
  }

  /**
   * Gets a confirmed strictly valid representation of this language tag.
   * @returns `Success` with a strictly valid representation of this {@link Bcp47.LanguageTag | language tag},
   * or `Failure` with details if the tag cannot be strictly validated.
   */
  public toStrictlyValid(): Result<LanguageTag> {
    if (this.isStrictlyValid) {
      return succeed(this);
    }
    const options: ILanguageTagInitOptions = {
      iana: this._iana,
      validity: 'strictly-valid',
      normalization: this._normalization
    };
    return LanguageTag._createTransformed(this.subtags, this._validity, this._normalization, options);
  }

  /**
   * Gets a confirmed canonical representation of this language tag.
   * @returns `Success` with a canonical representation of this {@link Bcp47.LanguageTag | language tag},
   * or `Failure` with details if the tag cannot be normalized to canonical form.
   */
  public toCanonical(): Result<LanguageTag> {
    if (this.isCanonical) {
      return succeed(this);
    }
    const options: ILanguageTagInitOptions = {
      iana: this._iana,
      validity: this._validity,
      normalization: 'canonical'
    };
    return LanguageTag._createTransformed(this.subtags, this._validity, this._normalization, options);
  }

  /**
   * Gets a confirmed preferred representation of this language tag.
   * @returns `Success` with a preferred representation of this {@link Bcp47.LanguageTag | language tag},
   * or `Failure` with details if the tag cannot be normalized to preferred form.
   */
  public toPreferred(): Result<LanguageTag> {
    if (this.isPreferred) {
      return succeed(this);
    }
    const options: ILanguageTagInitOptions = {
      iana: this._iana,
      validity: 'valid', // preferred requires validity
      normalization: 'preferred'
    };
    return LanguageTag._createTransformed(this.subtags, this._validity, this._normalization, options);
  }

  /**
   * Gets a string representation of this language tag.
   * @returns A string representation of this language tag.
   */
  public toString(): string {
    return this.tag;
  }
}
