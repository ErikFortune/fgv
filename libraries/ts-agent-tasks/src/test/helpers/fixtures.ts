/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { TaskConverters } from '../../index';

/**
 * The default converter set, built once for the suite. Declaration-time, so
 * `shouldNotFail` names the site if the defaults ever stop converting.
 */
export const converters: TaskConverters = TaskConverters.create().shouldNotFail('suite converters');

/** A minimal valid envelope: every required field, no optional field. */
export function minimalEnvelope(): Record<string, JsonValue> {
  return {
    schemaVersion: 1,
    id: 'task-1',
    kind: 'fgv.tracked',
    detailVersion: 1,
    revision: 1,
    title: 'a minimal task',
    stopPolicy: 'none',
    scopes: [],
    lifecycle: { status: 'pending' },
    attention: [],
    recovery: 'not-recoverable',
    observation: { state: 'current', observedAt: '2026-09-22T12:00:00.000Z' },
    createdAt: '2026-09-22T12:00:00.000Z',
    changedAt: '2026-09-22T12:00:00.000Z'
  };
}

/** A valid envelope exercising every optional field. */
export function fullEnvelope(): Record<string, JsonValue> {
  return {
    ...minimalEnvelope(),
    description: 'what this task is for',
    parentId: 'task-0',
    responsibility: { namespace: 'actor', key: 'worker-3' },
    scopes: [{ namespace: 'project', key: 'alpha' }],
    lifecycle: {
      status: 'waiting',
      reason: {
        code: 'awaiting-review',
        summary: 'held for review',
        attention: [{ namespace: 'thread', key: 'abc' }],
        notBefore: '2026-09-22T13:00:00.000Z'
      }
    },
    progress: { phase: 'ingest', completed: 3, total: 10, unit: 'files', summary: 'three of ten' },
    attention: [{ namespace: 'thread', key: 'abc' }],
    binding: { sourceId: 'source-a', referenceVersion: 1, reference: { job: 'j-1' } },
    recovery: 'reattach'
  };
}

/** A minimal valid snapshot of the built-in tracked kind. */
export function trackedSnapshot(): Record<string, JsonValue> {
  return { envelope: minimalEnvelope(), details: {} };
}

/** A minimal valid capacity claim of the given purpose, as wire JSON. */
export function claim(purpose: string, extra: Record<string, JsonValue>): Record<string, JsonValue> {
  return {
    claimVersion: 1,
    claimId: 'claim-1',
    owner: { owner: 'task', taskId: 'task-1' },
    ownership: 'pending',
    disposition: 'reserved',
    charges: [{ dimension: 'updates', amount: 7 }],
    purpose,
    ...extra
  };
}

/**
 * Builds an object carrying `extraJson` as a genuine own property alongside `base`.
 *
 * @remarks
 * It goes through one `JSON.parse` on purpose. Writing `{ __proto__: x }` as a source
 * literal, or reaching it through `Object.assign`, invokes the prototype setter instead
 * of creating an own property — so either would test nothing at all. `JSON.parse`
 * defines it as an own data property, which is exactly how such a key arrives from a
 * wire payload.
 */
export function hostileShape(base: object, extraJson: string): unknown {
  return JSON.parse(`{${extraJson},${JSON.stringify(base).slice(1)}`);
}
