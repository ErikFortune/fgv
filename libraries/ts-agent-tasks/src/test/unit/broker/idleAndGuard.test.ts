/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { fail, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskFailure,
  ITaskRepository,
  ITaskWriteGuard,
  TaskBroker,
  TaskResult,
  TaskScheduleTimer,
  allUpdateCategories
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
  public completed: number = 0;
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
    const result = await write();
    this.completed++;
    return result;
  }

  public hold(): void {
    this.holding = true;
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

async function harness(options?: {
  readonly guard?: ITaskWriteGuard;
  readonly timer?: ManualTimer;
}): Promise<{
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
    guard.hold();
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
    guard.hold();
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
    guard.hold();
    const first = track(writer, 'a');
    await settle();
    const atIdle: { completed?: number } = {};
    const idle = broker.whenIdle(1000).then((r) => {
      atIdle.completed = guard.completed;
      return r;
    });
    // Enqueued after the wait began: the wait does not stand in front of it.
    const second = track(writer, 'b');
    await settle();
    guard.release();
    await Promise.all([first, second, idle]);
    expect(await idle).toSucceedWith(true);
    // Idle was reached only once both writes had finished.
    expect(atIdle.completed).toBe(2);
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
    const broker = TaskBroker.create({
      repository,
      environment: env,
      writeGuard: guard,
      schedule: sync
    }).orThrow();
    const writer = broker
      .bind({ principal: 'alice', scopes: [alpha], authorization: new TestPolicy() })
      .orThrow();
    guard.hold();
    const write = track(writer, 'a');
    await settle();
    expect(await broker.whenIdle(5)).toFailWithDetail(/still busy after 5 ms/, code('conflict'));
    expect(cancelled).toBe(1);
    guard.release();
    await write;
    expect(await broker.whenIdle(5)).toSucceedWith(true);
  });

  test('by default the bound is a real timer: fake timers drive it to a timeout, and an idle cancels it', async () => {
    const guard = new HoldingGuard();
    const { broker, policy } = await harness({ guard });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    jest.useFakeTimers();
    try {
      guard.hold();
      const write = track(writer, 'a');
      await settle();
      const timedOut = broker.whenIdle(10);
      jest.advanceTimersByTime(10);
      expect(await timedOut).toFailWithDetail(/still busy after 10 ms/, code('conflict'));
      const idle = broker.whenIdle(1000);
      expect(jest.getTimerCount()).toBe(1);
      guard.release();
      await write;
      expect(await idle).toSucceedWith(true);
      // The idle cancelled its timer.
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  test('a timer whose cancel throws neither breaks the writer queue nor leaves whenIdle unsettled', async () => {
    const guard = new HoldingGuard();
    const { env } = environment('c');
    const repository = (
      await FileTreeTaskRepository.initialize({
        root: memoryRoot(),
        mode: 'session',
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    const throwingCancel: TaskScheduleTimer = () => () => {
      throw new Error('cancel boom');
    };
    const broker = TaskBroker.create({
      repository,
      environment: env,
      writeGuard: guard,
      schedule: throwingCancel
    }).orThrow();
    const writer = broker
      .bind({ principal: 'alice', scopes: [alpha], authorization: new TestPolicy() })
      .orThrow();
    guard.hold();
    const first = writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    await settle();
    const idle = broker.whenIdle(1000);
    guard.release();
    expect(await first).toSucceed();
    expect(await idle).toSucceedWith(true);
    // The queue still runs every later section.
    expect(
      await writer.createTracked({ taskId: tid('b'), operationId: op('create-b'), title: 'b' })
    ).toSucceed();
    // A timer that fires synchronously and whose cancel throws settles at once, too.
    const syncThrowing: TaskScheduleTimer = (fn) => {
      fn();
      return () => {
        throw new Error('cancel boom');
      };
    };
    const syncBroker = TaskBroker.create({
      repository,
      environment: env,
      writeGuard: guard,
      schedule: syncThrowing
    }).orThrow();
    const syncWriter = syncBroker
      .bind({ principal: 'alice', scopes: [alpha], authorization: new TestPolicy() })
      .orThrow();
    guard.hold();
    const held = syncWriter.createTracked({ taskId: tid('c'), operationId: op('create-c'), title: 'c' });
    await settle();
    expect(await syncBroker.whenIdle(5)).toFailWithDetail(/still busy after 5 ms/, code('conflict'));
    guard.release();
    expect(await held).toSucceed();
    expect(
      await syncWriter.createTracked({ taskId: tid('d'), operationId: op('create-d'), title: 'd' })
    ).toSucceed();
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
    const writer = broker
      .bind({ principal: 'alice', scopes: [alpha], authorization: new TestPolicy() })
      .orThrow();
    guard.hold();
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
          policy: { categories: [...allUpdateCategories].sort() }
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
    guard.hold();
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
    expect(refused).toFailWithDetail(
      /the write guard refused: writes are raised for a restore/,
      code('storage-unavailable')
    );
    expect(refused.detail?.retry).toBe('after-host-action');
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
    guard.refusing = undefined;
    expect(
      await writer.createTracked({ taskId: tid('a'), operationId: op('create-a2'), title: 'a' })
    ).toSucceed();
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
    expect(
      await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' })
    ).toFailWithDetail(/authorization policy/i, code('conflict'));
    expect(guard.inside).toBe(1);
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
  });

  test('a guard that fails or throws after running the section reports reconcile-first, not "nothing written"', async () => {
    const mode: { after: 'fail' | 'throw' } = { after: 'fail' };
    const late: ITaskWriteGuard = {
      guard: async <T>(write: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> => {
        await write();
        if (mode.after === 'throw') {
          throw new Error('boom');
        }
        return fail('gate closed late') as unknown as TaskResult<T>;
      }
    };
    const { broker, policy, repository } = await harness({ guard: late });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    const failed = await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    expect(failed).toFailWithDetail(
      /failed: gate closed late after the section ran/,
      code('storage-unavailable')
    );
    expect(failed.detail?.retry).toBe('reconcile-first');
    expect(await repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
    mode.after = 'throw';
    const threw = await writer.createTracked({ taskId: tid('b'), operationId: op('create-b'), title: 'b' });
    expect(threw).toFailWithDetail(/threw: boom after the section ran/, code('storage-unavailable'));
    expect(threw.detail?.retry).toBe('reconcile-first');
    expect(await repository.read(tid('b'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
  });

  test('a guard that fails after a section that itself failed reports both, reconcile-first', async () => {
    const late: ITaskWriteGuard = {
      guard: async <T>(write: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> => {
        await write();
        return fail('gate closed late') as unknown as TaskResult<T>;
      }
    };
    const { broker, policy } = await harness({ guard: late });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    policy.afterDecision = (request) => {
      if (request.action === 'create') {
        policy.epoch = 'epoch-2';
      }
    };
    const both = await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    expect(both).toFailWithDetail(
      /gate closed late after the section ran \(its own outcome: .*authorization policy/i,
      code('storage-unavailable')
    );
    expect(both.detail?.retry).toBe('reconcile-first');
  });

  test('a guard that refuses with a classified failure, without running the section, keeps its classification', async () => {
    const refusing: ITaskWriteGuard = {
      guard: async <T>(): Promise<TaskResult<T>> =>
        failWithDetail<T, ITaskFailure>('held for a snapshot', { code: 'conflict', retry: 'safe' })
    };
    const { broker, policy, repository } = await harness({ guard: refusing });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    expect(
      await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' })
    ).toFailWithDetail(/held for a snapshot/, code('conflict'));
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
  });

  test('a guard that starts the section without awaiting it: the turn waits, and the outcome is reconcile-first', async () => {
    const unawaited: ITaskWriteGuard = {
      guard: async <T>(write: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> => {
        // Started and deliberately not awaited.
        write().then(
          () => undefined,
          () => undefined
        );
        return fail('gate closed') as unknown as TaskResult<T>;
      }
    };
    const { broker, policy, repository } = await harness({ guard: unawaited });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    const result = await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' });
    expect(result).toFailWithDetail(/failed: gate closed after the section ran/, code('storage-unavailable'));
    expect(result.detail?.retry).toBe('reconcile-first');
    expect(await repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
    // The section finished inside the turn: the writer is free for the next one.
    expect(await broker.whenIdle(0)).toSucceedWith(true);
    expect(
      await repository.withWriter(async () =>
        (await repository.read(tid('a'))).onSuccess(() => succeedWithDetail<boolean, ITaskFailure>(true))
      )
    ).toSucceed();
  });

  test('a guard that runs the section twice gets the second call refused, unrun', async () => {
    const seconds: Array<TaskResult<unknown>> = [];
    const twice: ITaskWriteGuard = {
      guard: async <T>(write: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> => {
        const first = await write();
        seconds.push(await write());
        return first;
      }
    };
    const { broker, policy, repository } = await harness({ guard: twice });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    expect(
      await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' })
    ).toSucceed();
    expect(seconds[0]).toFailWithDetail(/ran the section more than once/, code('invalid'));
    expect(await repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
  });

  test('a guard that throws fails the section, and nothing is written', async () => {
    const guard = new HoldingGuard();
    const { broker, policy, repository } = await harness({ guard });
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
    guard.throwing = true;
    expect(
      await writer.createTracked({ taskId: tid('a'), operationId: op('create-a'), title: 'a' })
    ).toFailWithDetail(/the write guard threw: gate offline/, code('invalid'));
    expect(await repository.read(tid('a'))).toSucceedWith(undefined);
  });
});
