/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters } from '@fgv/ts-utils';
import {
  ISourceObservation,
  ISourceReconcilePage,
  ITaskFieldBounds,
  SourceCommandLookup,
  SourceCommandRejection,
  SourceCommandResult,
  SourceRead,
  SourceReconcileCoverage
} from '../types';
import { IValueConverters } from './valueConverters';
import { boundedSingleLine, boundedText, maxSourceCursorLength } from './primitives';

/**
 * Converters for what an external source returns.
 *
 * @remarks
 * A source is host code. Everything it answers is converted before the broker decides anything
 * from it: an oversized or malformed answer is a source-contract issue with a bounded diagnostic,
 * never silently truncated into a successful receipt (design § 8.6).
 * @public
 */
export interface ISourceConverters {
  readonly read: Converter<SourceRead>;
  readonly observation: Converter<ISourceObservation>;
  readonly page: Converter<ISourceReconcilePage>;
  readonly commandResult: Converter<SourceCommandResult>;
  readonly commandLookup: Converter<SourceCommandLookup>;
}

/**
 * Builds the {@link ISourceConverters}.
 * @public
 */
export function buildSourceConverters(bounds: ITaskFieldBounds, values: IValueConverters): ISourceConverters {
  const reason: Converter<string> = boundedText(bounds.maxSummaryLength, 'reason');
  // A cursor or checkpoint is opaque source text; the stored profile's byte bound is checked when
  // it is committed. This is its representable ceiling, which no profile may exceed.
  const cursor: Converter<string> = boundedSingleLine(maxSourceCursorLength, 'source cursor');

  const read: Converter<SourceRead> = Converters.discriminatedObject<SourceRead>('state', {
    observed: Converters.strictObject<Extract<SourceRead, { state: 'observed' }>>({
      state: Converters.literal('observed'),
      value: values.sourceProjection
    }),
    unavailable: Converters.strictObject<Extract<SourceRead, { state: 'unavailable' | 'missing' }>>({
      state: Converters.literal('unavailable'),
      reason
    }),
    missing: Converters.strictObject<Extract<SourceRead, { state: 'unavailable' | 'missing' }>>({
      state: Converters.literal('missing'),
      reason
    })
  });

  const observation: Converter<ISourceObservation> = Converters.strictObject<ISourceObservation>({
    binding: values.sourceBinding,
    observation: read
  });

  const page: Converter<ISourceReconcilePage> = Converters.strictObject<ISourceReconcilePage>({
    observations: Converters.arrayOf(observation),
    nextCursor: cursor.optional(),
    checkpoint: cursor.optional(),
    completeness: Converters.enumeratedValue<ISourceReconcilePage['completeness']>([
      'complete',
      'partial',
      'gap'
    ]),
    coverage: Converters.enumeratedValue<SourceReconcileCoverage>(['all-bindings', 'active-only']),
    issues: Converters.arrayOf(reason)
  });

  const rejected = Converters.strictObject<Extract<SourceCommandResult, { state: 'rejected' }>>({
    state: Converters.literal('rejected'),
    reason: Converters.enumeratedValue<SourceCommandRejection>([
      'unsupported',
      'conflict',
      'invalid-transition'
    ])
  });
  const accepted = Converters.strictObject<Extract<SourceCommandResult, { state: 'accepted' }>>({
    state: Converters.literal('accepted'),
    sourceReceipt: boundedSingleLine(bounds.maxIdLength, 'source receipt')
  });
  const applied = Converters.strictObject<Extract<SourceCommandResult, { state: 'applied' }>>({
    state: Converters.literal('applied'),
    observation: values.sourceProjection
  });
  const indeterminate = Converters.strictObject<Extract<SourceCommandResult, { state: 'indeterminate' }>>({
    state: Converters.literal('indeterminate'),
    reason
  });
  const keyExpired = Converters.strictObject<Extract<SourceCommandResult, { state: 'key-expired' }>>({
    state: Converters.literal('key-expired'),
    reason
  });

  const commandResult: Converter<SourceCommandResult> = Converters.discriminatedObject<SourceCommandResult>(
    'state',
    { rejected, accepted, applied, indeterminate, 'key-expired': keyExpired }
  );
  const commandLookup: Converter<SourceCommandLookup> = Converters.discriminatedObject<SourceCommandLookup>(
    'state',
    {
      rejected,
      accepted,
      applied,
      indeterminate,
      'key-expired': keyExpired,
      'not-found': Converters.strictObject<{ state: 'not-found' }>({ state: Converters.literal('not-found') })
    }
  );

  return { read, observation, page, commandResult, commandLookup };
}
