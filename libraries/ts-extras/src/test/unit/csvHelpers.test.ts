/*
 * Copyright (c) 2020 Erik Fortune
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

import fs from 'fs';
import { readCsvFileSync, readCsvFromTree } from '../../packlets/csv';
import { FileTree } from '@fgv/ts-json-base';

describe('csvHelpers module', () => {
  describe('readCsvFileSync method', () => {
    const path = 'path/to/some/file.csv';
    const stringPayload = ['field1,field2,field3', '7, 8, 9', '4, 5, 6', '1, 2, 3'].join('\n');
    const csvPayload = [
      ['7', '8', '9'],
      ['4', '5', '6'],
      ['1', '2', '3']
    ];

    test('returns a requested CSV file', () => {
      const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
        if (typeof gotPath !== 'string') {
          throw new Error('Mock implementation only accepts string');
        }
        expect(gotPath).toContain(path);
        return stringPayload;
      });

      expect(readCsvFileSync(path)).toSucceedWith(csvPayload);
      spy.mockRestore();
    });

    test('propagates any error', () => {
      const path = 'path/to/some/file.csv';
      const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
        if (typeof gotPath !== 'string') {
          throw new Error('Mock implementation only accepts string');
        }
        expect(gotPath).toContain(path);
        throw new Error('Mock Error!');
      });

      expect(readCsvFileSync(path)).toFailWith(/mock error/i);
      spy.mockRestore();
    });

    test('accepts delimiter as an option', () => {
      const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
        if (typeof gotPath !== 'string') {
          throw new Error('Mock implementation only accepts string');
        }
        expect(gotPath).toContain(path);
        return stringPayload.replace(/,/g, ';');
      });

      expect(readCsvFileSync(path, { delimiter: ';' })).toSucceedWith(csvPayload);
      spy.mockRestore();
    });
  });

  describe('readCsvFromTree method', () => {
    test('reads CSV file from in-memory tree', () => {
      const csvContent = ['field1,field2,field3', '7, 8, 9', '4, 5, 6', '1, 2, 3'].join('\n');
      const expected = [
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3']
      ];

      const files = [{ path: '/test.csv', contents: csvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/test.csv')).toSucceedWith(expected);
      });
    });

    test('handles different delimiters', () => {
      const csvContent = ['field1;field2;field3', '7; 8; 9', '4; 5; 6'].join('\n');
      const expected = [
        ['7', '8', '9'],
        ['4', '5', '6']
      ];

      const files = [{ path: '/semicolon.csv', contents: csvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/semicolon.csv', { delimiter: ';' })).toSucceedWith(expected);
      });
    });

    test('handles files in nested directories', () => {
      const csvContent = ['name,age,city', 'John,30,NYC', 'Jane,25,LA'].join('\n');
      const expected = [
        ['John', '30', 'NYC'],
        ['Jane', '25', 'LA']
      ];

      const files = [{ path: '/data/users/people.csv', contents: csvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/data/users/people.csv')).toSucceedWith(expected);
      });
    });

    test('handles empty CSV file', () => {
      const csvContent = '';
      const expected: string[][] = [];

      const files = [{ path: '/empty.csv', contents: csvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/empty.csv')).toSucceedWith(expected);
      });
    });

    test('handles CSV with only header', () => {
      const csvContent = 'field1,field2,field3';
      const expected: string[][] = [];

      const files = [{ path: '/header-only.csv', contents: csvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/header-only.csv')).toSucceedWith(expected);
      });
    });

    test('handles CSV with quoted fields', () => {
      const csvContent = [
        'name,description,value',
        '"John Doe","A person with, comma",100',
        '"Jane Smith","Another "quoted" field",200'
      ].join('\n');
      const expected = [
        ['John Doe', 'A person with, comma', '100'],
        ['Jane Smith', 'Another "quoted" field', '200']
      ];

      const files = [{ path: '/quoted.csv', contents: csvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/quoted.csv')).toSucceedWith(expected);
      });
    });

    test('fails for non-existent file', () => {
      const files = [{ path: '/exists.csv', contents: 'field1,field2\nvalue1,value2' }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/missing.csv')).toFailWith(/not found/i);
      });
    });

    test('fails for directory instead of file', () => {
      const files = [{ path: '/directory/file.csv', contents: 'field1,field2\nvalue1,value2' }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/directory')).toFailWith(/not a file/i);
      });
    });

    test('handles malformed CSV gracefully', () => {
      const malformedCsvContent = 'field1,field2\n"unclosed quote,value2';
      const files = [{ path: '/malformed.csv', contents: malformedCsvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/malformed.csv')).toSucceedAndSatisfy((result) => {
          expect(Array.isArray(result)).toBe(true);
        });
      });
    });

    test('handles different CSV options', () => {
      const csvContent = ['field1|field2|field3', '7|8|9', '4|5|6'].join('\n');
      const expected = [
        ['7', '8', '9'],
        ['4', '5', '6']
      ];

      const files = [{ path: '/pipe.csv', contents: csvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/pipe.csv', { delimiter: '|' })).toSucceedWith(expected);
      });
    });

    test('handles CSV with mixed data types', () => {
      const csvContent = ['name,age,active,score', 'John,30,true,95.5', 'Jane,25,false,87.2'].join('\n');
      const expected = [
        ['John', '30', 'true', '95.5'],
        ['Jane', '25', 'false', '87.2']
      ];

      const files = [{ path: '/mixed.csv', contents: csvContent }];
      const treeResult = FileTree.inMemory(files);
      expect(treeResult).toSucceedAndSatisfy((tree) => {
        expect(readCsvFromTree(tree, '/mixed.csv')).toSucceedWith(expected);
      });
    });
  });
});
