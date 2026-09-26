/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IResolvedTaskCommitRecord,
  ITaskEnvelope,
  SubscriptionId,
  UpdateCategory,
  planUpdates
} from '../../../index';
import {
  IBrokerHarness,
  ada,
  bob,
  brokerHarness,
  command,
  op,
  registerVendor,
  revisionOf,
  succeedTask,
  tid,
  track,
  watch
} from '../../helpers/brokerFixtures';
import { envelope } from '../../helpers/storageFixtures';

const sub = (id: string): SubscriptionId => id as SubscriptionId;

async function record(h: IBrokerHarness, id: string): Promise<IResolvedTaskCommitRecord> {
  const found = (await h.repository.readCommit(tid(id))).orThrow()!;
  if (found.recordType !== 'resolved') {
    throw new Error('unresolved');
  }
  return found;
}

describe('update planning', () => {
  test('an update owed to no one is not retained', () => {
    const e: ITaskEnvelope = envelope('t', 2);
    expect(planUpdates(undefined, e, ['lifecycle'], () => [])).toEqual([]);
  });

  test('one update per category, sorted distinct audience, required by category', () => {
    const e: ITaskEnvelope = envelope('t', 2);
    const all = (): SubscriptionId[] => [sub('b'), sub('a'), sub('b')];
    const categories: UpdateCategory[] = ['lifecycle', 'progress', 'observation', 'attention', 'lifecycle'];
    expect(planUpdates(undefined, e, categories, all)).toEqual([
      expect.objectContaining({ id: 't:2:0', category: 'lifecycle', required: true, audience: ['a', 'b'] }),
      expect.objectContaining({ id: 't:2:1', category: 'progress', required: false }),
      expect.objectContaining({ id: 't:2:5', category: 'observation', required: false }),
      expect.objectContaining({
        id: 't:2:2',
        category: 'attention',
        required: true,
        snapshot: { envelope: e }
      })
    ]);
  });
});

describe('committed updates, owed to real subscriptions', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    // "Assigned to ada" and "assigned to bob", matched before and after each change (design § 8.3).
    await watch(h.broker, { id: 'ada-watch', selection: { responsibility: ada } });
    await watch(h.broker, { id: 'bob-watch', selection: { responsibility: bob } });
  });

  test('reassignment carries an assignment update owed to both the old and new assignee', async () => {
    await track(h.writer, 't', { responsibility: ada });
    const result = (
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        responsibility: bob
      })
    ).orThrow();
    expect(result.updateIds).toEqual(['t:2:4']);
    const update = (await record(h, 't')).updates.find((u) => u.id === 't:2:4')!;
    expect(update).toEqual(
      expect.objectContaining({
        category: 'assignment',
        required: true,
        revision: 2,
        audience: ['ada-watch', 'bob-watch']
      })
    );
    // The payload is the presentation of that revision, frozen with it.
    expect(update.snapshot.envelope.responsibility).toEqual(bob);
    expect(update.snapshot.envelope.revision).toBe(2);
    // The owed index sees it for both audiences.
    expect(await h.repository.listOwed({ subscription: sub('ada-watch') })).toSucceedAndSatisfy((page) => {
      expect(page.updates.map((u) => u.id)).toEqual(['t:1:0', 't:2:4']);
    });
  });

  test('a terminal command owes lifecycle and result; progress is not required', async () => {
    await track(h.writer, 't', { responsibility: ada });
    await command(h, h.writer, 't', 'set-progress', { progress: { completed: 1 } });
    await succeedTask(h, h.writer, 't');
    const updates = (await record(h, 't')).updates;
    expect(updates.map((u) => [u.id, u.required])).toEqual([
      ['t:1:0', true],
      ['t:2:1', false],
      ['t:3:0', true],
      ['t:3:3', true]
    ]);
    // A task that still owes updates cannot be archived until its audience has them.
    expect(
      await h.writer.archive({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't')
      })
    ).toFailWith(/updates are still owed/);
  });

  test('an unchanged mutation owes nothing', async () => {
    await track(h.writer, 't', { responsibility: ada });
    const result = (
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        responsibility: ada
      })
    ).orThrow();
    expect(result.updateIds).toEqual([]);
  });

  test('an external registration with a terminal first observation owes lifecycle and result', async () => {
    await registerVendor(h, 'v', {
      responsibility: ada,
      lifecycle: { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } }
    });
    expect((await record(h, 'v')).updates.map((u) => u.category)).toEqual(['lifecycle', 'result']);
  });
});
