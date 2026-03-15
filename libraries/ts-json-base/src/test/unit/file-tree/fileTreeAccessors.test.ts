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

import {
  FsFileTreeAccessors,
  InMemoryTreeAccessors,
  isMutableAccessors,
  isMutableDirectoryItem,
  isMutableFileItem,
  isPersistentAccessors
} from '../../../packlets/file-tree';

describe('isMutableAccessors', () => {
  it('returns true for FsFileTreeAccessors (always implements IMutableFileTreeAccessors)', () => {
    const accessors = new FsFileTreeAccessors();
    expect(isMutableAccessors(accessors)).toBe(true);
  });

  it('returns true for InMemoryTreeAccessors (always implements IMutableFileTreeAccessors)', () => {
    const accessors = InMemoryTreeAccessors.create([]).orThrow();
    expect(isMutableAccessors(accessors)).toBe(true);
  });

  it('returns true for FsFileTreeAccessors with mutable: true', () => {
    const accessors = new FsFileTreeAccessors({ mutable: true });
    expect(isMutableAccessors(accessors)).toBe(true);
  });

  it('returns true for InMemoryTreeAccessors with mutable: true', () => {
    const accessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
    expect(isMutableAccessors(accessors)).toBe(true);
  });
});

describe('isPersistentAccessors', () => {
  it('returns false for FsFileTreeAccessors (does not implement IPersistentFileTreeAccessors)', () => {
    const accessors = new FsFileTreeAccessors();
    expect(isPersistentAccessors(accessors)).toBe(false);
  });

  it('returns false for InMemoryTreeAccessors (does not implement IPersistentFileTreeAccessors)', () => {
    const accessors = InMemoryTreeAccessors.create([]).orThrow();
    expect(isPersistentAccessors(accessors)).toBe(false);
  });
});

describe('isMutableFileItem', () => {
  it('returns true for FileItem from mutable accessors', () => {
    const accessors = InMemoryTreeAccessors.create([{ path: '/test.json', contents: { key: 'value' } }], {
      mutable: true
    }).orThrow();
    const item = accessors.getItem('/test.json').orThrow();
    expect(isMutableFileItem(item)).toBe(true);
  });

  it('returns false for a plain object that lacks mutation methods', () => {
    const item = {
      type: 'file' as const,
      absolutePath: '/test',
      name: 'test',
      baseName: 'test',
      extension: '',
      contentType: undefined,
      getContents: () => ({} as never),
      getRawContents: () => ({} as never)
    };
    expect(isMutableFileItem(item)).toBe(false);
  });
});

describe('isMutableDirectoryItem', () => {
  it('returns true for DirectoryItem from mutable accessors', () => {
    const accessors = InMemoryTreeAccessors.create([{ path: '/data/test.json', contents: {} }], {
      mutable: true
    }).orThrow();
    const item = accessors.getItem('/data').orThrow();
    expect(isMutableDirectoryItem(item)).toBe(true);
  });

  it('returns false for a plain object that lacks mutation methods', () => {
    const item = {
      type: 'directory' as const,
      absolutePath: '/test',
      name: 'test',
      getChildren: () => ({} as never)
    };
    expect(isMutableDirectoryItem(item)).toBe(false);
  });
});
