/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  ExternalProjection,
  ExternalTaskSource,
  ICommandRequest,
  ISourceBinding,
  IExternalTaskSourceParams,
  Instant,
  OperationId,
  TaskId,
  TaskRevision
} from '../../../index';

interface IDetails {
  readonly n: number;
}

const binding: ISourceBinding = { sourceId: 'src', referenceVersion: 1, reference: { job: 'a' } };
const projection: ExternalProjection<IDetails> = {
  revision: { epoch: 'e', token: '1' },
  observedAt: '2026-09-24T10:00:00.000Z' as Instant,
  lifecycle: { status: 'running' },
  attention: [],
  details: { n: 1 }
};

function request(command: string, parameters: JsonValue = {}): ICommandRequest {
  return {
    taskId: 'a' as TaskId,
    operationId: 'op-1' as OperationId,
    expectedRevision: 1 as TaskRevision,
    command,
    parameters
  };
}

function params(
  overrides?: Partial<IExternalTaskSourceParams<IDetails>>
): IExternalTaskSourceParams<IDetails> {
  return {
    id: 'src',
    history: 'observed-state',
    encodeDetails: (d) => succeed({ n: d.n }),
    compare: () => succeed('same'),
    read: async () => succeed({ state: 'observed', value: projection }),
    feed: async () =>
      succeed({
        observations: [{ binding, observation: { state: 'observed', value: projection } }],
        completeness: 'complete',
        coverage: 'all-bindings',
        issues: []
      }),
    recover: async () => succeed({ state: 'reattached', value: projection }),
    ...overrides
  };
}

const bump = ExternalTaskSource.command<IDetails, { by: number }>(
  {
    name: 'bump',
    parameters: JsonSchema.object({ by: JsonSchema.integer() }) as JsonSchema.ISchemaValidator<{
      by: number;
    }>,
    encode: (p) => succeed({ by: p.by }),
    idempotency: 'source-key',
    conditional: true
  },
  async (__, p, ___, expected) =>
    succeed({
      state: 'applied',
      observation: { ...projection, details: { n: p.by + (expected !== undefined ? 100 : 0) } }
    })
);

describe('ExternalTaskSource', () => {
  test('encodes typed projections through the host encoder on every path', async () => {
    const source = ExternalTaskSource.create(params({ commands: [bump] })).orThrow();
    expect(await source.observe(binding)).toSucceedWith({
      state: 'observed',
      value: { ...projection, details: { n: 1 } }
    });
    expect(await source.reconcile()).toSucceedAndSatisfy((page) => {
      expect(page.observations[0].observation).toEqual({
        state: 'observed',
        value: { ...projection, details: { n: 1 } }
      });
    });
    expect(await source.recover(binding)).toSucceedWith({
      state: 'reattached',
      value: { ...projection, details: { n: 1 } }
    });
    expect(await source.dispatch(binding, request('bump', { by: 2 }))).toSucceedAndSatisfy((answer) => {
      expect(answer).toEqual({ state: 'applied', observation: { ...projection, details: { n: 2 } } });
    });
    // A conditional command receives the precondition.
    expect(
      await source.dispatch(binding, request('bump', { by: 2 }), { epoch: 'e', token: '1' })
    ).toSucceedAndSatisfy((answer) =>
      expect(answer.state === 'applied' && answer.observation.details).toEqual({ n: 102 })
    );
    expect(source.compare(projection.revision, projection.revision)).toSucceedWith('same');
    expect(source.commandHandles.map((h) => [h.name, h.idempotency, h.conditional])).toEqual([
      ['bump', 'source-key', true]
    ]);
  });

  test('passes the other recovery and read states through', async () => {
    for (const recovered of [
      { state: 'unrecoverable' as const, reason: 'gone', value: projection },
      { state: 'completed' as const, value: projection },
      { state: 'resumable' as const, reference: { at: 3 } },
      { state: 'unresolved' as const, reason: 'unknown' }
    ]) {
      const source = ExternalTaskSource.create(params({ recover: async () => succeed(recovered) })).orThrow();
      expect(await source.recover(binding)).toSucceedAndSatisfy((result) =>
        expect(result.state).toBe(recovered.state)
      );
    }
    const missing = ExternalTaskSource.create(
      params({ read: async () => succeed({ state: 'missing', reason: 'no' }) })
    ).orThrow();
    expect(await missing.observe(binding)).toSucceedWith({ state: 'missing', reason: 'no' });
  });

  test('an observation-only source refuses every command and has no lookup', async () => {
    const source = ExternalTaskSource.create(params()).orThrow();
    expect(await source.dispatch(binding, request('anything'))).toSucceedWith({
      state: 'rejected',
      reason: 'unsupported'
    });
    expect(source.commandHandles).toEqual([]);
    expect(source.lookupCommand).toBeUndefined();
  });

  test('a lookup encodes what it finds', async () => {
    const source = ExternalTaskSource.create(
      params({
        lookupCommand: async (__, r) =>
          r.command === 'found'
            ? succeed({ state: 'applied', observation: projection })
            : succeed({ state: 'not-found' })
      })
    ).orThrow();
    expect(await source.lookupCommand!(binding, request('found'))).toSucceedAndSatisfy((found) =>
      expect(found.state).toBe('applied')
    );
    expect(await source.lookupCommand!(binding, request('other'))).toSucceedWith({ state: 'not-found' });
  });

  test('host failures and throws are an unavailable source, never an escaped exception', async () => {
    const thrower = async (): Promise<Result<never>> => {
      throw new Error('boom');
    };
    const source = ExternalTaskSource.create(
      params({
        read: thrower,
        feed: async () => fail('feed down'),
        recover: thrower,
        lookupCommand: async () => fail('lookup down'),
        commands: [
          ExternalTaskSource.command<IDetails, { by: number }>(
            {
              name: 'bump',
              parameters: JsonSchema.object({ by: JsonSchema.integer() }) as JsonSchema.ISchemaValidator<{
                by: number;
              }>,
              encode: (p) => succeed({ by: p.by }),
              idempotency: 'none',
              conditional: false
            },
            async () => fail('send failed')
          )
        ]
      })
    ).orThrow();
    const unavailable = { code: 'source-unavailable', retry: 'safe' };
    expect(await source.observe(binding)).toFailWithDetail(/boom/, unavailable);
    expect(await source.reconcile('c')).toFailWithDetail(/feed down/, unavailable);
    expect(await source.recover(binding)).toFailWithDetail(/boom/, unavailable);
    expect(await source.lookupCommand!(binding, request('bump'))).toFailWithDetail(
      /lookup down/,
      unavailable
    );
    expect(await source.dispatch(binding, request('bump', { by: 1 }))).toFailWithDetail(
      /send failed/,
      unavailable
    );
  });

  test('parameters the descriptor refuses never reach the host callback', async () => {
    let called = false;
    const source = ExternalTaskSource.create(
      params({
        commands: [
          ExternalTaskSource.command<IDetails, { by: number }>(
            {
              name: 'bump',
              parameters: JsonSchema.object({ by: JsonSchema.integer() }) as JsonSchema.ISchemaValidator<{
                by: number;
              }>,
              encode: (p) => succeed({ by: p.by }),
              idempotency: 'none',
              conditional: false
            },
            async () => {
              called = true;
              return succeed({ state: 'rejected', reason: 'conflict' });
            }
          )
        ]
      })
    ).orThrow();
    expect(await source.dispatch(binding, request('bump', { by: 'x' }))).toFailWith(/command 'bump'/);
    expect(called).toBe(false);
  });

  test('an encoder that fails or throws fails the read', async () => {
    const failing = ExternalTaskSource.create(params({ encodeDetails: () => fail('unencodable') })).orThrow();
    expect(await failing.observe(binding)).toFailWith(/unencodable/);
    expect(await failing.reconcile()).toFailWith(/unencodable/);
    expect(await failing.recover(binding)).toFailWith(/unencodable/);
    const throwing = ExternalTaskSource.create(
      params({
        encodeDetails: () => {
          throw new Error('encoder threw');
        },
        commands: [bump]
      })
    ).orThrow();
    expect(await throwing.dispatch(binding, request('bump', { by: 1 }))).toFailWith(/encoder threw/);
    const unrecoverable = ExternalTaskSource.create(
      params({
        encodeDetails: () => fail('unencodable'),
        recover: async () => succeed({ state: 'unrecoverable', reason: 'x', value: projection })
      })
    ).orThrow();
    expect(await unrecoverable.recover(binding)).toFailWith(/unencodable/);
  });

  test('a comparator that throws fails the comparison', () => {
    const source = ExternalTaskSource.create(
      params({
        compare: () => {
          throw new Error('cannot order');
        }
      })
    ).orThrow();
    expect(source.compare(projection.revision, projection.revision)).toFailWith(/cannot order/);
  });

  test('two commands with one name are refused', () => {
    expect(ExternalTaskSource.create(params({ commands: [bump, bump] }))).toFailWith(
      /two commands are named 'bump'/
    );
  });
});
