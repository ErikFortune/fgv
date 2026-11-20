/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IBrokerHarness,
  bindWriter,
  brokerHarness,
  command,
  op,
  registerVendor,
  revisionOf,
  tid
} from '../../helpers/brokerFixtures';
import { recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';
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

async function tree(h: IBrokerHarness): Promise<void> {
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  await node(h.writer, 'a', { parentId: 'root', stopPolicy: 'cascade-cancel' });
  await node(h.writer, 'c', { parentId: 'a' });
}

describe('releaseStop, overlap and settlement', () => {
  test('a pause is released with blockers standing; applied pauses are not undone and nothing resumes', async () => {
    const h = await brokerHarness();
    await tree(h);
    await registerVendor(h, 'v', { parentId: 'a' });
    const blocked = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(blocked.state).toBe('blocked');
    const released = (await release(h, h.writer, blocked)).orThrow();
    expect(released.state).toBe('released');
    for (const id of ['root', 'a', 'c']) {
      expect(await statusOf(h, id)).toBe('paused');
    }
    // A released stop is final: pumping it, or releasing it again, changes nothing.
    expect((await pump(h.writer, blocked)).orThrow().state).toBe('released');
    expect(await release(h, h.writer, blocked)).toFailWith(/already released/);
  });

  test('releasing one of several latches leaves the others enforced', async () => {
    const h = await brokerHarness();
    await tree(h);
    const outer = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const inner = (await stop(h, h.writer, 'a', 'pause')).orThrow();
    (await pump(h.writer, outer)).orThrow();
    (await release(h, h.writer, inner)).orThrow();
    expect(await command(h, h.writer, 'c', 'resume')).toMatchObject({ result: { reason: 'stop-active' } });
    (await release(h, h.writer, outer)).orThrow();
    expect(await command(h, h.writer, 'c', 'resume')).toMatchObject({ result: { state: 'applied' } });
  });

  test('a cancel never weakens: a pause beside it is independent, and cancellation satisfies the pause', async () => {
    const h = await brokerHarness();
    await tree(h);
    const pause = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const cancel = (await stop(h, h.writer, 'a', 'cancel')).orThrow();
    expect((await pump(h.writer, cancel)).orThrow().state).toBe('satisfied');
    const paused = (await pump(h.writer, pause)).orThrow();
    expect(paused.state).toBe('satisfied');
    expect(await statusOf(h, 'a')).toBe('cancelled');
    expect(await statusOf(h, 'root')).toBe('paused');
    // Releasing the pause leaves the cancel standing: its tree stays frozen.
    (await release(h, h.writer, paused)).orThrow();
    expect(
      await h.writer.createTracked({ taskId: tid('n'), operationId: op(), title: 'n', parentId: tid('root') })
    ).toSucceed();
    expect(await command(h, h.writer, 'root', 'resume')).toMatchObject({ result: { state: 'applied' } });
  });

  test('a cancel whose root is terminal cannot be released: that would reopen the tree', async () => {
    const h = await brokerHarness();
    await tree(h);
    const cancel = (await pump(h.writer, (await stop(h, h.writer, 'root', 'cancel')).orThrow())).orThrow();
    expect(await release(h, h.writer, cancel)).toFailWith(
      /cancel of a terminal root; releasing it would reopen/
    );
    // Before its root is terminal, a cancel can be released.
    const h2 = await brokerHarness();
    await tree(h2);
    const early = (await stop(h2, h2.writer, 'root', 'cancel')).orThrow();
    expect((await release(h2, h2.writer, early)).orThrow().state).toBe('released');
    expect(await statusOf(h2, 'root')).toBe('pending');
  });

  test('release authority, visibility, key replay and unknown intents', async () => {
    const h = await brokerHarness();
    await tree(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    h.policy.denyOn('release-stop', 'root');
    expect(await release(h, h.writer, accepted)).toFailWith(/'release-stop' is not permitted/);
    h.policy.deny.length = 0;
    expect(
      await h.writer.releaseStop({
        taskId: tid('root'),
        expectedRevision: 9 as never,
        operationId: op(),
        intentId: accepted.intentId
      })
    ).toFailWith(/expected revision 9/);
    const key = op('release');
    const released = (await release(h, h.writer, accepted, key)).orThrow();
    expect(await release(h, h.writer, accepted, key)).toSucceedWith(released);
    expect(await release(h, h.writer, { ...accepted, intentId: 'nope' as never })).toFailWith(
      /holds no stop nope/
    );
    const other = bindWriter(h, { principal: 'bob' });
    expect(await release(h, other, accepted, key)).toFailWith(/different request/);
    h.policy.hide('root');
    expect(await release(h, h.writer, accepted)).toFailWith(/not found or not visible/);
    expect(await h.writer.releaseStop({ taskId: tid('root') } as never)).toFailWith(/releaseStop/);
  });

  test('a pending pause released with a command in flight: the command settles, and is never resent', async () => {
    const declared = new CapabilityScript();
    const h = await sourceHarness({ capabilities: declared.ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    h.executor.answerIndeterminate = true;
    const accepted = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(states(accepted).job).toBe('indeterminate');
    const key = (await persisted(h, accepted)).targets[1].operationId;
    (await release(h, h.writer, accepted)).orThrow();
    h.executor.answerIndeterminate = false;
    // Release stops coordinated retries: the ordinary pump holds the stop's command rather than resend.
    (await h.writer.resolveCommands({ limit: 10 })).orThrow();
    expect(h.executor.dispatches.get(key)).toBe(1);
    const command = (await recordOf(h, 'job')).operations.find((o) => o.operationId === key);
    expect(command).toMatchObject({ type: 'command', stop: { intentId: accepted.intentId } });
  });

  test('archiving the root of a satisfied cancel settles it, keeping its report and the terminal graph', async () => {
    const h = await brokerHarness();
    await tree(h);
    const cancel = (await pump(h.writer, (await stop(h, h.writer, 'root', 'cancel')).orThrow())).orThrow();
    expect(cancel.state).toBe('satisfied');
    // A child cannot be archived before the stop settles; the root can.
    expect(
      await h.writer.archive({
        taskId: tid('c'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'c')
      })
    ).toFailWith(/must settle or be released first/);
    (
      await h.writer.archive({
        taskId: tid('root'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'root')
      })
    ).orThrow();
    const settled = await persisted(h, cancel);
    expect(settled.state).toBe('settled');
    expect(settled.targets.every((t) => t.state === 'confirmed')).toBe(true);
    // The children, terminal members of a terminal parent, stay put, and archive in their turn.
    const child = await recordOf(h, 'a');
    expect(child.recordType === 'resolved' && child.task.envelope.parentId).toBe('root');
    expect(
      await h.writer.archive({
        taskId: tid('c'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'c')
      })
    ).toSucceed();
    expect(
      await h.writer.createTracked({ taskId: tid('n'), operationId: op(), title: 'n', parentId: tid('a') })
    ).toFailWith(/terminal/);
  });

  test('a blocked cancel is never archived as a successful stop', async () => {
    const h = await brokerHarness();
    await tree(h);
    await registerVendor(h, 'v', { parentId: 'root' });
    const cancel = (await pump(h.writer, (await stop(h, h.writer, 'root', 'cancel')).orThrow())).orThrow();
    expect(cancel.state).toBe('blocked');
    expect(await statusOf(h, 'root')).toBe('cancelled');
    expect(
      await h.writer.archive({
        taskId: tid('root'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'root')
      })
    ).toFailWith(/stop .* is a blocked cancel; only a satisfied cancel settles/);
    expect((await persisted(h, cancel)).state).toBe('blocked');
  });

  test('a satisfied pause on a terminal root is released before its root is archived', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    const pause = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    await command(h, h.writer, 'root', 'cancel', { reason: { code: 'x', summary: 'x' } });
    const archive = async (): Promise<unknown> =>
      h.writer.archive({
        taskId: tid('root'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'root')
      });
    expect(await archive()).toFailWith(/satisfied pause; only a satisfied cancel settles/);
    (await release(h, h.writer, pause)).orThrow();
    expect(await archive()).toSucceed();
    expect((await persisted(h, pause)).state).toBe('released');
  });
});
