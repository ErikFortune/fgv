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

describe('Condition scoreAsDefault Automatic Initialization', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create({
          name: 'environment',
          enumeratedValues: ['development', 'staging', 'production']
        }).orThrow()
      ]
    }).orThrow();
  });

  describe('Language qualifier type with default value', () => {
    beforeEach(() => {
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100,
            defaultValue: 'en-US'
          }
        ]
      }).orThrow();
    });

    test('creates condition with perfect match scoreAsDefault for identical language', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'en-US'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('en-US');
          expect(condition.scoreAsDefault).toBe(TsRes.PerfectMatch);
          expect(condition.key).toBe('language-[en-US]@100(1)');
        });
      });
    });

    test('creates condition with partial match scoreAsDefault for similar language', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'en'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('en');
          expect(condition.scoreAsDefault).toBeGreaterThan(TsRes.NoMatch);
          expect(condition.scoreAsDefault).toBeLessThan(TsRes.PerfectMatch);
        });
      });
    });

    test('creates condition with undefined scoreAsDefault for non-matching language', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'fr-FR'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('fr-FR');
          expect(condition.scoreAsDefault).toBeUndefined();
          expect(condition.key).toBe('language-[fr-FR]@100');
        });
      });
    });

    test('respects explicit scoreAsDefault over automatic calculation', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'en-US',
            scoreAsDefault: 0.7
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('en-US');
          expect(condition.scoreAsDefault).toBe(0.7);
          expect(condition.key).toBe('language-[en-US]@100(0.7)');
        });
      });
    });
  });

  describe('Territory qualifier type with default value', () => {
    beforeEach(() => {
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'territory',
            typeName: 'territory',
            defaultPriority: 200,
            defaultValue: 'US'
          }
        ]
      }).orThrow();
    });

    test('creates condition with perfect match scoreAsDefault for identical territory', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'territory',
            value: 'US'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('US');
          expect(condition.scoreAsDefault).toBe(TsRes.PerfectMatch);
          expect(condition.key).toBe('territory-[US]@200(1)');
        });
      });
    });

    test('creates condition with undefined scoreAsDefault for non-matching territory', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'territory',
            value: 'CA'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('CA');
          expect(condition.scoreAsDefault).toBeUndefined();
          expect(condition.key).toBe('territory-[CA]@200');
        });
      });
    });
  });

  describe('Literal qualifier type with default value', () => {
    beforeEach(() => {
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'environment',
            typeName: 'environment',
            defaultPriority: 300,
            defaultValue: 'production'
          }
        ]
      }).orThrow();
    });

    test('creates condition with perfect match scoreAsDefault for identical literal value', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'environment',
            value: 'production'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('production');
          expect(condition.scoreAsDefault).toBe(TsRes.PerfectMatch);
          expect(condition.key).toBe('environment-[production]@300(1)');
        });
      });
    });

    test('creates condition with undefined scoreAsDefault for non-matching literal value', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'environment',
            value: 'development'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('development');
          expect(condition.scoreAsDefault).toBeUndefined();
          expect(condition.key).toBe('environment-[development]@300');
        });
      });
    });
  });

  describe('Qualifier without default value', () => {
    beforeEach(() => {
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100
            // No defaultValue
          }
        ]
      }).orThrow();
    });

    test('creates condition with undefined scoreAsDefault when qualifier has no default value', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'en-US'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('en-US');
          expect(condition.scoreAsDefault).toBeUndefined();
          expect(condition.key).toBe('language-[en-US]@100');
        });
      });
    });

    test('respects explicit scoreAsDefault when qualifier has no default value', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'en-US',
            scoreAsDefault: 0.8
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('en-US');
          expect(condition.scoreAsDefault).toBe(0.8);
          expect(condition.key).toBe('language-[en-US]@100(0.8)');
        });
      });
    });
  });

  describe('Language qualifier with comma-separated default value', () => {
    beforeEach(() => {
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100,
            defaultValue: 'en-US, en-CA, en-GB'
          }
        ]
      }).orThrow();
    });

    test('creates condition with match scoreAsDefault for exact match in comma-separated list', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'en-CA'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('en-CA');
          expect(condition.scoreAsDefault).toBeGreaterThan(0);
          expect(condition.scoreAsDefault).toBeLessThanOrEqual(TsRes.PerfectMatch);
        });
      });
    });

    test('creates condition with partial match scoreAsDefault for similar language in list', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'en'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('en');
          expect(condition.scoreAsDefault).toBeGreaterThan(0);
          expect(condition.scoreAsDefault).toBeLessThan(TsRes.PerfectMatch);
        });
      });
    });

    test('creates condition with undefined scoreAsDefault for non-matching language', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'fr-FR'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('fr-FR');
          expect(condition.scoreAsDefault).toBeUndefined();
        });
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    beforeEach(() => {
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100,
            defaultValue: 'en-US'
          },
          {
            name: 'territory',
            typeName: 'territory',
            defaultPriority: 200,
            defaultValue: 'US'
          }
        ]
      }).orThrow();
    });

    test('handles case sensitivity correctly for territory codes', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'territory',
            value: 'US'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('US');
          expect(condition.scoreAsDefault).toBe(TsRes.PerfectMatch);
        });
      });
    });

    test('handles multiple conditions with different match qualities', () => {
      const conditions = [
        {
          qualifierName: 'language',
          value: 'en-US' // Perfect match
        },
        {
          qualifierName: 'language',
          value: 'en' // Partial match
        },
        {
          qualifierName: 'language',
          value: 'fr-FR' // No match
        }
      ];

      conditions.forEach((conditionDecl, index) => {
        expect(
          TsRes.Conditions.Convert.validatedConditionDecl.convert(conditionDecl, { qualifiers })
        ).toSucceedAndSatisfy((validated) => {
          expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
            if (index === 0) {
              // Perfect match
              expect(condition.scoreAsDefault).toBe(TsRes.PerfectMatch);
            } else if (index === 1) {
              // Partial match
              expect(condition.scoreAsDefault).toBeGreaterThan(0);
              expect(condition.scoreAsDefault).toBeLessThan(TsRes.PerfectMatch);
            } else {
              // No match
              expect(condition.scoreAsDefault).toBeUndefined();
            }
          });
        });
      });
    });

    test('scoreAsDefault does not affect other condition properties', () => {
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'en-US',
            priority: 150,
            operator: 'matches'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('en-US');
          expect(condition.priority).toBe(150);
          expect(condition.operator).toBe('matches');
          expect(condition.qualifier.name).toBe('language');
          expect(condition.scoreAsDefault).toBe(TsRes.PerfectMatch);
        });
      });
    });

    test('creates condition successfully when default value validation would fail for condition', () => {
      // Test with a valid condition value that doesn't match the default
      expect(
        TsRes.Conditions.Convert.validatedConditionDecl.convert(
          {
            qualifierName: 'language',
            value: 'fr-FR'
          },
          { qualifiers }
        )
      ).toSucceedAndSatisfy((validated) => {
        expect(TsRes.Conditions.Condition.create(validated)).toSucceedAndSatisfy((condition) => {
          expect(condition.value).toBe('fr-FR');
          expect(condition.scoreAsDefault).toBeUndefined();
        });
      });
    });
  });

  describe('Integration with condition comparison and sorting', () => {
    beforeEach(() => {
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100,
            defaultValue: 'en-US'
          }
        ]
      }).orThrow();
    });

    test('conditions with higher scoreAsDefault compare higher when other properties equal', () => {
      const condition1 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'language',
            value: 'en-US' // Perfect match -> scoreAsDefault = 1.0
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();

      const condition2 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'language',
            value: 'en' // Partial match -> scoreAsDefault < 1.0
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();

      expect(TsRes.Conditions.Condition.compare(condition1, condition2)).toBeGreaterThan(0);
      expect(TsRes.Conditions.Condition.compare(condition2, condition1)).toBeLessThan(0);
    });

    test('scoreAsDefault participates correctly in condition ordering', () => {
      const conditions = [
        TsRes.Conditions.Convert.validatedConditionDecl
          .convert(
            {
              qualifierName: 'language',
              value: 'fr-FR' // No match -> scoreAsDefault = undefined
            },
            { qualifiers }
          )
          .onSuccess(TsRes.Conditions.Condition.create)
          .orThrow(),
        TsRes.Conditions.Convert.validatedConditionDecl
          .convert(
            {
              qualifierName: 'language',
              value: 'en' // Partial match -> scoreAsDefault between 0 and 1
            },
            { qualifiers }
          )
          .onSuccess(TsRes.Conditions.Condition.create)
          .orThrow(),
        TsRes.Conditions.Convert.validatedConditionDecl
          .convert(
            {
              qualifierName: 'language',
              value: 'en-US' // Perfect match -> scoreAsDefault = 1.0
            },
            { qualifiers }
          )
          .onSuccess(TsRes.Conditions.Condition.create)
          .orThrow()
      ];

      const sorted = conditions.sort(TsRes.Conditions.Condition.compare);

      // Should be ordered by scoreAsDefault: undefined (0), partial match, perfect match (1.0)
      expect(sorted[0].value).toBe('fr-FR');
      expect(sorted[0].scoreAsDefault).toBeUndefined();
      expect(sorted[1].value).toBe('en');
      expect(sorted[1].scoreAsDefault).toBeGreaterThan(0);
      expect(sorted[1].scoreAsDefault).toBeLessThan(1);
      expect(sorted[2].value).toBe('en-US');
      expect(sorted[2].scoreAsDefault).toBe(TsRes.PerfectMatch);
    });
  });

  describe('Direct constructor scoreAsDefault fallback logic', () => {
    let languageQualifier: TsRes.Qualifiers.Qualifier;

    beforeEach(() => {
      qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
        qualifierTypes: [TsRes.QualifierTypes.LanguageQualifierType.create().orThrow()]
      }).orThrow();

      const qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100,
            defaultValue: 'en-US'
          }
        ]
      }).orThrow();

      languageQualifier = qualifiers.validating.get('language').orThrow();
    });

    test('should calculate scoreAsDefault when undefined and qualifier has default value', () => {
      // Test the specific code path in lines 95-99 of condition.ts
      // Create validated condition decl with scoreAsDefault explicitly undefined
      const validatedValue = languageQualifier.validateCondition('en', 'matches').orThrow();
      const validatedDecl: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier: languageQualifier,
        value: validatedValue, // This should partially match the default 'en-US'
        operator: 'matches' as unknown as TsRes.ConditionOperator,
        priority: 100 as unknown as TsRes.ConditionPriority,
        scoreAsDefault: undefined, // Explicitly undefined to trigger the fallback
        index: 0 as unknown as TsRes.ConditionIndex
      };

      expect(TsRes.Conditions.Condition.create(validatedDecl)).toSucceedAndSatisfy((condition) => {
        // The scoreAsDefault should be calculated automatically from the partial match
        expect(condition.scoreAsDefault).toBeGreaterThan(TsRes.NoMatch);
        expect(condition.scoreAsDefault).toBeLessThan(TsRes.PerfectMatch);
      });
    });

    test('should not calculate scoreAsDefault when qualifier has no default value', () => {
      // Create a qualifier without default value
      const qualifiersNoDefault = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          {
            name: 'languageNoDefault',
            typeName: 'language',
            defaultPriority: 100
            // No defaultValue
          }
        ]
      }).orThrow();

      const qualifierNoDefault = qualifiersNoDefault.validating.get('languageNoDefault').orThrow();
      const validatedValue = qualifierNoDefault.validateCondition('en-US', 'matches').orThrow();

      const validatedDecl: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier: qualifierNoDefault,
        value: validatedValue,
        operator: 'matches' as unknown as TsRes.ConditionOperator,
        priority: 100 as unknown as TsRes.ConditionPriority,
        scoreAsDefault: undefined,
        index: 0 as unknown as TsRes.ConditionIndex
      };

      expect(TsRes.Conditions.Condition.create(validatedDecl)).toSucceedAndSatisfy((condition) => {
        // scoreAsDefault should remain undefined
        expect(condition.scoreAsDefault).toBeUndefined();
      });
    });

    test('should not calculate scoreAsDefault when match returns NoMatch', () => {
      const validatedValue = languageQualifier.validateCondition('zh-CN', 'matches').orThrow();
      const validatedDecl: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier: languageQualifier,
        value: validatedValue, // This should not match the default 'en-US' at all
        operator: 'matches' as unknown as TsRes.ConditionOperator,
        priority: 100 as unknown as TsRes.ConditionPriority,
        scoreAsDefault: undefined,
        index: 0 as unknown as TsRes.ConditionIndex
      };

      expect(TsRes.Conditions.Condition.create(validatedDecl)).toSucceedAndSatisfy((condition) => {
        // scoreAsDefault should remain undefined because of NoMatch
        expect(condition.scoreAsDefault).toBeUndefined();
      });
    });
  });
});
