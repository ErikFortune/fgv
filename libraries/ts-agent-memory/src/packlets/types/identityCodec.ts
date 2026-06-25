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

/**
 * Identity codec for the long-term-memory (LTM) kind family. An LTM entity is
 * keyed by its `conversationId`, used verbatim as the filename stem under the
 * flat `conversations` scope.
 *
 * @remarks
 * - `encode`: scope = `conversations`, idStem = `conversationId`, `isVersioned = false`.
 * - `decode`: brands the stem back to an {@link EntityId}.
 * - Escaping: the `conversationId` must match the POSIX portable filename set.
 * - Layout: `vault/conversations/<conversationId>.md`.
 *
 * An LTM file (`conversations/<id>.md`) and the MTM subtree
 * (`conversations/<id>/turn-N.md`) coexist — a file and a same-named directory
 * are independent on every supported FileTree backend.
 * @public
 */
export class LtmIdentityCodec implements IIdentityCodec {
  /** The fixed scope for every LTM entity. */
  public static readonly scope: MemoryScopeKey = 'conversations' as MemoryScopeKey;

  /** {@inheritDoc IIdentityCodec.encode} */
  public encode(entityId: EntityId): Result<IIdentityCodecResult> {
    return assertPortableFilenameStem(entityId).onSuccess((idStem) =>
      succeed({ scope: LtmIdentityCodec.scope, idStem, isVersioned: false })
    );
  }

  /** {@inheritDoc IIdentityCodec.decode} */
  public decode(scope: MemoryScopeKey, encodedStem: string): Result<EntityId> {
    if (scope !== LtmIdentityCodec.scope) {
      return fail(`LTM codec: scope '${scope}' does not match expected scope '${LtmIdentityCodec.scope}'`);
    }
    return assertPortableFilenameStem(encodedStem).onSuccess((stem) => Convert.entityId.convert(stem));
  }

  /** {@inheritDoc IIdentityCodec.verifyRoundTrip} */
  public verifyRoundTrip(scope: MemoryScopeKey, stem: string): Result<true> {
    return this.decode(scope, stem)
      .onSuccess((entityId) => this.encode(entityId))
      .onSuccess((encoded) => {
        /* c8 ignore start -- defensive: LTM encode(decode(stem)).idStem always equals stem when both succeed (identity mapping); guard preserves the contract for direct callers */
        if (encoded.idStem !== stem) {
          return fail(
            `LTM codec: round-trip mismatch for stem '${stem}' (re-encoded to '${encoded.idStem}')`
          );
        }
        /* c8 ignore stop */
        return succeed(true);
      });
  }
}

/**
 * Identity codec for the medium-term-memory (MTM) kind family. An MTM entity is
 * keyed by the colon-composite `<conversationId>:<turnIndex>` and maps into a
 * per-conversation subtree.
 *
 * @remarks
 * - `encode`: splits the entity id on `:`; scope =
 *   `conversations/<conversationId>` (multi-segment), idStem = `turn-<turnIndex>`,
 *   `isVersioned = false`.
 * - `decode`: reverses scope `conversations/<id>` + stem `turn-<N>` to the
 *   composite `<id>:<N>`.
 * - Escaping: `conversationId` must match the POSIX portable filename set (so it
 *   contains no `/` or `:`); `turnIndex` must be a non-negative integer string,
 *   preserved verbatim so the round-trip is exact.
 * - Layout: `vault/conversations/<conversationId>/turn-<N>.md`. The `/` in the
 *   scope is handled by the store's multi-segment scope resolver.
 * @public
 */
export class MtmIdentityCodec implements IIdentityCodec {
  /** The top-level scope segment under which every MTM subtree lives. */
  public static readonly rootScopeSegment: string = 'conversations';
  /** The fixed filename-stem prefix for a turn record. */
  public static readonly turnStemPrefix: string = 'turn-';

  /** A non-negative integer string (the turn index), preserved verbatim. */
  private static readonly _turnIndexRe: RegExp = /^\d+$/;

  /** {@inheritDoc IIdentityCodec.encode} */
  public encode(entityId: EntityId): Result<IIdentityCodecResult> {
    const parts: string[] = entityId.split(':');
    if (parts.length !== 2) {
      return fail(`MTM codec: entity id '${entityId}' must be a '<conversationId>:<turnIndex>' composite`);
    }
    const [conversationId, turnIndex] = parts;
    return assertPortableFilenameStem(conversationId)
      .withErrorFormat((msg) => `MTM codec: conversationId '${conversationId}': ${msg}`)
      .onSuccess(() => MtmIdentityCodec._assertTurnIndex(turnIndex))
      .onSuccess(() =>
        succeed({
          scope: `${MtmIdentityCodec.rootScopeSegment}/${conversationId}` as MemoryScopeKey,
          idStem: `${MtmIdentityCodec.turnStemPrefix}${turnIndex}`,
          isVersioned: false
        })
      );
  }

  /** {@inheritDoc IIdentityCodec.decode} */
  public decode(scope: MemoryScopeKey, encodedStem: string): Result<EntityId> {
    return MtmIdentityCodec._conversationIdFromScope(scope).onSuccess((conversationId) =>
      MtmIdentityCodec._turnIndexFromStem(encodedStem).onSuccess((turnIndex) =>
        Convert.entityId.convert(`${conversationId}:${turnIndex}`)
      )
    );
  }

  /** {@inheritDoc IIdentityCodec.verifyRoundTrip} */
  public verifyRoundTrip(scope: MemoryScopeKey, stem: string): Result<true> {
    return this.decode(scope, stem)
      .onSuccess((entityId) => this.encode(entityId))
      .onSuccess((encoded) => {
        /* c8 ignore start -- defensive: MTM encode(decode(scope, stem)) reproduces the same scope+stem whenever both succeed (no normalization); guard preserves the contract for direct callers */
        if (encoded.idStem !== stem || encoded.scope !== scope) {
          return fail(
            `MTM codec: round-trip mismatch for scope '${scope}' stem '${stem}' (re-encoded to scope '${encoded.scope}' stem '${encoded.idStem}')`
          );
        }
        /* c8 ignore stop */
        return succeed(true);
      });
  }

  /** Validate and extract the `conversationId` from a `conversations/<id>` scope. */
  private static _conversationIdFromScope(scope: MemoryScopeKey): Result<string> {
    const segments: string[] = scope.split('/');
    if (segments.length !== 2 || segments[0] !== MtmIdentityCodec.rootScopeSegment) {
      return fail(
        `MTM codec: scope '${scope}' must be '${MtmIdentityCodec.rootScopeSegment}/<conversationId>'`
      );
    }
    const conversationId: string = segments[1];
    return assertPortableFilenameStem(conversationId)
      .withErrorFormat((msg) => `MTM codec: conversationId '${conversationId}': ${msg}`)
      .onSuccess(() => succeed(conversationId));
  }

  /** Validate and extract the turn-index digits from a `turn-<N>` stem. */
  private static _turnIndexFromStem(stem: string): Result<string> {
    if (!stem.startsWith(MtmIdentityCodec.turnStemPrefix)) {
      return fail(`MTM codec: stem '${stem}' must begin with '${MtmIdentityCodec.turnStemPrefix}'`);
    }
    return MtmIdentityCodec._assertTurnIndex(stem.slice(MtmIdentityCodec.turnStemPrefix.length));
  }

  /** Assert a string is a non-negative integer (the turn index). */
  private static _assertTurnIndex(turnIndex: string): Result<string> {
    if (!MtmIdentityCodec._turnIndexRe.test(turnIndex)) {
      return fail(`MTM codec: turnIndex '${turnIndex}' must be a non-negative integer`);
    }
    return succeed(turnIndex);
  }
}
