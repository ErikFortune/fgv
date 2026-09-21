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

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IAtomicWriteCapabilities } from './fileTreeAccessors';
import { IAtomicFsOperations } from './atomicFsOperations';

/**
 * Decides whether a particular root may be told that an atomic write survives a
 * process crash.
 *
 * @remarks
 * Internal: not re-exported from either FileTree barrel.
 *
 * A durability claim a consumer cannot check is the one defect in this area
 * that only shows up after data has already been lost, so qualification here is
 * a **positive identification against an allowlist**, never a denylist and
 * never a platform string on its own. Where the runtime cannot identify the
 * filesystem, the root is unqualified — "we could not tell" is not "yes".
 */

/**
 * Filesystem type magic numbers whose atomic-replacement and flush behavior has
 * actually been exercised by this package's qualification suite.
 *
 * @remarks
 * The entries are deliberately few. Each one is a claim that the temp/flush/
 * rename/directory-flush protocol was **run** on that filesystem, including the
 * subprocess crash tests — not that it is expected to work there. Adding an
 * entry means running that suite on that filesystem, and nothing less.
 *
 * `tmpfs` belongs here and is not a contradiction: this package's strongest
 * claim is `'process-crash'`, and tmpfs is kernel-resident, so it survives the
 * death of the writing process exactly as a disk filesystem does. It obviously
 * does not survive an OS crash or power loss — but neither does anything else
 * here, because no accessor in this package claims those guarantees at all.
 *
 * Notable omissions and why: `overlayfs` (containers) and network filesystems
 * have rename and flush semantics that differ from the local case; `xfs`,
 * `btrfs`, `zfs` and `apfs` are expected to be fine and simply have not been
 * run. Unqualified means "no evidence", not "known broken".
 */
const QUALIFIED_FILESYSTEM_TYPES: ReadonlyMap<number, string> = new Map<number, string>([
  [0xef53, 'ext2/ext3/ext4'],
  [0x01021994, 'tmpfs']
]);

/**
 * Platforms on which this package's atomic write protocol has been qualified.
 *
 * @remarks
 * Linux only, and the reason is narrower than it looks. The protocol needs a
 * *stable* identification of the filesystem under a path, and on Linux
 * `statfs`'s magic number is exactly that. macOS reports a mount-table index
 * rather than a stable magic, and Node exposes no equivalent of the
 * `f_fstypename` string that would make the identification possible, so a
 * darwin root cannot be positively identified from inside this package and is
 * therefore unqualified. Windows and every network/FUSE/cloud-synced root are
 * unqualified for the ordinary reasons.
 */
const QUALIFIED_PLATFORMS: ReadonlySet<string> = new Set<string>(['linux']);

/**
 * The guarantees a qualified root can honor, weakest to strongest.
 *
 * @remarks
 * `'process-crash'` is the ceiling by design decision A1. `'os-crash'` and
 * `'power-loss'` are not here and must not be added on the strength of
 * process-kill evidence: a directory flush is required by the acceptance
 * boundary and still does not establish what a storage stack does with a
 * write cache when the machine loses power.
 */
const QUALIFIED_GUARANTEES: ReadonlyArray<'session' | 'process-crash'> = ['session', 'process-crash'];

const UNQUALIFIED: IAtomicWriteCapabilities = { atomicReplace: false, guarantees: [] };

/**
 * The outcome of qualifying a root, with the reason attached.
 */
export interface IRootQualification {
  /**
   * What may be advertised for this root.
   */
  readonly capabilities: IAtomicWriteCapabilities;

  /**
   * Why, in a form that can be put in front of a caller whose durable write was
   * refused. Always populated, for a qualified root as well as an unqualified
   * one — a refusal a consumer cannot diagnose is a refusal they will work
   * around.
   */
  readonly reason: string;
}

/**
 * Determines what atomic write guarantee, if any, may be advertised for writes
 * into a directory.
 *
 * @param ops - The filesystem seam.
 * @param directoryPath - Absolute path of the directory to qualify.
 * @param platform - The platform to qualify against, normally `process.platform`.
 * @returns `Success` with the {@link IRootQualification | qualification};
 * `Failure` only if the path is not an existing directory, which is a bad
 * question rather than an unqualified answer.
 */
export function qualifyAtomicWrites(
  ops: IAtomicFsOperations,
  directoryPath: string,
  platform: NodeJS.Platform
): Result<IRootQualification> {
  const stats = ops.lstat(directoryPath);
  if (stats.isFailure()) {
    return fail(`${directoryPath}: not found`);
  }
  if (!stats.value.isDirectory) {
    return fail(`${directoryPath}: not a directory`);
  }

  if (!QUALIFIED_PLATFORMS.has(platform)) {
    return succeed({
      capabilities: UNQUALIFIED,
      reason: `platform '${platform}' is not qualified for atomic writes (qualified: ${[
        ...QUALIFIED_PLATFORMS
      ].join(', ')})`
    });
  }

  const filesystemType = ops.filesystemType(directoryPath);
  if (filesystemType.isFailure()) {
    return succeed({
      capabilities: UNQUALIFIED,
      reason: `cannot identify the filesystem holding ${directoryPath}: ${filesystemType.message}`
    });
  }

  const name = QUALIFIED_FILESYSTEM_TYPES.get(filesystemType.value);
  if (name === undefined) {
    return succeed({
      capabilities: UNQUALIFIED,
      reason: `filesystem type 0x${filesystemType.value.toString(
        16
      )} at ${directoryPath} is not qualified for atomic writes (qualified: ${[
        ...QUALIFIED_FILESYSTEM_TYPES.values()
      ].join(', ')})`
    });
  }

  return succeed({
    capabilities: { atomicReplace: true, guarantees: QUALIFIED_GUARANTEES },
    reason: `${name} on ${platform}`
  });
}
