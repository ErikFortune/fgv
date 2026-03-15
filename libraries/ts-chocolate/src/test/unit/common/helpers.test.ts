// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';

import { Helpers } from '../../../packlets/common';
import type {
  BaseFillingId,
  BaseIngredientId,
  BaseJournalId,
  BaseSessionId,
  CollectionId,
  ConfectionId,
  ConfectionRecipeVariationId,
  ConfectionRecipeVariationSpec,
  FillingId,
  FillingRecipeVariationId,
  FillingRecipeVariationSpec,
  IngredientId,
  JournalId,
  SessionId
} from '../../../packlets/common';

describe('helpers', () => {
  // ============================================================================
  // Ingredient ID helpers
  // ============================================================================

  describe('Ingredient ID helpers', () => {
    const collectionId = 'test' as CollectionId;
    const baseId = 'dark-chocolate' as BaseIngredientId;
    const compositeId = 'test.dark-chocolate' as IngredientId;

    test('createIngredientId creates composite from parts', () => {
      expect(Helpers.createIngredientId(collectionId, baseId)).toBe(compositeId);
    });

    test('parseIngredientId parses valid composite', () => {
      expect(Helpers.parseIngredientId(compositeId)).toSucceedAndSatisfy((parsed) => {
        expect(parsed.collectionId).toBe(collectionId);
        expect(parsed.itemId).toBe(baseId);
      });
    });

    test('parseIngredientId fails on invalid format', () => {
      expect(Helpers.parseIngredientId('no-separator' as IngredientId)).toFail();
    });

    test('getIngredientCollectionId extracts collection part', () => {
      expect(Helpers.getIngredientCollectionId(compositeId)).toBe(collectionId);
    });

    test('getIngredientBaseId extracts base part', () => {
      expect(Helpers.getIngredientBaseId(compositeId)).toBe(baseId);
    });
  });

  // ============================================================================
  // Filling ID helpers
  // ============================================================================

  describe('Filling ID helpers', () => {
    const collectionId = 'recipes' as CollectionId;
    const baseId = 'test-ganache' as BaseFillingId;
    const compositeId = 'recipes.test-ganache' as FillingId;

    test('createFillingId creates composite from parts', () => {
      expect(Helpers.createFillingId(collectionId, baseId)).toBe(compositeId);
    });

    test('parseFillingId parses valid composite', () => {
      expect(Helpers.parseFillingId(compositeId)).toSucceedAndSatisfy((parsed) => {
        expect(parsed.collectionId).toBe(collectionId);
        expect(parsed.itemId).toBe(baseId);
      });
    });

    test('parseFillingId fails on invalid format', () => {
      expect(Helpers.parseFillingId('invalid' as FillingId)).toFail();
    });

    test('getFillingCollectionId extracts collection part', () => {
      expect(Helpers.getFillingCollectionId(compositeId)).toBe(collectionId);
    });

    test('getFillingBaseId extracts base part', () => {
      expect(Helpers.getFillingBaseId(compositeId)).toBe(baseId);
    });
  });

  // ============================================================================
  // Journal ID helpers
  // ============================================================================

  describe('Journal ID helpers', () => {
    const collectionId = 'user-journals' as CollectionId;
    const baseId = '2026-01-15-143025-a1b2c3d4' as BaseJournalId;
    const compositeId = 'user-journals.2026-01-15-143025-a1b2c3d4' as JournalId;

    test('createJournalId creates composite from parts', () => {
      expect(Helpers.createJournalId(collectionId, baseId)).toBe(compositeId);
    });

    test('parseJournalId parses valid composite', () => {
      expect(Helpers.parseJournalId(compositeId)).toSucceedAndSatisfy((parsed) => {
        expect(parsed.collectionId).toBe(collectionId);
        expect(parsed.itemId).toBe(baseId);
      });
    });

    test('parseJournalId fails on invalid format', () => {
      expect(Helpers.parseJournalId('missing-separator' as JournalId)).toFail();
    });

    test('getJournalCollectionId extracts collection part', () => {
      expect(Helpers.getJournalCollectionId(compositeId)).toBe(collectionId);
    });

    test('getJournalBaseId extracts base part', () => {
      expect(Helpers.getJournalBaseId(compositeId)).toBe(baseId);
    });
  });

  // ============================================================================
  // Session ID helpers
  // ============================================================================

  describe('Session ID helpers', () => {
    const collectionId = 'user-sessions' as CollectionId;
    const baseId = '2026-01-15-143025-a1b2c3d4' as BaseSessionId;
    const compositeId = 'user-sessions.2026-01-15-143025-a1b2c3d4' as SessionId;

    test('createSessionId creates composite from parts', () => {
      expect(Helpers.createSessionId(collectionId, baseId)).toBe(compositeId);
    });

    test('parseSessionId parses valid composite', () => {
      expect(Helpers.parseSessionId(compositeId)).toSucceedAndSatisfy((parsed) => {
        expect(parsed.collectionId).toBe(collectionId);
        expect(parsed.itemId).toBe(baseId);
      });
    });

    test('parseSessionId fails on invalid format', () => {
      expect(Helpers.parseSessionId('bad' as SessionId)).toFail();
    });

    test('getSessionCollectionId extracts collection part', () => {
      expect(Helpers.getSessionCollectionId(compositeId)).toBe(collectionId);
    });

    test('getSessionBaseId extracts base part', () => {
      expect(Helpers.getSessionBaseId(compositeId)).toBe(baseId);
    });
  });

  // ============================================================================
  // Filling variation ID helpers
  // ============================================================================

  describe('Filling variation ID helpers', () => {
    const fillingId = 'test.test-ganache' as FillingId;
    const variationSpec = '2026-01-01-01' as FillingRecipeVariationSpec;
    const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;

    test('createFillingRecipeVariationId creates composite from parts', () => {
      expect(Helpers.createFillingRecipeVariationId(fillingId, variationSpec)).toBe(variationId);
    });

    test('parseFillingRecipeVariationId parses valid composite', () => {
      expect(Helpers.parseFillingRecipeVariationId(variationId)).toSucceedAndSatisfy((parsed) => {
        expect(parsed.collectionId).toBe(fillingId);
        expect(parsed.itemId).toBe(variationSpec);
      });
    });

    test('parseFillingRecipeVariationId fails on invalid format', () => {
      expect(Helpers.parseFillingRecipeVariationId('no-at-sign' as FillingRecipeVariationId)).toFail();
    });

    test('getFillingRecipeVariationFillingId extracts filling ID', () => {
      expect(Helpers.getFillingRecipeVariationFillingId(variationId)).toBe(fillingId);
    });

    test('getFillingRecipeVariationSpec extracts variation spec', () => {
      expect(Helpers.getFillingRecipeVariationSpec(variationId)).toBe(variationSpec);
    });

    test('createFillingRecipeVariationIdValidated succeeds for valid parts', () => {
      expect(
        Helpers.createFillingRecipeVariationIdValidated({
          collectionId: fillingId,
          itemId: variationSpec
        })
      ).toSucceedWith(variationId);
    });

    test('createFillingRecipeVariationIdValidated fails for invalid parts', () => {
      expect(
        Helpers.createFillingRecipeVariationIdValidated({
          collectionId: 'bad' as FillingId,
          itemId: 'invalid' as FillingRecipeVariationSpec
        })
      ).toFail();
    });
  });

  // ============================================================================
  // Confection variation ID helpers
  // ============================================================================

  describe('Confection variation ID helpers', () => {
    const confectionId = 'test.test-truffle' as ConfectionId;
    const variationSpec = '2026-01-01-01' as ConfectionRecipeVariationSpec;
    const variationId = 'test.test-truffle@2026-01-01-01' as ConfectionRecipeVariationId;

    test('createConfectionRecipeVariationId succeeds for valid parts', () => {
      expect(
        Helpers.createConfectionRecipeVariationId({
          collectionId: confectionId,
          itemId: variationSpec
        })
      ).toSucceedWith(variationId);
    });

    test('createConfectionRecipeVariationId fails for invalid parts', () => {
      expect(
        Helpers.createConfectionRecipeVariationId({
          collectionId: 'bad' as ConfectionId,
          itemId: 'invalid' as ConfectionRecipeVariationSpec
        })
      ).toFail();
    });

    test('parseConfectionRecipeVariationId parses valid composite', () => {
      expect(Helpers.parseConfectionRecipeVariationId(variationId)).toSucceedAndSatisfy((parsed) => {
        expect(parsed.collectionId).toBe(confectionId);
        expect(parsed.itemId).toBe(variationSpec);
      });
    });

    test('parseConfectionRecipeVariationId fails on invalid format', () => {
      expect(Helpers.parseConfectionRecipeVariationId('no-at' as ConfectionRecipeVariationId)).toFail();
    });
  });

  // ============================================================================
  // String conversion utilities
  // ============================================================================

  describe('toKebabCase', () => {
    test('converts spaces to hyphens', () => {
      expect(Helpers.toKebabCase('Dark Chocolate')).toBe('dark-chocolate');
    });

    test('converts uppercase to lowercase', () => {
      expect(Helpers.toKebabCase('HelloWorld')).toBe('helloworld');
    });

    test('replaces special characters with hyphens', () => {
      expect(Helpers.toKebabCase('foo!@#bar')).toBe('foo-bar');
    });

    test('trims leading and trailing whitespace', () => {
      expect(Helpers.toKebabCase('  hello  ')).toBe('hello');
    });

    test('strips leading and trailing hyphens from result', () => {
      expect(Helpers.toKebabCase('---hello---')).toBe('hello');
    });

    test('handles numbers', () => {
      expect(Helpers.toKebabCase('Recipe 1')).toBe('recipe-1');
    });

    test('collapses multiple special chars to single hyphen', () => {
      expect(Helpers.toKebabCase('foo   bar')).toBe('foo-bar');
    });

    test('returns empty string for all-special input', () => {
      expect(Helpers.toKebabCase('!@#$%')).toBe('');
    });

    test('returns already-kebab unchanged', () => {
      expect(Helpers.toKebabCase('already-kebab')).toBe('already-kebab');
    });
  });

  describe('nameToBaseId', () => {
    test('converts valid name to kebab-case ID', () => {
      expect(Helpers.nameToBaseId('Dark Chocolate Ganache')).toSucceedWith('dark-chocolate-ganache');
    });

    test('fails for empty string', () => {
      expect(Helpers.nameToBaseId('')).toFailWith(/empty/i);
    });

    test('fails for whitespace-only string', () => {
      expect(Helpers.nameToBaseId('   ')).toFailWith(/empty/i);
    });

    test('fails for all-special-character name', () => {
      expect(Helpers.nameToBaseId('!@#$%')).toFailWith(/alphanumeric/i);
    });

    test('succeeds for name with mixed content', () => {
      expect(Helpers.nameToBaseId('Truffle #1')).toSucceedWith('truffle-1');
    });
  });

  describe('generateUniqueBaseId', () => {
    test('returns original ID when no conflict', () => {
      expect(Helpers.generateUniqueBaseId('ganache', new Set(['truffle']))).toSucceedWith('ganache');
    });

    test('appends counter on conflict', () => {
      expect(Helpers.generateUniqueBaseId('ganache', new Set(['ganache']))).toSucceedWith('ganache-2');
    });

    test('increments counter until unique', () => {
      expect(
        Helpers.generateUniqueBaseId('ganache', new Set(['ganache', 'ganache-2', 'ganache-3']))
      ).toSucceedWith('ganache-4');
    });

    test('accepts array instead of Set', () => {
      expect(Helpers.generateUniqueBaseId('ganache', ['ganache'])).toSucceedWith('ganache-2');
    });

    test('fails when maxAttempts exceeded', () => {
      expect(Helpers.generateUniqueBaseId('x', new Set(['x', 'x-2', 'x-3']), 3)).toFailWith(
        /could not generate/i
      );
    });
  });

  describe('generateUniqueBaseIdFromName', () => {
    test('converts name and returns unique ID', () => {
      expect(Helpers.generateUniqueBaseIdFromName('Dark Ganache', new Set([]))).toSucceedWith('dark-ganache');
    });

    test('appends counter on collision', () => {
      expect(Helpers.generateUniqueBaseIdFromName('Dark Ganache', new Set(['dark-ganache']))).toSucceedWith(
        'dark-ganache-2'
      );
    });

    test('fails for empty name', () => {
      expect(Helpers.generateUniqueBaseIdFromName('', new Set([]))).toFailWith(/empty/i);
    });
  });

  // ============================================================================
  // Preferred ID helpers
  // ============================================================================

  describe('getPreferredIdOrFirst', () => {
    test('returns undefined for undefined collection', () => {
      expect(Helpers.getPreferredIdOrFirst(undefined)).toBeUndefined();
    });

    test('returns preferred ID when set', () => {
      const collection = { ids: ['a', 'b', 'c'], preferredId: 'b' };
      expect(Helpers.getPreferredIdOrFirst(collection)).toBe('b');
    });

    test('returns first ID when no preferred', () => {
      const collection = { ids: ['a', 'b', 'c'] };
      expect(Helpers.getPreferredIdOrFirst(collection)).toBe('a');
    });

    test('returns first ID when preferred is undefined', () => {
      const collection = { ids: ['a', 'b', 'c'], preferredId: undefined };
      expect(Helpers.getPreferredIdOrFirst(collection)).toBe('a');
    });
  });

  describe('getPreferredOptionIdOrFirst', () => {
    type TestId = string & { __brand: 'TestId' };
    const options = [
      { id: 'a' as TestId, value: 1 },
      { id: 'b' as TestId, value: 2 },
      { id: 'c' as TestId, value: 3 }
    ];

    test('returns preferredId when set', () => {
      const collection = { options, preferredId: 'b' as TestId };
      expect(Helpers.getPreferredOptionIdOrFirst(collection)).toBe('b');
    });

    test('falls back to first option ID when no preferred', () => {
      const collection = { options };
      expect(Helpers.getPreferredOptionIdOrFirst(collection)).toBe('a');
    });

    test('returns undefined for empty options', () => {
      const collection = { options: [] as Array<{ id: TestId; value: number }> };
      expect(Helpers.getPreferredOptionIdOrFirst(collection)).toBeUndefined();
    });

    test('returns undefined for undefined collection', () => {
      expect(Helpers.getPreferredOptionIdOrFirst(undefined)).toBeUndefined();
    });
  });

  // ============================================================================
  // Serialization helpers
  // ============================================================================

  describe('serializeToYaml', () => {
    test('serializes simple object', () => {
      expect(Helpers.serializeToYaml({ name: 'test', value: 42 })).toSucceedAndSatisfy((result) => {
        expect(result).toContain('name: test');
        expect(result).toContain('value: 42');
      });
    });

    test('serializes nested object', () => {
      expect(Helpers.serializeToYaml({ outer: { inner: 'value' } })).toSucceedAndSatisfy((result) => {
        expect(result).toContain('outer:');
        expect(result).toContain('inner: value');
      });
    });

    test('respects prettyPrint: false', () => {
      const result1 = Helpers.serializeToYaml({ a: 1 }, { prettyPrint: true });
      const result2 = Helpers.serializeToYaml({ a: 1 }, { prettyPrint: false });
      expect(result1).toSucceed();
      expect(result2).toSucceed();
    });

    test('defaults to prettyPrint: true', () => {
      expect(Helpers.serializeToYaml({ a: 1 })).toSucceed();
    });

    test('serializes arrays', () => {
      expect(Helpers.serializeToYaml({ items: [1, 2, 3] })).toSucceedAndSatisfy((result) => {
        expect(result).toContain('items:');
      });
    });
  });

  describe('serializeToJson', () => {
    test('serializes simple object with pretty-print', () => {
      expect(Helpers.serializeToJson({ name: 'test' })).toSucceedAndSatisfy((result) => {
        expect(JSON.parse(result)).toEqual({ name: 'test' });
        expect(result).toContain('\n'); // Pretty-printed
      });
    });

    test('serializes without pretty-print', () => {
      expect(Helpers.serializeToJson({ name: 'test' }, { prettyPrint: false })).toSucceedAndSatisfy(
        (result) => {
          expect(JSON.parse(result)).toEqual({ name: 'test' });
          expect(result).not.toContain('\n');
        }
      );
    });

    test('serializes nested objects', () => {
      const data = { a: { b: { c: 1 } } };
      expect(Helpers.serializeToJson(data)).toSucceedAndSatisfy((result) => {
        expect(JSON.parse(result)).toEqual(data);
      });
    });

    test('handles null and undefined values', () => {
      expect(Helpers.serializeToJson({ a: null })).toSucceedAndSatisfy((result) => {
        expect(JSON.parse(result)).toEqual({ a: null });
      });
    });

    test('fails for circular references', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      expect(Helpers.serializeToJson(circular)).toFailWith(/serialize to JSON/i);
    });
  });

  // ============================================================================
  // Array utilities
  // ============================================================================

  describe('nonEmpty', () => {
    test('returns undefined for empty array', () => {
      expect(Helpers.nonEmpty([])).toBeUndefined();
    });

    test('returns the array for non-empty array', () => {
      const arr = [1, 2, 3];
      expect(Helpers.nonEmpty(arr)).toBe(arr);
    });

    test('returns the array for single-element array', () => {
      const arr = ['single'];
      expect(Helpers.nonEmpty(arr)).toBe(arr);
    });
  });

  describe('findById', () => {
    type TestId = string & { __brand: 'TestId' };
    interface ITestOption {
      readonly id: TestId;
      readonly value: number;
    }
    const items: ReadonlyArray<ITestOption> = [
      { id: 'a' as TestId, value: 1 },
      { id: 'b' as TestId, value: 2 },
      { id: 'c' as TestId, value: 3 }
    ];

    test('returns the matching item when found', () => {
      expect(Helpers.findById('b' as TestId, items)).toEqual({ id: 'b', value: 2 });
    });

    test('returns undefined when id is not found', () => {
      expect(Helpers.findById('z' as TestId, items)).toBeUndefined();
    });

    test('returns undefined when items is undefined', () => {
      expect(Helpers.findById('a' as TestId, undefined)).toBeUndefined();
    });

    test('returns undefined for empty array', () => {
      expect(Helpers.findById('a' as TestId, [] as ReadonlyArray<ITestOption>)).toBeUndefined();
    });

    test('returns first match when duplicates exist', () => {
      const dupes: ReadonlyArray<ITestOption> = [
        { id: 'x' as TestId, value: 10 },
        { id: 'x' as TestId, value: 20 }
      ];
      expect(Helpers.findById('x' as TestId, dupes)).toEqual({ id: 'x', value: 10 });
    });
  });

  describe('generateFillingVariationSpec', () => {
    const date = '2026-02-18';

    test('generates 01 index when no existing specs', () => {
      expect(Helpers.generateFillingVariationSpec([], { date })).toSucceedWith(
        `${date}-01` as FillingRecipeVariationSpec
      );
    });

    test('auto-increments past existing specs for the same date', () => {
      const existing = [`${date}-01`, `${date}-02`] as FillingRecipeVariationSpec[];
      expect(Helpers.generateFillingVariationSpec(existing, { date })).toSucceedWith(
        `${date}-03` as FillingRecipeVariationSpec
      );
    });

    test('ignores specs from other dates when auto-incrementing', () => {
      const existing = ['2026-01-01-01', '2026-01-01-02'] as FillingRecipeVariationSpec[];
      expect(Helpers.generateFillingVariationSpec(existing, { date })).toSucceedWith(
        `${date}-01` as FillingRecipeVariationSpec
      );
    });

    test('appends kebab-cased name as suffix', () => {
      expect(Helpers.generateFillingVariationSpec([], { date, name: 'Less Sugar' })).toSucceedWith(
        `${date}-01-less-sugar` as FillingRecipeVariationSpec
      );
    });

    test('uses explicit index when provided', () => {
      expect(Helpers.generateFillingVariationSpec([], { date, index: 5 })).toSucceedWith(
        `${date}-05` as FillingRecipeVariationSpec
      );
    });

    test('fails when explicit index collides with existing spec', () => {
      const existing = [`${date}-05`] as FillingRecipeVariationSpec[];
      expect(Helpers.generateFillingVariationSpec(existing, { date, index: 5 })).toFailWith(/already exists/);
    });

    test('explicit index with name produces correct spec', () => {
      expect(Helpers.generateFillingVariationSpec([], { date, index: 3, name: 'Extra Dark' })).toSucceedWith(
        `${date}-03-extra-dark` as FillingRecipeVariationSpec
      );
    });

    test('defaults date to today when not provided', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(Helpers.generateFillingVariationSpec([])).toSucceedAndSatisfy((spec) => {
        expect(spec).toBe(`${today}-01`);
      });
    });

    test('fails when all indices 01-99 are taken for the date', () => {
      const existing = Array.from(
        { length: 99 },
        (__, i) => `${date}-${String(i + 1).padStart(2, '0')}` as FillingRecipeVariationSpec
      );
      expect(Helpers.generateFillingVariationSpec(existing, { date })).toFailWith(/no available index/);
    });

    test('treats spec with non-numeric suffix after date as index 0 when auto-incrementing', () => {
      const existing = [`${date}-ab-some-label`] as FillingRecipeVariationSpec[];
      expect(Helpers.generateFillingVariationSpec(existing, { date })).toSucceedWith(
        `${date}-01` as FillingRecipeVariationSpec
      );
    });
  });

  describe('generateConfectionVariationSpec', () => {
    const date = '2026-02-18';

    test('generates 01 index when no existing specs', () => {
      expect(Helpers.generateConfectionVariationSpec([], { date })).toSucceedWith(
        `${date}-01` as ConfectionRecipeVariationSpec
      );
    });

    test('auto-increments past existing specs for the same date', () => {
      const existing = [`${date}-01`, `${date}-02`] as ConfectionRecipeVariationSpec[];
      expect(Helpers.generateConfectionVariationSpec(existing, { date })).toSucceedWith(
        `${date}-03` as ConfectionRecipeVariationSpec
      );
    });

    test('appends kebab-cased name as suffix', () => {
      expect(Helpers.generateConfectionVariationSpec([], { date, name: 'Dark Shell' })).toSucceedWith(
        `${date}-01-dark-shell` as ConfectionRecipeVariationSpec
      );
    });

    test('fails when explicit index collides with existing spec', () => {
      const existing = [`${date}-03`] as ConfectionRecipeVariationSpec[];
      expect(Helpers.generateConfectionVariationSpec(existing, { date, index: 3 })).toFailWith(
        /already exists/
      );
    });
  });
});
