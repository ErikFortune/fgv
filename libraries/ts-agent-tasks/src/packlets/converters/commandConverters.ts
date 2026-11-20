/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { Converter, Converters } from '@fgv/ts-utils';
import {
  CommandAbandonmentOrigin,
  CommandRejectionReason,
  allCommandAbandonmentOrigins,
  CommandState,
  ICommandReceipt,
  ICommandRequest,
  ITaskFieldBounds
} from '../types';
import { IIdentityConverters } from './identityConverters';
import { boundedIdentifier, boundedSingleLine, boundedText, taskRevision } from './primitives';

/**
 * The command request, state and receipt converters.
 * @public
 */
export interface ICommandConverters {
  readonly commandName: Converter<string>;
  readonly request: Converter<ICommandRequest>;
  readonly state: Converter<CommandState>;
  readonly receipt: Converter<ICommandReceipt>;
}

/**
 * Builds the {@link ICommandConverters}.
 *
 * @remarks
 * Command names use the same bounded safe syntax as identifiers: a command name
 * reaches a model's tool surface and a stored dedup key, so free text is not an option.
 * @public
 */
export function buildCommandConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters
): ICommandConverters {
  const commandName: Converter<string> = boundedIdentifier(bounds.maxCodeLength, 'command name');
  const reason: Converter<string> = boundedText(bounds.maxSummaryLength, 'reason');

  const request: Converter<ICommandRequest> = Converters.strictObject<ICommandRequest>({
    taskId: ids.taskId,
    operationId: ids.operationId,
    expectedRevision: taskRevision,
    command: commandName,
    parameters: JsonConverters.jsonValue
  });

  const state: Converter<CommandState> = Converters.discriminatedObject<CommandState>('state', {
    rejected: Converters.strictObject<Extract<CommandState, { state: 'rejected' }>>({
      state: Converters.literal('rejected'),
      reason: Converters.enumeratedValue<CommandRejectionReason>([
        'denied',
        'unsupported',
        'conflict',
        'invalid-transition',
        'stop-active',
        'idempotency-conflict'
      ])
    }),
    accepted: Converters.strictObject<Extract<CommandState, { state: 'accepted' }>>({
      state: Converters.literal('accepted'),
      sourceReceipt: boundedSingleLine(bounds.maxIdLength, 'source receipt').optional()
    }),
    applied: Converters.strictObject<Extract<CommandState, { state: 'applied' }>>({
      state: Converters.literal('applied'),
      appliedRevision: taskRevision
    }),
    indeterminate: Converters.strictObject<Extract<CommandState, { state: 'indeterminate' }>>({
      state: Converters.literal('indeterminate'),
      reason
    }),
    abandoned: Converters.strictObject<Extract<CommandState, { state: 'abandoned' }>>({
      state: Converters.literal('abandoned'),
      reason,
      from: Converters.enumeratedValue<CommandAbandonmentOrigin>(allCommandAbandonmentOrigins)
    })
  });

  const receipt: Converter<ICommandReceipt> = Converters.strictObject<ICommandReceipt>({
    taskId: ids.taskId,
    operationId: ids.operationId,
    command: commandName,
    result: state
  });

  return { commandName, request, state, receipt };
}
