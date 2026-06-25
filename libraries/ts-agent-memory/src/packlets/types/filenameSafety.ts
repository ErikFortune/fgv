/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

/**
 * Reserved Windows device basenames. Includes `COM0..9` and `LPT0..9` — the
 * 0-suffixed variants were added in Windows 11 / Server 2022. Matched
 * case-insensitively against the basename (text before the first `.`).
 */
const RESERVED_WIN_DEVICES: ReadonlySet<string> = new Set<string>([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  ...Array.from({ length: 10 }, (__v, i) => `COM${i}`),
  ...Array.from({ length: 10 }, (__v, i) => `LPT${i}`)
]);

const PORTABLE_FILENAME_RE: RegExp = /^[A-Za-z0-9._-]+$/;

/**
 * Validates a single filename stem against the POSIX portable filename set
 * (`[A-Za-z0-9._-]`), rejecting a leading or trailing `.` and reserved Windows
 * device names. This is the cross-platform filename-stem contract for the
 * package: {@link MemoryId} values, the concrete {@link IIdentityCodec}
 * implementations, and the store's `verifyFilenameId` all gate on it.
 *
 * @remarks
 * A trailing `.` is rejected because Windows silently strips trailing dots from
 * filenames, so such a stem would not round-trip verbatim through the file
 * layer even though it is otherwise portable-set-valid.
 * @public
 */
export function assertPortableFilenameStem(stem: string): Result<string> {
  if (stem.length === 0) {
    return fail('idStem: must be a non-empty string');
  }
  if (stem.startsWith('.')) {
    return fail(`idStem '${stem}': may not begin with '.'`);
  }
  if (stem.endsWith('.')) {
    return fail(`idStem '${stem}': may not end with '.' (Windows strips trailing dots)`);
  }
  if (!PORTABLE_FILENAME_RE.test(stem)) {
    return fail(
      `idStem '${stem}': contains characters outside the POSIX portable filename set ([A-Za-z0-9._-])`
    );
  }
  const basename: string = stem.split('.')[0];
  if (RESERVED_WIN_DEVICES.has(basename.toUpperCase())) {
    return fail(`idStem '${stem}': basename '${basename}' matches a reserved Windows device name`);
  }
  return succeed(stem);
}
