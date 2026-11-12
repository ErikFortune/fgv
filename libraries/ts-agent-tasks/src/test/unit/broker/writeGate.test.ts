/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { AsyncControl } from '@fgv/ts-extras';
import { FileTreeTaskRepository, ITaskRepository, TaskBroker, TaskResult } from '../../../index';
import { TestPolicy, alpha, brokerRegistry, op, tid } from '../../helpers/brokerFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });

/** A timer the test fires by hand. */
class ManualTimer {
  public readonly armed: Array<{ fn: () => void; ms: number; cancelled: boolean }> = [];
  public readonly schedule: AsyncControl.ScheduleTimer = (fn, ms) => {
    const entry = { fn, ms, cancelled: false };
    this.armed.push(entry);
    return () => {
      entry.cancelled = true;
    };
  };

  public fireAll(): void {
    for (const entry of this.armed.filter((e) => !e.cancelled)) {
      entry.cancelled = true;
      entry.fn();
    }
  }
}

/** Lets pending promise continuations run. */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

/** A broker whose `writeGuard` is a real `AsyncControl.WriteGate`. */
async function harness(): Promise<{
  readonly gate: AsyncControl.WriteGate;
  readonly timer: ManualTimer;
  readonly repository: ITaskRepository;
  readonly broker: TaskBroker;
  readonly policy: TestPolicy;
}> {
  const timer = new ManualTimer();
  const gate = AsyncControl.WriteGate.create({ schedule: timer.schedule }).orThrow();
  const { env } = environment('w');
  const repository = (
    await FileTreeTaskRepository.initialize({
      root: memoryRoot(),
      mode: 'session',
      environment: env,
      registry: brokerRegistry()
    })
  ).orThrow();
  // The gate fits the structural writeGuard as is: no adapter.
  const broker = TaskBroker.create({
    repository,
    environment: env,
    writeGuard: gate,
    schedule: timer.schedule
  }).orThrow();
  return { gate, timer, repository, broker, policy: new TestPolicy() };
}

describe('AsyncControl.WriteGate as a TaskBroker writeGuard', () => {
  test('an open gate passes broker writes through and releases every slot', async () => {
    const { gate, broker, policy, repository } = await harness();
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    expect(
      await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' })
    ).toSucceed();
    expect(gate.inFlight).toBe(0);
    expect(await repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
  });

  test("the section's own classified failure passes through the gate unchanged, not as reconcile-first", async () => {
    const { broker, policy, repository } = await harness();
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    policy.afterDecision = (request) => {
      if (request.action === 'create') {
        policy.epoch = 'epoch-2';
      }
    };
    const result = await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    expect(result).toFailWithDetail(/authorization policy/i, code('conflict'));
    expect(result.detail?.retry).not.toBe('reconcile-first');
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
  });

  test('a raised gate refuses broker writes unrun — storage-unavailable, after-host-action — until lowered', async () => {
    const { gate, broker, policy, repository } = await harness();
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    gate.raise('restoring the tree');
    const refused = await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    expect(refused).toFailWithDetail(
      /the write guard refused: write gate is raised: restoring the tree/,
      code('storage-unavailable')
    );
    expect(refused.detail?.retry).toBe('after-host-action');
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
    gate.lower();
    expect(
      await writer.createTracked({ taskId: tid('a'), operationId: op('create-a2'), title: 'a' })
    ).toSucceed();
  });

  test('a pause holds broker writes; the held write keeps the broker busy; resuming runs it inside its turn', async () => {
    const { gate, timer, broker, policy, repository } = await harness();
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    const held = (await gate.pause(500)).orThrow();
    const write = writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    await settle();
    expect(gate.waiting).toBe(1);
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
    // A write held at the guard is a queued section: the broker is not idle.
    const idle = broker.whenIdle(100);
    await settle();
    timer.fireAll();
    expect(await idle).toFailWithDetail(/still busy after 100 ms/, code('conflict'));
    held.resume();
    // The gate awaited the pause before calling the section, but called it before its own answer
    // settled — so the broker ran it, rather than refusing it as started too late.
    expect(await write).toSucceed();
    expect(await repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
    expect(await broker.whenIdle(0)).toSucceedWith(true);
  });

  test('raising the gate while a broker write waits on a pause refuses it unrun: nothing written', async () => {
    const { gate, broker, policy, repository } = await harness();
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    const held = (await gate.pause(500)).orThrow();
    const write = writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    await settle();
    expect(gate.waiting).toBe(1);
    gate.raise('shutting down');
    const refused = await write;
    expect(refused).toFailWithDetail(/write gate is raised: shutting down/, code('storage-unavailable'));
    expect(refused.detail?.retry).toBe('after-host-action');
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
    held.resume();
  });

  test('quiesce: pause the gate, then whenIdle — both resolve once the section already past the gate finishes', async () => {
    const { gate, broker, policy, repository } = await harness();
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    const write = writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    // Step until the section is past the gate and running.
    for (let i = 0; i < 1000 && gate.inFlight === 0; i++) {
      await Promise.resolve();
    }
    expect(gate.inFlight).toBe(1);
    const seen: { paused?: boolean; idle?: TaskResult<true> } = {};
    const pausing = gate.pause(500).then((r) => {
      seen.paused = r.isSuccess();
      return r;
    });
    const idle = broker.whenIdle(500).then((r) => (seen.idle = r));
    expect(seen.paused).toBeUndefined();
    expect(await write).toSucceed();
    const held = (await pausing).orThrow();
    expect(await idle).toSucceedWith(true);
    expect(gate.quiet).toBe(true);
    // The quiet holds: a write asked now waits at the gate.
    const later = writer.createTracked({ taskId: tid('b'), operationId: op('create-b'), title: 'b' });
    await settle();
    expect(gate.waiting).toBe(1);
    expect(await repository.read(tid('b'))).toSucceedWith(undefined);
    held.resume();
    expect(await later).toSucceed();
  });
});
