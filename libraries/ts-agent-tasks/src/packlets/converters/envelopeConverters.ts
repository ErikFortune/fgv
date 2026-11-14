/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters } from '@fgv/ts-utils';
import { ITaskEnvelope, ITaskFieldBounds, ITaskSnapshot } from '../types';
import { IIdentityConverters } from './identityConverters';
import { boundedSingleLine, boundedText, instant, positiveSafeInteger, taskRevision } from './primitives';
import { IValueConverters } from './valueConverters';

/**
 * The bounded common envelope and snapshot converters.
 * @public
 */
export interface IEnvelopeConverters {
  readonly envelope: Converter<ITaskEnvelope>;
  readonly snapshot: Converter<ITaskSnapshot>;
}

/**
 * Builds the {@link IEnvelopeConverters}.
 *
 * @remarks
 * Strict throughout: an unrecognized property anywhere in the envelope is a conversion
 * failure, not a field quietly dropped. That is what makes "runtime validation
 * produces the same public shape the declarations promise" checkable rather than
 * asserted.
 * @public
 */
export function buildEnvelopeConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters,
  values: IValueConverters
): IEnvelopeConverters {
  const envelope: Converter<ITaskEnvelope> = Converters.strictObject<ITaskEnvelope>({
    schemaVersion: Converters.literal<1>(1),
    id: ids.taskId,
    kind: ids.taskKind,
    detailVersion: positiveSafeInteger,
    revision: taskRevision,
    title: boundedSingleLine(bounds.maxTitleLength, 'title'),
    description: boundedText(bounds.maxDescriptionLength, 'description').optional(),
    parentId: ids.taskId.optional(),
    stopPolicy: values.stopPolicy,
    responsibility: values.responsibility.optional(),
    scopes: values.scopes,
    lifecycle: values.lifecycle,
    progress: values.progress.optional(),
    attention: values.references,
    binding: values.sourceBinding.optional(),
    recovery: values.recoveryDeclaration,
    observation: values.observationHealth,
    createdAt: instant,
    changedAt: instant
  });

  const snapshot: Converter<ITaskSnapshot> = Converters.strictObject<ITaskSnapshot<JsonValue>>({
    envelope,
    details: JsonConverters.jsonValue
  });

  return { envelope, snapshot };
}
