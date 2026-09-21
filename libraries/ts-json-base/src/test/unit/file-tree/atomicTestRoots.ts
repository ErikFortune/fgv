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

import fs from 'fs';
import os from 'os';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { defaultAtomicFsOperations } from '../../../packlets/file-tree/atomicFsOperations';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { qualifyAtomicWrites } from '../../../packlets/file-tree/atomicRootQualification';

/**
 * The real filesystems the atomic suites run against.
 *
 * @remarks
 * Discovered rather than declared. The published qualification matrix is meant
 * to be a transcript of what was actually exercised, so the suite reports the
 * filesystem magic it found under each base directory and names the test blocks
 * after it. A second filesystem is included when the machine has one, because a
 * protocol verified on exactly one filesystem has no evidence that its
 * qualification table means anything.
 */
export interface IAtomicTestRoot {
  /**
   * How the filesystem identifies itself, for the test block's name.
   */
  readonly label: string;

  /**
   * A directory on that filesystem under which test roots are created.
   */
  readonly base: string;
}

/**
 * A second filesystem, present on most Linux systems and genuinely distinct
 * from the one backing the temporary directory.
 */
const SHARED_MEMORY_BASE: string = '/dev/shm';

function describeFilesystem(base: string): string {
  const type = defaultAtomicFsOperations.filesystemType(base);
  return type.isSuccess() ? `0x${type.value.toString(16)}` : 'unidentified';
}

function isUsableDirectory(base: string): boolean {
  try {
    fs.accessSync(base, fs.constants.W_OK);
    return fs.statSync(base).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Reports whether the qualification table recognizes the filesystem under a
 * path, on this platform.
 * @param base - The directory to ask about.
 * @returns `true` if a durable atomic write would be permitted there.
 */
export function isQualified(base: string): boolean {
  const qualification = qualifyAtomicWrites(defaultAtomicFsOperations, base, process.platform);
  return qualification.isSuccess() && qualification.value.capabilities.atomicReplace;
}

/**
 * The filesystems to exercise, most portable first.
 * @returns One entry per usable base directory found on this machine.
 */
export function atomicTestRoots(): ReadonlyArray<IAtomicTestRoot> {
  const bases: string[] = [os.tmpdir()];
  if (SHARED_MEMORY_BASE !== os.tmpdir() && isUsableDirectory(SHARED_MEMORY_BASE)) {
    bases.push(SHARED_MEMORY_BASE);
  }
  return bases.map((base) => ({
    base,
    label: `${base} (fstype ${describeFilesystem(base)}, ${isQualified(base) ? 'qualified' : 'unqualified'})`
  }));
}
