/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { AsyncControl } from '@fgv/ts-extras';
import { Result, fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  ITaskFailure,
  ITaskRepository,
  ITaskRepositoryWriter,
  ITaskWriteGuard,
  OperationId,
  TaskBroker,
  TaskId,
  TaskResult
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { BrokerCore } from '../../../packlets/broker/core';
import { IBrokerHarness, alpha, brokerHarness, op, tid } from '../../helpers/brokerFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });

/** A broker over `h`'s repository with `guard`, optionally replacing the repository's `withWriter`. */
function brokerWith(
  h: IBrokerHarness,
  guard: ITaskWriteGuard,
  withWriter?: (real: ITaskRepository) => ITaskRepository['withWriter']
): TaskBroker {
  const real: ITaskRepository = h.repository;
  const repository: ITaskRepository =
    withWriter === undefined ? real : Object.assign(Object.create(real), { withWriter: withWriter(real) });
  return TaskBroker.create({ repository, environment: h.env, writeGuard: guard }).orThrow();
}

/** A repository writer that commits the section, then rejects as if the acknowledgement were lost. */
const commitsThenRejects =
  (real: ITaskRepository): ITaskRepository['withWriter'] =>
  async <T>(action: (w: ITaskRepositoryWriter) => Promise<TaskResult<T>>): Promise<TaskResult<T>> => {
    await real.withWriter(action);
    throw new Error('lost ack');
  };

function create(broker: TaskBroker, h: IBrokerHarness, id: string): Promise<TaskResult<unknown>> {
  return broker
    .bind({ principal: 'alice', scopes: [alpha], authorization: h.policy })
    .orThrow()
    .createTracked({ taskId: tid(id), operationId: op(`create-${id}`), title: id });
}

describe('write guard robustness', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('a guard that answers success without running the section', () => {
    // The guard breaks the loop itself after a few calls, so a regression is a red assertion
    // rather than a process that never returns: the recursion is pure microtasks, which no test
    // timeout can interrupt.
    test('is refused invalid on its first answer, without a retry loop', async () => {
      let calls = 0;
      const fabricating: ITaskWriteGuard = {
        guard: async <T>(): Promise<Result<T>> =>
          ++calls > 5 ? fail('runaway') : succeed(undefined as unknown as T)
      };
      const result = await create(brokerWith(h, fabricating), h, 'a');
      expect(result).toFailWithDetail(/answered success without running the section/, code('invalid'));
      expect(calls).toBe(1);
      expect(await h.repository.read(tid('a'))).toSucceedWith(undefined);
    }, 2000);

    test('creation and registration bound their own retry even if the guard classification regressed', async () => {
      // Stands in for a `_guarded` that passed a fabricated success through: every section answers
      // "nothing to report". It breaks the loop itself after a few calls, so a missing bound is a red
      // assertion rather than a hang.
      let calls = 0;
      jest
        .spyOn(BrokerCore.prototype, 'gated')
        .mockImplementation(
          async <T>(): Promise<TaskResult<T>> =>
            ++calls > 10
              ? failWithDetail<T, ITaskFailure>('runaway', { code: 'invalid', retry: 'safe' })
              : succeedWithDetail<T, ITaskFailure>(undefined as unknown as T)
        );
      expect(await create(h.broker, h, 'a')).toFailWithDetail(
        /creation retried and still found nothing to report/,
        code('invalid')
      );
      expect(
        await h.broker.registerExternal('host', {
          taskId: 'v' as TaskId,
          operationId: 'reg-v' as OperationId,
          kind: 'acme.job',
          detailVersion: 1,
          title: 'vendor v',
          scopes: [alpha],
          binding: { sourceId: 'acme', referenceVersion: 1, reference: { job: 'v' } },
          recovery: 'reattach'
        })
      ).toFailWithDetail(/registration retried and still found nothing to report/, code('invalid'));
      // Two sections each: the first attempt and the one bounded retry.
      expect(calls).toBe(4);
    });
  });

  describe('a section that ran and then rejected', () => {
    test('through a real WriteGate, is reconcile-first and not "nothing was written"', async () => {
      const gate = AsyncControl.WriteGate.create().orThrow();
      const result = await create(brokerWith(h, gate, commitsThenRejects), h, 'a');
      expect(result).toFailWithDetail(
        /after the section ran \(its own outcome: rejected: lost ack\)/,
        code('storage-unavailable')
      );
      expect(result.detail?.retry).toBe('reconcile-first');
      expect(gate.inFlight).toBe(0);
      // It did commit.
      expect(await h.repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
    });

    test('behind a guard that swallows the rejection and forges a classified refusal, is still reconcile-first', async () => {
      const forging: ITaskWriteGuard = {
        guard: async <T>(write: () => Promise<TaskResult<T>>): Promise<Result<T>> => {
          await write().catch(() => undefined);
          return failWithDetail<T, ITaskFailure>('nothing to see', { code: 'conflict', retry: 'safe' });
        }
      };
      const result = await create(brokerWith(h, forging, commitsThenRejects), h, 'a');
      expect(result).toFailWithDetail(
        /failed: nothing to see after the section ran/,
        code('storage-unavailable')
      );
      expect(result.detail?.retry).toBe('reconcile-first');
      expect(await h.repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
    });

    test('behind a guard that swallows the rejection and answers success, is reconcile-first', async () => {
      const swallowing: ITaskWriteGuard = {
        guard: async <T>(write: () => Promise<TaskResult<T>>): Promise<Result<T>> => {
          await write().catch(() => undefined);
          return succeed(undefined as unknown as T);
        }
      };
      const result = await create(brokerWith(h, swallowing, commitsThenRejects), h, 'a');
      expect(result).toFailWithDetail(/answered success after the section ran/, code('storage-unavailable'));
      expect(result.detail?.retry).toBe('reconcile-first');
    });
  });

  describe('a repository whose withWriter throws synchronously', () => {
    const throwsSync = (): ITaskRepository['withWriter'] => (): never => {
      throw new Error('sync boom');
    };

    test('through a real WriteGate, reports the throw as the section rejecting', async () => {
      const gate = AsyncControl.WriteGate.create().orThrow();
      const result = await create(brokerWith(h, gate, throwsSync), h, 'a');
      expect(result).toFailWithDetail(/its own outcome: rejected: sync boom/, code('storage-unavailable'));
      expect(result.detail?.retry).toBe('reconcile-first');
      expect(gate.inFlight).toBe(0);
    });

    test('through a pass-through guard, reports the throw rather than "rejected: undefined"', async () => {
      const passThrough: ITaskWriteGuard = {
        guard: <T>(write: () => Promise<TaskResult<T>>): PromiseLike<Result<T>> => write()
      };
      const result = await create(brokerWith(h, passThrough, throwsSync), h, 'a');
      expect(result).toFailWithDetail(
        /threw: sync boom after the section ran \(its own outcome: rejected: sync boom\)/,
        code('storage-unavailable')
      );
      expect(result.detail?.retry).toBe('reconcile-first');
    });
  });

  describe('a guard that answers something that is not a Result', () => {
    test('after running the section is reconcile-first', async () => {
      const odd: ITaskWriteGuard = {
        guard: async <T>(write: () => Promise<TaskResult<T>>): Promise<Result<T>> => {
          await write();
          return 42 as unknown as Result<T>;
        }
      };
      const result = await create(brokerWith(h, odd), h, 'a');
      expect(result).toFailWithDetail(
        /answered something that is not a Result after the section ran \(its own outcome: success\)/,
        code('storage-unavailable')
      );
      expect(result.detail?.retry).toBe('reconcile-first');
    });

    test('without running the section is invalid, and nothing is written', async () => {
      const odd: ITaskWriteGuard = {
        guard: async <T>(): Promise<Result<T>> => 42 as unknown as Result<T>
      };
      expect(await create(brokerWith(h, odd), h, 'a')).toFailWithDetail(
        /answered something that is not a Result without running the section/,
        code('invalid')
      );
      expect(await h.repository.read(tid('a'))).toSucceedWith(undefined);
    });
  });

  test('a section started after the answer settled, but before the broker observed it, is awaited and reconcile-first', async () => {
    const late: ITaskWriteGuard = {
      guard: <T>(write: () => Promise<TaskResult<T>>): PromiseLike<Result<T>> => {
        const answer: Promise<Result<T>> = Promise.resolve(fail<T>('gate closed'));
        // Registered first, so it runs as soon as the answer settles — ahead of the broker.
        answer.then(
          () => write(),
          () => undefined
        );
        return answer;
      }
    };
    const result = await create(brokerWith(h, late), h, 'a');
    expect(result).toFailWithDetail(/failed: gate closed after the section ran/, code('storage-unavailable'));
    expect(result.detail?.retry).toBe('reconcile-first');
    expect(await h.repository.read(tid('a'))).toSucceedAndSatisfy((r) => expect(r?.state).toBe('resolved'));
    expect(await h.broker.whenIdle(0)).toSucceedWith(true);
  });

  test('a refusal from another copy of ts-utils keeps its classification: the check is structural', async () => {
    // A failure that is not an instance of this copy's DetailedFailure, as a second installed copy
    // of ts-utils would produce. Shaped by hand on purpose: that is the case under test.
    const foreignFailure = {
      isSuccess: (): boolean => false,
      isFailure: (): boolean => true,
      message: 'held for a snapshot',
      detail: { code: 'conflict', retry: 'safe' }
    };
    const foreign: ITaskWriteGuard = {
      guard: async <T>(): Promise<Result<T>> => foreignFailure as unknown as Result<T>
    };
    expect(await create(brokerWith(h, foreign), h, 'a')).toFailWithDetail(
      /held for a snapshot/,
      code('conflict')
    );
    expect(await h.repository.read(tid('a'))).toSucceedWith(undefined);
  });
});
