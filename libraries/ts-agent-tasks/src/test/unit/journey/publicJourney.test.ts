/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * P1's public contract/journey tests: the compositions of the plan's credential-free journey that no
 * single suite in this package pinned.
 *
 * Each test below drives the package through its **public barrel only** (`../../../index`), and the
 * helpers it uses import nothing else. The rest of the journey is already pinned by a dedicated suite
 * per behaviour — `.ai/tasks/active/agent-tasks-p1/result.md` maps every step to the suite that
 * pins it — and the `samples/testbed` `agent-tasks` scenario drives all nine steps from outside the
 * package. These tests are the part that survives that sample being deleted.
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  IBoundTaskDelivery,
  IBoundTaskWriter,
  ITaskScope,
  SubscriptionId,
  TaskRevision,
  allUpdateCategories,
  prepareTaskPrompt,
  taskUpdateId
} from '../../../index';
import {
  ada,
  allowAll,
  alpha,
  beta,
  bob,
  command,
  op,
  revisionOf,
  tid,
  watcher
} from '../../helpers/brokerFixtures';
import { deliveryHarness, deliveryOf, pendingIds, subscribed } from '../../helpers/deliveryFixtures';
import { library, request, standardRecord } from '../../helpers/promptFixtures';
import {
  ISourceHarness,
  harnessWith,
  registerJob,
  sourceHarness,
  sourceRegistry
} from '../../helpers/sourceFixtures';
import { environment } from '../../helpers/storageFixtures';
import { node, pump, release, states, statusOf, stop } from '../../helpers/stopFixtures';

/** The host's delivery of the all-seeing watcher subscription. */
function watcherDelivery(h: ISourceHarness, principal: string = 'host'): IBoundTaskDelivery {
  return h.broker
    .bindDelivery({
      principal,
      scopes: [alpha, beta],
      authorization: allowAll,
      subscriptionId: watcher,
      consumerId: `consumer-${watcher}` as never
    })
    .orThrow();
}

/** Subscribes `id` for a principal over alpha, baselined at the current state. */
async function subscribeCurrent(h: ISourceHarness, id: string): Promise<IBoundTaskDelivery> {
  (
    await h.broker.subscribe(
      { principal: 'host', scopes: [alpha], authorization: allowAll },
      {
        subscriptionId: id,
        operationId: op(`subscribe-${id}`),
        consumerId: `consumer-${id}`,
        selection: { scopes: [alpha], lifecycleClass: 'all' },
        start: 'current',
        policy: { categories: [...allUpdateCategories].sort() }
      }
    )
  ).orThrow();
  return h.broker
    .bindDelivery({
      principal: 'host',
      scopes: [alpha],
      authorization: allowAll,
      subscriptionId: id as SubscriptionId,
      consumerId: `consumer-${id}` as never
    })
    .orThrow();
}

/** Closes the harness's repository and opens its root again with fresh adapters: a host restart. */
async function reopen(h: ISourceHarness, options?: { readonly closed?: boolean }): Promise<ISourceHarness> {
  if (options?.closed !== true) {
    h.repository.close().orThrow();
  }
  const root: FileTree.IFileTreeDirectoryItem = h.root;
  const { env, logger } = environment('p1-reopen');
  const opened = (
    await FileTreeTaskRepository.open({
      root,
      mode: 'session',
      environment: env,
      registry: sourceRegistry(h.source)
    })
  ).orThrow();
  if (opened.state !== 'ready') {
    throw new Error('reopen: recovery required');
  }
  return harnessWith(opened.repository, env, root, logger, h.executor, h.source, h.registry);
}

describe('step 1 — a bound view over overlapping scopes', () => {
  test('lists a task labelled with both of its scopes exactly once', async () => {
    const h = await sourceHarness();
    const both: IBoundTaskWriter = h.broker
      .bind({ principal: 'alice', scopes: [alpha, beta], authorization: h.policy })
      .orThrow();
    (
      await both.createTracked({ taskId: tid('shared'), operationId: op(), title: 'in both scopes' })
    ).orThrow();
    (
      await h.writer.createTracked({ taskId: tid('alpha-only'), operationId: op(), title: 'in alpha' })
    ).orThrow();
    const idsOf = async (scopes: ReadonlyArray<ITaskScope>): Promise<string[]> =>
      (
        await h.broker
          .bindView({ principal: 'alice', scopes, authorization: h.policy })
          .orThrow()
          .query({ limit: 50 })
      )
        .orThrow()
        .items.map((i) => i.envelope.id);
    expect(await idsOf([alpha])).toEqual(['alpha-only', 'shared']);
    expect(await idsOf([beta])).toEqual(['shared']);
    expect(await idsOf([alpha, beta])).toEqual(['alpha-only', 'shared']);
  });
});

describe('step 4 — a context in flight while external work completes', () => {
  test('the terminal update stays owed after its task leaves open work; the acknowledgement clears only what was included', async () => {
    const h = await sourceHarness({ watch: true });
    h.executor.addJob('job');
    await registerJob(h, 'job');
    const delivery = watcherDelivery(h);
    const prepared = (await delivery.prepare()).orThrow();
    const included = prepared.context.receipt.included.flatMap((e) => e.updateIds);
    expect(included).not.toEqual([]);

    h.executor.change('job', (j) => {
      j.lifecycle = { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } };
    });
    (await h.broker.observe(tid('job'))).orThrow();
    const terminal: TaskRevision = await revisionOf(h.repository, 'job');

    expect((await delivery.acknowledge(prepared.context.receipt)).orThrow().newlyAcknowledged).toEqual(
      included
    );
    const open = (await h.writer.query({ filter: { lifecycleClass: 'open' } })).orThrow();
    expect(open.items.map((i) => i.envelope.id)).not.toContain('job');
    const owed = await pendingIds(delivery);
    expect(owed).toEqual(
      expect.arrayContaining([
        taskUpdateId(tid('job'), terminal, 'lifecycle'),
        taskUpdateId(tid('job'), terminal, 'result')
      ])
    );
    expect(owed.filter((id) => included.includes(id as never))).toEqual([]);
  });
});

describe('step 5 — reassignment, then a reopen', () => {
  test('identity, the original source reference and independent checkpoints all survive', async () => {
    const h = await sourceHarness();
    (
      await h.writer.createTracked({
        taskId: tid('plan'),
        operationId: op(),
        title: 'plan',
        responsibility: ada
      })
    ).orThrow();
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('plan') });
    const deliveryA = await subscribeCurrent(h, 'sub-a');
    const stale: TaskRevision = await revisionOf(h.repository, 'plan');

    const moved = (
      await h.writer.reassign({
        taskId: tid('plan'),
        operationId: op(),
        expectedRevision: stale,
        responsibility: bob
      })
    ).orThrow();
    expect([moved.previous, moved.current]).toEqual([ada, bob]);
    const staleWrite = await h.writer.updateTracked({
      taskId: tid('plan'),
      operationId: op(),
      expectedRevision: stale,
      patch: { title: 'edited from a stale revision' }
    });
    expect(staleWrite.isFailure() && staleWrite.detail?.code).toBe('conflict');

    // B starts explicitly, from a baseline of the current state; acknowledging it touches nothing of A's.
    const deliveryB = await subscribeCurrent(h, 'sub-b');
    const preparedB = (await deliveryB.prepare()).orThrow();
    expect(
      preparedB.context.entries
        .filter((e) => e.summary.envelope.id === tid('plan'))
        .map((e) => e.summary.envelope.revision)
    ).toEqual([moved.revision]);
    const owedA = await pendingIds(deliveryA);
    (await deliveryB.acknowledge(preparedB.context.receipt)).orThrow();
    expect(await pendingIds(deliveryA)).toEqual(owedA);
    const owedB = await pendingIds(deliveryB);

    const r = await reopen(h);
    expect(await r.repository.lookupSource(h.executor.binding('job'))).toSucceedWith(tid('job'));
    const rebind = (id: string): IBoundTaskDelivery =>
      r.broker
        .bindDelivery({
          principal: 'host',
          scopes: [alpha],
          authorization: allowAll,
          subscriptionId: id as SubscriptionId,
          consumerId: `consumer-${id}` as never
        })
        .orThrow();
    expect(await pendingIds(rebind('sub-a'))).toEqual(owedA);
    expect(await pendingIds(rebind('sub-b'))).toEqual(owedB);
    const job = (await r.repository.readCommit(tid('job'))).orThrow();
    expect(
      job?.recordType === 'resolved' ? [job.task.envelope.parentId, job.task.envelope.responsibility] : []
    ).toEqual(['plan', undefined]);
  });
});

describe('step 7 — a cascade pause blocked by observation-only work', () => {
  test('a host-resolved blocker satisfies the pause; release resumes nothing, and resume is a separate operation', async () => {
    const h = await sourceHarness({ observationOnly: true });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'child', { parentId: 'root' });
    await command(h, h.writer, 'root', 'start');
    await command(h, h.writer, 'child', 'start');
    h.executor.addJob('watched');
    await registerJob(h, 'watched', { parentId: tid('root') });

    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const blocked = (await pump(h.writer, accepted)).orThrow();
    expect([blocked.state, states(blocked)]).toEqual([
      'blocked',
      { root: 'confirmed', child: 'confirmed', watched: 'unsupported' }
    ]);
    expect(
      (
        await h.writer.createTracked({
          taskId: tid('late'),
          operationId: op(),
          title: 'late',
          parentId: tid('root')
        })
      ).detail?.code
    ).toBe('conflict');

    // Host action: the observed work finishes, and the host observes it.
    h.executor.change('watched', (j) => {
      j.lifecycle = { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } };
    });
    (await h.broker.observe(tid('watched'))).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');

    expect((await release(h, h.writer, accepted)).orThrow().state).toBe('released');
    expect([await statusOf(h, 'root'), await statusOf(h, 'child')]).toEqual(['paused', 'paused']);
    await command(h, h.writer, 'child', 'resume');
    expect([await statusOf(h, 'root'), await statusOf(h, 'child')]).toEqual(['paused', 'running']);
  });
});

describe('step 8 — recovery after a reopen', () => {
  test('running, completed, unavailable and unrecoverable work is settled without sending anything', async () => {
    const h = await sourceHarness({ watch: true });
    for (const job of ['j-run', 'j-done', 'j-away', 'j-lost']) {
      h.executor.addJob(job);
      await registerJob(h, job);
    }
    h.repository.close().orThrow();
    h.executor.change('j-done', (j) => {
      j.lifecycle = { status: 'succeeded', outcome: { summary: 'finished while down', artifacts: [] } };
    });
    h.executor.change('j-lost', (j) => {
      j.lifecycle = { status: 'failed', reason: { code: 'lost', summary: 'the executor lost it' } };
    });
    const r = await reopen(h, { closed: true });

    const outcome = async (id: string): Promise<string> => (await r.broker.recover(tid(id))).orThrow().result;
    expect([await outcome('j-run'), await outcome('j-done'), await outcome('j-lost')]).toEqual([
      'reattached',
      'completed',
      'unrecoverable'
    ]);
    h.executor.down = true;
    expect(await outcome('j-away')).toBe('unavailable');
    expect([await statusOf(r, 'j-done'), await statusOf(r, 'j-lost'), await statusOf(r, 'j-away')]).toEqual([
      'succeeded',
      'failed',
      'running'
    ]);

    const owed = await pendingIds(watcherDelivery(r));
    expect(owed).toEqual(
      expect.arrayContaining([
        taskUpdateId(tid('j-done'), await revisionOf(r.repository, 'j-done'), 'result'),
        taskUpdateId(tid('j-lost'), await revisionOf(r.repository, 'j-lost'), 'lifecycle')
      ])
    );
    expect((await r.writer.resolveCommands({ limit: 50 })).orThrow().resolutions).toEqual([]);
    expect(h.executor.dispatches.size).toBe(0);
  });
});

describe('step 9 — a prompt handoff beside another subscription', () => {
  test('a foreign receipt consumes nothing of the handoff, which still acknowledges only on its own delivery', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await subscribed(h, 'audit');
    const delivery = deliveryOf(h, 'sub');
    const audit = deliveryOf(h, 'audit');
    (await h.writer.createTracked({ taskId: tid('t1'), operationId: op(), title: 't1' })).orThrow();
    await command(h, h.writer, 't1', 'start');
    const lib = await library([standardRecord()]);
    const ready = (await prepareTaskPrompt({ delivery, library: lib, request })).orThrow();

    const foreign = (await audit.prepare()).orThrow();
    const refused = await delivery.acknowledge(foreign.context.receipt);
    expect(refused.isFailure() && refused.detail?.code).toBe('invalid-receipt');
    const owedAudit = await pendingIds(audit);

    expect(await ready.acknowledge(ready.prompt.system)).toSucceedAndSatisfy((ack) => {
      expect(ack.newlyAcknowledged.length).toBeGreaterThan(0);
    });
    expect(await pendingIds(delivery)).toEqual([]);
    expect(await pendingIds(audit)).toEqual(owedAudit);
  });
});
