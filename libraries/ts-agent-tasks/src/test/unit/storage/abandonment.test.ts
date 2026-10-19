/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IStoredCommandOperation, OperationId, TaskId, TaskRevision } from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { checkCommandEvolution } from '../../../packlets/storage/commitRules';

// Which moves to `abandoned` a record may make: only from an open outcome, naming what was known,
// and changing nothing else about the command.

function command(extra: Partial<IStoredCommandOperation> = {}): IStoredCommandOperation {
  return {
    type: 'command',
    operationId: 'op-1' as OperationId,
    request: {
      taskId: 't' as TaskId,
      operationId: 'op-1' as OperationId,
      expectedRevision: 1 as TaskRevision,
      command: 'pause',
      parameters: {}
    },
    principalKey: 'host',
    dispatch: 'possibly-sent',
    receipt: {
      taskId: 't' as TaskId,
      operationId: 'op-1' as OperationId,
      command: 'pause',
      result: { state: 'indeterminate', reason: 'held' }
    },
    ...extra
  };
}

function abandoned(
  from: 'not-sent' | 'possibly-sent' | 'awaiting-feed',
  extra: Partial<IStoredCommandOperation> = {}
): IStoredCommandOperation {
  const base = command();
  return {
    ...base,
    dispatch: 'settled',
    receipt: { ...base.receipt, result: { state: 'abandoned', reason: 'r', from } },
    ...extra
  };
}

describe('abandonment in the command evolution rules', () => {
  test('from an uncertain send, naming it', () => {
    expect(checkCommandEvolution([command()], [abandoned('possibly-sent')])).toSucceed();
    expect(checkCommandEvolution([command({ dispatch: 'not-sent' })], [abandoned('not-sent')])).toSucceed();
  });

  test('from a settled receipt awaiting its feed, which stops awaiting', () => {
    const awaiting = command({
      dispatch: 'settled',
      awaiting: { revision: { epoch: 'e', token: '2' }, execution: 'x' },
      receipt: { ...command().receipt, result: { state: 'accepted' } }
    });
    expect(checkCommandEvolution([awaiting], [abandoned('awaiting-feed')])).toSucceed();
  });

  test('never under the wrong origin', () => {
    expect(checkCommandEvolution([command()], [abandoned('not-sent')])).toFailWith(
      /but it was 'possibly-sent'/
    );
  });

  test('never from a settled, final receipt', () => {
    const settled = command({
      dispatch: 'settled',
      receipt: { ...command().receipt, result: { state: 'applied', appliedRevision: 2 as TaskRevision } }
    });
    expect(checkCommandEvolution([settled], [abandoned('possibly-sent')])).toFailWith(
      /a settled receipt is final/
    );
  });

  test('never changing anything else about the command', () => {
    expect(
      checkCommandEvolution([command()], [abandoned('possibly-sent', { principalKey: 'someone-else' })])
    ).toFailWith(/changes nothing else/);
  });

  test('never recorded abandoned from the start', () => {
    expect(checkCommandEvolution([], [abandoned('possibly-sent')])).toFailWith(
      /cannot be recorded abandoned/
    );
  });

  test('an abandoned receipt is final', () => {
    const first = abandoned('possibly-sent');
    expect(checkCommandEvolution([first], [first])).toSucceed();
    const changed = {
      ...first,
      receipt: {
        ...first.receipt,
        result: { state: 'abandoned' as const, reason: 'other', from: 'possibly-sent' as const }
      }
    };
    expect(checkCommandEvolution([first], [changed])).toFailWith(/a settled receipt is final/);
  });
});
