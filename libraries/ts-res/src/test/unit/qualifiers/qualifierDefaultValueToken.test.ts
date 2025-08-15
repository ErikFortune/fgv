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

describe('QualifierDefaultValueTokens', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let tokens: TsRes.Qualifiers.QualifierDefaultValueTokens;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create({
          name: 'environment',
          enumeratedValues: ['development', 'staging', 'production']
        }).orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'region',
          allowContextList: true
        }).orThrow()
      ]
    }).orThrow();

    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 100 },
        { name: 'territory', typeName: 'territory', defaultPriority: 200 },
        { name: 'environment', typeName: 'environment', defaultPriority: 300 },
        { name: 'region', typeName: 'region', defaultPriority: 150 }
      ]
    }).orThrow();

    tokens = new TsRes.Qualifiers.QualifierDefaultValueTokens(qualifiers);
  });

  describe('parseQualifierDefaultValueToken', () => {
    test('parses single qualifier default value token', () => {
      expect(tokens.parseQualifierDefaultValueToken('language=en-US')).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('language');
        expect(result.value).toBe('en-US');
      });
    });

    test('parses qualifier default value token with comma-separated values', () => {
      expect(tokens.parseQualifierDefaultValueToken('language=en-US,fr-CA')).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('language');
        expect(result.value).toBe('en-US,fr-CA');
      });
    });

    test('parses qualifier default value token with empty value', () => {
      expect(tokens.parseQualifierDefaultValueToken('language=')).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('language');
        expect(result.value).toBe('');
      });
    });

    test('fails with invalid qualifier name', () => {
      expect(tokens.parseQualifierDefaultValueToken('invalid=en-US')).toFailWith(/not found/i);
    });

    test('fails with invalid syntax (missing equals)', () => {
      expect(tokens.parseQualifierDefaultValueToken('language')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with invalid value for qualifier type', () => {
      expect(tokens.parseQualifierDefaultValueToken('language=invalid-tag')).toFailWith(
        /invalid.*context.*value/i
      );
    });

    test('fails with invalid enumerated value', () => {
      expect(tokens.parseQualifierDefaultValueToken('environment=invalid')).toFailWith(
        /invalid.*context.*value/i
      );
    });
  });

  describe('parseQualifierDefaultValuesToken', () => {
    test('parses single qualifier token', () => {
      expect(tokens.parseQualifierDefaultValuesToken('language=en-US')).toSucceedAndSatisfy((results) => {
        expect(results).toHaveLength(1);
        expect(results[0].qualifier.name).toBe('language');
        expect(results[0].value).toBe('en-US');
      });
    });

    test('parses multiple qualifier tokens', () => {
      expect(
        tokens.parseQualifierDefaultValuesToken('language=en-US|territory=US|environment=production')
      ).toSucceedAndSatisfy((results) => {
        expect(results).toHaveLength(3);

        expect(results[0].qualifier.name).toBe('language');
        expect(results[0].value).toBe('en-US');

        expect(results[1].qualifier.name).toBe('territory');
        expect(results[1].value).toBe('US');

        expect(results[2].qualifier.name).toBe('environment');
        expect(results[2].value).toBe('production');
      });
    });

    test('parses tokens with comma-separated values', () => {
      expect(
        tokens.parseQualifierDefaultValuesToken('language=en-US,fr-CA|region=US,CA')
      ).toSucceedAndSatisfy((results) => {
        expect(results).toHaveLength(2);

        expect(results[0].qualifier.name).toBe('language');
        expect(results[0].value).toBe('en-US,fr-CA');

        expect(results[1].qualifier.name).toBe('region');
        expect(results[1].value).toBe('US,CA');
      });
    });

    test('parses empty token as empty array', () => {
      expect(tokens.parseQualifierDefaultValuesToken('')).toSucceedAndSatisfy((results) => {
        expect(results).toHaveLength(0);
      });
    });

    test('parses tokens with empty values', () => {
      expect(tokens.parseQualifierDefaultValuesToken('language=|territory=US')).toSucceedAndSatisfy(
        (results) => {
          expect(results).toHaveLength(2);

          expect(results[0].qualifier.name).toBe('language');
          expect(results[0].value).toBe('');

          expect(results[1].qualifier.name).toBe('territory');
          expect(results[1].value).toBe('US');
        }
      );
    });

    test('fails with invalid qualifier in token list', () => {
      expect(tokens.parseQualifierDefaultValuesToken('language=en-US|invalid=value')).toFailWith(
        /not found/i
      );
    });

    test('fails with invalid value in token list', () => {
      expect(tokens.parseQualifierDefaultValuesToken('language=en-US|territory=INVALID')).toFailWith(
        /invalid.*context.*value/i
      );
    });

    test('handles whitespace around separators', () => {
      expect(tokens.parseQualifierDefaultValuesToken(' language=en-US | territory=US ')).toSucceedAndSatisfy(
        (results) => {
          expect(results).toHaveLength(2);
          expect(results[0].qualifier.name).toBe('language');
          expect(results[1].qualifier.name).toBe('territory');
        }
      );
    });
  });

  describe('qualifierDefaultValuesTokenToDecl', () => {
    test('converts single token to declaration', () => {
      expect(tokens.qualifierDefaultValuesTokenToDecl('language=en-US')).toSucceedAndSatisfy((decl) => {
        expect(decl['language' as TsRes.QualifierName]).toBe('en-US');
        expect(Object.keys(decl)).toHaveLength(1);
      });
    });

    test('converts multiple tokens to declaration', () => {
      expect(
        tokens.qualifierDefaultValuesTokenToDecl('language=en-US|territory=US|environment=production')
      ).toSucceedAndSatisfy((decl) => {
        expect(decl['language' as TsRes.QualifierName]).toBe('en-US');
        expect(decl['territory' as TsRes.QualifierName]).toBe('US');
        expect(decl['environment' as TsRes.QualifierName]).toBe('production');
        expect(Object.keys(decl)).toHaveLength(3);
      });
    });

    test('excludes empty values from declaration', () => {
      expect(tokens.qualifierDefaultValuesTokenToDecl('language=|territory=US')).toSucceedAndSatisfy(
        (decl) => {
          expect(decl['territory' as TsRes.QualifierName]).toBe('US');
          expect(decl['language' as TsRes.QualifierName]).toBeUndefined();
          expect(Object.keys(decl)).toHaveLength(1);
        }
      );
    });

    test('converts empty token to empty declaration', () => {
      expect(tokens.qualifierDefaultValuesTokenToDecl('')).toSucceedAndSatisfy((decl) => {
        expect(Object.keys(decl)).toHaveLength(0);
      });
    });

    test('fails with duplicate qualifiers', () => {
      expect(tokens.qualifierDefaultValuesTokenToDecl('language=en-US|language=fr-CA')).toFailWith(
        /duplicate qualifier/i
      );
    });
  });

  describe('declToQualifierDefaultValuesToken', () => {
    test('converts simple declaration to token', () => {
      const decl: TsRes.Qualifiers.IValidatedQualifierDefaultValuesDecl = {
        ['language' as TsRes.QualifierName]: 'en-US' as TsRes.QualifierContextValue
      };

      expect(tokens.declToQualifierDefaultValuesToken(decl)).toSucceedWith('language=en-US');
    });

    test('converts multi-qualifier declaration to token', () => {
      const decl: TsRes.Qualifiers.IValidatedQualifierDefaultValuesDecl = {
        ['language' as TsRes.QualifierName]: 'en-US' as TsRes.QualifierContextValue,
        ['territory' as TsRes.QualifierName]: 'US' as TsRes.QualifierContextValue,
        ['environment' as TsRes.QualifierName]: 'production' as TsRes.QualifierContextValue
      };

      expect(tokens.declToQualifierDefaultValuesToken(decl)).toSucceedAndSatisfy((token) => {
        // Order may vary, so check that all parts are present
        expect(token).toContain('language=en-US');
        expect(token).toContain('territory=US');
        expect(token).toContain('environment=production');
        expect(token.split('|')).toHaveLength(3);
      });
    });

    test('converts empty declaration to empty token', () => {
      const decl: TsRes.Qualifiers.IValidatedQualifierDefaultValuesDecl = {};

      expect(tokens.declToQualifierDefaultValuesToken(decl)).toSucceedWith('');
    });

    test('handles values with commas', () => {
      const decl: TsRes.Qualifiers.IValidatedQualifierDefaultValuesDecl = {
        ['language' as TsRes.QualifierName]: 'en-US,fr-CA' as TsRes.QualifierContextValue
      };

      expect(tokens.declToQualifierDefaultValuesToken(decl)).toSucceedWith('language=en-US,fr-CA');
    });
  });

  describe('static methods', () => {
    test('parseQualifierDefaultValueToken static method works', () => {
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.parseQualifierDefaultValueToken(
          'language=en-US',
          qualifiers
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('language');
        expect(result.value).toBe('en-US');
      });
    });

    test('parseQualifierDefaultValuesToken static method works', () => {
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.parseQualifierDefaultValuesToken(
          'language=en-US|territory=US',
          qualifiers
        )
      ).toSucceedAndSatisfy((results) => {
        expect(results).toHaveLength(2);
      });
    });

    test('qualifierDefaultValuesTokenToDecl static method works', () => {
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.qualifierDefaultValuesTokenToDecl(
          'language=en-US',
          qualifiers
        )
      ).toSucceedAndSatisfy((decl) => {
        expect(decl['language' as TsRes.QualifierName]).toBe('en-US');
      });
    });

    test('declToQualifierDefaultValuesToken static method works', () => {
      const decl: TsRes.Qualifiers.IValidatedQualifierDefaultValuesDecl = {
        ['language' as TsRes.QualifierName]: 'en-US' as TsRes.QualifierContextValue
      };

      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.declToQualifierDefaultValuesToken(decl)
      ).toSucceedWith('language=en-US');
    });
  });

  describe('validateQualifierDefaultValueTokenParts static method', () => {
    test('validates parts with valid qualifier and value', () => {
      const parts = { qualifier: 'language', value: 'en-US' };
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          qualifiers
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('language');
        expect(result.value).toBe('en-US');
      });
    });

    test('validates parts with qualifier token instead of name', () => {
      // Add a qualifier with a token for testing
      const tokenQualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          { name: 'language', typeName: 'language', defaultPriority: 100, token: 'lang' },
          { name: 'territory', typeName: 'territory', defaultPriority: 200 }
        ]
      }).orThrow();

      const parts = { qualifier: 'lang', value: 'en-US' }; // Using token instead of name
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          tokenQualifiers
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('language'); // Should resolve to actual qualifier name
        expect(result.value).toBe('en-US');
      });
    });

    test('accepts empty value', () => {
      const parts = { qualifier: 'language', value: '' };
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          qualifiers
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('language');
        expect(result.value).toBe('');
      });
    });

    test('fails with invalid qualifier name', () => {
      const parts = { qualifier: 'invalid', value: 'en-US' };
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          qualifiers
        )
      ).toFailWith(/not found/i);
    });

    test('fails with invalid value for qualifier type', () => {
      const parts = { qualifier: 'language', value: 'invalid-tag' };
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          qualifiers
        )
      ).toFailWith(/invalid.*context.*value/i);
    });

    test('fails with invalid enumerated value', () => {
      const parts = { qualifier: 'environment', value: 'invalid' };
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          qualifiers
        )
      ).toFailWith(/invalid.*context.*value/i);
    });

    test('validates comma-separated values for qualifier types that allow context lists', () => {
      const parts = { qualifier: 'region', value: 'US,CA' };
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          qualifiers
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('region');
        expect(result.value).toBe('US,CA');
      });
    });

    test('fails with comma-separated values for qualifier types that do not allow context lists', () => {
      const parts = { qualifier: 'territory', value: 'US,CA' };
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          qualifiers
        )
      ).toFailWith(/invalid.*context.*value/i);
    });

    test('validates individual values in comma-separated lists', () => {
      const parts = { qualifier: 'region', value: 'US,INVALID' };
      expect(
        TsRes.Qualifiers.QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts(
          parts,
          qualifiers
        )
      ).toFailWith(/invalid.*context.*value/i);
    });
  });

  describe('edge cases and error conditions', () => {
    test('handles qualifier type that does not allow context lists', () => {
      expect(tokens.parseQualifierDefaultValueToken('territory=US,CA')).toFailWith(
        /invalid.*context.*value/i
      );
    });

    test('handles qualifier type that allows context lists', () => {
      expect(tokens.parseQualifierDefaultValueToken('region=US,CA')).toSucceedAndSatisfy((result) => {
        expect(result.qualifier.name).toBe('region');
        expect(result.value).toBe('US,CA');
      });
    });

    test('validates individual values in comma-separated lists', () => {
      expect(tokens.parseQualifierDefaultValueToken('language=en-US,invalid-tag')).toFailWith(
        /invalid.*context.*value/i
      );
    });

    test('trims whitespace around pipe separators', () => {
      expect(tokens.parseQualifierDefaultValuesToken('language=en-US | territory=US')).toSucceedAndSatisfy(
        (results) => {
          expect(results).toHaveLength(2);
        }
      );
    });
  });

  describe('integration with real qualifier types', () => {
    test('validates language qualifier with valid BCP47 tags', () => {
      const validTags = ['en', 'en-US', 'fr-CA', 'zh-Hans-CN'];

      for (const tag of validTags) {
        expect(tokens.parseQualifierDefaultValueToken(`language=${tag}`)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(tag);
        });
      }
    });

    test('rejects language qualifier with invalid BCP47 tags', () => {
      const invalidTags = ['invalid-tag', 'en-INVALID', '123', 'toolong-toolong-toolong'];

      for (const tag of invalidTags) {
        expect(tokens.parseQualifierDefaultValueToken(`language=${tag}`)).toFailWith(
          /invalid.*context.*value/i
        );
      }
    });

    test('validates territory qualifier with valid codes', () => {
      const validCodes = ['US', 'CA', 'GB', 'DE', 'FR'];

      for (const code of validCodes) {
        expect(tokens.parseQualifierDefaultValueToken(`territory=${code}`)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(code);
        });
      }
    });

    test('rejects territory qualifier with invalid codes', () => {
      const invalidCodes = ['USA', 'X', '123', 'INVALID'];

      for (const code of invalidCodes) {
        expect(tokens.parseQualifierDefaultValueToken(`territory=${code}`)).toFailWith(
          /invalid.*context.*value/i
        );
      }
    });

    test('validates literal qualifier with enumerated values', () => {
      const validValues = ['development', 'staging', 'production'];

      for (const value of validValues) {
        expect(tokens.parseQualifierDefaultValueToken(`environment=${value}`)).toSucceedAndSatisfy(
          (result) => {
            expect(result.value).toBe(value);
          }
        );
      }
    });

    test('rejects literal qualifier with non-enumerated values', () => {
      const invalidValues = ['invalid', 'test', 'local', 'prod'];

      for (const value of invalidValues) {
        expect(tokens.parseQualifierDefaultValueToken(`environment=${value}`)).toFailWith(
          /invalid.*context.*value/i
        );
      }
    });
  });
});
