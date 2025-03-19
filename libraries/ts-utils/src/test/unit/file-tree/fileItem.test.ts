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

import '../../helpers/jest';

import * as FileTree from '../../../packlets/file-tree';
import { Converters } from '../../../packlets/conversion';

const testFiles: FileTree.IInMemoryFile[] = [
  {
    path: '/some/path/file1.json',
    contents: { helloMyNameIs: 'file1' }
  },
  {
    path: '/some/other/path/file2.json',
    contents: 'file2 string'
  }
];

const bodyConverter = Converters.object({ helloMyNameIs: Converters.string });

describe('FileItem', () => {
  let files: FileTree.IInMemoryFile[];
  let tree: FileTree.FileTree;

  beforeEach(() => {
    files = JSON.parse(JSON.stringify(testFiles));
    tree = FileTree.inMemory(files).orThrow();
  });

  describe('constructor', () => {
    test('succeeds with valid files', () => {
      expect(FileTree.inMemory(files)).toSucceed();
    });

    describe('getContents', () => {
      test('returns a json object body', () => {
        expect(tree.getItem('/some/path/file1.json')).toSucceedAndSatisfy((item) => {
          expect(item.absolutePath).toEqual('/some/path/file1.json');
          expect(item.name).toEqual('file1.json');
          expect(item.type).toEqual('file');
          if (item.type === 'file') {
            expect(item.baseName).toEqual('file1');
            expect(item.extension).toEqual('.json');
            expect(item.getContents()).toSucceedWith({ helloMyNameIs: 'file1' });
          }
        });
      });

      test('returns a string body', () => {
        expect(tree.getItem('/some/other/path/file2.json')).toSucceedAndSatisfy((item) => {
          expect(item.absolutePath).toEqual('/some/other/path/file2.json');
          expect(item.name).toEqual('file2.json');
          expect(item.type).toEqual('file');
          if (item.type === 'file') {
            expect(item.getContents()).toSucceedWith('file2 string');
          }
        });
      });

      test('returns a strongly-typed body if a converter is supplied', () => {
        expect(tree.getItem('/some/path/file1.json')).toSucceedAndSatisfy((item) => {
          expect(item.absolutePath).toEqual('/some/path/file1.json');
          expect(item.name).toEqual('file1.json');
          expect(item.type).toEqual('file');
          if (item.type === 'file') {
            expect(item.getContents(bodyConverter)).toSucceedAndSatisfy((body) => {
              // note that body is strongly typed so we can access helloMyNameIs directly
              expect(body.helloMyNameIs).toEqual('file1');
            });
          }
        });
      });
    });
  });

  describe('getRawContents', () => {
    test('returns a stringified json body', () => {
      expect(tree.getItem('/some/path/file1.json')).toSucceedAndSatisfy((item) => {
        expect(item.absolutePath).toEqual('/some/path/file1.json');
        expect(item.name).toEqual('file1.json');
        expect(item.type).toEqual('file');
        if (item.type === 'file') {
          expect(item.getRawContents()).toSucceedWith('{"helloMyNameIs":"file1"}');
        }
      });
    });

    test('returns a string body', () => {
      expect(tree.getItem('/some/other/path/file2.json')).toSucceedAndSatisfy((item) => {
        expect(item.absolutePath).toEqual('/some/other/path/file2.json');
        expect(item.name).toEqual('file2.json');
        expect(item.type).toEqual('file');
        if (item.type === 'file') {
          expect(item.getRawContents()).toSucceedWith('file2 string');
        }
      });
    });
  });
});
