/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { MemoryScopeKey, defaultMemoryScopeEncoding } from '../../../index';

describe('defaultMemoryScopeEncoding', () => {
  test('passes a single portable segment through', () => {
    expect(defaultMemoryScopeEncoding('knowledge' as MemoryScopeKey)).toSucceedWith('knowledge');
  });

  test('validates and rejoins a multi-segment scope', () => {
    expect(defaultMemoryScopeEncoding('conversations/conv-1' as MemoryScopeKey)).toSucceedWith(
      'conversations/conv-1'
    );
  });

  test('rejects a segment outside the portable filename set', () => {
    expect(defaultMemoryScopeEncoding('conversations/bad:seg' as MemoryScopeKey)).toFailWith(
      /portable filename set/i
    );
  });

  test('rejects an empty path segment', () => {
    expect(defaultMemoryScopeEncoding('conversations//c1' as MemoryScopeKey)).toFailWith(
      /empty path segment/i
    );
  });

  test('rejects a reserved Windows device segment', () => {
    expect(defaultMemoryScopeEncoding('conversations/CON' as MemoryScopeKey)).toFailWith(
      /reserved Windows device/i
    );
  });
});
