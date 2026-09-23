/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { fail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskRepository,
  ITaskRepositoryConformanceReport,
  TaskResult,
  runTaskRepositoryConformance
} from '../../../index';
import { memoryRoot, nodeRoot, params } from '../../helpers/storageFixtures';

describe('the repository conformance suite', () => {
  test('the FileTree repository passes it over an in-memory root', async () => {
    expect(
      await runTaskRepositoryConformance(() =>
        FileTreeTaskRepository.initialize(params(memoryRoot(), 'session'))
      )
    ).toSucceedAndSatisfy((report: ITaskRepositoryConformanceReport) => {
      expect(report.checks.length).toBeGreaterThanOrEqual(9);
      expect(report.checks.every((c) => c.passed)).toBe(true);
    });
  });

  test('the FileTree repository passes it durably over a real Node root', async () => {
    expect(
      await runTaskRepositoryConformance(() =>
        FileTreeTaskRepository.initialize(params(nodeRoot().root, { durable: 'process-crash' }))
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
