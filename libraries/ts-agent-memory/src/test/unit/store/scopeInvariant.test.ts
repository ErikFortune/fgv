/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, fail, succeed } from '@fgv/ts-utils';
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
  ITemporalIdentityCodec,
  ITemporalVersionAddress,
  Kind,
  MemoryId,
  MemoryScopeKey,
  TemporalIdentityCodec,
  joinFrontmatter,
  scanEveryRecord
} from '../../../index';

/*
 * The store's scope invariant: every record it returns was read from
 * `codec(kind).encode(entityId).scope`. The codec contract does not ask
 * `verifyRoundTrip` to check scope, so these fixtures deliberately use codecs
 * whose `decode` IGNORES the scope — the shape that, without the store-level
 * check, loads a file placed under a foreign scope.
 */

const noteKind: Kind = 'note' as Kind;
const eventKind: Kind = 'event' as Kind;

/**
 * Flat, scope-blind: files everything under `shared`, decodes from the stem alone,
 * and accepts any `<prefix>-` stem, so `verifyRoundTrip` does not check idStem either.
 */
class ScopeBlindCodec implements IIdentityCodec {
  public encode(entityId: EntityId): Result<IIdentityCodecResult> {
    if (entityId === 'unencodable') {
      return fail(`scope-blind codec: entityId '${entityId}' cannot be encoded`);
    }
    return succeed({ scope: 'shared' as MemoryScopeKey, idStem: `p-${entityId}`, isVersioned: false });
  }
  public decode(__scope: MemoryScopeKey, encodedStem: string): Result<EntityId> {
    return Convert.entityId.convert(encodedStem.slice(encodedStem.indexOf('-') + 1));
  }
  public verifyRoundTrip(scope: MemoryScopeKey, encodedStem: string): Result<true> {
    return this.decode(scope, encodedStem).onSuccess(() => succeed(true));
  }
}

/** Versioned, scope-blind: the shipped layout, but recovers the entity id from the stem. */
class ScopeBlindTemporalCodec implements ITemporalIdentityCodec {
  private readonly _inner: TemporalIdentityCodec = TemporalIdentityCodec.create('events').orThrow();
  public encode(entityId: EntityId): Result<IIdentityCodecResult> {
    return this._inner.encode(entityId);
  }
  public encodeVersion(entityId: EntityId, seq: number): Result<string> {
    return this._inner.encodeVersion(entityId, seq);
  }
  public decodeVersion(__scope: MemoryScopeKey, stem: string): Result<ITemporalVersionAddress> {
    const cut: number = stem.lastIndexOf(TemporalIdentityCodec.versionInfix);
    return Convert.entityId
      .convert(stem.slice(0, cut))
      .onSuccess((entityId) =>
        succeed({
          entityId,
          seq: Number.parseInt(stem.slice(cut + TemporalIdentityCodec.versionInfix.length), 10)
        })
      );
  }
  public decode(scope: MemoryScopeKey, stem: string): Result<EntityId> {
    return this.decodeVersion(scope, stem).onSuccess((addr) => succeed(addr.entityId));
  }
  public verifyRoundTrip(scope: MemoryScopeKey, stem: string): Result<true> {
    return this.decodeVersion(scope, stem).onSuccess(() => succeed(true));
  }
}

interface ISeedFile {
  readonly path: string;
  readonly contents: string;
}

/** Serialize a record of `kind` at `<scope>/<stem>.md` declaring `entityId`. */
function recordFile(kind: Kind, scope: string, stem: string, entityId: string): ISeedFile {
  const envelope = {
    id: stem,
    entityId,
    kind,
    tags: [],
    links: [],
    created: 1,
    updated: 1,
    seq: 1,
    contentHash: 'seed',
    provenance: { source: 'agent' },
    // A versioned kind's current version is the one with no `invalid_at`.
    ...(kind === eventKind ? { temporal: { valid_at: 1, invalid_at: null } } : {})
  };
  const frontmatter = Object.entries(envelope)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  return { path: `${scope}/${stem}.md`, contents: joinFrontmatter(frontmatter, `body of ${stem}`) };
}

function mutableRoot(files: ReadonlyArray<ISeedFile>): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([...files], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function registry(): IBodyConverterRegistry {
  const created = BodyConverterRegistry.create().orThrow();
  created.register(noteKind, Converters.string);
  created.register(eventKind, Converters.string);
  return created;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [noteKind, new ScopeBlindCodec()],
  [eventKind, new ScopeBlindTemporalCodec()]
]);

function open(files: ReadonlyArray<ISeedFile>, onRecordError?: 'fail' | 'skip'): Result<FileTreeMemoryStore> {
  return FileTreeMemoryStore.create({
    root: mutableRoot(files),
    registry: registry(),
    codecs,
    onRecordError
  });
}

const wellPlacedNote: ISeedFile = recordFile(noteKind, 'shared', 'p-acme', 'acme');
// Same envelope, same stem — but under a scope the codec would never produce.
const foreignNote: ISeedFile = recordFile(noteKind, 'elsewhere', 'p-acme', 'acme');
const wellPlacedEvent: ISeedFile = recordFile(eventKind, 'events/entities/launch', 'launch-v1', 'launch');
// A version file filed under ANOTHER entity's subtree.
const foreignEvent: ISeedFile = recordFile(eventKind, 'events/entities/other', 'launch-v1', 'launch');

describe('FileTreeMemoryStore scope invariant (scope == codec(kind).encode(entityId).scope)', () => {
  describe('well-placed records still load', () => {
    test('a flat kind loads from the scope its codec derives', async () => {
      const store = open([wellPlacedNote]).orThrow();
      expect(await store.get(noteKind, 'acme' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.envelope.id).toBe('p-acme');
          expect(got?.body).toBe('body of p-acme');
        }
      );
      expect(await store.getById('shared' as MemoryScopeKey, 'p-acme' as MemoryId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.envelope.entityId).toBe('acme');
        }
      );
    });

    test('a versioned kind loads from its entity subtree', async () => {
      const store = open([wellPlacedEvent]).orThrow();
      expect(await store.get(eventKind, 'launch' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.envelope.id).toBe('launch-v1');
        }
      );
      expect(
        await store.getById('events/entities/launch' as MemoryScopeKey, 'launch-v1' as MemoryId)
      ).toSucceedAndSatisfy((got: IMemoryRecord<unknown> | undefined) => {
        expect(got?.envelope.entityId).toBe('launch');
      });
    });
  });

  describe('open-time walk', () => {
    test("'fail' mode rejects a flat record read from a foreign scope", () => {
      expect(open([wellPlacedNote, foreignNote])).toFailWith(
        /elsewhere\/p-acme\.md'.*read from scope 'elsewhere', but its codec derives scope 'shared' for entityId 'acme'/i
      );
    });

    test("'fail' mode rejects a version file read from another entity's subtree", () => {
      expect(open([foreignEvent])).toFailWith(
        /read from scope 'events\/entities\/other', but its codec derives scope 'events\/entities\/launch'/i
      );
    });

    test("'skip' mode quarantines the foreign-scope files and keeps the well-placed ones", async () => {
      const store = open([wellPlacedNote, foreignNote, wellPlacedEvent, foreignEvent], 'skip').orThrow();
      expect(store.skippedRecords.map((s) => s.path).sort()).toEqual([
        'elsewhere/p-acme.md',
        'events/entities/other/launch-v1.md'
      ]);
      for (const skip of store.skippedRecords) {
        expect(skip.error).toMatch(/but its codec derives scope/i);
      }
      expect(await store.list(scanEveryRecord())).toSucceedAndSatisfy(
        (listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(listed.map((r) => r.envelope.id).sort()).toEqual(['launch-v1', 'p-acme']);
        }
      );
    });

    test("'fail' mode rejects a flat record whose stem is not the codec's idStem", () => {
      // Decodes to 'acme' and sits in the right scope, but encode('acme') is 'p-acme'.
      const misnamed: ISeedFile = recordFile(noteKind, 'shared', 'q-acme', 'acme');
      expect(open([misnamed])).toFailWith(
        /shared\/q-acme\.md'.*read as 'q-acme', but its codec derives idStem 'p-acme' for entityId 'acme'/i
      );
    });

    test("'fail' mode rejects a version file whose stem is not the codec's version stem", () => {
      // Decodes to (launch, 1) and sits in the right subtree, but encodeVersion('launch', 1) is 'launch-v1'.
      const misnamed: ISeedFile = recordFile(eventKind, 'events/entities/launch', 'launch-v01', 'launch');
      expect(open([misnamed])).toFailWith(
        /launch-v01\.md'.*read as 'launch-v01', but its codec derives version stem 'launch-v1' for entityId 'launch'/i
      );
    });

    test('a codec that reports a versioned layout without version methods is refused', () => {
      const flatPretendingVersioned: IIdentityCodec = {
        encode: (entityId: EntityId) =>
          succeed({ scope: 'shared' as MemoryScopeKey, idStem: `p-${entityId}`, isVersioned: true }),
        decode: (__scope: MemoryScopeKey, stem: string) => Convert.entityId.convert(stem.slice(2)),
        verifyRoundTrip: () => succeed(true)
      };
      const store = FileTreeMemoryStore.create({
        root: mutableRoot([wellPlacedNote]),
        registry: registry(),
        codecs: new Map<Kind, IIdentityCodec>([[noteKind, flatPretendingVersioned]])
      });
      expect(store).toFailWith(/reports a versioned layout for entityId 'acme' but has no version methods/i);
    });

    test('an entity id the codec cannot encode is reported with the file context', () => {
      const unencodable: ISeedFile = recordFile(noteKind, 'shared', 'p-unencodable', 'unencodable');
      expect(open([unencodable])).toFailWith(
        /memory file '.*shared\/p-unencodable\.md': scope-blind codec: entityId 'unencodable' cannot be encoded/i
      );
    });
  });

  describe('direct reads', () => {
    test('getById refuses a flat record at a foreign scope', async () => {
      // The skip-mode open quarantines the file, but it is still on disk — a
      // direct address-first read must refuse it too, not just the walk.
      const store = open([foreignNote], 'skip').orThrow();
      expect(await store.getById('elsewhere' as MemoryScopeKey, 'p-acme' as MemoryId)).toFailWith(
        /read from scope 'elsewhere', but its codec derives scope 'shared'/i
      );
      expect(store.resolveRecord('elsewhere' as MemoryScopeKey, 'p-acme' as MemoryId)).toFailWith(
        /but its codec derives scope 'shared'/i
      );
    });

    test('getById refuses a flat record whose stem is not the codec idStem', async () => {
      const misnamed: ISeedFile = recordFile(noteKind, 'shared', 'q-acme', 'acme');
      const store = open([misnamed], 'skip').orThrow();
      expect(await store.getById('shared' as MemoryScopeKey, 'q-acme' as MemoryId)).toFailWith(
        /but its codec derives idStem 'p-acme'/i
      );
      expect(await store.get(noteKind, 'acme' as EntityId)).toSucceedWith(undefined);
    });

    test('getById refuses a version file under another entity subtree', async () => {
      const store = open([foreignEvent], 'skip').orThrow();
      expect(
        await store.getById('events/entities/other' as MemoryScopeKey, 'launch-v1' as MemoryId)
      ).toFailWith(/but its codec derives scope 'events\/entities\/launch'/i);
    });
  });
});
