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

import { Result, Success, allSucceed, fail, succeed } from '@fgv/ts-utils';

import { Validate } from './bcp47Subtags';
import { ExtensionSingleton, ExtensionSubtag } from './bcp47Subtags/model';
import { ISubtags } from './common';

/**
 * @internal
 */
interface IParserState {
  readonly iana: Iana.LanguageRegistries;
  readonly tag: string;
  readonly subtags: string[];
  readonly parsedSubtags: ISubtags;
  next?: string;
}

/**
 * @public
 */
export class LanguageTagParser {
  // istanbul ignore next
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Parses a string representation of a BCP-47 ({@link https://www.rfc-editor.org/rfc/rfc5646.html | RFC 5646})
   * language tag, to produce a {@link Bcp47.Subtags | Subtags} object which
   * breaks out each of the subtags.
   * @param tag - The `string` language tag to be parsed.
   * @param iana - Optional {@link Iana.LanguageRegistries | IANA language registries}
   * to be used.
   * @returns `Success` with the resulting {@link Bcp47.Subtags | subtags}
   * or `Failure` with details if an error occurs.
   * @public
   */
  public static parse(tag: string, iana?: Iana.LanguageRegistries): Result<ISubtags> {
    // istanbul ignore next
    iana = iana ?? Iana.DefaultRegistries.languageRegistries;
    const status: IParserState = {
      tag,
      iana,
      subtags: tag.split('-'),
      parsedSubtags: {}
    };
    status.next = status.subtags.shift();

    return allSucceed(
      [
        this._parseGrandfatheredTag(status),
        this._parsePrimaryLanguage(status),
        this._parseExtlang(status),
        this._parseScript(status),
        this._parseRegion(status),
        this._parseVariants(status),
        this._parseExtensions(status),
        this._parsePrivateSubtags(status),
        this._parseTagEnd(status)
      ],
      status
    ).onSuccess(() => {
      return succeed(status.parsedSubtags);
    });
  }

  /**
   * Determines if the entire tag matches a registered grandfathered tag.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` with the updated {@link Bcp47.Subtags | subtags}
   * if a grandfathered tag is found, or `Success` with the supplied subtags
   * if no matching grandfathered tag is found.
   * @internal
   */
  protected static _parseGrandfatheredTag(state: IParserState): Success<ISubtags> {
    const grandfathered = state.iana.subtags.grandfathered.tryGet(state.tag);
    if (grandfathered) {
      state.parsedSubtags.grandfathered = state.tag as Iana.LanguageSubtags.GrandfatheredTag;
      // we consumed the whole thing
      state.subtags.splice(0, state.subtags.length);
      state.next = undefined;
    }
    return succeed(state.parsedSubtags);
  }

  /**
   * Parses the primary language subtag of a supplied language tag.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` with supplied {@link Bcp47.Subtags | subtags}
   * updated to include the primary language subtag, or `Failure` with details if an error
   * occurs.
   * @internal
   */
  protected static _parsePrimaryLanguage(state: IParserState): Result<ISubtags> {
    // primary language subtag is required unless the entire tag is grandfathered or consists
    // of only private tags
    if (state.iana.subtags.languages.isWellFormed(state.next)) {
      state.parsedSubtags.primaryLanguage = state.next;
      state.next = state.subtags.shift();
      return succeed(state.parsedSubtags);
    } else if (state.parsedSubtags.grandfathered !== undefined) {
      return succeed(state.parsedSubtags);
    } else if (Validate.privateUsePrefix.isWellFormed(state.next)) {
      // just return with no primary language and the private tag
      // parser will be invoked by the parent flow.
      return succeed(state.parsedSubtags);
    }
    return fail(`${state.tag}: no primary language subtag`);
  }

  /**
   * Parses the extlang subtag(s) of a supplied language tag.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` with supplied {@link Bcp47.Subtags | subtags}
   * updated to include extlang subtags if present, or `Failure` with details if an error
   * occurs.
   * @internal
   */
  protected static _parseExtlang(state: IParserState): Result<ISubtags> {
    // optional extlangs subtags
    while (state.iana.subtags.extlangs.isWellFormed(state.next)) {
      if (state.parsedSubtags.extlangs === undefined) {
        state.parsedSubtags.extlangs = [state.next];
      } else if (state.parsedSubtags.extlangs.length < 3) {
        state.parsedSubtags.extlangs.push(state.next);
      } else {
        return fail(`${state.next}: too many extlang subtags`);
      }
      state.next = state.subtags.shift();
    }
    return succeed(state.parsedSubtags);
  }

  /**
   * Parses the script subtag of a supplied language tag.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` with supplied {@link Bcp47.Subtags | subtags}
   * updated to include the script subtag if present, or `Failure` with details if an error
   * occurs.
   * @internal
   */
  protected static _parseScript(state: IParserState): Result<ISubtags> {
    // optional script subtag
    if (state.iana.subtags.scripts.isWellFormed(state.next)) {
      state.parsedSubtags.script = state.next;
      state.next = state.subtags.shift();
    }
    return succeed(state.parsedSubtags);
  }

  /**
   * Parses the region subtag of a supplied language tag.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` with supplied {@link Bcp47.Subtags | subtags}
   * updated to include the region subtag if present, or `Failure` with details if an error
   * occurs.
   * @internal
   */
  protected static _parseRegion(state: IParserState): Result<ISubtags> {
    // optional region subtag
    if (state.iana.subtags.regions.isWellFormed(state.next)) {
      state.parsedSubtags.region = state.next;
      state.next = state.subtags.shift();
    }
    return succeed(state.parsedSubtags);
  }

  /**
   * Parses the variant subtag(s) of a supplied language tag.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` with supplied {@link Bcp47.Subtags | subtags}
   * updated to include the variant subtags if present, or `Failure` with details if an error
   * occurs.
   * @internal
   */
  protected static _parseVariants(state: IParserState): Result<ISubtags> {
    // optional variant subtags
    while (state.iana.subtags.variants.isWellFormed(state.next)) {
      if (state.parsedSubtags.variants === undefined) {
        state.parsedSubtags.variants = [state.next];
      } else {
        state.parsedSubtags.variants.push(state.next);
      }
      state.next = state.subtags.shift();
    }
    return succeed(state.parsedSubtags);
  }

  /**
   * Parses the extension subtag(s) of a supplied language tag.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` with supplied {@link Bcp47.Subtags | subtags}
   * updated to include the extension subtags if present, or `Failure` with details if an error
   * occurs.
   * @internal
   */
  protected static _parseExtensions(state: IParserState): Result<ISubtags> {
    // optional extension subtags
    while (state.next !== undefined && Validate.extensionSingleton.isWellFormed(state.next)) {
      const singleton: ExtensionSingleton = state.next as ExtensionSingleton;
      const values: ExtensionSubtag[] = [];
      state.next = state.subtags.shift();

      while (Validate.extensionSubtag.isWellFormed(state.next)) {
        values.push(state.next as ExtensionSubtag);
        state.next = state.subtags.shift();
      }
      if (
        state.next !== undefined &&
        !Validate.extensionSingleton.isWellFormed(state.next) &&
        !Validate.privateUsePrefix.isWellFormed(state.next)
      ) {
        return fail(`${state.next}: malformed extension subtag`);
      } else if (values.length < 1) {
        return fail(`${state.tag}: extension '${singleton}' must have at least one subtag.`);
      }

      const value = values.join('-') as ExtensionSubtag;
      if (state.parsedSubtags.extensions === undefined) {
        state.parsedSubtags.extensions = [{ singleton, value }];
      } else {
        state.parsedSubtags.extensions.push({ singleton, value });
      }
    }
    return succeed(state.parsedSubtags);
  }

  /**
   * Parses the private use subtags of a supplied language tag.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` with supplied {@link Bcp47.Subtags | subtags}
   * updated to include the private-use subtags if present, or `Failure` with details if an error
   * occurs.
   * @internal
   */
  protected static _parsePrivateSubtags(state: IParserState): Result<ISubtags> {
    // optional private use subtags
    if (state.next !== undefined && Validate.privateUsePrefix.isWellFormed(state.next)) {
      const values: string[] = [];
      state.next = state.subtags.shift();

      while (
        state.next &&
        state.next.length > 1 &&
        Iana.LanguageSubtags.Validate.extendedLanguageRange.isWellFormed(state.next)
      ) {
        values.push(state.next);
        state.next = state.subtags.shift();
      }

      if (state.next !== undefined) {
        return fail(`${state.next}: malformed private-use subtag`);
      } else if (values.length < 1) {
        return fail(`${state.tag}: private-use tag must have at least one subtag.`);
      }

      state.parsedSubtags.privateUse = values as Iana.LanguageSubtags.ExtendedLanguageRange[];
    }
    return succeed(state.parsedSubtags);
  }

  /**
   * Verifies {@link Bcp47.ParserState | parser state} at the end of a parse operation.
   * @param state - The {@link Bcp47.ParserState | current state} of the
   * parse operation.
   * @returns `Success` if the tag was fully consumed, or `Failure` with details
   * if unexpected subtags remain to be parsed.
   * @internal
   */
  protected static _parseTagEnd(state: IParserState): Result<ISubtags> {
    if (state.next !== undefined) {
      return fail(`${state.next}: unexpected subtag`);
    }
    return succeed(state.parsedSubtags);
  }
}
