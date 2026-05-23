/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import { IScreener, IScreenerContext, ISafeguardFinding, SafeguardDisposition } from '../types';

/**
 * Options for {@link createPatternScreener}.
 * @public
 */
export interface IPatternScreenerOptions {
  /** Screener name used for finding attribution. Default `'pattern-screener'`. */
  readonly name?: string;
  /** Regex patterns tested against each screened slot value. */
  readonly patterns: ReadonlyArray<RegExp>;
  /** Disposition emitted on a pattern match (`'warn'` surfaces a finding; `'reject'` fails the resolve). */
  readonly onMatch: SafeguardDisposition;
  /**
   * Optional slot-source allowlist. When provided, a slot whose `source` is
   * not in the list is skipped with a `'screening-skipped'` info finding (the
   * source-aware skip the screener now owns). When omitted, every slot value
   * with a declared `source` is screened. Slots with no declared `source` are
   * never screened.
   */
  readonly screenedSources?: ReadonlyArray<string>;
}

/**
 * Builds an {@link IScreener} that screens slot values against a set of regex
 * patterns — the built-in injection screener, reproducing the v0.1 regex
 * semantics now that screening is pluggable.
 *
 * @remarks
 * Each pattern's `lastIndex` is reset to `0` before every `.test()` so
 * stateful (`g` / `y`) flag regexes don't leak match position across slot
 * values. A slot with no declared `source` is never screened; with
 * `screenedSources` set, a slot whose `source` is not in the allowlist emits a
 * `'screening-skipped'` info finding. A match emits a single
 * `'suspicious-pattern'` finding carrying the configured `onMatch` disposition.
 *
 * @public
 */
export function createPatternScreener(options: IPatternScreenerOptions): IScreener {
  const name = options.name ?? 'pattern-screener';
  const { patterns, onMatch, screenedSources } = options;

  return {
    name,
    screen: (ctx: IScreenerContext): Promise<Result<ReadonlyArray<ISafeguardFinding>>> =>
      Promise.resolve(screenValue(ctx, name, patterns, onMatch, screenedSources))
  };
}

function screenValue(
  ctx: IScreenerContext,
  name: string,
  patterns: ReadonlyArray<RegExp>,
  onMatch: SafeguardDisposition,
  screenedSources: ReadonlyArray<string> | undefined
): Result<ReadonlyArray<ISafeguardFinding>> {
  // A slot with no declared source has nothing to attribute — never screened.
  if (ctx.source === undefined) {
    return succeed([]);
  }

  // Source-aware skip: with an allowlist set, a non-listed source is skipped
  // with an info finding rather than screened.
  if (screenedSources !== undefined && !screenedSources.includes(ctx.source)) {
    return succeed([
      {
        slot: ctx.slot.name,
        kind: 'screening-skipped',
        disposition: 'info',
        detail: `slot '${ctx.slot.name}': source '${ctx.source}' is not in screener '${name}' screenedSources`,
        screener: name
      }
    ]);
  }

  if (patterns.length === 0) {
    return succeed([]);
  }

  const matches: string[] = [];
  for (const pattern of patterns) {
    // Reset `lastIndex` so stateful (`g` / `y`) flag regexes don't carry match
    // position from a previous slot's value (PR #359 retrospective bug).
    pattern.lastIndex = 0;
    if (pattern.test(ctx.value)) {
      matches.push(pattern.toString());
    }
  }

  if (matches.length === 0) {
    return succeed([]);
  }

  return succeed([
    {
      slot: ctx.slot.name,
      kind: 'suspicious-pattern',
      disposition: onMatch,
      detail: `slot '${ctx.slot.name}': matched suspicious pattern(s): ${matches.join(', ')}`,
      screener: name
    }
  ]);
}
