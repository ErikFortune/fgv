/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Convert } from '../../../packlets/types';

describe('branded id converters', () => {
  describe('shared hygiene', () => {
    test.each([
      ['memoryId', Convert.memoryId],
      ['entityId', Convert.entityId],
      ['kind', Convert.kind],
      ['tag', Convert.tag],
      ['scopeKey', Convert.scopeKey],
      ['linkType', Convert.linkType]
    ] as const)('%s rejects an empty string', (__name, converter) => {
      expect(converter.convert('')).toFailWith(/must be a non-empty string/i);
    });

    test.each([
      ['memoryId', Convert.memoryId],
      ['entityId', Convert.entityId],
      ['kind', Convert.kind],
      ['tag', Convert.tag],
      ['scopeKey', Convert.scopeKey],
      ['linkType', Convert.linkType]
    ] as const)('%s rejects a value over the length cap', (__name, converter) => {
      expect(converter.convert('a'.repeat(257))).toFailWith(/exceeds maximum length 256/i);
    });

    test.each([
      ['memoryId', Convert.memoryId],
      ['entityId', Convert.entityId],
      ['kind', Convert.kind],
      ['tag', Convert.tag],
      ['scopeKey', Convert.scopeKey],
      ['linkType', Convert.linkType]
    ] as const)('%s rejects leading/trailing whitespace', (__name, converter) => {
      expect(converter.convert(' value ')).toFailWith(/leading or trailing whitespace/i);
    });

    test.each([
      ['memoryId', Convert.memoryId],
      ['entityId', Convert.entityId],
      ['kind', Convert.kind],
      ['tag', Convert.tag],
      ['scopeKey', Convert.scopeKey],
      ['linkType', Convert.linkType]
    ] as const)('%s rejects a non-string', (__name, converter) => {
      expect(converter.convert(42)).toFail();
    });

    test.each([
      ['memoryId', Convert.memoryId, 'doc-123'],
      ['entityId', Convert.entityId, 'doc-123'],
      ['kind', Convert.kind, 'knowledge'],
      ['tag', Convert.tag, 'topic:rust'],
      ['scopeKey', Convert.scopeKey, 'knowledge'],
      ['linkType', Convert.linkType, 'mtm-ref']
    ] as const)('%s accepts a valid value at the length cap boundary', (__name, converter, value) => {
      expect(converter.convert(value)).toSucceedWith(value as never);
      expect(converter.convert('a'.repeat(256))).toSucceedWith('a'.repeat(256) as never);
    });
  });

  describe('relaxed-constraint brands', () => {
    test('scopeKey accepts a multi-segment, slash-separated path', () => {
      expect(Convert.scopeKey.convert('conversations/conv-1')).toSucceedWith('conversations/conv-1' as never);
    });

    test('entityId accepts a colon-separated composite key', () => {
      expect(Convert.entityId.convert('conv-1:7')).toSucceedWith('conv-1:7' as never);
    });
  });

  describe('memoryId filename-stem constraint', () => {
    test('accepts a portable filename stem', () => {
      expect(Convert.memoryId.convert('intro-to-rust.v2')).toSucceedWith('intro-to-rust.v2' as never);
    });

    test('rejects path-unsafe ids that the relaxed brands accept (id IS the filename stem)', () => {
      expect(Convert.memoryId.convert('a/b')).toFailWith(/POSIX portable filename set/i);
      expect(Convert.memoryId.convert('conv-1:7')).toFailWith(/POSIX portable filename set/i);
      // sanity: EntityId stays relaxed for the same composite domain key
      expect(Convert.entityId.convert('conv-1:7')).toSucceed();
    });

    test('still applies the shared hygiene before the stem check', () => {
      expect(Convert.memoryId.convert('')).toFailWith(/must be a non-empty string/i);
    });
  });
});
