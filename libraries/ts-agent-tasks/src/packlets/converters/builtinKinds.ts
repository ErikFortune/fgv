/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Result, succeed } from '@fgv/ts-utils';
import {
  ITaskCommandHandle,
  ITaskKindDescriptor,
  ITaskListDetails,
  ITaskOutcome,
  ITaskProgress,
  ITaskReason,
  ITaskReference,
  IWaitingReason,
  TaskListCompletion,
  TrackedTaskCommandName,
  TrackedTaskDetails,
  taskListDetailVersion,
  taskListKind,
  trackedTaskCommandNames,
  trackedTaskDetailVersion,
  trackedTaskKind
} from '../types';
import { createTaskCommandHandle } from './kindRegistry';

/**
 * Converter for `fgv.tracked@1` details — an empty strict object, so any property at
 * all is a conversion failure.
 * @public
 */
export const trackedTaskDetails: Converter<TrackedTaskDetails> = Converters.strictObject<TrackedTaskDetails>(
  {}
);

/**
 * Wire schema for `fgv.tracked@1` details.
 * @public
 */
export const trackedTaskDetailSchema: JsonSchema.ISchemaValidator<TrackedTaskDetails> = JsonSchema.object(
  {},
  { description: 'fgv.tracked@1 details' }
);

/**
 * Converter for `fgv.task-list@1` details.
 * @public
 */
export const taskListDetails: Converter<ITaskListDetails> = Converters.strictObject<ITaskListDetails>({
  completion: Converters.enumeratedValue<TaskListCompletion>(['manual', 'all-children-succeeded'])
});

/**
 * Wire schema for `fgv.task-list@1` details.
 * @public
 */
export const taskListDetailSchema: JsonSchema.ISchemaValidator<ITaskListDetails> = JsonSchema.object(
  {
    completion: JsonSchema.enumOf<TaskListCompletion>(['manual', 'all-children-succeeded'], {
      description: 'how the list reaches succeeded'
    })
  },
  { description: 'fgv.task-list@1 details' }
);

// ------------------------------------------------------------------------------------------
// fgv.tracked@1 command parameter schemas
// ------------------------------------------------------------------------------------------

/**
 * A host-owned reference. Nothing in the broker resolves one: a reference is accepted on its syntax
 * alone, so the description says what the value means rather than inviting the model to invent one.
 */
const referenceSchema: JsonSchema.ISchemaValidator<ITaskReference> = JsonSchema.object(
  {
    namespace: JsonSchema.string({ description: 'The namespace of an identity the host gave you.' }),
    key: JsonSchema.string({ description: 'The key within that namespace, exactly as the host gave it.' })
  },
  { description: 'A reference to something the host named — never one you made up.' }
);

const attentionSchema: JsonSchema.ISchemaValidator<ITaskReference[]> = JsonSchema.array(referenceSchema, {
  description: 'References that need attention. Only references the host gave you; the list may be empty.'
});

const reasonProperties: {
  readonly code: JsonSchema.ISchemaValidator<string>;
  readonly summary: JsonSchema.ISchemaValidator<string>;
  readonly attention: JsonSchema.ISchemaValidator<ITaskReference[] | undefined>;
} = {
  code: JsonSchema.string({ description: 'A short machine-readable code, e.g. "blocked-on-review".' }),
  summary: JsonSchema.string({ description: 'A short human-readable explanation.' }),
  attention: JsonSchema.optional(attentionSchema)
};

const reasonSchema: JsonSchema.ISchemaValidator<ITaskReason> = JsonSchema.object(reasonProperties, {
  description: 'Why the task is in this state.'
});

/** A waiting reason as the wire sees it: `notBefore` is a plain string until the broker converts it. */
type WireWaitingReason = Omit<IWaitingReason, 'notBefore'> & { readonly notBefore?: string };

const waitingReasonSchema: JsonSchema.ISchemaValidator<WireWaitingReason> = JsonSchema.object(
  {
    ...reasonProperties,
    notBefore: JsonSchema.optional(
      JsonSchema.string({
        description:
          'The earliest instant the wait could end, as a UTC timestamp with milliseconds: ' +
          'YYYY-MM-DDTHH:mm:ss.sssZ.'
      })
    )
  },
  { description: 'What the task is waiting for.' }
);

const outcomeSchema: JsonSchema.ISchemaValidator<ITaskOutcome> = JsonSchema.object(
  {
    summary: JsonSchema.string({ description: 'What the task achieved, or how it ended.' }),
    artifacts: JsonSchema.array(referenceSchema, {
      description: 'References to what the task produced. Only references the host gave you; may be empty.'
    })
  },
  { description: 'The outcome of the task — stated to the host as fact, and never changed afterwards.' }
);

const progressSchema: JsonSchema.ISchemaValidator<ITaskProgress> = JsonSchema.object(
  {
    phase: JsonSchema.optional(JsonSchema.string({ description: 'The current phase.' })),
    completed: JsonSchema.optional(JsonSchema.number({ description: 'How much is done; not negative.' })),
    total: JsonSchema.optional(
      JsonSchema.number({ description: 'How much there is in all; not less than completed.' })
    ),
    unit: JsonSchema.optional(JsonSchema.string({ description: 'What completed and total count.' })),
    summary: JsonSchema.optional(JsonSchema.string({ description: 'A short progress note.' }))
  },
  { description: 'The progress to report, replacing any reported before. Omit it to remove the progress.' }
);

/**
 * Each command's registered parameter schema, one per {@link trackedTaskCommandNames} entry — a
 * total record, so a twelfth name cannot be added to the vocabulary without a schema here.
 */
const trackedCommandSchemas: Readonly<Record<TrackedTaskCommandName, JsonSchema.ISchemaValidator<unknown>>> =
  {
    start: JsonSchema.object({}, { description: 'No parameters: start a pending task.' }),
    wait: JsonSchema.object({ reason: waitingReasonSchema }),
    pause: JsonSchema.object({ reason: reasonSchema }),
    resume: JsonSchema.object({}, { description: 'No parameters: resume a waiting or paused task.' }),
    succeed: JsonSchema.object({ outcome: outcomeSchema }),
    fail: JsonSchema.object({ reason: reasonSchema, outcome: JsonSchema.optional(outcomeSchema) }),
    cancel: JsonSchema.object({ reason: reasonSchema, outcome: JsonSchema.optional(outcomeSchema) }),
    'set-title': JsonSchema.object({ title: JsonSchema.string({ description: 'The new one-line title.' }) }),
    'set-description': JsonSchema.object({
      description: JsonSchema.optional(
        JsonSchema.string({ description: 'The new description. Omit it to remove the description.' })
      )
    }),
    'set-progress': JsonSchema.object({ progress: JsonSchema.optional(progressSchema) }),
    'set-attention': JsonSchema.object({ attention: attentionSchema })
  };

/**
 * The registered handle of one `fgv.tracked@1` command.
 *
 * @remarks
 * The encoder is the identity onto JSON: the broker converts and canonicalizes a native command
 * itself, so the handle's canonical form is only the schema-accepted value. `idempotency` and
 * `conditional` describe an external source's dispatch (a safe resend under the same key; a source
 * revision precondition) and are read on no native path. They are registered as the values that
 * authorize nothing — `'none'` and `false` — so that nothing could read a tracked command as safe to
 * resend or as carrying a source precondition.
 */
function _trackedCommand(name: TrackedTaskCommandName): ITaskCommandHandle {
  return createTaskCommandHandle<unknown>({
    name,
    parameters: trackedCommandSchemas[name],
    encode: (parameters: unknown): Result<JsonValue> => JsonConverters.jsonValue.convert(parameters),
    idempotency: 'none',
    conditional: false
  });
}

/**
 * The registration descriptor for `fgv.tracked@1`.
 *
 * @remarks
 * Registers all eleven {@link trackedTaskCommandNames} with parameter schemas, so each can be offered
 * as a generated command tool. Registering a command offers it to no one: a host chooses which to
 * offer, one by one, and every call is still authorized per command by the host's policy.
 *
 * **Two validators, and which one decides.** The broker validates a native command with its own
 * `trackedCommand` converter, never through these handles. The converter is authoritative; the schema
 * is what a model is offered. They agree on shape, which is a fixture obligation (the `detailSchema`
 * precedent). They cannot agree on bounds: the wire subset has no lengths, patterns or ranges, so a
 * value the schema admits can still be refused as `invalid` — an overlong title, a code outside
 * identifier syntax, a non-canonical instant, a negative amount, `total` below `completed`, or too many
 * references.
 *
 * **What a host enables with these.** Every reference a command carries — `set-attention`'s list, a
 * reason's `attention`, an outcome's `artifacts` — is accepted on syntax alone: nothing checks that it
 * names anything real, so a model can assert a reference it made up. `succeed`, `fail` and `cancel`
 * record a terminal state on the host's behalf, and a terminal state is final; `succeed` always
 * records an outcome, `fail` and `cancel` record one only when it is sent.
 * @public
 */
export function trackedTaskDescriptor(): ITaskKindDescriptor<TrackedTaskDetails> {
  return {
    kind: trackedTaskKind,
    detailVersion: trackedTaskDetailVersion,
    details: trackedTaskDetails,
    detailSchema: trackedTaskDetailSchema,
    encode: (): Result<JsonValue> => succeed({}),
    commands: trackedTaskCommandNames.map(_trackedCommand)
  };
}

/**
 * The registration descriptor for `fgv.task-list@1`.
 * @public
 */
export function taskListDescriptor(): ITaskKindDescriptor<ITaskListDetails> {
  return {
    kind: taskListKind,
    detailVersion: taskListDetailVersion,
    details: taskListDetails,
    detailSchema: taskListDetailSchema,
    encode: (value: ITaskListDetails): Result<JsonValue> => succeed({ completion: value.completion })
  };
}
