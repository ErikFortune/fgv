/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { ITaskEnvelope, TaskConverters } from '../../../index';
import {
  converters,
  fullEnvelope,
  hostileShape,
  minimalEnvelope,
  trackedSnapshot
} from '../../helpers/fixtures';

describe('envelope', () => {
  test('converts a minimal envelope and leaves every optional field absent', () => {
    expect(converters.envelopes.envelope.convert(minimalEnvelope())).toSucceedAndSatisfy(
      (envelope: ITaskEnvelope) => {
        expect(envelope.schemaVersion).toBe(1);
        expect(envelope.id).toBe('task-1');
        expect(envelope.description).toBeUndefined();
        expect(envelope.parentId).toBeUndefined();
        expect(envelope.responsibility).toBeUndefined();
        expect(envelope.progress).toBeUndefined();
        expect(envelope.binding).toBeUndefined();
        expect(envelope.scopes).toEqual([]);
        expect(envelope.attention).toEqual([]);
      }
    );
  });

  test('converts an envelope exercising every optional field', () => {
    expect(converters.envelopes.envelope.convert(fullEnvelope())).toSucceedAndSatisfy(
      (envelope: ITaskEnvelope) => {
        expect(envelope.lifecycle.status).toBe('waiting');
        expect(envelope.binding?.sourceId).toBe('source-a');
        expect(envelope.responsibility?.key).toBe('worker-3');
        expect(envelope.progress?.total).toBe(10);
      }
    );
  });

  test('the runtime shape is exactly the declared shape — nothing extra survives', () => {
    expect(converters.envelopes.envelope.convert(fullEnvelope())).toSucceedAndSatisfy(
      (envelope: ITaskEnvelope) => {
        expect(Object.keys(envelope).sort()).toEqual(Object.keys(fullEnvelope()).sort());
      }
    );
  });

  test.each([
    'schemaVersion',
    'id',
    'kind',
    'detailVersion',
    'revision',
    'title',
    'stopPolicy',
    'scopes',
    'lifecycle',
    'attention',
    'recovery',
    'observation',
    'createdAt',
    'changedAt'
  ])('rejects an envelope missing %s', (field: string) => {
    const envelope: Record<string, JsonValue> = minimalEnvelope();
    delete envelope[field];
    expect(converters.envelopes.envelope.convert(envelope)).toFail();
  });

  test('rejects an additional property rather than dropping it', () => {
    expect(converters.envelopes.envelope.convert({ ...minimalEnvelope(), owner: 'someone' })).toFail();
  });

  test.each([
    ['a __proto__ property', '"__proto__":{"admin":true}'],
    ['a constructor property', '"constructor":"x"'],
    ['a capacityClaims property', '"capacityClaims":[]'],
    ['a prototype property', '"prototype":{}']
  ])('rejects a hostile shape carrying %s', (__label: string, extraJson: string) => {
    expect(converters.envelopes.envelope.convert(hostileShape(minimalEnvelope(), extraJson))).toFail();
  });

  test('rejects schema version 2 — v1 writes and reads only version 1', () => {
    expect(converters.envelopes.envelope.convert({ ...minimalEnvelope(), schemaVersion: 2 })).toFail();
  });

  test('rejects a zero or non-integral detail version', () => {
    expect(converters.envelopes.envelope.convert({ ...minimalEnvelope(), detailVersion: 0 })).toFail();
    expect(converters.envelopes.envelope.convert({ ...minimalEnvelope(), detailVersion: 1.5 })).toFail();
  });

  test('rejects a revision beyond the safe integer range', () => {
    expect(
      converters.envelopes.envelope.convert({
        ...minimalEnvelope(),
        revision: Number.MAX_SAFE_INTEGER + 1
      })
    ).toFail();
  });

  test('rejects a task id that is a path fragment', () => {
    expect(converters.envelopes.envelope.convert({ ...minimalEnvelope(), id: '../../etc/passwd' })).toFail();
  });

  test('rejects a title over the bound and a multi-line title', () => {
    expect(converters.envelopes.envelope.convert({ ...minimalEnvelope(), title: 'x'.repeat(257) })).toFail();
    expect(converters.envelopes.envelope.convert({ ...minimalEnvelope(), title: 'a\nb' })).toFail();
  });

  test('accepts a title exactly at the bound', () => {
    expect(
      converters.envelopes.envelope.convert({ ...minimalEnvelope(), title: 'x'.repeat(256) })
    ).toSucceed();
  });

  test('accepts a description at the bound and rejects one over it', () => {
    expect(
      converters.envelopes.envelope.convert({ ...minimalEnvelope(), description: 'x'.repeat(4096) })
    ).toSucceed();
    expect(
      converters.envelopes.envelope.convert({ ...minimalEnvelope(), description: 'x'.repeat(4097) })
    ).toFail();
  });

  test('rejects a zone-free instant anywhere in the envelope', () => {
    expect(
      converters.envelopes.envelope.convert({ ...minimalEnvelope(), createdAt: '2026-09-22T12:00:00' })
    ).toFail();
    expect(converters.envelopes.envelope.convert({ ...minimalEnvelope(), changedAt: '2026-09-22' })).toFail();
  });

  test('a bound waiting state carries only opaque attention references', () => {
    const waiting: Record<string, JsonValue> = {
      ...minimalEnvelope(),
      lifecycle: {
        status: 'waiting',
        reason: {
          code: 'awaiting-input',
          summary: 'needs a human',
          attention: [{ namespace: 'thread', key: 'msg-7' }]
        }
      }
    };
    expect(converters.envelopes.envelope.convert(waiting)).toSucceedAndSatisfy((envelope) => {
      const reason: { attention?: ReadonlyArray<{ namespace: string; key: string }> } =
        envelope.lifecycle.status === 'waiting' ? envelope.lifecycle.reason : {};
      expect(reason.attention).toEqual([{ namespace: 'thread', key: 'msg-7' }]);
    });
  });

  test('a waiting reason cannot carry a request, a prompt or an answer', () => {
    const waiting: unknown = {
      ...minimalEnvelope(),
      lifecycle: {
        status: 'waiting',
        reason: {
          code: 'awaiting-input',
          summary: 'needs a human',
          request: { prompt: 'what next?' },
          answer: null
        }
      }
    };
    expect(converters.envelopes.envelope.convert(waiting)).toFail();
  });
});

describe('snapshot', () => {
  test('converts an envelope plus arbitrary validated JSON details', () => {
    expect(converters.envelopes.snapshot.convert(trackedSnapshot())).toSucceedAndSatisfy((snapshot) => {
      expect(snapshot.details).toEqual({});
    });
  });

  test('rejects a snapshot with an extra top-level property', () => {
    expect(converters.envelopes.snapshot.convert({ ...trackedSnapshot(), capacityClaims: [] })).toFail();
  });

  test('rejects a snapshot whose details are not JSON', () => {
    expect(
      converters.envelopes.snapshot.convert({ envelope: minimalEnvelope(), details: undefined })
    ).toFail();
  });
});

describe('lowered bounds', () => {
  test('a construction-lowered title bound rejects what the default accepts', () => {
    const lowered: TaskConverters = TaskConverters.create({
      bounds: { maxTitleLength: 8 }
    }).orThrow();
    const long: Record<string, JsonValue> = { ...minimalEnvelope(), title: 'x'.repeat(16) };
    expect(converters.envelopes.envelope.convert(long)).toSucceed();
    expect(lowered.envelopes.envelope.convert(long)).toFail();
  });
});
