/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Brand, Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { assertPortableFilenameStem } from './filenameSafety';

/**
 * Stable file-stem identifier for a memory record. Equals the codec-produced
 * `idStem` and the on-disk filename stem (`verifyFilenameId` enforces the
 * round-trip).
 * @public
 */
export type MemoryId = Brand<string, 'MemoryId'>;

/**
 * Consumer-supplied domain key. The stable entity identity across versions;
 * the package never mints identity. Equals {@link MemoryId} for non-temporal
 * kinds.
 * @public
 */
export type EntityId = Brand<string, 'EntityId'>;

/**
 * Open-vocabulary record classifier. Consumers register one body
 * {@link https://www.npmjs.com/package/@fgv/ts-utils | Converter} per kind.
 * @public
 */
export type Kind = Brand<string, 'Kind'>;

/**
 * Open-vocabulary tag label.
 * @public
 */
export type Tag = Brand<string, 'Tag'>;

/**
 * Scope path segment. May be multi-segment (`/`-separated) for kinds whose
 * codec maps an entity into a sub-tree (e.g. MTM: `conversations/<id>`). The
 * codec — not this brand — owns filename-safe escaping, so the converter
 * validates only the non-empty/length/whitespace hygiene shared by every
 * brand.
 * @public
 */
export type MemoryScopeKey = Brand<string, 'MemoryScopeKey'>;

/**
 * Open-vocabulary link-relation type for an attributed {@link IEdge}.
 * @public
 */
export type LinkType = Brand<string, 'LinkType'>;

/**
 * Maximum length of any branded identifier in the library. Picked to be
 * larger than any reasonable id a consumer would supply while still bounded
 * to defuse adversarial inputs (e.g. multi-megabyte ids used as map keys).
 */
const MAX_BRAND_LENGTH: number = 256;

/**
 * Builds a `Converter` for one of the branded id scalars in this library.
 * All brands share the same hygiene: non-empty, length-capped, and free of
 * leading/trailing whitespace. Filename-safety and single-segment
 * constraints are intentionally NOT enforced here — the per-kind
 * {@link IIdentityCodec} owns escaping so that multi-segment scope keys
 * (`conversations/<id>`) and composite entity ids (`<id>:<turn>`) validate
 * cleanly.
 *
 * Not exported — the per-brand `Convert.<brand>` constants are the public
 * surface.
 */
function brandedIdConverter<T extends string>(brand: string): Converter<T> {
  return Converters.string.map((from: string): Result<T> => {
    if (from.length === 0) {
      return fail(`${brand}: must be a non-empty string`);
    }
    if (from.length > MAX_BRAND_LENGTH) {
      return fail(`${brand}: exceeds maximum length ${MAX_BRAND_LENGTH} (got ${from.length})`);
    }
    if (from !== from.trim()) {
      return fail(`${brand}: must not have leading or trailing whitespace`);
    }
    return succeed(from as unknown as T);
  });
}

/**
 * Converters for the branded identifier scalars. Each validates an `unknown`
 * value into the corresponding brand, enforcing the shared hygiene
 * (non-empty, length-capped, trimmed).
 * @public
 */
export const Convert: {
  readonly memoryId: Converter<MemoryId>;
  readonly entityId: Converter<EntityId>;
  readonly kind: Converter<Kind>;
  readonly tag: Converter<Tag>;
  readonly scopeKey: Converter<MemoryScopeKey>;
  readonly linkType: Converter<LinkType>;
} = {
  /**
   * Validates an `unknown` value as a {@link MemoryId}. Unlike the other
   * brands, `MemoryId` IS the on-disk filename stem (`id === idStem`, enforced
   * by the store's `verifyFilenameId`), so it additionally enforces the
   * portable-filename-stem contract — rejecting path-unsafe ids (`a/b`,
   * `conv-1:7`) at convert time rather than letting them surface as a file-path
   * failure later. (`EntityId` stays relaxed: a domain key may legitimately be
   * a composite like `conv-1:7`; the codec maps it to a safe stem.)
   */
  memoryId: brandedIdConverter<MemoryId>('MemoryId').map((id) =>
    assertPortableFilenameStem(id).onSuccess(() => succeed(id))
  ),
  /** Validates an `unknown` value as an {@link EntityId}. */
  entityId: brandedIdConverter<EntityId>('EntityId'),
  /** Validates an `unknown` value as a {@link Kind}. */
  kind: brandedIdConverter<Kind>('Kind'),
  /** Validates an `unknown` value as a {@link Tag}. */
  tag: brandedIdConverter<Tag>('Tag'),
  /** Validates an `unknown` value as a {@link MemoryScopeKey}. */
  scopeKey: brandedIdConverter<MemoryScopeKey>('MemoryScopeKey'),
  /** Validates an `unknown` value as a {@link LinkType}. */
  linkType: brandedIdConverter<LinkType>('LinkType')
} as const;
