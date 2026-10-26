/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { fail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskRepository,
  ITaskWriteGuard,
  TaskBroker,
  TaskResult,
  TaskScheduleTimer
} from '../../../index';
import { TestPolicy, alpha, brokerRegistry, op, tid, track } from '../../helpers/brokerFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });

/** A timer the test fires by hand. */
class ManualTimer {
  public readonly armed: Array<{ fn: () => void; ms: number; cancelled: boolean }> = [];
  public readonly schedule: TaskScheduleTimer = (fn, ms) => {
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

  public get live(): number {
    return this.armed.filter((e) => !e.cancelled).length;
  }
}

/** A write guard that holds every write until released, counting what it saw. */
class HoldingGuard implements ITaskWriteGuard {
  public holding: boolean = false;
  public refusing: string | undefined = undefined;
  public throwing: boolean = false;
  public guarded: number = 0;
  public inside: number = 0;
  private _release: Array<() => void> = [];

  public async guard<T>(write: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> {
    this.guarded++;
    if (this.throwing) {
      throw new Error('gate offline');
    }
    if (this.refusing !== undefined) {
      // A gate typed over plain Result refuses without task detail.
      return fail(this.refusing) as unknown as TaskResult<T>;
    }
    if (this.holding) {
      await new Promise<void>((resolve) => this._release.push(resolve));
    }
    this.inside++;
    return write();
  }

  public release(): void {
    this.holding = false;
    const waiting = this._release;
    this._release = [];
    waiting.forEach((r) => r());
  }

  public get held(): number {
    return this._release.length;
  }
}

/** Lets pending promise continuations run. */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

async function harness(options?: { readonly guard?: ITaskWriteGuard; readonly timer?: ManualTimer }): Promise<{
  readonly repository: ITaskRepository;
  readonly broker: TaskBroker;
  readonly policy: TestPolicy;
}> {
  const { env } = environment('g');
  const repository = (
    await FileTreeTaskRepository.initialize({
      root: memoryRoot(),
      mode: 'session',
      environment: env,
      registry: brokerRegistry()
    })
  ).orThrow();
  const broker = TaskBroker.create({
    repository,
    environment: env,
    ...(options?.guard !== undefined ? { writeGuard: options.guard } : {}),
    ...(options?.timer !== undefined ? { schedule: options.timer.schedule } : {})
  }).orThrow();
  return { repository, broker, policy: new TestPolicy() };
}

describe('TaskBroker.whenIdle', () => {
  test('an idle broker resolves at once and arms no timer', async () => {
    const timer = new ManualTimer();
    const { broker } = await harness({ timer });
    expect(await broker.whenIdle(1000)).toSucceedWith(true);
    expect(timer.armed).toHaveLength(0);
  });

  test('resolves when the last queued write finishes, and cancels its timer', async () => {
    const guard = new HoldingGuard();
    const timer = new ManualTimer();
    const { broker, policy } = await harness({ guard, timer });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    guard.holding = true;
    const first = track(writer, 'a');
    const second = track(writer, 'b');
    await settle();
    const seen: { idle?: TaskResult<true> } = {};
    const idle = broker.whenIdle(1000).then((r) => (seen.idle = r));
    await settle();
    expect(seen.idle).toBeUndefined();
    expect(timer.live).toBe(1);
    guard.release();
    await first;
    // The second write is still queued behind the first: not idle yet.
    expect(seen.idle).toBeUndefined();
    await second;
    expect(await idle).toSucceedWith(true);
    expect(timer.live).toBe(0);
  });

  test('times out with a classified failure while a write is held, and leaves the write to finish', async () => {
    const guard = new HoldingGuard();
    const timer = new ManualTimer();
    const { broker, policy, repository } = await harness({ guard, timer });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    guard.holding = true;
    const write = track(writer, 'a');
    await settle();
    const idle = broker.whenIdle(250);
    await settle();
    expect(timer.armed.map((a) => a.ms)).toEqual([250]);
    timer.fireAll();
    expect(await idle).toFailWithDetail(/still busy after 250 ms/, code('conflict'));
    expect((await idle).detail?.retry).toBe('safe');
    guard.release();
    await write;
    expect(await repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
    // A later idle resolves at once.
    expect(await broker.whenIdle(0)).toSucceedWith(true);
  });

  test('never takes the writer: a write queued while it waits runs before it resolves', async () => {
    const guard = new HoldingGuard();
    const timer = new ManualTimer();
    const { broker, policy } = await harness({ guard, timer });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    guard.holding = true;
    const first = track(writer, 'a');
    await settle();
    const order: string[] = [];
    const idle = broker.whenIdle(1000).then((r) => {
      order.push('idle');
      return r;
    });
    const second = track(writer, 'b').then((r) => {
      order.push('b');
      return r;
    });
    await settle();
    guard.release();
    await Promise.all([first, second, idle]);
    expect(order).toEqual(['b', 'idle']);
    // Two writes passed the guard; whenIdle passed it never.
    expect(guard.guarded).toBe(2);
  });

  test('a timer that fires synchronously settles at once, is cancelled, and leaves no waiter behind', async () => {
    const guard = new HoldingGuard();
    let cancelled = 0;
    const sync: TaskScheduleTimer = (fn) => {
      fn();
      return () => {
        cancelled++;
      };
    };
    const { env } = environment('s');
    const repository = (
      await FileTreeTaskRepository.initialize({
        root: memoryRoot(),
        mode: 'session',
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    const broker = TaskBroker.create({ repository, environment: env, writeGuard: guard, schedule: sync }).orThrow();
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: new TestPolicy() }).orThrow();
    guard.holding = true;
    const write = track(writer, 'a');
    await settle();
    expect(await broker.whenIdle(5)).toFailWithDetail(/still busy after 5 ms/, code('conflict'));
    expect(cancelled).toBe(1);
    guard.release();
    await write;
    expect(await broker.whenIdle(5)).toSucceedWith(true);
  });

  test('a schedule that throws, and an invalid timeout, are refused', async () => {
    const guard = new HoldingGuard();
    const { env } = environment('t');
    const repository = (
      await FileTreeTaskRepository.initialize({
        root: memoryRoot(),
        mode: 'session',
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    const broker = TaskBroker.create({
      repository,
      environment: env,
      writeGuard: guard,
      schedule: () => {
        throw new Error('no timers here');
      }
    }).orThrow();
    expect(await broker.whenIdle(-1)).toFailWithDetail(/non-negative safe integer/, code('invalid'));
    expect(await broker.whenIdle(1.5)).toFailWithDetail(/non-negative safe integer/, code('invalid'));
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: new TestPolicy() }).orThrow();
    guard.holding = true;
    const write = track(writer, 'a');
    await settle();
    expect(await broker.whenIdle(10)).toFailWithDetail(/schedule failed: no timers here/, code('invalid'));
    guard.release();
    await write;
  });
});

describe('TaskBroker.create writeGuard', () => {
  test('every gated section passes the guard: creation, commands, subscription, delivery and cleanup', async () => {
    const guard = new HoldingGuard();
    const { broker, policy } = await harness({ guard });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    await track(writer, 'a');
    expect(guard.guarded).toBe(1);
    const subscription = (
      await broker.subscribe(
        { principal: 'alice', scopes: [alpha], authorization: policy },
        {
          subscriptionId: 'sub',
          consumerId: 'c',
          operationId: op('sub'),
          selection: { scopes: [alpha], lifecycleClass: 'all' },
          start: 'current',
          policy: { categories: ['lifecycle'] }
        }
      )
    ).orThrow();
    expect(guard.guarded).toBe(2);
    const delivery = broker
      .bindDelivery({
        subscriptionId: subscription.id,
        consumerId: subscription.consumerId,
        principal: 'alice',
        scopes: [alpha],
        authorization: policy
      })
      .orThrow();
    expect(await delivery.prepare()).toSucceed();
    expect(guard.guarded).toBe(3);
    expect(await delivery.issued()).toSucceed();
    expect(guard.guarded).toBe(4);
    expect(await broker.cleanup({ limit: 10 })).toSucceed();
    expect(guard.guarded).toBeGreaterThanOrEqual(4);
    expect(guard.inside).toBe(guard.guarded);
  });

  test('a held section holds the queue: the 65th waiting write is refused as a conflict', async () => {
    const guard = new HoldingGuard();
    const { broker, policy } = await harness({ guard });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    guard.holding = true;
    const writes: Array<Promise<unknown>> = [];
    for (let i = 0; i < 64; i++) {
      writes.push(
        writer.createTracked({ taskId: tid(`t${i}`), operationId: op(`create-t${i}`), title: `t${i}` })
      );
    }
    await settle();
    expect(guard.held).toBe(1);
    expect(
      await writer.createTracked({ taskId: tid('over'), operationId: op('create-over'), title: 'over' })
    ).toFailWithDetail(/64 operations are already waiting/, code('conflict'));
    guard.release();
    await Promise.all(writes);
  });

  test('a guard that refuses without task detail is storage-unavailable, and nothing is written', async () => {
    const guard = new HoldingGuard();
    const { broker, policy, repository } = await harness({ guard });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    guard.refusing = 'writes are raised for a restore';
    const refused = await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    expect(refused).toFailWithDetail(/the write guard refused: writes are raised for a restore/, code('storage-unavailable'));
    expect(refused.detail?.retry).toBe('after-host-action');
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
    guard.refusing = undefined;
    expect(await writer.createTracked({ taskId: tid('a'), operationId: op('create-a2'), title: 'a' })).toSucceed();
  });

  test('a classified failure from inside the guarded section passes through unchanged', async () => {
    const guard = new HoldingGuard();
    const { broker, policy, repository } = await harness({ guard });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    policy.afterDecision = (request) => {
      if (request.action === 'create') {
        policy.epoch = 'epoch-2';
      }
    };
    expect(await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' })).toFailWithDetail(
      /authorization policy/i,
      code('conflict')
    );
    expect(guard.inside).toBe(1);
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
  });

  test('a guard that throws fails the section, and nothing is written', async () => {
    const guard = new HoldingGuard();
    const { broker, policy, repository } = await harness({ guard });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    guard.throwing = true;
    expect(await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' })).toFailWithDetail(
      /the write guard threw: gate offline/,
      code('invalid')
    );
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
  });
});
