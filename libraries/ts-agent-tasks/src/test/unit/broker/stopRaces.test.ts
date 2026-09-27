/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

// What a pump does when another caller moves the world between a check and the write that relies on
// it. Each race is driven deterministically: a policy hook that runs after a decision and before the
// writer section, or two callers queued on the one writer.

import '@fgv/ts-utils-jest';
import { ITaskAccessRequest } from '../../../index';
import { IBrokerHarness, ada, brokerHarness, op, revisionOf, tid } from '../../helpers/brokerFixtures';
import { ISourceHarness, recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';
import {
  CapabilityScript,
  node,
  persisted,
  pump,
  release,
  states,
  statusOf,
  stop
} from '../../helpers/stopFixtures';

/** Whether a policy request is `stop` coordination authority on one target. */
function stopOn(id: string): (r: ITaskAccessRequest) => boolean {
  return (r) => r.action === 'stop' && r.role === 'stop-target' && r.task?.envelope.id === id;
}

/** Runs `effect` once, on the `nth` request matching `when`. */
function onNth(
  h: { readonly policy: { afterDecision: ((r: ITaskAccessRequest) => void | Promise<void>) | undefined } },
  when: (r: ITaskAccessRequest) => boolean,
  nth: number,
  effect: () => void | Promise<void>
): void {
  let seen = 0;
  h.policy.afterDecision = async (r) => {
    if (when(r) && ++seen === nth) {
      await effect();
    }
  };
}

/** Removes any hook. */
function calm(h: { readonly policy: { afterDecision: unknown } }): void {
  h.policy.afterDecision = undefined;
}

async function nativeTree(): Promise<IBrokerHarness> {
  const h = await brokerHarness();
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  await node(h.writer, 'c', { parentId: 'root' });
  return h;
}

async function withJob(): Promise<ISourceHarness> {
  const h = await sourceHarness({ capabilities: new CapabilityScript().ask });
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  h.executor.addJob('job');
  await registerJob(h, 'job', { parentId: tid('root') });
  return h;
}

describe('a native target, raced', () => {
  test('released between authorization and the write: nothing is written, and the release stands', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    onNth(h, stopOn('c'), 1, async () => {
      (await release(h, h.writer, accepted)).orThrow();
    });
    const result = (await pump(h.writer, accepted)).orThrow();
    expect(result.state).toBe('released');
    expect(await statusOf(h, 'c')).toBe('pending');
    expect((await persisted(h, accepted)).targets[1].state).toBe('unexamined');
  });

  test('two pumps at once: one lands the command, the other finds it landed and confirms from it', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const [a, b] = await Promise.all([pump(h.writer, accepted), pump(h.writer, accepted)]);
    expect(states(a.orThrow())).toEqual({ root: 'confirmed', c: 'confirmed' });
    expect(states(b.orThrow())).toEqual({ root: 'confirmed', c: 'confirmed' });
    // One command per target: the second caller did not write another.
    const c = await recordOf(h, 'c');
    expect(c.operations.filter((o) => o.type === 'command')).toHaveLength(1);
  });

  test('reassigned between authorization and the write: refused as changed, and retried next pass', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    onNth(h, stopOn('c'), 1, async () => {
      (
        await h.writer.reassign({
          taskId: tid('c'),
          operationId: op(),
          expectedRevision: await revisionOf(h.repository, 'c'),
          responsibility: ada
        })
      ).orThrow();
    });
    const first = (await pump(h.writer, accepted)).orThrow();
    expect(first.state).toBe('pending');
    expect(await statusOf(h, 'c')).toBe('pending');
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
  });

  test('a policy that moved between authorization and the write: nothing is written, nothing recorded', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    onNth(h, stopOn('c'), 1, () => {
      h.policy.epoch = 'epoch-2';
    });
    const first = (await pump(h.writer, accepted)).orThrow();
    expect(first.state).toBe('pending');
    expect(await statusOf(h, 'c')).toBe('pending');
    // The pass's findings were decided under the old policy, so none of them were persisted.
    expect((await persisted(h, accepted)).targets.map((t) => t.state)).toEqual(['unexamined', 'unexamined']);
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
  });
});

describe('an external target, raced', () => {
  test('a policy that moved before the intent is recorded: no intent, no dispatch', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    onNth(h, stopOn('job'), 1, () => {
      h.policy.epoch = 'epoch-2';
    });
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('pending');
    const key = (await persisted(h, accepted)).targets[1].operationId;
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toBeUndefined();
    expect(h.executor.dispatches.size).toBe(0);
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
  });

  test('a policy that moved at the dispatch boundary: the intent stays unsent, and the next pass sends it', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    // The visit authorizes (1st), the dispatch boundary re-authorizes (2nd).
    onNth(h, stopOn('job'), 2, () => {
      h.policy.epoch = 'epoch-2';
    });
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('pending');
    const key = (await persisted(h, accepted)).targets[1].operationId;
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toMatchObject({
      dispatch: 'not-sent'
    });
    expect(h.executor.dispatches.size).toBe(0);
    // And again, on the resend of the recorded intent: still unsent.
    onNth(h, stopOn('job'), 2, () => {
      h.policy.epoch = 'epoch-3';
    });
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('pending');
    expect(h.executor.dispatches.size).toBe(0);
    calm(h);
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('an unsent stop command is never sent once its stop is released, even by host resolution', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    onNth(h, stopOn('job'), 2, () => {
      h.policy.epoch = 'epoch-2';
    });
    (await pump(h.writer, accepted)).orThrow();
    calm(h);
    (await release(h, h.writer, accepted)).orThrow();
    const report = (await h.writer.resolveCommands({ limit: 10 })).orThrow();
    expect(report.resolutions).toEqual([
      expect.objectContaining({ action: 'dispatched', result: { state: 'rejected', reason: 'conflict' } })
    ]);
    expect(h.executor.dispatches.size).toBe(0);
    expect(h.executor.jobs.get('job')!.lifecycle.status).toBe('running');
  });

  test('two pumps at once record one intent and send it once', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const [a, b] = await Promise.all([pump(h.writer, accepted), pump(h.writer, accepted)]);
    expect(a).toSucceed();
    expect(b).toSucceed();
    const key = (await persisted(h, accepted)).targets[1].operationId;
    expect(h.executor.dispatches.get(key)).toBe(1);
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
  });

  test('reassigned before the intent is recorded: refused as changed, and retried next pass', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    onNth(h, stopOn('job'), 1, async () => {
      (
        await h.writer.reassign({
          taskId: tid('job'),
          operationId: op(),
          expectedRevision: await revisionOf(h.repository, 'job'),
          responsibility: ada
        })
      ).orThrow();
    });
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('pending');
    expect(h.executor.dispatches.size).toBe(0);
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
  });

  test('two pumps superseding one refused attempt: the second finds it superseded and writes nothing', async () => {
    const h = await withJob();
    h.executor.change('job', (j) => {
      j.step = 3;
    });
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    const [a, b] = await Promise.all([pump(h.writer, accepted), pump(h.writer, accepted)]);
    expect(a).toSucceed();
    expect(b).toSucceed();
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(2);
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
  });
  test('a policy that moved before a supersession: the refused attempt stands, and no new one is made', async () => {
    const h = await withJob();
    h.executor.change('job', (j) => {
      j.step = 3;
    });
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    onNth(h, stopOn('job'), 1, () => {
      h.policy.epoch = 'epoch-2';
    });
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(1);
    calm(h);
    (await pump(h.writer, accepted)).orThrow();
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(2);
  });
  test('released before the intent is recorded: nothing is recorded or sent', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    onNth(h, stopOn('job'), 1, async () => {
      (await release(h, h.writer, accepted)).orThrow();
    });
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('released');
    const key = (await persisted(h, accepted)).targets[1].operationId;
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toBeUndefined();
    expect(h.executor.dispatches.size).toBe(0);
  });
});
