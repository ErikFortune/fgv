/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { Convert, EntityId, MemoryScopeKey } from './ids';
import { assertPortableFilenameStem } from './filenameSafety';

/**
 * The FileTree storage address an {@link IIdentityCodec} maps a domain key to.
 * @public
 */
export interface IIdentityCodecResult {
  /** Scope path segment (may be multi-level, e.g. `conversations/<id>`). */
  readonly scope: MemoryScopeKey;
  /** Filename stem (the part before `.md`). Filename-safe after encoding. */
  readonly idStem: string;
  /**
   * Whether this kind uses a versioned layout (temporal: multiple files per
   * entity) vs. a flat layout (one file per entity). Non-temporal = always
   * `false`.
   */
  readonly isVersioned: boolean;
}

/**
 * Maps a consumer-supplied domain key ⇄ a FileTree storage address. Injected
 * per kind so the store never touches raw domain keys: the codec owns all
 * filename escaping and the flat-vs-versioned layout dispatch.
 * @public
 */
export interface IIdentityCodec {
  /**
   * Encode a consumer-supplied entity id to a FileTree address. Deterministic
   * and pure — no I/O.
   */
  encode(entityId: EntityId): Result<IIdentityCodecResult>;

  /**
   * Decode a FileTree address back to the original {@link EntityId}. The exact
   * inverse of {@link IIdentityCodec.encode | encode} for non-versioned kinds.
   */
  decode(scope: MemoryScopeKey, encodedStem: string): Result<EntityId>;

  /**
   * Assert that `encode(decode(scope, stem)).idStem === stem`. Used by the
   * store's `verifyFilenameId` check on load.
   */
  verifyRoundTrip(scope: MemoryScopeKey, stem: string): Result<true>;
}

/**
/**
 * Identity codec for the knowledge kind family. A knowledge entity is keyed
 * by its consumer-supplied `docId`, which is used verbatim as the filename
 * stem under the flat `knowledge` scope.
 *
 * @remarks
 * - `encode`: scope = `knowledge`, idStem = `docId`, `isVersioned = false`.
 * - `decode`: brands the stem back to an {@link EntityId}.
 * - Escaping: the `docId` must match the POSIX portable filename set.
 * - Layout: `vault/knowledge/<docId>.md`.
 * @public
 */
export class KnowledgeIdentityCodec implements IIdentityCodec {
  /** The fixed scope for every knowledge entity. */
  public static readonly scope: MemoryScopeKey = 'knowledge' as MemoryScopeKey;

  /** {@inheritDoc IIdentityCodec.encode} */
  public encode(entityId: EntityId): Result<IIdentityCodecResult> {
    return assertPortableFilenameStem(entityId).onSuccess((idStem) =>
      succeed({ scope: KnowledgeIdentityCodec.scope, idStem, isVersioned: false })
    );
  }

  /** {@inheritDoc IIdentityCodec.decode} */
  public decode(scope: MemoryScopeKey, encodedStem: string): Result<EntityId> {
    if (scope !== KnowledgeIdentityCodec.scope) {
      return fail(
        `knowledge codec: scope '${scope}' does not match expected scope '${KnowledgeIdentityCodec.scope}'`
      );
    }
    return assertPortableFilenameStem(encodedStem).onSuccess((stem) => Convert.entityId.convert(stem));
  }

  /** {@inheritDoc IIdentityCodec.verifyRoundTrip} */
  public verifyRoundTrip(scope: MemoryScopeKey, stem: string): Result<true> {
    return this.decode(scope, stem)
      .onSuccess((entityId) => this.encode(entityId))
      .onSuccess((encoded) => {
        /* c8 ignore start -- defensive: for the identity (knowledge) codec, encode(decode(stem)).idStem always equals stem when both succeed; the guard exists for the non-identity codecs (LTM/MTM, Phase C) that reuse this contract */
        if (encoded.idStem !== stem) {
          return fail(
            `knowledge codec: round-trip mismatch for stem '${stem}' (re-encoded to '${encoded.idStem}')`
          );
        }
        /* c8 ignore stop */
        return succeed(true);
      });
  }
}
