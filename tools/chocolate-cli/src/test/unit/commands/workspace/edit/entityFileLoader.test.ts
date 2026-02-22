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
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  getEntityConverter,
  loadEntityFromFile
} from '../../../../../commands/workspace/edit/entityFileLoader';
import { EntityTypeName } from '../../../../../commands/workspace/edit/editTypes';

// Helper to create a temporary directory with files
function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'choco-entity-test-'));
}

function cleanupTempDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

// Minimal valid entities for testing file loading
const VALID_TASK_JSON = JSON.stringify({
  baseId: 'test-task',
  name: 'Test Task',
  template: 'Do {{thing}}',
  defaults: { thing: 'something' }
});

const VALID_INGREDIENT_JSON = JSON.stringify({
  baseId: 'test-ingredient',
  name: 'Test Ingredient',
  category: 'sugar',
  ganacheCharacteristics: {
    cacaoFat: 0,
    sugar: 100,
    milkFat: 0,
    water: 0,
    solids: 0,
    otherFats: 0
  }
});

const VALID_MOLD_JSON = JSON.stringify({
  baseId: 'test-mold',
  manufacturer: 'Test',
  productNumber: 'T-001',
  format: 'other',
  cavities: { kind: 'count', count: 10 }
});

const VALID_TASK_YAML = `baseId: test-task
name: Test Task
template: 'Do {{thing}}'
defaults:
  thing: something
`;

describe('entityFileLoader', () => {
  // ============================================================================
  // getEntityConverter
  // ============================================================================

  describe('getEntityConverter', () => {
    const allTypes: EntityTypeName[] = ['task', 'ingredient', 'mold', 'procedure', 'filling', 'confection'];

    test.each(allTypes)('returns a converter for "%s"', (entityType) => {
      const converter = getEntityConverter(entityType);
      expect(converter).toBeDefined();
      expect(typeof converter.convert).toBe('function');
    });
  });

  // ============================================================================
  // loadEntityFromFile
  // ============================================================================

  describe('loadEntityFromFile', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = createTempDir();
    });

    afterEach(() => {
      cleanupTempDir(tmpDir);
    });

    // --- Success cases ---

    test('loads a valid task from a JSON file', () => {
      const filePath = path.join(tmpDir, 'task.json');
      fs.writeFileSync(filePath, VALID_TASK_JSON);

      expect(loadEntityFromFile(filePath, 'task')).toSucceedAndSatisfy((loaded) => {
        expect(loaded.format).toBe('json');
        expect(loaded.entity).toBeDefined();
      });
    });

    test('loads a valid task from a YAML file', () => {
      const filePath = path.join(tmpDir, 'task.yaml');
      fs.writeFileSync(filePath, VALID_TASK_YAML);

      expect(loadEntityFromFile(filePath, 'task')).toSucceedAndSatisfy((loaded) => {
        expect(loaded.format).toBe('yaml');
        expect(loaded.entity).toBeDefined();
      });
    });

    test('loads a valid task from a .yml file', () => {
      const filePath = path.join(tmpDir, 'task.yml');
      fs.writeFileSync(filePath, VALID_TASK_YAML);

      expect(loadEntityFromFile(filePath, 'task')).toSucceedAndSatisfy((loaded) => {
        expect(loaded.format).toBe('yaml');
      });
    });

    test('loads a valid ingredient from a JSON file', () => {
      const filePath = path.join(tmpDir, 'ingredient.json');
      fs.writeFileSync(filePath, VALID_INGREDIENT_JSON);

      expect(loadEntityFromFile(filePath, 'ingredient')).toSucceedAndSatisfy((loaded) => {
        expect(loaded.format).toBe('json');
        expect(loaded.entity).toBeDefined();
      });
    });

    test('loads a valid mold from a JSON file', () => {
      const filePath = path.join(tmpDir, 'mold.json');
      fs.writeFileSync(filePath, VALID_MOLD_JSON);

      expect(loadEntityFromFile(filePath, 'mold')).toSucceedAndSatisfy((loaded) => {
        expect(loaded.format).toBe('json');
        expect(loaded.entity).toBeDefined();
      });
    });

    // --- Failure cases ---

    test('fails for unsupported file extension', () => {
      const filePath = path.join(tmpDir, 'entity.txt');
      fs.writeFileSync(filePath, VALID_TASK_JSON);

      expect(loadEntityFromFile(filePath, 'task')).toFailWith(/unsupported file extension/i);
    });

    test('fails for non-existent file', () => {
      const filePath = path.join(tmpDir, 'missing.json');

      expect(loadEntityFromFile(filePath, 'task')).toFailWith(/failed to read file/i);
    });

    test('fails for malformed JSON', () => {
      const filePath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(filePath, '{invalid json}');

      expect(loadEntityFromFile(filePath, 'task')).toFailWith(/failed to parse json/i);
    });

    test('fails for malformed YAML', () => {
      const filePath = path.join(tmpDir, 'bad.yaml');
      fs.writeFileSync(filePath, 'key:\n\t- bad');

      expect(loadEntityFromFile(filePath, 'task')).toFailWith(/failed to parse yaml/i);
    });

    test('fails when entity data does not validate', () => {
      const filePath = path.join(tmpDir, 'invalid-entity.json');
      // Missing required fields for an ingredient
      fs.writeFileSync(filePath, JSON.stringify({ notAnEntity: true }));

      expect(loadEntityFromFile(filePath, 'ingredient')).toFailWith(/validation failed/i);
    });

    test('fails when valid JSON does not match entity type', () => {
      const filePath = path.join(tmpDir, 'wrong-type.json');
      // Valid task data but try to load as mold
      fs.writeFileSync(filePath, VALID_TASK_JSON);

      expect(loadEntityFromFile(filePath, 'mold')).toFailWith(/validation failed/i);
    });
  });
});
