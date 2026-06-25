/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { JsonObject } from '@fgv/ts-json-base';
import { IJsonEditorOptions, JsonEditor } from '@fgv/ts-json';
import { IEdge, IMemoryEnvelope, IMemoryRecord, IProvenance } from './envelope';
import { MemoryId, Tag } from './ids';

/**
 * The granularity at which the store deduplicates an incoming write against the
 * existing vault, declared per kind via {@link IWritePolicy.dedupScope}.
 *
 * - `'content'`: scope-wide cross-id content dedup. An identical
 *   `{ kind, body, links }` triple ANYWHERE in the scope — even under a
 *   different id — is a no-op that returns the existing record. The knowledge
 *   kind family uses this.
 * - `'entity'`: same-id content dedup only. An identical re-put of the SAME
 *   entity is a no-op, but two DISTINCT entities with identical content never
 *   collapse. The experience (memory) kind families use this so that, e.g.,
 *   two turns whose summaries happen to be byte-identical both persist.
 * @public
 */
export type DedupScope = 'content' | 'entity';

/**
 * The default {@link DedupScope} applied when a policy does not declare one.
 * Entity-scoped dedup is the safe default — it never silently collapses two
 * distinct entities with coincidentally-identical content.
 * @public
 */
export const DEFAULT_DEDUP_SCOPE: DedupScope = 'entity';

/**
 * The admission decision returned by {@link IWritePolicy.admit}.
 * @public
 */
export type AdmissionDecision =
  | { readonly decision: 'accept' }
  | { readonly decision: 'reject'; readonly reason: string }
  | {
      readonly decision: 'cull-oldest';
      /** {@link MemoryId}s to evict before writing the incoming record. */
      readonly evict: ReadonlyArray<MemoryId>;
    };

/**
 * A per-kind write policy, injected at store construction. Invoked AFTER
 * content-hash dedup (dedup is always pre-policy). The policy decides
 * admission and, on update, applies a JSON Merge Patch (RFC-7386) restricted
 * to the declared mutable fields.
 * @public
 */
export interface IWritePolicy {
  /**
   * Names of the fields a merge-patch update may touch. Fields outside this
   * list are immutable; a change to one constitutes a new entity (its
   * `contentHash` differs). Used by {@link IWritePolicy.applyUpdate} to
   * restrict which fields the patch applies.
   */
  readonly mutableFields: ReadonlyArray<string>;

  /**
   * The granularity at which the store deduplicates an incoming write for this
   * kind. Optional; when absent the store applies {@link DEFAULT_DEDUP_SCOPE}
   * (`'entity'`). See {@link DedupScope}.
   */
  readonly dedupScope?: DedupScope;

  /**
   * Determine whether the incoming record is admitted.
   * @param incoming - The record about to be written.
   * @param existing - The admission cohort the kind's cap applies to: the
   * records in the same scope of the same kind, EXCLUDING the record at
   * `incoming`'s target id. Empty on a first write into an empty cohort.
   * Excluding the target id makes the post-write count uniform
   * (`existing.length + 1`) across first-writes and same-id updates. A
   * last-write-wins policy that has no cap ignores this argument.
   * @returns A {@link AdmissionDecision}.
   */
  admit(
    incoming: IMemoryRecord<unknown>,
    existing: ReadonlyArray<IMemoryRecord<unknown>>
  ): Result<AdmissionDecision>;

  /**
   * Apply a JSON Merge Patch (RFC-7386) to the mutable fields of an existing
   * record. Called when admission is `accept` AND a record with the same
   * `entityId` already exists (an update, not a first write).
   *
   * @param existing - The current persisted record.
   * @param patch - A partial JSON object in Merge Patch format. `null`
   * deletes the corresponding key; arrays replace wholesale; nested objects
   * deep-merge. Only keys in {@link IWritePolicy.mutableFields} are applied.
   * @returns The updated record (envelope + body).
   */
  applyUpdate(
    existing: IMemoryRecord<unknown>,
    patch: Record<string, unknown>
  ): Result<IMemoryRecord<unknown>>;
}

/**
 * RFC-7386-compliant merge options for {@link IWritePolicy.applyUpdate}.
 *
 * @remarks
 * Phase-A verification (design-lock §5.1) confirmed `@fgv/ts-json`'s
 * `JsonEditor` diverges from RFC-7386 under its defaults on two axes —
 * `nullAsDelete` defaults `false` and `arrayMergeBehavior` defaults
 * `'append'`. Both are corrected here via the existing option surface, so the
 * primitive is composed (not extended, not hand-rolled).
 */
const MERGE_PATCH_OPTIONS: Partial<IJsonEditorOptions> = {
  merge: {
    nullAsDelete: true,
    arrayMergeBehavior: 'replace'
  }
};

/**
 * Last-write-wins write policy for the knowledge kind family. Admission
 * always accepts (no cap, no cull); updates apply an RFC-7386 merge patch
 * restricted to the knowledge mutable surface.
 *
 * @remarks
 * **Merge-surface pin (resolves design-lock §5.3's body-vs-envelope muddle).**
 * The declared `mutableFields` span both axes of a record: `body` is the
 * per-kind body, while `tags` / `links` / `provenance` / `embeddingRef` live
 * on the {@link IMemoryEnvelope}. `applyUpdate` projects exactly those fields
 * — each read from its canonical location — into a single record-level JSON
 * view, runs the merge over that view, then rebuilds a coherent record. The
 * identity and transaction-time envelope fields (`id`, `entityId`, `kind`,
 * `created`, `updated`, `seq`, `contentHash`) are NOT mutable and are
 * preserved verbatim; the store stamps `updated` / `seq` on write.
 * @public
 */
export class KnowledgeLwwPolicy implements IWritePolicy {
  /**
   * The knowledge mutable surface: the body plus the envelope metadata a
   * consumer may revise without minting a new entity.
   */
  public readonly mutableFields: ReadonlyArray<string> = [
    'body',
    'tags',
    'links',
    'provenance',
    'embeddingRef'
  ];

  /**
   * Knowledge dedups scope-wide: an identical `{ kind, body, links }` triple
   * anywhere in the `knowledge` scope — even under a different `docId` — is a
   * no-op. Declared explicitly so the B1 content-dedup behavior (and its tests)
   * are unchanged by the {@link DedupScope} amendment.
   */
  public readonly dedupScope: DedupScope = 'content';

  /** Deep-clones the mutable view without RFC-7386 null-deletion semantics. */
  private readonly _cloneEditor: JsonEditor;
  /** Applies the RFC-7386 merge patch. */
  private readonly _mergeEditor: JsonEditor;

  private constructor(cloneEditor: JsonEditor, mergeEditor: JsonEditor) {
    this._cloneEditor = cloneEditor;
    this._mergeEditor = mergeEditor;
  }

  /**
   * Family-convention factory. Constructs the shared `JsonEditor` instances
   * (one for cloning, one for the RFC-7386 merge), both with the template /
   * conditional / multivalue / reference rules disabled (empty rules array).
   */
  public static create(): Result<KnowledgeLwwPolicy> {
    return JsonEditor.create({}, []).onSuccess((cloneEditor) =>
      JsonEditor.create(MERGE_PATCH_OPTIONS, []).onSuccess((mergeEditor) =>
        succeed(new KnowledgeLwwPolicy(cloneEditor, mergeEditor))
      )
    );
  }

  /** {@inheritDoc IWritePolicy.admit} */
  public admit(
    __incoming: IMemoryRecord<unknown>,
    __existing: ReadonlyArray<IMemoryRecord<unknown>>
  ): Result<AdmissionDecision> {
    // Last-write-wins: always accept. No cap, no cull.
    return succeed({ decision: 'accept' });
  }

  /** {@inheritDoc IWritePolicy.applyUpdate} */
  public applyUpdate(
    existing: IMemoryRecord<unknown>,
    patch: Record<string, unknown>
  ): Result<IMemoryRecord<unknown>> {
    // Project the mutable fields into a single record-level view, each sourced
    // from its canonical location. `embeddingRef` is omitted when `undefined`
    // (the editor rejects undefined property values).
    const view: Record<string, unknown> = {
      body: existing.body,
      tags: existing.envelope.tags,
      links: existing.envelope.links,
      provenance: existing.envelope.provenance
    };
    if (existing.envelope.embeddingRef !== undefined) {
      view.embeddingRef = existing.envelope.embeddingRef;
    }

    // Restrict the incoming patch to the declared mutable fields; out-of-scope
    // keys are never applied (the store enforces the same constraint).
    const scopedPatch: Record<string, unknown> = {};
    for (const field of this.mutableFields) {
      if (field in patch) {
        scopedPatch[field] = patch[field];
      }
    }

    // Clone the view (no null-deletion), then apply the RFC-7386 merge patch
    // onto the clone so the persisted record is never mutated in place.
    return this._cloneEditor
      .mergeObjectInPlace({}, view as JsonObject)
      .onSuccess((clone) => this._mergeEditor.mergeObjectInPlace(clone, scopedPatch as JsonObject))
      .onSuccess((merged) => this._rebuild(existing, merged));
  }

  /**
   * Reassemble a record from the merged mutable view. `body` / `tags` /
   * `links` / `provenance` are required and may not be deleted by a patch.
   * `embeddingRef` is optional: when it is absent from the merged view —
   * because the existing record never carried it OR a `null` patch deleted it
   * (RFC-7386) — it is restored as `undefined` (absent), NOT `null`. This keeps
   * an originally-absent `embeddingRef` from silently flipping to `null` on an
   * unrelated update, so the field round-trips hash-stably through the store's
   * content-hash recomputation.
   */
  private _rebuild(existing: IMemoryRecord<unknown>, merged: JsonObject): Result<IMemoryRecord<unknown>> {
    const required: ReadonlyArray<string> = ['body', 'tags', 'links', 'provenance'];
    const missing: ReadonlyArray<string> = required.filter((field) => !(field in merged));
    if (missing.length > 0) {
      return fail(`knowledge LWW: merge patch may not delete required field(s): ${missing.join(', ')}`);
    }

    // The merged values are JSON projections of the already-validated typed
    // record; restore the domain types. (The types packlet cannot import the
    // converters packlet without a cycle, so these are structural restorations
    // of fields the merge preserved, not fresh untrusted input.)
    const envelope: IMemoryEnvelope = {
      ...existing.envelope,
      tags: merged.tags as unknown as ReadonlyArray<Tag>,
      links: merged.links as unknown as ReadonlyArray<IEdge>,
      provenance: merged.provenance as unknown as IProvenance,
      embeddingRef: 'embeddingRef' in merged ? (merged.embeddingRef as string | null) : undefined
    };
    return succeed({ envelope, body: merged.body });
  }
}

/**
 * Parameters for {@link MemoryCapCullPolicy.create}.
 * @public
 */
export interface IMemoryCapCullPolicyParams {
  /**
   * Maximum number of records the policy admits before culling the oldest.
   * Counted over the `existing` cohort passed to {@link IWritePolicy.admit}.
   * Absent = no cap (admission always accepts).
   */
  readonly maxRecords?: number;
  /**
   * The fields a merge-patch update may touch (drawn from the record-level
   * mutable vocabulary: `body` / `tags` / `links` / `provenance` /
   * `embeddingRef`). Fields outside this list are immutable.
   */
  readonly mutableFields: ReadonlyArray<string>;
}

/**
 * The record-level fields a {@link MemoryCapCullPolicy} merge-patch may project,
 * mapped to their canonical location on a record. Mirrors the store's
 * mutable-field accessor vocabulary; a declared mutable field outside this set
 * is inert (the store cannot project it either).
 */
const CAP_CULL_FIELD_READERS: ReadonlyMap<string, (record: IMemoryRecord<unknown>) => unknown> = new Map<
  string,
  (record: IMemoryRecord<unknown>) => unknown
>([
  ['body', (r) => r.body],
  ['tags', (r) => r.envelope.tags],
  ['links', (r) => r.envelope.links],
  ['provenance', (r) => r.envelope.provenance],
  ['embeddingRef', (r) => r.envelope.embeddingRef]
]);

/** The record-level mutable fields that may never be deleted by a merge patch. */
const CAP_CULL_REQUIRED_FIELDS: ReadonlySet<string> = new Set<string>([
  'body',
  'tags',
  'links',
  'provenance'
]);

/**
 * Bounded-ring write policy for the experience (memory) kind families.
 * Admission accepts until `maxRecords` is reached, then evicts the oldest
 * record(s) by `created` ascending (design-lock §5.3); updates apply the same
 * RFC-7386 merge patch as {@link KnowledgeLwwPolicy}, restricted to the declared
 * {@link IMemoryCapCullPolicyParams.mutableFields | mutableFields}.
 *
 * @remarks
 * - **Dedup scope.** Declares `dedupScope: 'entity'` — two distinct memory
 *   entities (e.g. `turn-5` / `turn-9`) with identical `{ kind, body, links }`
 *   never collapse; only an identical re-put of the SAME entity is a no-op.
 * - **Eviction boundary.** `admit` only DECIDES (returns the `MemoryId`s to
 *   evict); the store executes the file deletions and index patches. The
 *   `existing` cohort the cap counts against is whatever the store supplies to
 *   `admit`.
 * @public
 */
export class MemoryCapCullPolicy implements IWritePolicy {
  /** {@inheritDoc IWritePolicy.mutableFields} */
  public readonly mutableFields: ReadonlyArray<string>;

  /** Experience kinds dedup per-entity (see the class remarks). */
  public readonly dedupScope: DedupScope = 'entity';

  /** The admission cap; `undefined` = no cap. */
  private readonly _maxRecords: number | undefined;
  /** Deep-clones the mutable view without RFC-7386 null-deletion semantics. */
  private readonly _cloneEditor: JsonEditor;
  /** Applies the RFC-7386 merge patch. */
  private readonly _mergeEditor: JsonEditor;

  private constructor(params: IMemoryCapCullPolicyParams, cloneEditor: JsonEditor, mergeEditor: JsonEditor) {
    this.mutableFields = params.mutableFields;
    this._maxRecords = params.maxRecords;
    this._cloneEditor = cloneEditor;
    this._mergeEditor = mergeEditor;
  }

  /**
   * Family-convention factory. Constructs the shared `JsonEditor` instances
   * (one for cloning, one for the RFC-7386 merge) with the same merge config as
   * {@link KnowledgeLwwPolicy} (`nullAsDelete` true, `arrayMergeBehavior`
   * `'replace'`, rules disabled).
   */
  public static create(params: IMemoryCapCullPolicyParams): Result<MemoryCapCullPolicy> {
    return JsonEditor.create({}, []).onSuccess((cloneEditor) =>
      JsonEditor.create(MERGE_PATCH_OPTIONS, []).onSuccess((mergeEditor) =>
        succeed(new MemoryCapCullPolicy(params, cloneEditor, mergeEditor))
      )
    );
  }

  /** {@inheritDoc IWritePolicy.admit} */
  public admit(
    __incoming: IMemoryRecord<unknown>,
    existing: ReadonlyArray<IMemoryRecord<unknown>>
  ): Result<AdmissionDecision> {
    if (this._maxRecords === undefined || existing.length < this._maxRecords) {
      return succeed({ decision: 'accept' });
    }
    // Cap reached: evict the oldest by `created` ascending so the post-write
    // count is exactly `maxRecords` (existing.length - maxRecords + 1 victims).
    const evict: ReadonlyArray<MemoryId> = [...existing]
      .sort((a, b) => a.envelope.created - b.envelope.created)
      .slice(0, existing.length - this._maxRecords + 1)
      .map((record) => record.envelope.id);
    return succeed({ decision: 'cull-oldest', evict });
  }

  /** {@inheritDoc IWritePolicy.applyUpdate} */
  public applyUpdate(
    existing: IMemoryRecord<unknown>,
    patch: Record<string, unknown>
  ): Result<IMemoryRecord<unknown>> {
    // Project the declared mutable fields (restricted to the known record-level
    // vocabulary) into a single record-level view from their canonical
    // locations. An `undefined` value is omitted (the editor rejects undefined
    // property values).
    const view: Record<string, unknown> = {};
    for (const field of this.mutableFields) {
      const reader: ((record: IMemoryRecord<unknown>) => unknown) | undefined =
        CAP_CULL_FIELD_READERS.get(field);
      if (reader !== undefined) {
        const value: unknown = reader(existing);
        if (value !== undefined) {
          view[field] = value;
        }
      }
    }

    // Restrict the incoming patch to the declared mutable fields.
    const scopedPatch: Record<string, unknown> = {};
    for (const field of this.mutableFields) {
      if (field in patch) {
        scopedPatch[field] = patch[field];
      }
    }

    // Clone the view (no null-deletion), then apply the RFC-7386 merge patch
    // onto the clone so the persisted record is never mutated in place.
    return this._cloneEditor
      .mergeObjectInPlace({}, view as JsonObject)
      .onSuccess((clone) => this._mergeEditor.mergeObjectInPlace(clone, scopedPatch as JsonObject))
      .onSuccess((merged) => this._rebuild(existing, merged));
  }

  /**
   * Reassemble a record from the merged mutable view. Only the declared mutable
   * fields are taken from the merge; undeclared fields are preserved verbatim
   * from `existing`. A `null` patch that deletes a *declared mutable* required
   * field (`body` / `tags` / `links` / `provenance`) is an error — a required
   * field that is NOT declared mutable simply falls through to its `existing.*`
   * value and is never at risk. `embeddingRef`, when mutable, is restored as
   * `undefined` (absent) if the merge dropped it — same hash-stable semantics as
   * {@link KnowledgeLwwPolicy}.
   */
  private _rebuild(existing: IMemoryRecord<unknown>, merged: JsonObject): Result<IMemoryRecord<unknown>> {
    const deleted: ReadonlyArray<string> = this.mutableFields.filter(
      (field) => CAP_CULL_REQUIRED_FIELDS.has(field) && !(field in merged)
    );
    if (deleted.length > 0) {
      return fail(`memory cap-cull: merge patch may not delete required field(s): ${deleted.join(', ')}`);
    }

    // The merged values are JSON projections of the already-validated typed
    // record; restore the domain types. (The types packlet cannot import the
    // converters packlet without a cycle, so these are structural restorations
    // of fields the merge preserved, not fresh untrusted input — mirrors
    // KnowledgeLwwPolicy._rebuild.)
    const embeddingRefMutable: boolean = this.mutableFields.includes('embeddingRef');
    const envelope: IMemoryEnvelope = {
      ...existing.envelope,
      tags: 'tags' in merged ? (merged.tags as unknown as ReadonlyArray<Tag>) : existing.envelope.tags,
      links: 'links' in merged ? (merged.links as unknown as ReadonlyArray<IEdge>) : existing.envelope.links,
      provenance:
        'provenance' in merged ? (merged.provenance as unknown as IProvenance) : existing.envelope.provenance,
      embeddingRef: embeddingRefMutable
        ? 'embeddingRef' in merged
          ? (merged.embeddingRef as string | null)
          : undefined
        : existing.envelope.embeddingRef
    };
    return succeed({ envelope, body: 'body' in merged ? merged.body : existing.body });
  }
}
