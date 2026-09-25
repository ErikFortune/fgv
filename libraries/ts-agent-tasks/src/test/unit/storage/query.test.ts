/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  IDueTaskQuery,
  ITaskPage,
  ITaskQuery,
  ITaskRepository,
  ITaskSelection,
  PageCursor,
  SubscriptionId,
  TaskId
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';
import {
  addTask,
  binding,
  change,
  finishAndArchive,
  ids,
  minutesAfter,
  person,
  scope,
  shapedRegistration,
  subscribeTo,
  succeeded,
  waiting
} from '../../helpers/queryFixtures';
import { memoryRoot, params, sessionRepository, unresolvedRegistration } from '../../helpers/storageFixtures';

const A = scope('alpha');
const B = scope('beta');
const C = scope('gamma');

function select(extra: Partial<ITaskSelection> = {}): ITaskSelection {
  return { scopes: [A], lifecycleClass: 'all', ...extra };
}

async function page(repository: ITaskRepository, query: ITaskQuery): Promise<ITaskPage> {
  return (await repository.query(query)).orThrow();
}

/** Follows cursors to the end, returning every page. */
async function allPages(repository: ITaskRepository, query: ITaskQuery): Promise<ITaskPage[]> {
  const pages: ITaskPage[] = [];
  let cursor: PageCursor | undefined = undefined;
  do {
    const next: ITaskPage = await page(repository, { ...query, ...(cursor !== undefined ? { cursor } : {}) });
    pages.push(next);
    cursor = next.nextCursor;
  } while (cursor !== undefined);
  return pages;
}

function taskReads(repository: ITaskRepository): number {
  return inspectRepository(repository)!.reads.task;
}

describe('selection', () => {
  let repository: ITaskRepository;

  beforeEach(async () => {
    repository = (await sessionRepository()).repository;
    await addTask(repository, 'a1', { scopes: [A] });
    await addTask(repository, 'ab', { scopes: [A, B] });
    await addTask(repository, 'b1', { scopes: [B], lifecycle: { status: 'running' } });
    await addTask(repository, 'c1', { scopes: [C], lifecycle: succeeded });
    await addTask(repository, 'a2', { scopes: [A], lifecycle: succeeded });
  });

  test('scopes are a union, deduplicated by task before paging', async () => {
    const result = await page(repository, { selection: select({ scopes: [A, B] }), limit: 3 });
    // 'ab' is in both scopes and appears once; the page holds three distinct tasks.
    expect(ids(result.items)).toEqual(['a1', 'a2', 'ab']);
    const rest = await page(repository, {
      selection: select({ scopes: [A, B] }),
      limit: 3,
      cursor: result.nextCursor
    });
    expect(ids(rest.items)).toEqual(['b1']);
    expect(rest.nextCursor).toBeUndefined();
  });

  test('duplicate and reordered scopes normalize to the same query', async () => {
    const first = await page(repository, { selection: select({ scopes: [B, A, B] }), limit: 1 });
    // A cursor from one spelling continues the other: the descriptor is the normalized query.
    const second = await page(repository, {
      selection: select({ scopes: [A, B] }),
      limit: 1,
      cursor: first.nextCursor
    });
    expect(ids(first.items)).toEqual(['a1']);
    expect(ids(second.items)).toEqual(['a2']);
  });

  test('an empty scope list matches nothing — never implicit global access', async () => {
    expect(await repository.query({ selection: select({ scopes: [] }) })).toSucceedAndSatisfy((p) => {
      expect(p.items).toEqual([]);
      expect(p.nextCursor).toBeUndefined();
      expect(p.completeness).toBe('complete');
    });
  });

  test('lifecycle class and exact statuses', async () => {
    const scopes = [A, B, C];
    expect(ids((await page(repository, { selection: { scopes, lifecycleClass: 'open' } })).items)).toEqual([
      'a1',
      'ab',
      'b1'
    ]);
    expect(
      ids((await page(repository, { selection: { scopes, lifecycleClass: 'terminal' } })).items)
    ).toEqual(['a2', 'c1']);
    expect(
      ids(
        (await page(repository, { selection: { scopes, lifecycleClass: 'open', statuses: ['running'] } }))
          .items
      )
    ).toEqual(['b1']);
    expect(
      ids(
        (
          await page(repository, {
            selection: { scopes, lifecycleClass: 'all', statuses: ['succeeded', 'pending'] }
          })
        ).items
      )
    ).toEqual(['a1', 'a2', 'ab', 'c1']);
    // An explicit empty status list matches no task.
    expect(
      (await page(repository, { selection: { scopes, lifecycleClass: 'all', statuses: [] } })).items
    ).toEqual([]);
  });

  test('a status outside its class is refused, not answered with an empty page', async () => {
    expect(
      await repository.query({ selection: { scopes: [A], lifecycleClass: 'open', statuses: ['succeeded'] } })
    ).toFailWithDetail(/not in lifecycle class 'open'/i, expect.objectContaining({ code: 'invalid' }));
    expect(
      await repository.query({
        selection: { scopes: [A], lifecycleClass: 'terminal', statuses: ['waiting'] }
      })
    ).toFailWithDetail(/not in lifecycle class 'terminal'/i, expect.objectContaining({ code: 'invalid' }));
  });

  test('malformed requests are invalid', async () => {
    for (const bad of [
      { selection: select(), limit: 0 },
      { selection: select(), limit: 201 },
      { selection: select(), limit: 1.5 },
      { selection: { ...select(), lifecycleClass: 'finished' } },
      { selection: select(), surplus: true },
      { selection: select(), cursor: 'not a cursor' }
    ]) {
      expect(await repository.query(bad as unknown as ITaskQuery)).toFailWithDetail(
        /query/i,
        expect.objectContaining({ code: 'invalid' })
      );
    }
  });

  test('limit defaults to 50 and allows 200', async () => {
    for (let i = 0; i < 60; i++) {
      await addTask(repository, `bulk${String(i).padStart(2, '0')}`, { scopes: [C] });
    }
    const dflt = await page(repository, { selection: { scopes: [C], lifecycleClass: 'open' } });
    expect(dflt.items).toHaveLength(50);
    expect(dflt.nextCursor).toBeDefined();
    const max = await page(repository, { selection: { scopes: [C], lifecycleClass: 'open' }, limit: 200 });
    expect(max.items).toHaveLength(60);
    expect(max.nextCursor).toBeUndefined();
  });

  test('responsibility and parent narrow, and confer nothing else', async () => {
    await addTask(repository, 'p', { scopes: [A] });
    await addTask(repository, 'p-kid1', { scopes: [A], parentId: 'p', responsibility: person('ann') });
    await addTask(repository, 'p-kid2', { scopes: [B], parentId: 'p' });
    await addTask(repository, 'q-kid', { scopes: [A], responsibility: person('ann') });
    expect(ids((await page(repository, { selection: select({ parentId: 'p' as TaskId }) })).items)).toEqual([
      'p-kid1'
    ]);
    expect(
      ids((await page(repository, { selection: select({ scopes: [A, B], parentId: 'p' as TaskId }) })).items)
    ).toEqual(['p-kid1', 'p-kid2']);
    expect(
      ids((await page(repository, { selection: select({ responsibility: person('ann') }) })).items)
    ).toEqual(['p-kid1', 'q-kid']);
    expect(
      ids(
        (
          await page(repository, {
            selection: select({ responsibility: person('ann'), parentId: 'p' as TaskId })
          })
        ).items
      )
    ).toEqual(['p-kid1']);
    // Nobody responsible, or a childless parent: nothing, not everything.
    expect((await page(repository, { selection: select({ responsibility: person('bob') }) })).items).toEqual(
      []
    );
    expect((await page(repository, { selection: select({ parentId: 'a1' as TaskId }) })).items).toEqual([]);
  });

  test('a narrow parent set drives the query instead of the scope union', async () => {
    for (let i = 0; i < 40; i++) {
      await addTask(repository, `noise${String(i).padStart(2, '0')}`, { scopes: [A] });
    }
    await addTask(repository, 'kid', { scopes: [A], parentId: 'a1' });
    const before: number = inspectRepository(repository)!.visits.candidateVisits;
    expect(ids((await page(repository, { selection: select({ parentId: 'a1' as TaskId }) })).items)).toEqual([
      'kid'
    ]);
    // One child visited, not the forty-odd tasks in scope A.
    expect(inspectRepository(repository)!.visits.candidateVisits - before).toBe(1);
  });

  test('a warm query reads no task record', async () => {
    const before: number = taskReads(repository);
    await page(repository, { selection: select({ scopes: [A, B, C] }) });
    await repository.queryDue({ selection: select(), cutoff: minutesAfter(10) as never });
    await repository.listOwed({ subscription: 's1' as SubscriptionId });
    expect(taskReads(repository)).toBe(before);
  });

  test('pages report native freshness for tracked tasks and source projection for bound ones', async () => {
    expect((await page(repository, { selection: select() })).freshness).toBe('native-current');
    await addTask(repository, 'ext', { scopes: [A], binding: binding('j1') });
    expect((await page(repository, { selection: select() })).freshness).toBe('source-projection');
  });
});

describe('unresolved and quarantined tasks', () => {
  test('unresolved references are listed separately, share the page budget and make it partial', async () => {
    const { repository } = await sessionRepository();
    await addTask(repository, 'a', { scopes: [A] });
    (await repository.withWriter((w) => w.register(unresolvedRegistration('b')))).orThrow();
    await addTask(repository, 'c', { scopes: [A] });
    const first = await page(repository, { selection: { scopes: [A], lifecycleClass: 'open' }, limit: 2 });
    expect(ids(first.items)).toEqual(['a']);
    expect(first.unresolved.map((r) => r.id)).toEqual(['b']);
    expect(first.completeness).toBe('partial');
    expect(first.freshness).toBe('source-projection');
    const second = await page(repository, {
      selection: { scopes: [A], lifecycleClass: 'open' },
      limit: 2,
      cursor: first.nextCursor
    });
    expect(ids(second.items)).toEqual(['c']);
    expect(second.completeness).toBe('complete');
    // No lifecycle is invented: a terminal-only query still reports it as unclassifiable.
    expect(
      (await page(repository, { selection: { scopes: [A], lifecycleClass: 'terminal' } })).unresolved
    ).toHaveLength(1);
    // Parent and responsibility still apply to it.
    expect(
      (await page(repository, { selection: { scopes: [A], lifecycleClass: 'all', parentId: 'a' as TaskId } }))
        .unresolved
    ).toEqual([]);
    expect(
      (
        await page(repository, {
          selection: { scopes: [A], lifecycleClass: 'all', responsibility: person('x') }
        })
      ).unresolved
    ).toEqual([]);
    // It has no notBefore, so no due query returns it.
    expect(
      (
        await repository.queryDue({
          selection: { scopes: [A], lifecycleClass: 'all' },
          cutoff: minutesAfter(1) as never
        })
      ).orThrow().unresolved
    ).toEqual([]);
  });

  test('a task whose kind is not registered is named as an issue, never silently omitted', async () => {
    const root = memoryRoot();
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    await addTask(repository, 'known', { scopes: [A] });
    await addTask(repository, 'vend', { scopes: [A], vendor: true });
    // An unresolved registration of the same kind carries a source binding into quarantine.
    (await repository.withWriter((w) => w.register(unresolvedRegistration('vref')))).orThrow();
    await addTask(repository, 'vkid', { scopes: [C], vendor: true, parentId: 'known' });
    repository.close().orThrow();
    const { registry } = await import('../../helpers/storageFixtures');
    const reopened = (
      await FileTreeTaskRepository.open(
        params(root, 'session', { registry: registry({ withoutVendor: true }) })
      )
    ).orThrow();
    expect(reopened.state).toBe('ready');
    const repo = (reopened as { repository: ITaskRepository }).repository;
    const result = await page(repo, { selection: select() });
    expect(ids(result.items)).toEqual(['known']);
    expect(result.completeness).toBe('partial');
    expect(result.issues.join()).toMatch(/vend, vref.*not registered/i);
    expect(result.issues.join()).not.toMatch(/vkid/);
    expect(result.unresolved).toEqual([]);
    // Quarantine keeps the graph: the unregistered child is still the known task's child.
    expect([...inspectRepository(repo)!.index!.children.get('known' as TaskId)!]).toEqual(['vkid']);
    // Its binding is still held: identity survives quarantine.
    expect(await repo.lookupSource(binding('j-vref'))).toSucceedWith('vref' as TaskId);
    // A selection that does not reach it is complete.
    expect((await page(repo, { selection: select({ scopes: [B] }) })).completeness).toBe('complete');
  });
});

describe('paging', () => {
  let repository: ITaskRepository;
  const all: string[] = [];

  beforeAll(async () => {
    repository = (await sessionRepository()).repository;
    for (let i = 0; i < 7; i++) {
      const id = `t${i}`;
      all.push(id);
      await addTask(repository, id, { scopes: [A] });
    }
  });

  test.each([1, 2, 3, 6, 7, 8, 200])('limit %i visits every task exactly once, in order', async (limit) => {
    const pages = await allPages(repository, { selection: select(), limit });
    expect(pages.flatMap((p) => ids(p.items))).toEqual(all);
    // No trailing empty page: the last page is the one without a cursor.
    expect(pages[pages.length - 1].items.length).toBeGreaterThan(0);
    expect(pages).toHaveLength(Math.ceil(all.length / limit));
    for (const p of pages.slice(0, -1)) {
      expect(p.items).toHaveLength(limit);
    }
  });

  test('a cursor presented with a different query is refused', async () => {
    const first = await page(repository, { selection: select(), limit: 2 });
    expect(
      await repository.query({ selection: select({ lifecycleClass: 'open' }), cursor: first.nextCursor })
    ).toFailWithDetail(/different query/i, expect.objectContaining({ code: 'invalid' }));
    expect(
      await repository.queryDue({
        selection: select(),
        cutoff: minutesAfter(1) as never,
        cursor: first.nextCursor
      })
    ).toFailWithDetail(/different query/i, expect.objectContaining({ code: 'invalid' }));
    // The limit is not part of the query: a cursor continues with any page size.
    expect(await repository.query({ selection: select(), limit: 5, cursor: first.nextCursor })).toSucceed();
  });

  test('a cursor from another repository, or an invented one, is stale', async () => {
    const other = (await sessionRepository()).repository;
    await addTask(other, 'x1', { scopes: [A] });
    await addTask(other, 'x2', { scopes: [A] });
    const foreign = (await page(other, { selection: select(), limit: 1 })).nextCursor!;
    expect(await repository.query({ selection: select(), cursor: foreign })).toFailWithDetail(
      /unknown, expired or evicted/i,
      expect.objectContaining({ code: 'cursor-stale', retry: 'safe' })
    );
    expect(await repository.query({ selection: select(), cursor: 'id-1.99' as PageCursor })).toFailWithDetail(
      /unknown/i,
      expect.objectContaining({ code: 'cursor-stale' })
    );
  });
});

describe('cursors and change', () => {
  test('any committed change restarts paging', async () => {
    const { repository } = await sessionRepository();
    await addTask(repository, 'a', { scopes: [A] });
    await addTask(repository, 'b', { scopes: [A] });
    const first = await page(repository, { selection: select(), limit: 1 });
    expect(first.generation).toBe(repository.health().generation);
    // A mutation to an unrelated task still moves the generation.
    await addTask(repository, 'z', { scopes: [B] });
    expect(
      await repository.query({ selection: select(), limit: 1, cursor: first.nextCursor })
    ).toFailWithDetail(
      /repository changed/i,
      expect.objectContaining({ code: 'cursor-stale', retry: 'safe' })
    );
    // The handle is released: presenting it again is simply unknown.
    expect(
      await repository.query({ selection: select(), limit: 1, cursor: first.nextCursor })
    ).toFailWithDetail(/unknown/i, expect.objectContaining({ code: 'cursor-stale' }));
  });

  test('a cursor does not survive close and reopen', async () => {
    const root = memoryRoot();
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    await addTask(repository, 'a', { scopes: [A] });
    await addTask(repository, 'b', { scopes: [A] });
    const cursor = (await page(repository, { selection: select(), limit: 1 })).nextCursor!;
    repository.close().orThrow();
    const reopened = (
      (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow() as {
        repository: ITaskRepository;
      }
    ).repository;
    expect(await reopened.query({ selection: select(), limit: 1, cursor })).toFailWithDetail(
      /unknown/i,
      expect.objectContaining({ code: 'cursor-stale' })
    );
  });

  test('cursor handles expire after five idle minutes and are bounded to 256', async () => {
    let now = Date.parse('2026-09-22T12:00:00.000Z');
    const { environment } = await import('../../helpers/storageFixtures');
    const { TaskEnvironment } = await import('../../../index');
    const base = environment().env;
    const env = TaskEnvironment.create({
      logger: base.logger,
      clock: () => now,
      newId: () => base.newId()
    }).orThrow();
    const repository = (
      await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { environment: env }))
    ).orThrow();
    await addTask(repository, 'a', { scopes: [A] });
    await addTask(repository, 'b', { scopes: [A] });
    const cursor = (await page(repository, { selection: select(), limit: 1 })).nextCursor!;
    now += 4 * 60 * 1000;
    // Using a handle refreshes it.
    expect(await repository.query({ selection: select(), limit: 1, cursor })).toSucceed();
    now += 4 * 60 * 1000;
    expect(await repository.query({ selection: select(), limit: 1, cursor })).toSucceed();
    now += 5 * 60 * 1000;
    expect(await repository.query({ selection: select(), limit: 1, cursor })).toFailWithDetail(
      /expired/i,
      expect.objectContaining({ code: 'cursor-stale' })
    );

    const first = (await page(repository, { selection: select(), limit: 1 })).nextCursor!;
    for (let i = 0; i < 300; i++) {
      await page(repository, { selection: select(), limit: 1 });
      expect(inspectRepository(repository)!.cursorHandles).toBeLessThanOrEqual(256);
    }
    expect(inspectRepository(repository)!.cursorHandles).toBe(256);
    // The least recently used handle was evicted — stale, never an empty last page.
    expect(await repository.query({ selection: select(), limit: 1, cursor: first })).toFailWithDetail(
      /evicted/i,
      expect.objectContaining({ code: 'cursor-stale' })
    );
  });

  test('a host ID factory that mints a non-identifier cannot produce an unusable cursor', async () => {
    const { TaskEnvironment } = await import('../../../index');
    const { environment } = await import('../../helpers/storageFixtures');
    const base = environment().env;
    let badIds = false;
    const env = TaskEnvironment.create({
      logger: base.logger,
      clock: base.clock,
      newId: () => (badIds ? succeed('not an identifier') : base.newId())
    }).orThrow();
    const repository = (
      await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { environment: env }))
    ).orThrow();
    await addTask(repository, 'a', { scopes: [A] });
    await addTask(repository, 'b', { scopes: [A] });
    badIds = true;
    expect(await repository.query({ selection: select(), limit: 1 })).toFailWithDetail(
      /host ID factory minted/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test.each<[string, () => number]>([
    [
      'throws',
      () => {
        throw new Error('clock offline');
      }
    ],
    ['returns a non-finite reading', () => Number.NaN]
  ])('a host clock that %s fails a paged query instead of escaping it', async (__, broken) => {
    const { TaskEnvironment } = await import('../../../index');
    const { environment } = await import('../../helpers/storageFixtures');
    const base = environment().env;
    let clockBroken = false;
    const env = TaskEnvironment.create({
      logger: base.logger,
      clock: () => (clockBroken ? broken() : base.clock()),
      newId: () => base.newId()
    }).orThrow();
    const repository = (
      await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { environment: env }))
    ).orThrow();
    await addTask(repository, 'a', { scopes: [A] });
    await addTask(repository, 'b', { scopes: [A] });
    await addTask(repository, 'c', { scopes: [A] });
    const cursor = (await page(repository, { selection: select(), limit: 1 })).nextCursor!;
    clockBroken = true;
    // Issuing a handle and resolving one both read the clock.
    expect(await repository.query({ selection: select(), limit: 1 })).toFailWithDetail(
      /cursor: the host clock/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(await repository.query({ selection: select(), limit: 1, cursor })).toFailWithDetail(
      /cursor: the host clock/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    clockBroken = false;
    expect(await repository.query({ selection: select(), limit: 1, cursor })).toSucceedAndSatisfy((next) =>
      expect(ids(next.items)).toEqual(['b'])
    );
  });

  test('an oversized normalized query is refused before any handle retains it', async () => {
    const { defaultTaskCapacityProfile } = await import('../../../index');
    const profile = {
      ...defaultTaskCapacityProfile,
      encoded: { ...defaultTaskCapacityProfile.encoded, maxQueryDescriptorBytes: 100 }
    };
    const repository = (await sessionRepository(profile)).repository;
    expect(await repository.query({ selection: select({ scopes: [A, B, C] }) })).toFailWithDetail(
      /over the bound of 100/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test('a cursor cannot be issued if the host id factory fails', async () => {
    const { TaskEnvironment } = await import('../../../index');
    const { environment } = await import('../../helpers/storageFixtures');
    const base = environment().env;
    let failIds = false;
    const env = TaskEnvironment.create({
      logger: base.logger,
      clock: base.clock,
      newId: () => (failIds ? fail<string>('no ids today') : base.newId())
    }).orThrow();
    const repository = (
      await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { environment: env }))
    ).orThrow();
    await addTask(repository, 'a', { scopes: [A] });
    await addTask(repository, 'b', { scopes: [A] });
    failIds = true;
    expect(await repository.query({ selection: select(), limit: 1 })).toFailWithDetail(
      /cursor/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
  });
});

describe('due candidates', () => {
  const cutoff = minutesAfter(60);
  let repository: ITaskRepository;

  beforeEach(async () => {
    repository = (await sessionRepository()).repository;
    await addTask(repository, 'before', { scopes: [A], lifecycle: waiting(minutesAfter(10)) });
    await addTask(repository, 'equal', { scopes: [A], lifecycle: waiting(cutoff) });
    await addTask(repository, 'after', { scopes: [A], lifecycle: waiting(minutesAfter(61)) });
    await addTask(repository, 'absent', { scopes: [A], lifecycle: waiting() });
    await addTask(repository, 'early', { scopes: [A, B], lifecycle: waiting(minutesAfter(5)) });
    await addTask(repository, 'running', { scopes: [A], lifecycle: { status: 'running' } });
  });

  function due(extra: Partial<IDueTaskQuery> = {}): IDueTaskQuery {
    return { selection: { scopes: [A, B], lifecycleClass: 'open' }, cutoff: cutoff as never, ...extra };
  }

  test('absent excluded, equal and before included, after excluded; ordered by notBefore then id', async () => {
    expect(await repository.queryDue(due())).toSucceedAndSatisfy((result) => {
      expect(ids(result.items)).toEqual(['early', 'before', 'equal']);
      expect(result.completeness).toBe('complete');
    });
  });

  test('paging keeps (notBefore, id) order across pages', async () => {
    const first = (await repository.queryDue(due({ limit: 2 }))).orThrow();
    expect(ids(first.items)).toEqual(['early', 'before']);
    const second = (await repository.queryDue(due({ limit: 2, cursor: first.nextCursor }))).orThrow();
    expect(ids(second.items)).toEqual(['equal']);
    expect(second.nextCursor).toBeUndefined();
  });

  test('the cutoff is part of the query a cursor is bound to', async () => {
    const first = (await repository.queryDue(due({ limit: 1 }))).orThrow();
    expect(
      await repository.queryDue(
        due({ limit: 1, cursor: first.nextCursor, cutoff: minutesAfter(61) as never })
      )
    ).toFailWithDetail(/different query/i, expect.objectContaining({ code: 'invalid' }));
  });

  test('a due query must admit waiting', async () => {
    expect(
      await repository.queryDue(due({ selection: { scopes: [A], lifecycleClass: 'terminal' } }))
    ).toFailWithDetail(/excludes them/i, expect.objectContaining({ code: 'invalid' }));
    expect(
      await repository.queryDue(
        due({ selection: { scopes: [A], lifecycleClass: 'open', statuses: ['running'] } })
      )
    ).toFailWithDetail(/must include 'waiting'/i, expect.objectContaining({ code: 'invalid' }));
    expect(await repository.queryDue(due({ cutoff: 'tomorrow' as never }))).toFailWithDetail(
      /instant/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test('other criteria still apply, and querying changes nothing', async () => {
    await addTask(repository, 'kid', {
      scopes: [A],
      parentId: 'before',
      lifecycle: waiting(minutesAfter(1))
    });
    const generation: number = repository.health().generation;
    const before = (await repository.readCommit('before' as TaskId)).orThrow();
    expect(
      ids(
        (
          await repository.queryDue(
            due({ selection: { scopes: [A], lifecycleClass: 'all', parentId: 'before' as TaskId } })
          )
        ).orThrow().items
      )
    ).toEqual(['kid']);
    expect(
      ids(
        (
          await repository.queryDue(
            due({ selection: { scopes: [B], lifecycleClass: 'open', statuses: ['waiting'] } })
          )
        ).orThrow().items
      )
    ).toEqual(['early']);
    // The task is still waiting with the same reason, revision and record; nothing was committed.
    expect(await repository.readCommit('before' as TaskId)).toSucceedWith(before);
    expect(repository.health().generation).toBe(generation);
  });

  test('a task leaves the due set when it stops waiting, and its time moves with it', async () => {
    await change(repository, 'before', { lifecycle: { status: 'running' } });
    await change(repository, 'after', { lifecycle: waiting(minutesAfter(1)) });
    expect(ids((await repository.queryDue(due())).orThrow().items)).toEqual(['after', 'early', 'equal']);
  });
});

describe('owed updates', () => {
  test('are listed per subscription, independently of lifecycle, and survive terminal and archive', async () => {
    const { repository } = await sessionRepository();
    const s1 = 's1' as SubscriptionId;
    const s2 = 's2' as SubscriptionId;
    const x = person('x');
    // s1 follows x's work in A and B; s2 follows everything in B. c is nobody's.
    await subscribeTo(repository, 's1', [A, B], { responsibility: x });
    await subscribeTo(repository, 's2', [B]);
    await addTask(repository, 'a', { scopes: [A], responsibility: x });
    await addTask(repository, 'b', { scopes: [B], responsibility: x });
    await addTask(repository, 'c', { scopes: [A] });
    await change(repository, 'a', { lifecycle: succeeded });
    expect(await repository.listOwed({ subscription: s1 })).toSucceedAndSatisfy((owed) => {
      expect(owed.updates.map((u) => u.id)).toEqual(['a:1:0', 'a:2:0', 'b:1:0']);
      expect(owed.completeness).toBe('complete');
    });
    expect(await repository.listOwed({ subscription: s2 })).toSucceedAndSatisfy((owed) =>
      expect(owed.updates.map((u) => u.id)).toEqual(['b:1:0'])
    );
    expect(await repository.listOwed({ subscription: 's3' as SubscriptionId })).toSucceedAndSatisfy((owed) =>
      expect(owed.updates).toEqual([])
    );

    // Terminal, then archived: gone from every lifecycle query, still owed.
    await change(repository, 'a', {}, { archive: true });
    expect((await page(repository, { selection: select() })).items.map((i) => i.envelope.id)).toEqual(['c']);
    const after = (await repository.listOwed({ subscription: s1, limit: 2 })).orThrow();
    expect(after.updates.map((u) => u.id)).toEqual(['a:1:0', 'a:2:0']);
    const rest = (
      await repository.listOwed({ subscription: s1, limit: 2, cursor: after.nextCursor })
    ).orThrow();
    expect(rest.updates.map((u) => u.id)).toEqual(['a:3:6', 'b:1:0']);
    expect(rest.nextCursor).toBeUndefined();
  });

  test('revisions order numerically, not as text', async () => {
    const { repository } = await sessionRepository();
    await subscribeTo(repository, 's1', [A]);
    await addTask(repository, 'a', { scopes: [A] });
    for (let i = 0; i < 10; i++) {
      await change(repository, 'a', { title: `rev ${i + 2}` });
    }
    const updates = (
      await repository.listOwed({ subscription: 's1' as SubscriptionId, limit: 200 })
    ).orThrow().updates;
    expect(updates.map((u) => u.revision)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  test('a malformed owed query is invalid', async () => {
    const { repository } = await sessionRepository();
    expect(await repository.listOwed({ subscription: 'no spaces' as SubscriptionId })).toFailWithDetail(
      /query/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });
});

describe('index maintenance on mutation', () => {
  test('reparent, reassignment, rescope and completion move memberships before success', async () => {
    const { repository } = await sessionRepository();
    await addTask(repository, 'p1', { scopes: [A] });
    await addTask(repository, 'p2', { scopes: [A] });
    await addTask(repository, 'k', { scopes: [A], parentId: 'p1', responsibility: person('ann') });

    await change(repository, 'k', { parentId: 'p2' as TaskId, responsibility: person('bob'), scopes: [B] });
    const q = async (s: Partial<ITaskSelection>): Promise<string[]> =>
      ids((await page(repository, { selection: { scopes: [A, B], lifecycleClass: 'all', ...s } })).items);
    expect(await q({ parentId: 'p1' as TaskId })).toEqual([]);
    expect(await q({ parentId: 'p2' as TaskId })).toEqual(['k']);
    expect(await q({ responsibility: person('ann') })).toEqual([]);
    expect(await q({ responsibility: person('bob') })).toEqual(['k']);
    expect(ids((await page(repository, { selection: select() })).items)).toEqual(['p1', 'p2']);
    const index = inspectRepository(repository)!.index!;
    expect(index.children.get('p1' as TaskId)).toBeUndefined();
    expect([...index.children.get('p2' as TaskId)!]).toEqual(['k']);

    await change(repository, 'k', { lifecycle: succeeded });
    expect(await q({ lifecycleClass: 'open' })).toEqual(['p1', 'p2']);
    expect(await q({ lifecycleClass: 'terminal' })).toEqual(['k']);
    // Dropping a responsibility removes the membership too.
    await addTask(repository, 'r', { scopes: [A], responsibility: person('cat') });
    await change(repository, 'r', { responsibility: undefined });
    expect(await q({ responsibility: person('cat') })).toEqual([]);
  });

  test('archive removes the summary and every lifecycle membership, never identity, edges or source', async () => {
    const { repository } = await sessionRepository();
    await addTask(repository, 'p', { scopes: [A] });
    await addTask(repository, 'k', {
      scopes: [A],
      parentId: 'p',
      binding: binding('job-k'),
      responsibility: person('ann')
    });
    const beforeArchive = inspectRepository(repository)!.index!;
    expect(beforeArchive.categoryOf('k' as TaskId)).toBe('summary');

    await finishAndArchive(repository, 'k');
    const inspection = inspectRepository(repository)!;
    const index = inspection.index!;
    expect(index.categoryOf('k' as TaskId)).toBe('archived');
    expect(index.summaries.has('k' as TaskId)).toBe(false);
    expect(index.membershipsOf('k' as TaskId)).toEqual({
      category: 'archived',
      parentId: 'p',
      sourceKey: expect.any(String),
      status: 'succeeded'
    });
    expect([...index.children.get('p' as TaskId)!]).toEqual(['k']);
    expect(index.activeChildren.get('p' as TaskId)).toBeUndefined();
    expect(index.byResponsibility.size).toBe(0);
    expect(await repository.lookupSource(binding('job-k'))).toSucceedWith('k' as TaskId);
    expect(ids((await page(repository, { selection: select() })).items)).toEqual(['p']);
    expect(
      ids((await page(repository, { selection: select({ lifecycleClass: 'terminal' }) })).items)
    ).toEqual([]);
    expect(inspection.projections.get('k' as TaskId)).toEqual(
      expect.objectContaining({ archived: true, status: 'succeeded', parentId: 'p' })
    );

    // Explicit archived inspection reads the selected record, and only it.
    const reads: number = taskReads(repository);
    expect(await repository.read('k' as TaskId)).toSucceedAndSatisfy((r) => {
      expect(r).toEqual(expect.objectContaining({ state: 'resolved', archived: true }));
    });
    expect(taskReads(repository)).toBe(reads + 1);
  });

  test('a task that names one scope twice is indexed, changed and archived like any other', async () => {
    const { repository } = await sessionRepository();
    await addTask(repository, 'twice', { scopes: [A, A] });
    expect(ids((await page(repository, { selection: select() })).items)).toEqual(['twice']);
    await change(repository, 'twice', { lifecycle: succeeded });
    expect(
      ids((await page(repository, { selection: select({ lifecycleClass: 'terminal' }) })).items)
    ).toEqual(['twice']);
    await change(repository, 'twice', {}, { archive: true });
    expect((await page(repository, { selection: select() })).items).toEqual([]);
    expect(repository.health().state).toBe('ready');
  });

  test('a binding is bound to one retained task; a second registration of it is refused', async () => {
    const { repository } = await sessionRepository();
    await addTask(repository, 'x', { scopes: [A], binding: binding('same') });
    await finishAndArchive(repository, 'x');
    expect(
      await repository.withWriter((w) =>
        w.register(shapedRegistration('y', { scopes: [A], binding: binding('same') }))
      )
    ).toFailWithDetail(
      /already binds this reference to task x/i,
      expect.objectContaining({ code: 'conflict' })
    );
    // An unresolved registration holds its reference just the same.
    (await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    expect(
      await repository.withWriter((w) =>
        w.register(shapedRegistration('z', { scopes: [A], binding: binding('j-u1') }))
      )
    ).toFailWithDetail(
      /already binds this reference to task u1/i,
      expect.objectContaining({ code: 'conflict' })
    );
    // Nothing was written for either refusal.
    expect(await repository.read('y' as TaskId)).toSucceedWith(undefined);
    expect(await repository.read('z' as TaskId)).toSucceedWith(undefined);
    expect(await repository.lookupSource(binding('nobody'))).toSucceedWith(undefined);
    // A lookup never canonicalizes more than a stored binding could ever be.
    expect(
      await repository.lookupSource({ sourceId: 'acme', referenceVersion: 1, reference: 'x'.repeat(5000) })
    ).toFailWithDetail(/over the bound of 4096/i, expect.objectContaining({ code: 'invalid' }));
    expect(await repository.lookupSource({ sourceId: 'bad id!' } as never)).toFailWithDetail(
      /./,
      expect.objectContaining({ code: 'invalid' })
    );
  });
});

describe('the page candidate budget', () => {
  jest.setTimeout(60000);

  test('a page that runs out of candidates returns a cursor, even when it found nothing', async () => {
    const { seedRepository } = await import('../../helpers/cohorts');
    const { repository } = await seedRepository(
      [{ id: 'zz-match', shape: { scopes: [A], responsibility: person('y') } }],
      [
        // 1,100 tasks in A that a responsibility filter rejects, and a larger set for 'y' elsewhere,
        // so the scope union — not the responsibility set — drives the query.
        { prefix: 'ax', count: 1100, shape: { scopes: [A], responsibility: person('x') } },
        { prefix: 'by', count: 1200, shape: { scopes: [B], responsibility: person('y') } },
        {
          prefix: 'dx',
          count: 1100,
          shape: { scopes: [C], responsibility: person('x'), lifecycle: waiting(minutesAfter(1)) }
        }
      ]
    );
    const selection = select({ responsibility: person('y') });
    const first = await page(repository, { selection });
    expect(first.items).toEqual([]);
    expect(first.nextCursor).toBeDefined();
    const second = await page(repository, { selection, cursor: first.nextCursor });
    expect(ids(second.items)).toEqual(['zz-match']);
    expect(second.nextCursor).toBeUndefined();

    const due: IDueTaskQuery = {
      selection: { scopes: [C], lifecycleClass: 'open', responsibility: person('y') },
      cutoff: minutesAfter(60) as never
    };
    const firstDue = (await repository.queryDue(due)).orThrow();
    expect(firstDue.items).toEqual([]);
    expect(firstDue.nextCursor).toBeDefined();
    const secondDue = (await repository.queryDue({ ...due, cursor: firstDue.nextCursor })).orThrow();
    expect(secondDue.items).toEqual([]);
    expect(secondDue.nextCursor).toBeUndefined();
  });
});
