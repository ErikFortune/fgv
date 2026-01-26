// Copyright (c) 2025 Erik Fortune
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

import {
  parseCollectionStorageData,
  parseSubLibraryStorageData,
  getStorageKey,
  serializeCollectionsForStorage,
  upsertCollectionInStorage,
  removeCollectionFromStorage,
  LocalStorageKeys,
  SubLibraryDataPaths
} from '../../../packlets/library-persistence';

describe('library-persistence', () => {
  describe('parseCollectionStorageData', () => {
    test('returns empty array for undefined input', () => {
      expect(parseCollectionStorageData(undefined, '/data/test')).toEqual([]);
    });

    test('returns empty array for empty string', () => {
      expect(parseCollectionStorageData('', '/data/test')).toEqual([]);
    });

    test('returns empty array for invalid JSON', () => {
      expect(parseCollectionStorageData('not valid json', '/data/test')).toEqual([]);
    });

    test('returns empty array for non-object JSON', () => {
      expect(parseCollectionStorageData('"string"', '/data/test')).toEqual([]);
      expect(parseCollectionStorageData('[1,2,3]', '/data/test')).toEqual([]);
      expect(parseCollectionStorageData('42', '/data/test')).toEqual([]);
    });

    test('parses valid collection with items', () => {
      const data = {
        myCollection: {
          items: {
            item1: { name: 'Item 1' }
          }
        }
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/ingredients');
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/data/ingredients/myCollection.json');
      expect(result[0].contents).toEqual(data.myCollection);
    });

    test('parses collection with metadata', () => {
      const data = {
        myCollection: {
          items: { item1: {} },
          metadata: { version: '1.0' }
        }
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/fillings');
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/data/fillings/myCollection.json');
    });

    test('skips collections without items', () => {
      const data = {
        goodCollection: { items: { item1: {} } },
        badCollection: { notItems: {} }
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/test');
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/data/test/goodCollection.json');
    });

    test('skips collections with non-object items', () => {
      const data = {
        badCollection: { items: 'not an object' }
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/test');
      expect(result).toHaveLength(0);
    });

    test('skips collections with non-object metadata', () => {
      const data = {
        badCollection: { items: {}, metadata: 'not an object' }
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/test');
      expect(result).toHaveLength(0);
    });

    test('allows undefined metadata', () => {
      const data = {
        goodCollection: { items: {}, metadata: undefined }
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/test');
      expect(result).toHaveLength(1);
    });

    test('parses multiple collections', () => {
      const data = {
        collectionA: { items: { a: {} } },
        collectionB: { items: { b: {} } }
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/molds');
      expect(result).toHaveLength(2);
      const paths = result.map((f) => f.path).sort();
      expect(paths).toEqual(['/data/molds/collectionA.json', '/data/molds/collectionB.json']);
    });

    test('parses encrypted collections without items validation', () => {
      const data = {
        encryptedCollection: {
          format: 'encrypted-collection-v1',
          encryptedData: 'base64data',
          algorithm: 'AES-256-GCM',
          keyDerivation: {
            salt: 'somesalt',
            iterations: 100000
          }
        }
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/test');
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/data/test/encryptedCollection.json');
    });

    test('skips non-object collection entries', () => {
      const data = {
        validCollection: { items: {} },
        invalidCollection: 'not an object'
      };
      const result = parseCollectionStorageData(JSON.stringify(data), '/data/test');
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/data/test/validCollection.json');
    });
  });

  describe('parseSubLibraryStorageData', () => {
    test('uses correct data path for each sublibrary', () => {
      const data = { testCollection: { items: {} } };
      const json = JSON.stringify(data);

      const ingredientResult = parseSubLibraryStorageData('ingredients', json);
      expect(ingredientResult[0].path).toBe('/data/ingredients/testCollection.json');

      const fillingResult = parseSubLibraryStorageData('fillings', json);
      expect(fillingResult[0].path).toBe('/data/fillings/testCollection.json');

      const confectionResult = parseSubLibraryStorageData('confections', json);
      expect(confectionResult[0].path).toBe('/data/confections/testCollection.json');
    });
  });

  describe('getStorageKey', () => {
    test('returns correct key for each sublibrary', () => {
      expect(getStorageKey('ingredients')).toBe(LocalStorageKeys.ingredients);
      expect(getStorageKey('fillings')).toBe(LocalStorageKeys.fillings);
      expect(getStorageKey('molds')).toBe(LocalStorageKeys.molds);
      expect(getStorageKey('tasks')).toBe(LocalStorageKeys.tasks);
      expect(getStorageKey('procedures')).toBe(LocalStorageKeys.procedures);
      expect(getStorageKey('journals')).toBe(LocalStorageKeys.journals);
      expect(getStorageKey('confections')).toBe(LocalStorageKeys.confections);
    });
  });

  describe('serializeCollectionsForStorage', () => {
    test('serializes collections to JSON', () => {
      const collections = {
        collectionA: { items: { a: {} } },
        collectionB: { items: { b: {} } }
      };
      const result = serializeCollectionsForStorage(collections);
      expect(JSON.parse(result)).toEqual(collections);
    });

    test('handles empty collections', () => {
      expect(serializeCollectionsForStorage({})).toBe('{}');
    });
  });

  describe('upsertCollectionInStorage', () => {
    test('adds collection to empty storage', () => {
      const result = upsertCollectionInStorage(undefined, 'newCollection', { items: {} });
      expect(JSON.parse(result)).toEqual({
        newCollection: { items: {} }
      });
    });

    test('adds collection to existing storage', () => {
      const existing = JSON.stringify({ existing: { items: { a: {} } } });
      const result = upsertCollectionInStorage(existing, 'newCollection', { items: { b: {} } });
      expect(JSON.parse(result)).toEqual({
        existing: { items: { a: {} } },
        newCollection: { items: { b: {} } }
      });
    });

    test('updates existing collection', () => {
      const existing = JSON.stringify({ myCollection: { items: { old: {} } } });
      const result = upsertCollectionInStorage(existing, 'myCollection', { items: { new: {} } });
      expect(JSON.parse(result)).toEqual({
        myCollection: { items: { new: {} } }
      });
    });

    test('handles corrupted existing data', () => {
      const result = upsertCollectionInStorage('not valid json', 'newCollection', { items: {} });
      expect(JSON.parse(result)).toEqual({
        newCollection: { items: {} }
      });
    });

    test('handles non-object parsed data', () => {
      const result = upsertCollectionInStorage('[1,2,3]', 'newCollection', { items: {} });
      expect(JSON.parse(result)).toEqual({
        newCollection: { items: {} }
      });
    });
  });

  describe('removeCollectionFromStorage', () => {
    test('returns undefined for undefined input', () => {
      expect(removeCollectionFromStorage(undefined, 'anyCollection')).toBeUndefined();
    });

    test('returns undefined for invalid JSON', () => {
      expect(removeCollectionFromStorage('not valid', 'anyCollection')).toBeUndefined();
    });

    test('returns undefined for non-object JSON', () => {
      expect(removeCollectionFromStorage('[1,2,3]', 'anyCollection')).toBeUndefined();
    });

    test('removes collection and returns remaining', () => {
      const existing = JSON.stringify({
        collectionA: { items: {} },
        collectionB: { items: {} }
      });
      const result = removeCollectionFromStorage(existing, 'collectionA');
      expect(result).toBeDefined();
      expect(JSON.parse(result!)).toEqual({
        collectionB: { items: {} }
      });
    });

    test('returns undefined when last collection is removed', () => {
      const existing = JSON.stringify({
        onlyCollection: { items: {} }
      });
      const result = removeCollectionFromStorage(existing, 'onlyCollection');
      expect(result).toBeUndefined();
    });

    test('handles removing non-existent collection', () => {
      const existing = JSON.stringify({
        existing: { items: {} }
      });
      const result = removeCollectionFromStorage(existing, 'nonExistent');
      expect(result).toBeDefined();
      expect(JSON.parse(result!)).toEqual({
        existing: { items: {} }
      });
    });
  });

  describe('LocalStorageKeys', () => {
    test('has expected keys', () => {
      expect(LocalStorageKeys.ingredients).toBe('chocolate-lab-web:ingredients:collections:v1');
      expect(LocalStorageKeys.fillings).toBe('chocolate-lab-web:fillings:collections:v1');
      expect(LocalStorageKeys.molds).toBe('chocolate-lab-web:molds:collections:v1');
      expect(LocalStorageKeys.tasks).toBe('chocolate-lab-web:tasks:collections:v1');
      expect(LocalStorageKeys.procedures).toBe('chocolate-lab-web:procedures:collections:v1');
      expect(LocalStorageKeys.journals).toBe('chocolate-lab-web:journals:collections:v1');
      expect(LocalStorageKeys.confections).toBe('chocolate-lab-web:confections:collections:v1');
    });
  });

  describe('SubLibraryDataPaths', () => {
    test('has expected paths', () => {
      expect(SubLibraryDataPaths.ingredients).toBe('/data/ingredients');
      expect(SubLibraryDataPaths.fillings).toBe('/data/fillings');
      expect(SubLibraryDataPaths.molds).toBe('/data/molds');
      expect(SubLibraryDataPaths.tasks).toBe('/data/tasks');
      expect(SubLibraryDataPaths.procedures).toBe('/data/procedures');
      expect(SubLibraryDataPaths.journals).toBe('/data/journals');
      expect(SubLibraryDataPaths.confections).toBe('/data/confections');
    });
  });
});
