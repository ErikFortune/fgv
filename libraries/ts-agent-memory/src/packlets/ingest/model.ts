/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { IEdge, IEdgeTarget, IMemoryEnvelope, IMemoryRecord, Kind, MemoryId, Tag } from '../types';

/**
 * A single unit of raw source material handed to the ingest pipeline. The host
 * owns the shape of {@link IIngestItem.content | content} — fgv never interprets
 * it; it flows opaquely into the host's classifier and extractor (stages 2-3).
 *
 * Single-item ingest is FIRST-CLASS: the orchestrator's primary entry point
 * takes one `IIngestItem` (per-turn streaming), and the batch entry point is a
 * convenience loop over it.
 * @public
 */
export interface IIngestItem {
  /**
   * Host-owned identity for this source item. Opaque to fgv; used only in
   * diagnostics and echoed back on the {@link IIngestItemResult}.
   */
  readonly id: string;
  /**
   * The opaque source payload the host's classifier / extractor understand
   * (e.g. a raw turn, a document, a tool-call transcript). Never interpreted by
   * fgv.
   */
  readonly content: unknown;
  /**
   * Optional scope-qualified back-link to the memory record this item was derived
   * from (e.g. the MTM turn an extracted fact came from). When present, fgv stamps
   * it as {@link IProvenance.derivedFrom | provenance.derivedFrom} on every record
   * ingested from this item (stage 6) — the cross-kind provenance spine. A
   * scope-qualified {@link IEdgeTarget} (not a bare {@link MemoryId}) because
   * per-scope codecs legally reuse a stem across scopes, so a bare id would be
   * ambiguous.
   */
  readonly sourceId?: IEdgeTarget;
  /** Optional opaque metadata carried alongside the item; never interpreted by fgv. */
  readonly metadata?: Record<string, unknown>;
}

/**
 * The host classifier's verdict for an {@link IIngestItem} (stage 2). Guides the
 * host's own extractor (stage 3) and supplies the default `kind` / `tags` /
 * `confidence` fgv stamps when the extractor does not override them.
 *
 * Extensible: the `[key: string]: unknown` arm lets the host attach an opaque
 * classification payload without changing this interface.
 * @public
 */
export interface IMemoryClassification {
  /** The record kind the item classifies as. */
  readonly kind: Kind;
  /** Optional tags the classifier assigns. */
  readonly tags?: ReadonlyArray<Tag>;
  /** Optional classifier confidence in `[0, 1]`; flows to `provenance.confidence`. */
  readonly confidence?: number;
  /** Opaque, host-owned extension payload — never interpreted by fgv. */
  readonly [key: string]: unknown;
}

/**
 * The store-owned envelope fields fgv derives or stamps: `id` (from the codec),
 * and the transaction-time metadata (`seq` / `contentHash` / `created` /
 * `updated`). A {@link ICandidateRecord} supplies everything EXCEPT these.
 * @public
 */
export type StoreStampedEnvelopeField = 'id' | 'seq' | 'contentHash' | 'created' | 'updated';

/**
 * A host-extracted candidate record (stage 3 output). The host supplies the
 * full envelope MINUS the {@link StoreStampedEnvelopeField | store-stamped
 * fields} (fgv derives `id` from the codec; the store stamps the rest) plus the
 * typed body. Every candidate body is validated against the kind's registered
 * Converter before it can reach the store (the typed validation boundary).
 * @public
 */
export interface ICandidateRecord {
  /** The host-supplied envelope, minus the store-stamped fields. */
  readonly envelope: Omit<IMemoryEnvelope, StoreStampedEnvelopeField>;
  /** The per-kind body (a markdown string in v1), validated on ingest. */
  readonly body: unknown;
}

/**
 * A near-duplicate candidate surfaced to the {@link IEntityResolver} by stage-4
 * layer-2 similarity search: an existing record whose embedding is within the
 * similarity threshold of the incoming candidate.
 * @public
 */
export interface IEntityResolutionCandidate {
  /**
   * The existing record's scope-qualified `(scope, id)` address. Scope-qualified
   * (not a bare {@link MemoryId}) because per-scope codecs legally mint the same
   * stem under different scopes — the {@link ResolutionVerdict} target the resolver
   * returns must round-trip this exact address so the write binds the intended
   * record.
   */
  readonly target: IEdgeTarget;
  /** The existing record. */
  readonly record: IMemoryRecord<unknown>;
  /** The backend similarity score (higher = more similar). */
  readonly score: number;
}

/**
 * The four dedup verdicts a {@link IEntityResolver} (or fgv's exact-match layer)
 * returns for a candidate. See the design note §3 for the verdict → write
 * disposition mapping. Each target-bearing arm carries a scope-qualified
 * {@link IEdgeTarget} (not a bare {@link MemoryId}) so the verdict resolves to a
 * single record even when a filename stem is reused across scopes.
 * @public
 */
export type ResolutionVerdict =
  | { readonly verdict: 'new' }
  | { readonly verdict: 'duplicate-of'; readonly target: IEdgeTarget }
  | { readonly verdict: 'supersede'; readonly target: IEdgeTarget }
  | { readonly verdict: 'merge-into'; readonly target: IEdgeTarget };

/**
 * How a candidate was ultimately written (or not) after resolution.
 *
 * - `written` — persisted as a fresh record (verdict `new`), or as a superseding
 *   record (verdict `supersede`).
 * - `deduped` — not written; an existing record satisfied it (verdict
 *   `duplicate-of`, incl. every layer-1 exact `{ kind, body }` match).
 * - `merged` — merged into an existing target entity (verdict `merge-into`).
 * @public
 */
export type IngestDisposition = 'written' | 'deduped' | 'merged';

/**
 * A stage-5 attributed edge proposal: the {@link ICandidateEdge.edge | edge} to
 * add, sourced from {@link ICandidateEdge.source | source}. The source MUST be a
 * candidate being written in this ingest (edges land on the source record's
 * `envelope.links`); the edge's `target` must resolve to a sibling candidate or
 * an existing store record.
 * @public
 */
export interface ICandidateEdge {
  /** The scope-qualified reference (codec `(scope, idStem)`) of the candidate the edge originates from. */
  readonly source: IEdgeTarget;
  /** The attributed edge (type / target / optional confidence / provenance). */
  readonly edge: IEdge;
}

/**
 * Per-candidate outcome of an ingest run.
 * @public
 */
export interface IIngestedRecordResult {
  /** The candidate the outcome is for. */
  readonly candidate: ICandidateRecord;
  /** The resolution verdict fgv reached (or the resolver returned). */
  readonly resolution: ResolutionVerdict;
  /** What the write ultimately did. */
  readonly disposition: IngestDisposition;
  /**
   * The stored record's id: the newly-written id (`written` / `merged`), or the
   * existing target's id (`deduped`).
   */
  readonly id: MemoryId;
  /** The persisted record, when a write happened (`written` / `merged`). */
  readonly record?: IMemoryRecord<unknown>;
  /** The stage-5 edges attached to this candidate before the write. */
  readonly edges: ReadonlyArray<ICandidateEdge>;
  /**
   * Informational diagnostic, set to `'temporal-versioned'` when the
   * contradicts→temporal interlock is recognized: a `contradicts` edge was
   * attached to a candidate of a temporal kind.
   *
   * @remarks
   * A temporal kind ALWAYS writes through the store's versioned put path (that is
   * the codec's `isVersioned` behavior — the prior version is invalidated and a
   * new version written on every write, contradicts edge or not). This flag does
   * NOT cause that routing; it is a diagnostic marker that the contradicts-driven
   * scenario occurred, so callers can distinguish a contradiction-superseding
   * version from an ordinary revision.
   */
  readonly interlock?: 'temporal-versioned';
}

/**
 * The result of ingesting a single {@link IIngestItem}: the item plus the
 * per-candidate outcomes (one item can yield zero or many candidate records).
 * @public
 */
export interface IIngestItemResult {
  /** The item that was ingested. */
  readonly item: IIngestItem;
  /** The per-candidate outcomes, in extraction order. */
  readonly records: ReadonlyArray<IIngestedRecordResult>;
}
