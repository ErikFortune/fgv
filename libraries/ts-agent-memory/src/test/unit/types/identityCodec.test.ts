/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  Convert,
  EntityId,
  KnowledgeIdentityCodec,
  MemoryScopeKey,
  assertPortableFilenameStem
} from '../../../packlets/types';

describe('assertPortableFilenameStem', () => {
  test('accepts a POSIX portable filename stem', () => {
    expect(assertPortableFilenameStem('intro-to-rust.v2')).toSucceedWith('intro-to-rust.v2');
  });

  test('rejects an empty stem', () => {
    expect(assertPortableFilenameStem('')).toFailWith(/must be a non-empty string/i);
  });

  test('rejects a leading dot', () => {
    expect(assertPortableFilenameStem('.hidden')).toFailWith(/may not begin with '\.'/i);
  });

  test('rejects a trailing dot (Windows strips trailing dots)', () => {
    expect(assertPortableFilenameStem('topic.')).toFailWith(/may not end with '\.'/i);
  });

  test('rejects characters outside the portable set', () => {
    expect(assertPortableFilenameStem('has/slash')).toFailWith(/POSIX portable filename set/i);
    expect(assertPortableFilenameStem('has space')).toFailWith(/POSIX portable filename set/i);
  });

  test('rejects a reserved Windows device basename (case-insensitive, with extension)', () => {
    expect(assertPortableFilenameStem('CON')).toFailWith(/reserved Windows device name/i);
    expect(assertPortableFilenameStem('con.md')).toFailWith(/reserved Windows device name/i);
    expect(assertPortableFilenameStem('COM1')).toFailWith(/reserved Windows device name/i);
    expect(assertPortableFilenameStem('lpt0.txt')).toFailWith(/reserved Windows device name/i);
  });

  test('rejects the 0-suffixed device variants (Windows 11 / Server 2022)', () => {
    expect(assertPortableFilenameStem('COM0')).toFailWith(/reserved Windows device name/i);
    expect(assertPortableFilenameStem('LPT0')).toFailWith(/reserved Windows device name/i);
    expect(assertPortableFilenameStem('COM9')).toFailWith(/reserved Windows device name/i);
  });
});

describe('KnowledgeIdentityCodec', () => {
  const codec: KnowledgeIdentityCodec = new KnowledgeIdentityCodec();
  const knowledgeScope: MemoryScopeKey = KnowledgeIdentityCodec.scope;

  describe('encode', () => {
    test('maps a docId to the flat knowledge scope, passthrough stem, non-versioned', () => {
      expect(codec.encode('intro-to-rust' as EntityId)).toSucceedWith({
        scope: knowledgeScope,
        idStem: 'intro-to-rust',
        isVersioned: false
      });
    });

    test('fails when the docId is not filename-safe', () => {
      expect(codec.encode('bad/id' as EntityId)).toFailWith(/POSIX portable filename set/i);
    });
  });

  describe('decode', () => {
    test('recovers the EntityId from a valid address', () => {
      expect(codec.decode(knowledgeScope, 'intro-to-rust')).toSucceedWith('intro-to-rust' as EntityId);
    });

    test('fails when the scope is not the knowledge scope', () => {
      expect(codec.decode('conversations' as MemoryScopeKey, 'intro-to-rust')).toFailWith(
        /does not match expected scope 'knowledge'/i
      );
    });

    test('fails when the stem is not filename-safe', () => {
      expect(codec.decode(knowledgeScope, 'bad stem')).toFailWith(/POSIX portable filename set/i);
    });
  });

  describe('verifyRoundTrip', () => {
    test('succeeds for a stem that decodes and re-encodes cleanly', () => {
      expect(codec.verifyRoundTrip(knowledgeScope, 'intro-to-rust')).toSucceedWith(true);
    });

    test('fails when the stem cannot be decoded', () => {
      expect(codec.verifyRoundTrip(knowledgeScope, 'bad stem')).toFailWith(/POSIX portable filename set/i);
    });

    test('fails when the scope does not match', () => {
      expect(codec.verifyRoundTrip('conversations' as MemoryScopeKey, 'intro-to-rust')).toFailWith(
        /does not match expected scope/i
      );
    });
  });

  test('the fixed knowledge scope is a valid MemoryScopeKey', () => {
    expect(Convert.scopeKey.convert(KnowledgeIdentityCodec.scope)).toSucceedWith(knowledgeScope as never);
  });
});
