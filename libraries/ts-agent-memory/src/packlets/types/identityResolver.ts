/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import { IEdgeTarget, IMemoryRecord } from './envelope';
import { IIdentityCodecResult } from './identityCodec';
import { EntityId, Kind } from './ids';

/**
 * Resolves a consumer-facing `(kind, entityId)` address to the storage address the
 * vault files it under, **without reading the record**.
 *
 * @remarks
 * This is the resolution `IMemoryStore.get(kind, entityId)` already performs before
 * it reads anything: `kind` selects the kind's `IIdentityCodec`, and the codec's
 * `encode` computes `{ scope, idStem, isVersioned }`. Exposing it separately lets a
 * caller that needs only the *address* — a fragment query narrowing to one record,
 * say — avoid paying for a read it does not want.
 *
 * **The resolution is a function, not a search, and that is the load-bearing
 * property.** A consumer holds an `EntityId`; a vector hit is addressed by a
 * `(scope, id)` pair; and `EntityId` promises no uniqueness beyond a scope, so the
 * same id may legitimately appear in several scopes (a document `acme-corp` under
 * one kind and the entity `acme-corp` under another is the ordinary case, not a
 * pathological one). Supplying `kind` selects one codec, and a codec cannot return
 * two answers — so ambiguity is structurally impossible rather than merely unlikely,
 * and no disambiguation pass is needed anywhere downstream.
 *
 * Narrow by design, mirroring `IMemoryRecordResolver`: a component that needs to
 * turn an entity address into a storage address should depend on this rather than on
 * the whole store.
 * @public
 */
export interface IIdentityResolver {
  /**
   * The storage address `(kind, entityId)` maps to, without reading the record.
   *
   * @param kind - Selects the identity codec. Required: it is what makes the
   * resolution unambiguous.
   * @param entityId - The consumer-supplied domain key.
   * @returns `Success` with the codec's `{ scope, idStem, isVersioned }`, or
   * `Failure` if no codec is registered for `kind` (and no default is wired) or the
   * codec rejects the id. Both are caller errors and both are loud.
   */
  resolveIdentity(kind: Kind, entityId: EntityId): Result<IIdentityCodecResult>;
}

/**
 * The scope-qualified `(scope, id)` address of a loaded record: the scope its kind's
 * codec derives from `(kind, entityId)`, paired with the record's own
 * {@link IMemoryEnvelope.id | id}.
 *
 * @remarks
 * A bare `id` is unique only within a scope (the MTM codec mints `turn-<n>` under
 * every conversation), so anything that asks "is this the same record?" of records
 * from more than one scope has to key on this address, through
 * {@link edgeTargetKey}. For a versioned kind the `id` is the version stem, so
 * distinct versions of one entity have distinct addresses.
 *
 * The result is the address the record was **read from** only for a record whose
 * identity the store verified on load — which every record `FileTreeMemoryStore`
 * returns is, under a codec whose round-trip checks scope (all shipped codecs do).
 * A record built by hand, or resolved with a codec map that differs from the
 * store's, gets the address its kind's codec says it should have.
 *
 * It does not capture a resolver that throws: a caller handed a consumer-injected
 * resolver wraps the call in `captureResult`, as `ScoreUnionMergeStrategy` does.
 *
 * @param record - The record to address.
 * @param resolver - Resolves `(kind, entityId)` to the record's storage scope.
 * @returns `Success` with the address, or the resolver's `Failure` (no codec for
 * the kind, or a codec that rejects the entity id) unformatted, for the caller to
 * contextualize.
 * @public
 */
export function scopedAddressOf(
  record: IMemoryRecord<unknown>,
  resolver: IIdentityResolver
): Result<IEdgeTarget> {
  return resolver
    .resolveIdentity(record.envelope.kind, record.envelope.entityId)
    .onSuccess((address) => succeed({ scope: address.scope, id: record.envelope.id }));
}
