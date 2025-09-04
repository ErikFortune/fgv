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

type TestPlatform =
  | 'some_stb'
  | 'some_stb_variant'
  | 'other_stb'
  | 'ya_stb'
  | 'android'
  | 'ios'
  | 'androidtv'
  | 'appletv'
  | 'firetv'
  | 'webOs'
  | 'stb'
  | 'ctv'
  | 'mobile'
  | 'web';
const allTestPlatforms: TestPlatform[] = [
  'some_stb',
  'some_stb_variant',
  'other_stb',
  'ya_stb',
  'android',
  'ios',
  'androidtv',
  'appletv',
  'firetv',
  'webOs',
  'stb',
  'ctv',
  'mobile',
  'web'
];
const defaultHierarchy: TsRes.QualifierTypes.Config.LiteralValueHierarchyDecl<TestPlatform> = {
  some_stb: 'stb',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  some_stb_variant: 'some_stb',
  other_stb: 'stb',
  ya_stb: 'stb',
  stb: 'ctv',
  android: 'mobile',
  ios: 'mobile',
  androidtv: 'ctv',
  appletv: 'ctv',
  firetv: 'ctv',
  webOs: 'ctv'
};

describe('LiteralValueHierarchy', () => {
  let values: TestPlatform[];
  let hierarchy: TsRes.QualifierTypes.Config.LiteralValueHierarchyDecl<TestPlatform>;
  beforeEach(() => {
    values = Array.from(allTestPlatforms);
    hierarchy = { ...defaultHierarchy };
  });

  describe('create static method', () => {
    test('creates a new MatchHierarchy with no hierarchy', () => {
      expect(
        TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values
        })
      ).toSucceedAndSatisfy((h) => {
        for (const value of values) {
          expect(h.values.get(value)).toEqual({ name: value });
        }
      });
    });

    test('creates a new MatchHierarchy with an empty hierarchy', () => {
      expect(
        TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: values,
          hierarchy: {}
        })
      ).toSucceedAndSatisfy((h) => {
        for (const value of values) {
          expect(h.values.get(value)).toEqual({ name: value });
        }
      });
    });

    test('creates a new MatchHierarchy with a hierarchy', () => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toSucceedAndSatisfy((h) => {
        let value = h.values.get('some_stb');
        expect(value).toBeDefined();
        if (value) {
          expect(value.name).toBe('some_stb');
          expect(value.parent?.name).toBe('stb');
          expect(value.children).toEqual(['some_stb_variant']);
        }

        value = h.values.get('stb');
        expect(value).toBeDefined();
        if (value) {
          expect(value.name).toBe('stb');
          expect(value.parent?.name).toBe('ctv');
          expect(value.children).toEqual(['some_stb', 'other_stb', 'ya_stb']);
        }
      });
    });

    test('fails if the hierarchy contains an invalid value', () => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values: values.slice(1), // remove 'some_stb'
        hierarchy
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toFailWith(/invalid literal value/i);
    });

    test('fails if the hierarchy refers to a non-existent parent', () => {
      // `mobile` is referenced from but not included in the default hierarchy
      values = values.filter((v) => v !== 'mobile');
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toFailWith(
        /not a valid literal value/i
      );
    });

    test('fails if the hierarchy contains a circular reference', () => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy: {
          ...hierarchy,
          ctv: 'some_stb'
        }
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toFailWith(
        /circular reference detected/i
      );
    });

    test('fails if the hierarchy contains a circular reference via ancestor chain', () => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy: {
          ...hierarchy,
          ctv: 'some_stb' // This creates a circular reference through the ancestor chain
        }
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toFailWith(
        /circular reference detected.*stb/i
      );
    });
  });

  describe('match method', () => {
    let lvh: TsRes.QualifierTypes.LiteralValueHierarchy<TestPlatform>;

    beforeEach(() => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy
      };
      lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create(init).orThrow();
    });

    test('returns PerfectMatch for identical values', () => {
      expect(lvh.match('some_stb', 'some_stb')).toEqual(TsRes.PerfectMatch);
    });

    test('returns NoMatch for unrelated values', () => {
      expect(lvh.match('some_stb', 'web')).toEqual(TsRes.NoMatch);
      expect(lvh.match('some_stb', 'other_stb')).toEqual(TsRes.NoMatch);
    });

    test('returns partial match for related values', () => {
      const condition: TestPlatform = 'stb';
      const context: TestPlatform = 'some_stb';
      const score = lvh.match(condition, context);
      expect(score).toBeGreaterThan(TsRes.NoMatch);
      expect(score).toBeLessThan(TsRes.PerfectMatch);
    });

    test('returns decreasing match scores for deeper hierarchy levels', () => {
      const context: TestPlatform = 'some_stb_variant';

      const someStbScore = lvh.match(`some_stb`, context);
      expect(someStbScore).toBeGreaterThan(TsRes.NoMatch);
      expect(someStbScore).toBeLessThan(TsRes.PerfectMatch);

      const stbScore = lvh.match(`stb`, context);
      expect(stbScore).toBeGreaterThan(TsRes.NoMatch);
      expect(stbScore).toBeLessThan(someStbScore);
      expect(stbScore).toBeLessThan(TsRes.PerfectMatch);

      const ctvScore = lvh.match(`ctv`, context);
      expect(ctvScore).toBeGreaterThan(TsRes.NoMatch);
      expect(ctvScore).toBeLessThan(stbScore);
      expect(ctvScore).toBeLessThan(someStbScore);
      expect(ctvScore).toBeLessThan(TsRes.PerfectMatch);
    });

    describe('NoMatch branches in match', () => {
      let lvh: TsRes.QualifierTypes.LiteralValueHierarchy<string>;
      beforeEach(() => {
        lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: ['a', 'b', 'c', 'parent', 'root'],
          hierarchy: { a: 'parent', b: 'parent', parent: 'root' }
        }).orThrow();
      });

      test('returns NoMatch if condition is not in the hierarchy', () => {
        expect(lvh.match('not-in-hierarchy', 'a')).toBe(TsRes.NoMatch);
      });

      test('returns NoMatch if context is not in the hierarchy', () => {
        expect(lvh.match('a', 'not-in-hierarchy')).toBe(TsRes.NoMatch);
      });

      test('returns NoMatch if context is a root (no parent) and not equal to condition', () => {
        expect(lvh.match('a', 'root')).toBe(TsRes.NoMatch);
      });

      test('returns NoMatch if condition is not an ancestor of context', () => {
        expect(lvh.match('b' as TsRes.QualifierConditionValue, 'a' as TsRes.QualifierContextValue)).toBe(
          TsRes.NoMatch
        );
      });
    });

    describe('constrained hierarchy validation', () => {
      let constrainedLvh: TsRes.QualifierTypes.LiteralValueHierarchy<TestPlatform>;
      beforeEach(() => {
        constrainedLvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values,
          hierarchy
        }).orThrow();
      });

      test('returns NoMatch for condition not in constrained hierarchy', () => {
        expect(constrainedLvh.match('not_in_hierarchy' as TestPlatform, 'stb')).toBe(TsRes.NoMatch);
      });

      test('returns NoMatch for context not in constrained hierarchy', () => {
        expect(constrainedLvh.match('stb', 'not_in_hierarchy' as TestPlatform)).toBe(TsRes.NoMatch);
      });
    });
  });

  describe('utility methods', () => {
    let lvh: TsRes.QualifierTypes.LiteralValueHierarchy<TestPlatform>;

    beforeEach(() => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy
      };
      lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create(init).orThrow();
    });

    describe('hasValue', () => {
      test('returns true for values in hierarchy', () => {
        expect(lvh.hasValue('some_stb')).toBe(true);
        expect(lvh.hasValue('stb')).toBe(true);
        expect(lvh.hasValue('ctv')).toBe(true);
      });

      test('returns false for values not in hierarchy', () => {
        expect(lvh.hasValue('not_in_hierarchy' as TestPlatform)).toBe(false);
      });
    });

    describe('getRoots', () => {
      test('returns root values', () => {
        expect(lvh.getRoots()).toSucceedWith(['ctv', 'mobile', 'web']);
      });
    });

    describe('getAncestors', () => {
      test('returns ancestors for valid values', () => {
        expect(lvh.getAncestors('some_stb')).toSucceedWith(['stb', 'ctv']);
        expect(lvh.getAncestors('stb')).toSucceedWith(['ctv']);
        expect(lvh.getAncestors('ctv')).toSucceedWith([]);
        expect(lvh.getAncestors('web')).toSucceedWith([]);
      });

      test('fails for invalid values', () => {
        expect(lvh.getAncestors('not_in_hierarchy' as TestPlatform)).toFailWith(/not found in hierarchy/);
      });

      test('fails for invalid values with proper error message', () => {
        expect(lvh.getAncestors('missing_value' as TestPlatform)).toFailWith(
          /missing_value: not found in hierarchy/
        );
      });
    });

    describe('getDescendants', () => {
      test('returns descendants for valid values', () => {
        expect(lvh.getDescendants('ctv')).toSucceedWith([
          'stb',
          'some_stb',
          'some_stb_variant',
          'other_stb',
          'ya_stb',
          'androidtv',
          'appletv',
          'firetv',
          'webOs'
        ]);
        expect(lvh.getDescendants('stb')).toSucceedWith([
          'some_stb',
          'some_stb_variant',
          'other_stb',
          'ya_stb'
        ]);
        expect(lvh.getDescendants('some_stb')).toSucceedWith(['some_stb_variant']);
        expect(lvh.getDescendants('web')).toSucceedWith([]);
      });

      test('fails for invalid values', () => {
        expect(lvh.getDescendants('not_in_hierarchy' as TestPlatform)).toFailWith(/not found in hierarchy/);
      });
    });

    describe('isAncestor', () => {
      test('returns true when possibleAncestor is direct parent', () => {
        expect(lvh.isAncestor('some_stb', 'stb')).toBe(true);
        expect(lvh.isAncestor('some_stb_variant', 'some_stb')).toBe(true);
        expect(lvh.isAncestor('android', 'mobile')).toBe(true);
        expect(lvh.isAncestor('firetv', 'ctv')).toBe(true);
      });

      test('returns true when possibleAncestor is grandparent', () => {
        expect(lvh.isAncestor('some_stb', 'ctv')).toBe(true); // some_stb -> stb -> ctv
        expect(lvh.isAncestor('some_stb_variant', 'stb')).toBe(true); // some_stb_variant -> some_stb -> stb
        expect(lvh.isAncestor('some_stb_variant', 'ctv')).toBe(true); // some_stb_variant -> some_stb -> stb -> ctv
      });

      test('returns false when possibleAncestor is descendant', () => {
        expect(lvh.isAncestor('stb', 'some_stb')).toBe(false);
        expect(lvh.isAncestor('ctv', 'some_stb')).toBe(false);
        expect(lvh.isAncestor('some_stb', 'some_stb_variant')).toBe(false);
        expect(lvh.isAncestor('mobile', 'android')).toBe(false);
      });

      test('returns false for siblings in hierarchy', () => {
        expect(lvh.isAncestor('some_stb', 'other_stb')).toBe(false); // Both children of 'stb'
        expect(lvh.isAncestor('other_stb', 'some_stb')).toBe(false);
        expect(lvh.isAncestor('android', 'ios')).toBe(false); // Both children of 'mobile'
        expect(lvh.isAncestor('ios', 'android')).toBe(false);
        expect(lvh.isAncestor('androidtv', 'appletv')).toBe(false); // Both children of 'ctv'
      });

      test('returns false when value equals possibleAncestor', () => {
        expect(lvh.isAncestor('some_stb', 'some_stb')).toBe(false);
        expect(lvh.isAncestor('stb', 'stb')).toBe(false);
        expect(lvh.isAncestor('ctv', 'ctv')).toBe(false);
        expect(lvh.isAncestor('web', 'web')).toBe(false);
      });

      test('returns false for root values when checking for ancestors', () => {
        // Root values have no ancestors - test against non-existent values
        expect(lvh.isAncestor('ctv', 'nonexistent' as TestPlatform)).toBe(false);
        expect(lvh.isAncestor('mobile', 'nonexistent' as TestPlatform)).toBe(false);
        expect(lvh.isAncestor('web', 'nonexistent' as TestPlatform)).toBe(false);
      });

      test('returns false for root values when checking against actual hierarchy values', () => {
        // Root values have no ancestors - test against actual values in hierarchy
        expect(lvh.isAncestor('ctv', 'stb')).toBe(false); // ctv is root, stb is child - ctv has no ancestors
        expect(lvh.isAncestor('mobile', 'android')).toBe(false); // mobile is root, android is child
        expect(lvh.isAncestor('web', 'stb')).toBe(false); // web is root, stb is unrelated
        expect(lvh.isAncestor('ctv', 'mobile')).toBe(false); // both are roots, no ancestor relationship
      });

      test('returns false when value is not in hierarchy', () => {
        expect(lvh.isAncestor('not_in_hierarchy' as TestPlatform, 'stb')).toBe(false);
      });

      test('returns false when possibleAncestor is not in hierarchy', () => {
        expect(lvh.isAncestor('some_stb', 'not_in_hierarchy' as TestPlatform)).toBe(false);
      });

      test('returns false for unrelated values', () => {
        expect(lvh.isAncestor('some_stb', 'web')).toBe(false);
        expect(lvh.isAncestor('web', 'some_stb')).toBe(false);
        expect(lvh.isAncestor('android', 'stb')).toBe(false);
        expect(lvh.isAncestor('firetv', 'mobile')).toBe(false);
      });

      test('handles complex hierarchy paths correctly', () => {
        // some_stb_variant -> some_stb -> stb -> ctv
        expect(lvh.isAncestor('some_stb_variant', 'some_stb')).toBe(true);
        expect(lvh.isAncestor('some_stb_variant', 'stb')).toBe(true);
        expect(lvh.isAncestor('some_stb_variant', 'ctv')).toBe(true);

        // Reverse should all be false
        expect(lvh.isAncestor('some_stb', 'some_stb_variant')).toBe(false);
        expect(lvh.isAncestor('stb', 'some_stb_variant')).toBe(false);
        expect(lvh.isAncestor('ctv', 'some_stb_variant')).toBe(false);
      });
    });

    test('getDescendants returns empty array when value has no children', () => {
      const lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
        values: ['leaf', 'parent'],
        hierarchy: { leaf: 'parent' }
      }).orThrow();

      expect(lvh.getDescendants('leaf')).toSucceedWith([]);
    });

    test('_buildValuesFromHierarchy handles existing children array', () => {
      const lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
        values: ['child1', 'child2', 'parent'],
        hierarchy: {
          child1: 'parent',
          child2: 'parent' // This will add to existing children array
        }
      }).orThrow();

      expect(lvh.getDescendants('parent')).toSucceedWith(['child1', 'child2']);
    });
  });

  describe('open values mode', () => {
    describe('creation with no enumerated values', () => {
      test('creates hierarchy with values collected from hierarchy', () => {
        const hierarchy = {
          a: 'parent',
          b: 'parent',
          parent: 'root'
        };

        const lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: [] as string[],
          hierarchy
        }).orThrow();

        expect(lvh.isOpenValues).toBe(true);
        expect(lvh.hasValue('a')).toBe(true);
        expect(lvh.hasValue('b')).toBe(true);
        expect(lvh.hasValue('parent')).toBe(true);
        expect(lvh.hasValue('root')).toBe(true);
      });

      test('creates hierarchy with values collected from hierarchy when values is empty array', () => {
        const hierarchy = {
          a: 'parent',
          b: 'parent',
          parent: 'root'
        };

        const lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: [],
          hierarchy
        }).orThrow();

        expect(lvh.isOpenValues).toBe(true);
        expect(lvh.hasValue('a')).toBe(true);
        expect(lvh.hasValue('b')).toBe(true);
        expect(lvh.hasValue('parent')).toBe(true);
        expect(lvh.hasValue('root')).toBe(true);
      });

      test('creates hierarchy with no values when no hierarchy provided', () => {
        const lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: []
        }).orThrow();

        expect(lvh.isOpenValues).toBe(true);
        expect(lvh.values.size).toBe(0);
      });
    });

    describe('matching with open values', () => {
      let lvh: TsRes.QualifierTypes.LiteralValueHierarchy<string>;

      beforeEach(() => {
        lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: [] as string[],
          hierarchy: {
            a: 'parent',
            b: 'parent',
            parent: 'root'
          }
        }).orThrow();
      });

      test('returns PerfectMatch for identical values in hierarchy', () => {
        expect(lvh.match('a', 'a')).toBe(TsRes.PerfectMatch);
        expect(lvh.match('parent', 'parent')).toBe(TsRes.PerfectMatch);
      });

      test('returns partial match for related values in hierarchy', () => {
        const score = lvh.match('parent', 'a');
        expect(score).toBeGreaterThan(TsRes.NoMatch);
        expect(score).toBeLessThan(TsRes.PerfectMatch);
      });

      test('returns NoMatch for values not in hierarchy', () => {
        expect(lvh.match('unknown', 'a')).toBe(TsRes.NoMatch);
        expect(lvh.match('a', 'unknown')).toBe(TsRes.NoMatch);
      });

      test('returns NoMatch for unrelated values in hierarchy', () => {
        expect(lvh.match('a', 'b')).toBe(TsRes.NoMatch);
      });

      test('returns NoMatch when context has no parent and not equal to condition', () => {
        expect(lvh.match('a', 'root')).toBe(TsRes.NoMatch);
      });

      test('demonstrates hierarchical fallback behavior for values in hierarchy', () => {
        // Test that hierarchical fallback works for values in the hierarchy
        const score1 = lvh.match('parent', 'a'); // a -> parent (direct parent)
        expect(score1).toBeGreaterThan(TsRes.NoMatch);
        expect(score1).toBeLessThan(TsRes.PerfectMatch);

        const score2 = lvh.match('root', 'a'); // a -> parent -> root (grandparent)
        expect(score2).toBeGreaterThan(TsRes.NoMatch);
        expect(score2).toBeLessThan(score1); // Should be lower score than direct parent
        expect(score2).toBeLessThan(TsRes.PerfectMatch);
      });

      test('handles unknown values gracefully without validation errors', () => {
        // Unknown values should return NoMatch but not cause validation errors
        expect(lvh.match('unknown1', 'unknown2')).toBe(TsRes.NoMatch);
        expect(lvh.match('unknown1', 'a')).toBe(TsRes.NoMatch);
        expect(lvh.match('a', 'unknown1')).toBe(TsRes.NoMatch);
      });
    });

    describe('isAncestor in open values mode', () => {
      let lvh: TsRes.QualifierTypes.LiteralValueHierarchy<string>;

      beforeEach(() => {
        lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: [] as string[],
          hierarchy: {
            child1: 'parent',
            child2: 'parent',
            parent: 'grandparent',
            grandparent: 'root'
          }
        }).orThrow();
      });

      test('returns true for direct parent relationships', () => {
        expect(lvh.isAncestor('child1', 'parent')).toBe(true);
        expect(lvh.isAncestor('child2', 'parent')).toBe(true);
        expect(lvh.isAncestor('parent', 'grandparent')).toBe(true);
        expect(lvh.isAncestor('grandparent', 'root')).toBe(true);
      });

      test('returns true for multi-level ancestor relationships', () => {
        expect(lvh.isAncestor('child1', 'grandparent')).toBe(true); // child1 -> parent -> grandparent
        expect(lvh.isAncestor('child1', 'root')).toBe(true); // child1 -> parent -> grandparent -> root
        expect(lvh.isAncestor('parent', 'root')).toBe(true); // parent -> grandparent -> root
      });

      test('returns false for sibling relationships', () => {
        expect(lvh.isAncestor('child1', 'child2')).toBe(false);
        expect(lvh.isAncestor('child2', 'child1')).toBe(false);
      });

      test('returns false for descendant relationships', () => {
        expect(lvh.isAncestor('parent', 'child1')).toBe(false);
        expect(lvh.isAncestor('grandparent', 'child1')).toBe(false);
        expect(lvh.isAncestor('root', 'child1')).toBe(false);
      });

      test('returns false for values not in hierarchy', () => {
        expect(lvh.isAncestor('unknown', 'parent')).toBe(false);
        expect(lvh.isAncestor('child1', 'unknown')).toBe(false);
        expect(lvh.isAncestor('unknown1', 'unknown2')).toBe(false);
      });

      test('returns false for identical values', () => {
        expect(lvh.isAncestor('child1', 'child1')).toBe(false);
        expect(lvh.isAncestor('parent', 'parent')).toBe(false);
        expect(lvh.isAncestor('root', 'root')).toBe(false);
      });

      test('returns false for root values with no ancestors', () => {
        // Root value has no ancestors - test against actual hierarchy values
        expect(lvh.isAncestor('root', 'grandparent')).toBe(false); // root has no ancestors
        expect(lvh.isAncestor('root', 'parent')).toBe(false); // root has no ancestors
        expect(lvh.isAncestor('root', 'child1')).toBe(false); // root has no ancestors
      });
    });

    describe('isOpenValues property', () => {
      test('is true when no enumerated values provided', () => {
        const lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: [] as string[],
          hierarchy: { a: 'parent' }
        }).orThrow();

        expect(lvh.isOpenValues).toBe(true);
      });

      test('is true when values is empty array', () => {
        const lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: [] as string[],
          hierarchy: { a: 'parent' }
        }).orThrow();

        expect(lvh.isOpenValues).toBe(true);
      });

      test('is false when enumerated values provided', () => {
        const lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: ['a', 'parent'],
          hierarchy: { a: 'parent' }
        }).orThrow();

        expect(lvh.isOpenValues).toBe(false);
      });
    });
  });
});
