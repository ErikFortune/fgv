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

/* eslint-disable @rushstack/typedef-var */

import * as JarModel from '../jar/language-subtags/registry/model';
import * as TagConverters from '../jar/language-subtags/tags/converters';
import * as Model from './model';

import { RecordJar } from '@fgv/ts-extras';
import { Converters, Result } from '@fgv/ts-utils';
import { datedRegistry, yearMonthDaySpec } from '../common/converters';

import { JsonFile } from '@fgv/ts-json-base';
import { datedRegistryFromJarRecords } from '../jar/jarConverters';
import { registryScopeType } from '../jar/language-subtags/registry/converters';

/**
 * @internal
 */
export const registeredLanguage = Converters.transformObject<
  JarModel.LanguageSubtagRegistryEntry,
  Model.IRegisteredLanguage
>(
  {
    type: { from: 'Type', converter: Converters.enumeratedValue<'language'>(['language']) },
    subtag: { from: 'Subtag', converter: TagConverters.tagOrStartOfTagRange(TagConverters.languageSubtag) },
    description: { from: 'Description', converter: Converters.stringArray },
    added: { from: 'Added', converter: yearMonthDaySpec },
    comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    macrolanguage: { from: 'Macrolanguage', converter: TagConverters.languageSubtag, optional: true },
    preferredValue: { from: 'Preferred-Value', converter: TagConverters.languageSubtag, optional: true },
    scope: { from: 'Scope', converter: registryScopeType, optional: true },
    suppressScript: { from: 'Suppress-Script', converter: TagConverters.scriptSubtag, optional: true },
    subtagRangeEnd: {
      from: 'Subtag',
      converter: TagConverters.endOfTagRangeOrUndefined(TagConverters.languageSubtag),
      optional: true
    }
  },
  {
    strict: true,
    description: 'language subtag'
  }
);

/**
 * @internal
 */
export const registeredExtLang = Converters.transformObject<
  JarModel.ExtLangSubtagRegistryEntry,
  Model.IRegisteredExtLang
>(
  {
    type: { from: 'Type', converter: Converters.enumeratedValue<'extlang'>(['extlang']) },
    subtag: { from: 'Subtag', converter: TagConverters.extlangSubtag },
    preferredValue: { from: 'Preferred-Value', converter: TagConverters.extendedLanguageRange },
    prefix: { from: 'Prefix', converter: TagConverters.extlangPrefix },
    description: { from: 'Description', converter: Converters.stringArray },
    added: { from: 'Added', converter: yearMonthDaySpec },
    comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    macrolanguage: { from: 'Macrolanguage', converter: TagConverters.languageSubtag, optional: true },
    scope: { from: 'Scope', converter: registryScopeType, optional: true },
    suppressScript: { from: 'Suppress-Script', converter: TagConverters.scriptSubtag, optional: true }
  },
  {
    strict: true,
    description: 'extlang subtag'
  }
);

/**
 * @internal
 */
export const registeredScript = Converters.transformObject<
  JarModel.ScriptSubtagRegistryEntry,
  Model.IRegisteredScript
>(
  {
    type: { from: 'Type', converter: Converters.enumeratedValue<'script'>(['script']) },
    subtag: { from: 'Subtag', converter: TagConverters.tagOrStartOfTagRange(TagConverters.scriptSubtag) },
    description: { from: 'Description', converter: Converters.stringArray },
    added: { from: 'Added', converter: yearMonthDaySpec },
    comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    preferredValue: { from: 'Preferred-Value', converter: TagConverters.scriptSubtag, optional: true },
    subtagRangeEnd: {
      from: 'Subtag',
      converter: TagConverters.endOfTagRangeOrUndefined(TagConverters.scriptSubtag),
      optional: true
    }
  },
  {
    strict: true,
    description: 'script subtag'
  }
);

/**
 * @internal
 */
export const registeredRegion = Converters.transformObject<
  JarModel.RegionSubtagRegistryEntry,
  Model.IRegisteredRegion
>(
  {
    type: { from: 'Type', converter: Converters.enumeratedValue<'region'>(['region']) },
    subtag: { from: 'Subtag', converter: TagConverters.tagOrStartOfTagRange(TagConverters.regionSubtag) },
    description: { from: 'Description', converter: Converters.stringArray },
    added: { from: 'Added', converter: yearMonthDaySpec },
    comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    preferredValue: { from: 'Preferred-Value', converter: TagConverters.regionSubtag, optional: true },
    subtagRangeEnd: {
      from: 'Subtag',
      converter: TagConverters.endOfTagRangeOrUndefined(TagConverters.regionSubtag),
      optional: true
    }
  },
  {
    strict: true,
    description: 'region subtag'
  }
);

/**
 * @internal
 */
export const registeredVariant = Converters.transformObject<
  JarModel.VariantSubtagRegistryEntry,
  Model.IRegisteredVariant
>(
  {
    type: { from: 'Type', converter: Converters.enumeratedValue<'variant'>(['variant']) },
    subtag: { from: 'Subtag', converter: TagConverters.variantSubtag },
    description: { from: 'Description', converter: Converters.stringArray },
    added: { from: 'Added', converter: yearMonthDaySpec },
    comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    preferredValue: { from: 'Preferred-Value', converter: TagConverters.variantSubtag, optional: true },
    prefix: {
      from: 'Prefix',
      converter: Converters.arrayOf(TagConverters.extendedLanguageRange),
      optional: true
    }
  },
  {
    strict: true,
    description: 'variant subtag'
  }
);

/**
 * @internal
 */
export const registeredGrandfatheredTag = Converters.transformObject<
  JarModel.GrandfatheredTagRegistryEntry,
  Model.IRegisteredGrandfatheredTag
>(
  {
    type: { from: 'Type', converter: Converters.enumeratedValue<'grandfathered'>(['grandfathered']) },
    tag: { from: 'Tag', converter: TagConverters.grandfatheredTag },
    description: { from: 'Description', converter: Converters.stringArray },
    added: { from: 'Added', converter: yearMonthDaySpec },
    comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    preferredValue: {
      from: 'Preferred-Value',
      converter: TagConverters.extendedLanguageRange,
      optional: true
    }
  },
  {
    strict: true,
    description: 'grandfathered tag'
  }
);

/**
 * @internal
 */
export const registeredRedundantTag = Converters.transformObject<
  JarModel.RedundantTagRegistryEntry,
  Model.IRegisteredRedundantTag
>(
  {
    type: { from: 'Type', converter: Converters.enumeratedValue<'redundant'>(['redundant']) },
    tag: { from: 'Tag', converter: TagConverters.redundantTag },
    description: { from: 'Description', converter: Converters.stringArray },
    added: { from: 'Added', converter: yearMonthDaySpec },
    comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    preferredValue: {
      from: 'Preferred-Value',
      converter: TagConverters.extendedLanguageRange,
      optional: true
    }
  },
  {
    strict: true,
    description: 'redundant tag'
  }
);

/**
 * @internal
 */
export const registeredItem = Converters.discriminatedObject<Model.RegisteredItem>('Type', {
  language: registeredLanguage,
  extlang: registeredExtLang,
  script: registeredScript,
  region: registeredRegion,
  variant: registeredVariant,
  grandfathered: registeredGrandfatheredTag,
  redundant: registeredRedundantTag
});

/**
 * @internal
 */
export const registryFile = datedRegistry(registeredItem);

/**
 * Loads a JSON-format language subtag registry file.
 * @param path - The string path from which the registry is to be loaded.
 * @returns `Success` with the resulting {@link Iana.LanguageSubtags.Model.RegistryFile | registry file}
 * or `Failure` with details if an error occurs.
 * @internal
 */
export function loadJsonSubtagRegistryFileSync(path: string): Result<Model.RegistryFile> {
  return JsonFile.convertJsonFileSync(path, registryFile);
}

/**
 * Loads a text (JAR) format language subtag registry file.
 * @param path - The string path from which the registry is to be loaded.
 * @returns `Success` with the resulting {@link Iana.LanguageSubtags.Model.RegistryFile | registry file}
 * or `Failure` with details if an error occurs.
 * @internal
 */
export function loadTxtSubtagRegistryFileSync(path: string): Result<Model.RegistryFile> {
  return RecordJar.readRecordJarFileSync(path, {
    arrayFields: ['Comments', 'Description', 'Prefix'],
    fixedContinuationSize: 1
  }).onSuccess((jar) => {
    return datedRegistryFromJarRecords(registeredItem).convert(jar);
  });
}

/**
 * Parses a text (JAR) format language subtag registry from string content.
 * @param content - The string content of the registry file to be parsed.
 * @returns `Success` with the resulting {@link Iana.LanguageSubtags.Model.RegistryFile | registry file}
 * or `Failure` with details if an error occurs.
 * @public
 */
export function loadTxtSubtagRegistryFromString(content: string): Result<Model.RegistryFile> {
  const lines = content.split(/\r?\n/);
  return RecordJar.parseRecordJarLines(lines, {
    arrayFields: ['Comments', 'Description', 'Prefix'],
    fixedContinuationSize: 1
  }).onSuccess((jar) => {
    return datedRegistryFromJarRecords(registeredItem).convert(jar);
  });
}
