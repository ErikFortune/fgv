/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Logging, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import {
  Convert,
  EntityId,
  IEdge,
  IEdgeTarget,
  IIdentityCodec,
  IIdentityCodecResult,
  IMemoryEnvelope,
  IMemoryRecord,
  IProvenance,
  Kind,
  LinkType,
  MemoryId,
  MemoryScopeKey,
  Tag,
  edgeTargetKey,
  isTemporalRecord,
  isVersionCurrent
} from '../types';
import { IBodyConverterRegistry } from '../converters';
import { IMemoryStore } from '../store';
import { IVectorIndex, MemoryEmbedder } from '../vector';
import { ICycleGuardEdge, assertNoCycles } from './cycleGuard';
import {
  IEntityResolver,
  IFactExtractor,
  IMemoryClassifier,
  IRelationCandidate,
  IRelationExtractor
} from './hostStages';
import {
  ICandidateEdge,
  ICandidateRecord,
  IEntityResolutionCandidate,
  IIngestItem,
  IIngestItemResult,
  IIngestedRecordResult,
  IMemoryClassification,
  IngestDisposition,
  ResolutionVerdict
} from './model';

/**
 * The provenance source stamped on every record the ingest pipeline writes.
 * @public
 */
export const HOST_INGEST_PROVENANCE_SOURCE: string = 'host-ingest';

/**
 * The link type whose presence on a temporal-kind candidate fires the
 * contradicts→temporal-versioned interlock.
 * @public
 */
export const CONTRADICTS_LINK_TYPE: LinkType = 'contradicts' as LinkType;

/**
 * The default stage-4 layer-2 cosine similarity threshold (design note §2). A
 * near-duplicate candidate is surfaced to the {@link IEntityResolver} only when
 * its nearest neighbor scores `>= 0.85`.
 * @public
 */
export const DEFAULT_SIMILARITY_THRESHOLD: number = 0.85;

/**
 * The default top-K for stage-4 layer-2 similarity candidate generation.
 * @public
 */
export const DEFAULT_SIMILARITY_TOP_K: number = 5;

/**
 * How the write-time cycle guard behaves: `'reject'` (default — a cycle-inducing
 * edge fails the ingest) or `'off'` (no acyclicity constraint, for deployments
 * whose link graphs are legitimately cyclic — e.g. mutual associative links).
 * @public
 */
export type CycleGuardMode = 'reject' | 'off';

/**
 * The fgv-owned six-stage ingest orchestrator. Composes the host's staged
 * classify / extract / (optional) resolve / relate machinery around fgv's owned
 * validation boundary, dedup, edge + cycle safety, provenance stamping, and the
 * contradicts→temporal interlock.
 * @public
 */
export interface IMemoryIngestOrchestrator {
  /**
   * Ingest a SINGLE item end-to-end (the first-class per-turn streaming path).
   */
  ingestItem(item: IIngestItem): Promise<Result<IIngestItemResult>>;

  /**
   * Ingest a batch of items. A convenience loop over {@link
   * IMemoryIngestOrchestrator.ingestItem | ingestItem} — items are processed in
   * order and the first failure aborts the batch.
   */
  ingestBatch(items: ReadonlyArray<IIngestItem>): Promise<Result<ReadonlyArray<IIngestItemResult>>>;
}

/**
 * Parameters for {@link MemoryIngestOrchestrator.create}.
 * @public
 */
export interface IMemoryIngestOrchestratorCreateParams {
  /** The store every write bottoms out in (stage 6). */
  readonly store: IMemoryStore;
  /** Per-kind body converter registry — the stage-3 typed validation boundary. */
  readonly registry: IBodyConverterRegistry;
  /** Per-kind identity codecs (maps a candidate `entityId` to its storage address). */
  readonly codecs?: ReadonlyMap<Kind, IIdentityCodec>;
  /** Default identity codec for kinds without an explicit entry. */
  readonly defaultCodec?: IIdentityCodec;
  /** Stage 2 — the host's classifier. */
  readonly classifier: IMemoryClassifier;
  /** Stage 3 — the host's fact extractor. */
  readonly extractor: IFactExtractor;
  /** Stage 5 — the host's relation extractor. */
  readonly relationExtractor: IRelationExtractor;
  /**
   * Stage 4 (optional, OQ-13) — the host's entity resolver. Absent → stage-4
   * dedup is exact-`{ kind, body }`-hash only (the deterministic-identity path).
   */
  readonly entityResolver?: IEntityResolver;
  /**
   * Optional vector index for stage-4 layer-2 similarity candidate-gen. Wired
   * together with {@link IMemoryIngestOrchestratorCreateParams.embed | embed} AND
   * {@link IMemoryIngestOrchestratorCreateParams.entityResolver | entityResolver};
   * absent (or either co-requisite absent) → layer-2 is skipped and dedup is
   * exact-only.
   */
  readonly vectorIndex?: IVectorIndex;
  /** Optional embedder used to embed a candidate for layer-2 similarity search. */
  readonly embed?: MemoryEmbedder;
  /**
   * Stage-4 layer-2 cosine threshold. Defaults to {@link
   * DEFAULT_SIMILARITY_THRESHOLD} (`0.85`).
   */
  readonly similarityThreshold?: number;
  /**
   * Stage-4 layer-2 top-K. Defaults to {@link DEFAULT_SIMILARITY_TOP_K} (`5`).
   */
  readonly similarityTopK?: number;
  /** Write-time cycle guard mode. Defaults to `'reject'`. */
  readonly cycleGuard?: CycleGuardMode;
  /** Diagnostic logger (defaults to a no-op). */
  readonly logger?: Logging.ILogger;
}

/** The fully-wired stage-4 layer-2 dependencies (present only when all three are supplied). */
interface ISimilarityWiring {
  readonly resolver: IEntityResolver;
  readonly vectorIndex: IVectorIndex;
  readonly embed: MemoryEmbedder;
}

/** A snapshot record paired with its resolved scope-qualified `(scope, id)` address. */
interface IScopedRecord {
  readonly address: IEdgeTarget;
  readonly record: IMemoryRecord<unknown>;
}

/** Internal per-candidate plan threaded through the pipeline. */
interface ICandidatePlan {
  readonly candidate: ICandidateRecord;
  /** The write target's storage address (re-addressed to the target for merge-into). */
  readonly writeAddress: IIdentityCodecResult;
  /** The write target's entity id (re-addressed for merge-into). */
  readonly writeEntityId: EntityId;
  /** The reference id used in stage-5 edges (the write target's `idStem`). */
  readonly refId: MemoryId;
  /**
   * The scope-qualified reference used in stage-5 edges: the write target's
   * `(scope, idStem)`. Stage-5 sources / dedup all key on this scoped address so
   * two candidates that share a stem across scopes never collide.
   */
  readonly refTarget: IEdgeTarget;
  /** The resolution verdict; carries the target id on its target-bearing arms. */
  readonly verdict: ResolutionVerdict;
  /**
   * The pre-ingest target record for a `merge-into` write — its existing
   * `tags` / `links` / `provenance` are UNIONed with the candidate's at stage 6
   * so a wholesale-replace merge never wipes them.
   */
  readonly mergeTarget?: IMemoryRecord<unknown>;
}

/**
 * Default {@link IMemoryIngestOrchestrator}.
 * @public
 */
export class MemoryIngestOrchestrator implements IMemoryIngestOrchestrator {
  private readonly _store: IMemoryStore;
  private readonly _registry: IBodyConverterRegistry;
  private readonly _codecs: ReadonlyMap<Kind, IIdentityCodec>;
  private readonly _defaultCodec: IIdentityCodec | undefined;
  private readonly _classifier: IMemoryClassifier;
  private readonly _extractor: IFactExtractor;
  private readonly _relationExtractor: IRelationExtractor;
  private readonly _similarity: ISimilarityWiring | undefined;
  private readonly _similarityThreshold: number;
  private readonly _similarityTopK: number;
  private readonly _cycleGuard: CycleGuardMode;
  private readonly _logger: Logging.ILogger;
  private readonly _hasher: Hash.Crc32Normalizer;

  private constructor(params: IMemoryIngestOrchestratorCreateParams) {
    this._store = params.store;
    this._registry = params.registry;
    this._codecs = params.codecs ?? new Map<Kind, IIdentityCodec>();
    this._defaultCodec = params.defaultCodec;
    this._classifier = params.classifier;
    this._extractor = params.extractor;
    this._relationExtractor = params.relationExtractor;
    this._similarity =
      params.entityResolver !== undefined && params.vectorIndex !== undefined && params.embed !== undefined
        ? { resolver: params.entityResolver, vectorIndex: params.vectorIndex, embed: params.embed }
        : undefined;
    this._similarityThreshold = params.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
    this._similarityTopK = params.similarityTopK ?? DEFAULT_SIMILARITY_TOP_K;
    this._cycleGuard = params.cycleGuard ?? 'reject';
    this._logger = params.logger ?? new Logging.NoOpLogger();
    this._hasher = new Hash.Crc32Normalizer();
  }

  /** Family-convention factory. */
  public static create(params: IMemoryIngestOrchestratorCreateParams): Result<MemoryIngestOrchestrator> {
    return succeed(new MemoryIngestOrchestrator(params));
  }

  /** {@inheritDoc IMemoryIngestOrchestrator.ingestItem} */
  public async ingestItem(item: IIngestItem): Promise<Result<IIngestItemResult>> {
    return (await this._classify(item))
      .thenOnSuccess((classification) => this._extract(item, classification))
      .thenOnSuccess((candidates) => this._processCandidates(item, candidates));
  }

  /** {@inheritDoc IMemoryIngestOrchestrator.ingestBatch} */
  public async ingestBatch(
    items: ReadonlyArray<IIngestItem>
  ): Promise<Result<ReadonlyArray<IIngestItemResult>>> {
    const results: IIngestItemResult[] = [];
    for (const item of items) {
      const result: Result<IIngestItemResult> = await this.ingestItem(item);
      if (result.isFailure()) {
        return fail(result.message);
      }
      results.push(result.value);
    }
    return succeed(results);
  }

  /** Stage 2 — classify (host), normalizing a rejected promise into a Failure. */
  private async _classify(item: IIngestItem): Promise<Result<IMemoryClassification>> {
    return this._capture(() => this._classifier.classify(item), `ingest '${item.id}': classify`);
  }

  /** Stage 3 — extract (host), normalizing a rejected promise into a Failure. */
  private async _extract(
    item: IIngestItem,
    classification: IMemoryClassification
  ): Promise<Result<ReadonlyArray<ICandidateRecord>>> {
    return this._capture(() => this._extractor.extract(item, classification), `ingest '${item.id}': extract`);
  }

  /**
   * Stages 3b-6 over the extracted candidates: validate bodies, resolve/dedup
   * (stage 4), relate + cycle guard (stage 5), and load-with-provenance (stage 6).
   */
  private async _processCandidates(
    item: IIngestItem,
    candidates: ReadonlyArray<ICandidateRecord>
  ): Promise<Result<IIngestItemResult>> {
    // Snapshot the store once; stage-4 resolution and the cycle guard reason over
    // the pre-ingest state.
    const snapshotResult: Result<ReadonlyArray<IMemoryRecord<unknown>>> = await this._store.list();
    if (snapshotResult.isFailure()) {
      return fail(`ingest '${item.id}': failed to snapshot store: ${snapshotResult.message}`);
    }
    const snapshot: ReadonlyArray<IMemoryRecord<unknown>> = snapshotResult.value;
    // Resolve every snapshot record's scope-qualified address ONCE, then index it
    // by the canonical scoped key. The single `byKey` view drives BOTH the edge
    // path (validation + cycle guard) AND the verdict/similarity target lookups —
    // so a filename stem reused across scopes never aliases on any path.
    const scopedResult: Result<ReadonlyArray<IScopedRecord>> = this._scopeRecords(snapshot);
    if (scopedResult.isFailure()) {
      return fail(`ingest '${item.id}': ${scopedResult.message}`);
    }
    const scoped: ReadonlyArray<IScopedRecord> = scopedResult.value;
    const byKey: ReadonlyMap<string, IMemoryRecord<unknown>> = new Map<string, IMemoryRecord<unknown>>(
      scoped.map((s) => [edgeTargetKey(s.address), s.record])
    );

    // Stage 3b + 4: validate each body and resolve a verdict/plan.
    const plans: ICandidatePlan[] = [];
    for (const candidate of candidates) {
      const planResult: Result<ICandidatePlan> = await this._planCandidate(item, candidate, snapshot, byKey);
      if (planResult.isFailure()) {
        return fail(planResult.message);
      }
      plans.push(planResult.value);
    }

    // Stage 5: relate over the writable candidates, validate + cycle-guard.
    const writablePlans: ICandidatePlan[] = plans.filter((plan) => plan.verdict.verdict !== 'duplicate-of');
    const edgesResult: Result<ReadonlyArray<ICandidateEdge>> = await this._relate(
      item,
      writablePlans,
      scoped,
      byKey
    );
    if (edgesResult.isFailure()) {
      return fail(edgesResult.message);
    }
    const edges: ReadonlyArray<ICandidateEdge> = edgesResult.value;

    // Stage 6: load-with-provenance, in extraction order.
    const records: IIngestedRecordResult[] = [];
    for (const plan of plans) {
      const outcome: Result<IIngestedRecordResult> = await this._loadCandidate(item, plan, edges);
      if (outcome.isFailure()) {
        return fail(outcome.message);
      }
      records.push(outcome.value);
    }
    return succeed({ item, records });
  }

  /** Stage 3b + 4 for one candidate: validate body, resolve address, resolve verdict. */
  private async _planCandidate(
    item: IIngestItem,
    candidate: ICandidateRecord,
    snapshot: ReadonlyArray<IMemoryRecord<unknown>>,
    byKey: ReadonlyMap<string, IMemoryRecord<unknown>>
  ): Promise<Result<ICandidatePlan>> {
    const kind: Kind = candidate.envelope.kind;
    // Stage 3b: the typed validation boundary — no unchecked host body reaches the store.
    const bodyResult: Result<string> = this._registry
      .convert(kind, candidate.body)
      .withErrorFormat((msg) => `ingest '${item.id}': candidate body for kind '${kind}' is invalid: ${msg}`)
      .onSuccess(() => MemoryIngestOrchestrator._asStringBody(item, candidate));
    if (bodyResult.isFailure()) {
      return fail(bodyResult.message);
    }
    const body: string = bodyResult.value;

    const addrResult: Result<IIdentityCodecResult> = this._resolveAddress(candidate.envelope.entityId, kind);
    if (addrResult.isFailure()) {
      return fail(`ingest '${item.id}': ${addrResult.message}`);
    }
    const addr: IIdentityCodecResult = addrResult.value;

    return (await this._resolveVerdict(candidate, kind, body, addr, snapshot, byKey)).onSuccess((verdict) =>
      this._planFromVerdict(item, candidate, addr, verdict, byKey)
    );
  }

  /**
   * Turn a resolved verdict into a candidate plan. A `new` verdict writes under the
   * candidate's own address. Every TARGET-bearing verdict
   * (`duplicate-of` / `supersede` / `merge-into`) is validated uniformly: the
   * target must be a real store record (fgv owns validation — a non-compliant host
   * resolver never smuggles a bogus id through) AND its kind must equal the
   * candidate's kind (a cross-kind target would write to the wrong scope). Only
   * `merge-into` re-addresses the write to the target's entity.
   */
  private _planFromVerdict(
    item: IIngestItem,
    candidate: ICandidateRecord,
    addr: IIdentityCodecResult,
    verdict: ResolutionVerdict,
    byKey: ReadonlyMap<string, IMemoryRecord<unknown>>
  ): Result<ICandidatePlan> {
    if (verdict.verdict === 'new') {
      return Convert.memoryId.convert(addr.idStem).onSuccess((refId) =>
        succeed({
          candidate,
          writeAddress: addr,
          writeEntityId: candidate.envelope.entityId,
          refId,
          refTarget: { scope: addr.scope, id: refId },
          verdict
        })
      );
    }
    // duplicate-of | supersede | merge-into: the target must exist and share the
    // candidate's kind. Lookup is on the canonical scoped key, so a stem reused
    // across scopes binds only the record the verdict actually named.
    const target: IMemoryRecord<unknown> | undefined = byKey.get(edgeTargetKey(verdict.target));
    if (target === undefined) {
      return fail(
        `ingest '${item.id}': ${verdict.verdict} target '${MemoryIngestOrchestrator._formatTarget(
          verdict.target
        )}' does not exist in the store`
      );
    }
    if (target.envelope.kind !== candidate.envelope.kind) {
      return fail(
        `ingest '${item.id}': ${verdict.verdict} target '${MemoryIngestOrchestrator._formatTarget(
          verdict.target
        )}' is kind '${target.envelope.kind}' but the candidate is kind '${candidate.envelope.kind}'`
      );
    }
    if (verdict.verdict === 'merge-into') {
      // Re-address the write to the target's entity, carrying the target record so
      // stage 6 can UNION its existing tags/links (never overwrite them).
      const targetEntityId: EntityId = target.envelope.entityId;
      // The merge target is a snapshot record, and `_scopeRecords` already proved
      // every snapshot record's address resolves before planning runs — so this
      // re-resolve (needed for the full codec result: scope + idStem + isVersioned)
      // cannot fail. No error-context wrap is warranted; a failure here would be a
      // logic contradiction, not a user-facing condition.
      return this._resolveAddress(targetEntityId, target.envelope.kind).onSuccess((targetAddr) =>
        Convert.memoryId.convert(targetAddr.idStem).onSuccess((refId) =>
          succeed({
            candidate,
            writeAddress: targetAddr,
            writeEntityId: targetEntityId,
            refId,
            refTarget: { scope: targetAddr.scope, id: refId },
            verdict,
            mergeTarget: target
          })
        )
      );
    }
    // duplicate-of | supersede: write under the candidate's own address.
    return Convert.memoryId.convert(addr.idStem).onSuccess((refId) =>
      succeed({
        candidate,
        writeAddress: addr,
        writeEntityId: candidate.envelope.entityId,
        refId,
        refTarget: { scope: addr.scope, id: refId },
        verdict
      })
    );
  }

  /**
   * Stage 4 — resolve a dedup verdict. Layer 1: an exact `{ kind, body }` match in
   * the candidate's scope is a `duplicate-of` (design note §1). Layer 2 (only when
   * a resolver + vector index + embedder are all wired): embed the candidate,
   * surface over-threshold neighbors, and dispatch to the {@link IEntityResolver}.
   * Otherwise the verdict is `new` (the exact-only fall-back path).
   */
  private async _resolveVerdict(
    candidate: ICandidateRecord,
    kind: Kind,
    body: string,
    addr: IIdentityCodecResult,
    snapshot: ReadonlyArray<IMemoryRecord<unknown>>,
    byKey: ReadonlyMap<string, IMemoryRecord<unknown>>
  ): Promise<Result<ResolutionVerdict>> {
    return this._findExactMatch(kind, body, addr.scope, snapshot).thenOnSuccess(async (matchId) => {
      if (matchId !== undefined) {
        // The exact-match cohort is filtered to `addr.scope`, so the match lives
        // under that scope — its scope-qualified target is `(addr.scope, matchId)`.
        return succeed({ verdict: 'duplicate-of', target: { scope: addr.scope, id: matchId } });
      }
      const layer2: ISimilarityWiring | undefined = this._similarity;
      if (layer2 === undefined) {
        // No layer-2: exact-only fall-back (the deterministic-identity host path).
        return succeed({ verdict: 'new' });
      }
      return this._resolveViaSimilarity(candidate, addr, body, layer2, byKey);
    });
  }

  /** Layer-2 similarity candidate-gen + resolver dispatch. */
  private async _resolveViaSimilarity(
    candidate: ICandidateRecord,
    addr: IIdentityCodecResult,
    body: string,
    wiring: ISimilarityWiring,
    byKey: ReadonlyMap<string, IMemoryRecord<unknown>>
  ): Promise<Result<ResolutionVerdict>> {
    return MemoryIngestOrchestrator._provisionalRecord(candidate, addr.idStem, body).thenOnSuccess(
      (provisional) => this._resolveViaSimilarityEmbedded(candidate, addr, wiring, byKey, provisional)
    );
  }

  /** Layer-2 continuation once the candidate has a provisional record to embed. */
  private async _resolveViaSimilarityEmbedded(
    candidate: ICandidateRecord,
    addr: IIdentityCodecResult,
    wiring: ISimilarityWiring,
    byKey: ReadonlyMap<string, IMemoryRecord<unknown>>,
    provisional: IMemoryRecord<unknown>
  ): Promise<Result<ResolutionVerdict>> {
    const embedded: Result<Float32Array> = await this._capture(
      () => wiring.embed(provisional),
      `ingest '${candidate.envelope.entityId}': embed candidate`
    );
    if (embedded.isFailure()) {
      return fail(embedded.message);
    }
    const queried = await this._capture(
      () => wiring.vectorIndex.query(embedded.value, this._similarityTopK),
      `ingest '${candidate.envelope.entityId}': similarity query`
    );
    if (queried.isFailure()) {
      return fail(queried.message);
    }
    const similar: IEntityResolutionCandidate[] = [];
    for (const hit of queried.value) {
      // Skip below-threshold hits and the candidate's OWN scope-qualified address
      // (a re-ingest of the same entity must not dedup against its prior version).
      // Both the scope AND the id must match to be "self" — a same-stem record in
      // another scope is a legitimate distinct neighbor.
      const isSelf: boolean = hit.target.scope === addr.scope && hit.target.id === addr.idStem;
      if (hit.score < this._similarityThreshold || isSelf) {
        continue;
      }
      const record: IMemoryRecord<unknown> | undefined = byKey.get(edgeTargetKey(hit.target));
      if (record !== undefined) {
        similar.push({ target: hit.target, record, score: hit.score });
      }
    }
    if (similar.length === 0) {
      return succeed({ verdict: 'new' });
    }
    return this._capture(
      () => wiring.resolver.resolve(candidate, similar),
      `ingest '${candidate.envelope.entityId}': resolve`
    );
  }

  /**
   * Find an existing record in `scope` whose `{ kind, body }` hash matches the
   * candidate's (layer-1 exact dedup). Invalidated temporal versions are excluded
   * — only a live (non-temporal or current) record deduplicates a candidate.
   */
  private _findExactMatch(
    kind: Kind,
    body: string,
    scope: MemoryScopeKey,
    snapshot: ReadonlyArray<IMemoryRecord<unknown>>
  ): Result<MemoryId | undefined> {
    // Same-kind, same-scope, LIVE (non-temporal or current) records are the exact
    // cohort. `_resolveAddress(...).map(...).orDefault()` collapses an unresolved
    // codec to a non-matching scope with no explicit failure branch.
    const cohort: ReadonlyArray<IMemoryRecord<unknown>> = snapshot.filter(
      (record) =>
        record.envelope.kind === kind &&
        !(isTemporalRecord(record) && !isVersionCurrent(record)) &&
        this._resolveAddress(record.envelope.entityId, record.envelope.kind)
          .onSuccess((addr) => succeed(addr.scope))
          .orDefault() === scope
    );
    return this._exactKey(kind, body).onSuccess((key) =>
      mapResults(
        cohort.map((record) =>
          MemoryIngestOrchestrator._recordBodyString(record).onSuccess((recordBody) =>
            this._exactKey(record.envelope.kind, recordBody).onSuccess((recordKey) =>
              succeed({ id: record.envelope.id, key: recordKey })
            )
          )
        )
      ).onSuccess((keyed) => succeed(keyed.find((entry) => entry.key === key)?.id))
    );
  }

  /**
   * The body of a persisted record, required to be a string (the store persists
   * only string bodies). Fails loudly rather than blind-casting an `unknown` body
   * into the exact-dedup hash — a non-string existing body is a store-integrity
   * fault, surfaced with context, not a silent miscompute.
   */
  private static _recordBodyString(record: IMemoryRecord<unknown>): Result<string> {
    if (typeof record.body !== 'string') {
      return fail(
        `ingest: stored record '${record.envelope.id}' has a non-string body (got ${typeof record.body})`
      );
    }
    return succeed(record.body);
  }

  /** The stage-4 exact-dedup key over `{ kind, body }` (design note §1). */
  private _exactKey(kind: Kind, body: string): Result<string> {
    return this._hasher.computeHash({ kind, body });
  }

  /** Stage 5 — relate (host), validate edges, and run the write-time cycle guard. */
  private async _relate(
    item: IIngestItem,
    writablePlans: ReadonlyArray<ICandidatePlan>,
    scoped: ReadonlyArray<IScopedRecord>,
    byKey: ReadonlyMap<string, IMemoryRecord<unknown>>
  ): Promise<Result<ReadonlyArray<ICandidateEdge>>> {
    const relationCandidates: IRelationCandidate[] = writablePlans.map((plan) => ({
      candidate: plan.candidate,
      id: plan.refTarget
    }));
    const proposed: Result<ReadonlyArray<ICandidateEdge>> = await this._capture(
      () => this._relationExtractor.relate({ item, candidates: relationCandidates }),
      `ingest '${item.id}': relate`
    );
    if (proposed.isFailure()) {
      return proposed;
    }
    // refIds and the existing-record view (`byKey`, shared with the verdict path)
    // both key on the canonical scoped address, so a stem reused across scopes
    // never aliases.
    const refIds: ReadonlySet<string> = new Set<string>(
      writablePlans.map((plan) => edgeTargetKey(plan.refTarget))
    );
    const validation: Result<true> = this._validateEdges(item, proposed.value, refIds, byKey);
    if (validation.isFailure()) {
      return fail(validation.message);
    }
    if (this._cycleGuard === 'reject') {
      const guard: Result<true> = assertNoCycles(
        MemoryIngestOrchestrator._existingEdges(scoped),
        proposed.value.map((e) => ({ source: e.source, target: e.edge.target, type: e.edge.type }))
      );
      if (guard.isFailure()) {
        return fail(`ingest '${item.id}': ${guard.message}`);
      }
    }
    return succeed(proposed.value);
  }

  /**
   * Validate stage-5 edges: each `source` must be a candidate being written; each
   * `target` must resolve to a sibling candidate or an existing store record. All
   * matching is on the canonical scope-qualified address.
   */
  private _validateEdges(
    item: IIngestItem,
    edges: ReadonlyArray<ICandidateEdge>,
    refIds: ReadonlySet<string>,
    byKey: ReadonlyMap<string, IMemoryRecord<unknown>>
  ): Result<true> {
    return mapResults(
      edges.map((edge) => {
        if (!refIds.has(edgeTargetKey(edge.source))) {
          return fail(
            `ingest '${item.id}': edge source '${MemoryIngestOrchestrator._formatTarget(
              edge.source
            )}' is not a candidate being written`
          );
        }
        const targetKey: string = edgeTargetKey(edge.edge.target);
        if (!refIds.has(targetKey) && byKey.get(targetKey) === undefined) {
          return fail(
            `ingest '${item.id}': edge target '${MemoryIngestOrchestrator._formatTarget(
              edge.edge.target
            )}' resolves to neither a sibling candidate nor an existing record`
          );
        }
        return succeed(true);
      })
    ).onSuccess(() => succeed(true));
  }

  /** Stage 6 — stamp provenance + edges, admit through the store, record the outcome. */
  private async _loadCandidate(
    item: IIngestItem,
    plan: ICandidatePlan,
    allEdges: ReadonlyArray<ICandidateEdge>
  ): Promise<Result<IIngestedRecordResult>> {
    const refKey: string = edgeTargetKey(plan.refTarget);
    const myEdges: ReadonlyArray<ICandidateEdge> = allEdges.filter((e) => edgeTargetKey(e.source) === refKey);
    if (plan.verdict.verdict === 'duplicate-of') {
      // No write: the existing target satisfied the candidate. The target id is a
      // typed field of the narrowed `duplicate-of` verdict — no cast, no guard.
      return succeed({
        candidate: plan.candidate,
        resolution: plan.verdict,
        disposition: 'deduped',
        id: plan.verdict.target.id,
        edges: myEdges
      });
    }
    return this._buildRecord(item, plan, myEdges).thenOnSuccess(async (record) =>
      (await this._store.put(record))
        .withErrorFormat((msg) => `ingest '${item.id}': write failed: ${msg}`)
        .onSuccess((persisted) => {
          const disposition: IngestDisposition = plan.verdict.verdict === 'merge-into' ? 'merged' : 'written';
          const interlock: 'temporal-versioned' | undefined =
            plan.writeAddress.isVersioned && myEdges.some((e) => e.edge.type === CONTRADICTS_LINK_TYPE)
              ? 'temporal-versioned'
              : undefined;
          return succeed({
            candidate: plan.candidate,
            resolution: plan.verdict,
            disposition,
            id: persisted.envelope.id,
            record: persisted,
            edges: myEdges,
            ...(interlock !== undefined ? { interlock } : {})
          });
        })
    );
  }

  /** Build the fully-stamped record to persist (provenance + edges + placeholder txn fields). */
  private _buildRecord(
    item: IIngestItem,
    plan: ICandidatePlan,
    myEdges: ReadonlyArray<ICandidateEdge>
  ): Result<IMemoryRecord<unknown>> {
    const base: Omit<IMemoryEnvelope, 'id' | 'seq' | 'contentHash' | 'created' | 'updated'> =
      plan.candidate.envelope;
    // For merge-into the store's `applyUpdate` REPLACES array fields wholesale, so
    // the persisted envelope must already carry the UNION of the target's existing
    // tags/links/provenance and the candidate's — otherwise the merge silently
    // wipes the target's prior links/tags.
    const target: IMemoryRecord<unknown> | undefined = plan.mergeTarget;
    const priorLinks: ReadonlyArray<IEdge> = target !== undefined ? target.envelope.links : [];
    const priorTags: ReadonlyArray<Tag> = target !== undefined ? target.envelope.tags : [];
    const priorProvenance: IProvenance = target !== undefined ? target.envelope.provenance : { source: '' };
    return Convert.memoryId.convert(plan.writeAddress.idStem).onSuccess((id) =>
      // Dedup the combined links by canonical edge key: the target's prior links, the
      // candidate's own links, and the stage-5 edges (two candidates that resolve
      // merge-into the SAME target share a `refId` — hence the same `myEdges` — and a
      // relation extractor may repeat an edge) each appear exactly once.
      this._dedupEdges([...priorLinks, ...base.links, ...myEdges.map((e) => e.edge)]).onSuccess((links) => {
        const provenance: IProvenance = {
          // Preserve the target's provenance extension keys, overlay the candidate's,
          // then stamp the host-ingest source + derivedFrom (target present only for
          // merge-into; otherwise the seed is inert).
          ...(target !== undefined ? priorProvenance : {}),
          ...base.provenance,
          source: HOST_INGEST_PROVENANCE_SOURCE,
          ...(item.sourceId !== undefined ? { derivedFrom: item.sourceId } : {})
        };
        const envelope: IMemoryEnvelope = {
          ...base,
          id,
          entityId: plan.writeEntityId,
          seq: 0,
          contentHash: '',
          created: 0,
          updated: 0,
          provenance,
          tags: MemoryIngestOrchestrator._unionTags(priorTags, base.tags),
          links
        };
        return succeed({ envelope, body: plan.candidate.body });
      })
    );
  }

  /** Union two tag lists, de-duplicated, preserving first-occurrence order. */
  private static _unionTags(prior: ReadonlyArray<Tag>, incoming: ReadonlyArray<Tag>): ReadonlyArray<Tag> {
    const seen: Set<string> = new Set<string>();
    const out: Tag[] = [];
    for (const tag of [...prior, ...incoming]) {
      if (!seen.has(tag)) {
        seen.add(tag);
        out.push(tag);
      }
    }
    return out;
  }

  /** De-duplicate a link list by canonical edge hash, preserving first-occurrence order. */
  private _dedupEdges(edges: ReadonlyArray<IEdge>): Result<ReadonlyArray<IEdge>> {
    const seen: Set<string> = new Set<string>();
    const deduped: IEdge[] = [];
    return mapResults(
      edges.map((edge) =>
        this._hasher.computeHash(edge).onSuccess((key) => {
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(edge);
          }
          return succeed(key);
        })
      )
    ).onSuccess(() => succeed(deduped));
  }

  /** Resolve a `(kind, entityId)` to its storage address via the registered codec. */
  private _resolveAddress(entityId: EntityId, kind: Kind): Result<IIdentityCodecResult> {
    const codec: IIdentityCodec | undefined = this._codecs.get(kind) ?? this._defaultCodec;
    if (codec === undefined) {
      return fail(`no identity codec registered for kind '${kind}'`);
    }
    return codec.encode(entityId);
  }

  /** Run a host hook, normalizing a thrown/rejected hook into a Failure (never throws across the seam). */
  private async _capture<T>(op: () => Promise<Result<T>>, label: string): Promise<Result<T>> {
    try {
      return await op();
    } catch (err) {
      const message: string = `${label} threw: ${String(err)}`;
      this._logger.warn(message);
      return fail(message);
    }
  }

  /**
   * Every existing outbound edge in the snapshot, as cycle-guard edges. The
   * source is the record's own scope-qualified address (already resolved by
   * {@link MemoryIngestOrchestrator._scopeRecords}); the target is the edge's
   * own scoped target. Both ends are scoped so the guard never conflates a stem
   * shared across scopes into one graph node.
   */
  private static _existingEdges(scoped: ReadonlyArray<IScopedRecord>): ReadonlyArray<ICycleGuardEdge> {
    const edges: ICycleGuardEdge[] = [];
    for (const s of scoped) {
      for (const edge of s.record.envelope.links) {
        edges.push({ source: s.address, target: edge.target, type: edge.type });
      }
    }
    return edges;
  }

  /**
   * Resolve every snapshot record's scope-qualified `(scope, id)` address via its
   * registered codec. Fails loudly if a record's kind has no resolvable codec —
   * the edge path cannot place an un-scopeable record in the graph, and a missing
   * codec for a stored kind is a real misconfiguration, not something to paper over.
   */
  private _scopeRecords(
    records: ReadonlyArray<IMemoryRecord<unknown>>
  ): Result<ReadonlyArray<IScopedRecord>> {
    return mapResults(
      records.map((record) =>
        this._resolveAddress(record.envelope.entityId, record.envelope.kind)
          .withErrorFormat((msg) => `cannot resolve scope for stored record '${record.envelope.id}': ${msg}`)
          .onSuccess((addr) => succeed({ address: { scope: addr.scope, id: record.envelope.id }, record }))
      )
    );
  }

  /** Human-readable `scope/id` rendering of a scoped target for edge-validation diagnostics. */
  private static _formatTarget(target: IEdgeTarget): string {
    return `${target.scope}/${target.id}`;
  }

  /** A provisional record for embedding a candidate (placeholder txn-time fields). */
  private static _provisionalRecord(
    candidate: ICandidateRecord,
    idStem: string,
    body: string
  ): Result<IMemoryRecord<unknown>> {
    return Convert.memoryId.convert(idStem).onSuccess((id) => {
      const envelope: IMemoryEnvelope = {
        ...candidate.envelope,
        id,
        seq: 0,
        contentHash: '',
        created: 0,
        updated: 0
      };
      return succeed({ envelope, body });
    });
  }

  /** Require a candidate body to be a string (the store persists only string bodies). */
  private static _asStringBody(item: IIngestItem, candidate: ICandidateRecord): Result<string> {
    if (typeof candidate.body !== 'string') {
      return fail(
        `ingest '${item.id}': candidate body for kind '${
          candidate.envelope.kind
        }' must be a string (got ${typeof candidate.body})`
      );
    }
    return succeed(candidate.body);
  }
}
