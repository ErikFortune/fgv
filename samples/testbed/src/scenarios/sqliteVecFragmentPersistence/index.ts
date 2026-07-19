/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * `sqliteVecFragmentPersistence` scenario (CLI-only).
 *
 * Demonstrates the fragment-granular side of `@fgv/ts-agent-memory-sqlite-vec`: each corpus
 * document is chunked into sentence spans, every span is embedded with a local
 * `Xenova/all-MiniLM-L6-v2` pipeline into a **file-backed** `SqliteVecFragmentIndex`, and a
 * fragment query returns per-span hits (record id AND the matched `[start, end)` locator).
 * The connection is then closed and the SAME file reopened — the second query runs with no
 * re-embedding and returns the identical per-fragment ranking, proving the persistence
 * guarantee for the fragment index (the durable counterpart to `InMemoryFragmentCosineIndex`).
 *
 * CLI-only: `better-sqlite3` is a Node-native module, so it is loaded (with the embedder and
 * the index package) via `webpackIgnore` dynamic imports that never enter the browser bundle.
 * The persistence logic lives in the fully-testable `fragmentPersistenceDemo` module; this
 * file is the thin live-model wrapper.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Result, fail, succeed } from '@fgv/ts-utils';
import type { IScenario, IScenarioContext, ICliScenarioImpl } from '../../shell';
import {
  DemoEmbedFn,
  IDemoDoc,
  OpenFragmentIndexFn,
  runFragmentPersistenceDemo
} from './fragmentPersistenceDemo';

const MODEL_ID: string = 'Xenova/all-MiniLM-L6-v2';

// Multi-sentence docs so each fragment is a distinct span — a fragment query can match a
// specific sentence inside a document, not just the document as a whole.
const CORPUS: ReadonlyArray<IDemoDoc> = [
  {
    id: 'cats',
    text: 'Domestic cats are small carnivorous mammals. They are often kept as pets and sleep most of the day.'
  },
  {
    id: 'databases',
    text: 'SQLite is an embedded relational database stored in a single file. It requires no separate server process.'
  },
  {
    id: 'embeddings',
    text: 'A vector embedding maps text to a point in high-dimensional space. Nearby points represent similar meanings.'
  },
  {
    id: 'coffee',
    text: 'Espresso is a concentrated coffee brewed under pressure. It forms the base of many other drinks.'
  }
];

const QUERY: string = 'storing vectors in an on-disk database file';

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    context.logger.info(`Loading model ${MODEL_ID} for the sqlite-vec fragment persistence demo…`);

    // Load Node-only facades lazily; the `webpackIgnore` comments keep native deps
    // (ONNX runtime, better-sqlite3) out of any browser bundle.
    const transformers = await import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers');
    const sqliteVec = await import(/* webpackIgnore: true */ '@fgv/ts-agent-memory-sqlite-vec');
    const betterSqlite = await import(/* webpackIgnore: true */ 'better-sqlite3');
    const Database = betterSqlite.default;

    const pipeline = await transformers.loadPipeline('feature-extraction', MODEL_ID);
    if (pipeline.isFailure()) {
      return fail(pipeline.message);
    }

    const embed: DemoEmbedFn = async (text: string): Promise<Result<Float32Array>> => {
      const tensor = await transformers.embed(pipeline.value, text, {
        pooling: 'mean',
        normalize: true
      });
      if (tensor.isFailure()) {
        return fail(tensor.message);
      }
      // A [1, D] pooled Tensor: row 0 of tolist() is the sentence vector.
      const nested = tensor.value.tolist() as number[][];
      // Defensive: a valid pooled Tensor always yields a non-empty nested array, but
      // keep `embed` fully Result-based rather than letting an unexpected shape throw
      // (mirrors the guard in localEmbeddingSearch/embedAdapter.ts).
      if (nested.length === 0 || nested[0] === undefined) {
        return fail('embedding produced an empty tensor (no row 0)');
      }
      return succeed(Float32Array.from(nested[0]));
    };

    const openIndex: OpenFragmentIndexFn = async (dbPath: string) => {
      const db = new Database(dbPath);
      const created = await sqliteVec.SqliteVecFragmentIndex.create({ database: db });
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

    const dir: string = fs.mkdtempSync(path.join(os.tmpdir(), 'svfrag-'));
    const dbPath: string = path.join(dir, 'fragments.db');
    try {
      const result = await runFragmentPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 4,
        // Cap each document to one fragment so a single long doc cannot fill the result.
        maxPerRecord: 1,
        dbPath,
        embed,
        openIndex
      });
      if (result.isFailure()) {
        return fail(result.message);
      }
      const r = result.value;
      const docText = (id: string): string => CORPUS.find((d) => d.id === id)?.text ?? '';
      const fmt = (hits: ReadonlyArray<{ id: string; start: number; end: number; score: number }>): string =>
        hits
          .map(
            (h, i) =>
              `  ${i + 1}. [${h.score.toFixed(4)}] ${h.id} [${h.start},${h.end}) "${docText(h.id).slice(
                h.start,
                h.end
              )}"`
          )
          .join('\n');
      return succeed(
        `sqlite-vec persistent FRAGMENT memory demo\n` +
          `Embedded ${r.fragmentCount} fragments from ${r.corpusSize} docs (dim ${r.dimension}) into a SQLite file.\n` +
          `Query: "${QUERY}" (topK 4, maxPerRecord 1)\n` +
          `Session 1 (freshly embedded):\n${fmt(r.session1)}\n` +
          `Session 2 (reopened file, NO re-embedding):\n${fmt(r.session2)}\n` +
          `Persistence: ${
            r.persistedAcrossReopen ? 'VERIFIED — identical fragment ranking across reopen' : 'MISMATCH'
          }`
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
};

/**
 * `sqliteVecFragmentPersistence` scenario: local per-fragment embeddings persisted in a
 * `sqlite-vec` file-backed `IFragmentVectorIndex`, proving no re-embedding is needed on
 * reopen and that each hit round-trips its `[start, end)` locator. CLI-only.
 * @public
 */
export const sqliteVecFragmentPersistenceScenario: IScenario = {
  id: 'sqlite-vec-fragment-persistence',
  title: 'SQLite-vec Persistent Fragment Memory',
  description:
    'Chunks a small corpus into sentence spans, embeds each span with a local ' +
    '`Xenova/all-MiniLM-L6-v2` pipeline into a file-backed `@fgv/ts-agent-memory-sqlite-vec` ' +
    'fragment index, then closes and reopens the file to show the per-fragment vectors persist — ' +
    'the second query returns the same ranking (record id + span) with no re-embedding. CLI-only.',
  category: 'ai',
  tags: ['agent-memory', 'embeddings', 'sqlite-vec', 'fragments', 'persistence', 'local-ai'],
  cli: cliImpl
};

// Re-export the testable core.
export { runFragmentPersistenceDemo };
export type {
  DemoEmbedFn,
  IDemoDoc,
  IDemoFragmentHit,
  IFragmentPersistenceDemoResult,
  IOpenedFragmentIndex,
  OpenFragmentIndexFn
} from './fragmentPersistenceDemo';
