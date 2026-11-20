/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskFailure,
  ITaskRepository,
  ITaskRepositoryConformanceReport,
  TaskResult,
  runTaskRepositoryConformance
} from '../../../index';
import { brokerRegistry } from '../../helpers/brokerFixtures';
import { memoryRoot, nodeRoot, params } from '../../helpers/storageFixtures';

describe('the repository conformance suite', () => {
  test('the FileTree repository passes it over an in-memory root', async () => {
    expect(
      await runTaskRepositoryConformance(() =>
        FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { registry: brokerRegistry() }))
      )
    ).toSucceedAndSatisfy((report: ITaskRepositoryConformanceReport) => {
      expect(report.checks.length).toBeGreaterThanOrEqual(11);
      expect(report.checks.every((c) => c.passed)).toBe(true);
    });
  });

  test('the FileTree repository passes it durably over a real Node root', async () => {
    expect(
      await runTaskRepositoryConformance(() =>
        FileTreeTaskRepository.initialize(
          params(nodeRoot().root, { durable: 'process-crash' }, { registry: brokerRegistry() })
        )
      )
    ).toSucceed();
  });

  test('a factory that fails fails every check, by name', async () => {
    expect(
      await runTaskRepositoryConformance(
        async () => fail('no storage') as unknown as TaskResult<ITaskRepository>
      )
    ).toFailWith(/scopes are a union.*factory: no storage/i);
  });

  test('a repository that answers wrongly is caught, and one that throws is a failure, not a crash', async () => {
    // An implementation that forgets to deduplicate scope unions, and one whose query throws.
    const wrapped = async (
      mutate: (r: ITaskRepository) => ITaskRepository
    ): Promise<TaskResult<ITaskRepository>> =>
      (await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session'))).onSuccess(
        (r) => succeed(mutate(r)) as unknown as TaskResult<ITaskRepository>
      );
    const duplicating = (r: ITaskRepository): ITaskRepository =>
      Object.assign(Object.create(r), {
        query: async (q: Parameters<ITaskRepository['query']>[0]) =>
          (await r.query(q)).onSuccess((page) =>
            succeedWithDetail({ ...page, items: [...page.items, ...page.items] })
          )
      });
    expect(await runTaskRepositoryConformance(() => wrapped(duplicating))).toFailWith(
      /scopes are a union.*expected \[t1, t2, t3\], got \[t1, t2, t3, t1, t2, t3\]/i
    );
    const throwing = (r: ITaskRepository): ITaskRepository =>
      Object.assign(Object.create(r), {
        rebuildIndexes: async () => {
          throw new Error('boom');
        }
      });
    expect(await runTaskRepositoryConformance(() => wrapped(throwing))).toFailWith(/rebuild.*boom/i);
  });
});

describe('conformance checks catch a misbehaving repository', () => {
  const base = async (): Promise<ITaskRepository> =>
    (
      await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { registry: brokerRegistry() }))
    ).orThrow();
  const failing = <T>(message: string): Promise<TaskResult<T>> =>
    Promise.resolve(failWithDetail<T, ITaskFailure>(message, { code: 'invalid', retry: 'safe' }));

  const broken =
    (patch: (r: ITaskRepository) => object): (() => Promise<TaskResult<ITaskRepository>>) =>
    async (): Promise<TaskResult<ITaskRepository>> => {
      const r = await base();
      return succeedWithDetail(Object.assign(Object.create(r), patch(r)));
    };

  test('one whose writer refuses everything', async () => {
    expect(
      await runTaskRepositoryConformance(broken(() => ({ withWriter: () => failing('read-only') })))
    ).toFailWith(/paging returns every task.*read-only/i);
  });

  test('one whose queries fail', async () => {
    const result = await runTaskRepositoryConformance(broken(() => ({ query: () => failing('no index') })));
    expect(result).toFailWith(/paging returns every task.*no index/i);
    expect(result).toFailWith(/cursor is refused.*no index/i);
    expect(result).toFailWith(/a rebuild answers.*no index/i);
  });

  test('one that loses records, or whose rebuild does not advance', async () => {
    expect(
      await runTaskRepositoryConformance(
        broken(() => ({ readCommit: async () => succeedWithDetail(undefined) }))
      )
    ).toFailWith(/owed updates stay listed.*no resolved record to change/i);
    expect(
      await runTaskRepositoryConformance(
        broken(() => ({
          rebuildIndexes: async () => succeedWithDetail({ state: 'ready', generation: 0, issues: [] })
        }))
      )
    ).toFailWith(/a rebuild answers.*generation 0/i);
    expect(
      await runTaskRepositoryConformance(broken(() => ({ rebuildIndexes: () => failing('cannot rebuild') })))
    ).toFailWith(/a rebuild answers.*cannot rebuild/i);
  });

  test('one whose cursors misbehave, whose archive loses identity, or whose failures are unclassified', async () => {
    const ignoresCursor = await runTaskRepositoryConformance(
      broken((r) => ({
        query: async (q: Parameters<ITaskRepository['query']>[0]) =>
          (
            await r.query({ ...q, cursor: undefined })
          ).onSuccess((page) => succeedWithDetail({ ...page, nextCursor: 'forever.1' }))
      }))
    );
    expect(ignoresCursor).toFailWith(/a cursor after the last task/i);
    expect(ignoresCursor).toFailWith(/different query: expected a 'invalid' failure, got success/i);

    expect(
      await runTaskRepositoryConformance(
        broken((r) => ({
          query: (q: Parameters<ITaskRepository['query']>[0]) =>
            q.cursor !== undefined ? Promise.resolve(fail('unclassified')) : r.query(q)
        }))
      )
    ).toFailWith(/different query: expected a 'invalid' failure, got undefined/i);

    // Every cursor refused as a different query: right for one check, wrong for the stale one.
    expect(
      await runTaskRepositoryConformance(
        broken((r) => ({
          query: (q: Parameters<ITaskRepository['query']>[0]) =>
            q.cursor !== undefined ? failing('always a different query') : r.query(q)
        }))
      )
    ).toFailWith(/after a change: expected a 'cursor-stale' failure, got invalid/i);

    expect(
      await runTaskRepositoryConformance(broken(() => ({ read: async () => succeedWithDetail(undefined) })))
    ).toFailWith(/not readable as archived/i);
    expect(
      await runTaskRepositoryConformance(
        broken(() => ({ lookupSource: async () => succeedWithDetail('someone-else') }))
      )
    ).toFailWith(/source lookup found someone-else/i);
  });

  test('one whose graph reads drop children or candidates', async () => {
    expect(
      await runTaskRepositoryConformance(broken(() => ({ childStates: async () => succeedWithDetail([]) })))
    ).toFailWith(/childStates lists every retained child.*children: expected/i);
    expect(
      await runTaskRepositoryConformance(
        broken((r) => ({
          childStates: async (id: Parameters<ITaskRepository['childStates']>[0]) =>
            id === 'none' ? succeedWithDetail([]) : r.childStates(id)
        }))
      )
    ).toFailWith(/an unknown parent: expected a 'not-found-or-denied' failure, got success/i);
    expect(
      await runTaskRepositoryConformance(
        broken(() => ({ listCompletionCandidates: async () => succeedWithDetail([]) }))
      )
    ).toFailWith(/list-completion candidates.*candidates: expected \[auto\], got \[\]/i);
  });

  test('one that will not close after a check', async () => {
    expect(
      await runTaskRepositoryConformance(broken(() => ({ close: () => fail('still busy') })))
    ).toFailWith(/scopes are a union.*close after the check failed: still busy/i);
  });

  test('a failed check still closes its repository, and a close failure never masks the reason', async () => {
    let closes = 0;
    const result = await runTaskRepositoryConformance(
      broken((r) => ({
        query: () => failing('no index'),
        close: () => {
          closes++;
          return r.close().onSuccess(() => fail('also would not close'));
        }
      }))
    );
    // Every check ran against its own repository, and every one was closed.
    expect(closes).toBe(13);
    expect(result).toFailWith(/scopes are a union.*: no index/i);
    // The check's own failure is what is reported, not the close.
    expect(result).not.toFailWith(/scopes are a union[^;]*also would not close/i);
  });
});
