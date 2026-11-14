/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IStopResult } from '../../../index';
import { tid } from '../../helpers/brokerFixtures';
import {
  ISourceHarness,
  ISourceHarnessOptions,
  recordOf,
  registerJob,
  sourceHarness
} from '../../helpers/sourceFixtures';
import {
  CapabilityScript,
  node,
  persisted,
  pump,
  stableCapabilities,
  states,
  statusOf,
  stop
} from '../../helpers/stopFixtures';

interface IStopSourceHarness extends ISourceHarness {
  readonly declared: CapabilityScript;
}

/** A tracked root over one running job, the job's source declaring `declared`. */
async function withJob(
  options?: ISourceHarnessOptions & { readonly declare?: boolean }
): Promise<IStopSourceHarness> {
  const declared = new CapabilityScript();
  const h = await sourceHarness({
    ...options,
    ...(options?.declare === false ? {} : { capabilities: declared.ask })
  });
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  h.executor.addJob('job');
  await registerJob(h, 'job', { parentId: tid('root') });
  return { ...h, declared };
}

describe('reconcileStop — external targets', () => {
  test('a declared stable pause is sent, applied by the executor, and confirmed with its evidence', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(h.executor.dispatches.size).toBe(0);
    const done = (await pump(h.writer, accepted)).orThrow();
    expect(done.state).toBe('satisfied');
    expect(states(done)).toEqual({ root: 'confirmed', job: 'confirmed' });
    // The executor really paused: its own state, and its log of what it applied under which key.
    const job = h.executor.jobs.get('job')!;
    const target = (await persisted(h, done)).targets[1];
    expect(job.lifecycle.status).toBe('paused');
    expect(job.applied).toEqual([`pause:${target.operationId}`]);
    expect(target.stableSourceEvidence).toEqual({
      sourceId: 'exec',
      contractVersion: 'v1',
      sourceRevision: { epoch: 'e1', token: String(job.token) }
    });
    // The view never presents the evidence: it names source internals.
    expect(JSON.stringify(done)).not.toContain('contractVersion');
  });

  test('a receipt is not a stop: an accepted command stays pending until the executor applies it', async () => {
    const h = await withJob();
    h.executor.acceptOnly = true;
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const first = (await pump(h.writer, accepted)).orThrow();
    expect(states(first)).toEqual({ root: 'confirmed', job: 'pending' });
    expect(first.state).toBe('pending');
    expect(await statusOf(h, 'job')).toBe('running');
    // Still accepted-not-applied on the next pass: no elapsed time or repetition confirms it.
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('pending');
    h.executor.settleAccepted();
    const second = (await pump(h.writer, accepted)).orThrow();
    expect(states(second)).toEqual({ root: 'confirmed', job: 'confirmed' });
    expect(second.state).toBe('satisfied');
  });

  test('a sampled pause is observed, but held by nothing: the target blocks a standing guarantee', async () => {
    const h = await withJob();
    h.declared.declaration = { ...stableCapabilities(), pause: 'sampled' };
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(await statusOf(h, 'job')).toBe('paused');
    expect(states(result)).toEqual({ root: 'confirmed', job: 'unsupported' });
    expect(result.targets[1].confirmedRevision).toBeDefined();
    expect(result.state).toBe('blocked');
  });

  test('a source that declares nothing stops nothing; an observation-only child blocks', async () => {
    for (const options of [{ declare: false }, { observationOnly: true, declare: false }]) {
      const h = await withJob(options);
      const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'cancel')).orThrow())).orThrow();
      expect(states(result)).toEqual({ root: 'confirmed', job: 'unsupported' });
      expect(result.state).toBe('blocked');
      // The native root's cancel was applied and stays applied: no rollback.
      expect(await statusOf(h, 'root')).toBe('cancelled');
      expect(h.executor.jobs.get('job')!.lifecycle.status).toBe('running');
    }
  });

  test('a mode the source does not support, or a command its kind does not declare, is unsupported', async () => {
    const h = await withJob();
    h.declared.declaration = { ...stableCapabilities(), cancel: 'unsupported' };
    const cancel = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(states((await pump(h.writer, cancel)).orThrow()).job).toBe('unsupported');
    h.declared.declaration = { ...stableCapabilities(), cancelCommand: { command: 'abort', parameters: {} } };
    expect(states((await pump(h.writer, cancel)).orThrow()).job).toBe('unsupported');
    h.declared.declaration = {
      ...stableCapabilities(),
      cancelCommand: { command: 'cancel', parameters: { bad: 1 } }
    };
    expect(states((await pump(h.writer, cancel)).orThrow()).job).toBe('unsupported');
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a declaration that fails, throws or breaks the contract makes the target unavailable', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    for (const declaration of ['fail', 'throw', { pause: 'forever' }]) {
      h.declared.declaration = declaration;
      const result = (await pump(h.writer, accepted)).orThrow();
      expect(states(result).job).toBe('unavailable');
      expect(result.state).toBe('blocked');
    }
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a source that is not attached leaves its target unavailable, untouched', async () => {
    const h = await withJob({ attach: false });
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(states(result).job).toBe('unavailable');
    expect(h.declared.calls).toBe(0);
  });

  test('an uncertain dispatch keeps its key: the pump resolves it by the same key, never a new one', async () => {
    const h = await withJob({ lookup: true });
    h.executor.answerIndeterminate = true;
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const first = (await pump(h.writer, accepted)).orThrow();
    expect(states(first).job).toBe('indeterminate');
    expect(first.state).toBe('blocked');
    const key = (await persisted(h, first)).targets[1].operationId;
    h.executor.answerIndeterminate = false;
    const second = (await pump(h.writer, accepted)).orThrow();
    expect(states(second).job).toBe('confirmed');
    const target = (await persisted(h, second)).targets[1];
    expect(target.attempt).toBe(1);
    expect(target.operationId).toBe(key);
    // Resent under its own key: a pause deduplicates by key, so the executor applied it once.
    expect(h.executor.jobs.get('job')!.applied).toEqual([`pause:${key}`]);
  });

  test('a definitely rejected revision conflict gets a new persisted attempt with a new key and a fresh precondition', async () => {
    const h = await withJob();
    // The executor moves on without the broker observing: a conditional cancel's precondition is stale.
    h.executor.change('job', (j) => {
      j.step = 3;
    });
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    const first = (await pump(h.writer, accepted)).orThrow();
    expect(states(first).job).toBe('refused');
    const rejected = (await persisted(h, first)).targets[1];
    expect(rejected.attempt).toBe(1);
    const second = (await pump(h.writer, accepted)).orThrow();
    const retried = (await persisted(h, second)).targets[1];
    expect(retried.attempt).toBe(2);
    expect(retried.operationId).not.toBe(rejected.operationId);
    const third = (await pump(h.writer, accepted)).orThrow();
    expect(states(third).job).toBe('confirmed');
    expect(h.executor.jobs.get('job')!.lifecycle.status).toBe('cancelled');
    // Both attempts are the target's evidence; the first stays rejected under its own key.
    const record = await recordOf(h, 'job');
    const first1 = record.operations.find((o) => o.operationId === rejected.operationId);
    const second2 = record.operations.find((o) => o.operationId === retried.operationId);
    expect(first1).toMatchObject({ receipt: { result: { state: 'rejected', reason: 'conflict' } } });
    expect(second2).toMatchObject({ receipt: { result: { state: 'applied' } } });
  });

  test('an autonomous restart after a confirmed stable stop degrades the stop visibly, then re-stops under a new attempt', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    h.executor.change('job', (j) => {
      j.lifecycle = { status: 'running' };
    });
    (await h.broker.observe(tid('job'))).orThrow();
    // Before any pump runs, the presentation already refuses to overstate.
    const seen: IStopResult = (
      await h.writer.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })
    ).orThrow();
    expect(seen.state).toBe('blocked');
    expect(seen.targets[1]).toMatchObject({
      state: 'indeterminate',
      violation: { observedStatus: 'running' }
    });
    const repaired = (await pump(h.writer, accepted)).orThrow();
    const target = (await persisted(h, repaired)).targets[1];
    expect(target.attempt).toBe(2);
    expect(target.violation).toMatchObject({ observedStatus: 'running' });
    const again = (await pump(h.writer, accepted)).orThrow();
    expect(again.state).toBe('satisfied');
    expect(h.executor.jobs.get('job')!.lifecycle.status).toBe('paused');
    // The violation stays on the target: the degradation is durable, never silently erased.
    expect((await persisted(h, again)).targets[1].violation).toMatchObject({ observedStatus: 'running' });
  });

  test('a paused external target with a stable contract needs no command', async () => {
    const h = await withJob();
    h.executor.change('job', (j) => {
      j.lifecycle = { status: 'paused', reason: { code: 'manual', summary: 'paused by an operator' } };
    });
    (await h.broker.observe(tid('job'))).orThrow();
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(states(result).job).toBe('confirmed');
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a terminal external target is confirmed: terminal is absorbing in the broker', async () => {
    const h = await withJob({ declare: false });
    h.executor.change('job', (j) => {
      j.lifecycle = { status: 'failed', reason: { code: 'boom', summary: 'failed' } };
    });
    (await h.broker.observe(tid('job'))).orThrow();
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'cancel')).orThrow())).orThrow();
    expect(states(result).job).toBe('confirmed');
  });
});
