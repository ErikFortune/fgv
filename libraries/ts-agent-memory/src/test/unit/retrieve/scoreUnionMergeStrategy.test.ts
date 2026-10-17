/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  HybridRetriever,
  IIdentityCodec,
  IIdentityCodecResult,
  IIdentityResolver,
  IMemoryRecord,
  IScoreUnionMergeStrategyCreateParams,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryIndex,
  MemoryScopeKey,
  MtmIdentityCodec,
  RecencyRetriever,
  ScoreUnionMergeStrategy,
  Tag,
  TagRetriever,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  envelopeConverter,
  scopedAddressOf
} from '../../../index';

// Every record in these suites except the failure cases is loaded from a real
// `FileTreeMemoryStore`, so the identity the merge resolves is checked against
// records whose scope the store verified on load — not against fixtures that
// merely agree with the codec by construction.

const mtmKind: Kind = 'mtm' as Kind;
const factKind: Kind = 'fact' as Kind;
const knowledgeKind: Kind = 'knowledge' as Kind;

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [mtmKind, new MtmIdentityCodec()],
  [factKind, TemporalIdentityCodec.create('facts').orThrow()],
  [knowledgeKind, new KnowledgeIdentityCodec()]
]);

const writePolicies: ReadonlyMap<Kind, IWritePolicy> = new Map<Kind, IWritePolicy>([
  [factKind, TemporalVersionedPolicy.create().orThrow()]
]);

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function makeStore(): FileTreeMemoryStore {
  const registry = BodyConverterRegistry.create().orThrow();
  for (const kind of codecs.keys()) {
    registry.register(kind, Converters.string);
  }
  // A strictly increasing clock, so every write has a distinct `updated` and the
  // recency tie-break is deterministic.
  let now: number = 0;
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry,
    codecs,
    writePolicies,
    clock: () => ++now
  }).orThrow();
}

/** A candidate record for `put`; the store re-addresses it through the kind's codec. */
function candidate(
  kind: Kind,
  entityId: string,
  id: string,
  body: string,
  tags: ReadonlyArray<string> = []
): IMemoryRecord<unknown> {
  return {
    envelope: {
      id: id as MemoryId,
      entityId: entityId as EntityId,
      kind,
      tags: tags as ReadonlyArray<Tag>,
      links: [],
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' }
    },
    body
  };
}

/** Write an MTM turn under `conversationId` and return it as the store reads it back. */
async function putTurn(
  store: FileTreeMemoryStore,
  conversationId: string,
  turn: number,
  tags: ReadonlyArray<string> = []
): Promise<IMemoryRecord<unknown>> {
  const entityId: string = `${conversationId}:${turn}`;
  const stem: string = new MtmIdentityCodec().encode(entityId as EntityId).orThrow().idStem;
  (await store.put(candidate(mtmKind, entityId, stem, `${conversationId} turn ${turn}`, tags))).orThrow();
  return loaded(store, mtmKind, entityId);
}

/** Read a record back from the store, failing the test if it is absent. */
async function loaded(
  store: FileTreeMemoryStore,
  kind: Kind,
  entityId: string
): Promise<IMemoryRecord<unknown>> {
  const record: IMemoryRecord<unknown> | undefined = (await store.get(kind, entityId as EntityId)).orThrow();
  if (record === undefined) {
    throw new Error(`expected ${kind} '${entityId}' to be stored`);
  }
  return record;
}

/** `scope/id` of each record, as the store addresses it, in merge order. */
function addresses(
  records: ReadonlyArray<IMemoryRecord<unknown>>,
  resolver: IIdentityResolver
): ReadonlyArray<string> {
  return records.map((r) => {
    const address = scopedAddressOf(r, resolver).orThrow();
    return `${address.scope}/${address.id}`;
  });
}

function strategyOver(resolver: IIdentityResolver): ScoreUnionMergeStrategy {
  return ScoreUnionMergeStrategy.create({ identityResolver: resolver }).orThrow();
}

describe('ScoreUnionMergeStrategy — scope-qualified identity', () => {
  describe('create', () => {
    test('succeeds with an identity resolver', () => {
      expect(ScoreUnionMergeStrategy.create({ identityResolver: makeStore() })).toSucceed();
    });

    test('refuses params without an identity resolver', () => {
      const params = {} as unknown as IScoreUnionMergeStrategyCreateParams;
      expect(ScoreUnionMergeStrategy.create(params)).toFailWith(/an identityResolver is required/i);
    });

    test('refuses absent params', () => {
      const params = undefined as unknown as IScoreUnionMergeStrategyCreateParams;
      expect(ScoreUnionMergeStrategy.create(params)).toFailWith(/an identityResolver is required/i);
    });
  });

  describe('records sharing an id across scopes', () => {
    test('two MTM turn-3 records in different conversations both survive within one result set', async () => {
      const store = makeStore();
      const a3 = await putTurn(store, 'conv-a', 3);
      const b3 = await putTurn(store, 'conv-b', 3);
      // The precondition the bug needs: same bare id, different scope.
      expect(a3.envelope.id).toBe(b3.envelope.id);
      expect(strategyOver(store).merge([[a3, b3]])).toSucceedAndSatisfy((records) => {
        // Both score 1, so recency orders them: conv-b was written last.
        expect(addresses(records, store)).toEqual([
          'conversations/conv-b/turn-3',
          'conversations/conv-a/turn-3'
        ]);
      });
    });

    test('two MTM turn-3 records in different conversations both survive across result sets', async () => {
      const store = makeStore();
      const a3 = await putTurn(store, 'conv-a', 3);
      const b3 = await putTurn(store, 'conv-b', 3);
      expect(strategyOver(store).merge([[a3], [b3]])).toSucceedAndSatisfy((records) => {
        // Neither is "found by two retrievers": each scores 1, not one record scoring 2.
        expect(addresses(records, store)).toEqual([
          'conversations/conv-b/turn-3',
          'conversations/conv-a/turn-3'
        ]);
        expect(records.map((r) => r.body)).toEqual(['conv-b turn 3', 'conv-a turn 3']);
      });
    });
  });

  describe('scoring', () => {
    test('repeated copies of one scoped record within a set contribute one score', async () => {
      const store = makeStore();
      const b3 = await putTurn(store, 'conv-b', 3);
      // Written last, so it would win any score tie on recency.
      const a3 = await putTurn(store, 'conv-a', 3);
      // a3 appears three times in one set (score 1); b3 appears once in each of two
      // sets (score 2). If copies counted, a3 would score 3 and rank first.
      expect(strategyOver(store).merge([[a3, a3, a3, b3], [b3]])).toSucceedAndSatisfy((records) => {
        expect(addresses(records, store)).toEqual([
          'conversations/conv-b/turn-3',
          'conversations/conv-a/turn-3'
        ]);
      });
    });

    test('the same scoped record found by two retrievers scores 2', async () => {
      const store = makeStore();
      const a3 = await putTurn(store, 'conv-a', 3);
      const b3 = await putTurn(store, 'conv-b', 3);
      // Two independent reads of conv-a's turn-3, as two retrievers would each
      // materialize it: equal by address, not by object identity.
      const a3Again = await loaded(store, mtmKind, 'conv-a:3');
      expect(a3Again).not.toBe(a3);
      expect(strategyOver(store).merge([[a3], [a3Again, b3]])).toSucceedAndSatisfy((records) => {
        // a3 scores 2 and outranks the newer b3 (score 1).
        expect(addresses(records, store)).toEqual([
          'conversations/conv-a/turn-3',
          'conversations/conv-b/turn-3'
        ]);
      });
    });

    test('distinct versions of one versioned entity stay distinct', async () => {
      const store = makeStore();
      (await store.put(candidate(factKind, 'fact-1', 'fact-1', 'first'))).orThrow();
      (await store.put(candidate(factKind, 'fact-1', 'fact-1', 'second'))).orThrow();
      const versions = (await store.list({ scope: 'facts/entities/fact-1' as MemoryScopeKey })).orThrow();
      expect(versions).toHaveLength(2);
      const [v1, v2] = [...versions].sort((x, y) => x.envelope.seq - y.envelope.seq);
      // Same entity, same scope — only the version id differs. v2 scores 2.
      expect(strategyOver(store).merge([[v1, v2], [v2]])).toSucceedAndSatisfy((records) => {
        expect(records.map((r) => r.envelope.id)).toEqual([v2.envelope.id, v1.envelope.id]);
        expect(new Set(records.map((r) => r.envelope.entityId))).toEqual(new Set(['fact-1']));
      });
    });

    test('flat records still dedupe, score and break ties by recency', async () => {
      const store = makeStore();
      for (const id of ['a', 'b', 'c']) {
        (await store.put(candidate(knowledgeKind, id, id, `doc ${id}`))).orThrow();
      }
      const [a, b, c] = await Promise.all(['a', 'b', 'c'].map((id) => loaded(store, knowledgeKind, id)));
      // b in two sets scores 2; a and c score 1 each and c (written later) wins the tie.
      expect(
        strategyOver(store).merge([
          [a, b],
          [b, c]
        ])
      ).toSucceedAndSatisfy((records) => {
        expect(records.map((r) => r.envelope.id)).toEqual(['b', 'c', 'a']);
      });
    });
  });

  describe('records whose identity cannot be resolved', () => {
    function handBuilt(kind: string, entityId: string, id: string): IMemoryRecord<unknown> {
      return {
        envelope: envelopeConverter
          .convert({
            id,
            entityId,
            kind,
            tags: [],
            links: [],
            created: 0,
            updated: 0,
            seq: 0,
            contentHash: 'h',
            provenance: { source: 'agent' }
          })
          .orThrow(),
        body: 'x'
      };
    }

    test('a record whose kind has no codec fails the merge, naming the kind and entityId', async () => {
      const store = makeStore();
      const a3 = await putTurn(store, 'conv-a', 3);
      const orphan = handBuilt('note', 'note-1', 'note-1');
      expect(strategyOver(store).merge([[a3], [orphan]])).toFailWith(
        /record 'note-1' \(kind 'note', entityId 'note-1'\).*no identity codec registered for kind 'note'/i
      );
    });

    test('a record whose entityId its codec rejects fails the merge', () => {
      const store = makeStore();
      // MTM entity ids are `<conversationId>:<turnIndex>`; this one is not.
      const malformed = handBuilt('mtm', 'not-a-composite', 'turn-1');
      expect(strategyOver(store).merge([[malformed]])).toFailWith(
        /kind 'mtm', entityId 'not-a-composite'.*must be a '<conversationId>:<turnIndex>' composite/i
      );
    });

    test('a resolver that throws fails the merge rather than throwing', () => {
      const throwing: IIdentityResolver = {
        resolveIdentity: (): Result<IIdentityCodecResult> => {
          throw new Error('resolver exploded');
        }
      };
      expect(strategyOver(throwing).merge([[handBuilt('knowledge', 'a', 'a')]])).toFailWith(
        /kind 'knowledge', entityId 'a'.*resolver exploded/i
      );
    });
  });
});

describe('HybridRetriever over a store — the merge sees scoped identity end to end', () => {
  test('turn-3 in two conversations, surfaced by two retrievers, is two records scoring 2 each', async () => {
    const store = makeStore();
    await putTurn(store, 'conv-a', 3, ['hot']);
    await putTurn(store, 'conv-b', 3, ['hot']);
    await putTurn(store, 'conv-a', 4);
    const index = MemoryIndex.create().orThrow();
    index.rebuild((await store.listEntries()).orThrow()).orThrow();
    const hybrid = HybridRetriever.create(
      [
        RecencyRetriever.create({ index, resolver: store }).orThrow(),
        TagRetriever.create({ index, resolver: store }).orThrow()
      ],
      ScoreUnionMergeStrategy.create({ identityResolver: store }).orThrow()
    ).orThrow();
    expect(await hybrid.retrieve({ kind: mtmKind, tag: 'hot' as Tag })).toSucceedAndSatisfy((records) => {
      // Recency (tag-filtered) and Tag both return both turn-3s; each scores 2.
      expect(addresses(records, store)).toEqual([
        'conversations/conv-b/turn-3',
        'conversations/conv-a/turn-3'
      ]);
    });
  });
});
