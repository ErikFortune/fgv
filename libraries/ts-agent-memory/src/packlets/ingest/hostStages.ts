/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { MemoryId } from '../types';
import {
  ICandidateEdge,
  ICandidateRecord,
  IEntityResolutionCandidate,
  IIngestItem,
  IMemoryClassification,
  ResolutionVerdict
} from './model';

/**
 * Stage 2 — the host's classifier. Decides what {@link IIngestItem} maps to
 * which memory {@link Kind} (and optional tags / confidence). LOCKED as a
 * separate staged interface (OQ-10): the host plugs its existing classifier
 * machinery in here rather than surrendering to an opaque ingestor.
 * @public
 */
export interface IMemoryClassifier {
  /**
   * Classify one item. A `fail` aborts the item's ingest loudly (fgv never
   * guesses a kind).
   */
  classify(item: IIngestItem): Promise<Result<IMemoryClassification>>;
}

/**
 * Stage 3 — the host's fact extractor. Turns a classified item into zero or more
 * {@link ICandidateRecord}s. Each candidate's body is validated against the
 * kind's registered Converter by fgv before it can reach the store (the typed
 * validation boundary — no unchecked host data is persisted).
 * @public
 */
export interface IFactExtractor {
  /**
   * Extract candidate records from a classified item. An empty array is a valid
   * result (the item yielded nothing memorable).
   */
  extract(
    item: IIngestItem,
    classification: IMemoryClassification
  ): Promise<Result<ReadonlyArray<ICandidateRecord>>>;
}

/**
 * Stage 4 (optional) — the host's entity resolver (OQ-13, LOCKED OPTIONAL). When
 * supplied, fgv surfaces near-duplicate {@link IEntityResolutionCandidate}s (from
 * layer-2 similarity search) and the resolver returns a
 * {@link ResolutionVerdict}. When ABSENT, stage-4 dedup falls back to
 * exact-`{ kind, body }`-hash only — the deterministic-identity host path.
 * @public
 */
export interface IEntityResolver {
  /**
   * Decide whether `candidate` is new, a duplicate of / supersedes / merges into
   * one of the surfaced `similar` records. `similar` is non-empty and ordered by
   * descending score when the resolver is invoked (fgv only calls it when
   * layer-2 surfaces at least one over-threshold neighbor).
   */
  resolve(
    candidate: ICandidateRecord,
    similar: ReadonlyArray<IEntityResolutionCandidate>
  ): Promise<Result<ResolutionVerdict>>;
}

/**
 * The context fgv hands the host's relation extractor (stage 5): the source item
 * plus the candidates fgv is about to write, each paired with its resolved
 * reference id (the codec `idStem`). The extractor proposes attributed edges over
 * these ids and existing store records.
 * @public
 */
export interface IRelationContext {
  /** The item being ingested. */
  readonly item: IIngestItem;
  /** The candidates fgv is about to write, each with its resolved reference id. */
  readonly candidates: ReadonlyArray<IRelationCandidate>;
}

/**
 * A candidate paired with its resolved reference id, handed to the relation
 * extractor so it can source edges from it.
 * @public
 */
export interface IRelationCandidate {
  /** The candidate about to be written. */
  readonly candidate: ICandidateRecord;
  /** Its resolved reference id (codec `idStem` — the stable entity reference). */
  readonly id: MemoryId;
}

/**
 * Stage 5 — the host's relation extractor. Proposes attributed edges among the
 * candidates and existing records. fgv owns the validation, the write-time cycle
 * guard, and the actual persistence of the edges (the host brings only the
 * relationship judgment).
 * @public
 */
export interface IRelationExtractor {
  /**
   * Propose the edges to attach for this ingest. An empty array is valid (no
   * relations). Every proposed {@link ICandidateEdge.source | source} must be one
   * of the context's candidate reference ids.
   */
  relate(context: IRelationContext): Promise<Result<ReadonlyArray<ICandidateEdge>>>;
}
