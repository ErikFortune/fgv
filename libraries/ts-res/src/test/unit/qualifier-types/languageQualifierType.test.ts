/*
 * Copyright (c) 2025 Erik Fortune
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

import '@fgv/ts-utils-jest';
import * as TsRes from '../../../index';

const validTags: string[] = [
  'en-US',
  'en-us',
  'EN-GB',
  'fr',
  'sr-Cyrl-RS',
  'cmn-Hans-CN',
  'es-419',
  'ca-valencia'
];

const invalidTags: string[] = ['en_US', 'fr-', 'sr-Cyrl_RS', 'cmn-Hans_CN', 'es-', 'ca-valencia-'];

describe('LanguageQualifierType', () => {
  describe('create static method', () => {
    test('creates a new LanguageQualifierType with defaults', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create()).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(true);
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LanguageQualifierType with specified values', () => {
      expect(
        TsRes.QualifierTypes.LanguageQualifierType.create({
          name: 'lang',
          allowContextList: false,
          index: 10
        })
      ).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('lang');
        expect(q.name).toBe('lang');
        expect(q.allowContextList).toBe(false);
        expect(q.index).toBe(10);
      });
    });

    test('fails if the name is not a valid qualifier type name', () => {
      expect(
        TsRes.QualifierTypes.LanguageQualifierType.create({
          name: 'not a valid name'
        })
      ).toFailWith(/not a valid qualifier type name/i);
    });
  });

  describe('isValidConditionValue', () => {
    let qt: TsRes.QualifierTypes.LanguageQualifierType;

    beforeEach(() => {
      qt = TsRes.QualifierTypes.LanguageQualifierType.create().getValueOrThrow();
    });

    test('returns true for well-formed BCP-47 tags', () => {
      validTags.forEach((tag) => {
        expect(qt.isValidConditionValue(tag)).toBe(true);
      });
    });

    test('returns false for malformed BCP-47 tags', () => {
      invalidTags.forEach((tag) => {
        expect(qt.isValidConditionValue(tag)).toBe(false);
      });
    });

    describe('matches', () => {
      test('returns a match score for matching tags', () => {
        const condition = 'en-US' as TsRes.QualifierConditionValue;
        const context = 'en-US' as TsRes.QualifierContextValue;
        expect(qt.matches(condition, context, 'matches')).toBe(TsRes.PerfectMatch);
      });

      test('matches using linguistic similarity', () => {
        const condition = 'en' as TsRes.QualifierConditionValue;
        const context = 'en-us' as TsRes.QualifierContextValue;
        const match = qt.matches(condition, context, 'matches');
        expect(match).toBeGreaterThan(TsRes.NoMatch);
        expect(match).toBeLessThan(TsRes.PerfectMatch);
      });

      test('fails for dissimilar tags', () => {
        const condition = 'en' as TsRes.QualifierConditionValue;
        const context = 'fr' as TsRes.QualifierContextValue;
        expect(qt.matches(condition, context, 'matches')).toBe(TsRes.NoMatch);
      });

      test('returns decreasing match scores for subsequent values in a list', () => {
        const context = 'en-US,fr-CA,es-419' as TsRes.QualifierContextValue;
        const exactMatches = ['en-US', 'fr-CA', 'es-419'] as TsRes.QualifierConditionValue[];
        const similarMatches = ['en-GB', 'fr-BE', 'es-ES'] as TsRes.QualifierConditionValue[];

        let score = qt.matches(exactMatches[0], context, 'matches');
        let partialScore = qt.matches(similarMatches[0], context, 'matches');
        expect(score).toBe(TsRes.PerfectMatch);
        expect(partialScore).toBeLessThan(TsRes.PerfectMatch);
        expect(partialScore).toBeGreaterThan(TsRes.NoMatch);

        let lastScore = score;
        let lastPartialScore = partialScore;

        for (let i = 1; i < exactMatches.length; i++) {
          score = qt.matches(exactMatches[i], context, 'matches');
          partialScore = qt.matches(similarMatches[i], context, 'matches');

          expect(score).toBeLessThan(lastScore);
          expect(score).toBeLessThan(lastPartialScore);
          expect(partialScore).toBeLessThan(lastPartialScore);
          expect(partialScore).toBeLessThan(score);
          expect(partialScore).toBeGreaterThan(TsRes.NoMatch);
          lastScore = score;
          lastPartialScore = partialScore;
        }
      });
    });
  });

  describe('createFromConfig static method', () => {
    test('creates a new LanguageQualifierType with minimal config', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'language',
          systemType: 'language'
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(false);
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LanguageQualifierType with custom name', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'lang',
          systemType: 'language'
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('lang');
        expect(q.name).toBe('lang');
        expect(q.allowContextList).toBe(false);
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LanguageQualifierType with allowContextList enabled', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'language',
          systemType: 'language',
          configuration: {
            allowContextList: true
          }
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(true);
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LanguageQualifierType with allowContextList disabled', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'language',
          systemType: 'language',
          configuration: {
            allowContextList: false
          }
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(false);
        expect(q.index).toBeUndefined();
      });
    });

    test('fails if the name is not a valid qualifier type name', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'not a valid name',
          systemType: 'language'
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toFailWith(
        /not a valid qualifier type name/i
      );
    });
  });
});
