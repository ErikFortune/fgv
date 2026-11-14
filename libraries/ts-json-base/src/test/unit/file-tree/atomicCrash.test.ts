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
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { FsFileTreeAccessors } from '../../../packlets/file-tree';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { isReservedTemporaryName } from '../../../packlets/file-tree/fs-atomic/atomicFileCommit';
import { atomicTestRoots, isQualified } from './atomicTestRoots';

/**
 * Process-crash qualification.
 *
 * @remarks
 * These are the tests behind the `'process-crash'` guarantee, and they are the
 * only ones entitled to establish it. A child process runs the real protocol
 * against a real directory and **kills itself** at a chosen protocol boundary.
 * Self-inflicted `SIGKILL` is what makes the synchronization exact: the process
 * dies at that instruction, not after a sleep the parent hoped was long enough.
 * A sleep-based version of this suite would pass while proving nothing.
 *
 * The prediction these tests were written against is recorded in the stream's
 * `state.md`, before the first run. In short: at every boundary the destination
 * must hold the whole previous record or the whole new one, and never anything
 * else.
 *
 * **What this does not establish.** Nothing about OS crashes or power loss. The
 * kernel and the filesystem keep running throughout; only the writing process
 * dies. That is exactly the approved fault model and exactly the limit of the
 * claim.
 */

/**
 * Where the child is killed. Each value names the protocol step it dies at.
 */
type CrashBoundary =
  | 'before-temp-open'
  | 'after-temp-open'
  | 'mid-write'
  | 'after-file-flush'
  | 'before-rename'
  | 'after-rename'
  | 'after-directory-flush'
  | 'none';

const OLD: string = `${'previous record line\n'.repeat(64)}`;
const NEW: string = `${'replacement record line\n'.repeat(64)}`;

/**
 * Small enough that the record takes many writes, so `mid-write` lands in the
 * middle of a genuinely partial temporary rather than after a complete one.
 */
const WRITE_CHUNK: number = 16;

/**
 * The child. Plain CommonJS written to the temporary directory at run time, so
 * it is never compiled or linted as part of the package, and requires the
 * package's own compiled output — the same modules the rest of the suite drives.
 */
const CHILD_SOURCE: string = `
'use strict';
const path = require('path');
const fs = require('fs');

const [libRoot, directoryPath, destinationPath, contentsPath, boundary, chunk] = process.argv.slice(2);
const opsModule = require(path.join(libRoot, 'packlets', 'file-tree', 'fs-atomic', 'atomicFsOperations.js'));
const commitModule = require(path.join(libRoot, 'packlets', 'file-tree', 'fs-atomic', 'atomicFileCommit.js'));
const real = opsModule.defaultAtomicFsOperations;
const chunkSize = Number(chunk);

function die() {
  // SIGKILL cannot be caught, blocked or deferred, and the kernel delivers it
  // before this call returns to user space. The process stops here.
  process.kill(process.pid, 'SIGKILL');
}

let writes = 0;
let flushes = 0;

const ops = Object.assign({}, real, {
  openExclusive: function (p, m) {
    if (boundary === 'before-temp-open') { die(); }
    const result = real.openExclusive(p, m);
    if (boundary === 'after-temp-open') { die(); }
    return result;
  },
  write: function (fd, bytes, offset) {
    const end = Math.min(bytes.length, offset + chunkSize);
    const result = real.write(fd, bytes.subarray(0, end), offset);
    writes += 1;
    if (boundary === 'mid-write' && writes === 2) { die(); }
    return result;
  },
  fsync: function (fd) {
    const result = real.fsync(fd);
    flushes += 1;
    if (boundary === 'after-file-flush' && flushes === 1) { die(); }
    if (boundary === 'after-directory-flush' && flushes === 2) { die(); }
    return result;
  },
  rename: function (from, to) {
    if (boundary === 'before-rename') { die(); }
    const result = real.rename(from, to);
    if (boundary === 'after-rename') { die(); }
    return result;
  }
});

const outcome = commitModule.commitFileAtomically({
  destinationPath: destinationPath,
  directoryPath: directoryPath,
  contents: fs.readFileSync(contentsPath, 'utf8'),
  guarantee: 'process-crash',
  ops: ops,
  joinPaths: path.join
});

// Only reached when no boundary was requested. Its presence is how the parent
// tells "the protocol completed" from "the child died".
fs.writeFileSync(destinationPath + '.completed', String(outcome.isSuccess()));
`;

interface ICrashExpectation {
  readonly boundary: CrashBoundary;
  /**
   * What a reader must find at the destination after the child dies.
   */
  readonly sees: 'previous' | 'new';
  /**
   * Whether an interrupted write must have left a reserved temporary behind.
   */
  readonly leavesOrphan: boolean;
}

const expectations: ReadonlyArray<ICrashExpectation> = [
  { boundary: 'before-temp-open', sees: 'previous', leavesOrphan: false },
  { boundary: 'after-temp-open', sees: 'previous', leavesOrphan: true },
  { boundary: 'mid-write', sees: 'previous', leavesOrphan: true },
  { boundary: 'after-file-flush', sees: 'previous', leavesOrphan: true },
  { boundary: 'before-rename', sees: 'previous', leavesOrphan: true },
  { boundary: 'after-rename', sees: 'new', leavesOrphan: false },
  { boundary: 'after-directory-flush', sees: 'new', leavesOrphan: false }
];

describe.each(atomicTestRoots())('process-crash survival on $label', ({ base }) => {
  const qualified: boolean = isQualified(base);
  const whenQualified: jest.It = qualified ? test : test.skip;

  let root: string;
  let scriptPath: string;
  let contentsPath: string;
  let destinationPath: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(base, 'fgv-atomic-crash-'));
    // The script and the source contents live outside the directory under test,
    // so they cannot be mistaken for the protocol's own leavings.
    scriptPath = path.join(root, 'child.cjs');
    contentsPath = path.join(root, 'contents.txt');
    fs.writeFileSync(scriptPath, CHILD_SOURCE);
    fs.writeFileSync(contentsPath, NEW);

    fs.mkdirSync(path.join(root, 'records'));
    destinationPath = path.join(root, 'records', 'record.json');
    fs.writeFileSync(destinationPath, OLD);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function runChild(boundary: CrashBoundary): ReturnType<typeof spawnSync> {
    return spawnSync(
      process.execPath,
      [
        scriptPath,
        // `__dirname` is <package>/lib/test/unit/file-tree once compiled.
        path.resolve(__dirname, '..', '..', '..'),
        path.dirname(destinationPath),
        destinationPath,
        contentsPath,
        boundary,
        String(WRITE_CHUNK)
      ],
      { encoding: 'utf8' }
    );
  }

  function orphans(): ReadonlyArray<string> {
    return fs.readdirSync(path.dirname(destinationPath)).filter(isReservedTemporaryName);
  }

  whenQualified('the harness itself works: an uninterrupted child commits and returns', () => {
    // If this fails, every result below is measuring the wrong thing.
    const child = runChild('none');
    expect(child.status).toBe(0);
    expect(child.signal).toBeNull();
    expect(fs.readFileSync(destinationPath, 'utf8')).toBe(NEW);
    expect(fs.readFileSync(`${destinationPath}.completed`, 'utf8')).toBe('true');
    expect(orphans()).toEqual([]);
  });

  // `whenQualified.each`, NOT `test.each(qualified ? expectations : [])`.
  // Jest's `.each` FAILS on an empty array — "called with an empty Array of
  // table data" — so the conditional-array form would turn this whole file red
  // on any machine whose roots are unqualified, rather than skipping. Verified
  // against the installed Jest rather than assumed. Both roots qualify here, so
  // the defect was invisible locally.
  whenQualified.each(expectations)(
    'killed at $boundary, a reader sees the $sees record whole',
    ({ boundary, sees, leavesOrphan }) => {
      const child = runChild(boundary);

      // The child really was killed, rather than exiting on its own.
      expect(child.signal).toBe('SIGKILL');
      expect(fs.existsSync(`${destinationPath}.completed`)).toBe(false);

      const seen = fs.readFileSync(destinationPath, 'utf8');

      // THE CLAIM. Not "starts with", not "is one of these lengths" — the whole
      // previous record or the whole new one, byte for byte.
      expect([OLD, NEW]).toContain(seen);
      expect(seen).toBe(sees === 'previous' ? OLD : NEW);

      expect(orphans()).toHaveLength(leavesOrphan ? 1 : 0);
    }
  );

  whenQualified('the mid-write orphan really is partial, so the injection fired where it claims', () => {
    // Without this the whole table could be green while the child was being
    // killed after every write had completed, which would prove nothing about
    // an interrupted write.
    const child = runChild('mid-write');
    expect(child.signal).toBe('SIGKILL');

    const orphaned = orphans();
    expect(orphaned).toHaveLength(1);
    const partial = fs.readFileSync(path.join(path.dirname(destinationPath), orphaned[0]), 'utf8');
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(NEW.length);
    expect(NEW.startsWith(partial)).toBe(true);
    // And the destination is untouched by any of it.
    expect(fs.readFileSync(destinationPath, 'utf8')).toBe(OLD);
  });

  whenQualified('reopen reclaims the orphan and leaves the surviving record exactly as it was', () => {
    const child = runChild('before-rename');
    expect(child.signal).toBe('SIGKILL');
    expect(orphans()).toHaveLength(1);

    const accessors = new FsFileTreeAccessors({ prefix: root, mutable: true });
    expect(accessors.cleanupAtomicTemporaries(path.dirname(destinationPath))).toSucceedAndSatisfy(
      (removed) => {
        expect(removed).toHaveLength(1);
        expect(isReservedTemporaryName(removed[0])).toBe(true);
      }
    );

    expect(orphans()).toEqual([]);
    // Reclaiming working files must not disturb the record that survived.
    expect(fs.readFileSync(destinationPath, 'utf8')).toBe(OLD);
  });

  whenQualified('a record committed before the crash is still readable afterwards', () => {
    // The durability half of the claim, as distinct from the atomicity half:
    // once the protocol has reported success, the record outlives the process.
    expect(runChild('none').status).toBe(0);
    expect(runChild('after-temp-open').signal).toBe('SIGKILL');

    const accessors = new FsFileTreeAccessors({ prefix: root, mutable: true });
    expect(accessors.getFileTextStrict(destinationPath)).toSucceedWith(NEW);
  });
});
