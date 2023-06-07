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

import {
  ExtLangSubtag,
  ExtendedLanguageRange,
  GrandfatheredTag,
  LanguageSubtag,
  RegionSubtag,
  ScriptSubtag,
  VariantSubtag
} from '../../../src/iana/language-subtags';
import {
  GenericLanguageTagTest,
  GenericLanguageTagTestInit,
  allCanonicalTestKeys,
  allNonCanonicalTestKeys,
  allNonPreferredCanonicalKeys,
  allPreferredKeys,
  allTestKeys,
  allValidatingKeys
} from './languageTagHelpers';
import { Subtags } from '../../../src/bcp47';

const testCaseInit: GenericLanguageTagTestInit<string>[] = [
  {
    description: 'valid canonical primary language',
    from: 'en',
    expected: [['en', allTestKeys]],
    expectedDescription: [['English', allTestKeys]]
  },
  {
    description: 'valid non-canonical primary language',
    from: 'EN',
    expected: [
      ['EN', allNonCanonicalTestKeys],
      ['en', allCanonicalTestKeys]
    ]
  },
  {
    description: 'valid but deprecated primary language',
    from: 'in',
    expected: [
      ['in', [...allNonCanonicalTestKeys, ...allNonPreferredCanonicalKeys]],
      ['id', allPreferredKeys]
    ],
    expectedDescription: [['Indonesian', allTestKeys]]
  },
  {
    description: 'valid private primary language',
    from: 'qpn',
    expected: [['qpn', allTestKeys]],
    expectedDescription: [['Private use', allTestKeys]]
  },
  {
    description: 'invalid primary language',
    from: 'ENG-US',
    expected: [
      ['ENG-US', ['default', 'wellFormed']],
      ['eng-US', ['wellFormedCanonical']],
      [/invalid language/i, allValidatingKeys]
    ],
    expectedDescription: [['ENG as spoken in United States', ['wellFormed']]]
  },
  {
    description: 'valid canonical extlang',
    from: 'zh-cmn',
    expected: [
      ['zh-cmn', [...allNonCanonicalTestKeys, ...allNonPreferredCanonicalKeys]],
      ['cmn', allPreferredKeys]
    ],
    expectedDescription: [
      ['Chinese / Mandarin Chinese', ['wellFormed']],
      ['Mandarin Chinese', ['preferred']]
    ]
  },
  {
    description: 'valid canonical extlang with additional tags',
    from: 'zh-cmn-CN-x-private',
    expected: [
      ['zh-cmn-CN-x-private', [...allNonCanonicalTestKeys, ...allNonPreferredCanonicalKeys]],
      ['cmn-CN-x-private', allPreferredKeys]
    ],
    expectedDescription: [
      ['Chinese / Mandarin Chinese as spoken in China (-x "private")', ['wellFormed']],
      ['Mandarin Chinese as spoken in China (-x "private")', ['preferred']]
    ]
  },
  {
    description: 'valid non-canonical extlang',
    from: 'ZH-Cmn',
    expected: [
      ['ZH-Cmn', allNonCanonicalTestKeys],
      ['zh-cmn', allCanonicalTestKeys],
      ['cmn', allPreferredKeys]
    ]
  },
  {
    description: 'invalid extlang',
    from: 'zh-Han',
    expected: [
      ['zh-Han', ['default', 'wellFormed']],
      ['zh-han', ['wellFormedCanonical']],
      [/invalid extlang/i, allValidatingKeys]
    ],
    expectedDescription: [['Chinese / Han', ['wellFormed']]]
  },
  {
    description: 'valid extlang with invalid prefix',
    from: 'en-cmn-us',
    expected: [
      ['en-cmn-us', ['default', 'wellFormed', 'valid']],
      ['en-cmn-US', ['wellFormedCanonical', 'validCanonical', 'preferred']],
      [/invalid prefix/i, ['strictlyValid', 'strictlyValidCanonical', 'strictlyValidPreferred']]
    ],
    expectedDescription: [['English / Mandarin Chinese as spoken in United States', ['wellFormed']]]
  },
  {
    description: 'multiple extlang',
    from: 'zh-cmn-yue',
    expected: [
      ['zh-cmn-yue', ['default', 'wellFormed', 'wellFormedCanonical']],
      [/multiple extlang/i, allValidatingKeys]
    ],
    expectedDescription: [['Chinese / Mandarin Chinese / Yue Chinese', ['wellFormed']]]
  },
  {
    description: 'valid non-canonical, non-suppressed script',
    from: 'zh-LATN',
    expected: [
      ['zh-LATN', allNonCanonicalTestKeys],
      ['zh-Latn', allCanonicalTestKeys]
    ],
    expectedDescription: [['Chinese in Latin script', ['wellFormed', 'preferred']]]
  },
  {
    description: 'valid non-canonical, suppressed script',
    from: 'en-LATN',
    expected: [
      ['en-LATN', allNonCanonicalTestKeys],
      ['en-Latn', allNonPreferredCanonicalKeys],
      ['en', allPreferredKeys]
    ],
    expectedDescription: [
      ['English in Latin script', ['wellFormed']],
      ['English', ['preferred']]
    ]
  },
  {
    description: 'invalid script',
    from: 'en-AaaA',
    expected: [
      ['en-AaaA', ['default', 'wellFormed']],
      ['en-Aaaa', ['wellFormedCanonical']],
      [/invalid script/i, allValidatingKeys]
    ],
    expectedDescription: [['English in AaaA script', ['wellFormed']]]
  },
  {
    description: 'valid non-canonical iso3166-2 region',
    from: 'en-aq',
    expected: [
      ['en-aq', allNonCanonicalTestKeys],
      ['en-AQ', allCanonicalTestKeys]
    ],
    expectedDescription: [['English as spoken in Antarctica', ['wellFormed', 'preferred']]]
  },
  {
    description: 'valid non-canonical UN M.49 region',
    from: 'es-419',
    expected: [['es-419', allTestKeys]],
    expectedDescription: [['Spanish as spoken in Latin America and the Caribbean', allTestKeys]]
  },
  {
    description: 'invalid region',
    from: 'en-AJ',
    expected: [
      ['en-AJ', ['default', 'wellFormed', 'wellFormedCanonical']],
      [/invalid region/i, allValidatingKeys]
    ],
    expectedDescription: [['English as spoken in AJ', ['wellFormed']]]
  },
  {
    description: 'strictly valid non-canonical variant',
    from: 'ca-Valencia',
    expected: [
      ['ca-Valencia', allNonCanonicalTestKeys],
      ['ca-valencia', allCanonicalTestKeys]
    ],
    expectedDescription: [['Catalan (Valencian)', ['wellFormed']]]
  },
  {
    description: 'not strictly-valid non-canonical variant',
    from: 'fr-Valencia',
    expected: [
      ['fr-Valencia', ['default', 'wellFormed', 'valid']],
      ['fr-valencia', ['wellFormedCanonical', 'validCanonical', 'preferred']],
      [/invalid prefix/i, ['strictlyValid', 'strictlyValidCanonical', 'strictlyValidPreferred']]
    ],
    expectedDescription: [['French (Valencian)', ['wellFormed']]]
  },
  {
    description: 'valid but deprecated region',
    from: 'en-BU',
    expected: [
      ['en-BU', [...allNonCanonicalTestKeys, ...allNonPreferredCanonicalKeys]],
      ['en-MM', allPreferredKeys]
    ],
    expectedDescription: [
      ['English as spoken in Burma', ['wellFormed']],
      ['English as spoken in Myanmar', ['preferred']]
    ]
  },
  {
    description: 'any prefix for variant with no registered prefix',
    from: 'en-alalc97',
    expected: [['en-alalc97', allTestKeys]],
    expectedDescription: [['English (ALA-LC Romanization, 1997 edition)', ['wellFormed']]]
  },
  {
    description: 'strictly valid with two variants',
    from: 'SL-Rozaj-Lipaw',
    expected: [
      ['SL-Rozaj-Lipaw', allNonCanonicalTestKeys],
      ['sl-rozaj-lipaw', allCanonicalTestKeys]
    ],
    expectedDescription: [['Slovenian (Resian) (The Lipovaz dialect of Resian)', ['wellFormed']]]
  },
  {
    description: 'strictly valid with multiple variants',
    from: 'SL-Rozaj-biske-1994',
    expected: [
      ['SL-Rozaj-biske-1994', allNonCanonicalTestKeys],
      ['sl-rozaj-biske-1994', allCanonicalTestKeys]
    ],
    expectedDescription: [
      [
        'Slovenian (Resian) (The San Giorgio dialect of Resian) (Standardized Resian orthography)',
        ['wellFormed']
      ]
    ]
  },
  {
    description: 'not strictly valid with multiple variants',
    from: 'SL-Rozaj-1996',
    expected: [
      ['SL-Rozaj-1996', ['default', 'wellFormed', 'valid']],
      ['sl-rozaj-1996', ['wellFormedCanonical', 'validCanonical', 'preferred']],
      [/invalid prefix/i, ['strictlyValid', 'strictlyValidCanonical', 'strictlyValidPreferred']]
    ],
    expectedDescription: [['Slovenian (Resian) (German orthography of 1996)', ['wellFormed']]]
  },
  {
    description: 'invalid variant',
    from: 'ca-ES-xyzzy',
    expected: [
      ['ca-ES-xyzzy', ['default', 'wellFormed', 'wellFormedCanonical']],
      [/invalid variant/i, allValidatingKeys]
    ],
    expectedDescription: [['Catalan as spoken in Spain (xyzzy)', ['wellFormed']]]
  },
  {
    description: 'invalid duplicate variant',
    from: 'ca-valencia-valencia',
    expected: [
      ['ca-valencia-valencia', ['default', 'wellFormed', 'wellFormedCanonical']],
      [/duplicate variant/i, allValidatingKeys]
    ],
    expectedDescription: [['Catalan (Valencian) (Valencian)', ['wellFormed']]]
  },
  {
    description: 'valid extensions',
    from: 'en-us-u-en-US-t-MT',
    expected: [
      ['en-us-u-en-US-t-MT', allNonCanonicalTestKeys],
      ['en-US-u-en-US-t-mt', allCanonicalTestKeys]
    ],
    expectedDescription: [
      [
        'English as spoken in United States (Unicode Locale "en-US") (Specifying Transformed Content "MT")',
        ['wellFormed']
      ]
    ]
  },
  {
    description: 'invalid extension',
    from: 'es-us-a-extend',
    expected: [
      ['es-us-a-extend', ['default', 'wellFormed']],
      ['es-US-a-extend', ['wellFormedCanonical']],
      [/invalid.*extension/i, allValidatingKeys]
    ],
    expectedDescription: [['Spanish as spoken in United States (-a "extend")', ['wellFormed']]]
  },
  {
    description: 'duplicate extension',
    from: 'es-us-u-US-u-GB',
    expected: [
      ['es-us-u-US-u-GB', ['default', 'wellFormed']],
      ['es-US-u-us-u-gb', ['wellFormedCanonical']],
      [/duplicate.*extension/i, allValidatingKeys]
    ]
  },
  {
    description: 'valid private-use subtag',
    from: 'en-x-Pig-Latin',
    expected: [
      ['en-x-Pig-Latin', allNonCanonicalTestKeys],
      ['en-x-pig-latin', allCanonicalTestKeys]
    ],
    expectedDescription: [
      ['English (-x "Pig-Latin")', ['wellFormed']],
      ['English (-x "pig-latin")', ['preferred']]
    ]
  },
  {
    description: 'valid extension and private use subtag',
    from: 'en-US-u-us-x-test',
    expected: [['en-US-u-us-x-test', allTestKeys]],
    expectedDescription: [
      ['English as spoken in United States (Unicode Locale "us") (-x "test")', ['wellFormed']]
    ]
  },
  {
    description: 'valid grandfathered tag with no preferredValue',
    from: 'i-Mingo',
    expected: [
      ['i-Mingo', allNonCanonicalTestKeys],
      ['i-mingo', allCanonicalTestKeys]
    ],
    expectedDescription: [
      ['i-Mingo (grandfathered)', ['wellFormed']],
      ['i-mingo (grandfathered)', ['preferred']]
    ]
  },
  {
    description: 'valid grandfathered tag with preferredValue',
    from: 'art-lojban',
    expected: [
      ['art-lojban', [...allNonCanonicalTestKeys, ...allNonPreferredCanonicalKeys]],
      ['jbo', allPreferredKeys]
    ],
    expectedDescription: [
      ['art-lojban (grandfathered)', ['wellFormed']],
      ['Lojban', ['preferred']]
    ]
  },
  {
    description: 'valid grandfathered tag with complex preferred value',
    from: 'en-gb-oed',
    expected: [
      ['en-gb-oed', allNonCanonicalTestKeys],
      ['en-GB-oed', allNonPreferredCanonicalKeys],
      ['en-GB-oxendict', allPreferredKeys]
    ],
    expectedDescription: [
      ['en-gb-oed (grandfathered)', ['wellFormed']],
      ['English as spoken in United Kingdom (Oxford English Dictionary spelling)', ['preferred']]
    ]
  },
  {
    description: 'valid redundant tag with no preferredValue',
    from: 'mn-Mong',
    expected: [['mn-Mong', allTestKeys]],
    expectedDescription: [['Mongolian in Mongolian script', allTestKeys]]
  },
  {
    description: 'valid redundant tag with preferred value',
    from: 'sgn-BR',
    expected: [
      ['sgn-BR', [...allNonCanonicalTestKeys, ...allNonPreferredCanonicalKeys]],
      ['bzs', allPreferredKeys]
    ],
    expectedDescription: [
      ['Sign languages as spoken in Brazil', ['wellFormed']],
      ['Brazilian Sign Language', ['preferred']]
    ]
  },
  {
    description: 'invalid private tag',
    from: 'x-thing-x-other-thing-x-last-thing',
    expected: [[/malformed private-use/i, allTestKeys]]
  },
  {
    description: 'completely private tag with multiple tags',
    from: 'x-some-bunch-of-things',
    expected: [
      ['x-some-bunch-of-things', allNonCanonicalTestKeys],
      ['x-some-bunch-OF-things', allCanonicalTestKeys]
    ],
    expectedDescription: [
      ['(-x "some-bunch-of-things")', ['wellFormed']],
      ['(-x "some-bunch-OF-things")', ['preferred']]
    ]
  }
];

const subtagsTestCaseInit: GenericLanguageTagTestInit<Subtags>[] = [
  {
    description: 'valid non-canonical tag with suppressed script',
    from: {
      primaryLanguage: 'en' as LanguageSubtag,
      script: 'latn' as ScriptSubtag,
      region: 'us' as RegionSubtag,
      privateUse: ['Non', 'Canon'] as ExtendedLanguageRange[]
    },
    expected: [
      ['en-latn-us-x-Non-Canon', ['default', 'wellFormed', 'valid', 'strictlyValid']],
      ['en-Latn-US-x-non-canon', ['wellFormedCanonical', 'validCanonical', 'strictlyValidCanonical']],
      ['en-US-x-non-canon', ['preferred', 'strictlyValidPreferred']]
    ]
  },
  {
    description: 'missing primary language',
    from: { extlangs: ['cmn' as ExtLangSubtag, 'yue' as ExtLangSubtag] },
    expected: [[/missing primary language/i, allTestKeys]]
  },
  {
    // the grammar allows for up to three extlang tags but the specification reserves
    // and forbids them, so two tags only fails for validating forms.
    description: 'multiple extlang tags',
    from: { primaryLanguage: 'zh' as LanguageSubtag, extlangs: ['cmn', 'yue'] as ExtLangSubtag[] },
    expected: [
      ['zh-cmn-yue', ['default', 'wellFormed', 'wellFormedCanonical']],
      [/multiple extlang/, allValidatingKeys]
    ]
  },
  {
    // the grammar forbids > 3 extlang tags so this fails for all forms
    description: 'too many extlang tags',
    from: {
      primaryLanguage: 'zh' as LanguageSubtag,
      extlangs: ['cmn', 'yue', 'cdo', 'cjy'] as ExtLangSubtag[]
    },
    expected: [[/too many extlang/, allTestKeys]]
  },
  {
    description: 'invalid script tag',
    from: { primaryLanguage: 'en' as LanguageSubtag, script: 'Xyzy' as ScriptSubtag },
    expected: [
      ['en-Xyzy', ['default', 'preferred', 'wellFormed', 'wellFormedCanonical']],
      [/invalid script/i, allValidatingKeys]
    ]
  },
  {
    description: 'duplicate variant tags',
    from: { primaryLanguage: 'ca' as LanguageSubtag, variants: ['valencia', 'Valencia'] as VariantSubtag[] },
    expected: [
      ['ca-valencia-Valencia', ['default', 'wellFormed']],
      ['ca-valencia-valencia', ['wellFormedCanonical']],
      [/duplicate variant/, allValidatingKeys]
    ]
  },
  {
    description: 'invalid grandfathered tag',
    from: { grandfathered: 'i-dothraki' as GrandfatheredTag },
    expected: [
      ['i-dothraki', ['default', 'wellFormed', 'wellFormedCanonical']],
      [/invalid grandfathered/i, [...allValidatingKeys]]
    ]
  }
];

export const tagTestCases = testCaseInit.map(GenericLanguageTagTest.mapInitToTestCases);
export const subtagsTestCases = subtagsTestCaseInit.map(GenericLanguageTagTest.mapInitToTestCases);
