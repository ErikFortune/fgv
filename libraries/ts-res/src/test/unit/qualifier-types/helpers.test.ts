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

describe('createQualifierTypeFromConfig', () => {
  describe('language qualifier types', () => {
    test('creates a LanguageQualifierType from minimal config', () => {
      const config = {
        name: 'language',
        systemType: 'language',
        configuration: {}
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(false);
      });
    });

    test('creates a LanguageQualifierType with allowContextList configuration', () => {
      const config = {
        name: 'language',
        systemType: 'language',
        configuration: {
          allowContextList: true
        }
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(true);
      });
    });

    test('fails with invalid language configuration', () => {
      const config = {
        name: 'language',
        systemType: 'language',
        configuration: {
          allowContextList: 'invalid'
        }
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toFailWith(/boolean/i);
    });
  });

  describe('territory qualifier types', () => {
    test('creates a TerritoryQualifierType from minimal config', () => {
      const config = {
        name: 'territory',
        systemType: 'territory',
        configuration: {
          allowContextList: false,
          allowedTerritories: []
        }
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
        expect(q.key).toBe('territory');
        expect(q.name).toBe('territory');
        expect(q.allowContextList).toBe(false);
        expect((q as TsRes.QualifierTypes.TerritoryQualifierType).allowedTerritories).toEqual([]);
      });
    });

    test('creates a TerritoryQualifierType with full configuration', () => {
      const config = {
        name: 'region',
        systemType: 'territory',
        configuration: {
          allowContextList: true,
          allowedTerritories: ['US', 'CA', 'GB']
        }
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
        expect(q.key).toBe('region');
        expect(q.name).toBe('region');
        expect(q.allowContextList).toBe(true);
        expect((q as TsRes.QualifierTypes.TerritoryQualifierType).allowedTerritories).toEqual([
          'US',
          'CA',
          'GB'
        ]);
      });
    });

    test('fails with invalid territory configuration', () => {
      const config = {
        name: 'territory',
        systemType: 'territory',
        configuration: {
          allowContextList: 'invalid'
        }
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toFailWith(/boolean/i);
    });
  });

  describe('literal qualifier types', () => {
    test('creates a LiteralQualifierType from minimal config', () => {
      const config = {
        name: 'literal',
        systemType: 'literal',
        configuration: {}
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('literal');
        expect(q.name).toBe('literal');
        expect(q.allowContextList).toBe(false);
        expect((q as TsRes.QualifierTypes.LiteralQualifierType).caseSensitive).toBe(false);
        expect((q as TsRes.QualifierTypes.LiteralQualifierType).enumeratedValues).toBeUndefined();
        expect((q as TsRes.QualifierTypes.LiteralQualifierType).hierarchy).toBeUndefined();
      });
    });

    test('creates a LiteralQualifierType with full configuration', () => {
      const config = {
        name: 'category',
        systemType: 'literal',
        configuration: {
          allowContextList: true,
          caseSensitive: true,
          enumeratedValues: ['value1', 'value2', 'value3', 'child', 'parent', 'grandparent'],
          hierarchy: {
            child: 'parent',
            parent: 'grandparent'
          }
        }
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('category');
        expect(q.name).toBe('category');
        expect(q.allowContextList).toBe(true);
        const literal = q as TsRes.QualifierTypes.LiteralQualifierType;
        expect(literal.caseSensitive).toBe(true);
        expect(literal.enumeratedValues).toEqual([
          'value1',
          'value2',
          'value3',
          'child',
          'parent',
          'grandparent'
        ]);
        expect(literal.hierarchy).toBeDefined();
        expect(literal.hierarchy?.values.get('child')).toBeDefined();
        expect(literal.hierarchy?.values.get('parent')).toBeDefined();
      });
    });

    test('fails with invalid literal configuration', () => {
      const config = {
        name: 'literal',
        systemType: 'literal',
        configuration: {
          caseSensitive: 'invalid'
        }
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toFailWith(/boolean/i);
    });
  });

  describe('error handling', () => {
    test('fails with unknown system type', () => {
      const config = {
        name: 'unknown',
        systemType: 'unknown',
        configuration: {}
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toFailWith(
        /unknown qualifier type/i
      );
    });

    test('fails with invalid configuration for the specified type', () => {
      const config = {
        name: 'territory',
        systemType: 'territory',
        configuration: {
          allowedTerritories: 'invalid'
        }
      };

      expect(TsRes.QualifierTypes.createQualifierTypeFromConfig(config)).toFailWith(/array/i);
    });
  });
});
