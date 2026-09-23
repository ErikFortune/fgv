/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { ICommandReceipt, ITaskCommitRecord, OperationId, TaskResult } from '../../../index';
import {
  IBrokerHarness,
  bindWriter,
  brokerHarness,
  command,
  list,
  op,
  registerVendor,
  rev,
  revisionOf,
  succeedTask,
  tid,
  track
} from '../../helpers/brokerFixtures';

async function recordOf(h: IBrokerHarness, id: string): Promise<ITaskCommitRecord> {
  return (await h.repository.readCommit(tid(id))).orThrow()!;
}

function run(
  h: IBrokerHarness,
  id: string,
  name: string,
  parameters: JsonValue,
  expectedRevision: number,
  operationId: OperationId
): Promise<TaskResult<ICommandReceipt>> {
  return h.writer.execute({
    taskId: tid(id),
    operationId,
    expectedRevision: rev(expectedRevision),
    command: name,
    parameters
  });
}

describe('command receipts', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't');
  });

  test('applied advances the revision; a same-state no-op is applied at the current revision', async () => {
    expect(await command(h, h.writer, 't', 'start')).toEqual(
      expect.objectContaining({ command: 'start', result: { state: 'applied', appliedRevision: 2 } })
    );
    expect((await command(h, h.writer, 't', 'start')).result).toEqual({
      state: 'applied',
      appliedRevision: 2
    });
    expect(await revisionOf(h.repository, 't')).toBe(2);
  });

  test('a replay returns the stored receipt and writes nothing', async () => {
    const key = op();
    const first = (await run(h, 't', 'start', {}, 1, key)).orThrow();
    const before = await recordOf(h, 't');
    expect(await run(h, 't', 'start', {}, 1, key)).toSucceedWith(first);
    expect((await recordOf(h, 't')).recordRevision).toBe(before.recordRevision);
  });

  test('a reused key with a different request is idempotency-conflict and is not recorded', async () => {
    const key = op();
    await run(h, 't', 'start', {}, 1, key);
    const before = await recordOf(h, 't');
    for (const [name, parameters, expected] of [
      ['pause', { reason: { code: 'x', summary: 'y' } }, 2],
      ['start', {}, 2],
      // Parameters that do not even convert can never equal the stored request.
      ['wait', { nope: true }, 1]
    ] as const) {
      expect(await run(h, 't', name, parameters, expected, key)).toSucceedWith(
        expect.objectContaining({ result: { state: 'rejected', reason: 'idempotency-conflict' } })
      );
    }
    expect(await recordOf(h, 't')).toEqual(before);
  });

  test('the same key and request from another principal is a different operation', async () => {
    const key = op();
    await run(h, 't', 'start', {}, 1, key);
    const bob = bindWriter(h, { principal: 'bob' });
    expect(
      await bob.execute({
        taskId: tid('t'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'start',
        parameters: {}
      })
    ).toSucceedWith(
      expect.objectContaining({ result: { state: 'rejected', reason: 'idempotency-conflict' } })
    );
  });

  test('denied is returned, not recorded: a principal without command authority consumes nothing', async () => {
    h.policy.denyOn('command', 't');
    const before = await recordOf(h, 't');
    expect(await run(h, 't', 'start', {}, 1, op())).toSucceedWith(
      expect.objectContaining({ result: { state: 'rejected', reason: 'denied' } })
    );
    expect(await recordOf(h, 't')).toEqual(before);
  });

  test('a replay is re-authorized: revoked authority yields denied, not the private receipt', async () => {
    const key = op();
    await run(h, 't', 'start', {}, 1, key);
    h.policy.denyOn('command', 't');
    expect(await run(h, 't', 'start', {}, 1, key)).toSucceedWith(
      expect.objectContaining({ result: { state: 'rejected', reason: 'denied' } })
    );
  });

  test('evaluated refusals are recorded under their key and replay', async () => {
    const cases: ReadonlyArray<[string, JsonValue, number, string]> = [
      ['frobnicate', {}, 1, 'unsupported'],
      ['resume', {}, 1, 'invalid-transition'],
      ['start', {}, 7, 'conflict']
    ];
    for (const [name, parameters, expected, reason] of cases) {
      const key = op();
      const receipt = (await run(h, 't', name, parameters, expected, key)).orThrow();
      expect(receipt.result).toEqual({ state: 'rejected', reason });
      const stored = (await recordOf(h, 't')).operations.find((o) => o.operationId === key);
      expect(stored).toEqual(expect.objectContaining({ type: 'command', dispatch: 'settled', receipt }));
      expect(await run(h, 't', name, parameters, expected, key)).toSucceedWith(receipt);
    }
    // None of them moved the task.
    expect(await revisionOf(h.repository, 't')).toBe(1);
  });

  test('malformed parameters of a known command are an invalid request, recording nothing', async () => {
    const before = await recordOf(h, 't');
    expect(await run(h, 't', 'wait', { reason: 'soon' }, 1, op())).toFailWith(/execute wait/);
    expect(await h.writer.execute({ taskId: tid('t') } as never)).toFailWith(/execute:/);
    expect(await recordOf(h, 't')).toEqual(before);
  });

  test('stored parameters are the canonical converted ones', async () => {
    const key = op();
    await run(h, 't', 'set-progress', { progress: { total: 4, completed: 1 } }, 1, key);
    const stored = (await recordOf(h, 't')).operations.find((o) => o.operationId === key);
    expect(stored?.type === 'command' && stored.request.parameters).toEqual({
      progress: { completed: 1, total: 4 }
    });
    // A replay spelling the same parameters in another order is the same request.
    expect(await run(h, 't', 'set-progress', { progress: { completed: 1, total: 4 } }, 1, key)).toSucceedWith(
      expect.objectContaining({ result: { state: 'applied', appliedRevision: 2 } })
    );
  });

  test('an archived task refuses every command, unrecorded', async () => {
    await succeedTask(h, h.writer, 't');
    (await h.writer.archive({ taskId: tid('t'), operationId: op(), expectedRevision: rev(2) })).orThrow();
    const before = await recordOf(h, 't');
    expect(await run(h, 't', 'set-title', { title: 'x' }, 3, op())).toSucceedWith(
      expect.objectContaining({ result: { state: 'rejected', reason: 'invalid-transition' } })
    );
    expect(await recordOf(h, 't')).toEqual(before);
  });
});

describe('tasks the broker does not execute', () => {
  test('an external task: unsupported, recorded (its source owns commands)', async () => {
    const h = await brokerHarness();
    await registerVendor(h, 'v');
    const key = op();
    expect(await run(h, 'v', 'start', {}, 1, key)).toSucceedWith(
      expect.objectContaining({ result: { state: 'rejected', reason: 'unsupported' } })
    );
    expect((await recordOf(h, 'v')).operations.some((o) => o.operationId === key)).toBe(true);
  });

  test('an unresolved registration: unsupported, not recorded; its registration key conflicts', async () => {
    const h = await brokerHarness();
    await registerVendor(h, 'u', { unresolved: true });
    const before = await recordOf(h, 'u');
    expect(await run(h, 'u', 'start', {}, 1, op())).toSucceedWith(
      expect.objectContaining({ result: { state: 'rejected', reason: 'unsupported' } })
    );
    expect(await run(h, 'u', 'start', {}, 1, before.operations[0].operationId)).toSucceedWith(
      expect.objectContaining({ result: { state: 'rejected', reason: 'idempotency-conflict' } })
    );
    expect(await recordOf(h, 'u')).toEqual(before);
  });

  test('a task list refuses own-work commands and succeeds only through list completion', async () => {
    const h = await brokerHarness();
    await list(h.writer, 'l');
    for (const name of ['start', 'succeed']) {
      expect(
        (
          await command(
            h,
            h.writer,
            'l',
            name,
            name === 'succeed' ? { outcome: { summary: 's', artifacts: [] } } : {}
          )
        ).result
      ).toEqual({ state: 'rejected', reason: 'unsupported' });
    }
    expect((await command(h, h.writer, 'l', 'set-title', { title: 'renamed' })).result.state).toBe('applied');
    expect(
      (await command(h, h.writer, 'l', 'cancel', { reason: { code: 'x', summary: 'dropped' } })).result
    ).toEqual({ state: 'applied', appliedRevision: 3 });
  });
});
