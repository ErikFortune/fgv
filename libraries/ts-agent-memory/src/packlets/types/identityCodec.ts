/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { Convert, EntityId, MemoryScopeKey } from './ids';

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
 * Reserved Windows device basenames. Includes `COM0..9` and `LPT0..9` — the
 * 0-suffixed variants were added in Windows 11 / Server 2022. Matched
 * case-insensitively against the basename (text before the first `.`).
 */
const RESERVED_WIN_DEVICES: ReadonlySet<string> = new Set<string>([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  ...Array.from({ length: 10 }, (__v, i) => `COM${i}`),
  ...Array.from({ length: 10 }, (__v, i) => `LPT${i}`)
]);

const PORTABLE_FILENAME_RE: RegExp = /^[A-Za-z0-9._-]+$/;

/**
 * Validates a single filename stem against the POSIX portable filename set
 * (`[A-Za-z0-9._-]`), rejecting a leading `.` and reserved Windows device
 * names. Shared by the concrete codecs. Exported so Phase C codecs (LTM /
 * MTM) reuse the exact same escaping contract.
 * @public
 */
export function assertPortableFilenameStem(stem: string): Result<string> {
  if (stem.length === 0) {
    return fail('idStem: must be a non-empty string');
  }
  if (stem.startsWith('.')) {
    return fail(`idStem '${stem}': may not begin with '.'`);
  }
  if (!PORTABLE_FILENAME_RE.test(stem)) {
    return fail(
      `idStem '${stem}': contains characters outside the POSIX portable filename set ([A-Za-z0-9._-])`
    );
  }
  const basename: string = stem.split('.')[0];
  if (RESERVED_WIN_DEVICES.has(basename.toUpperCase())) {
    return fail(`idStem '${stem}': basename '${basename}' matches a reserved Windows device name`);
  }
  return succeed(stem);
}

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
