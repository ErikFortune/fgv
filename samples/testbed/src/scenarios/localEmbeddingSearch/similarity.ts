/**
 * Pure cosine-similarity and nearest-neighbour ranking — no facade dependency.
 *
 * This unit is the algorithmic core of the `local-embedding-search` scenario.
 * It operates entirely on plain `number[]` vectors so it can be exhaustively
 * unit-tested without any model infrastructure.
 *
 * Design choice: `rankBySimilarity` accepts pre-embedded corpus entries so the
 * caller is responsible for embedding; this keeps the ranking logic trivially
 * testable and separates the pure-math unit from the facade-touching adapter.
 *
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

/**
 * One entry in the corpus: a text string and its embedding vector.
 * @public
 */
export interface ICorpusEntry {
  readonly text: string;
  readonly vec: readonly number[];
}

/**
 * One ranked result from {@link rankBySimilarity}: the corpus text and its
 * cosine-similarity score against the query vector.
 * @public
 */
export interface IRankedResult {
  readonly text: string;
  readonly score: number;
}

/**
 * Compute the cosine similarity between two equal-length vectors.
 *
 * Returns `Result.fail` when the vectors have different dimensions or when either
 * vector has zero magnitude (preventing division by zero).
 *
 * Scores range from −1 (opposite direction) through 0 (orthogonal) to 1 (identical
 * direction). L2-normalized sentence embeddings do not constrain the sign — related
 * text tends to score positive in practice, but negative scores are possible and are
 * not excluded by normalization.
 *
 * @public
 */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): Result<number> {
  if (a.length !== b.length) {
    return fail(`dimension mismatch: vector a has ${a.length} dimensions, vector b has ${b.length}`);
  }
  if (a.length === 0) {
    return fail('cannot compute cosine similarity of zero-length vectors');
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) {
    return fail('cannot compute cosine similarity: one or both vectors have zero magnitude');
  }

  return succeed(dot / denom);
}

/**
 * Rank all corpus entries by descending cosine similarity to the query vector.
 *
 * Returns `Result.fail` if any pair has a dimension mismatch (i.e. the corpus
 * was embedded with a different model than the query).
 *
 * @param queryVec - Embedding of the search query.
 * @param corpus - Pre-embedded corpus entries. Order is not assumed.
 * @returns Corpus entries sorted highest-similarity-first.
 *
 * @public
 */
export function rankBySimilarity(
  queryVec: readonly number[],
  corpus: readonly ICorpusEntry[]
): Result<readonly IRankedResult[]> {
  const ranked: IRankedResult[] = [];

  for (const entry of corpus) {
    const simResult = cosineSimilarity(queryVec, entry.vec);
    if (simResult.isFailure()) {
      return fail(`failed to rank corpus entry "${entry.text}": ${simResult.message}`);
    }
    ranked.push({ text: entry.text, score: simResult.value });
  }

  ranked.sort((a, b) => b.score - a.score);
  return succeed(ranked);
}
