/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';

import BetterSqlite3 from 'better-sqlite3';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Result, fail, succeed } from '@fgv/ts-utils';
import type {
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentVectorIndex,
  IVectorQueryHit,
  MemoryId,
  MemoryScopeKey
} from '@fgv/ts-agent-memory';
import { SqliteVecFragmentIndex } from '@fgv/ts-agent-memory-sqlite-vec';
import {
  DemoEmbedFn,
  IDemoDoc,
  IOpenedFragmentIndex,
  OpenFragmentIndexFn,
  runFragmentPersistenceDemo
} from '../../../scenarios/sqliteVecFragmentPersistence';

const CORPUS: ReadonlyArray<IDemoDoc> = [
  { id: 'alpha', text: 'the quick brown fox. it jumps over the lazy dog.' },
  // Trailing space after the final period yields a whitespace-only span the chunker drops.
  { id: 'beta', text: 'databases store rows and columns. ' },
  { id: 'gamma', text: 'vectors map text to points in space.' }
];
const QUERY: string = 'rows stored in a database';
const DIM: number = 8;

/** A deterministic embedder — distinct, stable vector per text; no model download. */
const deterministicEmbed: DemoEmbedFn = async (text: string): Promise<Result<Float32Array>> => {
  const v = new Float32Array(DIM);
  for (let i = 0; i < text.length; i++) {
    v[i % DIM] += text.charCodeAt(i) / 100;
  }
  return succeed(v);
};

/** A real file-backed opener over better-sqlite3 + SqliteVecFragmentIndex. */
const realOpenIndex: OpenFragmentIndexFn = async (dbPath: string): Promise<Result<IOpenedFragmentIndex>> => {
  const db = new BetterSqlite3(dbPath);
  const created = await SqliteVecFragmentIndex.create({ database: db });
  if (created.isFailure()) {
    db.close();
    return fail(created.message);
  }
  return succeed({
    index: created.value,
    close: (): void => {
      db.close();
    }
  });
};

function target(id: string): IEdgeTarget {
  return { scope: 'knowledge' as unknown as MemoryScopeKey, id: id as unknown as MemoryId };
}
function hit(id: string, start: number, end: number, score: number): IVectorQueryHit {
  return { target: target(id), score, locator: { start, end } };
}

/** A fully-fake fragment index for exercising failure branches. */
function fakeIndex(overrides: Partial<IFragmentVectorIndex>): IFragmentVectorIndex {
  return {
    addFragments:
      overrides.addFragments ??
      (async (__t: IEdgeTarget, f: ReadonlyArray<IEmbeddedFragment>): Promise<Result<number>> =>
        succeed(f.length)),
    remove: overrides.remove ?? (async (t: IEdgeTarget): Promise<Result<IEdgeTarget>> => succeed(t)),
    query: overrides.query ?? (async (): Promise<Result<ReadonlyArray<IVectorQueryHit>>> => succeed([]))
  };
}

function fakeOpener(index: IFragmentVectorIndex): OpenFragmentIndexFn {
  return async (): Promise<Result<IOpenedFragmentIndex>> => succeed({ index, close: (): void => undefined });
}

describe('sqliteVecFragmentPersistence — runFragmentPersistenceDemo', () => {
  let dir: string;
  let dbPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svfrag-test-'));
    dbPath = path.join(dir, 'fragments.db');
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('chunks + embeds fragments, persists them, and reopening yields the identical per-span ranking (no re-embed)', async () => {
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        maxPerRecord: 1,
        dbPath,
        embed: deterministicEmbed,
        openIndex: realOpenIndex
      })
    ).toSucceedAndSatisfy((result) => {
      expect(result.corpusSize).toBe(3);
      // alpha → 2 spans, beta → 1 (trailing-space span dropped), gamma → 1 = 4 fragments.
      expect(result.fragmentCount).toBe(4);
      expect(result.dimension).toBe(DIM);
      // The reopened session queried the same file with no embedding — identical ranking.
      expect(result.session2).toEqual(result.session1);
      expect(result.persistedAcrossReopen).toBe(true);
      // Each hit carries a real span, and maxPerRecord=1 means no id repeats.
      const ids = result.session1.map((h) => h.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const h of result.session1) {
        expect(h.end).toBeGreaterThan(h.start);
      }
      // Scores are descending.
      for (let i = 1; i < result.session1.length; i++) {
        expect(result.session1[i - 1].score).toBeGreaterThanOrEqual(result.session1[i].score);
      }
    });
  });

  test('fails with context when the query cannot be embedded', async () => {
    const embed: DemoEmbedFn = async (text) =>
      text === QUERY ? fail('boom') : succeed(new Float32Array(DIM));
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed,
        openIndex: realOpenIndex
      })
    ).toFailWith(/embed query: boom/);
  });

  test('fails with context when a document fragment cannot be embedded', async () => {
    const embed: DemoEmbedFn = async (text) =>
      text === 'the quick brown fox.' ? fail('bad fragment') : succeed(new Float32Array(DIM).fill(1));
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed,
        openIndex: realOpenIndex
      })
    ).toFailWith(/embed fragment of 'alpha': bad fragment/);
  });

  test('fails when the index cannot be opened for session 1', async () => {
    const openIndex: OpenFragmentIndexFn = async () => fail('disk error');
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/open index \(session 1\): disk error/);
  });

  test('fails with context when addFragments fails', async () => {
    const openIndex = fakeOpener(fakeIndex({ addFragments: async () => fail('add boom') }));
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/add fragments for 'alpha': add boom/);
  });

  test('fails when the session-1 query fails', async () => {
    const openIndex = fakeOpener(fakeIndex({ query: async () => fail('query boom') }));
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/query \(session 1\): query boom/);
  });

  test('fails loudly when a fragment hit is missing its locator', async () => {
    // A malformed hit with no locator must surface as a failure, not a wrong span.
    const locatorless: IVectorQueryHit = { target: target('alpha'), score: 0.9 };
    const openIndex = fakeOpener(fakeIndex({ query: async () => succeed([locatorless]) }));
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/query \(session 1\): fragment hit for 'alpha' is missing its locator/);
  });

  test('fails when the index cannot be reopened for session 2', async () => {
    let call = 0;
    const openIndex: OpenFragmentIndexFn = async () => {
      call += 1;
      return call === 1
        ? succeed({ index: fakeIndex({}), close: (): void => undefined })
        : fail('reopen error');
    };
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/reopen index \(session 2\): reopen error/);
  });

  test('fails when the session-2 query fails', async () => {
    let call = 0;
    const openIndex: OpenFragmentIndexFn = async () => {
      call += 1;
      const index = call === 1 ? fakeIndex({}) : fakeIndex({ query: async () => fail('s2 query boom') });
      return succeed({ index, close: (): void => undefined });
    };
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/query \(session 2\): s2 query boom/);
  });

  test('reports persistedAcrossReopen=false when the two sessions rank differently', async () => {
    let call = 0;
    const openIndex: OpenFragmentIndexFn = async () => {
      call += 1;
      const hits =
        call === 1
          ? [hit('alpha', 0, 20, 0.9), hit('gamma', 0, 36, 0.5)]
          : [hit('gamma', 0, 36, 0.9), hit('alpha', 0, 20, 0.5)];
      return succeed({
        index: fakeIndex({ query: async () => succeed(hits) }),
        close: (): void => undefined
      });
    };
    expect(
      await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 5,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toSucceedAndSatisfy((result) => {
      expect(result.persistedAcrossReopen).toBe(false);
      expect(result.session1.map((h) => h.id)).toEqual(['alpha', 'gamma']);
      expect(result.session2.map((h) => h.id)).toEqual(['gamma', 'alpha']);
    });
  });
});
