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
  IVectorIndex,
  IVectorQueryHit,
  MemoryId,
  MemoryScopeKey
} from '@fgv/ts-agent-memory';
import { SqliteVecVectorIndex } from '@fgv/ts-agent-memory-sqlite-vec';
import {
  DemoEmbedFn,
  IDemoDoc,
  IOpenedIndex,
  OpenIndexFn,
  runPersistenceDemo
} from '../../../scenarios/sqliteVecMemoryPersistence';

const CORPUS: ReadonlyArray<IDemoDoc> = [
  { id: 'alpha', text: 'the quick brown fox' },
  { id: 'beta', text: 'lazy dogs sleep soundly' },
  { id: 'gamma', text: 'databases store rows and columns' }
];
const QUERY: string = 'stored rows in a database';
const DIM: number = 8;

/** A deterministic embedder — distinct, stable vector per text; no model download. */
const deterministicEmbed: DemoEmbedFn = async (text: string): Promise<Result<Float32Array>> => {
  const v = new Float32Array(DIM);
  for (let i = 0; i < text.length; i++) {
    v[i % DIM] += text.charCodeAt(i) / 100;
  }
  return succeed(v);
};

/** A real file-backed opener over better-sqlite3 + SqliteVecVectorIndex. */
const realOpenIndex: OpenIndexFn = async (dbPath: string): Promise<Result<IOpenedIndex>> => {
  const db = new BetterSqlite3(dbPath);
  const created = await SqliteVecVectorIndex.create({ database: db });
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

function hit(id: string, score: number): IVectorQueryHit {
  const target: IEdgeTarget = {
    scope: 'knowledge' as unknown as MemoryScopeKey,
    id: id as unknown as MemoryId
  };
  return { target, score };
}

/** A fully-fake index for exercising failure branches. */
function fakeIndex(overrides: Partial<IVectorIndex>): IVectorIndex {
  return {
    add: overrides.add ?? (async (): Promise<Result<string>> => succeed('k')),
    remove: overrides.remove ?? (async (t: IEdgeTarget): Promise<Result<IEdgeTarget>> => succeed(t)),
    query: overrides.query ?? (async (): Promise<Result<ReadonlyArray<IVectorQueryHit>>> => succeed([]))
  };
}

function fakeOpener(index: IVectorIndex): OpenIndexFn {
  return async (): Promise<Result<IOpenedIndex>> => succeed({ index, close: (): void => undefined });
}

describe('sqliteVecMemoryPersistence — runPersistenceDemo', () => {
  let dir: string;
  let dbPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svmem-test-'));
    dbPath = path.join(dir, 'vectors.db');
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('embeds a corpus, persists it, and reopening the file yields the identical ranking (no re-embed)', async () => {
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed: deterministicEmbed,
        openIndex: realOpenIndex
      })
    ).toSucceedAndSatisfy((result) => {
      expect(result.corpusSize).toBe(3);
      expect(result.dimension).toBe(DIM);
      expect(result.session1).toHaveLength(3);
      // The reopened session queried the same file with no embedding — identical ranking.
      expect(result.session2).toEqual(result.session1);
      expect(result.persistedAcrossReopen).toBe(true);
      // Scores are descending cosine similarity.
      expect(result.session1[0].score).toBeGreaterThanOrEqual(result.session1[1].score);
    });
  });

  test('fails with context when the query cannot be embedded', async () => {
    const embed: DemoEmbedFn = async (text) =>
      text === QUERY ? fail('boom') : succeed(new Float32Array(DIM));
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed,
        openIndex: realOpenIndex
      })
    ).toFailWith(/embed query: boom/);
  });

  test('fails with context when a corpus document cannot be embedded', async () => {
    const embed: DemoEmbedFn = async (text) =>
      text === CORPUS[1].text ? fail('bad doc') : succeed(new Float32Array(DIM).fill(1));
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed,
        openIndex: realOpenIndex
      })
    ).toFailWith(/embed 'beta': bad doc/);
  });

  test('fails when the index cannot be opened for session 1', async () => {
    const openIndex: OpenIndexFn = async () => fail('disk error');
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/open index \(session 1\): disk error/);
  });

  test('fails with context when an add fails', async () => {
    const openIndex = fakeOpener(fakeIndex({ add: async () => fail('add boom') }));
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/add 'alpha': add boom/);
  });

  test('fails when the session-1 query fails', async () => {
    const openIndex = fakeOpener(fakeIndex({ query: async () => fail('query boom') }));
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/query \(session 1\): query boom/);
  });

  test('fails when the index cannot be reopened for session 2', async () => {
    let call = 0;
    const openIndex: OpenIndexFn = async () => {
      call += 1;
      return call === 1
        ? succeed({ index: fakeIndex({}), close: (): void => undefined })
        : fail('reopen error');
    };
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/reopen index \(session 2\): reopen error/);
  });

  test('fails when the session-2 query fails', async () => {
    let call = 0;
    const openIndex: OpenIndexFn = async () => {
      call += 1;
      const index = call === 1 ? fakeIndex({}) : fakeIndex({ query: async () => fail('s2 query boom') });
      return succeed({ index, close: (): void => undefined });
    };
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toFailWith(/query \(session 2\): s2 query boom/);
  });

  test('reports persistedAcrossReopen=false when the two sessions rank differently', async () => {
    let call = 0;
    const openIndex: OpenIndexFn = async () => {
      call += 1;
      const hits = call === 1 ? [hit('alpha', 0.9), hit('beta', 0.5)] : [hit('beta', 0.9), hit('alpha', 0.5)];
      return succeed({
        index: fakeIndex({ query: async () => succeed(hits) }),
        close: (): void => undefined
      });
    };
    expect(
      await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed: deterministicEmbed,
        openIndex
      })
    ).toSucceedAndSatisfy((result) => {
      expect(result.persistedAcrossReopen).toBe(false);
      expect(result.session1.map((h) => h.id)).toEqual(['alpha', 'beta']);
      expect(result.session2.map((h) => h.id)).toEqual(['beta', 'alpha']);
    });
  });
});
