/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { EntityId, Kind, LinkType, MemoryId, Tag } from './ids';

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
  /** Back-link to the source experience record. Enables the cross-kind provenance spine. */
  readonly derivedFrom?: MemoryId;
  /** Opaque extension payload — consumer-owned, never interpreted by the store. */
  readonly [key: string]: unknown;
}

/**
 * An attributed link between two records. Carries the relation type, the
 * target id, and optional confidence / provenance / world-truth validity.
 * Replaces bare string references (e.g. PersonAIlity's `IMtmRef` becomes an
 * `IEdge` with `type: LinkType('mtm-ref')`).
 * @public
 */
export interface IEdge {
  /** Open-vocabulary relation type. */
  readonly type: LinkType;
  /** The linked-to record. */
  readonly target: MemoryId;
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
