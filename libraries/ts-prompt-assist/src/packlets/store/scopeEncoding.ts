/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed, fail } from '@fgv/ts-utils';
import { ScopeKey, Convert } from '../types';

// Per design OQ-1: the default scopeEncoding treats ScopeKey as already a
// single path-safe segment. Reject:
//   - `/`, `\`, `\0`, `:`
//   - leading `.`
//   - characters outside the POSIX portable filename set
//     ([A-Za-z0-9._-]) — wider sets require a consumer-supplied
//     scopeEncoding.
//   - reserved Windows device names

// Reserved Windows device basenames. Includes COM0..9 and LPT0..9 — the
// 0-suffixed variants were added in Windows 11 / Server 2022. Names are
// matched case-insensitively against the basename (text before the first
// `.`). Consumers who need names that collide with these on POSIX must
// supply a custom `scopeEncoding`.
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
 * Default scope encoding (identity) with the path-safety contract documented
 * in design §OQ-1 enforced.
 *
 * @remarks
 * The case-insensitive reserved-device check rejects mixed-case forms
 * (e.g. `'Aux'`, `'con.txt'`) even though POSIX hosts don't reserve
 * those names. The default path optimizes for cross-platform safety;
 * consumers who need such names supply a custom `scopeEncoding` per
 * design OQ-1.
 *
 * @public
 */
export function defaultScopeEncoding(scope: ScopeKey): Result<string> {
  const raw: string = scope;
  if (raw.length === 0) {
    return fail('scope: must be a non-empty string');
  }
  if (raw.startsWith('.')) {
    return fail(`scope '${raw}': may not begin with '.'`);
  }
  if (!PORTABLE_FILENAME_RE.test(raw)) {
    return fail(
      `scope '${raw}': contains characters outside the POSIX portable filename set; supply a custom scopeEncoding`
    );
  }
  // Windows reserves device names both bare AND with any extension —
  // `CON`, `CON.txt`, `con.yaml` are all rejected by NTFS. Check the
  // basename portion (text before the first `.`) against the reserved
  // set, not just the whole encoded string.
  const basename = raw.split('.')[0];
  if (RESERVED_WIN_DEVICES.has(basename.toUpperCase())) {
    return fail(`scope '${raw}': basename '${basename}' matches a reserved Windows device name`);
  }
  return succeed(raw);
}

/**
 * Default scope decoding (identity) with validation via {@link defaultScopeEncoding}.
 * @public
 */
export function defaultScopeDecoding(encoded: string): Result<ScopeKey> {
  // Decoding is just the identity validation: brand the string, then run it
  // through the encoder to enforce the path-safety contract. A successful
  // encode necessarily round-trips because the encoder is identity, so no
  // extra round-trip check is needed.
  return Convert.scopeKey
    .convert(encoded)
    .onSuccess((scope) => defaultScopeEncoding(scope).onSuccess(() => succeed(scope)));
}
