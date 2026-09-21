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
import { DetailedResult, succeedWithDetail } from '@fgv/ts-utils';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  cleanupAtomicTemporaries,
  commitFileAtomically,
  isReservedTemporaryName
} from '../../../packlets/file-tree/atomicFileCommit';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  IAtomicFsOperations,
  defaultAtomicFsOperations
} from '../../../packlets/file-tree/atomicFsOperations';
import { IAtomicWriteFailure, IAtomicWriteReceipt } from '../../../packlets/file-tree';
import { FaultingFsOperations } from './atomicFaultHarness';

/**
 * These tests exercise the ordering protocol directly, against a real temporary
 * directory, with individual operations made to fail. Every assertion is about
 * what a *reader* of the destination would see afterwards, because that is what
 * the `visibility` classification promises.
 *
 * Each `describe` block below names the guarantee its tests establish.
 */

const OLD: string = 'the previously accepted record\n';
const NEW: string = 'the replacement record\n';

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-atomic-commit-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function destination(name: string = 'record.json'): string {
  return path.join(root, name);
}

function withExistingFile(contents: string, mode: number = 0o600, name: string = 'record.json'): string {
  const target = destination(name);
  fs.writeFileSync(target, contents, { mode });
  fs.chmodSync(target, mode);
  return target;
}

function commit(
  ops: FaultingFsOperations,
  contents: string,
  destinationPath: string = destination()
): DetailedResult<IAtomicWriteReceipt, IAtomicWriteFailure> {
  return commitFileAtomically({
    destinationPath,
    directoryPath: path.dirname(destinationPath),
    contents,
    guarantee: 'process-crash',
    ops,
    joinPaths: (...paths: string[]) => path.join(...paths)
  });
}

/**
 * Names in the directory that this protocol reserves for itself. An empty list
 * means the protocol left nothing behind.
 */
function orphanedTemporaries(): ReadonlyArray<string> {
  return fs.readdirSync(root).filter(isReservedTemporaryName);
}

function readDestination(destinationPath: string = destination()): string | undefined {
  return fs.existsSync(destinationPath) ? fs.readFileSync(destinationPath, 'utf8') : undefined;
}

describe('commitFileAtomically — committing', () => {
  test('creates a file that did not exist and reports it as a creation', () => {
    const ops = new FaultingFsOperations();
    expect(commit(ops, NEW)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.replaced).toBe(false);
      expect(receipt.guarantee).toBe('process-crash');
    });
    expect(readDestination()).toBe(NEW);
    expect(orphanedTemporaries()).toEqual([]);
  });

  test('a file it creates is private, not world-readable', () => {
    const ops = new FaultingFsOperations();
    expect(commit(ops, NEW)).toSucceed();
    expect(fs.statSync(destination()).mode % 0o10000).toBe(0o600);
  });

  test('replaces an existing file whole and reports it as a replacement', () => {
    withExistingFile(OLD);
    const ops = new FaultingFsOperations();
    expect(commit(ops, NEW)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.replaced).toBe(true);
    });
    expect(readDestination()).toBe(NEW);
    expect(orphanedTemporaries()).toEqual([]);
  });

  test('never unlinks or truncates the destination on the way to replacing it', () => {
    // The protocol's core promise is that the old record stays authoritative
    // until one rename swaps it. An unlink-first or truncate-first implementation
    // would pass every content assertion above and still be wrong, because the
    // window it opens is only observable from another process.
    withExistingFile(OLD);
    const ops = new FaultingFsOperations();
    expect(commit(ops, NEW)).toSucceed();
    expect(ops.calls).not.toContain('unlink');
    expect(ops.callCount('rename')).toBe(1);
  });

  test('carries an existing file’s permissions onto its replacement', () => {
    withExistingFile(OLD, 0o644);
    const ops = new FaultingFsOperations();
    expect(commit(ops, NEW)).toSucceed();
    expect(fs.statSync(destination()).mode % 0o10000).toBe(0o644);
    expect(ops.callCount('fchmod')).toBe(1);
  });

  test('does not adjust permissions when the existing file is already private', () => {
    withExistingFile(OLD, 0o600);
    const ops = new FaultingFsOperations();
    expect(commit(ops, NEW)).toSucceed();
    expect(ops.callCount('fchmod')).toBe(0);
    expect(fs.statSync(destination()).mode % 0o10000).toBe(0o600);
  });

  test('commits an empty record', () => {
    const ops = new FaultingFsOperations();
    expect(commit(ops, '')).toSucceedAndSatisfy((receipt) => {
      expect(receipt.replaced).toBe(false);
    });
    expect(readDestination()).toBe('');
    expect(ops.callCount('write')).toBe(0);
  });

  test('writes the whole record even when the filesystem takes it a few bytes at a time', () => {
    const ops = new FaultingFsOperations().chunkWritesTo(4);
    expect(commit(ops, NEW)).toSucceed();
    expect(readDestination()).toBe(NEW);
    expect(ops.callCount('write')).toBeGreaterThan(1);
  });

  test('commits multi-byte UTF-8 without splitting a character', () => {
    const contents = 'naïve — 日本語 — 🚀\n';
    const ops = new FaultingFsOperations().chunkWritesTo(3);
    expect(commit(ops, contents)).toSucceed();
    expect(readDestination()).toBe(contents);
  });

  test('retries the exclusive create when the chosen temporary name is already taken', () => {
    const taken = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    fs.writeFileSync(path.join(root, `.fgv-atomic-${taken}.tmp`), 'squatter');
    const ops = new FaultingFsOperations().queueTokens(taken);
    expect(commit(ops, NEW)).toSucceed();
    expect(readDestination()).toBe(NEW);
    expect(ops.callCount('openExclusive')).toBe(2);
    // The squatter is not this write's temporary and is left exactly alone.
    expect(fs.readFileSync(path.join(root, `.fgv-atomic-${taken}.tmp`), 'utf8')).toBe('squatter');
  });

  test('gives up rather than looping when every temporary name collides', () => {
    const taken = 'bbbbbbbbbbbbbbbbbbbbbbbb';
    fs.writeFileSync(path.join(root, `.fgv-atomic-${taken}.tmp`), 'squatter');
    const ops = new FaultingFsOperations().queueTokens(taken, taken, taken);
    expect(commit(ops, NEW)).toFailWithDetail(/cannot create temporary file/i, {
      code: 'io',
      stage: 'temporary-write',
      visibility: 'unchanged'
    });
    expect(ops.callCount('openExclusive')).toBe(3);
    expect(readDestination()).toBeUndefined();
  });
});

describe('commitFileAtomically — rejecting a destination it must not replace', () => {
  test('refuses a destination that is a directory, and leaves it alone', () => {
    const target = destination('adirectory');
    fs.mkdirSync(target);
    const ops = new FaultingFsOperations();
    expect(commit(ops, NEW, target)).toFailWithDetail(/destination is a directory/i, {
      code: 'not-writable',
      stage: 'validate',
      visibility: 'unchanged'
    });
    expect(fs.statSync(target).isDirectory()).toBe(true);
    expect(orphanedTemporaries()).toEqual([]);
  });

  test('refuses a destination that is a symbolic link, without following it', () => {
    // Renaming over a symlink replaces the link, not its target. Following one
    // would let a link inside the tree redirect a committed record to a path the
    // caller never named, so the link is rejected and its target is untouched.
    const linkTarget = withExistingFile(OLD, 0o600, 'real.json');
    const link = destination('link.json');
    fs.symlinkSync(linkTarget, link);
    const ops = new FaultingFsOperations();
    expect(commit(ops, NEW, link)).toFailWithDetail(/destination is a symbolic link/i, {
      code: 'not-writable',
      stage: 'validate',
      visibility: 'unchanged'
    });
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(linkTarget, 'utf8')).toBe(OLD);
  });

  test('refuses a destination that is neither a file, a directory nor a link', () => {
    // A socket or device node, which Node cannot create. The seam is substituted
    // rather than the filesystem contrived, because the classification under test
    // is the protocol's, not the kernel's.
    const nonRegular: IAtomicFsOperations = {
      ...defaultAtomicFsOperations,
      lstat: () =>
        succeedWithDetail({
          isFile: false,
          isDirectory: false,
          isSymbolicLink: false,
          permissions: 0o600
        })
    };
    const ops = new FaultingFsOperations(nonRegular);
    expect(commit(ops, NEW)).toFailWithDetail(/destination is not a regular file/i, {
      code: 'not-writable',
      stage: 'validate',
      visibility: 'unchanged'
    });
  });

  test('refuses when the destination cannot be inspected at all', () => {
    const ops = new FaultingFsOperations().failAt({ op: 'lstat', errno: 'ENOTDIR' });
    expect(commit(ops, NEW)).toFailWithDetail(/cannot inspect destination/i, {
      code: 'io',
      stage: 'validate',
      visibility: 'unchanged'
    });
    expect(orphanedTemporaries()).toEqual([]);
  });

  test('refuses when the containing directory cannot be opened for its flush', () => {
    // Checked before anything is created: a directory that cannot be flushed can
    // never reach the declared boundary, so the write must not start.
    const ops = new FaultingFsOperations().failAt({ op: 'openDirectory', errno: 'EACCES' });
    expect(commit(ops, NEW)).toFailWithDetail(/cannot open containing directory for flush/i, {
      code: 'io',
      stage: 'validate',
      visibility: 'unchanged'
    });
    expect(readDestination()).toBeUndefined();
    expect(orphanedTemporaries()).toEqual([]);
  });
});

describe('commitFileAtomically — a fault before the rename leaves the old record authoritative', () => {
  /**
   * Every test here proves the same guarantee at a different boundary: a reader
   * at the destination still sees the whole previous record, and no orphan is
   * left behind.
   */
  interface IPreRenameCase {
    readonly name: string;
    readonly ops: () => FaultingFsOperations;
    readonly stage: IAtomicWriteFailure['stage'];
    readonly message: RegExp;
  }

  const cases: ReadonlyArray<IPreRenameCase> = [
    {
      name: 'the temporary cannot be created',
      ops: () => new FaultingFsOperations().failAt({ op: 'openExclusive', errno: 'ENOSPC' }),
      stage: 'temporary-write',
      message: /cannot create temporary file/i
    },
    {
      name: 'the write into the temporary fails',
      ops: () => new FaultingFsOperations().failAt({ op: 'write', errno: 'ENOSPC' }),
      stage: 'temporary-write',
      message: /injected write failure/i
    },
    {
      name: 'the write reports no progress',
      ops: () => new FaultingFsOperations().reportNoWriteProgress(),
      stage: 'temporary-write',
      message: /made no progress/i
    },
    {
      name: 'a partial write is followed by a failure',
      ops: () =>
        new FaultingFsOperations().chunkWritesTo(4).failAt({ op: 'write', errno: 'EIO', occurrence: 2 }),
      stage: 'temporary-write',
      message: /injected write failure/i
    },
    {
      name: 'the permissions of the temporary cannot be set',
      ops: () => new FaultingFsOperations().failAt({ op: 'fchmod', errno: 'EPERM' }),
      stage: 'temporary-write',
      message: /cannot set temporary file permissions/i
    },
    {
      name: 'the temporary cannot be flushed',
      ops: () => new FaultingFsOperations().failAt({ op: 'fsync', errno: 'EIO' }),
      stage: 'file-flush',
      message: /cannot flush temporary file/i
    },
    {
      name: 'the temporary cannot be closed',
      ops: () => new FaultingFsOperations().failAt({ op: 'close', errno: 'EIO' }),
      stage: 'file-flush',
      message: /cannot close temporary file/i
    },
    {
      name: 'the rename is rejected before it changes a directory entry',
      ops: () => new FaultingFsOperations().failAt({ op: 'rename', errno: 'EACCES' }),
      stage: 'replace',
      message: /injected rename failure/i
    }
  ];

  test.each(cases)('$name', ({ ops: makeOps, stage, message }) => {
    // 0o644 so the fchmod step runs and its fault case is reachable.
    withExistingFile(OLD, 0o644);
    const ops = makeOps();

    expect(commit(ops, NEW)).toFailWithDetail(message, {
      code: 'io',
      stage,
      visibility: 'unchanged'
    });

    // The guarantee: a subsequent reader sees the whole previous record.
    expect(readDestination()).toBe(OLD);
    expect(fs.statSync(destination()).mode % 0o10000).toBe(0o644);
    // And the protocol cleaned up after itself.
    expect(orphanedTemporaries()).toEqual([]);
  });

  test('a pre-rename fault on a first creation leaves no file at all', () => {
    const ops = new FaultingFsOperations().failAt({ op: 'fsync', errno: 'EIO' });
    expect(commit(ops, NEW)).toFailWithDetail(/cannot flush temporary file/i, {
      code: 'io',
      stage: 'file-flush',
      visibility: 'unchanged'
    });
    expect(readDestination()).toBeUndefined();
    expect(orphanedTemporaries()).toEqual([]);
  });

  test('does not close a descriptor the runtime reported as unclosed', () => {
    // Closing again a descriptor whose close failed is how an unrelated file
    // acquires a stray close once the number is recycled.
    const ops = new FaultingFsOperations().failAt({ op: 'close', errno: 'EIO' });
    expect(commit(ops, NEW)).toFail();
    // One failed close of the temporary, one successful close of the directory.
    expect(ops.callCount('close')).toBe(2);
  });
});

describe('commitFileAtomically — classifying what a reader can see after a failed rename', () => {
  test.each([
    ['ENOENT', 'unchanged'],
    ['EACCES', 'unchanged'],
    ['EXDEV', 'unchanged'],
    ['EROFS', 'unchanged'],
    ['EIO', 'unknown'],
    ['ENOSPC', 'unknown'],
    ['EDQUOT', 'unknown'],
    ['ESOMETHINGNEW', 'unknown']
  ])('a rename failing with %s reports visibility %s', (errno, visibility) => {
    withExistingFile(OLD);
    const ops = new FaultingFsOperations().failAt({ op: 'rename', errno });
    expect(commit(ops, NEW)).toFailWithDetail(/injected rename failure/i, {
      code: 'io',
      stage: 'replace',
      visibility
    });
  });

  test('a rename failure carrying no errno is unknown, not unchanged', () => {
    // `unchanged` is only ever claimed on positive evidence that the rename was
    // rejected before it touched a directory entry. No evidence is not evidence.
    withExistingFile(OLD);
    const ops = new FaultingFsOperations().failAt({ op: 'rename' });
    expect(commit(ops, NEW)).toFailWithDetail(/injected rename failure/i, {
      code: 'io',
      stage: 'replace',
      visibility: 'unknown'
    });
  });

  test('ENOSPC is deliberately not treated as proof that nothing happened', () => {
    // The dangerous direction: a caller told `unchanged` treats a failed write as
    // a no-op. A rename can fail for want of space part-way through committing,
    // so it is classified conservatively even though it usually changes nothing.
    withExistingFile(OLD);
    const ops = new FaultingFsOperations().failAt({ op: 'rename', errno: 'ENOSPC' });
    expect(commit(ops, NEW)).toFailWithDetail(/./, {
      code: 'io',
      stage: 'replace',
      visibility: 'unknown'
    });
  });
});

describe('commitFileAtomically — a fault after the rename cannot be mistaken for nonapplication', () => {
  test('a failed directory flush reports the replacement as visible, and it is', () => {
    withExistingFile(OLD);
    const ops = new FaultingFsOperations().failAt({ op: 'fsync', errno: 'EIO', occurrence: 2 });

    expect(commit(ops, NEW)).toFailWithDetail(/replacement is visible but the containing directory/i, {
      code: 'io',
      stage: 'directory-flush',
      visibility: 'replaced'
    });

    // The classification is not a guess: the new record really is what a reader
    // now gets. Only the durability boundary went unmet.
    expect(readDestination()).toBe(NEW);
    expect(orphanedTemporaries()).toEqual([]);
  });

  test('a failed directory close after a successful flush also reports replaced', () => {
    withExistingFile(OLD);
    // The first close is the temporary's; the second is the directory's, after
    // its flush already succeeded.
    const ops = new FaultingFsOperations().failAt({ op: 'close', errno: 'EIO', occurrence: 2 });

    expect(commit(ops, NEW)).toFailWithDetail(/could not be closed/i, {
      code: 'io',
      stage: 'directory-flush',
      visibility: 'replaced'
    });
    expect(readDestination()).toBe(NEW);
  });

  test('never rolls a completed replacement back to the previous record', () => {
    withExistingFile(OLD);
    const ops = new FaultingFsOperations().failAt({ op: 'fsync', errno: 'EIO', occurrence: 2 });
    expect(commit(ops, NEW)).toFail();
    // A "rollback" would mean rewriting OLD over a record that is already NEW,
    // destroying an accepted write in the name of tidiness.
    expect(readDestination()).not.toBe(OLD);
    expect(readDestination()).toBe(NEW);
  });

  test('retrying after an ambiguous replacement re-establishes the boundary', () => {
    withExistingFile(OLD);
    const failing = new FaultingFsOperations().failAt({ op: 'rename', errno: 'EIO' });
    expect(commit(failing, NEW)).toFailWithDetail(/./, {
      code: 'io',
      stage: 'replace',
      visibility: 'unknown'
    });

    // `unknown` obliges the caller to read the committed record rather than
    // assume. Here it turns out the rename did not happen.
    expect(readDestination()).toBe(OLD);

    // Rewriting the same record is safe whichever way the ambiguity resolved.
    const retry = new FaultingFsOperations();
    expect(commit(retry, NEW)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.replaced).toBe(true);
    });
    expect(readDestination()).toBe(NEW);
    expect(orphanedTemporaries()).toEqual([]);
  });
});

describe('commitFileAtomically — cleanup problems never mask the real failure', () => {
  test('reports the rename failure, not the failure to remove the temporary', () => {
    withExistingFile(OLD);
    const ops = new FaultingFsOperations()
      .failAt({ op: 'rename', errno: 'EACCES' })
      .failAt({ op: 'unlink', errno: 'EPERM' });

    expect(commit(ops, NEW)).toFailWithDetail(/injected rename failure/i, {
      code: 'io',
      stage: 'replace',
      visibility: 'unchanged'
    });
    expect(readDestination()).toBe(OLD);
  });

  test('names the orphan it could not remove, so it is not lost silently', () => {
    withExistingFile(OLD);
    const ops = new FaultingFsOperations()
      .failAt({ op: 'rename', errno: 'EACCES' })
      .failAt({ op: 'unlink', errno: 'EPERM' });

    expect(commit(ops, NEW)).toFailWith(/cleanup incomplete[\s\S]*remove[\s\S]*fgv-atomic/i);
    // The orphan really is still there, which is what the message claims.
    expect(orphanedTemporaries()).toHaveLength(1);
  });

  test('reports a directory descriptor it could not release', () => {
    const ops = new FaultingFsOperations()
      .failAt({ op: 'openExclusive', errno: 'ENOSPC' })
      .failAt({ op: 'close', errno: 'EBADF' });
    expect(commit(ops, NEW)).toFailWith(/cleanup incomplete[\s\S]*close containing directory/i);
  });
});

describe('isReservedTemporaryName', () => {
  test.each([
    ['.fgv-atomic-0123456789abcdef01234567.tmp', true],
    ['.fgv-atomic-0123456789abcdef0123456.tmp', false],
    ['.fgv-atomic-0123456789ABCDEF01234567.tmp', false],
    ['.fgv-atomic-0123456789abcdef01234567', false],
    ['fgv-atomic-0123456789abcdef01234567.tmp', false],
    ['.fgv-atomic-0123456789abcdef01234567.tmp.bak', false],
    ['record.json', false],
    ['', false]
  ])('%s is reserved: %s', (name, expected) => {
    expect(isReservedTemporaryName(name)).toBe(expected);
  });
});

describe('cleanupAtomicTemporaries', () => {
  const join = (...paths: string[]): string => path.join(...paths);

  test('removes orphaned temporaries and reports what it removed', () => {
    const orphan = '.fgv-atomic-0123456789abcdef01234567.tmp';
    fs.writeFileSync(path.join(root, orphan), 'half a record');
    expect(cleanupAtomicTemporaries(defaultAtomicFsOperations, root, join)).toSucceedWith([orphan]);
    expect(fs.existsSync(path.join(root, orphan))).toBe(false);
  });

  test('leaves every host file alone, including near-misses of the reserved shape', () => {
    const keep = [
      'record.json',
      '.hidden',
      '.fgv-atomic-notlongenough.tmp',
      '.fgv-atomic-0123456789abcdef01234567.tmp.bak'
    ];
    keep.forEach((name) => fs.writeFileSync(path.join(root, name), 'host data'));

    expect(cleanupAtomicTemporaries(defaultAtomicFsOperations, root, join)).toSucceedWith([]);
    keep.forEach((name) => expect(fs.existsSync(path.join(root, name))).toBe(true));
  });

  test('reports a reserved name that is not a regular file rather than removing it', () => {
    // Nothing but this protocol may create a reserved name, so one that is a
    // directory means something outside the fault model happened. Saying so is
    // more useful than a recursive delete.
    fs.mkdirSync(path.join(root, '.fgv-atomic-0123456789abcdef01234567.tmp'));
    expect(cleanupAtomicTemporaries(defaultAtomicFsOperations, root, join)).toFailWith(
      /reserved name is not a regular file/i
    );
  });

  test('fails when the directory cannot be listed', () => {
    const ops = new FaultingFsOperations().failAt({ op: 'readDirectory', errno: 'ENOENT' });
    expect(cleanupAtomicTemporaries(ops, root, join)).toFailWith(/cannot list directory/i);
  });

  test('fails when an orphan cannot be inspected', () => {
    fs.writeFileSync(path.join(root, '.fgv-atomic-0123456789abcdef01234567.tmp'), 'x');
    const ops = new FaultingFsOperations().failAt({ op: 'lstat', errno: 'EACCES' });
    expect(cleanupAtomicTemporaries(ops, root, join)).toFailWith(/cannot inspect/i);
  });

  test('fails when an orphan cannot be removed', () => {
    fs.writeFileSync(path.join(root, '.fgv-atomic-0123456789abcdef01234567.tmp'), 'x');
    const ops = new FaultingFsOperations().failAt({ op: 'unlink', errno: 'EPERM' });
    expect(cleanupAtomicTemporaries(ops, root, join)).toFailWith(/cannot remove/i);
  });
});
