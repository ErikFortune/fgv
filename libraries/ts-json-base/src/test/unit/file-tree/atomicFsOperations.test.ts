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
import fs from 'fs';
import os from 'os';
import path from 'path';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  UNKNOWN_ERRNO,
  captureFsResult,
  defaultAtomicFsOperations
} from '../../../packlets/file-tree/fs-atomic/atomicFsOperations';

/**
 * The seam itself: that each operation reaches the real filesystem, and that a
 * failure arrives as a `Result` carrying the `errno` the protocol classifies on.
 */

/**
 * A descriptor number that is syntactically valid but not open, so the failure
 * comes back from the kernel as `EBADF` rather than from Node's own argument
 * validation as `ERR_OUT_OF_RANGE`. A negative number would test the latter,
 * which says nothing about how a real filesystem failure is reported.
 */
const CLOSED_FD: number = 9999;

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-atomic-ops-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('defaultAtomicFsOperations — succeeding against the real filesystem', () => {
  test('creates, writes, flushes, renames and removes a file', () => {
    const source = path.join(root, 'source');
    const target = path.join(root, 'target');

    const opened = defaultAtomicFsOperations.openExclusive(source, 0o600);
    expect(opened).toSucceed();
    const fd = opened.orThrow();

    expect(defaultAtomicFsOperations.write(fd, new TextEncoder().encode('payload'), 0)).toSucceedWith(7);
    expect(defaultAtomicFsOperations.fchmod(fd, 0o640)).toSucceedWith(fd);
    expect(defaultAtomicFsOperations.fsync(fd)).toSucceedWith(fd);
    expect(defaultAtomicFsOperations.close(fd)).toSucceedWith(fd);
    expect(defaultAtomicFsOperations.rename(source, target)).toSucceedWith(target);

    expect(fs.readFileSync(target, 'utf8')).toBe('payload');
    expect(defaultAtomicFsOperations.unlink(target)).toSucceedWith(target);
    expect(fs.existsSync(target)).toBe(false);
  });

  test('opens and flushes a directory', () => {
    const opened = defaultAtomicFsOperations.openDirectory(root);
    expect(opened).toSucceed();
    const fd = opened.orThrow();
    expect(defaultAtomicFsOperations.fsync(fd)).toSucceedWith(fd);
    expect(defaultAtomicFsOperations.close(fd)).toSucceedWith(fd);
  });

  test('reports on a file, a directory and a link without following the link', () => {
    const file = path.join(root, 'plain');
    fs.writeFileSync(file, 'x', { mode: 0o640 });
    fs.chmodSync(file, 0o640);
    fs.symlinkSync(file, path.join(root, 'link'));

    expect(defaultAtomicFsOperations.lstat(file)).toSucceedWith({
      isFile: true,
      isDirectory: false,
      isSymbolicLink: false,
      permissions: 0o640
    });
    expect(defaultAtomicFsOperations.lstat(root)).toSucceedAndSatisfy((stats) => {
      expect(stats.isDirectory).toBe(true);
      expect(stats.isFile).toBe(false);
    });
    expect(defaultAtomicFsOperations.lstat(path.join(root, 'link'))).toSucceedAndSatisfy((stats) => {
      expect(stats.isSymbolicLink).toBe(true);
      expect(stats.isFile).toBe(false);
    });
  });

  test('lists a directory', () => {
    fs.writeFileSync(path.join(root, 'one'), 'x');
    fs.writeFileSync(path.join(root, 'two'), 'x');
    expect(defaultAtomicFsOperations.readDirectory(root)).toSucceedAndSatisfy((names) => {
      expect([...names].sort()).toEqual(['one', 'two']);
    });
  });

  test('reports the filesystem type as a plain number, not a bigint', () => {
    expect(defaultAtomicFsOperations.filesystemType(root)).toSucceedAndSatisfy((type) => {
      // A bigint here would silently fail every `===` comparison in the
      // qualification table, which is the sort of native-boundary coercion that
      // reads as a passing test and behaves as an unqualified root.
      expect(typeof type).toBe('number');
      expect(Number.isInteger(type)).toBe(true);
    });
  });

  test('generates distinct reserved-shape tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const token = defaultAtomicFsOperations.generateTemporaryToken();
      expect(token).toMatch(/^[0-9a-f]{24}$/);
      tokens.add(token);
    }
    expect(tokens.size).toBe(50);
  });
});

describe('defaultAtomicFsOperations — surfacing errno rather than throwing', () => {
  test('exclusive create refuses an existing file with EEXIST', () => {
    const existing = path.join(root, 'taken');
    fs.writeFileSync(existing, 'x');
    const opened = defaultAtomicFsOperations.openExclusive(existing, 0o600);
    expect(opened).toFail();
    expect(opened.detail).toBe('EEXIST');
    expect(fs.readFileSync(existing, 'utf8')).toBe('x');
  });

  test.each([
    ['openExclusive', () => defaultAtomicFsOperations.openExclusive(path.join(root, 'no', 'x'), 0o600)],
    ['openDirectory', () => defaultAtomicFsOperations.openDirectory(path.join(root, 'absent'))],
    ['rename', () => defaultAtomicFsOperations.rename(path.join(root, 'absent'), path.join(root, 'b'))],
    ['unlink', () => defaultAtomicFsOperations.unlink(path.join(root, 'absent'))],
    ['lstat', () => defaultAtomicFsOperations.lstat(path.join(root, 'absent'))],
    ['readDirectory', () => defaultAtomicFsOperations.readDirectory(path.join(root, 'absent'))],
    ['filesystemType', () => defaultAtomicFsOperations.filesystemType(path.join(root, 'absent'))]
  ])('%s reports ENOENT for a path that is not there', (__name, operation) => {
    const result = operation();
    expect(result).toFail();
    expect(result.detail).toBe('ENOENT');
  });

  test.each([
    ['write', () => defaultAtomicFsOperations.write(CLOSED_FD, new Uint8Array([1]), 0)],
    ['fsync', () => defaultAtomicFsOperations.fsync(CLOSED_FD)],
    ['fchmod', () => defaultAtomicFsOperations.fchmod(CLOSED_FD, 0o600)],
    ['close', () => defaultAtomicFsOperations.close(CLOSED_FD)]
  ])('%s reports EBADF for a descriptor that is not open', (__name, operation) => {
    const result = operation();
    expect(result).toFail();
    expect(result.detail).toBe('EBADF');
  });
});

describe('captureFsResult', () => {
  test('passes a value through', () => {
    expect(captureFsResult(() => 42)).toSucceedWith(42);
  });

  test('reports an Error that carries no errno as UNKNOWN', () => {
    const result = captureFsResult(() => {
      throw new Error('no code on this one');
    });
    expect(result).toFailWith(/no code on this one/);
    expect(result.detail).toBe(UNKNOWN_ERRNO);
  });

  test('reports an Error whose code is not a string as UNKNOWN', () => {
    const result = captureFsResult(() => {
      const error = new Error('numeric code');
      Object.assign(error, { code: 17 });
      throw error;
    });
    expect(result).toFailWith(/numeric code/);
    expect(result.detail).toBe(UNKNOWN_ERRNO);
  });

  test('reports a thrown value that is not an Error at all', () => {
    const result = captureFsResult(() => {
      // eslint-disable-next-line no-throw-literal
      throw 'a bare string';
    });
    expect(result).toFailWith(/a bare string/);
    expect(result.detail).toBe(UNKNOWN_ERRNO);
  });
});
