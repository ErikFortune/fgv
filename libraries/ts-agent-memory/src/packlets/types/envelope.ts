/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { EntityId, Kind, LinkType, MemoryId, MemoryScopeKey, Tag } from './ids';

/**
 * Origin of a provenance attribution. Open vocabulary: the three named
 * sources are conventional, but the `(string & {})` arm admits any other
 * source string without resignature.
 * @public
 */
export type ProvenanceSource = 'agent' | 'host-ingest' | 'human' | (string & {});

/**
 * Structured provenance for a record or an edge. Never a flat enum — the
 * `[key: string]: unknown` index signature lets a consumer attach an opaque
 * domain payload (e.g. PersonAIlity's sentiment / epistemic blocks) without
 * changing this interface, while still satisfying the no-`any` rule.
 * @public
 */
export interface IProvenance {
  /** Where the attribution came from. */
  readonly source: ProvenanceSource;
  /** Optional human or agent identifier responsible for the write. */
  readonly by?: string;
  /** Optional model identifier, when a model produced the content. */
  readonly model?: string;
  /** Optional confidence in `[0, 1]`. */
  readonly confidence?: number;
  /**
   * Scope-qualified back-link to the source record. Enables the cross-kind
   * provenance spine. A scope-qualified {@link IEdgeTarget} (not a bare
   * {@link MemoryId}) because per-scope codecs (e.g. the MTM codec's `turn-<n>`
   * stems) legally reuse a stem across scopes, so a bare id would be ambiguous —
   * the same reason {@link IEdge.target} is scope-qualified.
   */
  readonly derivedFrom?: IEdgeTarget;
  /** Opaque extension payload — consumer-owned, never interpreted by the store. */
  readonly [key: string]: unknown;
}

/**
 * The physical address of a linked-to record: the `(scope, id)` pair that
 * uniquely identifies it. Both components are required because a bare
 * {@link MemoryId} is NOT unique across scopes — per-scope codecs (e.g. the
 * medium-term codec's `turn-<n>` stems) legally mint the same stem under
 * different scopes, so an edge that carried only the id would be ambiguous.
 * `(scope, id)` matches the store's `getById(scope, id)` addressing and the
 * index's composite primary key.
 * @public
 */
export interface IEdgeTarget {
  /** The scope the target record lives under. */
  readonly scope: MemoryScopeKey;
  /** The target record's stable file-stem id (unique WITHIN {@link IEdgeTarget.scope}). */
  readonly id: MemoryId;
}

/**
 * The canonical composite-key string for an {@link IEdgeTarget}: scope + id,
 * NUL-separated. NUL is excluded from both components (scope segments are
 * filename-safe; {@link MemoryId} is portable-filename-safe), so it is a
 * collision-proof separator. This is the ONE canonicalization every consumer
 * that keys on a scoped target uses — the backlink index, the cycle guard, and
 * the ingest edge-validation path all route through it so their notions of
 * "same target" cannot drift.
 * @public
 */
export function edgeTargetKey(target: IEdgeTarget): string {
  return `${target.scope}\0${target.id}`;
}

/**
 * An attributed link between two records. Carries the relation type, the
 * scope-qualified {@link IEdgeTarget | target}, and optional confidence /
 * provenance / world-truth validity. Replaces bare string references (e.g.
 * PersonAIlity's `IMtmRef` becomes an `IEdge` with `type: LinkType('mtm-ref')`).
 * @public
 */
export interface IEdge {
  /** Open-vocabulary relation type. */
  readonly type: LinkType;
  /** The scope-qualified address of the linked-to record. */
  readonly target: IEdgeTarget;
  /** Optional confidence in `[0, 1]`. */
  readonly confidence?: number;
  /** Optional structured provenance for the link itself. */
  readonly provenance?: IProvenance;
  /** World-truth validity start (epoch ms). Present only on temporal edges. */
  readonly valid_at?: number;
  /**
   * World-truth validity end (epoch ms). `null` = still valid; absent = no
   * temporal extent.
   */
  // eslint-disable-next-line @rushstack/no-new-null -- null is a meaningful value here (still-valid) distinct from absent (no temporal extent); design-lock §2.3
  readonly invalid_at?: number | null;
}

/**
 * Optional bi-temporal validity block on an envelope. Present only on
 * temporal kinds; absent = zero cost for atemporal kinds.
 * @public
 */
export interface ITemporalBlock {
  /** World-truth validity start (epoch ms). */
  readonly valid_at?: number;
  /** World-truth validity end (epoch ms). `null` = still valid. */
  // eslint-disable-next-line @rushstack/no-new-null -- null is a meaningful value here (still-valid) distinct from absent; design-lock §2.4
  readonly invalid_at?: number | null;
}

/**
 * The invariant identity + transaction-time envelope carried by every memory
 * record, independent of the per-kind body.
 * @public
 */
export interface IMemoryEnvelope {
  // --- Core identity ---
  /** Stable file-stem identifier. MUST equal the on-disk filename stem. */
  readonly id: MemoryId;
  /** Consumer-supplied domain key. Equals {@link IMemoryEnvelope.id | id} for non-temporal kinds. */
  readonly entityId: EntityId;
  /** Consumer-registered kind; dispatches the body Converter. */
  readonly kind: Kind;
  /** Open-vocabulary tags. */
  readonly tags: ReadonlyArray<Tag>;
  /** Attributed outbound edges. */
  readonly links: ReadonlyArray<IEdge>;

  // --- Transaction-time metadata (always present) ---
  /** Epoch ms of the first write. Immutable after creation. */
  readonly created: number;
  /** Epoch ms of the most recent write. */
  readonly updated: number;
  /**
   * Monotonic write counter within the store instance, assigned by the store
   * on every successful put. Enables stable cursor paging over observation
   * records without a full walk.
   */
  readonly seq: number;
  /**
   * Content hash over the canonical `{ kind, body, links }`. The dedup key:
   * an exact match is a no-op upsert that returns the existing record.
   */
  readonly contentHash: string;
  /**
   * Store-computed host-defined ordering value, produced by the kind's
   * {@link RankProjector} on every put/update and stamped into the envelope in
   * the same pass that recomputes {@link IMemoryEnvelope.contentHash | contentHash}.
   * Absent when the kind has no registered projector (or the projector threw on
   * this record). Ordered retrieval (`orderBy: 'rank'`) and the index's rank view
   * sort by this value descending, placing records with an absent `rank` last.
   */
  readonly rank?: number;
  /** Structured provenance (never a flat enum). */
  readonly provenance: IProvenance;

  // --- Optional temporal block ---
  /** Bi-temporal validity. Present only on temporal kinds. */
  readonly temporal?: ITemporalBlock;

  /**
   * Vector-index entry reference, set by the vector index on write. `null` =
   * not embedded; absent = same as `null` (backwards-compat seam).
   */
  // eslint-disable-next-line @rushstack/no-new-null -- null is the explicit "not embedded" sentinel distinct from absent (backwards-compat seam); design-lock §2.5
  readonly embeddingRef?: string | null;
}

/**
 * A complete memory record: the invariant {@link IMemoryEnvelope} plus the
 * typed, per-kind body. The store's public surface uses
 * `IMemoryRecord<unknown>`; consumers narrow `TBody` by checking
 * `envelope.kind` and validating through the registered Converter.
 * @public
 */
export interface IMemoryRecord<TBody = unknown> {
  /** The invariant identity + transaction-time envelope. */
  readonly envelope: IMemoryEnvelope;
  /** The per-kind, Converter-validated body. */
  readonly body: TBody;
}

/**
 * A per-kind host projection from a fully-resolved (post-merge) memory record
 * to a numeric ordering value. Registered per kind at store construction (see
 * `rankProjectors`); the store runs it on every put/update over the same
 * resolved record whose `contentHash` it computes, stamping the result into
 * {@link IMemoryEnvelope.rank}. The store never interprets the body — the host
 * owns what the number means. A projector that throws is treated as "no rank
 * for this record" (logged at `warn`), never failing the write.
 * @public
 */
export type RankProjector = (record: IMemoryRecord<unknown>) => number;
