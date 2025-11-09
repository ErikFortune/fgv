/*
 * MIT License
 *
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

/* eslint-disable @rushstack/packlets/mechanics */
import '@fgv/ts-utils-jest';
import * as fs from 'fs';
import * as path from 'path';
import { FileTree } from '@fgv/ts-json-base';
import { loadJsonPuzzlesFileSync } from '../../../packlets/files/filesystem';
import { loadJsonPuzzlesFromTree } from '../../../packlets/files/fileTreeHelpers';

describe('filesystem', () => {
  describe('loadJsonPuzzlesFileSync', () => {
    const testDataDir = path.join(__dirname, 'test-data');
    const validPuzzleFile = path.join(testDataDir, 'valid-puzzles.json');
    const invalidPuzzleFile = path.join(testDataDir, 'invalid-puzzles.json');
    const malformedJsonFile = path.join(testDataDir, 'malformed.json');
    const nonExistentFile = path.join(testDataDir, 'does-not-exist.json');

    beforeAll(() => {
      // Create test data directory
      if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
      }

      // Create valid puzzles file
      const validPuzzles = {
        puzzles: [
          {
            id: 'test-puzzle-1',
            description: 'Test puzzle 1',
            type: 'sudoku',
            level: 1,
            cells: '.'.repeat(81),
            dimensions: {
              cageWidthInCells: 3,
              cageHeightInCells: 3,
              boardWidthInCages: 3,
              boardHeightInCages: 3
            }
          },
          {
            id: 'test-puzzle-2',
            description: 'Test puzzle 2',
            type: 'sudoku-x',
            level: 2,
            cells: '1'.repeat(81),
            dimensions: {
              cageWidthInCells: 3,
              cageHeightInCells: 3,
              boardWidthInCages: 3,
              boardHeightInCages: 3
            }
          }
        ]
      };
      fs.writeFileSync(validPuzzleFile, JSON.stringify(validPuzzles, null, 2));

      // Create invalid puzzles file (missing required fields)
      const invalidPuzzles = {
        puzzles: [
          {
            id: 'invalid-puzzle'
            // Missing description, type, level, and cells
          }
        ]
      };
      fs.writeFileSync(invalidPuzzleFile, JSON.stringify(invalidPuzzles, null, 2));

      // Create malformed JSON file
      fs.writeFileSync(malformedJsonFile, '{ "puzzles": [{ invalid json }');
    });

    afterAll(() => {
      // Clean up test files
      if (fs.existsSync(validPuzzleFile)) fs.unlinkSync(validPuzzleFile);
      if (fs.existsSync(invalidPuzzleFile)) fs.unlinkSync(invalidPuzzleFile);
      if (fs.existsSync(malformedJsonFile)) fs.unlinkSync(malformedJsonFile);
      if (fs.existsSync(testDataDir)) fs.rmdirSync(testDataDir);
    });

    test('should load and parse a valid puzzles file', () => {
      const result = loadJsonPuzzlesFileSync(validPuzzleFile);

      expect(result).toSucceedAndSatisfy((puzzlesFile) => {
        expect(puzzlesFile.puzzles).toHaveLength(2);
        expect(puzzlesFile.puzzles[0].id).toBe('test-puzzle-1');
        expect(puzzlesFile.puzzles[0].type).toBe('sudoku');
        expect(puzzlesFile.puzzles[0].level).toBe(1);
        expect(puzzlesFile.puzzles[1].id).toBe('test-puzzle-2');
        expect(puzzlesFile.puzzles[1].type).toBe('sudoku-x');
        expect(puzzlesFile.puzzles[1].level).toBe(2);
      });
    });

    test('should fail when loading a non-existent file', () => {
      const result = loadJsonPuzzlesFileSync(nonExistentFile);

      expect(result).toFailWith(/ENOENT|no such file or directory/i);
    });

    test('should fail when loading a file with invalid puzzle data', () => {
      const result = loadJsonPuzzlesFileSync(invalidPuzzleFile);

      expect(result).toFail();
      // The error message will indicate missing required fields
    });

    test('should fail when loading a malformed JSON file', () => {
      const result = loadJsonPuzzlesFileSync(malformedJsonFile);

      expect(result).toFailWith(/JSON|parse|unexpected/i);
    });

    test('should handle empty puzzles array', () => {
      const emptyPuzzlesFile = path.join(testDataDir, 'empty-puzzles.json');
      const emptyPuzzles = { puzzles: [] };
      fs.writeFileSync(emptyPuzzlesFile, JSON.stringify(emptyPuzzles, null, 2));

      try {
        const result = loadJsonPuzzlesFileSync(emptyPuzzlesFile);

        expect(result).toSucceedAndSatisfy((puzzlesFile) => {
          expect(puzzlesFile.puzzles).toHaveLength(0);
        });
      } finally {
        if (fs.existsSync(emptyPuzzlesFile)) fs.unlinkSync(emptyPuzzlesFile);
      }
    });
  });

  describe('loadJsonPuzzlesFromTree', () => {
    test('should load and parse a valid puzzles file from FileTree', () => {
      const validPuzzles = {
        puzzles: [
          {
            id: 'test-puzzle-1',
            description: 'Test puzzle 1',
            type: 'sudoku',
            level: 1,
            cells: '.'.repeat(81),
            dimensions: {
              cageWidthInCells: 3,
              cageHeightInCells: 3,
              boardWidthInCages: 3,
              boardHeightInCages: 3
            }
          }
        ]
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/puzzles.json', contents: JSON.stringify(validPuzzles, null, 2) }
      ];

      const fileTree = FileTree.InMemoryTreeAccessors.create(files)
        .onSuccess((acc) => FileTree.FileTree.create(acc))
        .orThrow();

      const result = loadJsonPuzzlesFromTree(fileTree, '/puzzles.json');

      expect(result).toSucceedAndSatisfy((puzzlesFile) => {
        expect(puzzlesFile.puzzles).toHaveLength(1);
        expect(puzzlesFile.puzzles[0].id).toBe('test-puzzle-1');
        expect(puzzlesFile.puzzles[0].type).toBe('sudoku');
        expect(puzzlesFile.puzzles[0].level).toBe(1);
      });
    });

    test('should fail when file does not exist in FileTree', () => {
      const files: FileTree.IInMemoryFile[] = [{ path: '/other.json', contents: '{}' }];

      const fileTree = FileTree.InMemoryTreeAccessors.create(files)
        .onSuccess((acc) => FileTree.FileTree.create(acc))
        .orThrow();

      const result = loadJsonPuzzlesFromTree(fileTree, '/puzzles.json');

      expect(result).toFailWith(/not found|does not exist/i);
    });

    test('should fail when loading invalid puzzle data from FileTree', () => {
      const invalidPuzzles = {
        puzzles: [
          {
            id: 'invalid-puzzle'
            // Missing required fields
          }
        ]
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/invalid.json', contents: JSON.stringify(invalidPuzzles, null, 2) }
      ];

      const fileTree = FileTree.InMemoryTreeAccessors.create(files)
        .onSuccess((acc) => FileTree.FileTree.create(acc))
        .orThrow();

      const result = loadJsonPuzzlesFromTree(fileTree, '/invalid.json');

      expect(result).toFail();
    });
  });
});
