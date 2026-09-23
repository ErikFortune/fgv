/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { ITaskRepository, Instant, SubscriptionId, TaskId } from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { IRepositoryInspection, inspectRepository } from '../../../packlets/storage/internals';
import { ICohort, seedRepository } from '../../helpers/cohorts';
import { ITaskShape, minutesAfter, scope, succeeded, waiting } from '../../helpers/queryFixtures';

/**
 * Query work as unrelated history grows — the performance gate, stated in counters.
 *
 * The matching set is fixed: twenty open tasks in scope A (fourteen pending, five waiting and
 * due, one waiting past the cutoff), ten of them owing subscription s1 one update each. Unrelated
 * history then grows through 0, 1,000 and 10,000 **in the same scope**, as three independent
 * cohorts: non-archived terminal tasks, archived terminal tasks (each a child of the first fixed
 * task), and waiting tasks due after the cutoff. Predictions were written in `state.md` before the
 * first run. Candidate visits are index entries read; task reads are task-record file reads.
 */

const A = scope('alpha');
const s1 = 's1' as SubscriptionId;
const cutoff = minutesAfter(60) as Instant;

function fixedSet(): Array<{ id: string; shape: ITaskShape }> {
  const fixed: Array<{ id: string; shape: ITaskShape }> = [];
  for (let i = 0; i < 20; i++) {
    const lifecycle = i < 14 ? undefined : i < 19 ? waiting(minutesAfter(i)) : waiting(minutesAfter(120));
    fixed.push({
      id: `fixed${String(i).padStart(2, '0')}`,
      shape: {
        scopes: [A],
        ...(lifecycle !== undefined ? { lifecycle } : {}),
        ...(i < 10 ? { audience: ['s1'] } : {})
      }
    });
  }
  return fixed;
}

type CohortKind = 'terminal' | 'archived' | 'future';

function cohort(kind: CohortKind, count: number): ICohort {
  switch (kind) {
    case 'terminal':
      return { prefix: 'term', count, shape: { scopes: [A], lifecycle: succeeded } };
    case 'archived':
      return { prefix: 'arch', count, shape: { scopes: [A], parentId: 'fixed00' }, archive: true };
    case 'future':
      return { prefix: 'late', count, shape: { scopes: [A], lifecycle: waiting(minutesAfter(24 * 60)) } };
  }
}

interface IWork {
  readonly visits: number;
  readonly taskReads: number;
  readonly items: number;
}

async function measure(repository: ITaskRepository, run: () => Promise<number>): Promise<IWork> {
  const inspection: IRepositoryInspection = inspectRepository(repository)!;
  const visits0: number = inspection.visits.candidateVisits;
  const reads0: number = inspection.reads.task;
  const items: number = await run();
  return {
    visits: inspection.visits.candidateVisits - visits0,
    taskReads: inspection.reads.task - reads0,
    items
  };
}

async function openQuery(repository: ITaskRepository): Promise<IWork> {
  return measure(
    repository,
    async () =>
      (await repository.query({ selection: { scopes: [A], lifecycleClass: 'open' } })).orThrow().items.length
  );
}

async function allQuery(repository: ITaskRepository): Promise<IWork> {
  return measure(
    repository,
    async () =>
      (await repository.query({ selection: { scopes: [A], lifecycleClass: 'all' }, limit: 200 })).orThrow()
        .items.length
  );
}

async function terminalQuery(repository: ITaskRepository): Promise<IWork> {
  return measure(
    repository,
    async () =>
      (await repository.query({ selection: { scopes: [A], lifecycleClass: 'terminal' } })).orThrow().items
        .length
  );
}

async function childQuery(repository: ITaskRepository): Promise<IWork> {
  return measure(
    repository,
    async () =>
      (
        await repository.query({
          selection: { scopes: [A], lifecycleClass: 'all', parentId: 'fixed00' as TaskId }
        })
      ).orThrow().items.length
  );
}

async function owedQuery(repository: ITaskRepository): Promise<IWork> {
  return measure(
    repository,
    async () => (await repository.listOwed({ subscription: s1 })).orThrow().updates.length
  );
}

async function dueQuery(repository: ITaskRepository): Promise<IWork> {
  return measure(
    repository,
    async () =>
      (await repository.queryDue({ selection: { scopes: [A], lifecycleClass: 'open' }, cutoff })).orThrow()
        .items.length
  );
}

const sizes: ReadonlyArray<number> = [0, 1000, 10000];
jest.setTimeout(180000);

describe.each<CohortKind>(['terminal', 'archived', 'future'])('unrelated %s history', (kind) => {
  const results: Map<number, { repository: ITaskRepository; seedReads: number }> = new Map();

  beforeAll(async () => {
    for (const size of sizes) {
      const { repository } = await seedRepository(fixedSet(), [cohort(kind, size)]);
      results.set(size, { repository, seedReads: inspectRepository(repository)!.reads.task });
    }
  });

  afterAll(() => {
    for (const { repository } of results.values()) {
      repository.close().orThrow();
    }
  });

  test.each(sizes)(
    'at %i: warm open, owed and due work is the fixed set, with no task read',
    async (size) => {
      const { repository } = results.get(size)!;
      if (kind !== 'future') {
        // (Future-dated waiting tasks are open work, so they are not unrelated to an open query.)
        expect(await openQuery(repository)).toEqual({ visits: 20, taskReads: 0, items: 20 });
      }
      expect(await owedQuery(repository)).toEqual({ visits: 10, taskReads: 0, items: 10 });
      // Five due, plus the one key past the cutoff that stops the scan — whatever lies beyond it.
      expect(await dueQuery(repository)).toEqual({ visits: 6, taskReads: 0, items: 5 });
    }
  );

  if (kind === 'archived') {
    test.each(sizes)(
      'at %i archived: terminal, all and child queries never visit archived tasks',
      async (size) => {
        const { repository } = results.get(size)!;
        expect(await terminalQuery(repository)).toEqual({ visits: 0, taskReads: 0, items: 0 });
        expect(await allQuery(repository)).toEqual({ visits: 20, taskReads: 0, items: 20 });
        expect(await childQuery(repository)).toEqual({ visits: 0, taskReads: 0, items: 0 });
      }
    );

    test.each(sizes)('at %i archived: the resident shape is the minimal projection', async (size) => {
      const { repository } = results.get(size)!;
      const inspection = inspectRepository(repository)!;
      const index = inspection.index!;
      // Full summaries exactly for the resolved non-archived tasks.
      expect(index.summaries.size).toBe(20);
      expect(inspection.projections.size).toBe(20 + size);
      expect(index.size).toBe(20 + size);
      // Graph edges and adjacency survive archive; no active child membership does.
      expect(index.children.get('fixed00' as TaskId)?.size ?? 0).toBe(size);
      expect(index.activeChildren.get('fixed00' as TaskId)).toBeUndefined();
      expect(index.sources.size).toBe(0);
      expect(index.owedPayloads.size).toBe(10);
      if (size > 0) {
        const id = 'arch00001' as TaskId;
        expect(index.summaries.has(id)).toBe(false);
        expect(index.membershipsOf(id)).toEqual({
          category: 'archived',
          parentId: 'fixed00',
          status: 'succeeded'
        });
        expect(Object.keys(inspection.projections.get(id)!).sort()).toEqual([
          'archived',
          'detailVersion',
          'fingerprint',
          'id',
          'kind',
          'known',
          'parentId',
          'recordRevision',
          'recordType',
          'revision',
          'status'
        ]);
      }
      // No per-scope set holds an archived task.
      const scoped: number = [...index.byScopeStatus.values()].reduce(
        (n, statuses) => n + [...statuses.values()].reduce((m, set) => m + set.size, 0),
        0
      );
      expect(scoped).toBe(20);
    });
  }

  if (kind === 'terminal') {
    test.each(sizes)('at %i terminal: non-archived terminal tasks stay fully represented', async (size) => {
      const { repository } = results.get(size)!;
      const index = inspectRepository(repository)!.index!;
      expect(index.summaries.size).toBe(20 + size);
      // A terminal query intentionally enumerates what it asked for.
      const terminal = await measure(
        repository,
        async () =>
          (
            await repository.query({ selection: { scopes: [A], lifecycleClass: 'terminal' }, limit: 200 })
          ).orThrow().items.length
      );
      // A full page examines one candidate past it (the one that says there is more), and each
      // stream holds one key of lookahead: 200 + 2 when the page stops early.
      expect(terminal).toEqual({
        visits: size > 200 ? 202 : size,
        taskReads: 0,
        items: Math.min(size, 200)
      });
    });
  }

  test.each(sizes)('at %i: open read every record once; rebuild re-reads only owed records', async (size) => {
    const { repository, seedReads } = results.get(size)!;
    const total: number = 20 + size;
    const opened = inspectRepository(repository)!.evidence;
    expect(opened).toEqual(
      expect.objectContaining({
        taskPassReads: total,
        selectedPassReads: 10,
        graphMarks: total,
        owedDescriptors: 10
      })
    );
    expect(seedReads).toBe(total + 10);
    (await repository.rebuildIndexes()).orThrow();
    const inspection = inspectRepository(repository)!;
    expect(inspection.evidence).toEqual(
      expect.objectContaining({ taskPassReads: total, selectedPassReads: 10, graphMarks: total })
    );
    expect(inspection.gate.highWater).toBe(1);
  });
});
