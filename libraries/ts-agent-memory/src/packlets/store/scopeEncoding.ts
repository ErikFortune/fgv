/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { MemoryScopeKey, assertPortableFilenameStem } from '../types';

/**
 * Encode a {@link MemoryScopeKey} to its on-disk directory path. The scope may
 * be multi-segment (`/`-separated) — each component is validated independently
 * against the POSIX portable filename set (via
 * {@link assertPortableFilenameStem}), then rejoined with `/`.
 *
 * @remarks
 * This is the day-one multi-segment scope resolver design-lock §9.1 calls for:
 * the knowledge scope is the single segment `knowledge`, while the Phase-C MTM
 * scope `conversations/<conversationId>` is two segments. Validating each
 * segment independently (rather than the whole path as one stem, which the
 * `ts-prompt-assist` default encoding does) keeps the Phase-C codec additive —
 * no scope-encoding change is needed when MTM ships.
 * @public
 */
export function defaultMemoryScopeEncoding(scope: MemoryScopeKey): Result<string> {
  // `''.split('/')` yields `['']`, never `[]`, so a single empty-segment check
  // covers the empty-scope case too.
  const segments: string[] = scope.split('/');
  if (segments.some((s) => s.length === 0)) {
    return fail(`scope '${scope}': must not contain empty path segments`);
  }
  return mapResults(
    segments.map((segment) =>
      assertPortableFilenameStem(segment).withErrorFormat((msg) => `scope '${scope}': ${msg}`)
    )
  ).onSuccess((validated) => succeed(validated.join('/')));
}
