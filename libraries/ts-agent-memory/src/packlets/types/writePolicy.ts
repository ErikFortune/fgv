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
   * Determine whether the incoming record is admitted.
   * @param incoming - The record about to be written.
   * @param existing - Current records for this `entityId` in the scope
   * (empty array on first write).
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
   * `links` / `provenance` are required and may not be deleted by a patch;
   * `embeddingRef` is optional and a delete clears it to `null`.
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
      embeddingRef: 'embeddingRef' in merged ? (merged.embeddingRef as string | null) : null
    };
    return succeed({ envelope, body: merged.body });
  }
}
