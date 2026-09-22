/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Result } from '@fgv/ts-utils';
import { OperationId, TaskId, TaskRevision } from './ids';

/**
 * A request to run one registered command against one task.
 *
 * @remarks
 * `operationId` is the deduplication key and `expectedRevision` the concurrency
 * precondition; neither is a timestamp and neither is optional.
 * @public
 */
export interface ICommandRequest {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly expectedRevision: TaskRevision;
  readonly command: string;
  readonly parameters: JsonValue;
}

/**
 * Why a well-formed command was refused at policy or transition evaluation.
 * @public
 */
export type CommandRejectionReason =
  | 'denied'
  | 'unsupported'
  | 'conflict'
  | 'invalid-transition'
  | 'stop-active'
  | 'idempotency-conflict';

/**
 * The state of a dispatched command.
 *
 * @remarks
 * The four states are deliberately not collapsible. `accepted` means intent is durably
 * recorded — it does *not* mean applied. `applied` requires an authoritative native
 * commit or a source-confirmed effect reconciled into a committed projection. An
 * ambiguous external send is `indeterminate` and keeps its operation ID, rather than
 * becoming a generic retryable failure.
 * @public
 */
export type CommandState =
  | { readonly state: 'rejected'; readonly reason: CommandRejectionReason }
  | { readonly state: 'accepted'; readonly sourceReceipt?: string }
  | { readonly state: 'applied'; readonly appliedRevision: TaskRevision }
  | { readonly state: 'indeterminate'; readonly reason: string };

/**
 * The receipt returned for a command request, and retained as its dedup evidence.
 * @public
 */
export interface ICommandReceipt {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly command: string;
  readonly result: CommandState;
}

/**
 * A registered command: one schema that is both the runtime validator and the wire
 * schema a model is offered.
 *
 * @remarks
 * `conditional` states whether the command can carry a source precondition, so a host
 * can refuse weaker dispatch. `idempotency: 'source-key'` states that the source itself
 * deduplicates the same key, which is what makes a safe resend possible after an
 * uncertain dispatch.
 * @public
 */
export interface ITaskCommandDescriptor<P> {
  readonly name: string;
  readonly parameters: JsonSchema.ISchemaValidator<P>;
  readonly encode: (parameters: P) => Result<JsonValue>;
  readonly idempotency: 'source-key' | 'none';
  readonly conditional: boolean;
}
