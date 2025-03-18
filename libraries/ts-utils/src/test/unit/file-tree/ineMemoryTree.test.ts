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
  },
  {
    path: '/some/path/below/file4.json',
    contents: { helloMyNameIs: 'file4' }
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

    test('returns a file that exists', () => {
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
            expect(children.length).toEqual(3);
            expect(children.map((c) => c.name).sort()).toEqual(['below', 'file1.json', 'file3.json']);
          });
        }
      });
    });

    test('fails for a file that does not exist', () => {
      expect(tree.getItem('/some/path/file4.json')).toFailWith(/not found/i);
    });
  });

  describe('inMemory hal', () => {
    let tree: FileTree.FileTree;

    beforeEach(() => {
      tree = FileTree.inMemory(files, '/prefix').orThrow();
    });

    describe('resolveAbsolutePath', () => {
      test('resolves an absolute path relative to the root', () => {
        expect(tree.hal.resolveAbsolutePath('some', 'path', 'file1.json')).toEqual(
          '/prefix/some/path/file1.json'
        );
      });

      test('resolves an absolute path directly', () => {
        expect(tree.hal.resolveAbsolutePath('/some/path/file1.json')).toEqual('/some/path/file1.json');
      });

      test('removes multiple slashes', () => {
        expect(tree.hal.resolveAbsolutePath('/some//path/file1.json')).toEqual('/some/path/file1.json');
      });
    });

    describe('getExtension', () => {
      test('gets the extension of a file', () => {
        expect(tree.hal.getExtension('/some/path/file1.json')).toEqual('.json');
      });

      test('gets the extension of a file with no extension', () => {
        expect(tree.hal.getExtension('/some/path/file1')).toEqual('');
      });

      test('gets the extension of a file with multiple dots', () => {
        expect(tree.hal.getExtension('/some/path/file1.json.txt')).toEqual('.txt');
      });
    });

    describe('getBaseName', () => {
      test('gets the base name of a file', () => {
        expect(tree.hal.getBaseName('/some/path/file1.json')).toEqual('file1.json');
      });

      test('gets the base name of a file omitting a matching suffix, if supplied', () => {
        expect(tree.hal.getBaseName('/some/path/file1.json', '.json')).toEqual('file1');
      });

      test('gets the base name of a file with no extension', () => {
        expect(tree.hal.getBaseName('/some/path/file1')).toEqual('file1');
      });

      test('gets the full base name of if supplied suffix does not match the file suffix', () => {
        expect(tree.hal.getBaseName('/some/path/file1.txt', '.json')).toEqual('file1.txt');
      });

      test('gets the base name of a file with multiple dots', () => {
        expect(tree.hal.getBaseName('/some/path/file1.json.txt')).toEqual('file1.json.txt');
      });
    });

    describe('joinPaths', () => {
      test('joins paths', () => {
        expect(tree.hal.joinPaths('some', 'path', 'file1.json')).toEqual('some/path/file1.json');
      });
    });

    describe('getItem', () => {
      test('gets an item that exists', () => {
        expect(tree.hal.getItem('/prefix/some/path/file1.json')).toSucceedAndSatisfy((item) => {
          expect(item.absolutePath).toEqual('/prefix/some/path/file1.json');
          expect(item.name).toEqual('file1.json');
          expect(item.type).toEqual('file');
          if (item.type === 'file') {
            expect(item.getContents()).toSucceedWith({ helloMyNameIs: 'file1' });
          }
        });
      });

      test('fails to get an item that does not exist', () => {
        expect(tree.hal.getItem('/prefix/some/path/file4.json')).toFailWith(/not found/i);
      });
    });

    describe('getFileContents', () => {
      test('gets the contents of a file', () => {
        expect(tree.hal.getFileContents('/prefix/some/path/file1.json')).toSucceedWith(
          JSON.stringify({ helloMyNameIs: 'file1' })
        );
      });

      test('fails to get the contents of a directory', () => {
        expect(tree.hal.getFileContents('/prefix/some/path')).toFailWith(/not a file/i);
      });

      test('fails to get the contents of a file that does not exist', () => {
        expect(tree.hal.getFileContents('/prefix/some/path/file4.json')).toFailWith(/not found/i);
      });
    });

    describe('getChildren', () => {
      test('gets the children of a directory', () => {
        expect(tree.hal.getChildren('/prefix/some/path')).toSucceedAndSatisfy((children) => {
          expect(children.length).toEqual(3);
          expect(children.map((c) => c.name).sort()).toEqual(['below', 'file1.json', 'file3.json']);
        });
      });

      test('fails to get the children of a file', () => {
        expect(tree.hal.getChildren('/prefix/some/path/file1.json')).toFailWith(/not a directory/i);
      });

      test('fails to get the children of a directory that does not exist', () => {
        expect(tree.hal.getChildren('/prefix/some/path/does-not-exist')).toFailWith(/not found/i);
      });
    });
  });
});
