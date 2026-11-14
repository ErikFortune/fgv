/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IPromptComposition, IPromptSection, toCacheRequest } from '../../index';

function composition(sections: ReadonlyArray<IPromptSection>, totalChars: number): IPromptComposition {
  return { totalChars, sections, cacheFindings: [] };
}

describe('toCacheRequest', () => {
  test('fails when the composition is unavailable', () => {
    const c: IPromptComposition = {
      totalChars: 10,
      sections: [],
      cacheFindings: [],
      unavailable: 'body uses Mustache sections'
    };
    expect(toCacheRequest(c)).toFailWith(/unavailable/i);
    expect(toCacheRequest(c)).toFailWith(/body uses Mustache sections/i);
  });

  test('succeeds with no systemBreakpoints for an empty (but available) composition', () => {
    expect(toCacheRequest(composition([], 0))).toSucceedWith({});
  });

  test('succeeds with no systemBreakpoints for a uniformly frozen composition', () => {
    const c = composition(
      [
        { kind: 'preface', start: 0, chars: 5, effectiveStability: 'frozen' },
        { kind: 'template', start: 5, chars: 5, effectiveStability: 'frozen' }
      ],
      10
    );
    expect(toCacheRequest(c)).toSucceedWith({});
  });

  test('emits one breakpoint at a frozen -> per-request transition', () => {
    const c = composition(
      [
        { kind: 'preface', start: 0, chars: 10, effectiveStability: 'frozen' },
        { kind: 'slot', slot: 'topic' as never, start: 10, chars: 5, effectiveStability: 'per-request' }
      ],
      15
    );
    expect(toCacheRequest(c)).toSucceedWith({ systemBreakpoints: [10] });
  });

  test('treats a section with no effectiveStability as per-request (R-a) rather than upgrading it', () => {
    // A hand-built composition (e.g. constructed outside this library) that omits the field. R-a:
    // absence of a claim never means "assume stable" — an unlabeled section is the least-stable
    // level, same as an explicit 'per-request' would be.
    const c = composition(
      [
        { kind: 'preface', start: 0, chars: 10, effectiveStability: 'frozen' },
        { kind: 'slot', slot: 'topic' as never, start: 10, chars: 5 }
      ],
      15
    );
    expect(toCacheRequest(c)).toSucceedWith({ systemBreakpoints: [10] });
  });

  test('passes hints.cacheKey through to the built request', () => {
    const c = composition([{ kind: 'preface', start: 0, chars: 5, effectiveStability: 'frozen' }], 5);
    expect(toCacheRequest(c, { cacheKey: 'tenant-1' })).toSucceedWith({ cacheKey: 'tenant-1' });
  });

  test('combines a derived breakpoint plan with hints.cacheKey', () => {
    const c = composition(
      [
        { kind: 'preface', start: 0, chars: 10, effectiveStability: 'frozen' },
        { kind: 'slot', slot: 'topic' as never, start: 10, chars: 5, effectiveStability: 'per-request' }
      ],
      15
    );
    expect(toCacheRequest(c, { cacheKey: 'tenant-1' })).toSucceedWith({
      systemBreakpoints: [10],
      cacheKey: 'tenant-1'
    });
  });

  test('fails loudly, via AiAssist validation, when the derived plan exceeds hints.maxBreakpointWrites', () => {
    const c = composition(
      [
        { kind: 'preface', start: 0, chars: 10, effectiveStability: 'frozen' },
        { kind: 'slot', slot: 'topic' as never, start: 10, chars: 5, effectiveStability: 'per-conversation' },
        { kind: 'template', start: 15, chars: 5, effectiveStability: 'per-request' }
      ],
      20
    );
    // This composition derives two breakpoints ([10, 15]) — cap it at one to exercise the fail-
    // loud path AiAssist.validateCacheBreakpoints enforces (never a silent trim, design.md §6.1).
    expect(toCacheRequest(c, { maxBreakpointWrites: 1 })).toFailWith(/exceeding the cap of 1/i);
  });

  test('succeeds when the derived plan is exactly at hints.maxBreakpointWrites', () => {
    const c = composition(
      [
        { kind: 'preface', start: 0, chars: 10, effectiveStability: 'frozen' },
        { kind: 'slot', slot: 'topic' as never, start: 10, chars: 5, effectiveStability: 'per-request' }
      ],
      15
    );
    expect(toCacheRequest(c, { maxBreakpointWrites: 1 })).toSucceedWith({ systemBreakpoints: [10] });
  });
});
