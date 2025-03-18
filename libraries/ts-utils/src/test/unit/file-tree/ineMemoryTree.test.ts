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

const testFiles: FileTree.IInMemoryFile[] = [
  {
    path: '/some/path/file1.json',
    contents: { helloMyNameIs: 'file1' }
  },
  {
    path: '/some/other/path/file2.json',
    contents: { helloMyNameIs: 'file2' }
  },
  {
    path: '/rootFile.json',
    contents: { helloMyNameIs: 'root' }
  },
  {
    path: '/some/path/file3.json',
    contents: { helloMyNameIs: 'file3' }
  }
];

describe('InMemoryTree', () => {
  let files: FileTree.IInMemoryFile[];

  beforeEach(() => {
    files = JSON.parse(JSON.stringify(testFiles));
  });

  describe('constructor', () => {
    test('succeeds with valid files', () => {
      expect(FileTree.inMemory(files)).toSucceed();
    });

    test('prepends a valid prefix', () => {
      expect(FileTree.inMemory(files, '/root')).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/root/some/path/file1.json')).toSucceedAndSatisfy((item) => {
          expect(item.absolutePath).toEqual('/root/some/path/file1.json');
          expect(item.type).toEqual('file');
          if (item.type === 'file') {
            expect(item.getContents()).toSucceedWith({ helloMyNameIs: 'file1' });
          }
        });
      });
    });

    test('fails with an invalid prefix', () => {
      expect(FileTree.inMemory(files, 'not-absolute')).toFailWith(/not an absolute path/i);
    });

    test('fails with an invalid file path', () => {
      files.push({ path: '', contents: { helloMyNameIs: 'null' } });
      expect(FileTree.inMemory(files)).toFailWith(/invalid file path/i);
    });

    test('fails with duplicate files', () => {
      files.push(files[0]);
      expect(FileTree.inMemory(files)).toFailWith(/already exists/i);
    });

    test('fails with a file below another file', () => {
      files.push({
        path: `${files[0].path}/file4.json`,
        contents: { helloMyNameIs: 'file4' }
      });
      expect(FileTree.inMemory(files)).toFailWith(/not a directory/i);
    });
  });

  describe('getItem', () => {
    let tree: FileTree.FileTree;

    beforeEach(() => {
      tree = FileTree.inMemory(files).orThrow();
    });

    test(' returns a file that exists', () => {
      expect(tree.getItem('/some/path/file1.json')).toSucceedAndSatisfy((item) => {
        expect(item.absolutePath).toEqual('/some/path/file1.json');
        expect(item.name).toEqual('file1.json');
        expect(item.type).toEqual('file');
        if (item.type === 'file') {
          expect(item.getContents()).toSucceedWith({ helloMyNameIs: 'file1' });
        }
      });
    });

    test('gets a directory that exists', () => {
      expect(tree.getItem('/some/path')).toSucceedAndSatisfy((item) => {
        expect(item.absolutePath).toEqual('/some/path');
        expect(item.name).toEqual('path');
        expect(item.type).toEqual('directory');
        if (item.type === 'directory') {
          expect(item.getChildren()).toSucceedAndSatisfy((children) => {
            expect(children.length).toEqual(2);
            expect(children[0].name).toEqual('file1.json');
            expect(children[1].name).toEqual('file3.json');
          });
        }
      });
    });
  });
});
