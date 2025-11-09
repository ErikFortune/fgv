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

describe('Qualifier Default Value Functionality', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create({
          name: 'environment',
          enumeratedValues: ['development', 'staging', 'production']
        }).orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create({
          name: 'platform',
          enumeratedValues: ['web', 'mobile', 'desktop']
        }).orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'region',
          allowContextList: true
        }).orThrow()
      ]
    }).orThrow();
  });

  describe('Qualifier creation with valid default values', () => {
    describe('Language qualifier type', () => {
      test('creates qualifier with single language default value', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100,
          defaultValue: 'en-US'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toSucceedAndSatisfy((validated) => {
          expect(validated.defaultValue).toBe('en-US');

          expect(TsRes.Qualifiers.Qualifier.create(validated)).toSucceedAndSatisfy((qualifier) => {
            expect(qualifier.defaultValue).toBe('en-US');
            expect(qualifier.name).toBe('language');
            expect(qualifier.type.name).toBe('language');
          });
        });
      });

      test('creates qualifier with comma-separated language default values', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100,
          defaultValue: 'en-US, fr-CA, de-DE'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toSucceedAndSatisfy((validated) => {
          expect(validated.defaultValue).toBe('en-US, fr-CA, de-DE');

          expect(TsRes.Qualifiers.Qualifier.create(validated)).toSucceedAndSatisfy((qualifier) => {
            expect(qualifier.defaultValue).toBe('en-US, fr-CA, de-DE');
          });
        });
      });

      test('creates qualifier with compact comma-separated language default values', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100,
          defaultValue: 'en,fr,de'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toSucceedAndSatisfy((validated) => {
          expect(validated.defaultValue).toBe('en,fr,de');

          expect(TsRes.Qualifiers.Qualifier.create(validated)).toSucceedAndSatisfy((qualifier) => {
            expect(qualifier.defaultValue).toBe('en,fr,de');
          });
        });
      });
    });

    describe('Territory qualifier type', () => {
      test('creates qualifier with single territory default value', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'territory',
          typeName: 'territory',
          defaultPriority: 100,
          defaultValue: 'US'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toSucceedAndSatisfy((validated) => {
          expect(validated.defaultValue).toBe('US');

          expect(TsRes.Qualifiers.Qualifier.create(validated)).toSucceedAndSatisfy((qualifier) => {
            expect(qualifier.defaultValue).toBe('US');
            expect(qualifier.name).toBe('territory');
            expect(qualifier.type.name).toBe('territory');
          });
        });
      });
    });

    describe('Territory qualifier type with context list enabled', () => {
      test('creates qualifier with comma-separated territory default values', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'region',
          typeName: 'region',
          defaultPriority: 100,
          defaultValue: 'US, CA, GB'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toSucceedAndSatisfy((validated) => {
          expect(validated.defaultValue).toBe('US, CA, GB');

          expect(TsRes.Qualifiers.Qualifier.create(validated)).toSucceedAndSatisfy((qualifier) => {
            expect(qualifier.defaultValue).toBe('US, CA, GB');
            expect(qualifier.name).toBe('region');
            expect(qualifier.type.allowContextList).toBe(true);
          });
        });
      });
    });

    describe('Literal qualifier type', () => {
      test('creates qualifier with single enumerated default value', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'environment',
          typeName: 'environment',
          defaultPriority: 100,
          defaultValue: 'production'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toSucceedAndSatisfy((validated) => {
          expect(validated.defaultValue).toBe('production');

          expect(TsRes.Qualifiers.Qualifier.create(validated)).toSucceedAndSatisfy((qualifier) => {
            expect(qualifier.defaultValue).toBe('production');
            expect(qualifier.name).toBe('environment');
            expect(qualifier.type.name).toBe('environment');
          });
        });
      });

      test('creates qualifier with comma-separated enumerated default values', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'platform',
          typeName: 'platform',
          defaultPriority: 100,
          defaultValue: 'web, mobile, desktop'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toSucceedAndSatisfy((validated) => {
          expect(validated.defaultValue).toBe('web, mobile, desktop');

          expect(TsRes.Qualifiers.Qualifier.create(validated)).toSucceedAndSatisfy((qualifier) => {
            expect(qualifier.defaultValue).toBe('web, mobile, desktop');
            expect(qualifier.type.allowContextList).toBe(true);
          });
        });
      });
    });

    describe('Qualifier without default value', () => {
      test('creates qualifier with undefined default value when not specified', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toSucceedAndSatisfy((validated) => {
          expect(validated.defaultValue).toBeUndefined();

          expect(TsRes.Qualifiers.Qualifier.create(validated)).toSucceedAndSatisfy((qualifier) => {
            expect(qualifier.defaultValue).toBeUndefined();
          });
        });
      });
    });
  });

  describe('Qualifier creation with invalid default values', () => {
    describe('Language qualifier type validation', () => {
      test('fails with invalid language tag', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100,
          defaultValue: 'invalid-language-tag'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toFailWith(/invalid.*context.*value/i);
      });

      test('fails with comma-separated list containing invalid language tag', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100,
          defaultValue: 'en-US, invalid-tag, fr-CA'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toFailWith(/invalid.*context.*value/i);
      });

      test('fails with empty string in comma-separated list', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100,
          defaultValue: 'en-US, , fr-CA'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toFailWith(/invalid.*context.*value/i);
      });
    });

    describe('Territory qualifier type validation', () => {
      test('fails with invalid territory code', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'territory',
          typeName: 'territory',
          defaultPriority: 100,
          defaultValue: 'INVALID'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toFailWith(/invalid.*context.*value/i);
      });

      test('fails with comma-separated territories when context list not allowed', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'territory',
          typeName: 'territory',
          defaultPriority: 100,
          defaultValue: 'US, CA, GB'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toFailWith(/invalid.*context.*value/i);
      });
    });

    describe('Literal qualifier type validation', () => {
      test('fails with value not in enumerated list', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'environment',
          typeName: 'environment',
          defaultPriority: 100,
          defaultValue: 'invalid-environment'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toFailWith(/invalid.*context.*value/i);
      });

      test('fails with comma-separated list containing invalid enumerated value', () => {
        const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
          name: 'platform',
          typeName: 'platform',
          defaultPriority: 100,
          defaultValue: 'web, invalid-platform, mobile'
        };

        expect(
          TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
        ).toFailWith(/invalid.*context.*value/i);
      });
    });
  });

  describe('Context list behavior validation', () => {
    test('allows comma-separated values for language qualifier type (allowContextList: true)', () => {
      const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
        name: 'language',
        typeName: 'language',
        defaultPriority: 100,
        defaultValue: 'en-US, fr-CA'
      };

      expect(
        TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
      ).toSucceedAndSatisfy((validated) => {
        expect(validated.defaultValue).toBe('en-US, fr-CA');
        expect(validated.type.allowContextList).toBe(true);
      });
    });

    test('allows comma-separated values for literal qualifier type (allowContextList: true)', () => {
      const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
        name: 'environment',
        typeName: 'environment',
        defaultPriority: 100,
        defaultValue: 'development, staging'
      };

      expect(
        TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
      ).toSucceedAndSatisfy((validated) => {
        expect(validated.defaultValue).toBe('development, staging');
        expect(validated.type.allowContextList).toBe(true);
      });
    });

    test('allows comma-separated values for territory qualifier type when context list enabled', () => {
      const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
        name: 'region',
        typeName: 'region',
        defaultPriority: 100,
        defaultValue: 'US, CA'
      };

      expect(
        TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
      ).toSucceedAndSatisfy((validated) => {
        expect(validated.defaultValue).toBe('US, CA');
        expect(validated.type.allowContextList).toBe(true);
      });
    });

    test('rejects comma-separated values for territory qualifier type when context list disabled', () => {
      const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
        name: 'territory',
        typeName: 'territory',
        defaultPriority: 100,
        defaultValue: 'US, CA'
      };

      expect(
        TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
      ).toFailWith(/invalid.*territory/i);
    });
  });

  describe('Integration with QualifierCollector', () => {
    test('creates QualifierCollector with qualifiers having default values', () => {
      const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
        {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100,
          defaultValue: 'en-US, fr-CA'
        },
        {
          name: 'environment',
          typeName: 'environment',
          defaultPriority: 200,
          defaultValue: 'production'
        },
        {
          name: 'region',
          typeName: 'region',
          defaultPriority: 150,
          defaultValue: 'US, CA, GB'
        }
      ];

      expect(
        TsRes.Qualifiers.QualifierCollector.create({
          qualifierTypes,
          qualifiers: qualifierDecls
        })
      ).toSucceedAndSatisfy((collector) => {
        expect(collector.size).toBe(3);

        // Test language qualifier
        expect(collector.validating.get('language')).toSucceedAndSatisfy((language) => {
          expect(language.defaultValue).toBe('en-US, fr-CA');
        });

        // Test environment qualifier
        expect(collector.validating.get('environment')).toSucceedAndSatisfy((environment) => {
          expect(environment.defaultValue).toBe('production');
        });

        // Test region qualifier
        expect(collector.validating.get('region')).toSucceedAndSatisfy((region) => {
          expect(region.defaultValue).toBe('US, CA, GB');
        });
      });
    });

    test('creates QualifierCollector with mix of qualifiers with and without default values', () => {
      const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
        {
          name: 'language',
          typeName: 'language',
          defaultPriority: 100,
          defaultValue: 'en-US'
        },
        {
          name: 'territory',
          typeName: 'territory',
          defaultPriority: 200
          // No defaultValue
        }
      ];

      expect(
        TsRes.Qualifiers.QualifierCollector.create({
          qualifierTypes,
          qualifiers: qualifierDecls
        })
      ).toSucceedAndSatisfy((collector) => {
        expect(collector.size).toBe(2);

        // Test qualifier with default value
        expect(collector.validating.get('language')).toSucceedAndSatisfy((language) => {
          expect(language.defaultValue).toBe('en-US');
        });

        // Test qualifier without default value
        expect(collector.validating.get('territory')).toSucceedAndSatisfy((territory) => {
          expect(territory.defaultValue).toBeUndefined();
        });
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    test('handles empty string default value as undefined', () => {
      const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
        name: 'language',
        typeName: 'language',
        defaultPriority: 100,
        defaultValue: ''
      };

      expect(
        TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
      ).toSucceedAndSatisfy((validated) => {
        // Empty string is treated as falsy and converted to undefined
        expect(validated.defaultValue).toBeUndefined();
      });
    });

    test('handles whitespace-only default value', () => {
      const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
        name: 'language',
        typeName: 'language',
        defaultPriority: 100,
        defaultValue: '   '
      };

      expect(
        TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
      ).toFailWith(/invalid.*context.*value/i);
    });

    test('handles comma-only default value', () => {
      const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
        name: 'language',
        typeName: 'language',
        defaultPriority: 100,
        defaultValue: ','
      };

      expect(
        TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
      ).toFailWith(/invalid.*context.*value/i);
    });

    test('trims whitespace around comma-separated values', () => {
      const qualifierDecl: TsRes.Qualifiers.IQualifierDecl = {
        name: 'language',
        typeName: 'language',
        defaultPriority: 100,
        defaultValue: '  en-US  ,  fr-CA  ,  de-DE  '
      };

      expect(
        TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(qualifierDecl, { qualifierTypes })
      ).toSucceedAndSatisfy((validated) => {
        // The validation should succeed because trimming is handled internally
        expect(validated.defaultValue).toBe('  en-US  ,  fr-CA  ,  de-DE  ');
      });
    });
  });
});
