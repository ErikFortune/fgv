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

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

import { BuiltInData, ingredientCollections, fillingCollections } from '../../../packlets/built-in';

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
          expect(names).toEqual([
            'cacao-barry.json',
            'callebaut.json',
            'common.json',
            'felchlin.json',
            'guittard.json'
          ]);
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
              const sourceFile = contents as { items: Record<string, unknown> };
              expect(sourceFile.items['heavy-cream-36']).toBeDefined();
              expect(sourceFile.items['butter-82']).toBeDefined();
              expect(sourceFile.items['glucose-de43']).toBeDefined();
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
              const sourceFile = contents as { items: Record<string, unknown> };
              expect(sourceFile.items['maracaibo-65']).toBeDefined();
              expect(sourceFile.items['arriba-72']).toBeDefined();
            });
          }
        });
      });
    });
  });

  // ============================================================================
  // getFillingsDirectory Tests
  // ============================================================================

  describe('getFillingsDirectory', () => {
    test('returns the recipes directory', () => {
      expect(BuiltInData.getFillingsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.type).toBe('directory');
        expect(dir.name).toBe('fillings');
      });
    });

    test('recipes directory contains expected collections', () => {
      expect(BuiltInData.getFillingsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const names = children.map((c) => c.name).sort();
          // common.json is unencrypted public recipes
          expect(names).toEqual(['common.json']);
        });
      });
    });

    test('common.json contains expected recipes', () => {
      expect(BuiltInData.getFillingsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const commonFile = children.find((c) => c.name === 'common.json');
          expect(commonFile).toBeDefined();
          expect(commonFile?.type).toBe('file');

          if (commonFile?.type === 'file') {
            expect(commonFile.getContents()).toSucceedAndSatisfy((contents) => {
              const sourceFile = contents as { items: Record<string, unknown> };
              expect(sourceFile.items['dark-ganache-classic']).toBeDefined();
              expect(sourceFile.items['milk-ganache-classic']).toBeDefined();
              expect(sourceFile.items['white-ganache-classic']).toBeDefined();
              expect(sourceFile.items['vegan-ganache-coconut-cream']).toBeDefined();
            });
          }
        });
      });
    });
  });

  // ============================================================================
  // getMoldsDirectory Tests
  // ============================================================================

  describe('getMoldsDirectory', () => {
    test('returns the molds directory', () => {
      expect(BuiltInData.getMoldsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.type).toBe('directory');
        expect(dir.name).toBe('molds');
      });
    });

    test('molds directory contains expected collections', () => {
      expect(BuiltInData.getMoldsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const names = children.map((c) => c.name).sort();
          expect(names).toContain('common.json');
          expect(names).toContain('cw.json');
        });
      });
    });

    test('common.json contains expected generic molds', () => {
      expect(BuiltInData.getMoldsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const commonFile = children.find((c) => c.name === 'common.json');
          expect(commonFile).toBeDefined();
          expect(commonFile?.type).toBe('file');

          if (commonFile?.type === 'file') {
            expect(commonFile.getContents()).toSucceedAndSatisfy((contents) => {
              const sourceFile = contents as { items: Record<string, unknown> };
              expect(sourceFile.items['dome-25mm']).toBeDefined();
              expect(sourceFile.items['dome-30mm']).toBeDefined();
            });
          }
        });
      });
    });

    test('cw.json contains Chocolate World molds', () => {
      expect(BuiltInData.getMoldsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const cwFile = children.find((c) => c.name === 'cw.json');
          expect(cwFile).toBeDefined();
          expect(cwFile?.type).toBe('file');

          if (cwFile?.type === 'file') {
            expect(cwFile.getContents()).toSucceedAndSatisfy((contents) => {
              const sourceFile = contents as { items: Record<string, unknown> };
              expect(sourceFile.items['chocolate-world-cw-2227']).toBeDefined();
            });
          }
        });
      });
    });
  });

  // ============================================================================
  // getProceduresDirectory Tests
  // ============================================================================

  describe('getProceduresDirectory', () => {
    test('returns the procedures directory', () => {
      expect(BuiltInData.getProceduresDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.type).toBe('directory');
        expect(dir.name).toBe('procedures');
      });
    });

    test('procedures directory contains expected collections', () => {
      expect(BuiltInData.getProceduresDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const names = children.map((c) => c.name).sort();
          expect(names).toContain('common.json');
        });
      });
    });

    test('common.json contains expected procedures', () => {
      expect(BuiltInData.getProceduresDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const commonFile = children.find((c) => c.name === 'common.json');
          expect(commonFile).toBeDefined();
          expect(commonFile?.type).toBe('file');

          if (commonFile?.type === 'file') {
            expect(commonFile.getContents()).toSucceedAndSatisfy((contents) => {
              const sourceFile = contents as { items: Record<string, unknown> };
              expect(sourceFile.items['ganache-cold-method']).toBeDefined();
            });
          }
        });
      });
    });
  });

  // ============================================================================
  // getTasksDirectory Tests
  // ============================================================================

  describe('getTasksDirectory', () => {
    test('returns the tasks directory', () => {
      expect(BuiltInData.getTasksDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.type).toBe('directory');
        expect(dir.name).toBe('tasks');
      });
    });

    test('tasks directory contains expected collections', () => {
      expect(BuiltInData.getTasksDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const names = children.map((c) => c.name).sort();
          expect(names).toContain('common.json');
        });
      });
    });

    test('common.json contains expected tasks', () => {
      expect(BuiltInData.getTasksDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const commonFile = children.find((c) => c.name === 'common.json');
          expect(commonFile).toBeDefined();
          expect(commonFile?.type).toBe('file');

          if (commonFile?.type === 'file') {
            expect(commonFile.getContents()).toSucceedAndSatisfy((contents) => {
              const sourceFile = contents as { items: Record<string, unknown> };
              expect(sourceFile.items['melt-chocolate']).toBeDefined();
              expect(sourceFile.items['heat-ingredient']).toBeDefined();
              expect(sourceFile.items['combine-and-emulsify']).toBeDefined();
            });
          }
        });
      });
    });
  });

  // ============================================================================
  // Source Data Validation Tests
  // ============================================================================

  describe('source data validation', () => {
    // The test runs from lib/test/unit/built-in/, so we need to go up to the library root
    const libraryRoot = path.resolve(__dirname, '..', '..', '..', '..');
    const ingredientsSourceDir = path.join(libraryRoot, 'data', 'published', 'ingredients');
    const recipesSourceDir = path.join(libraryRoot, 'data', 'published', 'fillings');

    test('generated ingredient data matches source YAML files', () => {
      // Read source YAML files directly
      const sourceFiles = fs
        .readdirSync(ingredientsSourceDir)
        .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

      // Compare collection names
      const generatedNames = Object.keys(ingredientCollections).sort();
      const sourceNames = sourceFiles.map((f) => path.basename(f, path.extname(f))).sort();
      expect(generatedNames).toEqual(sourceNames);

      // Compare each collection's content
      for (const file of sourceFiles) {
        const name = path.basename(file, path.extname(file));
        const sourceContent = yaml.parse(fs.readFileSync(path.join(ingredientsSourceDir, file), 'utf-8'));
        expect(ingredientCollections[name]).toEqual(sourceContent);
      }
    });

    test('generated recipe data matches source YAML files', () => {
      // Read source YAML files directly (unencrypted recipes)
      const sourceFiles = fs
        .readdirSync(recipesSourceDir)
        .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

      // Also check for JSON files (encrypted recipes)
      const jsonFiles = fs.readdirSync(recipesSourceDir).filter((f) => f.endsWith('.json'));

      // All source files (YAML unencrypted + JSON encrypted) should match generated collections
      const generatedNames = Object.keys(fillingCollections).sort();
      const yamlSourceNames = sourceFiles.map((f) => path.basename(f, path.extname(f)));
      const jsonSourceNames = jsonFiles.map((f) => path.basename(f, path.extname(f)));
      const allSourceNames = [...yamlSourceNames, ...jsonSourceNames].sort();
      expect(generatedNames).toEqual(allSourceNames);

      // Compare each YAML collection's content (JSON files are encrypted and content comparison is separate)
      for (const file of sourceFiles) {
        const name = path.basename(file, path.extname(file));
        const sourceContent = yaml.parse(fs.readFileSync(path.join(recipesSourceDir, file), 'utf-8'));
        expect(fillingCollections[name]).toEqual(sourceContent);
      }
    });

    test('all source ingredient YAML files are valid', () => {
      const sourceFiles = fs
        .readdirSync(ingredientsSourceDir)
        .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

      for (const file of sourceFiles) {
        const filePath = path.join(ingredientsSourceDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Should parse without error
        expect(() => yaml.parse(content)).not.toThrow();

        // Data should have the new { metadata?, items } structure
        const sourceFile = yaml.parse(content) as { items: Record<string, Record<string, unknown>> };
        expect(sourceFile.items).toBeDefined();

        // Each ingredient should have required fields
        for (const [id, ingredient] of Object.entries(sourceFile.items)) {
          expect(ingredient.baseId).toBe(id);
          expect(ingredient.name).toBeDefined();
          expect(ingredient.category).toBeDefined();
        }
      }
    });

    test('all source recipe YAML files are valid', () => {
      const sourceFiles = fs
        .readdirSync(recipesSourceDir)
        .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

      for (const file of sourceFiles) {
        const filePath = path.join(recipesSourceDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Should parse without error
        expect(() => yaml.parse(content)).not.toThrow();

        // Data should have the new { metadata?, items } structure
        const sourceFile = yaml.parse(content) as { items: Record<string, Record<string, unknown>> };
        expect(sourceFile.items).toBeDefined();

        // Each recipe should have required fields
        // Each recipe should have required fields
        for (const [id, recipe] of Object.entries(sourceFile.items)) {
          expect(recipe.baseId).toBe(id);
          expect(recipe.name).toBeDefined();
          expect(recipe.variations).toBeDefined();
        }
      }
    });
  });

  // ============================================================================
  // getConfectionsDirectory Tests
  // ============================================================================

  describe('getConfectionsDirectory', () => {
    test('returns the confections directory', () => {
      expect(BuiltInData.getConfectionsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.type).toBe('directory');
        expect(dir.name).toBe('confections');
      });
    });

    test('confections directory contains expected files', () => {
      expect(BuiltInData.getConfectionsDirectory()).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          // Should contain common.json
          const names = children.map((c) => c.name);
          expect(names).toContain('common.json');
        });
      });
    });
  });
});
