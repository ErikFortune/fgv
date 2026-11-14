/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  CapacityDimension,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  TaskResult,
  defaultTaskCapacityProfile
} from '../../../index';
import {
  IBrokerHarness,
  ada,
  bob,
  brokerHarness,
  command,
  list,
  op,
  rev,
  revisionOf,
  succeedTask,
  tid,
  track
} from '../../helpers/brokerFixtures';

function profileWith(
  limits: Partial<ITaskCapacityProfile['limits']>,
  perOwner?: Partial<ITaskCapacityProfile['perOwner']>
): ITaskCapacityProfile {
  return {
    ...defaultTaskCapacityProfile,
    limits: { ...defaultTaskCapacityProfile.limits, ...limits },
    perOwner: { ...defaultTaskCapacityProfile.perOwner, ...perOwner }
  };
}

function backpressure(result: TaskResult<unknown>, dimension: CapacityDimension): void {
  expect(result).toFail();
  expect(result.isFailure() && result.detail).toEqual(
    expect.objectContaining({
      code: 'backpressure',
      capacity: expect.objectContaining({ reason: 'capacity-exhausted', dimension })
    })
  );
}

async function claims(h: IBrokerHarness, id: string): Promise<ReadonlyArray<ITaskCapacityClaim>> {
  const record: ITaskCommitRecord = (await h.repository.readCommit(tid(id))).orThrow()!;
  return record.capacityClaims;
}

describe('A3: at ordinary limits, new identities are refused while accepted work can still finish', () => {
  test('non-archived saturation: replay, child completion, list completion and archive all proceed', async () => {
    const h = await brokerHarness({ profile: profileWith({ 'non-archived-tasks': 3 }) });
    await list(h.writer, 'l');
    const createA = { taskId: tid('a'), operationId: op(), title: 'a', parentId: tid('l') };
    const receiptA = (await h.writer.createTracked(createA)).orThrow();
    await track(h.writer, 'b', { parentId: 'l' });
    backpressure(
      await h.writer.createTracked({ taskId: tid('d'), operationId: op(), title: 'd' }),
      'non-archived-tasks'
    );
    // Same-key replay is resolved before admission and allocates nothing.
    expect(await h.writer.createTracked(createA)).toSucceedWith(receiptA);
    // Accepted children finish, and the list completes from them on its reserved terminal path.
    await succeedTask(h, h.writer, 'a');
    await succeedTask(h, h.writer, 'b');
    expect((await h.writer.reconcileListCompletions({ limit: 10 })).orThrow().completed).toHaveLength(1);
    // Archive is eligible and releases a non-archived slot, which new admission can then use.
    (
      await h.writer.archive({
        taskId: tid('a'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'a')
      })
    ).orThrow();
    expect(await h.writer.createTracked({ taskId: tid('d'), operationId: op(), title: 'd' })).toSucceed();
  });

  test('retained identities are a lifetime limit: archive does not release them', async () => {
    const h = await brokerHarness({ profile: profileWith({ 'retained-tasks': 2 }) });
    await track(h.writer, 'a');
    await track(h.writer, 'b');
    await succeedTask(h, h.writer, 'a');
    (await h.writer.archive({ taskId: tid('a'), operationId: op(), expectedRevision: rev(2) })).orThrow();
    const refused = await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c' });
    backpressure(refused, 'retained-tasks');
    expect(refused.isFailure() && refused.detail?.capacity?.reclaimableByCleanup).toBe(false);
  });

  test('per-task operations: ordinary work stops short of the closeout slots, which terminal and archive use', async () => {
    const h = await brokerHarness({ profile: profileWith({}, { maxOperationsPerTask: 5 }) });
    await track(h.writer, 't');
    await command(h, h.writer, 't', 'set-title', { title: 'one' });
    await command(h, h.writer, 't', 'set-title', { title: 'two' });
    backpressure(
      await h.writer.execute({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        command: 'set-title',
        parameters: { title: 'three' }
      }),
      'operations'
    );
    backpressure(
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        responsibility: ada
      }),
      'operations'
    );
    expect((await succeedTask(h, h.writer, 't')).result.state).toBe('applied');
    expect(
      await h.writer.archive({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't')
      })
    ).toSucceed();
  });

  test('resident payload saturation: ordinary owed updates are refused, the reserved terminal path is not', async () => {
    // Every update is owed to one subscriber, so every update charges resident payload.
    const setup = async (h: IBrokerHarness): Promise<void> => {
      await track(h.writer, 'a');
      await track(h.writer, 'b');
    };
    // Measure what two accepted tasks hold — two closeout reservations plus their creation
    // updates — then give a fresh repository exactly that much and nothing more.
    const probe = await brokerHarness({ watch: true });
    await setup(probe);
    const held = probe.repository
      .capacityStatus()
      .orThrow()
      .dimensions.find((d) => d.dimension === 'resident-payload-bytes')!;
    const h = await brokerHarness({
      profile: profileWith({ 'resident-payload-bytes': held.used + held.reserved }),
      watch: true
    });
    await setup(h);
    // No new identity fits.
    backpressure(
      await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c' }),
      'resident-payload-bytes'
    );
    // Ordinary progress would add an owed payload nobody reserved: refused before acceptance.
    backpressure(
      await h.writer.execute({
        taskId: tid('a'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'set-progress',
        parameters: { progress: { completed: 1 } }
      }),
      'resident-payload-bytes'
    );
    // The terminal transition's owed lifecycle and result payloads come out of a's own closeout
    // reservation, so it is accepted at saturation.
    const receipt = await succeedTask(h, h.writer, 'a');
    expect(receipt.result).toEqual({ state: 'applied', appliedRevision: 2 });
    const record = (await h.repository.readCommit(tid('a'))).orThrow()!;
    expect(record.recordType === 'resolved' && record.updates.map((u) => u.category)).toEqual([
      'lifecycle',
      'lifecycle',
      'result'
    ]);
  });
});

describe('A3: metadata changes carry claims unchanged', () => {
  test('reassign, scope and parent changes leave every claim byte-identical', async () => {
    const h = await brokerHarness();
    await track(h.writer, 'p');
    await track(h.writer, 't');
    const before = await claims(h, 't');
    (
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        responsibility: bob
      })
    ).orThrow();
    (
      await h.writer.reparent({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        parent: { taskId: tid('p') }
      })
    ).orThrow();
    (
      await h.writer.updateTracked({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        patch: { title: 'x' }
      })
    ).orThrow();
    expect(await claims(h, 't')).toEqual(before);
  });

  test('a terminal transition spends the closeout claim; archive consumes it', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    const spent = (await claims(h, 't')).find((c) => c.purpose === 'terminal-closeout')!;
    expect(spent.disposition).toBe('reserved');
    (
      await h.writer.archive({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't')
      })
    ).orThrow();
    expect((await claims(h, 't')).find((c) => c.purpose === 'terminal-closeout')!.disposition).toBe(
      'consumed'
    );
  });
});
