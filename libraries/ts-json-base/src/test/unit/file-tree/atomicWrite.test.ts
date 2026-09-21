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

import '@fgv/ts-utils-jest';
import {
  DirectoryItem,
  FsFileTreeAccessors,
  InMemoryTreeAccessors,
  isAtomicAccessors,
  isAtomicDirectoryItem
} from '../../../packlets/file-tree';

describe('isAtomicAccessors', () => {
  test('returns true for a mutable InMemoryTreeAccessors', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
    expect(isAtomicAccessors(accessors)).toBe(true);
  });

  test('returns false for FsFileTreeAccessors (F1 does not implement atomic writes on Node)', () => {
    const accessors = new FsFileTreeAccessors();
    expect(isAtomicAccessors(accessors)).toBe(false);
  });
});

describe('InMemoryTreeAccessors.getAtomicWriteCapabilities', () => {
  test('advertises session, and only session, for a mutable tree', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
    expect(accessors.getAtomicWriteCapabilities('/')).toSucceedAndSatisfy((caps) => {
      expect(caps.atomicReplace).toBe(true);
      expect(caps.guarantees).toEqual(['session']);
      expect(caps.guarantees).not.toContain('process-crash');
    });
  });

  test('reports no atomic replacement for a non-mutable tree', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: false }).orThrow();
    expect(accessors.getAtomicWriteCapabilities('/')).toSucceedAndSatisfy((caps) => {
      expect(caps.atomicReplace).toBe(false);
      expect(caps.guarantees).toEqual([]);
    });
  });

  test('fails when the directory does not exist', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
    expect(accessors.getAtomicWriteCapabilities('/nope')).toFailWith(/not found/i);
  });

  test('fails when the path is a file, not a directory', () => {
    const accessors = InMemoryTreeAccessors.create([{ path: '/f.txt', contents: 'x' }], {
      mutable: true
    }).orThrow();
    expect(accessors.getAtomicWriteCapabilities('/f.txt')).toFailWith(/not a directory/i);
  });
});

describe('InMemoryTreeAccessors.writeFileAtomically', () => {
  test('creates a new file and reports replaced: false', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
    expect(accessors.writeFileAtomically('/new.txt', 'hello', { guarantee: 'session' })).toSucceedAndSatisfy(
      (receipt) => {
        expect(receipt.guarantee).toBe('session');
        expect(receipt.replaced).toBe(false);
      }
    );
    expect(accessors.getFileContents('/new.txt')).toSucceedWith('hello');
  });

  test('replaces an existing file and reports replaced: true', () => {
    const accessors = InMemoryTreeAccessors.create([{ path: '/existing.txt', contents: 'old' }], {
      mutable: true
    }).orThrow();
    expect(
      accessors.writeFileAtomically('/existing.txt', 'new', { guarantee: 'session' })
    ).toSucceedAndSatisfy((receipt) => {
      expect(receipt.replaced).toBe(true);
    });
    expect(accessors.getFileContents('/existing.txt')).toSucceedWith('new');
  });

  test('fails before mutating anything when a stronger guarantee than session is requested', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
    expect(
      accessors.writeFileAtomically('/unwritten.txt', 'hello', { guarantee: 'process-crash' })
    ).toFailWithDetail(/exceeds this store's 'session' capability/i, {
      code: 'unsupported',
      stage: 'validate',
      visibility: 'unchanged'
    });
    expect(accessors.getItem('/unwritten.txt')).toFailWith(/not found/i);
  });

  test('fails with not-writable when the tree is not mutable', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: false }).orThrow();
    expect(accessors.writeFileAtomically('/blocked.txt', 'hello', { guarantee: 'session' })).toFailWithDetail(
      /mutability is disabled/i,
      {
        code: 'not-writable',
        stage: 'validate',
        visibility: 'unchanged'
      }
    );
  });

  test('fails validation, before mutating anything, when the destination path collides with an existing directory', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
    accessors.createDirectory('/collision').orThrow();
    expect(accessors.writeFileAtomically('/collision', 'hello', { guarantee: 'session' })).toFailWithDetail(
      /not a file/i,
      {
        code: 'not-writable',
        stage: 'validate',
        visibility: 'unchanged'
      }
    );
    expect(accessors.getItem('/collision')).toSucceedAndSatisfy((item) => {
      expect(item.type).toBe('directory');
    });
  });

  test('reports the destination unchanged when an ancestor path segment names an existing file', () => {
    // `visibility` is scoped to the DESTINATION path, so an ancestor collision is
    // `unchanged` even though the parent walk may have created directories elsewhere:
    // the destination was never written, and a caller must be able to retry safely
    // rather than treat its own file as ambiguously mutated.
    const accessors = InMemoryTreeAccessors.create([{ path: '/ancestor.txt', contents: 'x' }], {
      mutable: true
    }).orThrow();
    expect(
      accessors.writeFileAtomically('/ancestor.txt/nested.txt', 'hello', { guarantee: 'session' })
    ).toFailWithDetail(/not a directory/i, {
      code: 'not-writable',
      stage: 'validate',
      visibility: 'unchanged'
    });
    // The claim the classification makes: the destination is genuinely still absent,
    // and the ancestor file itself is untouched.
    expect(accessors.getItem('/ancestor.txt/nested.txt')).toFail();
    expect(accessors.getFileContents('/ancestor.txt')).toSucceedWith('x');
  });
});

describe('DirectoryItem atomic delegation', () => {
  test('isAtomicDirectoryItem is true for any DirectoryItem regardless of backing store', () => {
    const inMemoryDir = InMemoryTreeAccessors.create([], { mutable: true }).orThrow().getItem('/').orThrow();
    expect(isAtomicDirectoryItem(inMemoryDir)).toBe(true);

    const fsAccessors = new FsFileTreeAccessors({ mutable: true });
    const fsDir = DirectoryItem.create('.', fsAccessors).orThrow();
    expect(isAtomicDirectoryItem(fsDir)).toBe(true);
  });

  test('returns false for a plain object that lacks the atomic methods', () => {
    const item = {
      type: 'directory' as const,
      absolutePath: '/test',
      name: 'test',
      getChildren: () => ({} as never)
    };
    expect(isAtomicDirectoryItem(item)).toBe(false);
  });

  test('getAtomicWriteCapabilities reflects the backing store for a mutable in-memory directory', () => {
    const dir = InMemoryTreeAccessors.create([], { mutable: true }).orThrow().getItem('/').orThrow();
    if (!isAtomicDirectoryItem(dir)) {
      throw new Error('expected an atomic directory item');
    }
    expect(dir.getAtomicWriteCapabilities()).toSucceedAndSatisfy((caps) => {
      expect(caps.atomicReplace).toBe(true);
      expect(caps.guarantees).toEqual(['session']);
    });
  });

  test('getAtomicWriteCapabilities reports no atomic replacement when the backing store lacks the capability', () => {
    const fsAccessors = new FsFileTreeAccessors({ mutable: true });
    const fsDir = DirectoryItem.create('.', fsAccessors).orThrow();
    expect(fsDir.getAtomicWriteCapabilities()).toSucceedAndSatisfy((caps) => {
      expect(caps.atomicReplace).toBe(false);
      expect(caps.guarantees).toEqual([]);
    });
  });

  test('writeChildAtomically creates a child with no native path or accessor internals visible to the caller', () => {
    // Narrow via the guard rather than casting. This is the acceptance-criterion test for
    // the whole slice, so it must not assert the thing it is meant to prove: a cast would
    // still compile and pass if DirectoryItem stopped delegating, while the guard fails
    // loudly at exactly that point — the same shape every other test in this file uses.
    const dir = InMemoryTreeAccessors.create([], { mutable: true }).orThrow().getItem('/').orThrow();
    if (!isAtomicDirectoryItem(dir)) {
      throw new Error('expected an atomic directory item');
    }

    expect(dir.writeChildAtomically('child.txt', 'contents', { guarantee: 'session' })).toSucceedAndSatisfy(
      (receipt) => {
        expect(receipt.guarantee).toBe('session');
        expect(receipt.replaced).toBe(false);
      }
    );

    expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
      expect(children.some((c) => c.name === 'child.txt')).toBe(true);
    });
  });

  test('writeChildAtomically replaces an existing child and reports replaced: true', () => {
    const accessors = InMemoryTreeAccessors.create([{ path: '/existing.txt', contents: 'old' }], {
      mutable: true
    }).orThrow();
    const dir = accessors.getItem('/').orThrow();
    if (!isAtomicDirectoryItem(dir)) {
      throw new Error('expected an atomic directory item');
    }
    expect(dir.writeChildAtomically('existing.txt', 'new', { guarantee: 'session' })).toSucceedAndSatisfy(
      (receipt) => {
        expect(receipt.replaced).toBe(true);
      }
    );
    expect(accessors.getFileContents('/existing.txt')).toSucceedWith('new');
  });

  test('rejects an empty child name before touching the backing store', () => {
    const dir = InMemoryTreeAccessors.create([], { mutable: true }).orThrow().getItem('/').orThrow();
    if (!isAtomicDirectoryItem(dir)) {
      throw new Error('expected an atomic directory item');
    }
    expect(dir.writeChildAtomically('', 'contents', { guarantee: 'session' })).toFailWithDetail(
      /not a valid child file name/i,
      { code: 'not-writable', stage: 'validate', visibility: 'unchanged' }
    );
  });

  test('rejects a child name containing a path separator', () => {
    const dir = InMemoryTreeAccessors.create([], { mutable: true }).orThrow().getItem('/').orThrow();
    if (!isAtomicDirectoryItem(dir)) {
      throw new Error('expected an atomic directory item');
    }
    expect(dir.writeChildAtomically('a/b', 'contents', { guarantee: 'session' })).toFailWithDetail(
      /not a valid child file name/i,
      { code: 'not-writable', stage: 'validate', visibility: 'unchanged' }
    );
  });

  test.each(['.', '..'])('rejects %p as a child name', (name) => {
    // Sharper than the separator cases: `path.join` NORMALIZES dot segments, so
    // `joinPaths('/a/b', '..')` is `/a` — a path outside the directory entirely. Not
    // exploitable today (the in-memory accessor preserves dot segments and the
    // filesystem one is not atomic-capable yet), but the contract is what every future
    // accessor is written against, so it must not admit a traversal.
    const dir = InMemoryTreeAccessors.create([], { mutable: true }).orThrow().getItem('/').orThrow();
    if (!isAtomicDirectoryItem(dir)) {
      throw new Error('expected an atomic directory item');
    }
    expect(dir.writeChildAtomically(name, 'contents', { guarantee: 'session' })).toFailWithDetail(
      /not a valid child file name/i,
      { code: 'not-writable', stage: 'validate', visibility: 'unchanged' }
    );
    expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
      expect(children).toHaveLength(0);
    });
  });

  test('rejects a child name containing a backslash on every platform', () => {
    // `FsFileTreeAccessors.joinPaths` is `path.join`, which treats `\` as a separator on
    // Windows. Today this is latent — that accessor is not atomic-capable, and the in-memory
    // one splits on '/' only — but F2 makes it live, so the check belongs here rather than
    // being inherited as a hole. Rejection is unconditional, not platform-sniffed: a child
    // name is a single component everywhere, so neither separator is ever legitimate.
    const dir = InMemoryTreeAccessors.create([], { mutable: true }).orThrow().getItem('/').orThrow();
    if (!isAtomicDirectoryItem(dir)) {
      throw new Error('expected an atomic directory item');
    }
    expect(dir.writeChildAtomically('a\\b', 'contents', { guarantee: 'session' })).toFailWithDetail(
      /not a valid child file name/i,
      { code: 'not-writable', stage: 'validate', visibility: 'unchanged' }
    );
    // Nothing was created under either interpretation of the name.
    expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
      expect(children).toHaveLength(0);
    });
  });

  test('fails explicitly rather than degrading when the backing store does not support atomic writes', () => {
    const fsAccessors = new FsFileTreeAccessors({ mutable: true });
    const fsDir = DirectoryItem.create('.', fsAccessors).orThrow();
    expect(fsDir.writeChildAtomically('child.txt', 'contents', { guarantee: 'session' })).toFailWithDetail(
      /atomic writes not supported/i,
      {
        code: 'unsupported',
        stage: 'validate',
        visibility: 'unchanged'
      }
    );
  });

  test('a stronger requested guarantee fails before mutating, delegated through the directory item', () => {
    const dir = InMemoryTreeAccessors.create([], { mutable: true }).orThrow().getItem('/').orThrow();
    if (!isAtomicDirectoryItem(dir)) {
      throw new Error('expected an atomic directory item');
    }
    expect(dir.writeChildAtomically('unwritten.txt', 'contents', { guarantee: 'os-crash' })).toFailWithDetail(
      /exceeds this store's 'session' capability/i,
      {
        code: 'unsupported',
        stage: 'validate',
        visibility: 'unchanged'
      }
    );
    expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
      expect(children.some((c) => c.name === 'unwritten.txt')).toBe(false);
    });
  });
});
