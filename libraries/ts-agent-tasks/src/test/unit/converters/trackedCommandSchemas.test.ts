/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * `fgv.tracked@1`'s registered command schemas: the wire form a model is offered, pinned as
 * literals, and their agreement with the broker's authoritative `trackedCommand` converter.
 *
 * Agreement is a fixture obligation — nothing at runtime compares the two. Every fixture below is
 * chosen so that the right and the wrong answer differ: a value one side would accept and a drifted
 * side would refuse, or the reverse.
 */

import '@fgv/ts-utils-jest';
import { JsonObject } from '@fgv/ts-json-base';
import {
  ITaskCommandHandle,
  defaultTaskFieldBounds,
  TaskKindRegistry,
  TrackedTaskCommandName,
  trackedTaskCommandNames,
  trackedTaskDescriptor,
  trackedTaskDetailVersion,
  trackedTaskKind
} from '../../../index';
import { converters } from '../../helpers/fixtures';

const handles: ReadonlyArray<ITaskCommandHandle> = trackedTaskDescriptor().commands ?? [];

function handle(name: TrackedTaskCommandName): ITaskCommandHandle {
  const found = handles.find((h) => h.name === name);
  if (found === undefined) {
    throw new Error(`no registered ${name}`);
  }
  return found;
}

/** The two validators' verdicts on one parameters value. */
function verdicts(
  name: TrackedTaskCommandName,
  parameters: unknown
): { schema: boolean; converter: boolean } {
  return {
    schema: handle(name).parameters.convert(parameters).isSuccess(),
    converter: converters.broker.trackedCommand.convert({ command: name, parameters }).isSuccess()
  };
}

// ------------------------------------------------------------------------------------------
// Wire literals
// ------------------------------------------------------------------------------------------

const reference: JsonObject = {
  type: 'object',
  properties: {
    namespace: { type: 'string', description: 'The namespace of an identity the host gave you.' },
    key: { type: 'string', description: 'The key within that namespace, exactly as the host gave it.' }
  },
  required: ['namespace', 'key'],
  additionalProperties: false,
  description: 'A reference to something the host named — never one you made up.'
};

const attention: JsonObject = {
  type: 'array',
  items: reference,
  description: 'References that need attention. Only references the host gave you; the list may be empty.'
};

const reasonProperties: JsonObject = {
  code: { type: 'string', description: 'A short machine-readable code, e.g. "blocked-on-review".' },
  summary: { type: 'string', description: 'A short human-readable explanation.' },
  attention
};

const reason: JsonObject = {
  type: 'object',
  properties: reasonProperties,
  required: ['code', 'summary'],
  additionalProperties: false,
  description: 'Why the task is in this state.'
};

const outcome: JsonObject = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'What the task achieved, or how it ended.' },
    artifacts: {
      type: 'array',
      items: reference,
      description: 'References to what the task produced. Only references the host gave you; may be empty.'
    }
  },
  required: ['summary', 'artifacts'],
  additionalProperties: false,
  description: 'The outcome of the task — stated to the host as fact, and never changed afterwards.'
};

const expectedWire: Readonly<Record<TrackedTaskCommandName, JsonObject>> = {
  start: {
    type: 'object',
    properties: {},
    additionalProperties: false,
    description: 'No parameters: start a pending task.'
  },
  wait: {
    type: 'object',
    properties: {
      reason: {
        type: 'object',
        properties: {
          ...reasonProperties,
          notBefore: {
            type: 'string',
            description:
              'The earliest instant the wait could end, as a UTC timestamp with milliseconds: ' +
              'YYYY-MM-DDTHH:mm:ss.sssZ.'
          }
        },
        required: ['code', 'summary'],
        additionalProperties: false,
        description: 'What the task is waiting for.'
      }
    },
    required: ['reason'],
    additionalProperties: false
  },
  pause: {
    type: 'object',
    properties: { reason },
    required: ['reason'],
    additionalProperties: false
  },
  resume: {
    type: 'object',
    properties: {},
    additionalProperties: false,
    description: 'No parameters: resume a waiting or paused task.'
  },
  succeed: {
    type: 'object',
    properties: { outcome },
    required: ['outcome'],
    additionalProperties: false
  },
  fail: {
    type: 'object',
    properties: { reason, outcome },
    required: ['reason'],
    additionalProperties: false
  },
  cancel: {
    type: 'object',
    properties: { reason, outcome },
    required: ['reason'],
    additionalProperties: false
  },
  'set-title': {
    type: 'object',
    properties: { title: { type: 'string', description: 'The new one-line title.' } },
    required: ['title'],
    additionalProperties: false
  },
  'set-description': {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'The new description. Omit it to remove the description.'
      }
    },
    additionalProperties: false
  },
  'set-progress': {
    type: 'object',
    properties: {
      progress: {
        type: 'object',
        properties: {
          phase: { type: 'string', description: 'The current phase.' },
          completed: { type: 'number', description: 'How much is done; not negative.' },
          total: { type: 'number', description: 'How much there is in all; not less than completed.' },
          unit: { type: 'string', description: 'What completed and total count.' },
          summary: { type: 'string', description: 'A short progress note.' }
        },
        additionalProperties: false,
        description: 'The progress to report, replacing any reported before. Omit it to remove the progress.'
      }
    },
    additionalProperties: false
  },
  'set-attention': {
    type: 'object',
    properties: { attention },
    required: ['attention'],
    additionalProperties: false
  }
};

describe('fgv.tracked@1 registers its commands', () => {
  test('exactly trackedTaskCommandNames, in its order — a twelfth name cannot arrive without a schema', () => {
    expect(handles.map((h) => h.name)).toEqual(trackedTaskCommandNames);
    expect(Object.keys(expectedWire).sort()).toEqual([...trackedTaskCommandNames].sort());
  });

  test('each is reachable through a registry, as a generated command tool finds it', () => {
    const registry = TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
    expect(registry.register(trackedTaskDescriptor())).toSucceedAndSatisfy((kind) => {
      expect(kind.commandNames).toEqual(trackedTaskCommandNames);
    });
    for (const name of trackedTaskCommandNames) {
      expect(registry.getCommand(trackedTaskKind, trackedTaskDetailVersion, name)).toSucceedAndSatisfy(
        (h) => {
          expect(h.name).toBe(name);
          expect(h.parameters.toJson()).toEqual(expectedWire[name]);
        }
      );
    }
  });

  test('each registers as the inert dispatch values — never a safe resend, never a source precondition', () => {
    // Read only on external paths; for a native command they must authorize nothing.
    for (const h of handles) {
      expect({ idempotency: h.idempotency, conditional: h.conditional }).toEqual({
        idempotency: 'none',
        conditional: false
      });
    }
  });

  test('each descriptor call builds fresh handles, so no registry shares another one’s', () => {
    const again = trackedTaskDescriptor().commands ?? [];
    expect(again).toHaveLength(handles.length);
    expect(again[0]).not.toBe(handles[0]);
  });

  test.each([...trackedTaskCommandNames])('%s: the wire schema is pinned', (name) => {
    expect(handle(name).parameters.toJson()).toEqual(expectedWire[name]);
  });

  test('the empty-parameter commands emit an empty closed object, with no required list', () => {
    for (const name of ['start', 'resume'] as const) {
      const wire = handle(name).parameters.toJson();
      expect(wire.properties).toEqual({});
      expect(wire.required).toBeUndefined();
      expect(wire.additionalProperties).toBe(false);
    }
  });
});

describe("a handle's validate is the schema accepting a value and re-encoding it unchanged", () => {
  test.each<[TrackedTaskCommandName, JsonObject]>([
    ['start', {}],
    ['set-title', { title: 'renamed' }],
    ['set-description', {}],
    [
      'fail',
      {
        reason: { code: 'boom', summary: 'it broke', attention: [{ namespace: 'ticket', key: 'T-1' }] },
        outcome: { summary: 'partial', artifacts: [] }
      }
    ]
  ])('%s', (name, parameters) => {
    expect(handle(name).validate(parameters)).toSucceedWith(parameters);
  });

  test('a surplus property is refused, and says which command', () => {
    expect(handle('start').validate({ force: true })).toFailWith(/command 'start'/);
  });
});

// ------------------------------------------------------------------------------------------
// Agreement
// ------------------------------------------------------------------------------------------

const ref = { namespace: 'ticket', key: 'T-1' };
const aReason = { code: 'blocked', summary: 'waiting on review' };
const anOutcome = { summary: 'done', artifacts: [ref] };

/** Values both validators must accept. */
const bothAccept: ReadonlyArray<[TrackedTaskCommandName, string, unknown]> = [
  ['start', 'the empty object', {}],
  ['resume', 'the empty object', {}],
  // Both sides inherit this from `@fgv/ts-utils`: an object converter with no fields converts
  // `null` to `{}` (one with any field refuses it). Agreement holds, and the canonical form is `{}`.
  ['start', 'null, canonicalized to the empty object', null],
  ['resume', 'null, canonicalized to the empty object', null],
  ['wait', 'a reason alone', { reason: aReason }],
  [
    'wait',
    'every optional member: attention and a canonical notBefore',
    { reason: { ...aReason, attention: [ref], notBefore: '2026-10-01T09:00:00.000Z' } }
  ],
  ['wait', 'an empty attention list', { reason: { ...aReason, attention: [] } }],
  ['pause', 'a reason with attention', { reason: { ...aReason, attention: [ref] } }],
  ['succeed', 'an outcome with an artifact', { outcome: anOutcome }],
  ['succeed', 'an outcome with no artifacts', { outcome: { summary: 'done', artifacts: [] } }],
  ['fail', 'a reason and no outcome', { reason: aReason }],
  ['fail', 'a reason and an outcome', { reason: aReason, outcome: anOutcome }],
  ['cancel', 'a reason and no outcome', { reason: aReason }],
  ['cancel', 'a reason and an outcome', { reason: aReason, outcome: anOutcome }],
  ['set-title', 'a title', { title: 'renamed' }],
  ['set-description', 'a description', { description: 'longer text\nover two lines' }],
  ['set-description', 'no description (clears it)', {}],
  ['set-progress', 'no progress (clears it)', {}],
  ['set-progress', 'an empty progress object', { progress: {} }],
  [
    'set-progress',
    'every progress member, total equal to completed',
    { progress: { phase: 'copy', completed: 3, total: 3, unit: 'files', summary: 'all copied' } }
  ],
  ['set-progress', 'a fractional amount', { progress: { completed: 0.5 } }],
  ['set-attention', 'an empty list (clears attention)', { attention: [] }],
  ['set-attention', 'two references', { attention: [ref, { namespace: 'doc', key: 'spec.md' }] }]
];

/** Values both validators must refuse — each one a shape a drifted schema would plausibly admit. */
const bothRefuse: ReadonlyArray<[TrackedTaskCommandName, string, unknown]> = [
  ['start', 'a surplus property', { force: true }],
  ['resume', 'a surplus property', { reason: aReason }],
  ['start', 'an array', []],
  ['wait', 'no reason', {}],
  ['wait', 'a reason with no summary', { reason: { code: 'x' } }],
  ['wait', 'a surplus member of the reason', { reason: { ...aReason, until: 'later' } }],
  ['wait', 'a numeric notBefore', { reason: { ...aReason, notBefore: 1760000000000 } }],
  [
    'pause',
    'a waiting-only member (notBefore) on a plain reason',
    {
      reason: { ...aReason, notBefore: '2026-10-01T09:00:00.000Z' }
    }
  ],
  [
    'pause',
    'a reference with a surplus member',
    { reason: { ...aReason, attention: [{ ...ref, url: 'x' }] } }
  ],
  ['pause', 'a reference missing its key', { reason: { ...aReason, attention: [{ namespace: 'ticket' }] } }],
  ['succeed', 'no outcome', {}],
  ['succeed', 'an outcome with no artifacts member', { outcome: { summary: 'done' } }],
  ['succeed', 'a reason instead of an outcome', { reason: aReason }],
  ['fail', 'an outcome and no reason', { outcome: anOutcome }],
  ['cancel', 'an outcome that is a string', { reason: aReason, outcome: 'done' }],
  ['set-title', 'no title', {}],
  ['set-title', 'a numeric title', { title: 7 }],
  ['set-description', 'a null description', { description: null }],
  ['set-progress', 'a null progress', { progress: null }],
  ['set-progress', 'a surplus progress member', { progress: { percent: 50 } }],
  ['set-attention', 'no attention', {}],
  ['set-attention', 'a single reference, not a list', { attention: ref }],
  ['set-attention', 'a list holding a string', { attention: ['ticket:T-1'] }],
  ['set-attention', 'a null attention', { attention: null }],
  ['wait', 'a null reason', { reason: null }],
  ['pause', 'a null attention inside the reason', { reason: { ...aReason, attention: null } }],
  ['succeed', 'a null outcome', { outcome: null }],
  ['fail', 'a null outcome', { reason: aReason, outcome: null }]
];

/**
 * Values the schema admits and the converter refuses: the bounds the wire subset cannot express
 * (no lengths, patterns or ranges). The broker is authoritative, so these are refused as `invalid`
 * — a usability gap, not a safety one. Pinned so that the gap is a known list: a new entry is a
 * decision, not drift.
 */
const onlySchemaAccepts: ReadonlyArray<[TrackedTaskCommandName, string, unknown]> = [
  ['set-title', 'an empty title', { title: '' }],
  ['set-title', 'a two-line title', { title: 'one\ntwo' }],
  [
    'set-title',
    'a title one over the bound',
    { title: 'x'.repeat(defaultTaskFieldBounds.maxTitleLength + 1) }
  ],
  ['set-description', 'an empty description', { description: '' }],
  ['wait', 'a code outside identifier syntax', { reason: { code: 'not a code', summary: 's' } }],
  ['wait', 'an empty summary', { reason: { code: 'c', summary: '' } }],
  ['wait', 'a zone-offset notBefore', { reason: { ...aReason, notBefore: '2026-10-01T09:00:00+02:00' } }],
  ['wait', 'an impossible date', { reason: { ...aReason, notBefore: '2026-02-30T00:00:00.000Z' } }],
  [
    'pause',
    'a reference namespace outside identifier syntax',
    {
      reason: { ...aReason, attention: [{ namespace: 'a b', key: 'k' }] }
    }
  ],
  [
    'set-attention',
    'one reference over the bound',
    { attention: Array.from({ length: defaultTaskFieldBounds.maxReferences + 1 }, () => ref) }
  ],
  ['set-attention', 'a two-line reference key', { attention: [{ namespace: 'ticket', key: 'T\n1' }] }],
  [
    'succeed',
    'one artifact over the bound',
    {
      outcome: {
        summary: 'done',
        artifacts: Array.from({ length: defaultTaskFieldBounds.maxReferences + 1 }, () => ref)
      }
    }
  ],
  ['set-progress', 'a two-line phase', { progress: { phase: 'a\nb' } }],
  ['set-progress', 'a two-line unit', { progress: { unit: 'a\nb' } }],
  ['set-progress', 'an empty progress summary', { progress: { summary: '' } }],
  ['set-progress', 'a negative amount', { progress: { completed: -1 } }],
  // Not sendable as JSON, but reachable by a direct `execute` call: the schema's number admits it.
  ['set-progress', 'an infinite amount', { progress: { total: Infinity } }],
  ['set-progress', 'total below completed', { progress: { completed: 3, total: 2 } }],
  ['succeed', 'an empty outcome summary', { outcome: { summary: '', artifacts: [] } }]
];

/**
 * Values the converter accepts and the schema refuses: the converter's number coercion turns a
 * numeric string into a number, and the strict wire schema does not. A model is never offered these,
 * so the gap denies it nothing it was told it could send.
 */
const onlyConverterAccepts: ReadonlyArray<[TrackedTaskCommandName, string, unknown]> = [
  ['set-progress', 'a numeric-string amount', { progress: { completed: '3' } }]
];

describe('schema and converter agree — the fixture obligation', () => {
  test.each(bothAccept)('%s accepts %s on both sides', (name, __what, parameters) => {
    expect(verdicts(name, parameters)).toEqual({ schema: true, converter: true });
  });

  test.each(bothRefuse)('%s refuses %s on both sides', (name, __what, parameters) => {
    expect(verdicts(name, parameters)).toEqual({ schema: false, converter: false });
  });

  test.each(onlySchemaAccepts)(
    '%s: %s passes the schema and is refused by the authoritative converter',
    (name, __what, parameters) => {
      expect(verdicts(name, parameters)).toEqual({ schema: true, converter: false });
    }
  );

  test.each(onlyConverterAccepts)(
    '%s: %s is coerced by the converter and refused by the schema',
    (name, __what, parameters) => {
      expect(verdicts(name, parameters)).toEqual({ schema: false, converter: true });
    }
  );

  test('every command is covered by at least one accepted and one refused fixture', () => {
    for (const name of trackedTaskCommandNames) {
      expect(bothAccept.some(([n]) => n === name)).toBe(true);
      expect(bothRefuse.some(([n]) => n === name)).toBe(true);
    }
  });

  test('the schema admits every canonical form the converter produces from an agreed value', () => {
    // What the broker stores must itself be something a model could have been offered.
    for (const [name, , parameters] of bothAccept) {
      const converted = converters.broker.trackedCommand.convert({ command: name, parameters }).orThrow();
      expect(handle(name).parameters.convert(converted.parameters)).toSucceed();
    }
  });
});
