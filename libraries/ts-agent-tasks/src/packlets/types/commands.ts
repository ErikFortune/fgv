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
 * The four outcome states are deliberately not collapsible, and `abandoned` is none of them:
 * a host's explicit end of tracking for a command whose outcome is not known. `accepted` means intent is durably
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
  | { readonly state: 'indeterminate'; readonly reason: string }
  | {
      readonly state: 'abandoned';
      readonly reason: string;
      readonly from: CommandAbandonmentOrigin;
    };

/**
 * What was known about a command when a host abandoned it.
 *
 * @remarks
 * - `not-sent` — the intent was recorded and never dispatched.
 * - `possibly-sent` — the marker was written; whether the source applied it is unknown.
 * - `awaiting-feed` — the source answered, and the `source-replay` feed never reached the revision
 *   that would confirm it.
 *
 * `abandoned` is not an outcome. It ends the broker's tracking of the command, and releases its
 * settlement reservation, without claiming that anything was or was not applied.
 * @public
 */
export type CommandAbandonmentOrigin = 'not-sent' | 'possibly-sent' | 'awaiting-feed';

/**
 * Every {@link CommandAbandonmentOrigin}.
 * @public
 */
export const allCommandAbandonmentOrigins: ReadonlyArray<CommandAbandonmentOrigin> = [
  'not-sent',
  'possibly-sent',
  'awaiting-feed'
];

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
 *
 * `encode` produces the canonical parameters that are stored, deduplicated against and
 * dispatched. Because `parameters` is also the wire schema, the encoded form must validate
 * against it again: a descriptor whose encoder changes shape is refused when a command is
 * validated.
 * @public
 */
export interface ITaskCommandDescriptor<P> {
  readonly name: string;
  readonly parameters: JsonSchema.ISchemaValidator<P>;
  readonly encode: (parameters: P) => Result<JsonValue>;
  readonly idempotency: 'source-key' | 'none';
  readonly conditional: boolean;
}
