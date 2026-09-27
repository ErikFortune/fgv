/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IResolvedTaskCommitRecord,
  IStopIntent,
  IStoredTaskOperation,
  ITaskCommitRecord,
  OperationId,
  TaskResult
} from '../../../index';
import { IBrokerHarness, brokerHarness, op, tid } from '../../helpers/brokerFixtures';
import { converters } from '../../helpers/fixtures';
import { node, persisted, pump, stop } from '../../helpers/stopFixtures';

async function root(h: IBrokerHarness, id: string = 'root'): Promise<IResolvedTaskCommitRecord> {
  return (await h.repository.readCommit(tid(id))).orThrow() as IResolvedTaskCommitRecord;
}

/** Commits a hand-built replacement of a record through the raw writer, bypassing the broker. */
async function raw(
  h: IBrokerHarness,
  current: IResolvedTaskCommitRecord,
  change: {
    readonly stops?: ReadonlyArray<IStopIntent>;
    readonly add?: IStoredTaskOperation;
    readonly archived?: boolean;
    readonly purpose?: 'operation' | 'maintenance';
  }
): Promise<TaskResult<ITaskCommitRecord>> {
  const purpose = change.purpose ?? (change.add !== undefined ? 'operation' : 'maintenance');
  const record = {
    recordType: 'resolved' as const,
    task: current.task,
    operations: change.add !== undefined ? [...current.operations, change.add] : current.operations,
    updates: current.updates,
    archived: change.archived ?? current.archived,
    ...(change.stops !== undefined ? { stops: change.stops } : {})
  };
  return h.repository.withWriter(async (writer) =>
    purpose === 'operation'
      ? writer.commit({
          purpose,
          operationId: change.add!.operationId,
          taskId: current.task.envelope.id,
          expectedRevision: current.task.envelope.revision,
          expectedRecordRevision: current.recordRevision,
          record
        })
      : writer.commit({
          purpose,
          taskId: current.task.envelope.id,
          expectedRevision: current.task.envelope.revision,
          expectedRecordRevision: current.recordRevision,
          record
        })
  );
}

function stopOp(
  id: OperationId,
  operation: 'stop' | 'release-stop' = 'stop',
  intentId?: string
): IStoredTaskOperation {
  return {
    type: 'catalog',
    operationId: id,
    operation,
    request: intentId !== undefined ? { intentId } : {},
    principalKey: 'alice',
    receipt: {}
  };
}

function intent(id: OperationId, targets: ReadonlyArray<string>, extra?: Partial<IStopIntent>): IStopIntent {
  return {
    id,
    rootId: tid('root'),
    mode: 'pause',
    requestedBy: 'alice',
    targets: targets.map((taskId) => ({
      taskId: tid(taskId),
      attempt: 1,
      operationId: op('key'),
      state: 'unexamined' as const
    })),
    state: 'pending',
    topologyGeneration: 0,
    ...extra
  };
}

describe('storage enforces how a stop is accepted and how it evolves', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    await node(h.writer, 'a', { parentId: 'root' });
    await node(h.writer, 'b', { parentId: 'a' });
  });

  test('a stop that skips a child is refused, whatever computed it', async () => {
    const key = op('stop');
    expect(await raw(h, await root(h), { stops: [intent(key, ['root', 'a'])], add: stopOp(key) })).toFailWith(
      /not the authoritative subtree of root \(2 captured, 3 in the tree\); no child is skipped/
    );
    // In a different order is not the subtree either: root first, then breadth-first by id.
    expect(
      await raw(h, await root(h), { stops: [intent(key, ['root', 'b', 'a'])], add: stopOp(key) })
    ).toFailWith(/not the authoritative subtree/);
    expect(
      await raw(h, await root(h), { stops: [intent(key, ['root', 'a', 'b'])], add: stopOp(key) })
    ).toSucceed();
  });

  test('a stop is accepted only by its own operation, pending, unexamined, from the principal that asked', async () => {
    const key = op('stop');
    const cases: Array<[IStopIntent, IStoredTaskOperation | undefined, RegExp]> = [
      [intent(key, ['root', 'a', 'b']), undefined, /accepted only by the stop operation/],
      [
        intent(key, ['root', 'a', 'b']),
        stopOp(op('other')),
        /adds exactly its own operation|accepted only by/
      ],
      [
        intent(key, ['root', 'a', 'b'], { requestedBy: 'mallory' }),
        stopOp(key),
        /requestedBy must be the principal/
      ],
      [intent(key, ['root', 'a', 'b'], { state: 'blocked' }), stopOp(key), /an accepted stop is pending/]
    ];
    for (const [value, add, expected] of cases) {
      expect(
        await raw(h, await root(h), { stops: [value], ...(add !== undefined ? { add } : {}) })
      ).toFailWith(expected);
    }
    const confirmed = intent(key, ['root', 'a', 'b']);
    const forged = {
      ...confirmed,
      targets: confirmed.targets.map((t) => ({ ...t, state: 'confirmed' as const }))
    };
    expect(await raw(h, await root(h), { stops: [forged], add: stopOp(key) })).toFailWith(
      /accepted unexamined/
    );
    const two = [intent(key, ['root', 'a', 'b']), intent(op('stop'), ['root', 'a', 'b'], { mode: 'cancel' })];
    expect(await raw(h, await root(h), { stops: two, add: stopOp(key) })).toFailWith(/at most one stop/);
  });

  describe('once accepted', () => {
    let accepted: IStopIntent;
    beforeEach(async () => {
      const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
      accepted = await persisted(h, result);
    });

    test('it is never dropped or re-identified', async () => {
      expect(await raw(h, await root(h), { stops: [] })).toFailWith(/cannot be dropped/);
      expect(await raw(h, await root(h), {})).toFailWith(/cannot be dropped/);
      const reordered = {
        ...accepted,
        targets: [accepted.targets[0], accepted.targets[2], accepted.targets[1]]
      };
      expect(await raw(h, await root(h), { stops: [reordered] })).toFailWith(
        /identity and target set are immutable/
      );
      expect(await raw(h, await root(h), { stops: [{ ...accepted, mode: 'cancel' }] })).toFailWith(
        /immutable/
      );
    });

    test('released only by its release; settled only by an archive; final once either', async () => {
      expect(await raw(h, await root(h), { stops: [{ ...accepted, state: 'released' }] })).toFailWith(
        /released only by the operation that releases it/
      );
      const other = op('release');
      expect(
        await raw(h, await root(h), {
          stops: [{ ...accepted, state: 'released' }],
          add: stopOp(other, 'release-stop', 'someone-else')
        })
      ).toFailWith(/released only by/);
      const confirmedAll = {
        ...accepted,
        targets: accepted.targets.map((t) => ({ ...t, state: 'confirmed' as const }))
      };
      expect(await raw(h, await root(h), { stops: [{ ...confirmedAll, state: 'settled' }] })).toFailWith(
        /only an archive of its root settles a satisfied cancel/
      );
      const release = op('release');
      expect(
        await raw(h, await root(h), {
          stops: [{ ...accepted, state: 'released' }],
          add: stopOp(release, 'release-stop', accepted.id)
        })
      ).toSucceed();
      expect(await raw(h, await root(h), { stops: [{ ...accepted, state: 'pending' }] })).toFailWith(
        /a released stop is final/
      );
    });

    test('an attempt moves forward by one, with a key no attempt holds', async () => {
      const bump = (attempt: number, key: OperationId): IStopIntent => ({
        ...accepted,
        targets: accepted.targets.map((t, i) => (i === 1 ? { ...t, attempt, operationId: key } : t))
      });
      expect(await raw(h, await root(h), { stops: [bump(1, op('k'))] })).toFailWith(/moves forward by one/);
      expect(await raw(h, await root(h), { stops: [bump(3, op('k'))] })).toFailWith(/moves forward by one/);
      expect(await raw(h, await root(h), { stops: [bump(2, accepted.targets[1].operationId)] })).toFailWith(
        /moves forward by one|needs a key no attempt holds/
      );
      // A key another latching stop's attempt holds is not fresh either.
      const cancel = await persisted(h, (await stop(h, h.writer, 'root', 'cancel')).orThrow());
      const now = await root(h);
      expect(await raw(h, now, { stops: [bump(2, cancel.targets[1].operationId), cancel] })).toFailWith(
        /needs a key no attempt holds/
      );
      expect(await raw(h, await root(h), { stops: [bump(2, op('fresh')), cancel] })).toSucceed();
    });

    test("a stop command is admitted only as a live attempt of its own intent, and a stop's key cannot be taken", async () => {
      const a = (await h.repository.readCommit(tid('a'))).orThrow() as IResolvedTaskCommitRecord;
      const key = accepted.targets[1].operationId;
      const command = (
        operationId: OperationId,
        marker?: { rootId: string; intentId: string }
      ): IStoredTaskOperation =>
        ({
          type: 'command',
          operationId,
          request: {
            taskId: tid('a'),
            operationId,
            expectedRevision: a.task.envelope.revision,
            command: 'set-title',
            parameters: { title: 'x' }
          },
          principalKey: 'alice',
          dispatch: 'settled',
          receipt: {
            taskId: tid('a'),
            operationId,
            command: 'set-title',
            result: { state: 'applied', appliedRevision: a.task.envelope.revision }
          },
          ...(marker !== undefined ? { stop: marker } : {})
        } as unknown as IStoredTaskOperation);
      expect(await raw(h, a, { add: command(key) })).toFailWith(
        /belongs to a stop attempt and cannot be reused/
      );
      expect(
        await raw(h, a, { add: command(op('x'), { rootId: 'root', intentId: accepted.id }) })
      ).toFailWith(/is not a live attempt/);
      expect(await raw(h, a, { add: command(key, { rootId: 'root', intentId: 'another' }) })).toFailWith(
        /is not a live attempt/
      );
      (await pump(h.writer, { intentId: accepted.id, rootId: tid('root') } as never)).orThrow();
      const after = (await h.repository.readCommit(tid('a'))).orThrow() as IResolvedTaskCommitRecord;
      // Landed: the same key again is not an attempt to make.
      expect(
        await raw(h, after, { add: command(op('y'), { rootId: 'root', intentId: accepted.id }) })
      ).toFailWith(/not a live attempt/);
    });
  });
});

describe('the intent converters hold a stop to its structure', () => {
  const base = intent('s' as OperationId, ['root', 'a']);
  test.each([
    ['the root first', { ...base, targets: [...base.targets].reverse() }, /must be the first target/],
    [
      'each task once',
      { ...base, targets: [base.targets[0], base.targets[0]] },
      /is a target twice|names two targets/
    ],
    [
      'each key once',
      {
        ...base,
        targets: [base.targets[0], { ...base.targets[1], operationId: base.targets[0].operationId }]
      },
      /names two targets/
    ],
    [
      'no satisfied with an unconfirmed target',
      { ...base, state: 'satisfied' },
      /has every target confirmed/
    ],
    ['no empty target set', { ...base, targets: [] }, /must be the first target/]
  ])('%s', (__, value, expected) => {
    expect(converters.stops.intent.convert(value)).toFailWith(expected);
  });

  test('a record holds only its own stops, and one latching stop per mode', () => {
    expect(converters.stops.intents.convert([base, { ...base, id: 't' }])).toFailWith(
      /second latching pause/
    );
    expect(converters.stops.intents.convert([base, base])).toFailWith(/recorded twice/);
    expect(
      converters.stops.intents.convert([
        base,
        { ...base, id: 't', rootId: 'x', targets: [{ ...base.targets[0], taskId: 'x' }] }
      ])
    ).toFailWith(/only the stops of its own task/);
    expect(converters.stops.intents.convert([base, { ...base, id: 't', state: 'released' }])).toSucceed();
  });
});
