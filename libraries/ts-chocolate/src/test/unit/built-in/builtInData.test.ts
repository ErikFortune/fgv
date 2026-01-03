// Copyright (c) 2024 Erik Fortune
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

import { BuiltInData } from '../../../packlets/built-in';

describe('BuiltInData', () => {
  beforeEach(() => {
    // Clear the cache before each test to ensure fresh state
    BuiltInData.clearCache();
  });

  // ============================================================================
  // getLibraryTree Tests
  // ============================================================================

  describe('getLibraryTree', () => {
    test('returns a valid directory tree', () => {
      expect(BuiltInData.getLibraryTree()).toSucceedAndSatisfy((tree) => {
        expect(tree.type).toBe('directory');
        expect(tree.name).toBe('');
      });
    });

    test('tree has data directory', () => {
      expect(BuiltInData.getLibraryTree()).toSucceedAndSatisfy((tree) => {
        expect(tree.getChildren()).toSucceedAndSatisfy((children) => {
          const dataDir = children.find((c) => c.name === 'data');
          expect(dataDir).toBeDefined();
          expect(dataDir?.type).toBe('directory');
        });
      });
    });

    test('caches the tree on subsequent calls', () => {
      const result1 = BuiltInData.getLibraryTree();
      const result2 = BuiltInData.getLibraryTree();

      expect(result1).toSucceed();
      expect(result2).toSucceed();

      // Both should return the same cached instance
      expect(result1.orThrow()).toBe(result2.orThrow());
    });

    test('clearCache resets the cached tree', () => {
      const result1 = BuiltInData.getLibraryTree();
      expect(result1).toSucceed();
      const tree1 = result1.orThrow();

      BuiltInData.clearCache();

      const result2 = BuiltInData.getLibraryTree();
      expect(result2).toSucceed();
      const tree2 = result2.orThrow();

      // After clearing cache, should get a different instance
      // (though contents are the same)
      expect(tree1).not.toBe(tree2);
    });
  });

  // ============================================================================
  // getIngredientsDirectory Tests
  // ============================================================================

  describe('getIngredientsDirectory', () => {
    test('returns the ingredients directory', () => {
      expect(BuiltInData.getIngredientsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.type).toBe('directory');
        expect(dir.name).toBe('ingredients');
      });
    });

    test('ingredients directory contains expected collections', () => {
      expect(BuiltInData.getIngredientsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const names = children.map((c) => c.name).sort();
          expect(names).toEqual(['cacao-barry.json', 'common.json', 'felchlin.json', 'guittard.json']);
        });
      });
    });

    test('common.json contains expected ingredients', () => {
      expect(BuiltInData.getIngredientsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const commonFile = children.find((c) => c.name === 'common.json');
          expect(commonFile).toBeDefined();
          expect(commonFile?.type).toBe('file');

          if (commonFile?.type === 'file') {
            expect(commonFile.getContents()).toSucceedAndSatisfy((contents) => {
              const data = contents as Record<string, unknown>;
              expect(data['heavy-cream-35']).toBeDefined();
              expect(data['butter-82']).toBeDefined();
              expect(data['glucose-de43']).toBeDefined();
            });
          }
        });
      });
    });

    test('felchlin.json contains expected chocolates', () => {
      expect(BuiltInData.getIngredientsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const felchlinFile = children.find((c) => c.name === 'felchlin.json');
          expect(felchlinFile).toBeDefined();
          expect(felchlinFile?.type).toBe('file');

          if (felchlinFile?.type === 'file') {
            expect(felchlinFile.getContents()).toSucceedAndSatisfy((contents) => {
              const data = contents as Record<string, unknown>;
              expect(data['maracaibo-65']).toBeDefined();
              expect(data['arriba-72']).toBeDefined();
            });
          }
        });
      });
    });
  });

  // ============================================================================
  // getRecipesDirectory Tests
  // ============================================================================

  describe('getRecipesDirectory', () => {
    test('fails because recipes directory does not exist yet', () => {
      // Currently no recipes are defined in the built-in data
      expect(BuiltInData.getRecipesDirectory()).toFailWith(/directory not found/i);
    });
  });
});
