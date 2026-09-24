/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskCommitRequest,
  ITaskEnvelope,
  ITaskRepository,
  ITaskRepositoryWriter,
  ITaskUpdate,
  SubscriptionId,
  TaskAudienceResolver
} from '../../../index';
import { op, tid } from '../../helpers/brokerFixtures';
import {
  ISourceHarness,
  SimulatedExecutor,
  controllableSource,
  harnessWith,
  recordOf,
  registerJob,
  sourceHarness,
  sourceRegistry
} from '../../helpers/sourceFixtures';
import { environment } from '../../helpers/storageFixtures';

const sub: SubscriptionId = 'sub-1' as SubscriptionId;
/** Owes every update to one subscription, so required updates are retained and visible. */
const everyone: TaskAudienceResolver = () => [sub];

function envelopeOf(record: Awaited<ReturnType<typeof recordOf>>): ITaskEnvelope {
  if (record.recordType !== 'resolved') {
    throw new Error('expected a resolved record');
  }
  return record.task.envelope;
}

function updatesOf(record: Awaited<ReturnType<typeof recordOf>>): ReadonlyArray<ITaskUpdate> {
  return record.recordType === 'resolved' ? record.updates : [];
}

/** Wraps a repository so a test can watch or refuse individual commits. */
function watched(
  repository: ITaskRepository,
  onCommit: (
    request: ITaskCommitRequest,
    next: () => ReturnType<ITaskRepositoryWriter['commit']>
  ) => ReturnType<ITaskRepositoryWriter['commit']>
): ITaskRepository {
  return Object.assign(Object.create(repository), {
    withWriter: <T>(action: (w: ITaskRepositoryWriter) => Promise<T>) =>
      repository.withWriter(
        (w) =>
          action({
            readCommit: (id) => w.readCommit(id),
            register: (r) => w.register(r),
            commit: (r) => onCommit(r, () => w.commit(r)),
            readSource: (id) => w.readSource(id),
            commitSource: (r) => w.commitSource(r),
            extendReplayEnvelope: (id, add) => w.extendReplayEnvelope(id, add),
            raiseCapacityLimits: (p) => w.raiseCapacityLimits(p)
          }) as never
      )
  });
}

describe('observed-state reconciliation', () => {
  test('a pass applies every listed binding and commits the cursor after the page', async () => {
    const h = await sourceHarness();
    for (const job of ['a', 'b', 'c']) {
      h.executor.addJob(job);
      await registerJob(h, job);
      h.executor.change(job, (j) => (j.step = 2));
    }
    h.executor.pageSize = 2;
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.pages).toBe(2);
      expect(report.complete).toBe(true);
      expect(report.stopped).toBeUndefined();
      expect(report.observations.map((o) => o.outcome)).toEqual(['applied', 'applied', 'applied']);
    });
    expect(await h.repository.readSource('exec')).toSucceedAndSatisfy((record) => {
      expect(record?.pages).toBe(2);
      expect(record?.history).toBe('observed-state');
    });
  });

  test('terminal reconciliation works after a missed publication', async () => {
    // The executor finished and saved its state; the broker never heard (no push, no poll).
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change(
      'j1',
      (j) => (j.lifecycle = { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } })
    );
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    expect(envelopeOf(await recordOf(h, 'j1')).lifecycle.status).toBe('succeeded');
  });

  test('an active-only listing can never make a pass complete', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.coverage = 'active-only';
    h.executor.change(
      'j1',
      (j) => (j.lifecycle = { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } })
    );
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.complete).toBe(false);
      expect(report.observations).toEqual([]);
    });
    // The terminal outcome it stopped listing was not discovered.
    expect(envelopeOf(await recordOf(h, 'j1')).lifecycle.status).toBe('running');
  });

  test('old pages replay as safe duplicates', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change('j1', (j) => (j.step = 1));
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const once = await recordOf(h, 'j1');
    // The same listing again: nothing new.
    await h.repository.withWriter(async (w) =>
      w.commitSource({ sourceId: 'exec', history: 'observed-state', expectedRecordRevision: 1, pages: 0 })
    );
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.observations.map((o) => o.outcome)).toEqual(['unchanged']);
    });
    expect(envelopeOf(await recordOf(h, 'j1')).revision).toBe(envelopeOf(once).revision);
  });

  test('a page that fails to load stops the pass with the cursor where it was', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.down = true;
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('source-unavailable');
      expect(report.pages).toBe(0);
      expect(report.issues.join()).toMatch(/down/);
    });
    expect(await h.repository.readSource('exec')).toSucceedWith(undefined);
  });

  test('a page that does not convert is a contract violation and moves nothing', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const page = h.executor.page.bind(h.executor);
    h.executor.page = (cursor) =>
      page(cursor).onSuccess((p) => succeed({ ...p, completeness: 'most' } as never));
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('contract-violation');
    });
  });

  test('a pass stops at its page limit, having committed the pages it read', async () => {
    const h = await sourceHarness();
    for (const job of ['a', 'b', 'c']) {
      h.executor.addJob(job);
      await registerJob(h, job);
    }
    h.executor.pageSize = 1;
    expect(await h.broker.reconcile({ sourceId: 'exec', maxPages: 2 })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('page-limit');
      expect(report.pages).toBe(2);
      expect(report.cursor).toBe('2');
      expect(report.complete).toBe(false);
    });
    // The next pass resumes from the committed cursor.
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.pages).toBe(1);
      expect(report.observations.map((o) => o.taskId)).toEqual(['c']);
    });
  });

  test('a listed binding no task holds is reported, and nothing is created', async () => {
    const h = await sourceHarness();
    h.executor.addJob('stray');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.observations.map((o) => o.outcome)).toEqual(['unknown-binding']);
    });
    expect(await h.repository.readCommit(tid('stray'))).toSucceedWith(undefined);
  });

  test('a request that is not a reconcile request is invalid', async () => {
    const h = await sourceHarness();
    expect(await h.broker.reconcile({ sourceId: 'exec', maxPages: 0 })).toFailWith(/reconcile/);
    expect(await h.broker.reconcile({ sourceId: 'exec', extra: 1 } as never)).toFailWith(/reconcile/);
  });
});

describe('source-replay: only the feed commits projections', () => {
  test('a latest revision-3 hint before feed revision 2 commits revision 2 first, then 3', async () => {
    const h = await sourceHarness({ history: 'source-replay', audience: everyone });
    h.executor.addJob('j1'); // feed: rev 1
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed(); // resolves at rev 1
    // Revision 2 raises attention (required); revision 3 clears it.
    h.executor.change('j1', (j) => (j.attention = [{ namespace: 'review', key: 'r1' }]));
    h.executor.change('j1', (j) => {
      j.attention = [];
      j.step = 3;
    });
    // The latest read (revision 3) arrives first, as a hint and as a command observation would.
    expect(await h.broker.hint(h.executor.binding('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('deferred');
    });
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('deferred');
    });
    const beforeFeed = await recordOf(h, 'j1');
    expect(beforeFeed.recordType === 'resolved' && beforeFeed.sourceRevision?.token).toBe('1');

    const commits: string[] = [];
    const repository = watched(h.repository, (request, next) => {
      if (request.purpose === 'observation' && request.record.recordType === 'resolved') {
        commits.push(request.record.sourceRevision!.token);
      }
      return next();
    });
    const watchedBroker = harnessWith(repository, h.env, h.root, h.logger, h.executor, h.source, h.registry, {
      audience: everyone
    }).broker;
    expect(await watchedBroker.reconcile({ sourceId: 'exec' })).toSucceed();
    expect(commits).toEqual(['2', '3']);
    const after = await recordOf(h, 'j1');
    // Revision 2's required attention obligation was committed, and survives revision 3.
    const attention = updatesOf(after).filter((u) => u.category === 'attention');
    expect(attention.map((u) => u.snapshot.envelope.attention)).toEqual([
      [{ namespace: 'review', key: 'r1' }],
      []
    ]);
  });

  test('a replaying source registers with a finite envelope and no initial observation', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    const base = {
      taskId: tid('j1'),
      operationId: op(),
      kind: 'sim.job',
      detailVersion: 1,
      title: 'j1',
      scopes: [{ namespace: 'project', key: 'alpha' }],
      binding: h.executor.binding('j1'),
      recovery: 'reattach'
    };
    expect(await h.broker.registerExternal('host', base)).toFailWith(/declare the finite envelope/);
    expect(
      await h.broker.registerExternal('host', {
        ...base,
        history: {
          history: 'source-replay',
          envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 10 }
        },
        initialObservation: {
          ...h.executor.projection(h.executor.jobs.get('j1')!),
          details: { step: 0, ref: 'x' }
        }
      })
    ).toFailWith(/seeded by its feed/);
  });

  test('the source-replay guarantee is refused for a source that does not replay', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op(),
        kind: 'sim.job',
        detailVersion: 1,
        title: 'j1',
        scopes: [{ namespace: 'project', key: 'alpha' }],
        binding: h.executor.binding('j1'),
        recovery: 'reattach',
        history: {
          history: 'source-replay',
          envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 10 }
        }
      })
    ).toFailWithDetail(/refused/, expect.objectContaining({ code: 'unsupported' }));
  });

  test('a gap stops the pass with the cursor unmoved; the replay resumes from it', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.pageSize = 1;
    expect(await h.broker.reconcile({ sourceId: 'exec', maxPages: 1 })).toSucceed();
    h.executor.change('j1', (j) => (j.step = 1));
    h.executor.gapAt = 1;
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('gap');
      expect(report.cursor).toBe('1');
      expect(report.complete).toBe(false);
    });
    h.executor.gapAt = undefined;
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.cursor).toBe('2');
      expect(report.observations.map((o) => o.outcome)).toEqual(['applied']);
    });
  });

  test('broken per-binding order in a page commits nothing from it', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change('j1', (j) => (j.step = 1));
    // Swap the feed's two entries: revision 2 before revision 1.
    h.executor.feed.reverse();
    const before = await recordOf(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('order');
      expect(report.issues.join()).toMatch(/does not follow/);
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
    expect(await h.repository.readSource('exec')).toSucceedWith(undefined);
  });

  test('a feed entry the broker cannot order across stops the pass', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    h.executor.change('j1', (j) => (j.epoch = 'e2'));
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('order');
      expect(report.cursor).toBe('1');
    });
  });

  test('a contract violation in the feed stops the pass and the cursor', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    // A second entry at the same revision with different content.
    const first = h.executor.feed[0];
    h.executor.feed.push({
      binding: first.binding,
      projection: { ...first.projection, details: { step: 99, ref: 'x' } }
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('contract-violation');
      expect(report.cursor).toBe('1');
    });
  });

  test('a source attached with a different history than its checkpoint is refused', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const other = new SimulatedExecutor('exec', 'observed-state');
    const broker = harnessWith(
      h.repository,
      h.env,
      h.root,
      h.logger,
      other,
      controllableSource(other),
      h.registry
    ).broker;
    expect(await broker.reconcile({ sourceId: 'exec' })).toFailWith(/cannot change under committed progress/);
  });
});

describe('restart', () => {
  test('reopening storage makes no call to any source', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const calls: string[] = [];
    const counting = new SimulatedExecutor('exec', 'source-replay');
    for (const method of ['read', 'page', 'recover', 'dispatch', 'lookup'] as const) {
      const original = counting[method].bind(counting) as (...args: unknown[]) => unknown;
      (counting as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
        calls.push(method);
        return original(...args);
      };
    }
    expect(h.repository.close()).toSucceed();
    const { env } = environment('s');
    const reopened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: env,
        registry: sourceRegistry(controllableSource(counting))
      })
    ).orThrow();
    expect(reopened.state).toBe('ready');
    const repository = reopened.state === 'ready' ? reopened.repository : undefined;
    const broker = harnessWith(
      repository!,
      env,
      h.root,
      h.logger,
      counting,
      controllableSource(counting),
      h.registry
    ).broker;
    expect(broker).toBeDefined();
    expect(calls).toEqual([]);
    // The committed cursor survived the restart.
    expect(await repository!.readSource('exec')).toSucceedAndSatisfy((record) => {
      expect(record?.cursor).toBe('1');
    });
  });
});

export type { ISourceHarness };
