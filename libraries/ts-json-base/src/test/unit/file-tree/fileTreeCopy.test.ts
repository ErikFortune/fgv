/*
 * Copyright (c) 2026 Erik Fortune
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
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fail, succeed } from '@fgv/ts-utils';
import {
  DirectoryItem,
  FileItem,
  FsFileTreeAccessors,
  IFileTreeAccessors,
  IFileTreeDirectoryItem,
  IFileTreeFileItem,
  IMutableFileTreeDirectoryItem,
  InMemoryTreeAccessors,
  copyContentsInto,
  copyItemInto,
  isMutableBinaryDirectoryItem
} from '../../../packlets/file-tree';

/**
 * Bytes that are NOT valid UTF-8 — a PNG-like payload with a lone continuation byte, a
 * NUL, and a trailing 0xFF. A lenient decode replaces bytes with U+FFFD; a strict decode
 * fails. This is the consumer's SQLite case in miniature.
 */
const BINARY_PAYLOAD: Uint8Array = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x1a, 0x0a, 0xff]);

/**
 * Valid UTF-8 that nonetheless does NOT survive a text round trip: `TextDecoder` strips a
 * leading BOM and `TextEncoder` does not put it back. A strict decode alone would have
 * called this text and silently dropped three bytes.
 */
const BOM_TEXT: Uint8Array = new Uint8Array([0xef, 0xbb, 0xbf, 0x68, 0x69]);

/** Ordinary UTF-8 text, including a multi-byte character. */
const PLAIN_TEXT: string = 'héllo\nworld\n';

/**
 * Minimal accessors implementing only the required read surface — no mutation, no binary
 * capability. Used to build a source whose store cannot produce bytes.
 */
const nonBinaryAccessors: IFileTreeAccessors = {
  resolveAbsolutePath: (...paths: string[]) => paths.join('/'),
  getExtension: () => '.txt',
  getBaseName: () => 'a.txt',
  joinPaths: (...paths: string[]) => paths.join('/'),
  getItem: () => ({} as never),
  getFileContents: () => succeed('hi'),
  getFileContentType: () => succeed(undefined),
  getChildren: () => ({} as never)
};

describe('FileTree copy', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'copy-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  /**
   * A filesystem-backed directory — byte-readable AND byte-writable.
   */
  function fsDirectory(name: string, mutable: boolean = true): IMutableFileTreeDirectoryItem {
    const root: string = path.join(tempRoot, name);
    fs.mkdirSync(root, { recursive: true });
    return DirectoryItem.create('.', new FsFileTreeAccessors({ prefix: root, mutable })).orThrow();
  }

  /**
   * An in-memory directory — byte-readable but text-persisting, so a byte write could not
   * round-trip and `isMutableBinaryAccessors` is false for it.
   */
  function inMemoryDirectory(
    files: { path: string; contents: string | Uint8Array | object }[] = [],
    mutable: boolean = true
  ): IMutableFileTreeDirectoryItem {
    const accessors = InMemoryTreeAccessors.create([{ path: '/root/.keep', contents: '' }, ...files], {
      mutable
    }).orThrow();
    return DirectoryItem.create('/root', accessors).orThrow();
  }

  function readFileBytes(dir: IMutableFileTreeDirectoryItem, relativePath: string): Uint8Array {
    return new Uint8Array(fs.readFileSync(path.join(dir.absolutePath, relativePath)));
  }

  describe('isMutableBinaryDirectoryItem', () => {
    it('returns true for a DirectoryItem regardless of what backs it', () => {
      expect(isMutableBinaryDirectoryItem(fsDirectory('fs'))).toBe(true);
      expect(isMutableBinaryDirectoryItem(inMemoryDirectory())).toBe(true);
    });

    it('returns false for a directory item that does not implement the capability', () => {
      const plainDirectory: IFileTreeDirectoryItem = {
        type: 'directory',
        absolutePath: '/d',
        name: 'd',
        getChildren: () => succeed([])
      };
      expect(isMutableBinaryDirectoryItem(plainDirectory)).toBe(false);
    });

    it('returns false for a file item', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/a.txt', contents: 'hi' }]).orThrow();
      expect(isMutableBinaryDirectoryItem(accessors.getItem('/a.txt').orThrow())).toBe(false);
    });
  });

  describe('DirectoryItem.canCreateChildFileBytes', () => {
    it('is true for a byte-persisting store and false for a text-persisting one', () => {
      // The guard above is true for both; only this answers for the backing store.
      expect((fsDirectory('fs') as DirectoryItem).canCreateChildFileBytes()).toBe(true);
      expect((inMemoryDirectory() as DirectoryItem).canCreateChildFileBytes()).toBe(false);
    });
  });

  describe('DirectoryItem.createChildFileBytes', () => {
    it('writes bytes verbatim and returns the new file item', () => {
      const dir = fsDirectory('fs') as DirectoryItem;
      expect(dir.createChildFileBytes('img.png', BINARY_PAYLOAD)).toSucceedAndSatisfy((item) => {
        expect(item.name).toBe('img.png');
      });
      expect(readFileBytes(dir, 'img.png')).toEqual(BINARY_PAYLOAD);
    });

    it('fails without creating a placeholder when the store persists text', () => {
      const dir = inMemoryDirectory() as DirectoryItem;
      expect(dir.createChildFileBytes('img.png', BINARY_PAYLOAD)).toFailWith(
        /raw byte writes not supported/i
      );
      // The whole point of the byte-native create: nothing was left behind.
      expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children.map((c) => c.name)).not.toContain('img.png');
      });
    });

    it('reports a write failure from a byte-capable but immutable store', () => {
      const dir = fsDirectory('fs', false) as DirectoryItem;
      expect(dir.canCreateChildFileBytes()).toBe(true);
      expect(dir.createChildFileBytes('img.png', BINARY_PAYLOAD)).toFailWith(/mutability is disabled/i);
    });
  });

  describe('copyItemInto', () => {
    describe('byte-capable source, byte-capable destination', () => {
      it('copies a file byte-for-byte, including bytes that are not valid UTF-8', () => {
        const source = fsDirectory('src');
        const destination = fsDirectory('dst');
        fs.writeFileSync(path.join(source.absolutePath, 'db.sqlite'), BINARY_PAYLOAD);

        const file = source.getChildren().orThrow()[0];
        expect(copyItemInto(file, destination)).toSucceedWith({
          filesCopiedAsBytes: 1,
          filesCopiedAsText: 0,
          directoriesCreated: 0,
          skipped: []
        });
        expect(readFileBytes(destination, 'db.sqlite')).toEqual(BINARY_PAYLOAD);
      });

      it('preserves a BOM that a text-mediated copy would drop', () => {
        const source = fsDirectory('src');
        const destination = fsDirectory('dst');
        fs.writeFileSync(path.join(source.absolutePath, 'bom.txt'), BOM_TEXT);

        expect(copyItemInto(source.getChildren().orThrow()[0], destination)).toSucceedAndSatisfy((report) => {
          expect(report.filesCopiedAsBytes).toBe(1);
        });
        expect(readFileBytes(destination, 'bom.txt')).toEqual(BOM_TEXT);
      });

      it('copies a directory tree, counting every directory it creates', () => {
        const source = fsDirectory('src');
        const destination = fsDirectory('dst');
        fs.mkdirSync(path.join(source.absolutePath, 'tree/nested'), { recursive: true });
        fs.writeFileSync(path.join(source.absolutePath, 'tree/a.txt'), PLAIN_TEXT);
        fs.writeFileSync(path.join(source.absolutePath, 'tree/nested/b.bin'), BINARY_PAYLOAD);

        const tree = source.getChildren().orThrow()[0];
        expect(copyItemInto(tree, destination)).toSucceedWith({
          filesCopiedAsBytes: 2,
          filesCopiedAsText: 0,
          directoriesCreated: 2,
          skipped: []
        });
        expect(readFileBytes(destination, 'tree/nested/b.bin')).toEqual(BINARY_PAYLOAD);
        expect(fs.readFileSync(path.join(destination.absolutePath, 'tree/a.txt'), 'utf8')).toBe(PLAIN_TEXT);
      });

      it('overwrites an existing destination file, matching createChildFile', () => {
        const source = fsDirectory('src');
        const destination = fsDirectory('dst');
        fs.writeFileSync(path.join(source.absolutePath, 'a.txt'), 'new');
        fs.writeFileSync(path.join(destination.absolutePath, 'a.txt'), 'old');

        expect(copyItemInto(source.getChildren().orThrow()[0], destination)).toSucceed();
        expect(fs.readFileSync(path.join(destination.absolutePath, 'a.txt'), 'utf8')).toBe('new');
      });
    });

    describe('byte-capable source, text-persisting destination', () => {
      it('copies text as text once it has verified the bytes round-trip', () => {
        const source = fsDirectory('src');
        const destination = inMemoryDirectory();
        fs.writeFileSync(path.join(source.absolutePath, 'a.txt'), PLAIN_TEXT);

        expect(copyItemInto(source.getChildren().orThrow()[0], destination)).toSucceedWith({
          filesCopiedAsBytes: 0,
          filesCopiedAsText: 1,
          directoriesCreated: 0,
          skipped: []
        });
        expect(destination.getChildren()).toSucceedAndSatisfy((children) => {
          const copied = children.find((c) => c.name === 'a.txt') as IFileTreeFileItem;
          expect(copied.getRawContents()).toSucceedWith(PLAIN_TEXT);
        });
      });

      it('fails by default on bytes that are not valid UTF-8, naming the source path', () => {
        const source = fsDirectory('src');
        const destination = inMemoryDirectory();
        fs.writeFileSync(path.join(source.absolutePath, 'db.sqlite'), BINARY_PAYLOAD);

        expect(copyItemInto(source.getChildren().orThrow()[0], destination)).toFailWith(
          /db\.sqlite: cannot copy faithfully to .*db\.sqlite: the destination store persists text/i
        );
      });

      it('fails on a BOM-prefixed file, which decodes cleanly but does not re-encode', () => {
        // The case a strict decode alone would have waved through.
        const source = fsDirectory('src');
        const destination = inMemoryDirectory();
        fs.writeFileSync(path.join(source.absolutePath, 'bom.txt'), BOM_TEXT);

        expect(copyItemInto(source.getChildren().orThrow()[0], destination)).toFailWith(
          /bom\.txt: cannot copy faithfully/i
        );
        expect(destination.getChildren()).toSucceedAndSatisfy((children) => {
          expect(children.map((c) => c.name)).not.toContain('bom.txt');
        });
      });

      it('skips only the unfaithful files under skip, and reports each with both paths', () => {
        const source = fsDirectory('src');
        const destination = inMemoryDirectory();
        fs.writeFileSync(path.join(source.absolutePath, 'a.txt'), PLAIN_TEXT);
        fs.writeFileSync(path.join(source.absolutePath, 'db.sqlite'), BINARY_PAYLOAD);
        fs.writeFileSync(path.join(source.absolutePath, 'bom.txt'), BOM_TEXT);

        expect(copyContentsInto(source, destination, { onUnfaithfulFile: 'skip' })).toSucceedAndSatisfy(
          (report) => {
            expect(report.filesCopiedAsText).toBe(1);
            expect(report.filesCopiedAsBytes).toBe(0);
            expect(report.skipped).toHaveLength(2);
            expect(report.skipped.map((s) => path.basename(s.sourcePath)).sort()).toEqual([
              'bom.txt',
              'db.sqlite'
            ]);
            for (const skipped of report.skipped) {
              expect(skipped.destinationPath).toBe(
                `${destination.absolutePath}/${path.basename(skipped.sourcePath)}`
              );
              expect(skipped.message).toContain(skipped.sourcePath);
              expect(skipped.message).toContain(skipped.destinationPath);
            }
          }
        );
      });

      it('skips a single unfaithful file, reporting it rather than failing', () => {
        const source = fsDirectory('src');
        const destination = inMemoryDirectory();
        fs.writeFileSync(path.join(source.absolutePath, 'db.sqlite'), BINARY_PAYLOAD);

        expect(
          copyItemInto(source.getChildren().orThrow()[0], destination, { onUnfaithfulFile: 'skip' })
        ).toSucceedAndSatisfy((report) => {
          expect(report.filesCopiedAsBytes).toBe(0);
          expect(report.filesCopiedAsText).toBe(0);
          expect(report.skipped).toHaveLength(1);
          expect(report.skipped[0].sourcePath).toContain('db.sqlite');
        });
      });

      it('does not swallow an unrelated write failure under skip', () => {
        // `skip` concerns unfaithful bytes and nothing else. A write that fails for its own
        // reasons must still fail, or the mode would quietly widen into "ignore problems".
        const source = fsDirectory('src');
        const destination = inMemoryDirectory([], false);
        fs.writeFileSync(path.join(source.absolutePath, 'a.txt'), PLAIN_TEXT);

        expect(
          copyItemInto(source.getChildren().orThrow()[0], destination, { onUnfaithfulFile: 'skip' })
        ).toFailWith(/a\.txt:.*not mutable|mutability is disabled/i);
      });

      it('treats an options bag that omits the behavior as the fail default', () => {
        const source = fsDirectory('src');
        const destination = inMemoryDirectory();
        fs.writeFileSync(path.join(source.absolutePath, 'db.sqlite'), BINARY_PAYLOAD);

        expect(copyItemInto(source.getChildren().orThrow()[0], destination, {})).toFailWith(
          /db\.sqlite: cannot copy faithfully/i
        );
      });

      it('reports a text write failure from an immutable destination', () => {
        const source = fsDirectory('src');
        const destination = inMemoryDirectory([], false);
        fs.writeFileSync(path.join(source.absolutePath, 'a.txt'), PLAIN_TEXT);

        expect(copyItemInto(source.getChildren().orThrow()[0], destination)).toFailWith(
          /a\.txt:.*not mutable|mutability is disabled/i
        );
      });
    });

    describe('text-persisting source, byte-capable destination', () => {
      it('copies through the byte path, because the in-memory store is byte-readable', () => {
        const source = inMemoryDirectory([{ path: '/root/a.txt', contents: PLAIN_TEXT }]);
        const destination = fsDirectory('dst');

        expect(copyContentsInto(source, destination)).toSucceedAndSatisfy((report) => {
          // `.keep` plus `a.txt` — both readable as bytes, so both take the byte path.
          expect(report.filesCopiedAsBytes).toBe(2);
          expect(report.filesCopiedAsText).toBe(0);
        });
        expect(fs.readFileSync(path.join(destination.absolutePath, 'a.txt'), 'utf8')).toBe(PLAIN_TEXT);
      });
    });

    describe('text-persisting source, text-persisting destination', () => {
      it('copies a nested tree as verified text', () => {
        const source = inMemoryDirectory([
          { path: '/root/tree/a.txt', contents: PLAIN_TEXT },
          { path: '/root/tree/nested/b.json', contents: { k: 1 } }
        ]);
        const destination = inMemoryDirectory();

        expect(copyContentsInto(source, destination)).toSucceedAndSatisfy((report) => {
          expect(report.filesCopiedAsText).toBe(3);
          expect(report.filesCopiedAsBytes).toBe(0);
          expect(report.directoriesCreated).toBe(2);
          expect(report.skipped).toEqual([]);
        });
      });

      it('carries byte-seeded in-memory contents that are not valid UTF-8 no further than the check', () => {
        const source = inMemoryDirectory([{ path: '/root/db.sqlite', contents: BINARY_PAYLOAD }]);
        const destination = inMemoryDirectory();

        expect(copyContentsInto(source, destination)).toFailWith(/db\.sqlite: cannot copy faithfully/i);
      });
    });

    describe('sources that cannot produce bytes', () => {
      it('fails rather than falling back to a text read', () => {
        // A text read would produce a file whose faithfulness nothing had established.
        const source = FileItem.create('/a.txt', nonBinaryAccessors).orThrow();
        expect(copyItemInto(source, fsDirectory('dst'))).toFailWith(
          /a\.txt: cannot copy to .*: .*raw byte access not supported/i
        );
      });

      it('fails for a file item that does not implement the byte capability at all', () => {
        const source: IFileTreeFileItem = {
          type: 'file',
          absolutePath: '/a.txt',
          name: 'a.txt',
          baseName: 'a',
          extension: '.txt',
          contentType: undefined,
          getContents: () => ({} as never),
          getRawContents: () => succeed('hi')
        };
        expect(copyItemInto(source, fsDirectory('dst'))).toFailWith(
          /a\.txt: cannot copy to .*: not a binary file item/i
        );
      });
    });

    describe('failures around the walk itself', () => {
      it('reports a source directory whose children cannot be listed, naming it', () => {
        const source: IFileTreeDirectoryItem = {
          type: 'directory',
          absolutePath: '/unreadable',
          name: 'unreadable',
          getChildren: () => fail('permission denied')
        };
        expect(copyItemInto(source, fsDirectory('dst'))).toFailWith(/\/unreadable: permission denied/i);
      });

      it('names every unfaithful file rather than stopping at the first', () => {
        // A copy is not atomic; aggregating is what makes the diagnosis actionable.
        const source = fsDirectory('src');
        const destination = inMemoryDirectory();
        fs.writeFileSync(path.join(source.absolutePath, 'one.bin'), BINARY_PAYLOAD);
        fs.writeFileSync(path.join(source.absolutePath, 'two.bin'), BINARY_PAYLOAD);
        fs.writeFileSync(path.join(source.absolutePath, 'ok.txt'), PLAIN_TEXT);

        expect(copyContentsInto(source, destination)).toFailWith(/one\.bin[\s\S]*two\.bin/i);
        // ...and what did succeed is still there. There is no rollback.
        expect(destination.getChildren()).toSucceedAndSatisfy((children) => {
          expect(children.map((c) => c.name)).toContain('ok.txt');
        });
      });

      it('gives up on a directory that contains itself, rather than recursing forever', () => {
        const loop: IFileTreeDirectoryItem = {
          type: 'directory',
          absolutePath: '/loop',
          name: 'loop',
          getChildren: () => succeed([loop])
        };
        expect(copyItemInto(loop, fsDirectory('dst'))).toFailWith(
          /\/loop: copy exceeded 128 levels of nesting/i
        );
      });

      it('reports a destination that cannot create the subdirectory, naming the source', () => {
        const source = inMemoryDirectory([{ path: '/root/tree/a.txt', contents: PLAIN_TEXT }]);
        const destination = fsDirectory('dst', false);
        const tree = source
          .getChildren()
          .orThrow()
          .find((c) => c.name === 'tree')!;

        expect(copyItemInto(tree, destination)).toFailWith(/tree:.*mutability is disabled/i);
      });
    });
  });

  describe('copyContentsInto', () => {
    it('reproduces the source directory contents, not the source directory itself', () => {
      const source = fsDirectory('src');
      const destination = fsDirectory('dst');
      fs.mkdirSync(path.join(source.absolutePath, 'nested'), { recursive: true });
      fs.writeFileSync(path.join(source.absolutePath, 'nested/a.txt'), PLAIN_TEXT);

      expect(copyContentsInto(source, destination)).toSucceedAndSatisfy((report) => {
        expect(report.directoriesCreated).toBe(1);
        expect(report.filesCopiedAsBytes).toBe(1);
      });
      expect(fs.existsSync(path.join(destination.absolutePath, 'nested/a.txt'))).toBe(true);
      expect(fs.existsSync(path.join(destination.absolutePath, 'src'))).toBe(false);
    });

    it('succeeds with an empty report for an empty source', () => {
      expect(copyContentsInto(fsDirectory('src'), fsDirectory('dst'))).toSucceedWith({
        filesCopiedAsBytes: 0,
        filesCopiedAsText: 0,
        directoriesCreated: 0,
        skipped: []
      });
    });
  });
});
