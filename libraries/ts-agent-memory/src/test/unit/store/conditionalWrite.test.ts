/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IFileTreeMemoryStoreCreateParams,
  IIdentityCodec,
  IMemoryObservationRecord,
  IMemoryRecord,
  IMemoryWriteFailure,
  IWritePolicy,
  InMemoryCosineIndex,
  Kind,
  KnowledgeIdentityCodec,
  KnowledgeLwwPolicy,
  MemoryId,
  MemoryWriteResult,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  allMemoryWriteFailureCodes
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;
const factKind: Kind = 'fact' as Kind;
const SLOT_A: string = 'memory-store.seq.a.json';
const SLOT_B: string = 'memory-store.seq.b.json';

const slot = (reserved: number): string => JSON.stringify({ version: 1, reserved });

function slotNames(root: FileTree.IFileTreeDirectoryItem): ReadonlyArray<string> {
  return root
    .getChildren()
    .orThrow()
    .map((c) => c.name)
    .filter((n) => n === SLOT_A || n === SLOT_B);
}

function slotText(root: FileTree.IFileTreeDirectoryItem, name: string): string {
  const file = root
    .getChildren()
    .orThrow()
    .find((c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === name);
  if (file === undefined) {
    throw new Error(`expected slot ${name}`);
  }
  return file.getRawContents().orThrow();
}

function reservedIn(root: FileTree.IFileTreeDirectoryItem, name: string): number {
  return Converters.object<{ reserved: number }>({ reserved: Converters.number })
    .convert(JSON.parse(slotText(root, name)))
    .orThrow().reserved;
}

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const root = FileTree.inMemory([], { mutable: true }).orThrow().getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root');
  }
  return root;
}

function open(
  root: FileTree.IMutableFileTreeDirectoryItem,
  extra: Partial<IFileTreeMemoryStoreCreateParams> = {}
): Result<FileTreeMemoryStore> {
  const registry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, Converters.string);
  registry.register(factKind, Converters.string);
  return FileTreeMemoryStore.create({
    root,
    registry,
    codecs: new Map<Kind, IIdentityCodec>([
      [knowledgeKind, new KnowledgeIdentityCodec()],
      [factKind, TemporalIdentityCodec.create('facts').orThrow()]
    ]),
    writePolicies: new Map<Kind, IWritePolicy>([[factKind, TemporalVersionedPolicy.create().orThrow()]]),
    ...extra
  });
}

function rec(kind: Kind, id: string, body: string, tags: ReadonlyArray<string> = []): IMemoryRecord<unknown> {
  return {
    envelope: {
      id: id as MemoryId,
      entityId: id as EntityId,
      kind,
      tags: tags as IMemoryRecord<unknown>['envelope']['tags'],
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

const note = (id: string, body: string): IMemoryRecord<unknown> => rec(knowledgeKind, id, body);
const fact = (id: string, body: string): IMemoryRecord<unknown> => rec(factKind, id, body);

async function seqOf(written: Promise<MemoryWriteResult<IMemoryRecord<unknown>>>): Promise<number> {
  return (await written).orThrow().envelope.seq;
}

async function bodyOf(store: FileTreeMemoryStore, kind: Kind, id: string): Promise<unknown> {
  return (await store.get(kind, id as EntityId)).orThrow()?.body;
}

/** Assert a failure carries exactly this detail. */
function expectDetail<T>(result: MemoryWriteResult<T>, detail: IMemoryWriteFailure): void {
  expect(result).toFail();
  expect(result.detail).toEqual(detail);
}

describe('FileTreeMemoryStore conditional writes', () => {
  test('the failure-code vocabulary is closed and complete', () => {
    expect(allMemoryWriteFailureCodes).toEqual([
      'conflict',
      'duplicate',
      'invalid',
      'rejected',
      'not-found',
      'io'
    ]);
  });

  describe('flat put', () => {
    test("expected: 'absent' creates a record that is not there", async () => {
      const store = open(mutableRoot()).orThrow();
      expect(await store.put(note('a', 'alpha'), { expected: 'absent' })).toSucceedAndSatisfy((r) => {
        expect(r.body).toBe('alpha');
      });
    });

    test("expected: 'absent' conflicts with a record that is there, and writes nothing", async () => {
      const store = open(mutableRoot()).orThrow();
      const seq = await seqOf(store.put(note('a', 'alpha')));
      const result = await store.put(note('a', 'beta'), { expected: 'absent' });
      expect(result).toFailWith(/conflict: expected no record, found seq/);
      expectDetail(result, { code: 'conflict', expected: 'absent', current: seq });
      expect(await bodyOf(store, knowledgeKind, 'a')).toBe('alpha');
    });

    test('a matching seq writes; a stale one conflicts and writes nothing', async () => {
      const store = open(mutableRoot()).orThrow();
      const first = await seqOf(store.put(note('a', 'alpha')));
      const second = await seqOf(store.put(note('a', 'beta'), { expected: first }));
      expect(second).toBeGreaterThan(first);
      const stale = await store.put(note('a', 'gamma'), { expected: first });
      expectDetail(stale, { code: 'conflict', expected: first, current: second });
      expect(await bodyOf(store, knowledgeKind, 'a')).toBe('beta');
    });

    test('a seq expected at an absent address conflicts with current: absent', async () => {
      const store = open(mutableRoot()).orThrow();
      const result = await store.put(note('a', 'alpha'), { expected: 7 });
      expect(result).toFailWith(/expected seq 7, found no record/);
      expectDetail(result, { code: 'conflict', expected: 7, current: 'absent' });
      expect(await bodyOf(store, knowledgeKind, 'a')).toBeUndefined();
    });

    test('the check precedes cross-id content dedup', async () => {
      // `b` carries `a`'s content: unconditionally that is a dedup no-op answering with `a`. With a
      // stale expectation for `b` it must be a conflict, because `b` moved.
      const store = open(mutableRoot()).orThrow();
      await seqOf(store.put(note('a', 'shared')));
      const b1 = await seqOf(store.put(note('b', 'first')));
      const b2 = await seqOf(store.put(note('b', 'second'), { expected: b1 }));
      expectDetail(await store.put(note('b', 'shared'), { expected: b1 }), {
        code: 'conflict',
        expected: b1,
        current: b2
      });
      expect(await bodyOf(store, knowledgeKind, 'b')).toBe('second');
    });

    test('the check precedes the same-id no-op', async () => {
      // An identical re-put is a no-op success unconditionally; with a stale seq it is a conflict.
      const store = open(mutableRoot()).orThrow();
      const first = await seqOf(store.put(note('a', 'alpha')));
      const second = await seqOf(store.put(note('a', 'beta'), { expected: first }));
      expectDetail(await store.put(note('a', 'beta'), { expected: first }), {
        code: 'conflict',
        expected: first,
        current: second
      });
      expect(await store.put(note('a', 'beta'), { expected: second })).toSucceedAndSatisfy((r) => {
        expect(r.envelope.seq).toBe(second);
      });
    });

    test('under expected, a dedup onto another id is a duplicate, not a success', async () => {
      const seen: IMemoryObservationRecord[] = [];
      const store = open(mutableRoot(), {
        observers: [{ observe: async (r) => succeed(seen.push(r)) }]
      }).orThrow();
      await seqOf(store.put(note('z', 'shared')));
      const x = await seqOf(store.put(note('x', 'mine')));
      const put = await store.put(note('x', 'shared'), { expected: x });
      expect(put).toFailWith(/duplicate: the content already exists as 'z'; nothing was written/);
      expectDetail(put, { code: 'duplicate', existingId: 'z' as MemoryId });
      expect(await bodyOf(store, knowledgeKind, 'x')).toBe('mine');
      expectDetail(await store.put(note('y', 'shared'), { expected: 'absent' }), {
        code: 'duplicate',
        existingId: 'z' as MemoryId
      });
      expect(await bodyOf(store, knowledgeKind, 'y')).toBeUndefined();
      expect(
        seen
          .filter((o) => o.phase === 'write')
          .slice(-2)
          .map((o) => o.outcome)
      ).toEqual(['failure', 'failure']);
      // Without `expected` the dedup is unchanged: it answers with the existing record.
      expect(await store.put(note('y', 'shared'))).toSucceedAndSatisfy((r) => {
        expect(r.envelope.id).toBe('z');
      });
    });

    test('a same-id file that cannot be read fails the put even when a cross-id duplicate exists', async () => {
      // The same-id record is read before content dedup, so its corruption is no longer skipped.
      const root = mutableRoot();
      const store = open(root).orThrow();
      await seqOf(store.put(note('x', 'xbody')));
      await seqOf(store.put(note('z', 'shared')));
      const dir = root
        .getChildren()
        .orThrow()
        .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === 'knowledge');
      const file = dir
        ?.getChildren()
        .orThrow()
        .find((c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === 'x.md');
      if (file === undefined || !FileTree.isMutableFileItem(file)) {
        throw new Error('expected a mutable x.md');
      }
      file.setRawContents('garbage').orThrow();
      expectDetail(await store.put(note('x', 'shared')), { code: 'io' });
    });

    test('a conflict still emits a failed write observation', async () => {
      const seen: IMemoryObservationRecord[] = [];
      const store = open(mutableRoot(), {
        observers: [{ observe: async (r) => succeed(seen.push(r)) }]
      }).orThrow();
      await seqOf(store.put(note('a', 'alpha')));
      expect(await store.put(note('a', 'beta'), { expected: 'absent' })).toFail();
      expect(seen.map((o) => [o.phase, o.outcome])).toEqual([
        ['write', 'success'],
        ['write', 'failure']
      ]);
      expect(seen[1].error).toMatch(/conflict/);
    });
  });

  describe('the check runs under the write lock', () => {
    test('of two same-instance writers expecting one seq, exactly one wins', async () => {
      // The embedder holds the first writer mid-pipeline, between the check and its write. A check
      // outside the lock would let the second writer pass the same expectation.
      let release: () => void = () => undefined;
      const gate: Promise<void> = new Promise((resolve) => {
        release = resolve;
      });
      let gated: boolean = false;
      const store = open(mutableRoot(), {
        vectorIndex: InMemoryCosineIndex.create().orThrow(),
        embed: async () => {
          if (gated) {
            await gate;
          }
          return succeed(new Float32Array([1, 0]));
        }
      }).orThrow();
      const seq = await seqOf(store.put(note('a', 'alpha')));
      gated = true;
      const first = store.put(note('a', 'from first'), { expected: seq });
      const second = store.put(note('a', 'from second'), { expected: seq });
      release();
      const [one, two] = await Promise.all([first, second]);
      expect(one).toSucceed();
      expect(two).toFail();
      expect(two.detail).toEqual({ code: 'conflict', expected: seq, current: one.orThrow().envelope.seq });
      expect(await bodyOf(store, knowledgeKind, 'a')).toBe('from first');
    });
  });

  describe('versioned put', () => {
    test('compares with the current version, before entity dedup', async () => {
      const store = open(mutableRoot()).orThrow();
      const v1 = await seqOf(store.put(fact('f', 'one')));
      const v2 = await seqOf(store.put(fact('f', 'two'), { expected: v1 }));
      expect(v2).toBeGreaterThan(v1);
      // Identical to the current content: unconditionally a no-op; with a stale seq, a conflict.
      expectDetail(await store.put(fact('f', 'two'), { expected: v1 }), {
        code: 'conflict',
        expected: v1,
        current: v2
      });
      expectDetail(await store.put(fact('f', 'three'), { expected: 'absent' }), {
        code: 'conflict',
        expected: 'absent',
        current: v2
      });
      expect(await bodyOf(store, factKind, 'f')).toBe('two');
    });

    test("a soft-deleted entity is 'absent'", async () => {
      const store = open(mutableRoot()).orThrow();
      const v1 = await seqOf(store.put(fact('f', 'one')));
      expect(await store.delete(factKind, 'f' as EntityId)).toSucceed();
      expectDetail(await store.put(fact('f', 'two'), { expected: v1 }), {
        code: 'conflict',
        expected: v1,
        current: 'absent'
      });
      expect(await store.put(fact('f', 'two'), { expected: 'absent' })).toSucceed();
    });
  });

  describe('delete', () => {
    test.each([
      ['flat', knowledgeKind, note],
      ['versioned', factKind, fact]
    ])('%s: a matching seq deletes; a stale one conflicts and keeps the record', async (__l, kind, make) => {
      const store = open(mutableRoot()).orThrow();
      const first = await seqOf(store.put(make('x', 'one')));
      const second = await seqOf(store.put(make('x', 'two')));
      expectDetail(await store.delete(kind, 'x' as EntityId, { expected: first }), {
        code: 'conflict',
        expected: first,
        current: second
      });
      expect(await bodyOf(store, kind, 'x')).toBe('two');
      expect(await store.delete(kind, 'x' as EntityId, { expected: second })).toSucceed();
      expect(await bodyOf(store, kind, 'x')).toBeUndefined();
    });

    test.each([
      ['flat', knowledgeKind],
      ['versioned', factKind]
    ])('%s: an absent record is not-found, or a conflict when a seq was expected', async (__l, kind) => {
      const store = open(mutableRoot()).orThrow();
      const missing = await store.delete(kind, 'x' as EntityId);
      expect(missing).toFailWith(/no record found/);
      expectDetail(missing, { code: 'not-found' });
      expectDetail(await store.delete(kind, 'x' as EntityId, { expected: 3 }), {
        code: 'conflict',
        expected: 3,
        current: 'absent'
      });
    });
  });

  describe('failure classification', () => {
    test.each([-1, 1.5, Number.NaN, '5' as unknown as number])(
      'a malformed expected (%p) is invalid',
      async (bad) => {
        const store = open(mutableRoot()).orThrow();
        const put = await store.put(note('a', 'alpha'), { expected: bad });
        expect(put).toFailWith(/expected must be a non-negative integer seq/);
        expectDetail(put, { code: 'invalid' });
        expectDetail(await store.delete(knowledgeKind, 'a' as EntityId, { expected: bad }), {
          code: 'invalid'
        });
      }
    );

    test("delete refuses expected: 'absent' as invalid", async () => {
      const store = open(mutableRoot()).orThrow();
      const result = await store.delete(knowledgeKind, 'a' as EntityId, {
        expected: 'absent' as unknown as number
      });
      expect(result).toFailWith(/expected must be a non-negative integer seq \(got "absent"\)/);
      expectDetail(result, { code: 'invalid' });
    });

    test('input refusals are invalid', async () => {
      const store = open(mutableRoot()).orThrow();
      expectDetail(await store.put({ ...note('a', 'x'), body: 42 }), { code: 'invalid' });
      expectDetail(await store.put(rec('unregistered' as Kind, 'a', 'x')), { code: 'invalid' });
      expectDetail(
        await store.put({ ...note('a', 'x'), envelope: { ...note('a', 'x').envelope, id: 'b' as MemoryId } }),
        {
          code: 'invalid'
        }
      );
      expectDetail(await store.delete('unregistered' as Kind, 'a' as EntityId), { code: 'invalid' });
    });

    test('a policy refusal is rejected, on both layouts', async () => {
      const lww = KnowledgeLwwPolicy.create().orThrow();
      const refuse: IWritePolicy = {
        mutableFields: lww.mutableFields,
        dedupScope: 'entity',
        admit: () => succeed({ decision: 'reject', reason: 'closed' }),
        applyUpdate: (existing, patch) => lww.applyUpdate(existing, patch)
      };
      const store = open(mutableRoot(), {
        writePolicies: new Map<Kind, IWritePolicy>([
          [knowledgeKind, refuse],
          [factKind, refuse]
        ])
      }).orThrow();
      const flat = await store.put(note('a', 'x'));
      expect(flat).toFailWith(/rejected by policy: closed/);
      expectDetail(flat, { code: 'rejected' });
      expectDetail(await store.put(fact('f', 'x')), { code: 'rejected' });
    });

    test('a disposed store is io', async () => {
      const store = open(mutableRoot()).orThrow();
      store.dispose();
      expectDetail(await store.put(note('a', 'x')), { code: 'io' });
      expectDetail(await store.delete(knowledgeKind, 'a' as EntityId), { code: 'io' });
    });
  });

  describe('the seq high-water mark', () => {
    test('a seq freed by deleting the highest record is not re-issued after a reopen', async () => {
      // The ABA hole: without the high-water mark the reopened store resumes from the highest seq
      // on disk, re-issues `b`'s old seq to the new `b`, and a stale writer holding it passes.
      const root = mutableRoot();
      const first = open(root).orThrow();
      await seqOf(first.put(note('a', 'alpha')));
      const staleB = await seqOf(first.put(note('b', 'old b')));
      expect(await first.delete(knowledgeKind, 'b' as EntityId)).toSucceed();
      first.dispose();

      const reopened = open(root).orThrow();
      const newB = await seqOf(reopened.put(note('b', 'new b')));
      expect(newB).toBeGreaterThan(staleB);
      expectDetail(await reopened.put(note('b', 'stale write'), { expected: staleB }), {
        code: 'conflict',
        expected: staleB,
        current: newB
      });
      expect(await bodyOf(reopened, knowledgeKind, 'b')).toBe('new b');
    });

    test('is persisted before the seq it covers is used', async () => {
      // A directory squatting on the slot's name after the open makes the high-water write fail.
      // The put must fail before its record is written: a record carrying a seq the mark does not
      // cover is exactly what a crash could later re-issue.
      const root = mutableRoot();
      const store = open(root).orThrow();
      root.createChildDirectory(SLOT_A).orThrow();
      const put = await store.put(note('a', 'alpha'));
      expect(put).toFailWith(/cannot advance the seq high-water mark/);
      expectDetail(put, { code: 'io' });
      expect(await bodyOf(store, knowledgeKind, 'a')).toBeUndefined();
      expectDetail(await store.put(fact('f', 'one')), { code: 'io' });
      expect(await bodyOf(store, factKind, 'f')).toBeUndefined();
    });

    test('a reopen resumes past the persisted mark, not only past the records', async () => {
      const root = mutableRoot();
      root.createChildFile(SLOT_A, slot(500)).orThrow();
      const store = open(root).orThrow();
      expect(await seqOf(store.put(note('a', 'alpha')))).toBeGreaterThan(500);
    });

    test('a vault without the mark derives seq from its records, then gains a slot', async () => {
      const root = mutableRoot();
      const first = open(root).orThrow();
      const seq = await seqOf(first.put(note('a', 'alpha')));
      first.dispose();
      for (const name of slotNames(root)) {
        root.deleteChild(name).orThrow();
      }
      const reopened = open(root).orThrow();
      expect(await seqOf(reopened.put(note('b', 'beta')))).toBeGreaterThan(seq);
      expect(slotNames(root)).toHaveLength(1);
    });

    test('a torn slot beside a good one opens, continues past the good ceiling, and is rewritten', async () => {
      // A plain (non-atomic) root rewrites a slot in place, so a crash can tear it.
      const root = mutableRoot();
      root.createChildFile(SLOT_A, slot(100)).orThrow();
      root.createChildFile(SLOT_B, '{"version":1,"reser').orThrow();
      const store = open(root).orThrow();
      expect(await seqOf(store.put(note('a', 'alpha')))).toBeGreaterThan(100);
      // The write went to the torn slot; the only good one was not overwritten.
      expect(slotText(root, SLOT_A)).toBe(slot(100));
      expect(reservedIn(root, SLOT_B)).toBeGreaterThan(100);
    });

    test.each([
      [SLOT_A, 300, SLOT_B, 200],
      [SLOT_B, 300, SLOT_A, 200]
    ])(
      'the alternation survives a reopen: %s at %d is kept, the lower %s at %d is rewritten',
      async (keep, high, rewrite, low) => {
        const root = mutableRoot();
        root.createChildFile(keep, slot(high)).orThrow();
        root.createChildFile(rewrite, slot(low)).orThrow();
        const store = open(root).orThrow();
        expect(await seqOf(store.put(note('a', 'alpha')))).toBeGreaterThan(high);
        expect(slotText(root, keep)).toBe(slot(high));
        expect(reservedIn(root, rewrite)).toBeGreaterThan(high);
      }
    );

    test.each([
      ['one slot, unreadable', [[SLOT_A, slot(-2)]]],
      [
        'both slots torn',
        [
          [SLOT_A, 'garbage'],
          [SLOT_B, '{"version":1']
        ]
      ]
    ])('%s fails the open, naming both slots and the cost of deleting them', (__l, files) => {
      const root = mutableRoot();
      for (const [name, text] of files) {
        root.createChildFile(name, text).orThrow();
      }
      expect(open(root)).toFailWith(
        /no seq high-water slot is readable \(memory-store\.seq\.a\.json, memory-store\.seq\.b\.json\).*reopens the hole.*re-issued/
      );
      // The claim was released with the failed open.
      for (const [name] of files) {
        root.deleteChild(name).orThrow();
      }
      expect(open(root)).toSucceed();
    });

    test.each([SLOT_A, SLOT_B])('a root directory named %s is refused at open', (name) => {
      const root = mutableRoot();
      root.createChildDirectory(name).orThrow();
      expect(open(root)).toFailWith(/a name reserved for the seq high-water mark/);
    });
  });
});
