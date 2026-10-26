/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, captureResult, fail, mapResults, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  Convert,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IFileTreeMemoryStoreCreateParams,
  IIdentityCodec,
  IMemoryRecord,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryScopeKey,
  MtmIdentityCodec,
  RankProjector,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  envelopeConverter,
  joinFrontmatter,
  scanEveryRecord
} from '../../../index';

/*
 * A non-identity `scopeEncoding` paired with its `scopeDecoding`. The open-time
 * walk decodes each directory that holds records, so a vault written under an
 * encoding reopens with every record reachable by the scope it was written to.
 */

const knowledgeKind: Kind = 'knowledge' as Kind;
const mtmKind: Kind = 'mtm' as Kind;
const PREFIX: string = 's-';

/** Per-segment prefix: `conversations/c1` ↔ `s-conversations/s-c1`. */
function prefixEncoding(scope: MemoryScopeKey): Result<string> {
  return succeed(
    scope
      .split('/')
      .map((segment) => `${PREFIX}${segment}`)
      .join('/')
  );
}

function prefixDecoding(encoded: string): Result<MemoryScopeKey> {
  return mapResults(
    encoded
      .split('/')
      .map((segment) =>
        segment.startsWith(PREFIX)
          ? succeed(segment.slice(PREFIX.length))
          : fail<string>(`segment '${segment}' lacks the '${PREFIX}' prefix`)
      )
  ).onSuccess((segments) => Convert.scopeKey.convert(segments.join('/')));
}

/** Whole-scope percent-encoding: `conversations/c1` ↔ the single segment `conversations%2Fc1`. */
function percentEncoding(scope: MemoryScopeKey): Result<string> {
  return succeed(encodeURIComponent(scope));
}

function percentDecoding(encoded: string): Result<MemoryScopeKey> {
  return captureResult(() => decodeURIComponent(encoded)).onSuccess((decoded) =>
    Convert.scopeKey.convert(decoded)
  );
}

function makeRecord(kind: Kind, id: string, entityId: string, body: string): IMemoryRecord<unknown> {
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
        contentHash: '',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body
  };
}

/** A serialized knowledge file for seeding a vault directly. */
function knowledgeFile(path: string, id: string): { path: string; contents: string } {
  const envelope = {
    id,
    entityId: id,
    kind: 'knowledge',
    tags: [],
    links: [],
    created: 1,
    updated: 1,
    seq: 1,
    contentHash: 'seed',
    provenance: { source: 'agent' }
  };
  const frontmatter = Object.entries(envelope)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  return { path, contents: joinFrontmatter(frontmatter, `body of ${id}`) };
}

function mutableRoot(
  files: ReadonlyArray<{ path: string; contents: string }> = []
): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([...files], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function registry(): IBodyConverterRegistry {
  const created = BodyConverterRegistry.create().orThrow();
  created.register(knowledgeKind, Converters.string);
  created.register(mtmKind, Converters.string);
  return created;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [knowledgeKind, new KnowledgeIdentityCodec()],
  [mtmKind, new MtmIdentityCodec()]
]);

type ScopeParams = Pick<
  IFileTreeMemoryStoreCreateParams,
  'scopeEncoding' | 'scopeDecoding' | 'onRecordError' | 'rankProjectors'
>;

function open(
  root: FileTree.IMutableFileTreeDirectoryItem,
  params: ScopeParams
): Result<FileTreeMemoryStore> {
  return FileTreeMemoryStore.create({ root, registry: registry(), codecs, clock: () => 1000, ...params });
}

/** Write one knowledge record and two MTM turns through `params`, returning the root. */
async function writeVault(params: ScopeParams): Promise<FileTree.IMutableFileTreeDirectoryItem> {
  const root = mutableRoot();
  const store = open(root, params).orThrow();
  (await store.put(makeRecord(knowledgeKind, 'intro', 'intro', 'hello'))).orThrow();
  (await store.put(makeRecord(mtmKind, 'turn-1', 'c1:1', 'first turn'))).orThrow();
  (await store.put(makeRecord(mtmKind, 'turn-2', 'c1:2', 'second turn'))).orThrow();
  store.dispose();
  return root;
}

function childNames(dir: FileTree.IFileTreeDirectoryItem): ReadonlyArray<string> {
  return dir
    .getChildren()
    .orThrow()
    .map((c) => c.name)
    .sort();
}

/** The scope layout at the root: its children, less the store's own seq high-water file. */
function scopeLayout(root: FileTree.IFileTreeDirectoryItem): ReadonlyArray<string> {
  return childNames(root).filter((name) => name !== 'memory-store.seq.json');
}

describe('FileTreeMemoryStore scopeDecoding', () => {
  describe('a vault written under a non-identity encoding reopens', () => {
    const pairs: ReadonlyArray<[string, ScopeParams, ReadonlyArray<string>]> = [
      [
        'per-segment prefix',
        { scopeEncoding: prefixEncoding, scopeDecoding: prefixDecoding },
        ['s-conversations', 's-knowledge']
      ],
      [
        'whole-scope percent-encoding',
        { scopeEncoding: percentEncoding, scopeDecoding: percentDecoding },
        ['conversations%2Fc1', 'knowledge']
      ]
    ];

    test.each(pairs)(
      '%s: every record is retrievable by get, getById and list',
      async (__name, params, dirs) => {
        const root = await writeVault(params);
        expect(scopeLayout(root)).toEqual(dirs);

        const store = open(root, params).orThrow();
        expect(store.skippedRecords).toEqual([]);
        expect(await store.get(knowledgeKind, 'intro' as EntityId)).toSucceedAndSatisfy(
          (got: IMemoryRecord<unknown> | undefined) => {
            expect(got?.body).toBe('hello');
          }
        );
        expect(await store.get(mtmKind, 'c1:2' as EntityId)).toSucceedAndSatisfy(
          (got: IMemoryRecord<unknown> | undefined) => {
            expect(got?.body).toBe('second turn');
          }
        );
        expect(
          await store.getById('conversations/c1' as MemoryScopeKey, 'turn-1' as MemoryId)
        ).toSucceedAndSatisfy((got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.envelope.entityId).toBe('c1:1');
        });
        expect(store.resolveRecord('knowledge' as MemoryScopeKey, 'intro' as MemoryId)).toSucceedAndSatisfy(
          (got: IMemoryRecord<unknown> | undefined) => {
            expect(got?.body).toBe('hello');
          }
        );
        expect(await store.list({ scope: 'conversations/c1' as MemoryScopeKey })).toSucceedAndSatisfy(
          (listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
            expect(listed.map((r) => r.envelope.id).sort()).toEqual(['turn-1', 'turn-2']);
          }
        );
        expect(await store.listScoped()).toSucceedAndSatisfy((scoped) => {
          expect(scoped.map((s) => `${s.target.scope}|${s.record.envelope.id}`).sort()).toEqual([
            'conversations/c1|turn-1',
            'conversations/c1|turn-2',
            'knowledge|intro'
          ]);
        });
      }
    );

    test('the reopened store updates and deletes in place', async () => {
      const params: ScopeParams = { scopeEncoding: prefixEncoding, scopeDecoding: prefixDecoding };
      const root = await writeVault(params);
      const store = open(root, params).orThrow();
      expect(await store.put(makeRecord(knowledgeKind, 'intro', 'intro', 'revised'))).toSucceed();
      expect(await store.delete(mtmKind, 'c1:1' as EntityId)).toSucceedWith('turn-1' as MemoryId);

      store.dispose();
      const reopened = open(root, params).orThrow();
      expect(await reopened.list(scanEveryRecord())).toSucceedAndSatisfy(
        (listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(listed.map((r) => `${r.envelope.id}:${String(r.body)}`).sort()).toEqual([
            'intro:revised',
            'turn-2:second turn'
          ]);
        }
      );
    });

    test('reconcile rewrites records under their encoded directories', async () => {
      const params: ScopeParams = { scopeEncoding: prefixEncoding, scopeDecoding: prefixDecoding };
      const root = await writeVault(params);
      const store = open(root, {
        ...params,
        rankProjectors: new Map<Kind, RankProjector>([[mtmKind, (r) => String(r.body).length]])
      }).orThrow();
      expect(await store.reconcile(mtmKind, 'rank')).toSucceedAndSatisfy((report) => {
        expect(report.examined).toBe(2);
        expect(report.repaired).toBe(2);
      });
      expect(await store.get(mtmKind, 'c1:1' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.envelope.rank).toBe('first turn'.length);
        }
      );
    });
  });

  describe('pairing at create', () => {
    test('an encoding without a decoding is refused', () => {
      expect(open(mutableRoot(), { scopeEncoding: prefixEncoding })).toFailWith(
        /scopeEncoding requires scopeDecoding/i
      );
    });

    test('a decoding alone pairs with the default encoding', async () => {
      const params: ScopeParams = { scopeDecoding: (encoded) => Convert.scopeKey.convert(encoded) };
      const root = await writeVault(params);
      expect(scopeLayout(root)).toEqual(['conversations', 'knowledge']);
      expect(open(root, params)).toSucceedAndSatisfy((store) => {
        expect(store.skippedRecords).toEqual([]);
      });
      // The default encoding refuses `bad:seg`, so a directory decoding to it does not round-trip.
      expect(open(mutableRoot([knowledgeFile('bad:seg/intro.md', 'intro')]), params)).toFailWith(
        /scope directory 'bad:seg'/i
      );
    });
  });

  describe('identity default', () => {
    test('with neither option the walk indexes the raw directory path, unchanged', async () => {
      const root = mutableRoot([knowledgeFile('knowledge/intro.md', 'intro')]);
      const store = open(root, {}).orThrow();
      expect(await store.get(knowledgeKind, 'intro' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.body).toBe('body of intro');
        }
      );
    });
  });

  describe('a pair that does not round-trip is refused at open', () => {
    const encoded = (): ReadonlyArray<{ path: string; contents: string }> => [
      knowledgeFile('s-knowledge/intro.md', 'intro')
    ];
    const cases: ReadonlyArray<
      [string, ScopeParams, ReadonlyArray<{ path: string; contents: string }>, RegExp]
    > = [
      [
        'a decoding that does not invert the encoding',
        {
          scopeEncoding: prefixEncoding,
          scopeDecoding: (dir) =>
            prefixDecoding(dir).onSuccess((s) => Convert.scopeKey.convert(s.toUpperCase()))
        },
        encoded(),
        /scope directory 's-knowledge': decodes to scope 'KNOWLEDGE', which encodes to 's-KNOWLEDGE'/i
      ],
      [
        'a directory the decoding rejects',
        { scopeEncoding: prefixEncoding, scopeDecoding: prefixDecoding },
        [knowledgeFile('knowledge/intro.md', 'intro')],
        /scope directory 'knowledge': segment 'knowledge' lacks the 's-' prefix/i
      ],
      [
        'a decoded scope the scope converter rejects',
        {
          scopeEncoding: prefixEncoding,
          scopeDecoding: () => succeed(' knowledge ' as MemoryScopeKey)
        },
        encoded(),
        /scope directory 's-knowledge': MemoryScopeKey: must not have leading or trailing whitespace/i
      ]
    ];

    test.each(cases)("%s: 'fail' mode fails the open", (__name, params, files, expected) => {
      expect(open(mutableRoot(files), params)).toFailWith(expected);
    });

    test.each(cases)(
      "%s: 'skip' mode quarantines the directory's records",
      (__name, params, files, expected) => {
        const store = open(mutableRoot(files), { ...params, onRecordError: 'skip' }).orThrow();
        expect(store.skippedRecords).toHaveLength(1);
        const [skip] = store.skippedRecords;
        expect(skip.path).toBe(files[0].path);
        expect(skip.scope).toBeUndefined();
        expect(skip.error).toMatch(expected);
      }
    );

    test('the check runs per directory: a valid sibling still loads in skip mode', async () => {
      const store = open(
        mutableRoot([knowledgeFile('knowledge/a.md', 'a'), knowledgeFile('s-knowledge/b.md', 'b')]),
        { scopeEncoding: prefixEncoding, scopeDecoding: prefixDecoding, onRecordError: 'skip' }
      ).orThrow();
      expect(store.skippedRecords.map((s) => s.path)).toEqual(['knowledge/a.md']);
      expect(await store.get(knowledgeKind, 'b' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.body).toBe('body of b');
        }
      );
    });
  });

  describe('a pair that does not round-trip is refused on read and write', () => {
    // Two scopes share one directory: `alias` and `knowledge` both encode to `s-knowledge`.
    const params: ScopeParams = {
      scopeEncoding: (scope) => prefixEncoding(scope === 'alias' ? ('knowledge' as MemoryScopeKey) : scope),
      scopeDecoding: prefixDecoding
    };

    test('an address-first read of a scope that does not decode back fails', async () => {
      const store = open(mutableRoot([knowledgeFile('s-knowledge/intro.md', 'intro')]), params).orThrow();
      expect(await store.getById('alias' as MemoryScopeKey, 'intro' as MemoryId)).toFailWith(
        /scope 'alias': encodes to 's-knowledge', which decodes to scope 'knowledge'/i
      );
      expect(await store.getById('knowledge' as MemoryScopeKey, 'intro' as MemoryId)).toSucceed();
    });

    test('a write to such a scope fails and leaves no file', async () => {
      const aliasCodec: IIdentityCodec = {
        encode: (entityId) =>
          succeed({ scope: 'alias' as MemoryScopeKey, idStem: entityId, isVersioned: false }),
        decode: (__scope, stem) => Convert.entityId.convert(stem),
        verifyRoundTrip: () => succeed(true)
      };
      const root = mutableRoot();
      const store = FileTreeMemoryStore.create({
        root,
        registry: registry(),
        codecs: new Map([[knowledgeKind, aliasCodec]]),
        ...params
      }).orThrow();
      expect(await store.put(makeRecord(knowledgeKind, 'intro', 'intro', 'hello'))).toFailWith(
        /scope 'alias': encodes to 's-knowledge'/i
      );
      expect(childNames(root)).toEqual([]);
    });
  });

  describe('the scope invariant holds through the decoding', () => {
    // Files under `knowledge` but decodes from the stem alone, so only the store's
    // check (scope === codec.encode(entityId).scope) can see a foreign directory.
    const scopeBlindCodec: IIdentityCodec = {
      encode: (entityId) =>
        succeed({ scope: 'knowledge' as MemoryScopeKey, idStem: entityId, isVersioned: false }),
      decode: (__scope, stem) => Convert.entityId.convert(stem),
      verifyRoundTrip: () => succeed(true)
    };
    const openBlind = (
      files: ReadonlyArray<{ path: string; contents: string }>,
      onRecordError?: 'fail' | 'skip'
    ): Result<FileTreeMemoryStore> =>
      FileTreeMemoryStore.create({
        root: mutableRoot(files),
        registry: registry(),
        codecs: new Map([[knowledgeKind, scopeBlindCodec]]),
        scopeEncoding: prefixEncoding,
        scopeDecoding: prefixDecoding,
        onRecordError
      });
    // Decodes to `elsewhere`, but the codec derives `knowledge`.
    const foreign = knowledgeFile('s-elsewhere/intro.md', 'intro');

    test('a well-placed record is checked against its decoded scope and loads', async () => {
      const store = openBlind([knowledgeFile('s-knowledge/ok.md', 'ok')]).orThrow();
      expect(await store.get(knowledgeKind, 'ok' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.envelope.id).toBe('ok');
        }
      );
    });

    test("'fail' mode rejects a record whose decoded scope is not its codec's", () => {
      expect(openBlind([foreign])).toFailWith(
        /s-elsewhere\/intro\.md'.*read from scope 'elsewhere', but its codec derives scope 'knowledge'/i
      );
    });

    test("'skip' mode quarantines it under its decoded scope", () => {
      const store = openBlind([foreign, knowledgeFile('s-knowledge/ok.md', 'ok')], 'skip').orThrow();
      expect(store.skippedRecords).toEqual([
        expect.objectContaining({ path: 's-elsewhere/intro.md', scope: 'elsewhere' })
      ]);
    });
  });

  describe('a throwing host coder fails instead of escaping', () => {
    const boom = (): never => {
      throw new Error('boom');
    };

    test("a decoding that throws at open fails in 'fail' mode and quarantines in 'skip' mode", () => {
      const files = [knowledgeFile('s-knowledge/intro.md', 'intro')];
      const params: ScopeParams = { scopeEncoding: prefixEncoding, scopeDecoding: boom };
      expect(open(mutableRoot(files), params)).toFailWith(
        /scope directory 's-knowledge': scopeDecoding threw: boom/i
      );
      expect(open(mutableRoot(files), { ...params, onRecordError: 'skip' })).toSucceedAndSatisfy((store) => {
        expect(store.skippedRecords).toEqual([
          expect.objectContaining({ path: 's-knowledge/intro.md', scope: undefined })
        ]);
      });
    });

    test('a decoding that throws fails a read and a write', async () => {
      const root = mutableRoot();
      const store = open(root, { scopeEncoding: prefixEncoding, scopeDecoding: boom }).orThrow();
      expect(await store.getById('knowledge' as MemoryScopeKey, 'intro' as MemoryId)).toFailWith(
        /scope 'knowledge':.*scopeDecoding threw: boom/i
      );
      expect(await store.put(makeRecord(knowledgeKind, 'intro', 'intro', 'hello'))).toFailWith(
        /scopeDecoding threw: boom/i
      );
      expect(childNames(root)).toEqual([]);
    });

    test('an encoding that throws fails a write', async () => {
      const root = mutableRoot();
      const store = open(root, { scopeEncoding: boom, scopeDecoding: prefixDecoding }).orThrow();
      expect(await store.put(makeRecord(knowledgeKind, 'intro', 'intro', 'hello'))).toFailWith(
        /scope 'knowledge': scopeEncoding threw: boom/i
      );
      expect(childNames(root)).toEqual([]);
    });
  });

  describe('an encoding must produce a canonical path', () => {
    const cases: ReadonlyArray<[string, string]> = [
      ['empty', ''],
      ['a leading slash', '/s-knowledge'],
      ['a double slash', 's-a//s-knowledge'],
      ['a dot-dot segment', '../s-knowledge'],
      ['a dot segment', 's-a/./s-knowledge']
    ];

    test.each(cases)('%s is refused on write and nothing is written', async (__name, encoded) => {
      const root = mutableRoot();
      const store = open(root, {
        scopeEncoding: () => succeed(encoded),
        scopeDecoding: prefixDecoding
      }).orThrow();
      expect(await store.put(makeRecord(knowledgeKind, 'intro', 'intro', 'hello'))).toFailWith(
        /scope 'knowledge': encoded path '.*' is not canonical/i
      );
      expect(childNames(root)).toEqual([]);
    });
  });

  describe('more layouts under a non-identity encoding', () => {
    const params: ScopeParams = { scopeEncoding: prefixEncoding, scopeDecoding: prefixDecoding };

    test('a versioned kind reopens and resolves its current version', async () => {
      const factKind: Kind = 'fact' as Kind;
      const reg = registry();
      reg.register(factKind, Converters.string);
      const create = (root: FileTree.IMutableFileTreeDirectoryItem): Result<FileTreeMemoryStore> =>
        FileTreeMemoryStore.create({
          root,
          registry: reg,
          codecs: new Map<Kind, IIdentityCodec>([
            [factKind, TemporalIdentityCodec.create('facts').orThrow()]
          ]),
          writePolicies: new Map([[factKind, TemporalVersionedPolicy.create().orThrow()]]),
          clock: () => 1000,
          ...params
        });
      const root = mutableRoot();
      const writer = create(root).orThrow();
      (await writer.put(makeRecord(factKind, 'fact-1', 'fact-1', 'first'))).orThrow();
      (await writer.put(makeRecord(factKind, 'fact-1', 'fact-1', 'second'))).orThrow();
      expect(scopeLayout(root)).toEqual(['s-facts']);

      writer.dispose();
      const store = create(root).orThrow();
      expect(store.skippedRecords).toEqual([]);
      expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy(
        (got: IMemoryRecord<unknown> | undefined) => {
          expect(got?.body).toBe('second');
        }
      );
      expect(await store.list({ scope: 'facts/entities/fact-1' as MemoryScopeKey })).toSucceedAndSatisfy(
        (listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(listed).toHaveLength(2);
        }
      );
    });

    test('a parent scope and its nested child scope reopen separately', async () => {
      // EntityId `<scope>~<stem>`: lets one kind file records under both `a` and `a/b`.
      const pathKind: Kind = 'path' as Kind;
      const pathCodec: IIdentityCodec = {
        encode: (entityId) => {
          const [scope, stem] = entityId.split('~');
          return succeed({ scope: scope as MemoryScopeKey, idStem: stem, isVersioned: false });
        },
        decode: (scope, stem) => Convert.entityId.convert(`${scope}~${stem}`),
        verifyRoundTrip: () => succeed(true)
      };
      const reg = registry();
      reg.register(pathKind, Converters.string);
      const create = (root: FileTree.IMutableFileTreeDirectoryItem): Result<FileTreeMemoryStore> =>
        FileTreeMemoryStore.create({
          root,
          registry: reg,
          codecs: new Map([[pathKind, pathCodec]]),
          ...params
        });
      const root = mutableRoot();
      const writer = create(root).orThrow();
      (await writer.put(makeRecord(pathKind, 'p', 'a~p', 'parent'))).orThrow();
      (await writer.put(makeRecord(pathKind, 'c', 'a/b~c', 'child'))).orThrow();

      writer.dispose();
      const store = create(root).orThrow();
      expect(store.skippedRecords).toEqual([]);
      expect(await store.list({ scope: 'a' as MemoryScopeKey })).toSucceedAndSatisfy(
        (listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(listed.map((r) => r.body)).toEqual(['parent']);
        }
      );
      expect(await store.list({ scope: 'a/b' as MemoryScopeKey })).toSucceedAndSatisfy(
        (listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(listed.map((r) => r.body)).toEqual(['child']);
        }
      );
      expect(await store.get(pathKind, 'a/b~c' as EntityId)).toSucceed();
    });
  });
});
