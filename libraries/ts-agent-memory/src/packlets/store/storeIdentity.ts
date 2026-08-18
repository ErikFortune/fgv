/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  EntityId,
  IIdentityCodec,
  IIdentityCodecResult,
  IMemoryRecord,
  Kind,
  MemoryScopeKey
} from '../types';

/**
 * The identity codec registered for `kind`, or the default.
 *
 * @remarks
 * Package-internal. Extracted from `FileTreeMemoryStore` rather than living on it
 * because the file is at its `max-lines` cap — the fourth consecutive stream to pay
 * that toll, which `TECH_DEBT.md` names as the trigger to promote the split to P1.
 * @internal
 */
export function codecFor(
  codecs: ReadonlyMap<Kind, IIdentityCodec>,
  defaultCodec: IIdentityCodec | undefined,
  kind: Kind
): Result<IIdentityCodec> {
  const codec: IIdentityCodec | undefined = codecs.get(kind) ?? defaultCodec;
  if (codec === undefined) {
    return fail(`no identity codec registered for kind '${kind}'`);
  }
  return succeed(codec);
}

/**
 * Resolve `(kind, entityId)` to the storage address the vault files it under,
 * without reading the record.
 *
 * @remarks
 * `kind` selects the codec and the codec computes the address, so this is a
 * function rather than a search — which is what makes an `EntityId` that collides
 * across kinds a non-issue instead of an ambiguity to disambiguate.
 * @internal
 */
export function resolveIdentity(
  codecs: ReadonlyMap<Kind, IIdentityCodec>,
  defaultCodec: IIdentityCodec | undefined,
  kind: Kind,
  entityId: EntityId
): Result<IIdentityCodecResult> {
  return codecFor(codecs, defaultCodec, kind).onSuccess((codec) => codec.encode(entityId));
}

/**
 * Cross-check a loaded record's declared identity against the address it was read
 * from.
 *
 * @remarks
 * The filename stem and the scope are the storage-side identity; the envelope's
 * `id` / `entityId` are what downstream code trusts verbatim (merge-into
 * re-addressing, for one). A tampered or corrupt file declaring a foreign
 * `entityId` would otherwise load undetected, so the two are reconciled here
 * through the codec's own round-trip.
 * @internal
 */
export function verifyLoadedIdentity(
  codec: Result<IIdentityCodec>,
  scope: MemoryScopeKey,
  file: FileTree.IFileTreeFileItem,
  record: IMemoryRecord<unknown>
): Result<IMemoryRecord<unknown>> {
  if (record.envelope.id !== file.baseName) {
    return fail(
      `memory file '${file.absolutePath}': envelope id '${record.envelope.id}' does not match filename stem '${file.baseName}'`
    );
  }
  return codec
    .onSuccess((c) => c.verifyRoundTrip(scope, file.baseName).onSuccess(() => c.decode(scope, file.baseName)))
    .withErrorFormat((msg) => `memory file '${file.absolutePath}': ${msg}`)
    .onSuccess((decodedEntityId) => {
      if (decodedEntityId !== record.envelope.entityId) {
        return fail(
          `memory file '${file.absolutePath}': envelope entityId '${record.envelope.entityId}' does not match scope-derived entityId '${decodedEntityId}'`
        );
      }
      return succeed(record);
    });
}
