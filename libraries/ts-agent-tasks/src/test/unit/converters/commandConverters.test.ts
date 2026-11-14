/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { trackedTaskCommandNames } from '../../../index';
import { converters } from '../../helpers/fixtures';

const request: Record<string, JsonValue> = {
  taskId: 'task-1',
  operationId: 'op-1',
  expectedRevision: 3,
  command: 'start',
  parameters: {}
};

describe('command request', () => {
  test('converts a well-formed request', () => {
    expect(converters.commands.request.convert(request)).toSucceedAndSatisfy((converted) => {
      expect(converted.command).toBe('start');
      expect(converted.expectedRevision).toBe(3);
    });
  });

  test.each(['taskId', 'operationId', 'expectedRevision', 'command', 'parameters'])(
    'rejects a request missing %s',
    (field: string) => {
      const partial: Record<string, JsonValue> = { ...request };
      delete partial[field];
      expect(converters.commands.request.convert(partial)).toFail();
    }
  );

  test('rejects an unrecognized property on a mutating request', () => {
    expect(converters.commands.request.convert({ ...request, force: true })).toFail();
  });

  test('a caller may not attach capacity claims to a request', () => {
    expect(
      converters.commands.request.convert({
        ...request,
        capacityClaims: [{ claimId: 'mine', charges: [] }]
      })
    ).toFail();
  });

  test('rejects an expected revision that is not a positive safe integer', () => {
    expect(converters.commands.request.convert({ ...request, expectedRevision: 0 })).toFail();
    expect(
      converters.commands.request.convert({ ...request, expectedRevision: Number.MAX_SAFE_INTEGER + 1 })
    ).toFail();
  });
});

describe('command names', () => {
  test.each(trackedTaskCommandNames)('accepts the built-in command name %s', (name: string) => {
    expect(converters.commands.commandName.convert(name)).toSucceedWith(name);
  });

  test('declares eleven tracked command names, and no external setStatus among them', () => {
    expect(trackedTaskCommandNames).toHaveLength(11);
    expect(trackedTaskCommandNames).not.toContain('setStatus');
    expect(trackedTaskCommandNames).not.toContain('reassign');
    expect(trackedTaskCommandNames).not.toContain('archive');
  });

  test.each([
    ['empty', ''],
    ['a path', 'commands/start'],
    ['whitespace', 'set title'],
    ['a leading separator', '-start']
  ])('rejects %s as a command name', (__label: string, name: string) => {
    expect(converters.commands.commandName.convert(name)).toFail();
  });

  test('rejects a command name over the code bound', () => {
    expect(converters.commands.commandName.convert('a'.repeat(129))).toFail();
  });
});

describe('command state', () => {
  test.each([
    ['denied'],
    ['unsupported'],
    ['conflict'],
    ['invalid-transition'],
    ['stop-active'],
    ['idempotency-conflict']
  ])('converts a rejection for %s', (reason: string) => {
    expect(converters.commands.state.convert({ state: 'rejected', reason })).toSucceed();
  });

  test('rejects an unknown rejection reason', () => {
    expect(converters.commands.state.convert({ state: 'rejected', reason: 'busy' })).toFail();
  });

  test('accepted may carry a source receipt, and applied carries the revision it reached', () => {
    expect(converters.commands.state.convert({ state: 'accepted' })).toSucceed();
    expect(converters.commands.state.convert({ state: 'accepted', sourceReceipt: 'r-1' })).toSucceed();
    expect(converters.commands.state.convert({ state: 'applied', appliedRevision: 4 })).toSucceedAndSatisfy(
      (state) => {
        expect(state.state === 'applied' && state.appliedRevision).toBe(4);
      }
    );
  });

  test('accepted is not applied — an applied state without a revision fails', () => {
    expect(converters.commands.state.convert({ state: 'applied' })).toFail();
  });

  test('an indeterminate state states why, and is not collapsed into a rejection', () => {
    expect(
      converters.commands.state.convert({ state: 'indeterminate', reason: 'send outcome unknown' })
    ).toSucceed();
    expect(converters.commands.state.convert({ state: 'indeterminate' })).toFail();
  });

  test('an unknown state converts to nothing', () => {
    expect(converters.commands.state.convert({ state: 'pending' })).toFail();
  });
});

describe('command receipt', () => {
  test('a receipt carries the identity the request was deduplicated by', () => {
    expect(
      converters.commands.receipt.convert({
        taskId: 'task-1',
        operationId: 'op-1',
        command: 'start',
        result: { state: 'accepted' }
      })
    ).toSucceedAndSatisfy((receipt) => {
      expect(receipt.operationId).toBe('op-1');
      expect(receipt.result.state).toBe('accepted');
    });
  });

  test('rejects a receipt with no result', () => {
    expect(
      converters.commands.receipt.convert({ taskId: 'task-1', operationId: 'op-1', command: 'start' })
    ).toFail();
  });
});
