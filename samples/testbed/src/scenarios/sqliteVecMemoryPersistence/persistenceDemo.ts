/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import type { IEdgeTarget, IVectorIndex, MemoryId, MemoryScopeKey } from '@fgv/ts-agent-memory';

/**
 * Embeds a single text into a vector. Injected so the demo core is testable with a
 * deterministic embedder (no model download) and the CLI can supply a real local
 * `@fgv/ts-extras-transformers` pipeline.
 * @public
 */
export type DemoEmbedFn = (text: string) => Promise<Result<Float32Array>>;

/** A persistent vector index opened at a path, plus a close handle for its connection. */
export interface IOpenedIndex {
  readonly index: IVectorIndex;
  readonly close: () => void;
}

/**
 * Opens a persistent {@link IVectorIndex} backed by a file at `dbPath`. Injected so the
 * demo core does not import `better-sqlite3` / `@fgv/ts-agent-memory-sqlite-vec` directly
 * (keeping it out of the browser bundle) — the CLI supplies the real opener.
 * @public
 */
export type OpenIndexFn = (dbPath: string) => Promise<Result<IOpenedIndex>>;

/** One document in the demo corpus. */
export interface IDemoDoc {
  readonly id: string;
  readonly text: string;
}

/** One ranked hit (record id + similarity score). */
export interface IDemoHit {
  readonly id: string;
  readonly score: number;
}

/** The result of the persistence demo — session-2 results should match session-1 with no re-embedding. */
export interface IPersistenceDemoResult {
  readonly corpusSize: number;
  readonly dimension: number;
  /** Query results from the freshly-embedded index. */
  readonly session1: ReadonlyArray<IDemoHit>;
  /** Query results after closing and reopening the same file — produced with NO re-embedding. */
  readonly session2: ReadonlyArray<IDemoHit>;
  /** `true` when session-2 ordering matches session-1 (persistence verified). */
  readonly persistedAcrossReopen: boolean;
}

/** The scope every demo record lives under. */
const DEMO_SCOPE: string = 'knowledge';

function targetFor(id: string): IEdgeTarget {
  return { scope: DEMO_SCOPE as unknown as MemoryScopeKey, id: id as unknown as MemoryId };
}

async function queryHits(
  index: IVectorIndex,
  queryVector: Float32Array,
  topK: number
): Promise<Result<ReadonlyArray<IDemoHit>>> {
  return (await index.query(queryVector, topK)).onSuccess((hits) =>
    succeed(hits.map((h) => ({ id: h.target.id as unknown as string, score: h.score })))
  );
}

/**
 * Demonstrates the persistence guarantee of `@fgv/ts-agent-memory-sqlite-vec`: embed a
 * corpus into a file-backed vector index, query it, then **close the connection and reopen
 * the same file** — the second session queries with no re-embedding and returns the same
 * ranking. The embedder and index-opener are injected so the core is fully testable offline.
 *
 * @param params - corpus, query, topK, the on-disk `dbPath`, and the injected `embed` / `openIndex`.
 * @returns `Success` with both sessions' results (and whether they match), or `Failure` with context.
 * @public
 */
export async function runPersistenceDemo(params: {
  readonly corpus: ReadonlyArray<IDemoDoc>;
  readonly query: string;
  readonly topK: number;
  readonly dbPath: string;
  readonly embed: DemoEmbedFn;
  readonly openIndex: OpenIndexFn;
}): Promise<Result<IPersistenceDemoResult>> {
  const { corpus, query, topK, dbPath, embed, openIndex } = params;

  // Embed the query once; the same vector drives both sessions so a match proves persistence.
  const queryEmbed = await embed(query);
  if (queryEmbed.isFailure()) {
    return fail(`embed query: ${queryEmbed.message}`);
  }
  const queryVector: Float32Array = queryEmbed.value;

  // Embed the corpus.
  const docVectors: Float32Array[] = [];
  for (const doc of corpus) {
    const embedded = await embed(doc.text);
    if (embedded.isFailure()) {
      return fail(`embed '${doc.id}': ${embedded.message}`);
    }
    docVectors.push(embedded.value);
  }

  // Session 1: open a fresh persistent index, add every embedding, query.
  const opened1 = await openIndex(dbPath);
  if (opened1.isFailure()) {
    return fail(`open index (session 1): ${opened1.message}`);
  }
  let session1: ReadonlyArray<IDemoHit>;
  try {
    for (let i = 0; i < corpus.length; i++) {
      const added = await opened1.value.index.add(targetFor(corpus[i].id), docVectors[i]);
      if (added.isFailure()) {
        return fail(`add '${corpus[i].id}': ${added.message}`);
      }
    }
    const queried = await queryHits(opened1.value.index, queryVector, topK);
    if (queried.isFailure()) {
      return fail(`query (session 1): ${queried.message}`);
    }
    session1 = queried.value;
  } finally {
    opened1.value.close();
  }

  // Session 2: reopen the SAME file — no embedding, no add, just query. This is the guarantee.
  const opened2 = await openIndex(dbPath);
  if (opened2.isFailure()) {
    return fail(`reopen index (session 2): ${opened2.message}`);
  }
  let session2: ReadonlyArray<IDemoHit>;
  try {
    const queried = await queryHits(opened2.value.index, queryVector, topK);
    if (queried.isFailure()) {
      return fail(`query (session 2): ${queried.message}`);
    }
    session2 = queried.value;
  } finally {
    opened2.value.close();
  }

  const order1: string = session1.map((h) => h.id).join(',');
  const order2: string = session2.map((h) => h.id).join(',');
  return succeed({
    corpusSize: corpus.length,
    dimension: queryVector.length,
    session1,
    session2,
    persistedAcrossReopen: order1 === order2
  });
}
