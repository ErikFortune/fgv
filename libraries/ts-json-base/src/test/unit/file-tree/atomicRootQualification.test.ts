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
import { qualifyAtomicWrites } from '../../../packlets/file-tree/atomicRootQualification';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  AtomicFsErrno,
  IAtomicFsOperations,
  defaultAtomicFsOperations
} from '../../../packlets/file-tree/atomicFsOperations';
import { FaultingFsOperations } from './atomicFaultHarness';

/**
 * Qualification decides what durability claim a root is allowed to carry, so
 * these tests are the ones standing between a consumer and a false promise.
 */

const EXT_FAMILY: number = 0xef53;
const TMPFS: number = 0x01021994;
const OVERLAYFS: number = 0x794c7630;

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-atomic-qual-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

/**
 * A seam that reports a chosen filesystem type but is otherwise real, so the
 * qualification table can be exercised for filesystems this machine does not
 * have mounted.
 */
function opsReportingFilesystem(type: number): IAtomicFsOperations {
  return {
    ...defaultAtomicFsOperations,
    filesystemType: (): DetailedResult<number, AtomicFsErrno> => succeedWithDetail(type)
  };
}

describe('qualifyAtomicWrites — qualified roots', () => {
  test.each([
    ['ext2/ext3/ext4', EXT_FAMILY],
    ['tmpfs', TMPFS]
  ])('qualifies a local %s root on linux for process-crash survival', (name, type) => {
    expect(qualifyAtomicWrites(opsReportingFilesystem(type), root, 'linux')).toSucceedAndSatisfy((q) => {
      expect(q.capabilities.atomicReplace).toBe(true);
      expect(q.capabilities.guarantees).toEqual(['session', 'process-crash']);
      expect(q.reason).toContain(name);
    });
  });

  test('never advertises a guarantee stronger than process-crash', () => {
    // A1 caps this package at process-crash. Process-kill evidence cannot
    // establish what a storage stack does when the machine loses power, so
    // these two must not appear whatever the filesystem.
    expect(qualifyAtomicWrites(opsReportingFilesystem(EXT_FAMILY), root, 'linux')).toSucceedAndSatisfy(
      (q) => {
        expect(q.capabilities.guarantees).not.toContain('os-crash');
        expect(q.capabilities.guarantees).not.toContain('power-loss');
      }
    );
  });

  test('qualifies the real temporary directory this suite runs against', () => {
    // Not a tautology: it is the assertion that the filesystem the rest of this
    // suite's evidence was gathered on is one the allowlist actually names.
    const qualified = qualifyAtomicWrites(defaultAtomicFsOperations, root, process.platform);
    expect(qualified).toSucceed();
    if (process.platform === 'linux') {
      expect(qualified).toSucceedAndSatisfy((q) => {
        expect(q.capabilities.atomicReplace).toBe(true);
      });
    }
  });
});

describe('qualifyAtomicWrites — unqualified roots refuse rather than downgrade', () => {
  test.each([
    ['win32' as NodeJS.Platform],
    ['darwin' as NodeJS.Platform],
    ['freebsd' as NodeJS.Platform],
    ['aix' as NodeJS.Platform]
  ])('does not qualify %s', (platform) => {
    expect(qualifyAtomicWrites(opsReportingFilesystem(EXT_FAMILY), root, platform)).toSucceedAndSatisfy(
      (q) => {
        expect(q.capabilities.atomicReplace).toBe(false);
        expect(q.capabilities.guarantees).toEqual([]);
        expect(q.reason).toContain(platform);
        expect(q.reason).toMatch(/not qualified/i);
      }
    );
  });

  test('darwin is unqualified despite being a local unix, and says why is not the point — that it refuses is', () => {
    // macOS was in the approved target matrix. It is refused here because Node
    // exposes no stable filesystem-type identifier on darwin, so a darwin root
    // cannot be positively identified from inside this package. "We could not
    // tell" is recorded as unqualified, never as qualified.
    expect(qualifyAtomicWrites(defaultAtomicFsOperations, root, 'darwin')).toSucceedAndSatisfy((q) => {
      expect(q.capabilities.atomicReplace).toBe(false);
    });
  });

  test('does not qualify a filesystem that is not on the allowlist', () => {
    expect(qualifyAtomicWrites(opsReportingFilesystem(OVERLAYFS), root, 'linux')).toSucceedAndSatisfy((q) => {
      expect(q.capabilities.atomicReplace).toBe(false);
      expect(q.capabilities.guarantees).toEqual([]);
      expect(q.reason).toContain('0x794c7630');
      expect(q.reason).toMatch(/not qualified/i);
    });
  });

  test('does not qualify a root whose filesystem cannot be identified', () => {
    const ops = new FaultingFsOperations().failAt({ op: 'filesystemType', errno: 'ENOSYS' });
    expect(qualifyAtomicWrites(ops, root, 'linux')).toSucceedAndSatisfy((q) => {
      expect(q.capabilities.atomicReplace).toBe(false);
      expect(q.reason).toMatch(/cannot identify the filesystem/i);
    });
  });
});

describe('qualifyAtomicWrites — a question it cannot answer fails rather than answering no', () => {
  test('fails for a directory that does not exist', () => {
    expect(qualifyAtomicWrites(defaultAtomicFsOperations, path.join(root, 'absent'), 'linux')).toFailWith(
      /not found/i
    );
  });

  test('fails for a path that names a file', () => {
    const file = path.join(root, 'a-file');
    fs.writeFileSync(file, 'x');
    expect(qualifyAtomicWrites(defaultAtomicFsOperations, file, 'linux')).toFailWith(/not a directory/i);
  });

  test('does not report a directory it could not inspect as one that is not there', () => {
    // "Not found" is a diagnosis. Reporting it for EACCES sends a caller looking
    // for a directory that exists and is simply unreadable, and they only learn
    // the message was wrong after spending the time.
    const ops = new FaultingFsOperations().failAt({ op: 'lstat', errno: 'EACCES' });
    const qualified = qualifyAtomicWrites(ops, root, 'linux');
    expect(qualified).toFailWith(/cannot inspect directory/i);
    // And specifically NOT the diagnosis it used to give.
    expect(qualified).not.toFailWith(/not found/i);
  });
});
