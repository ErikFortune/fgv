/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import type {
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentVectorIndex,
  IVectorQueryHit,
  MemoryId,
  MemoryScopeKey
} from '@fgv/ts-agent-memory';

/**
 * Embeds a single text (a query, or one document fragment) into a vector. Injected so
 * the demo core is testable with a deterministic embedder (no model download) and the
 * CLI can supply a real local `@fgv/ts-extras-transformers` pipeline.
 * @public
 */
export type DemoEmbedFn = (text: string) => Promise<Result<Float32Array>>;

/** A persistent fragment index opened at a path, plus a close handle for its connection. */
export interface IOpenedFragmentIndex {
  readonly index: IFragmentVectorIndex;
  readonly close: () => void;
}

/**
 * Opens a persistent {@link IFragmentVectorIndex} backed by a file at `dbPath`. Injected
 * so the demo core does not import `better-sqlite3` / `@fgv/ts-agent-memory-sqlite-vec`
 * directly (keeping them out of the browser bundle) — the CLI supplies the real opener.
 * @public
 */
export type OpenFragmentIndexFn = (dbPath: string) => Promise<Result<IOpenedFragmentIndex>>;

/** One document in the demo corpus. */
export interface IDemoDoc {
  readonly id: string;
  readonly text: string;
}

/** One ranked per-fragment hit: the record id plus the matched `[start, end)` span and score. */
export interface IDemoFragmentHit {
  readonly id: string;
  readonly start: number;
  readonly end: number;
  readonly score: number;
}

/** The result of the fragment persistence demo — session-2 hits should match session-1 with no re-embedding. */
export interface IFragmentPersistenceDemoResult {
  readonly corpusSize: number;
  /** Total fragments embedded and stored across the whole corpus. */
  readonly fragmentCount: number;
  readonly dimension: number;
  /** Fragment hits from the freshly-embedded index. */
  readonly session1: ReadonlyArray<IDemoFragmentHit>;
  /** Fragment hits after closing and reopening the same file — produced with NO re-embedding. */
  readonly session2: ReadonlyArray<IDemoFragmentHit>;
  /** `true` when session-2 ordering (id + span) matches session-1 (persistence verified). */
  readonly persistedAcrossReopen: boolean;
}

/** The scope every demo record lives under. */
const DEMO_SCOPE: string = 'knowledge';

function targetFor(id: string): IEdgeTarget {
  return { scope: DEMO_SCOPE as unknown as MemoryScopeKey, id: id as unknown as MemoryId };
}

/** One sentence-shaped span of a document, with its `[start, end)` character offsets. */
interface IFragmentSpan {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

/** A corpus document paired with its embedded fragments, shared across both demo sessions. */
interface IEmbeddedDoc {
  readonly id: string;
  readonly fragments: ReadonlyArray<IEmbeddedFragment>;
}

/**
 * Split a document into sentence-shaped fragments, each carrying its true `[start, end)`
 * character offsets into the original body — the locators the consumer's own read side
 * uses. Deterministic and dependency-free; the chunking policy is the demo's, not the
 * index's (the index stores whatever spans it is given).
 */
function chunk(text: string): ReadonlyArray<IFragmentSpan> {
  const spans: IFragmentSpan[] = [];
  const re: RegExp = /[^.!?]+[.!?]*/g;
  let m: RegExpExecArray | null = re.exec(text);
  while (m !== null) {
    const raw: string = m[0];
    const leading: number = raw.length - raw.trimStart().length;
    const trimmed: string = raw.trim();
    if (trimmed.length > 0) {
      const start: number = m.index + leading;
      spans.push({ text: trimmed, start, end: start + trimmed.length });
    }
    m = re.exec(text);
  }
  return spans;
}

/** Convert a raw fragment hit to a demo hit, failing loudly if the index omitted the locator. */
function toDemoHit(hit: IVectorQueryHit): Result<IDemoFragmentHit> {
  if (hit.locator === undefined) {
    return fail(`fragment hit for '${hit.target.id as unknown as string}' is missing its locator`);
  }
  return succeed({
    id: hit.target.id as unknown as string,
    start: hit.locator.start,
    end: hit.locator.end,
    score: hit.score
  });
}

async function queryFragmentHits(
  index: IFragmentVectorIndex,
  queryVector: Float32Array,
  topK: number,
  maxPerRecord: number | undefined
): Promise<Result<ReadonlyArray<IDemoFragmentHit>>> {
  return (await index.query(queryVector, topK, maxPerRecord)).onSuccess((hits) =>
    mapResults(hits.map(toDemoHit))
  );
}

/**
 * Demonstrates the persistence guarantee of `@fgv/ts-agent-memory-sqlite-vec`'s
 * fragment index: each document is chunked into sentence spans, every span is embedded
 * into a **file-backed** `SqliteVecFragmentIndex`, and a fragment query returns per-span
 * hits. Then the connection is **closed and the same file reopened** — the second session
 * queries with no re-embedding and returns the same per-fragment ranking (record id AND
 * matched span). The embedder and index-opener are injected so the core is fully testable
 * offline.
 *
 * @param params - corpus, query, topK, optional per-record cap, the on-disk `dbPath`, and the injected `embed` / `openIndex`.
 * @returns `Success` with both sessions' results (and whether they match), or `Failure` with context.
 * @public
 */
export async function runFragmentPersistenceDemo(params: {
  readonly corpus: ReadonlyArray<IDemoDoc>;
  readonly query: string;
  readonly topK: number;
  readonly maxPerRecord?: number;
  readonly dbPath: string;
  readonly embed: DemoEmbedFn;
  readonly openIndex: OpenFragmentIndexFn;
}): Promise<Result<IFragmentPersistenceDemoResult>> {
  const { corpus, query, topK, maxPerRecord, dbPath, embed, openIndex } = params;

  // Embed the query once; the same vector drives both sessions so a match proves persistence.
  const queryEmbed = await embed(query);
  if (queryEmbed.isFailure()) {
    return fail(`embed query: ${queryEmbed.message}`);
  }
  const queryVector: Float32Array = queryEmbed.value;

  // Chunk + embed every document's fragments up front (shared across both sessions).
  const embeddedByDoc: IEmbeddedDoc[] = [];
  let fragmentCount: number = 0;
  for (const doc of corpus) {
    const fragments: IEmbeddedFragment[] = [];
    for (const span of chunk(doc.text)) {
      const embedded = await embed(span.text);
      if (embedded.isFailure()) {
        return fail(`embed fragment of '${doc.id}': ${embedded.message}`);
      }
      fragments.push({ locator: { start: span.start, end: span.end }, vector: embedded.value });
    }
    fragmentCount += fragments.length;
    embeddedByDoc.push({ id: doc.id, fragments });
  }

  // Session 1: open a fresh persistent fragment index, add every document's fragments, query.
  const opened1 = await openIndex(dbPath);
  if (opened1.isFailure()) {
    return fail(`open index (session 1): ${opened1.message}`);
  }
  let session1: ReadonlyArray<IDemoFragmentHit>;
  try {
    for (const doc of embeddedByDoc) {
      const added = await opened1.value.index.addFragments(targetFor(doc.id), doc.fragments);
      if (added.isFailure()) {
        return fail(`add fragments for '${doc.id}': ${added.message}`);
      }
    }
    const queried = await queryFragmentHits(opened1.value.index, queryVector, topK, maxPerRecord);
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
  let session2: ReadonlyArray<IDemoFragmentHit>;
  try {
    const queried = await queryFragmentHits(opened2.value.index, queryVector, topK, maxPerRecord);
    if (queried.isFailure()) {
      return fail(`query (session 2): ${queried.message}`);
    }
    session2 = queried.value;
  } finally {
    opened2.value.close();
  }

  // Compare id + span order across the two sessions — persistence means an identical ranking.
  const order = (hits: ReadonlyArray<IDemoFragmentHit>): string =>
    hits.map((h) => `${h.id}:${h.start}-${h.end}`).join(',');
  return succeed({
    corpusSize: corpus.length,
    fragmentCount,
    dimension: queryVector.length,
    session1,
    session2,
    persistedAcrossReopen: order(session1) === order(session2)
  });
}
