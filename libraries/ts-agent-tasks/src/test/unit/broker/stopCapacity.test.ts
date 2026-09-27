/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  CapacityDimension,
  FileTreeTaskRepository,
  ITaskCapacityProfile,
  ITaskRepository,
  defaultTaskCapacityProfile
} from '../../../index';
import {
  IBrokerHarness,
  brokerHarness,
  brokerRegistry,
  harnessOver,
  op,
  tid
} from '../../helpers/brokerFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';
import { ISourceHarness, registerJob, sourceHarness } from '../../helpers/sourceFixtures';
import { CapabilityScript } from '../../helpers/stopFixtures';
import { node, persisted, pump, release, states, statusOf, stop } from '../../helpers/stopFixtures';

/** Used plus reserved in one dimension. */
function committed(repository: ITaskRepository, dimension: CapacityDimension): number {
  const row = repository
    .capacityStatus()
    .orThrow()
    .dimensions.find((d) => d.dimension === dimension)!;
  return row.used + row.reserved;
}

function withLogical(limit: number): ITaskCapacityProfile {
  return {
    ...defaultTaskCapacityProfile,
    limits: { ...defaultTaskCapacityProfile.limits, 'logical-bytes': limit }
  };
}

/** root with five children: six targets. */
async function sixTargets(h: IBrokerHarness): Promise<void> {
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  for (const id of ['a', 'b', 'c', 'd', 'e']) {
    await node(h.writer, id, { parentId: 'root' });
  }
}

/** What accepting the stop over {@link sixTargets} commits, measured on a roomy repository. */
async function measure(): Promise<{ readonly before: number; readonly accepted: number }> {
  // The stored profile is part of the manifest's size: measure under a limit of the same width as the
  // ones the tests then set, so the figures are exact to the byte.
  const h = await brokerHarness({ profile: withLogical(99999999) });
  await sixTargets(h);
  const before = committed(h.repository, 'logical-bytes');
  (await stop(h, h.writer, 'root', 'pause')).orThrow();
  return { before, accepted: committed(h.repository, 'logical-bytes') };
}

describe('A3 — a stop reserves for every target before it is accepted', () => {
  test('no partial dispatch: one byte short of every target, the stop is refused and nothing is written', async () => {
    const { accepted } = await measure();
    const h = await brokerHarness({ profile: withLogical(accepted - 1) });
    await sixTargets(h);
    const revisions = new Map<string, number>();
    for (const id of ['root', 'a', 'b', 'c', 'd', 'e']) {
      revisions.set(id, (await h.repository.readCommit(tid(id))).orThrow()!.recordRevision);
    }
    const refused = await stop(h, h.writer, 'root', 'pause');
    expect(refused).toFailWith(/'logical-bytes' would reach/);
    expect(refused.isFailure() && refused.detail?.capacity?.dimension).toBe('logical-bytes');
    // Not the root, not the first target, not any: every record is exactly as it was.
    for (const [id, revision] of revisions) {
      const record = (await h.repository.readCommit(tid(id))).orThrow()!;
      expect(record.recordRevision).toBe(revision);
      expect(record.recordType === 'resolved' && record.stops).toBeUndefined();
    }
  });

  test('at exactly its reservation it is accepted, and every accepted attempt lands at a full repository', async () => {
    const { accepted } = await measure();
    const h = await brokerHarness({ profile: withLogical(accepted) });
    await sixTargets(h);
    const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(committed(h.repository, 'logical-bytes')).toBe(accepted);
    // The repository is full: ordinary growth is refused...
    expect(await h.writer.createTracked({ taskId: tid('x'), operationId: op(), title: 'x' })).toFailWith(
      /'logical-bytes' would reach/
    );
    // ...and the stop still completes, every command paid for by its own reservation.
    const done = (await pump(h.writer, result)).orThrow();
    expect(done.state).toBe('satisfied');
    for (const id of ['root', 'a', 'b', 'c', 'd', 'e']) {
      expect(await statusOf(h, id)).toBe('paused');
    }
    expect(committed(h.repository, 'logical-bytes')).toBeLessThanOrEqual(accepted);
    // The latch can be released at a full repository too.
    expect((await release(h, h.writer, done)).orThrow().state).toBe('released');
  });

  test('landing and confirming release the attempt reservations; release returns the rest', async () => {
    const h = await brokerHarness();
    await sixTargets(h);
    const before = committed(h.repository, 'logical-bytes');
    const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const accepted = committed(h.repository, 'logical-bytes');
    // Six attempt bundles and the intent's own headroom: the stop's reservation is by far its largest cost.
    expect(accepted - before).toBeGreaterThan(6 * defaultTaskCapacityProfile.encoded.maxStoredOperationBytes);
    const done = (await pump(h.writer, result)).orThrow();
    const confirmed = committed(h.repository, 'logical-bytes');
    expect(confirmed).toBeLessThan(accepted);
    (await release(h, h.writer, done)).orThrow();
    const released = committed(h.repository, 'logical-bytes');
    // What remains over the start is exactly what was written: the intent, and six stop commands.
    const used = h.repository
      .capacityStatus()
      .orThrow()
      .dimensions.find((d) => d.dimension === 'logical-bytes')!;
    expect(released).toBeLessThan(confirmed);
    expect(used.reserved).toBeLessThan(before);
  });

  test('a repository reopened mid-stop derives exactly the same ledger', async () => {
    const inner: FileTree.IFileTreeDirectoryItem = memoryRoot();
    const h = await brokerHarness({ root: inner, watch: true });
    await sixTargets(h);
    const result = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    // Some attempts land, the rest do not.
    (await pump(h.writer, result, 3)).orThrow();
    const before = h.repository.capacityStatus().orThrow();
    h.repository.close();
    const { env } = environment('cap');
    const opened = (
      await FileTreeTaskRepository.open({
        root: inner,
        mode: 'session',
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    const r = harnessOver(opened.state === 'ready' ? opened.repository : (undefined as never), env, inner);
    expect(r.repository.capacityStatus()).toSucceedWith(before);
    expect((await pump(r.writer, result)).orThrow().state).toBe('satisfied');
  });

  test('a target without an operation slot for its attempt refuses the stop before anything is written', async () => {
    const tight: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask: 5 }
    };
    const h = await brokerHarness({ profile: tight });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'a', { parentId: 'root' });
    // Creation plus two ordinary operations: with its closeout's two slots held, `a` is full.
    for (const title of ['one', 'two']) {
      const revision = (await h.repository.readCommit(tid('a'))).orThrow()!;
      (
        await h.writer.updateTracked({
          taskId: tid('a'),
          operationId: op(),
          expectedRevision:
            revision.recordType === 'resolved' ? revision.task.envelope.revision : (0 as never),
          patch: { title }
        })
      ).orThrow();
    }
    const refused = await stop(h, h.writer, 'root', 'pause');
    expect(refused).toFailWith(
      /a target of the stop has no room for its attempt \('operations'\); nothing was written/
    );
    expect(refused.isFailure() && refused.detail?.capacity?.dimension).toBe('operations');
    const root = (await h.repository.readCommit(tid('root'))).orThrow()!;
    expect(root.recordType === 'resolved' && root.stops).toBeUndefined();
  });

  test('subscriptions covering the targets are owed each stop effect, from the reservation', async () => {
    const h = await brokerHarness({ watch: true });
    await sixTargets(h);
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'cancel')).orThrow())).orThrow();
    expect(states(result)).toEqual({
      root: 'confirmed',
      a: 'confirmed',
      b: 'confirmed',
      c: 'confirmed',
      d: 'confirmed',
      e: 'confirmed'
    });
    const owed = (await h.repository.listOwed({ subscription: 'watcher' as never, limit: 200 })).orThrow();
    const cancelled = owed.updates.filter((u) => u.snapshot.envelope.lifecycle.status === 'cancelled');
    expect(new Set(cancelled.map((u) => u.taskId))).toEqual(new Set(['root', 'a', 'b', 'c', 'd', 'e']));
    expect((await persisted(h, result)).state).toBe('satisfied');
  });

  test('at saturation an accepted attempt settles, and a fresh attempt fails with a visible capacity blocker', async () => {
    const build = async (limit: number): Promise<ISourceHarness> => {
      const declared = new CapabilityScript();
      const h = await sourceHarness({ profile: withLogical(limit), capabilities: declared.ask });
      await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
      await node(h.writer, 'other', { stopPolicy: 'cascade-pause' });
      h.executor.addJob('job');
      await registerJob(h, 'job', { parentId: tid('root') });
      // The executor moves on unobserved: the conditional cancel's precondition will be stale.
      h.executor.change('job', (j) => {
        j.step = 1;
      });
      return h;
    };
    // Same-width limits keep the stored profile, and so the manifest, the same size.
    const probe = await build(9999999);
    (await stop(probe, probe.writer, 'root', 'cancel')).orThrow();
    const full = committed(probe.repository, 'logical-bytes');

    const h = await build(full);
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(committed(h.repository, 'logical-bytes')).toBe(full);
    const first = (await pump(h.writer, accepted)).orThrow();
    // The accepted attempt was sent and settled — refused on its precondition — from its reservation.
    expect(states(first)).toEqual({ root: 'confirmed', job: 'refused' });
    // Landing freed most of two attempt reservations; another stop takes that room, so a fresh attempt
    // has nothing left to be admitted from.
    (await stop(h, h.writer, 'other', 'pause')).orThrow();
    const second = (await pump(h.writer, accepted)).orThrow();
    expect(second.capacity).toMatchObject({ reason: 'capacity-exhausted' });
    expect(states(second).job).toBe('refused');
    expect((await persisted(h, second)).targets[1].attempt).toBe(1);
    expect(second.state).toBe('blocked');
  });

  test('under the default profile, 400 registered tasks admit a stop over at most 211 of them — bound by logical bytes', async () => {
    // Each target reserves one attempt bundle — 643,625 logical bytes — on top of the 976 KiB closeout
    // every registration already holds (T8b: 536 plain registrations, bound by logical bytes). Pinned by
    // search, not arithmetic: shrink the subtree one child at a time until the stop is admitted.
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    for (let i = 1; i < 400; i++) {
      await node(h.writer, `c${String(i).padStart(3, '0')}`, { parentId: 'root' });
    }
    let size = 400;
    let refusal: unknown;
    for (;;) {
      const attempt = await stop(h, h.writer, 'root', 'pause');
      if (attempt.isSuccess()) {
        expect(attempt.value.targets).toHaveLength(size);
        break;
      }
      refusal = attempt.detail?.capacity?.dimension;
      const child = `c${String(size - 1).padStart(3, '0')}`;
      const revision = (await h.repository.readCommit(tid(child))).orThrow()!;
      (
        await h.writer.reparent({
          taskId: tid(child),
          operationId: op(),
          expectedRevision:
            revision.recordType === 'resolved' ? revision.task.envelope.revision : (0 as never),
          parent: 'root'
        })
      ).orThrow();
      size--;
    }
    expect(refusal).toBe('logical-bytes');
    expect(size).toBe(211);
  }, 300000);
});
