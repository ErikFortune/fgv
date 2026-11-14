/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { FileTreeTaskRepository, IStopResult, ITaskRepository } from '../../../index';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  IBrokerHarness,
  brokerHarness,
  brokerRegistry,
  command,
  harnessOver,
  op,
  tid
} from '../../helpers/brokerFixtures';
import {
  ISourceHarness,
  harnessWith,
  recordOf,
  registerJob,
  sourceHarness,
  sourceRegistry
} from '../../helpers/sourceFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';
import { CapabilityScript, node, persisted, pump, states, statusOf, stop } from '../../helpers/stopFixtures';

let reopens: number = 0;

async function reopenNative(
  h: IBrokerHarness,
  inner: FileTree.IFileTreeDirectoryItem
): Promise<IBrokerHarness> {
  h.repository.close();
  const { env } = environment(`r${++reopens}`);
  const opened = (
    await FileTreeTaskRepository.open({
      root: inner,
      mode: 'session',
      environment: env,
      registry: brokerRegistry()
    })
  ).orThrow();
  if (opened.state !== 'ready') {
    throw new Error('not ready');
  }
  return harnessOver(opened.repository, env, inner);
}

async function reopenSource(
  h: ISourceHarness,
  inner: FileTree.IFileTreeDirectoryItem
): Promise<ISourceHarness> {
  h.repository.close();
  const { env, logger } = environment(`r${++reopens}`);
  const opened = (
    await FileTreeTaskRepository.open({
      root: inner,
      mode: 'session',
      environment: env,
      registry: sourceRegistry(h.source)
    })
  ).orThrow();
  if (opened.state !== 'ready') {
    throw new Error('not ready');
  }
  return harnessWith(opened.repository, env, inner, logger, h.executor, h.source, h.registry);
}

/** How many stop commands of one intent a task's record holds. */
async function stopCommands(repository: ITaskRepository, id: string, intent: IStopResult): Promise<number> {
  const record = (await repository.readCommit(tid(id))).orThrow()!;
  return record.operations.filter((o) => o.type === 'command' && o.stop?.intentId === intent.intentId).length;
}

describe('stop crash windows and reopen', () => {
  test('after the intent: the reopened repository enforces the latch before any write, and the pump resumes', async () => {
    const inner = memoryRoot();
    const h = await brokerHarness({ root: inner });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'a', { parentId: 'root' });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const r = await reopenNative(h, inner);
    expect(r.repository.stopLatches(tid('a'))).toEqual([
      { rootId: 'root', intentId: accepted.intentId, mode: 'pause' }
    ]);
    expect(
      await r.writer.createTracked({ taskId: tid('n'), operationId: op(), title: 'n', parentId: tid('a') })
    ).toFailWith(/stop-active/);
    expect(await command(r, r.writer, 'a', 'start')).toMatchObject({ result: { reason: 'stop-active' } });
    expect((await pump(r.writer, accepted)).orThrow().state).toBe('satisfied');
  });

  test('after the child commits, before the root summary: recovered by the attempts keys, nothing resent', async () => {
    const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    const root = new FaultyRoot(inner);
    const h = await brokerHarness({ root: root as unknown as FileTree.IFileTreeDirectoryItem });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'a', { parentId: 'root' });
    await node(h.writer, 'b', { parentId: 'root' });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    // The root's own pause lands; its summary write, at the end of the pass, fails.
    root.faults.push({ name: 'task-root.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await pump(h.writer, accepted)).toFail();
    const r = await reopenNative(h, inner);
    for (const id of ['root', 'a', 'b']) {
      expect(await statusOf(r, id)).toBe('paused');
    }
    expect((await persisted(r, accepted)).targets.map((t) => t.state)).toEqual([
      'unexamined',
      'unexamined',
      'unexamined'
    ]);
    const done = (await pump(r.writer, accepted)).orThrow();
    expect(done.state).toBe('satisfied');
    for (const id of ['root', 'a', 'b']) {
      expect(await stopCommands(r.repository, id, accepted)).toBe(1);
    }
  });

  describe('an external target', () => {
    async function external(
      root: FaultyRoot,
      options?: { readonly lookup?: boolean }
    ): Promise<ISourceHarness & { readonly declared: CapabilityScript }> {
      const declared = new CapabilityScript();
      const h = await sourceHarness({
        root: root as unknown as FileTree.IFileTreeDirectoryItem,
        capabilities: declared.ask,
        ...(options?.lookup === true ? { lookup: true } : {})
      });
      await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
      h.executor.addJob('job');
      await registerJob(h, 'job', { parentId: tid('root') });
      return { ...h, declared };
    }

    test('after its command intent commits, before the send: sent once after reopen', async () => {
      const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
      const root = new FaultyRoot(inner);
      const h = await external(root);
      const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
      // The intent is written; the dispatch marker is not.
      root.faults.push({ name: 'task-job.json', when: 'before', visibility: 'unchanged', skip: 1 });
      expect(await pump(h.writer, accepted)).toFail();
      expect(h.executor.dispatches.size).toBe(0);
      const r = await reopenSource(h, inner);
      expect(
        (await recordOf(r, 'job')).operations.some((o) => o.type === 'command' && o.dispatch === 'not-sent')
      ).toBe(true);
      expect((await pump(r.writer, accepted)).orThrow().state).toBe('satisfied');
      expect(Array.from(h.executor.dispatches.values())).toEqual([1]);
      expect(h.executor.jobs.get('job')!.applied).toHaveLength(1);
    });

    test('after the effect, before its answer is recorded: resolved by the same key, never applied twice', async () => {
      const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
      const root = new FaultyRoot(inner);
      const h = await external(root, { lookup: true });
      const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
      root.faults.push({ name: 'task-job.json', when: 'before', visibility: 'unchanged', skip: 2 });
      expect(await pump(h.writer, accepted)).toFail();
      expect(h.executor.jobs.get('job')!.lifecycle.status).toBe('paused');
      const r = await reopenSource(h, inner);
      const target = (await persisted(r, accepted)).targets[1];
      expect(
        (await recordOf(r, 'job')).operations.find((o) => o.operationId === target.operationId)
      ).toMatchObject({
        dispatch: 'possibly-sent'
      });
      const done = (await pump(r.writer, accepted)).orThrow();
      expect(states(done).job).toBe('confirmed');
      expect(h.executor.jobs.get('job')!.applied).toEqual([`pause:${target.operationId}`]);
    });

    test('before satisfaction is presented again: stable-stop evidence is revalidated after reopen', async () => {
      const inner = memoryRoot();
      const h = await external(new FaultyRoot(inner as FileTree.IAtomicFileTreeDirectoryItem));
      const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
      expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
      const r = await reopenSource(h, inner);
      const inspect = async (): Promise<IStopResult> =>
        (await r.writer.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).orThrow();
      // Persisted satisfied, but this broker has not revalidated the source's contract.
      expect((await persisted(r, accepted)).state).toBe('satisfied');
      expect((await inspect()).state).toBe('pending');
      const asked = h.declared.calls;
      expect((await pump(r.writer, accepted)).orThrow().state).toBe('satisfied');
      expect(h.declared.calls).toBe(asked + 1);
      expect((await inspect()).state).toBe('satisfied');
    });

    test('a contract that changed across the restart withdraws the guarantee', async () => {
      const inner = memoryRoot();
      const h = await external(new FaultyRoot(inner as FileTree.IAtomicFileTreeDirectoryItem));
      const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
      (await pump(h.writer, accepted)).orThrow();
      const r = await reopenSource(h, inner);
      h.declared.declaration = {
        ...(h.declared.declaration as object),
        pause: 'sampled',
        contractVersion: 'v2'
      };
      const result = (await pump(r.writer, accepted)).orThrow();
      expect(states(result).job).toBe('unsupported');
      expect(result.state).toBe('blocked');
    });
  });
});
