/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  Convert,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IIdentityCodecResult,
  IMemoryRecord,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryScopeKey,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  envelopeConverter
} from '../../../index';

const kindA: Kind = 'kind-a' as Kind;
const kindB: Kind = 'kind-b' as Kind;

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function record(id: string, kind: Kind, body: string, entityId?: string): IMemoryRecord<unknown> {
  return {
    envelope: envelopeConverter
      .convert({
        id,
        entityId: entityId ?? id,
        kind,
        tags: [],
        links: [],
        created: 0,
        updated: 0,
        seq: 0,
        contentHash: '',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body
  };
}

/**
 * A codec that files every entity under one shared scope with a per-kind stem
 * prefix. Two kinds wired with different prefixes share a scope and can never
 * collide — the LEGAL configuration a coarser scope-equality check would reject.
 */
class PrefixedCodec implements IIdentityCodec {
  private readonly _prefix: string;
  public constructor(prefix: string) {
    this._prefix = prefix;
  }
  public encode(entityId: EntityId): Result<IIdentityCodecResult> {
    return succeed({
      scope: 'shared' as MemoryScopeKey,
      idStem: `${this._prefix}-${entityId}`,
      isVersioned: false
    });
  }
  public decode(__scope: MemoryScopeKey, encodedStem: string): Result<EntityId> {
    return Convert.entityId.convert(encodedStem.slice(this._prefix.length + 1));
  }
  public verifyRoundTrip(scope: MemoryScopeKey, encodedStem: string): Result<true> {
    return this.decode(scope, encodedStem).onSuccess(() => succeed(true));
  }
}

function storeWith(
  codecs: ReadonlyMap<Kind, IIdentityCodec>,
  policies?: ReadonlyMap<Kind, IWritePolicy>
): FileTreeMemoryStore {
  const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
  registry.register(kindA, Converters.string);
  registry.register(kindB, Converters.string);
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry,
    codecs,
    writePolicies: policies
  }).orThrow();
}

/** Two kinds whose codecs mint the SAME address for the same entity id. */
function collidingStore(): FileTreeMemoryStore {
  return storeWith(
    new Map<Kind, IIdentityCodec>([
      [kindA, new KnowledgeIdentityCodec()],
      [kindB, new KnowledgeIdentityCodec()]
    ])
  );
}

describe('FileTreeMemoryStore — two kinds colliding on one address', () => {
  describe('flat path', () => {
    test('the second kind’s write fails instead of silently updating the first record', async () => {
      // Without the guard this is NOT an overwrite: the store reads the occupant,
      // the policy merge rebuilds it as { ...existing.envelope, body: patched },
      // and the victim keeps its own kind while taking the intruder's body. The
      // write cannot look wrong, because `kind` is immutable to every policy.
      const store = collidingStore();
      (await store.put(record('acme', kindA, 'kind A body'))).orThrow();

      expect(await store.put(record('acme', kindB, 'kind B body'))).toFailWith(
        /occupied by a record of kind 'kind-a', not 'kind-b'/i
      );

      // The victim is untouched: still its own kind, still its own body.
      expect(await store.get(kindA, 'acme' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.envelope.kind).toBe(kindA);
          expect(got?.body).toBe('kind A body');
        }
      );
    });

    test('a read through the wrong kind fails rather than returning the other kind’s record', async () => {
      const store = collidingStore();
      (await store.put(record('acme', kindA, 'kind A body'))).orThrow();
      expect(await store.get(kindB, 'acme' as EntityId)).toFailWith(/occupied by a record of kind 'kind-a'/i);
    });

    test('a delete through the wrong kind fails rather than deleting the other kind’s record', async () => {
      // The sharpest consequence: without this, delete(kindB, id) removes a kindA
      // record through a typed API that looks entirely correct.
      const store = collidingStore();
      (await store.put(record('acme', kindA, 'kind A body'))).orThrow();

      expect(await store.delete(kindB, 'acme' as EntityId)).toFailWith(
        /occupied by a record of kind 'kind-a'/i
      );
      expect(await store.get(kindA, 'acme' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.body).toBe('kind A body');
        }
      );
    });
  });

  describe('versioned path', () => {
    /** Two temporal kinds sharing one base scope collide on the entity subtree. */
    function collidingTemporalStore(): FileTreeMemoryStore {
      const codec: IIdentityCodec = TemporalIdentityCodec.create('facts').orThrow();
      return storeWith(
        new Map<Kind, IIdentityCodec>([
          [kindA, codec],
          [kindB, codec]
        ]),
        new Map<Kind, IWritePolicy>([
          [kindA, TemporalVersionedPolicy.create().orThrow()],
          [kindB, TemporalVersionedPolicy.create().orThrow()]
        ])
      );
    }

    test('the intruder fails instead of adopting and invalidating the victim’s version history', async () => {
      // Worse than the flat case: the versioned write derives the entity's history
      // from a scope scan, so an unguarded intruder reads the victim's versions as
      // its own and INVALIDATES them before minting a version alongside.
      const store = collidingTemporalStore();
      (await store.put(record('fact-1', kindA, 'v1 body'))).orThrow();
      (await store.put(record('fact-1', kindA, 'v2 body'))).orThrow();

      expect(await store.put(record('fact-1', kindB, 'intruder body'))).toFailWith(
        /occupied by a record of kind 'kind-a', not 'kind-b'/i
      );

      // The victim's current version is still v2 and still current — nothing was
      // invalidated on its behalf.
      expect(await store.get(kindA, 'fact-1' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.body).toBe('v2 body');
          expect(got?.envelope.kind).toBe(kindA);
        }
      );
    });

    test('a versioned delete through the wrong kind fails', async () => {
      const store = collidingTemporalStore();
      (await store.put(record('fact-1', kindA, 'v1 body'))).orThrow();
      expect(await store.delete(kindB, 'fact-1' as EntityId)).toFailWith(
        /occupied by a record of kind 'kind-a'/i
      );
      expect(await store.get(kindA, 'fact-1' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.body).toBe('v1 body');
        }
      );
    });
  });

  describe('what the guard must NOT reject', () => {
    test('two kinds sharing one scope with disjoint stems both work', async () => {
      // The consumer's control case, and the reason a scope-equality check is the
      // wrong shape: scope equality is not SUFFICIENT to imply a collision, so a
      // coarser guard would reject this entirely legal configuration.
      const store = storeWith(
        new Map<Kind, IIdentityCodec>([
          [kindA, new PrefixedCodec('a')],
          [kindB, new PrefixedCodec('b')]
        ])
      );

      // The store requires `envelope.id === codec-derived stem`, so the record's
      // id is the PREFIXED stem while `entityId` stays the domain key.
      expect(await store.put(record('a-acme', kindA, 'body A', 'acme'))).toSucceed();
      expect(await store.put(record('b-acme', kindB, 'body B', 'acme'))).toSucceed();
      expect(await store.get(kindA, 'acme' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.body).toBe('body A');
          expect(got?.envelope.kind).toBe(kindA);
        }
      );
      expect(await store.get(kindB, 'acme' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.body).toBe('body B');
          expect(got?.envelope.kind).toBe(kindB);
        }
      );
    });

    test('getById stays address-first and unguarded', async () => {
      // `getById` takes a raw address with no kind in play. Guarding it would be
      // wrong: there is no expectation to check against.
      const store = collidingStore();
      (await store.put(record('acme', kindA, 'kind A body'))).orThrow();
      expect(await store.getById(KnowledgeIdentityCodec.scope, 'acme' as MemoryId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.envelope.kind).toBe(kindA);
        }
      );
    });
  });
});
