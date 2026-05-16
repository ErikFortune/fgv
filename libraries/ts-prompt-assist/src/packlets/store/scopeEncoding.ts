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

const RESERVED_WIN_DEVICES: ReadonlySet<string> = new Set<string>([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  ...Array.from({ length: 9 }, (__v, i) => `COM${i + 1}`),
  ...Array.from({ length: 9 }, (__v, i) => `LPT${i + 1}`)
]);

const PORTABLE_FILENAME_RE: RegExp = /^[A-Za-z0-9._-]+$/;

/**
 * Default scope encoding (identity) with the path-safety contract documented
 * in design §OQ-1 enforced.
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
  if (RESERVED_WIN_DEVICES.has(raw.toUpperCase())) {
    return fail(`scope '${raw}': matches a reserved Windows device name`);
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
