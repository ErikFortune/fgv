/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converter, Converters, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IIdentityCodecResult,
  IMemoryRecord,
  ISkippedRecord,
  Kind,
  MemoryScopeKey,
  joinFrontmatter
} from '../../../index';

/**
 * The incident: one vault holds every kind (mtm, ltm, conversation, knowledge,
 * claim) in ONE store. A required field was added to the `claim` body; every
 * pre-existing `claim` failed validation; and because the initial walk collapsed
 * per-record results with `mapResults` (fail-the-whole-array on any element),
 * every OTHER valid record became unreadable behind the failed open. These tests
 * reproduce that shape (a poison-rejecting body converter standing in for the
 * migrated converter) and pin the lenient (`onRecordError: 'skip'`) behavior.
 */

const noteKind: Kind = 'note' as Kind;
const POISON: string = 'POISON';

/**
 * A permissive identity codec that treats the full `<scope>/<stem>` path as the
 * entity id, so records can live at any nesting depth (the shipped codecs pin a
 * fixed scope shape; this test needs arbitrary-depth scopes to prove the
 * recursion threads skips out of nested subtrees).
 */
class PathIdentityCodec implements IIdentityCodec {
  public encode(entityId: EntityId): Result<IIdentityCodecResult> {
    const value: string = String(entityId);
    const cut: number = value.lastIndexOf('/');
    const scope: MemoryScopeKey = (cut >= 0 ? value.slice(0, cut) : '') as MemoryScopeKey;
    const idStem: string = cut >= 0 ? value.slice(cut + 1) : value;
    return succeed({ scope, idStem, isVersioned: false });
  }
  public decode(scope: MemoryScopeKey, encodedStem: string): Result<EntityId> {
    return succeed(`${scope}/${encodedStem}` as EntityId);
  }
  public verifyRoundTrip(): Result<true> {
    return succeed(true);
  }
}

/** A body converter that rejects any body containing the poison marker. */
const poisonRejectingConverter: Converter<string> = Converters.string.map((body) =>
  body.includes(POISON) ? fail(`note body rejected: contains ${POISON}`) : succeed(body)
);

function registry(bodyConverter: Converter<string>): IBodyConverterRegistry {
  const created = BodyConverterRegistry.create().orThrow();
  created.register(noteKind, bodyConverter);
  return created;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [noteKind, new PathIdentityCodec()]
]);

/** Serialize a note record at `<scope>/<stem>.md` with the given body. */
function noteFile(scope: string, stem: string, body: string): { path: string; contents: string } {
  const envelope = {
    id: stem,
    entityId: `${scope}/${stem}`,
    kind: 'note',
    tags: [],
    links: [],
    created: 1,
    updated: 1,
    seq: 4,
    contentHash: 'seed',
    provenance: { source: 'agent' }
  };
  const frontmatter = Object.entries(envelope)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  return { path: `${scope}/${stem}.md`, contents: joinFrontmatter(frontmatter, body) };
}

function mutableRoot(
  files: ReadonlyArray<{ path: string; contents: string }>
): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([...files], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

describe('FileTreeMemoryStore lenient open (onRecordError)', () => {
  test('incident: one bad record does not make the whole store unopenable in skip mode', async () => {
    const files = [
      noteFile('mtm', 'turn-1', 'valid mtm body'),
      noteFile('ltm', 'summary', 'valid ltm body'),
      noteFile('knowledge', 'doc-a', 'valid knowledge body'),
      // The migrated `claim` converter now rejects the pre-existing record.
      noteFile('claim', 'claim-1', `${POISON} missing required field`)
    ];

    // Default (== 'fail') still fails the whole open, exactly as it did before.
    expect(
      FileTreeMemoryStore.create({
        root: mutableRoot(files),
        registry: registry(poisonRejectingConverter),
        codecs
      })
    ).toFailWith(/POISON/);

    // 'skip' mode opens: every valid record loads; the bad one is quarantined.
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'skip'
    }).orThrow();

    expect(await store.list()).toSucceedAndSatisfy((listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(listed.map((r) => r.envelope.id).sort()).toEqual(['doc-a', 'summary', 'turn-1']);
    });
    expect(store.skippedRecords).toHaveLength(1);
    const skip: ISkippedRecord = store.skippedRecords[0];
    expect(skip.path).toBe('claim/claim-1.md');
    expect(skip.scope).toBe('claim');
    expect(skip.error).toContain('claim/claim-1.md');
    expect(skip.error).toContain(POISON);
  });

  test('default mode is byte-identical to explicit fail mode', () => {
    const files = [noteFile('note', 'good', 'ok'), noteFile('note', 'bad', POISON)];
    const asDefault = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(poisonRejectingConverter),
      codecs
    });
    const asFail = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'fail'
    });
    expect(asDefault).toFail();
    expect(asFail).toFail();
    // Same exact failure message — the load path is untouched in fail mode.
    expect(asDefault.isFailure() && asFail.isFailure() && asDefault.message === asFail.message).toBe(true);
    expect(asDefault).toFailWith(/POISON/);
  });

  test('a bad record in a nested scope is skipped while valid siblings load', async () => {
    const files = [
      noteFile('alpha/beta', 'ok-1', 'valid'),
      noteFile('alpha/beta', 'bad-1', POISON),
      noteFile('alpha/beta/gamma', 'ok-2', 'valid deep')
    ];
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'skip'
    }).orThrow();

    expect(await store.list()).toSucceedAndSatisfy((listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(listed.map((r) => r.envelope.id).sort()).toEqual(['ok-1', 'ok-2']);
    });
    expect(store.skippedRecords.map((s) => s.path)).toEqual(['alpha/beta/bad-1.md']);
    expect(store.skippedRecords[0].scope).toBe('alpha/beta');
  });

  test('multiple skips across different scopes all surface; all valid records load', async () => {
    const files = [
      noteFile('scope-a', 'good-a', 'a-ok'),
      noteFile('scope-a', 'bad-a', POISON),
      noteFile('scope-b', 'good-b', 'b-ok'),
      noteFile('scope-b', 'bad-b', POISON)
    ];
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'skip'
    }).orThrow();

    expect(await store.list()).toSucceedAndSatisfy((listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(listed.map((r) => r.envelope.id).sort()).toEqual(['good-a', 'good-b']);
    });
    expect(store.skippedRecords.map((s) => s.path).sort()).toEqual(['scope-a/bad-a.md', 'scope-b/bad-b.md']);
  });

  test('an all-invalid subtree opens with everything skipped (mapSuccess orDefault edge)', async () => {
    const files = [
      noteFile('bad-scope', 'x', POISON),
      noteFile('bad-scope', 'y', POISON),
      noteFile('good-scope', 'z', 'fine')
    ];
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'skip'
    }).orThrow();

    expect(await store.list()).toSucceedAndSatisfy((listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(listed.map((r) => r.envelope.id)).toEqual(['z']);
    });
    expect(store.skippedRecords.map((s) => s.path).sort()).toEqual(['bad-scope/x.md', 'bad-scope/y.md']);
  });

  test('an empty vault opens with no skips in either mode', async () => {
    const skip = FileTreeMemoryStore.create({
      root: mutableRoot([]),
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'skip'
    }).orThrow();
    expect(await skip.list()).toSucceedWith([]);
    expect(skip.skippedRecords).toEqual([]);

    const strict = FileTreeMemoryStore.create({
      root: mutableRoot([]),
      registry: registry(poisonRejectingConverter),
      codecs
    }).orThrow();
    expect(strict.skippedRecords).toEqual([]);
  });

  test('each skip is logged at warn; with the default NoOpLogger skippedRecords is still populated', async () => {
    const files = [noteFile('note', 'good', 'ok'), noteFile('note', 'bad', POISON)];
    const logger = new Logging.InMemoryLogger('warning');
    const withLogger = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'skip',
      logger
    }).orThrow();
    expect(withLogger.skippedRecords).toHaveLength(1);
    expect(logger.logged.some((m) => m.includes('note/bad.md') && m.includes(POISON))).toBe(true);

    // No logger wired (default NoOpLogger): create still succeeds and the
    // structured collection is still populated (observable without a logger).
    const silent = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'skip'
    }).orThrow();
    expect(silent.skippedRecords.map((s) => s.path)).toEqual(['note/bad.md']);
  });

  test('re-open after the converter is fixed re-indexes the quarantined record (non-destructive)', async () => {
    const files = [noteFile('note', 'good', 'ok'), noteFile('note', 'later', POISON)];
    const root = mutableRoot(files);

    // First open with the rejecting converter: the record is quarantined.
    const before = FileTreeMemoryStore.create({
      root,
      registry: registry(poisonRejectingConverter),
      codecs,
      onRecordError: 'skip'
    }).orThrow();
    expect(before.skippedRecords).toHaveLength(1);
    expect(await before.list()).toSucceedAndSatisfy((listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(listed.map((r) => r.envelope.id)).toEqual(['good']);
    });

    // The file was never deleted or mutated, so a fresh open with the fixed
    // (accept-all) converter re-indexes it — quarantine is non-destructive.
    const after = FileTreeMemoryStore.create({
      root: mutableRoot(files),
      registry: registry(Converters.string),
      codecs,
      onRecordError: 'skip'
    }).orThrow();
    expect(after.skippedRecords).toEqual([]);
    expect(await after.list()).toSucceedAndSatisfy((listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
      expect(listed.map((r) => r.envelope.id).sort()).toEqual(['good', 'later']);
    });
  });
});
