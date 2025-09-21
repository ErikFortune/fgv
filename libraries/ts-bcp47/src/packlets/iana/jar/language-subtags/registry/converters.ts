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

import * as Model from './model';
import * as TagConverters from '../tags/converters';

import { Converters } from '@fgv/ts-utils';
import { yearMonthDaySpec } from '../../../common/converters';

/**
 * @internal
 */
export const registryEntryType = Converters.enumeratedValue<Model.RegistryEntryType>(
  Model.allRegistryEntryTypes
);

/**
 * @internal
 */
export const registryScopeType = Converters.enumeratedValue<Model.RegistryEntryScope>(
  Model.allRegistryEntryScopes
);

/**
 * JAR format converter for language subtag entries (preserves hyphenated field names)
 * @internal
 */
export const jarLanguageSubtagEntry = Converters.transformObject<
  Model.ILanguageSubtagRegistryEntry,
  Model.ILanguageSubtagRegistryEntry
>(
  {
    Type: { from: 'Type', converter: Converters.enumeratedValue<'language'>(['language']) },
    Subtag: { from: 'Subtag', converter: TagConverters.tagOrRange(TagConverters.languageSubtag) },
    Description: { from: 'Description', converter: Converters.stringArray },
    Added: { from: 'Added', converter: yearMonthDaySpec },
    Comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    Deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    Macrolanguage: { from: 'Macrolanguage', converter: TagConverters.languageSubtag, optional: true },
    'Preferred-Value': { from: 'Preferred-Value', converter: TagConverters.languageSubtag, optional: true },
    Scope: { from: 'Scope', converter: registryScopeType, optional: true },
    'Suppress-Script': { from: 'Suppress-Script', converter: TagConverters.scriptSubtag, optional: true }
  },
  {
    strict: true,
    description: 'JAR language subtag entry'
  }
);

/**
 * JAR format converter for extlang subtag entries
 * @internal
 */
export const jarExtLangSubtagEntry = Converters.transformObject<
  Model.IExtLangSubtagRegistryEntry,
  Model.IExtLangSubtagRegistryEntry
>(
  {
    Type: { from: 'Type', converter: Converters.enumeratedValue<'extlang'>(['extlang']) },
    Subtag: { from: 'Subtag', converter: TagConverters.extlangSubtag },
    'Preferred-Value': { from: 'Preferred-Value', converter: TagConverters.extendedLanguageRange },
    Prefix: { from: 'Prefix', converter: Converters.arrayOf(TagConverters.languageSubtag) },
    Description: { from: 'Description', converter: Converters.stringArray },
    Added: { from: 'Added', converter: yearMonthDaySpec },
    Comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    Deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    Macrolanguage: { from: 'Macrolanguage', converter: TagConverters.languageSubtag, optional: true },
    Scope: { from: 'Scope', converter: registryScopeType, optional: true },
    'Suppress-Script': { from: 'Suppress-Script', converter: TagConverters.scriptSubtag, optional: true }
  },
  {
    strict: true,
    description: 'JAR extlang subtag entry'
  }
);

/**
 * JAR format converter for script subtag entries
 * @internal
 */
export const jarScriptSubtagEntry = Converters.transformObject<
  Model.IScriptSubtagRegistryEntry,
  Model.IScriptSubtagRegistryEntry
>(
  {
    Type: { from: 'Type', converter: Converters.enumeratedValue<'script'>(['script']) },
    Subtag: { from: 'Subtag', converter: TagConverters.tagOrRange(TagConverters.scriptSubtag) },
    Description: { from: 'Description', converter: Converters.stringArray },
    Added: { from: 'Added', converter: yearMonthDaySpec },
    Comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    Deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    'Preferred-Value': { from: 'Preferred-Value', converter: TagConverters.scriptSubtag, optional: true }
  },
  {
    strict: true,
    description: 'JAR script subtag entry'
  }
);

/**
 * JAR format converter for region subtag entries
 * @internal
 */
export const jarRegionSubtagEntry = Converters.transformObject<
  Model.IRegionSubtagRegistryEntry,
  Model.IRegionSubtagRegistryEntry
>(
  {
    Type: { from: 'Type', converter: Converters.enumeratedValue<'region'>(['region']) },
    Subtag: { from: 'Subtag', converter: TagConverters.tagOrRange(TagConverters.regionSubtag) },
    Description: { from: 'Description', converter: Converters.stringArray },
    Added: { from: 'Added', converter: yearMonthDaySpec },
    Comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    Deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    'Preferred-Value': { from: 'Preferred-Value', converter: TagConverters.regionSubtag, optional: true }
  },
  {
    strict: true,
    description: 'JAR region subtag entry'
  }
);

/**
 * JAR format converter for variant subtag entries
 * @internal
 */
export const jarVariantSubtagEntry = Converters.transformObject<
  Model.IVariantSubtagRegistryEntry,
  Model.IVariantSubtagRegistryEntry
>(
  {
    Type: { from: 'Type', converter: Converters.enumeratedValue<'variant'>(['variant']) },
    Subtag: { from: 'Subtag', converter: TagConverters.variantSubtag },
    Description: { from: 'Description', converter: Converters.stringArray },
    Added: { from: 'Added', converter: yearMonthDaySpec },
    Comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    Deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    'Preferred-Value': { from: 'Preferred-Value', converter: TagConverters.variantSubtag, optional: true },
    Prefix: {
      from: 'Prefix',
      converter: Converters.arrayOf(TagConverters.extendedLanguageRange),
      optional: true
    }
  },
  {
    strict: true,
    description: 'JAR variant subtag entry'
  }
);

/**
 * JAR format converter for grandfathered tag entries
 * @internal
 */
export const jarGrandfatheredTagEntry = Converters.transformObject<
  Model.IGrandfatheredTagRegistryEntry,
  Model.IGrandfatheredTagRegistryEntry
>(
  {
    Type: { from: 'Type', converter: Converters.enumeratedValue<'grandfathered'>(['grandfathered']) },
    Tag: { from: 'Tag', converter: TagConverters.grandfatheredTag },
    Description: { from: 'Description', converter: Converters.stringArray },
    Added: { from: 'Added', converter: yearMonthDaySpec },
    Comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    Deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    'Preferred-Value': {
      from: 'Preferred-Value',
      converter: TagConverters.extendedLanguageRange,
      optional: true
    }
  },
  {
    strict: true,
    description: 'JAR grandfathered tag entry'
  }
);

/**
 * JAR format converter for redundant tag entries
 * @internal
 */
export const jarRedundantTagEntry = Converters.transformObject<
  Model.IRedundantTagRegistryEntry,
  Model.IRedundantTagRegistryEntry
>(
  {
    Type: { from: 'Type', converter: Converters.enumeratedValue<'redundant'>(['redundant']) },
    Tag: { from: 'Tag', converter: TagConverters.redundantTag },
    Description: { from: 'Description', converter: Converters.stringArray },
    Added: { from: 'Added', converter: yearMonthDaySpec },
    Comments: { from: 'Comments', converter: Converters.stringArray, optional: true },
    Deprecated: { from: 'Deprecated', converter: yearMonthDaySpec, optional: true },
    'Preferred-Value': {
      from: 'Preferred-Value',
      converter: TagConverters.extendedLanguageRange,
      optional: true
    }
  },
  {
    strict: true,
    description: 'JAR redundant tag entry'
  }
);

/**
 * JAR format discriminated converter for all registry entries
 * @internal
 */
export const jarRegistryEntry = Converters.discriminatedObject<Model.RegistryEntry>('Type', {
  language: jarLanguageSubtagEntry,
  extlang: jarExtLangSubtagEntry,
  script: jarScriptSubtagEntry,
  region: jarRegionSubtagEntry,
  variant: jarVariantSubtagEntry,
  grandfathered: jarGrandfatheredTagEntry,
  redundant: jarRedundantTagEntry
});
