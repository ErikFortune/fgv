/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { IEmbeddedFragment, IFragmentLocator } from './vectorIndex';

/**
 * Converter for an {@link IFragmentLocator}. Validates the two offsets only — the
 * span's *meaning* (character / byte / token unit) is the consumer's, and the index
 * never interprets it. Note the span is advisory: see {@link IFragmentLocator}.
 * @public
 */
export const fragmentLocatorConverter: Converter<IFragmentLocator> = Converters.object<IFragmentLocator>({
  start: Converters.number,
  end: Converters.number
});

/** Validates an already-constructed `Float32Array` embedding vector in place. */
const embeddingVectorConverter: Converter<Float32Array> = Converters.generic<Float32Array>(
  (from: unknown): Result<Float32Array> =>
    from instanceof Float32Array ? succeed(from) : fail('embedded fragment: vector must be a Float32Array')
);

/** The field-shape half of {@link embeddedFragmentConverter}; the invariant is layered on top. */
const embeddedFragmentFieldsConverter: Converter<IEmbeddedFragment> = Converters.object<IEmbeddedFragment>(
  {
    locator: fragmentLocatorConverter.optional(),
    fragmentId: Converters.string.optional(),
    vector: embeddingVectorConverter
  },
  { optionalFields: ['locator', 'fragmentId'] }
);

/**
 * Converter for an {@link IEmbeddedFragment}, and the boundary that enforces the
 * fragment-identifiability invariant: **at least one of `locator` / `fragmentId`
 * must be present.**
 *
 * @remarks
 * The invariant lives here rather than in the type. A conditional-required union
 * (`{ locator; fragmentId? } | { locator?; fragmentId }`) was considered and
 * declined: it costs at every construction site and buys nothing at the read site,
 * where each field reads as `… | undefined` either way. What it must not cost is
 * identifiability — a fragment carrying neither identity cannot be resolved back to
 * anything by a consumer holding the query hit, so it is rejected here.
 * @public
 */
export const embeddedFragmentConverter: Converter<IEmbeddedFragment> =
  embeddedFragmentFieldsConverter.withConstraint((fragment: IEmbeddedFragment) =>
    fragment.locator === undefined && fragment.fragmentId === undefined
      ? fail('embedded fragment: at least one of `locator` or `fragmentId` is required')
      : succeed(fragment)
  );
