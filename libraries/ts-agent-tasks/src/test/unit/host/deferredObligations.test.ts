/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { Result, fail, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  DeferredObligations,
  FileTreeTaskRepository,
  IBoundTaskPage,
  IBoundTaskWriter,
  IDeferral,
  IDeferredObligation,
  IDeferredObligationsParams,
  PageCursor,
  ITaskAuthorization,
  ITaskHostWriteGuard,
  ITaskScope,
  TaskBroker,
  TaskConverters,
  TaskInspection,
  TaskId,
  TaskResult,
  TaskRevision,
  allTaskActions,
  defaultTaskCapacityProfile,
  trustedKindAuthority
} from '../../../index';
import { brokerRegistry } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  TestClock,
  clockedEnvironment,
  deliveryHarness
} from '../../helpers/deliveryFixtures';
import { FaultyRoot } from '../../helpers/faultyRoot';
import { memoryRoot } from '../../helpers/storageFixtures';

const deferral: ITaskScope = { namespace: 'kind', key: 'deferral' };
const room: ITaskScope = { namespace: 'room', key: 'r1' };
const roles: ReadonlyArray<string> = ['address', 'origin'];

const second: number = 1000;
const minute: number = 60 * second;

function authority(): ITaskAuthorization {
  return trustedKindAuthority({
    scopes: [deferral],
    scopeMatch: 'some',
    actions: allTaskActions,
    epoch: 'deferral-v1'
  }).orThrow();
}

function obligationsOver(
  h: IDeliveryHarness,
  extra?: Partial<IDeferredObligationsParams>
): DeferredObligations {
  return DeferredObligations.create({
    broker: h.broker,
    principal: 'host',
    authorization: authority(),
    scope: deferral,
    idPrefix: 'wake',
    roles,
    ...extra
  }).orThrow();
}

function deferralFor(h: IDeliveryHarness, changeRef: string, extra?: Partial<IDeferral>): IDeferral {
  return {
    key: { changeRef, role: 'address' },
    title: `deliver ${changeRef}`,
    notBefore: h.clock.now + 30 * second,
    scopes: [room],
    attention: [{ namespace: 'room', key: 'r1' }],
    ...extra
  };
}

async function deferred(obligations: DeferredObligations, request: IDeferral): Promise<IDeferredObligation> {
  const outcome = (await obligations.defer(request)).orThrow();
  if (outcome === 'settled') {
    throw new Error('expected a waiting obligation');
  }
  return outcome;
}

/** A broker whose bound writers answer `overrides` instead of their own methods. */
function brokerWith(h: IDeliveryHarness, overrides: Partial<IBoundTaskWriter>): TaskBroker {
  const broker: TaskBroker = Object.create(h.broker);
  broker.bind = (params) =>
    h.broker
      .bind(params)
      .onSuccess((writer) =>
        succeedWithDetail(Object.assign(Object.create(writer), overrides) as IBoundTaskWriter)
      );
  return broker;
}

async function revisionOf(h: IDeliveryHarness, id: string): Promise<number> {
  const read = (await h.repository.read(id as TaskId)).orThrow();
  return read?.state === 'resolved' ? read.task.envelope.revision : -1;
}

describe('DeferredObligations.create', () => {
  test('refuses malformed identity, codes, namespaces, schedule and budget', async () => {
    const h = await deliveryHarness();
    const base: IDeferredObligationsParams = {
      broker: h.broker,
      principal: 'host',
      authorization: authority(),
      scope: deferral,
      idPrefix: 'wake',
      roles
    };
    expect(DeferredObligations.create({ ...base, idPrefix: 'a:b' })).toFailWith(
      /idPrefix 'a:b' contains ':'/
    );
    expect(DeferredObligations.create({ ...base, idPrefix: '-x' })).toFailWith(/idPrefix/);
    expect(DeferredObligations.create({ ...base, roles: [] })).toFailWith(/roles is empty/);
    expect(DeferredObligations.create({ ...base, roles: ['a', 'a'] })).toFailWith(/roles repeat/);
    expect(DeferredObligations.create({ ...base, roles: ['a:b'] })).toFailWith(/role 'a:b' contains ':'/);
    expect(DeferredObligations.create({ ...base, codes: { merged: 'deferred' } })).toFailWith(
      /two reason codes are the same/
    );
    expect(DeferredObligations.create({ ...base, namespaces: { obligation: 'change' } })).toFailWith(
      /namespaces are the same/
    );
    expect(DeferredObligations.create({ ...base, schedule: { baseMs: 0 } })).toFailWith(/schedule/);
    expect(DeferredObligations.create({ ...base, schedule: { capMs: 1 } })).toFailWith(/schedule/);
    expect(DeferredObligations.create({ ...base, schedule: { maxDeferralMs: 1.5 } })).toFailWith(/schedule/);
    expect(DeferredObligations.create({ ...base, operationBudget: 3 })).toFailWith(/operationBudget/);
    expect(DeferredObligations.create({ ...base, principal: '' })).toFailWith(/DeferredObligations.create/);
    expect(
      DeferredObligations.create({ ...base, converters: TaskConverters.create().orThrow() })
    ).toSucceed();
  });
});

describe('DeferredObligations identity', () => {
  let h: IDeliveryHarness;
  let obligations: DeferredObligations;

  beforeEach(async () => {
    h = await deliveryHarness();
    obligations = obligationsOver(h);
  });

  test('maps (changeRef, role) to a deterministic id and back', () => {
    expect(obligations.taskIdFor({ changeRef: 'job.7:3', role: 'origin' })).toSucceedWith(
      'wake:origin:job.7:3' as TaskId
    );
    expect(obligations.keyOf('wake:origin:job.7:3' as TaskId)).toSucceedWith({
      changeRef: 'job.7:3',
      role: 'origin'
    });
  });

  test('two roles for one change never share an id', () => {
    const address = obligations.taskIdFor({ changeRef: 'c', role: 'address' }).orThrow();
    const origin = obligations.taskIdFor({ changeRef: 'c', role: 'origin' }).orThrow();
    expect(address).not.toBe(origin);
  });

  test('refuses undeclared roles, change refs that are not identifiers, and ids too long', () => {
    expect(obligations.taskIdFor({ changeRef: 'c', role: 'nobody' })).toFailWith(/not a declared role/);
    expect(obligations.taskIdFor({ changeRef: 'has space', role: 'address' })).toFailWith(
      /change 'has space'/
    );
    expect(obligations.taskIdFor({ changeRef: 'x'.repeat(120), role: 'address' })).toFailWith(/longer than/);
  });

  test('keyOf refuses ids it did not make', () => {
    expect(obligations.keyOf('other:address:c' as TaskId)).toFailWith(/not an obligation id/);
    expect(obligations.keyOf('wake:nobody:c' as TaskId)).toFailWith(/not an obligation id/);
    expect(obligations.keyOf('wake:address:' as TaskId)).toFailWith(/not an obligation id/);
    expect(obligations.keyOf('wake:address' as TaskId)).toFailWith(/not an obligation id/);
  });
});

describe('DeferredObligations.defer', () => {
  let h: IDeliveryHarness;
  let obligations: DeferredObligations;

  beforeEach(async () => {
    h = await deliveryHarness();
    obligations = obligationsOver(h);
  });

  test('creates the task, then waits on it with notBefore', async () => {
    const request = deferralFor(h, 'c1');
    expect(await obligations.stateOf(request.key)).toSucceedWith({ state: 'absent' });
    const waiting = await deferred(obligations, request);
    expect(waiting.taskId).toBe('wake:address:c1');
    expect(waiting.key).toEqual({ changeRef: 'c1', role: 'address' });
    expect(waiting.changes).toEqual(['c1']);
    expect(waiting.attention).toEqual([{ namespace: 'room', key: 'r1' }]);
    expect(waiting.notBefore).toBe(new Date(request.notBefore).toISOString());
    expect(waiting.reason.code).toBe('deferred');
    expect(waiting.revision).toBe(2);
    expect(waiting.waitsRemaining).toBe(128 - 2 - 2);
    const read = (await h.repository.read(waiting.taskId)).orThrow();
    expect(read?.state === 'resolved' && read.task.envelope.scopes).toEqual([deferral, room]);
    expect(await obligations.stateOf(request.key)).toSucceedAndSatisfy((state) => {
      expect(state.state === 'waiting' && state.obligation.taskId).toBe(waiting.taskId);
    });
  });

  test('a replayed deferral finds the waiting obligation and writes nothing', async () => {
    const first = await deferred(obligations, deferralFor(h, 'c1'));
    const again = await deferred(obligations, deferralFor(h, 'c1', { notBefore: h.clock.now + minute }));
    expect(again).toEqual(first);
    expect(await revisionOf(h, first.taskId)).toBe(2);
  });

  test('two roles for one change are two tasks', async () => {
    const address = await deferred(obligations, deferralFor(h, 'c1'));
    const origin = await deferred(
      obligations,
      deferralFor(h, 'c1', { key: { changeRef: 'c1', role: 'origin' } })
    );
    expect(address.taskId).not.toBe(origin.taskId);
    expect((await obligations.waiting()).orThrow().obligations.map((o) => o.taskId)).toEqual([
      'wake:address:c1',
      'wake:origin:c1'
    ]);
  });

  test('a settled obligation answers settled', async () => {
    const waiting = await deferred(obligations, deferralFor(h, 'c1'));
    expect(await obligations.succeed(waiting, 'delivered')).toSucceedWith(waiting.taskId);
    expect(await obligations.defer(deferralFor(h, 'c1'))).toSucceedWith('settled');
    expect(await obligations.stateOf(waiting.key)).toSucceedWith({
      state: 'settled',
      status: 'succeeded',
      archived: true
    });
  });

  test('refuses a deferral that cannot make a valid reason, writing nothing', async () => {
    expect(
      await obligations.defer(deferralFor(h, 'c1', { attention: [{ namespace: 'change', key: 'x' }] }))
    ).toFailWith(/may not use the change namespace/);
    expect(await obligations.defer(deferralFor(h, 'c2', { notBefore: -1 }))).toFailWith(/epoch milliseconds/);
    expect(
      await obligations.defer(deferralFor(h, 'c3', { key: { changeRef: 'c3', role: 'nobody' } }))
    ).toFailWith(/not a declared role/);
    // The first two created their tasks and stopped before the wait: they are pending, not lost.
    expect(await obligations.stateOf({ changeRef: 'c1', role: 'address' })).toSucceedAndSatisfy((state) => {
      expect(state.state).toBe('pending');
    });
  });

  test('a task that is not an obligation of this helper is refused, never adopted', async () => {
    const id = obligations.taskIdFor({ changeRef: 'c1', role: 'address' }).orThrow();
    const writer = h.broker
      .bind({ principal: 'host', scopes: [deferral], authorization: authority() })
      .orThrow();
    await writer.createTracked({ taskId: id, operationId: 'make-it' as never, title: 'not mine' });
    await writer.execute({
      taskId: id,
      operationId: 'start-it' as never,
      expectedRevision: 1 as TaskRevision,
      command: 'start',
      parameters: {}
    });
    expect(await obligations.defer(deferralFor(h, 'c1'))).toFailWith(/not a waiting obligation \(running\)/);
  });

  test('a principal the policy refuses cannot defer', async () => {
    const denied = obligationsOver(h, {
      authorization: trustedKindAuthority({ scopes: [deferral], actions: ['read'], epoch: 'r' }).orThrow()
    });
    expect(await denied.defer(deferralFor(h, 'c1'))).toFailWith(/creating wake:address:c1/);
  });

  test('a read failure that is not absence fails the deferral', async () => {
    const broken = obligationsOver(h, {
      broker: brokerWith(h, {
        inspect: async () =>
          failWithDetail('storage exploded', { code: 'invalid', retry: 'after-host-action' })
      })
    });
    expect(await broken.defer(deferralFor(h, 'c1'))).toFailWith(/reading wake:address:c1: storage exploded/);
    // An injected component that classifies nothing is never read as absence either.
    const unclassified = obligationsOver(h, {
      broker: brokerWith(h, {
        inspect: async () => fail('no detail at all') as unknown as TaskResult<never>
      })
    });
    expect(await unclassified.defer(deferralFor(h, 'c1'))).toFailWith(/reading wake:address:c1: no detail/);
  });

  test('defaults: no extra scopes, no host attention, a fixed summary', async () => {
    const plain = await deferred(obligations, {
      key: { changeRef: 'c1', role: 'origin' },
      title: 'plain',
      notBefore: h.clock.now
    });
    expect(plain.attention).toEqual([]);
    expect(plain.reason.summary).toBe('deferred until its recipient is available');
    const read = (await h.repository.read(plain.taskId)).orThrow();
    expect(read?.state === 'resolved' && read.task.envelope.scopes).toEqual([deferral]);
    const said = await deferred(obligations, deferralFor(h, 'c2', { summary: 'its room is busy' }));
    expect(said.reason.summary).toBe('its room is busy');
  });

  test('a wait that does not leave the task waiting is reported, not trusted', async () => {
    const hollow = obligationsOver(h, {
      broker: brokerWith(h, {
        execute: async (request) =>
          succeedWithDetail({
            taskId: request.taskId,
            operationId: request.operationId,
            command: request.command,
            result: { state: 'applied', appliedRevision: 2 as TaskRevision }
          })
      })
    });
    expect(await hollow.defer(deferralFor(h, 'c1'))).toFailWith(/wake:address:c1 is pending after its wait/);
  });
});

describe('DeferredObligations across a crash between create and wait', () => {
  async function faulted(): Promise<{
    readonly h: IDeliveryHarness;
    readonly faulty: FaultyRoot;
    readonly clock: TestClock;
  }> {
    const faulty = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const clock = new TestClock();
    const h = await deliveryHarness({ root: faulty as unknown as FileTree.IFileTreeDirectoryItem, clock });
    return { h, faulty, clock };
  }

  async function reopened(h: IDeliveryHarness, faulty: FaultyRoot): Promise<IDeliveryHarness> {
    h.repository.close().orThrow();
    const { env, logger } = clockedEnvironment(h.clock);
    const opened = (
      await FileTreeTaskRepository.open({
        root: faulty as unknown as FileTree.IFileTreeDirectoryItem,
        mode: 'session',
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    if (opened.state !== 'ready') {
      throw new Error('expected a ready repository');
    }
    const broker = TaskBroker.create({ repository: opened.repository, environment: env }).orThrow();
    return { ...h, repository: opened.repository, broker, env, logger };
  }

  test('the wait lost to a crash: a replay finds the same pending task and finishes it', async () => {
    const { h, faulty } = await faulted();
    const obligations = obligationsOver(h);
    // The second write of the task record is the wait: fail it, as a crash before it would.
    faulty.faults.push({ name: /^task-/, when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await obligations.defer(deferralFor(h, 'c1'))).toFailWith(/'wait' on wake:address:c1/);
    expect(await obligations.stateOf({ changeRef: 'c1', role: 'address' })).toSucceedAndSatisfy((state) => {
      expect(state.state).toBe('pending');
    });
    const r = await reopened(h, faulty);
    const replayed = await deferred(obligationsOver(r), deferralFor(r, 'c1'));
    expect(replayed.taskId).toBe('wake:address:c1');
    expect(replayed.revision).toBe(2);
    expect((await obligationsOver(r).waiting()).orThrow().obligations).toHaveLength(1);
  });

  test('the creation itself lost to a crash: a replay resumes the stored registration, then waits', async () => {
    const { h, faulty } = await faulted();
    const obligations = obligationsOver(h);
    faulty.faults.push({ name: /^task-/, when: 'before', visibility: 'unchanged' });
    expect(await obligations.defer(deferralFor(h, 'c1'))).toFailWith(/creating wake:address:c1/);
    const r = await reopened(h, faulty);
    expect(r.repository.pendingRegistration('wake:address:c1' as TaskId)).toSucceedAndSatisfy((pending) => {
      expect(pending?.taskId).toBe('wake:address:c1');
    });
    // A replay with another title still resumes what was stored: the stored request decides.
    const replayed = await deferred(obligationsOver(r), deferralFor(r, 'c1', { title: 'a different title' }));
    expect(replayed.revision).toBe(2);
    const read = (await r.repository.read(replayed.taskId)).orThrow();
    expect(read?.state === 'resolved' && read.task.envelope.title).toBe('deliver c1');
    expect(r.repository.pendingRegistration(replayed.taskId)).toSucceedWith(undefined);
  });
});

describe('DeferredObligations retries, discharge and sweeps', () => {
  let h: IDeliveryHarness;
  let obligations: DeferredObligations;

  beforeEach(async () => {
    h = await deliveryHarness();
    obligations = obligationsOver(h);
  });

  test('firstNotBefore and retry follow the schedule, and retry is pure', async () => {
    expect(obligations.firstNotBefore(1000)).toBe(31000);
    const waiting = await deferred(obligations, deferralFor(h, 'c1'));
    const created = Date.parse(waiting.createdAt);
    expect(obligations.retry(waiting, created + 10 * second)).toEqual({
      action: 'wait',
      notBefore: created + 10 * second + 30 * second
    });
    expect(obligations.retry(waiting, created + 2 * minute)).toEqual({
      action: 'wait',
      notBefore: created + 4 * minute
    });
    expect(obligations.retry(waiting, created + 5 * minute)).toEqual({
      action: 'hold',
      notBefore: created + 10 * minute
    });
    expect(obligations.retry({ ...waiting, waitsRemaining: 0 }, created + second)).toEqual({
      action: 'hold',
      notBefore: created + 31 * second
    });
    expect(obligations.retry(waiting, created + 24 * 60 * minute)).toEqual({ action: 'expire' });
    expect(await revisionOf(h, waiting.taskId)).toBe(2);
  });

  test('wait moves notBefore, keeps the changes, and refuses a stale revision', async () => {
    const waiting = await deferred(obligations, deferralFor(h, 'c1'));
    const later = (await obligations.wait(waiting, h.clock.now + minute)).orThrow();
    expect(later.revision).toBe(3);
    expect(later.notBefore).toBe(new Date(h.clock.now + minute).toISOString());
    expect(later.changes).toEqual(['c1']);
    expect(later.waitsRemaining).toBe(waiting.waitsRemaining - 1);
    // The same wait again writes nothing — not even an unchanged operation, which would spend budget.
    const operations = async (): Promise<number> =>
      (await h.repository.readCommit(waiting.taskId)).orThrow()!.operations.length;
    const before = await operations();
    expect(await obligations.wait(later, h.clock.now + minute)).toSucceedWith(later);
    expect(await revisionOf(h, waiting.taskId)).toBe(3);
    expect(await operations()).toBe(before);
    // A wait from the earlier read is refused on its revision.
    expect(await obligations.wait(waiting, h.clock.now + 2 * minute)).toFailWith(/'wait' on wake:address:c1/);
    // Attention and summary can change with the wait.
    const moved = (
      await obligations.wait(later, h.clock.now + minute, {
        attention: [{ namespace: 'room', key: 'r2' }],
        summary: 'moved rooms'
      })
    ).orThrow();
    expect(moved.attention).toEqual([{ namespace: 'room', key: 'r2' }]);
    expect(moved.reason.summary).toBe('moved rooms');
    expect(moved.changes).toEqual(['c1']);
  });

  test('wait refuses without writing once the operation budget is spent but for closeout', async () => {
    const small = obligationsOver(h, { operationBudget: 5 });
    const waiting = await deferred(small, deferralFor(h, 'c1'));
    expect(waiting.waitsRemaining).toBe(1);
    const last = (await small.wait(waiting, h.clock.now + minute)).orThrow();
    expect(last.waitsRemaining).toBe(0);
    expect(await small.wait(last, h.clock.now + 2 * minute)).toFailWith(/no waits left/);
    expect(await revisionOf(h, waiting.taskId)).toBe(3);
    // Closeout is still possible.
    expect(await small.cancel(last, 'gave up')).toSucceed();
  });

  test('the repository budget, not just the helper, is what a wait finally answers to', async () => {
    const tight = await deliveryHarness({
      profile: {
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask: 5 }
      }
    });
    // A helper told a larger budget than the repository holds is refused by the repository.
    const optimistic = obligationsOver(tight, { operationBudget: 50 });
    const waiting = await deferred(optimistic, deferralFor(tight, 'c1'));
    const next = (await optimistic.wait(waiting, tight.clock.now + minute)).orThrow();
    expect(await optimistic.wait(next, tight.clock.now + 2 * minute)).toFailWith(/held for closeout/);
    expect(await optimistic.cancel(next, 'closed out')).toSucceed();
  });

  test('wait refuses more changes than a reason can name', async () => {
    const waiting = await deferred(obligations, deferralFor(h, 'c1'));
    const many = Array.from({ length: 40 }, (unused, i) => `c${i}`);
    expect(await obligations.wait(waiting, h.clock.now, { changes: many })).toFailWith(/exceed the bound/);
    expect(await obligations.wait(waiting, h.clock.now, { changes: [] })).toFailWith(/at least one change/);
  });

  test('succeed and cancel settle and archive, naming the changes', async () => {
    const a = await deferred(obligations, deferralFor(h, 'a'));
    const b = await deferred(obligations, deferralFor(h, 'b'));
    expect(await obligations.succeed(a, 'delivered as turn 4')).toSucceedWith(a.taskId);
    expect(await obligations.cancel(b, 'its room is gone')).toSucceedWith(b.taskId);
    const read = (await h.repository.read(b.taskId)).orThrow();
    expect(read?.state === 'resolved' && read.archived).toBe(true);
    expect(read?.state === 'resolved' && read.task.envelope.lifecycle).toEqual({
      status: 'cancelled',
      reason: {
        code: 'undelivered',
        summary: 'its room is gone',
        attention: [{ namespace: 'change', key: 'b' }]
      }
    });
    expect((await obligations.waiting()).orThrow().obligations).toEqual([]);
  });

  test('merged cancels with a reference to the surviving obligation', async () => {
    const lead = await deferred(obligations, deferralFor(h, 'a'));
    const other = await deferred(obligations, deferralFor(h, 'b'));
    expect(await obligations.merged(other, lead)).toFailWith(/wake:address:a does not owe b/);
    expect(await obligations.merged(lead, lead)).toFailWith(/same obligation/);
    const grown = (await obligations.wait(lead, h.clock.now, { changes: ['a', 'b'] })).orThrow();
    expect(grown.changes).toEqual(['a', 'b']);
    expect(await obligations.merged(other, grown)).toSucceedWith(other.taskId);
    const read = (await h.repository.read(other.taskId)).orThrow();
    expect(read?.state === 'resolved' && read.task.envelope.lifecycle).toEqual({
      status: 'cancelled',
      reason: {
        code: 'merged',
        summary: `its changes are owed by ${lead.taskId}`,
        attention: [
          { namespace: 'obligation', key: lead.taskId },
          { namespace: 'change', key: 'b' }
        ]
      }
    });
    expect(await obligations.stateOf(other.key)).toSucceedAndSatisfy((state) => {
      expect(state.state).toBe('settled');
    });
  });

  test('merged decides on the survivor as it is now, not as the caller last read it', async () => {
    const lead = await deferred(obligations, deferralFor(h, 'a'));
    const other = await deferred(obligations, deferralFor(h, 'b'));
    // The caller's copy of the lead predates the wait that gave it b: the merge still goes through.
    (await obligations.wait(lead, h.clock.now, { changes: ['a', 'b'] })).orThrow();
    expect(await obligations.merged(other, lead)).toSucceedWith(other.taskId);
    // A survivor settled since it was read is refused, and nothing is cancelled.
    const third = await deferred(obligations, deferralFor(h, 'c'));
    const fresh = (await obligations.waiting()).orThrow().obligations.find((o) => o.key.changeRef === 'a')!;
    const grown = (await obligations.wait(fresh, h.clock.now, { changes: ['a', 'c'] })).orThrow();
    (await obligations.succeed(grown, 'delivered')).orThrow();
    expect(await obligations.merged(third, grown)).toFailWith(/wake:address:a is settled, not waiting/);
    expect(await obligations.stateOf(third.key)).toSucceedAndSatisfy((state) => {
      expect(state.state).toBe('waiting');
    });
  });

  test('a cancel whose archive fails is finished by retrying the same cancel', async () => {
    const waiting = await deferred(obligations, deferralFor(h, 'c1'));
    let refuse: boolean = true;
    const flaky = obligationsOver(h, {
      broker: brokerWith(h, {
        archive: async (request) =>
          refuse
            ? failWithDetail('archive refused', { code: 'storage-unavailable', retry: 'safe' })
            : h.broker
                .bind({ principal: 'host', scopes: [deferral], authorization: authority() })
                .orThrow()
                .archive(request)
      })
    });
    expect(await flaky.cancel(waiting, 'its room is gone')).toFailWith(
      /archiving wake:address:c1: archive refused/
    );
    expect(await flaky.stateOf(waiting.key)).toSucceedWith({
      state: 'settled',
      status: 'cancelled',
      archived: false
    });
    refuse = false;
    // The cancel replays its stored receipt (same task, same expected revision), then archives.
    expect(await flaky.cancel(waiting, 'its room is gone')).toSucceedWith(waiting.taskId);
    expect(await flaky.stateOf(waiting.key)).toSucceedWith({
      state: 'settled',
      status: 'cancelled',
      archived: true
    });
  });

  test('due answers only what is due, oldest notBefore first', async () => {
    const now = h.clock.now;
    await deferred(obligations, deferralFor(h, 'late', { notBefore: now + 10 * minute }));
    await deferred(obligations, deferralFor(h, 'soon', { notBefore: now + 2 * minute }));
    await deferred(obligations, deferralFor(h, 'sooner', { notBefore: now + minute }));
    expect((await obligations.due(now)).orThrow().obligations).toEqual([]);
    expect(
      (await obligations.due(now + 5 * minute)).orThrow().obligations.map((o) => o.key.changeRef)
    ).toEqual(['sooner', 'soon']);
    expect((await obligations.waiting()).orThrow().obligations).toHaveLength(3);
    expect(await obligations.due(-5)).toFailWith(/epoch milliseconds/);
  });

  test('due reads the due index, never the open listing', async () => {
    await deferred(obligations, deferralFor(h, 'c1', { notBefore: h.clock.now }));
    const query = jest.spyOn(h.repository, 'query');
    const queryDue = jest.spyOn(h.repository, 'queryDue');
    expect((await obligations.due(h.clock.now)).orThrow().obligations).toHaveLength(1);
    expect(queryDue).toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  test('listings report what does not read as an obligation without failing', async () => {
    await deferred(obligations, deferralFor(h, 'c1'));
    const writer = h.broker
      .bind({ principal: 'host', scopes: [deferral], authorization: authority() })
      .orThrow();
    await writer.createTracked({
      taskId: 'stray' as TaskId,
      operationId: 'stray-1' as never,
      title: 'stray'
    });
    await writer.execute({
      taskId: 'stray' as TaskId,
      operationId: 'stray-2' as never,
      expectedRevision: 1 as TaskRevision,
      command: 'wait',
      parameters: {
        reason: { code: 'deferred', summary: 's', attention: [{ namespace: 'change', key: 'x' }] }
      }
    });
    await writer.createTracked({
      taskId: 'wake:address:none' as TaskId,
      operationId: 'n-1' as never,
      title: 'n'
    });
    await writer.execute({
      taskId: 'wake:address:none' as TaskId,
      operationId: 'n-2' as never,
      expectedRevision: 1 as TaskRevision,
      command: 'wait',
      parameters: { reason: { code: 'deferred', summary: 's' } }
    });
    await writer.createTracked({
      taskId: 'wake:address:nb' as TaskId,
      operationId: 'nb-1' as never,
      title: 'nb'
    });
    await writer.execute({
      taskId: 'wake:address:nb' as TaskId,
      operationId: 'nb-2' as never,
      expectedRevision: 1 as TaskRevision,
      command: 'wait',
      parameters: {
        reason: { code: 'deferred', summary: 's', attention: [{ namespace: 'change', key: 'nb' }] }
      }
    });
    const listing = (await obligations.waiting()).orThrow();
    expect(listing.obligations.map((o) => o.taskId)).toEqual(['wake:address:c1', 'wake:address:nb']);
    expect(listing.obligations[1].notBefore).toBeUndefined();
    expect(listing.issues).toEqual([
      expect.stringMatching(/stray' is not an obligation id/),
      expect.stringMatching(/wake:address:none names no change/)
    ]);
  });

  test('a listing is not widened beyond the helper scope', async () => {
    await deferred(obligations, deferralFor(h, 'c1'));
    // A waiting task outside the helper's scope, written by another principal.
    await h.writer.createTracked({
      taskId: 'wake:address:x' as TaskId,
      operationId: 'x1' as never,
      title: 'x'
    });
    await h.writer.execute({
      taskId: 'wake:address:x' as TaskId,
      operationId: 'x2' as never,
      expectedRevision: 1 as TaskRevision,
      command: 'wait',
      parameters: {
        reason: {
          code: 'deferred',
          summary: 's',
          notBefore: new Date(h.clock.now).toISOString(),
          attention: [{ namespace: 'change', key: 'x' }]
        }
      }
    });
    expect((await obligations.waiting()).orThrow().obligations.map((o) => o.taskId)).toEqual([
      'wake:address:c1'
    ]);
    expect((await obligations.due(h.clock.now + 24 * 60 * minute)).orThrow().obligations).toHaveLength(1);
    expect(await obligations.stateOf({ changeRef: 'x', role: 'address' })).toSucceedWith({ state: 'absent' });
  });

  test('listings follow every page', async () => {
    const pageOf = (page: IBoundTaskPage, cursor: boolean): IBoundTaskPage => ({
      ...page,
      ...(cursor ? { nextCursor: 'more' as PageCursor } : {})
    });
    await deferred(obligations, deferralFor(h, 'c1', { notBefore: h.clock.now }));
    const view = h.broker
      .bind({ principal: 'host', scopes: [deferral], authorization: authority() })
      .orThrow();
    const paged = obligationsOver(h, {
      broker: brokerWith(h, {
        query: async (request) =>
          request.cursor === undefined
            ? (await view.query({ ...request })).onSuccess((page) => succeedWithDetail(pageOf(page, true)))
            : succeedWithDetail(pageOf({ ...(await view.query({})).orThrow(), items: [] }, false)),
        queryDue: async (request) =>
          request.cursor === undefined
            ? (await view.queryDue({ ...request })).onSuccess((page) => succeedWithDetail(pageOf(page, true)))
            : succeedWithDetail(pageOf({ ...(await view.query({})).orThrow(), items: [] }, false))
      })
    });
    expect((await paged.waiting()).orThrow().obligations).toHaveLength(1);
    expect((await paged.due(h.clock.now)).orThrow().obligations).toHaveLength(1);
  });

  test('abandonPending touches only tasks left pending before the cutoff', async () => {
    const id = (ref: string): string => `wake:address:${ref}`;
    const writer = h.broker
      .bind({ principal: 'host', scopes: [deferral, room], authorization: authority() })
      .orThrow();
    // Two interrupted deferrals, one old and one recent, beside a waiting obligation.
    await writer.createTracked({ taskId: id('old') as TaskId, operationId: 'o' as never, title: 'old' });
    await deferred(obligations, deferralFor(h, 'waiting'));
    h.clock.advance(10 * minute);
    const cutoff = h.clock.now;
    await writer.createTracked({
      taskId: id('recent') as TaskId,
      operationId: 'r' as never,
      title: 'recent'
    });
    await writer.createTracked({
      taskId: 'stray-pending' as TaskId,
      operationId: 's' as never,
      title: 'stray'
    });
    const swept = (await obligations.abandonPending(cutoff)).orThrow();
    expect(swept.done).toEqual([{ changeRef: 'old', role: 'address' }]);
    expect(swept.issues).toEqual([]);
    expect(await obligations.stateOf({ changeRef: 'old', role: 'address' })).toSucceedWith({
      state: 'settled',
      status: 'cancelled',
      archived: true
    });
    expect(await obligations.stateOf({ changeRef: 'recent', role: 'address' })).toSucceedAndSatisfy((s) => {
      expect(s.state).toBe('pending');
    });
    expect(await obligations.stateOf({ changeRef: 'waiting', role: 'address' })).toSucceedAndSatisfy((s) => {
      expect(s.state).toBe('waiting');
    });
    // A later cutoff reaches the recent one, and reports the stray it cannot name.
    const later = (await obligations.abandonPending(h.clock.now + second)).orThrow();
    expect(later.done).toEqual([{ changeRef: 'recent', role: 'address' }]);
    expect(later.issues).toEqual([expect.stringMatching(/stray-pending' is not an obligation id/)]);
    expect(await obligations.abandonPending(Number.NaN)).toFailWith(/epoch milliseconds/);
  });

  test('abandonPending leaves a task that was set waiting after it was listed', async () => {
    const writer = h.broker
      .bind({ principal: 'host', scopes: [deferral, room], authorization: authority() })
      .orThrow();
    await writer.createTracked({ taskId: 'wake:address:x' as TaskId, operationId: 'x' as never, title: 'x' });
    h.clock.advance(minute);
    // The replayed deferral lands after the listing, while the cancel is being authorized.
    const base = authority();
    let raced: boolean = false;
    const racing: ITaskAuthorization = {
      policyEpoch: () => base.policyEpoch(),
      check: async (request) => {
        if (!raced && request.action === 'command') {
          raced = true;
          await deferred(obligationsOver(h), deferralFor(h, 'x'));
        }
        return base.check(request);
      }
    };
    const sweeper = obligationsOver(h, { authorization: racing });
    const swept = (await sweeper.abandonPending(h.clock.now)).orThrow();
    expect(raced).toBe(true);
    expect(swept.done).toEqual([]);
    expect(swept.issues).toEqual([expect.stringMatching(/'cancel' on wake:address:x/)]);
    expect(await sweeper.stateOf({ changeRef: 'x', role: 'address' })).toSucceedAndSatisfy((s) => {
      expect(s.state).toBe('waiting');
    });
  });

  test('archiveSettled archives what was settled but not archived', async () => {
    const waiting = await deferred(obligations, deferralFor(h, 'c1'));
    const writer = h.broker
      .bind({ principal: 'host', scopes: [deferral], authorization: authority() })
      .orThrow();
    await writer.execute({
      taskId: waiting.taskId,
      operationId: 'settle-only' as never,
      expectedRevision: waiting.revision,
      command: 'succeed',
      parameters: { outcome: { summary: 'done', artifacts: [] } }
    });
    expect(await obligations.archiveSettled()).toSucceedWith({ done: [waiting.taskId], issues: [] });
    expect(await obligations.archiveSettled()).toSucceedWith({ done: [], issues: [] });
  });

  test('archiveSettled reports an archive that fails and carries on', async () => {
    const a = await deferred(obligations, deferralFor(h, 'a'));
    const b = await deferred(obligations, deferralFor(h, 'b'));
    const writer = h.broker
      .bind({ principal: 'host', scopes: [deferral], authorization: authority() })
      .orThrow();
    for (const o of [a, b]) {
      await writer.execute({
        taskId: o.taskId,
        operationId: `settle-${o.key.changeRef}` as never,
        expectedRevision: o.revision,
        command: 'cancel',
        parameters: { reason: { code: 'x', summary: 'x' } }
      });
    }
    const failing = obligationsOver(h, {
      broker: brokerWith(h, {
        archive: async (request) =>
          request.taskId === a.taskId
            ? failWithDetail('archive refused', { code: 'conflict', retry: 'safe' })
            : writer.archive(request)
      })
    });
    expect(await failing.archiveSettled()).toSucceedWith({
      done: [b.taskId],
      issues: [expect.stringMatching(/archiving wake:address:a: archive refused/)]
    });
  });

  test('an id that reads as an unresolved registration is refused', async () => {
    const odd = obligationsOver(h, {
      broker: brokerWith(h, {
        inspect: async () =>
          succeedWithDetail({ state: 'unresolved', reference: {} } as unknown as TaskInspection)
      })
    });
    expect(await odd.stateOf({ changeRef: 'c1', role: 'address' })).toFailWith(/is not a resolved task/);
  });

  test('a listing the repository keeps moving under fails after bounded rereads', async () => {
    const moved = async (): Promise<TaskResult<IBoundTaskPage>> =>
      failWithDetail('a task in this page changed', { code: 'conflict', retry: 'safe' });
    const moving = obligationsOver(h, { broker: brokerWith(h, { query: moved, queryDue: moved }) });
    expect(await moving.waiting()).toFailWith(/kept changing while it was read: a task in this page changed/);
    expect(await moving.due(h.clock.now)).toFailWith(/kept changing while it was read/);
    const refused = obligationsOver(h, {
      broker: brokerWith(h, {
        query: async () =>
          failWithDetail('denied', { code: 'not-found-or-denied', retry: 'after-host-action' })
      })
    });
    expect(await refused.waiting()).toFailWith(/listing waiting obligations: denied/);
  });
});

describe('DeferredObligations write guard', () => {
  test('every write goes through the guard, and a refusing guard writes nothing', async () => {
    const h = await deliveryHarness();
    const calls: string[] = [];
    let refuse: boolean = false;
    const guard: ITaskHostWriteGuard = {
      guard: async <T>(write: () => Promise<Result<T>>): Promise<Result<T>> => {
        calls.push('guard');
        return refuse ? fail<T>('paused') : write();
      }
    };
    const obligations = obligationsOver(h, { guard });
    const waiting = await deferred(obligations, deferralFor(h, 'c1'));
    const later = (await obligations.wait(waiting, h.clock.now + minute)).orThrow();
    await obligations.abandonPending(h.clock.now);
    await obligations.archiveSettled();
    expect(await obligations.merged(later, later)).toFail();
    await obligations.cancel(later, 'x');
    expect(calls).toHaveLength(6);
    refuse = true;
    expect(await obligations.defer(deferralFor(h, 'c2'))).toFailWith(/paused/);
    expect(await obligations.stateOf({ changeRef: 'c2', role: 'address' })).toSucceedWith({
      state: 'absent'
    });
    expect(await obligations.succeed(later, 'x')).toFailWith(/paused/);
    // Reads are not writes: they never pass the guard.
    calls.splice(0);
    await obligations.waiting();
    await obligations.due(h.clock.now);
    await obligations.stateOf({ changeRef: 'c1', role: 'address' });
    expect(calls).toEqual([]);
  });

  test('a guard that throws is a failure, not an exception', async () => {
    const h = await deliveryHarness();
    const obligations = obligationsOver(h, {
      guard: {
        guard: async () => {
          throw new Error('gate exploded');
        }
      }
    });
    expect(await obligations.defer(deferralFor(h, 'c1'))).toFailWith(/write guard threw: gate exploded/);
  });
});
