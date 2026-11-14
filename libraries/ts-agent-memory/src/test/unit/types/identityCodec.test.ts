/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  Convert,
  EntityId,
  KnowledgeIdentityCodec,
  LtmIdentityCodec,
  MemoryScopeKey,
  MtmIdentityCodec,
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

describe('LtmIdentityCodec', () => {
  const codec: LtmIdentityCodec = new LtmIdentityCodec();
  const conversationsScope: MemoryScopeKey = LtmIdentityCodec.scope;

  describe('encode', () => {
    test('maps a conversationId to the flat conversations scope, passthrough stem, non-versioned', () => {
      expect(codec.encode('conv-42' as EntityId)).toSucceedWith({
        scope: conversationsScope,
        idStem: 'conv-42',
        isVersioned: false
      });
    });

    test('fails when the conversationId is not filename-safe', () => {
      expect(codec.encode('conv/42' as EntityId)).toFailWith(/POSIX portable filename set/i);
    });
  });

  describe('decode', () => {
    test('recovers the EntityId from a valid address', () => {
      expect(codec.decode(conversationsScope, 'conv-42')).toSucceedWith('conv-42' as EntityId);
    });

    test('fails when the scope is not the conversations scope', () => {
      expect(codec.decode('knowledge' as MemoryScopeKey, 'conv-42')).toFailWith(
        /does not match expected scope 'conversations'/i
      );
    });

    test('fails when the stem is not filename-safe', () => {
      expect(codec.decode(conversationsScope, 'bad stem')).toFailWith(/POSIX portable filename set/i);
    });
  });

  describe('verifyRoundTrip', () => {
    test('succeeds for a stem that decodes and re-encodes cleanly', () => {
      expect(codec.verifyRoundTrip(conversationsScope, 'conv-42')).toSucceedWith(true);
    });

    test('fails when the scope does not match', () => {
      expect(codec.verifyRoundTrip('knowledge' as MemoryScopeKey, 'conv-42')).toFailWith(
        /does not match expected scope/i
      );
    });
  });

  test('the fixed conversations scope is a valid MemoryScopeKey', () => {
    expect(Convert.scopeKey.convert(LtmIdentityCodec.scope)).toSucceedWith(conversationsScope as never);
  });
});

describe('MtmIdentityCodec', () => {
  const codec: MtmIdentityCodec = new MtmIdentityCodec();

  describe('encode', () => {
    test('maps a <conversationId>:<turnIndex> composite to a per-conversation subtree', () => {
      expect(codec.encode('conv-1:5' as EntityId)).toSucceedWith({
        scope: 'conversations/conv-1' as MemoryScopeKey,
        idStem: 'turn-5',
        isVersioned: false
      });
    });

    test('preserves the turn index verbatim (turn 0)', () => {
      expect(codec.encode('conv-1:0' as EntityId)).toSucceedWith({
        scope: 'conversations/conv-1' as MemoryScopeKey,
        idStem: 'turn-0',
        isVersioned: false
      });
    });

    test('fails when the entity id is not a colon composite', () => {
      expect(codec.encode('conv-1' as EntityId)).toFailWith(/must be a '<conversationId>:<turnIndex>'/i);
    });

    test('fails when the entity id has more than two segments', () => {
      expect(codec.encode('conv-1:5:extra' as EntityId)).toFailWith(
        /must be a '<conversationId>:<turnIndex>'/i
      );
    });

    test('fails when the conversationId is not filename-safe', () => {
      expect(codec.encode('bad id:5' as EntityId)).toFailWith(/conversationId.*POSIX portable filename set/i);
    });

    test('fails when the turn index is not a non-negative integer', () => {
      expect(codec.encode('conv-1:x' as EntityId)).toFailWith(
        /turnIndex 'x' must be a non-negative integer/i
      );
      expect(codec.encode('conv-1:-1' as EntityId)).toFailWith(/must be a non-negative integer/i);
      expect(codec.encode('conv-1:1.5' as EntityId)).toFailWith(/must be a non-negative integer/i);
    });
  });

  describe('decode', () => {
    test('reverses the scope + stem to the composite entity id', () => {
      expect(codec.decode('conversations/conv-1' as MemoryScopeKey, 'turn-5')).toSucceedWith(
        'conv-1:5' as EntityId
      );
    });

    test('fails when the scope is a single segment', () => {
      expect(codec.decode('conversations' as MemoryScopeKey, 'turn-5')).toFailWith(
        /must be 'conversations\/<conversationId>'/i
      );
    });

    test('fails when the scope root segment is wrong', () => {
      expect(codec.decode('knowledge/conv-1' as MemoryScopeKey, 'turn-5')).toFailWith(
        /must be 'conversations\/<conversationId>'/i
      );
    });

    test('fails when the scope has too many segments', () => {
      expect(codec.decode('conversations/conv-1/extra' as MemoryScopeKey, 'turn-5')).toFailWith(
        /must be 'conversations\/<conversationId>'/i
      );
    });

    test('fails when the conversationId in the scope is not filename-safe', () => {
      expect(codec.decode('conversations/bad id' as MemoryScopeKey, 'turn-5')).toFailWith(
        /conversationId.*POSIX portable filename set/i
      );
    });

    test('fails when the stem does not have the turn- prefix', () => {
      expect(codec.decode('conversations/conv-1' as MemoryScopeKey, 'message-5')).toFailWith(
        /must begin with 'turn-'/i
      );
    });

    test('fails when the stem turn index is not an integer', () => {
      expect(codec.decode('conversations/conv-1' as MemoryScopeKey, 'turn-x')).toFailWith(
        /must be a non-negative integer/i
      );
    });
  });

  describe('verifyRoundTrip', () => {
    test('succeeds for a composite key under a conversations/<id> scope', () => {
      expect(codec.verifyRoundTrip('conversations/conv-1' as MemoryScopeKey, 'turn-5')).toSucceedWith(true);
    });

    test('fails when the scope is malformed', () => {
      expect(codec.verifyRoundTrip('conversations' as MemoryScopeKey, 'turn-5')).toFailWith(
        /must be 'conversations\/<conversationId>'/i
      );
    });
  });

  test('encode/decode round-trips the composite key and the conversations/<id> scope', () => {
    const entityId: EntityId = 'conv-9:17' as EntityId;
    expect(codec.encode(entityId)).toSucceedAndSatisfy((addr) => {
      expect(addr.scope).toBe('conversations/conv-9');
      expect(addr.idStem).toBe('turn-17');
      expect(codec.decode(addr.scope, addr.idStem)).toSucceedWith(entityId);
    });
  });
});
