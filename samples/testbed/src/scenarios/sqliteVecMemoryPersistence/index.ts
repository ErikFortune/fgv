/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * `sqliteVecMemoryPersistence` scenario (CLI-only).
 *
 * Demonstrates `@fgv/ts-agent-memory-sqlite-vec`: a small corpus is embedded with a local
 * `Xenova/all-MiniLM-L6-v2` pipeline into a **file-backed** `SqliteVecVectorIndex`, queried,
 * then the connection is closed and the SAME file is reopened — the second query runs with no
 * re-embedding and returns the same ranking, proving the persistence guarantee.
 *
 * The scenario is CLI-only: `better-sqlite3` is a Node-native module, so it is loaded (with the
 * embedder and the index package) via `webpackIgnore` dynamic imports that never enter the
 * browser bundle. The persistence logic itself lives in the fully-testable `persistenceDemo`
 * module; this file is the thin live-model wrapper.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Result, fail, succeed } from '@fgv/ts-utils';
import type { IScenario, IScenarioContext, ICliScenarioImpl } from '../../shell';
import { DemoEmbedFn, IDemoDoc, OpenIndexFn, runPersistenceDemo } from './persistenceDemo';

const MODEL_ID: string = 'Xenova/all-MiniLM-L6-v2';

const CORPUS: ReadonlyArray<IDemoDoc> = [
  { id: 'cats', text: 'Domestic cats are small carnivorous mammals often kept as pets.' },
  { id: 'dogs', text: 'Dogs are loyal domesticated animals descended from wolves.' },
  { id: 'sqlite', text: 'SQLite is an embedded relational database stored in a single file.' },
  { id: 'vectors', text: 'A vector embedding maps text to a point in high-dimensional space.' },
  { id: 'coffee', text: 'Espresso is a concentrated coffee brewed by forcing hot water through grounds.' }
];

const QUERY: string = 'a lightweight on-disk database for storing embeddings';

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    context.logger.info(`Loading model ${MODEL_ID} for the sqlite-vec persistence demo…`);

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
      return succeed(Float32Array.from(nested[0]));
    };

    const openIndex: OpenIndexFn = async (dbPath: string) => {
      const db = new Database(dbPath);
      const created = await sqliteVec.SqliteVecVectorIndex.create({ database: db });
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

    const dir: string = fs.mkdtempSync(path.join(os.tmpdir(), 'svmem-'));
    const dbPath: string = path.join(dir, 'vectors.db');
    try {
      const result = await runPersistenceDemo({
        corpus: CORPUS,
        query: QUERY,
        topK: 3,
        dbPath,
        embed,
        openIndex
      });
      if (result.isFailure()) {
        return fail(result.message);
      }
      const r = result.value;
      const fmt = (hits: ReadonlyArray<{ id: string; score: number }>): string =>
        hits.map((h, i) => `  ${i + 1}. [${h.score.toFixed(4)}] ${h.id}`).join('\n');
      return succeed(
        `sqlite-vec persistent memory demo\n` +
          `Embedded ${r.corpusSize} docs (dim ${r.dimension}) into a SQLite file.\n` +
          `Query: "${QUERY}"\n` +
          `Session 1 (freshly embedded):\n${fmt(r.session1)}\n` +
          `Session 2 (reopened file, NO re-embedding):\n${fmt(r.session2)}\n` +
          `Persistence: ${
            r.persistedAcrossReopen ? 'VERIFIED — identical ranking across reopen' : 'MISMATCH'
          }`
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
};

/**
 * `sqliteVecMemoryPersistence` scenario: local embeddings persisted in a `sqlite-vec`
 * file-backed `IVectorIndex`, proving no re-embedding is needed on reopen. CLI-only.
 * @public
 */
export const sqliteVecMemoryPersistenceScenario: IScenario = {
  id: 'sqlite-vec-memory-persistence',
  title: 'SQLite-vec Persistent Memory',
  description:
    'Embeds a small corpus with a local `Xenova/all-MiniLM-L6-v2` pipeline into a file-backed ' +
    '`@fgv/ts-agent-memory-sqlite-vec` index, then closes and reopens the file to show the ' +
    'vectors persist — the second query returns the same ranking with no re-embedding. CLI-only.',
  category: 'ai',
  tags: ['agent-memory', 'embeddings', 'sqlite-vec', 'persistence', 'local-ai'],
  cli: cliImpl
};

// Re-export the testable core.
export { runPersistenceDemo };
export type {
  DemoEmbedFn,
  IDemoDoc,
  IDemoHit,
  IOpenedIndex,
  IPersistenceDemoResult,
  OpenIndexFn
} from './persistenceDemo';
