/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IBoundTaskWriter, ITaskAccessRequest, baselineUpdateId, TaskId, TaskRevision } from '../../../index';
import { TestPolicy, alpha, op, revisionOf, tid, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  allowEverything,
  deliveryHarness,
  deliveryOf,
  pendingIds,
  subscribed
} from '../../helpers/deliveryFixtures';

/**
 * The check-then-act windows between a per-task authorization decided outside the writer and the
 * commit that relies on it. A task's content can change what a policy answers without the policy's
 * epoch moving, so the section that commits re-reads every task it authorized.
 */

const secret: (request: ITaskAccessRequest) => boolean = (r) =>
  r.action === 'read' && (r.task?.envelope.title === 'secret' || r.reference?.title === 'secret');

async function retitle(
  h: IDeliveryHarness,
  host: IBoundTaskWriter,
  id: string,
  title: string
): Promise<void> {
  (
    await host.updateTracked({
      taskId: tid(id),
      operationId: op(),
      expectedRevision: await revisionOf(h.repository, id),
      patch: { title }
    })
  ).orThrow();
}

describe('acknowledge: a task reassigned between authorization and commit', () => {
  let h: IDeliveryHarness;
  let policy: TestPolicy;
  let host: IBoundTaskWriter;
  const owed: string = baselineUpdateId('t' as TaskId, 1 as TaskRevision);

  beforeEach(async () => {
    h = await deliveryHarness();
    policy = h.policy;
    policy.deny.push(secret);
    host = h.broker.bind({ principal: 'host', scopes: [alpha], authorization: allowEverything }).orThrow();
    await track(h.writer, 't');
    // Only the baseline category, so the retitle below owes nothing new.
    await subscribed(h, 'sub', { start: 'current', categories: ['attention', 'lifecycle', 'result'] });
  });

  function acknowledgeChecks(): number {
    return policy.calls.filter((c) => c.action === 'acknowledge' && c.task?.envelope.id === 't').length;
  }

  test('to where this principal may no longer see it: the retry re-authorizes and refuses', async () => {
    const delivery = deliveryOf(h, 'sub');
    const receipt = (await delivery.prepare()).orThrow().context.receipt;
    policy.afterDecision = async (request: ITaskAccessRequest) => {
      if (request.action === 'acknowledge') {
        policy.afterDecision = undefined;
        await retitle(h, host, 't', 'secret');
      }
    };
    expect(await delivery.acknowledge(receipt)).toFailWithDetail(
      /may not acknowledge/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    // Nothing was acknowledged on the strength of the stale decision.
    expect(await pendingIds(delivery)).toEqual([owed]);
  });

  test('to where it is still visible: the retry re-authorizes and acknowledges', async () => {
    const delivery = deliveryOf(h, 'sub');
    const receipt = (await delivery.prepare()).orThrow().context.receipt;
    policy.afterDecision = async (request: ITaskAccessRequest) => {
      if (request.action === 'acknowledge') {
        policy.afterDecision = undefined;
        await retitle(h, host, 't', 'renamed');
      }
    };
    expect(await delivery.acknowledge(receipt)).toSucceedAndSatisfy((ack) => {
      expect(ack.newlyAcknowledged).toEqual([owed]);
    });
    expect(acknowledgeChecks()).toBe(2);
  });

  test('on every attempt: bounded, then a safe conflict, acknowledging nothing', async () => {
    const delivery = deliveryOf(h, 'sub');
    const receipt = (await delivery.prepare()).orThrow().context.receipt;
    let n: number = 0;
    policy.afterDecision = async (request: ITaskAccessRequest) => {
      // The host writer's own checks go to another policy, so this hook never re-enters.
      if (request.action === 'acknowledge') {
        await retitle(h, host, 't', `renamed ${++n}`);
      }
    };
    expect(await delivery.acknowledge(receipt)).toFailWithDetail(
      /kept changing/i,
      expect.objectContaining({ code: 'conflict', retry: 'safe' })
    );
    expect(acknowledgeChecks()).toBe(3);
    expect(await pendingIds(delivery)).toEqual([owed]);
  });
});

describe('acknowledge: expiry is judged at the commit, not before authorization', () => {
  test('a receipt that expires while its tasks are being authorized is refused, and nothing is acknowledged', async () => {
    const h = await deliveryHarness();
    const policy: TestPolicy = h.policy;
    await track(h.writer, 't');
    await subscribed(h, 'sub', { start: 'current', categories: ['attention', 'lifecycle', 'result'] });
    const delivery = deliveryOf(h, 'sub');
    const prepared = (await delivery.prepare()).orThrow();
    let fired: boolean = false;
    policy.afterDecision = () => {
      // The clock passes the receipt's expiry while the authorization loop is in flight.
      if (!fired) {
        fired = true;
        h.clock.now = Date.parse(prepared.expiresAt) + 1;
      }
    };
    expect(await delivery.acknowledge(prepared.context.receipt)).toFailWithDetail(
      /expired/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    expect(fired).toBe(true);
    expect(await pendingIds(delivery)).toEqual([baselineUpdateId('t' as TaskId, 1 as TaskRevision)]);
  });
});

describe('prepare: a current task reassigned between capture and issue', () => {
  test('is recaptured, so the context never discloses the state the principal may no longer see', async () => {
    const h = await deliveryHarness();
    const policy: TestPolicy = h.policy;
    policy.deny.push(secret);
    const host = h.broker
      .bind({ principal: 'host', scopes: [alpha], authorization: allowEverything })
      .orThrow();
    await track(h.writer, 't');
    // From now: nothing owed, so `t` reaches the context only as a current task.
    await subscribed(h, 'sub', { categories: ['attention', 'lifecycle', 'result'] });
    const delivery = deliveryOf(h, 'sub');
    let fired: boolean = false;
    policy.afterDecision = async (request: ITaskAccessRequest) => {
      if (!fired && request.action === 'read' && request.task?.envelope.id === 't') {
        fired = true;
        policy.afterDecision = undefined;
        await retitle(h, host, 't', 'secret');
      }
    };
    const prepared = (await delivery.prepare()).orThrow();
    expect(fired).toBe(true);
    expect(prepared.context.receipt.included.map((e) => e.taskId)).toEqual([]);
  });

  test('a current task still visible after the change is presented at its new revision', async () => {
    const h = await deliveryHarness();
    const policy: TestPolicy = h.policy;
    const host = h.broker
      .bind({ principal: 'host', scopes: [alpha], authorization: allowEverything })
      .orThrow();
    await track(h.writer, 't');
    await subscribed(h, 'sub', { categories: ['attention', 'lifecycle', 'result'] });
    const delivery = deliveryOf(h, 'sub');
    let fired: boolean = false;
    policy.afterDecision = async (request: ITaskAccessRequest) => {
      if (!fired && request.action === 'read' && request.task?.envelope.id === 't') {
        fired = true;
        policy.afterDecision = undefined;
        await retitle(h, host, 't', 'renamed');
      }
    };
    const prepared = (await delivery.prepare()).orThrow();
    expect(prepared.context.receipt.included.map((e) => [e.taskId, e.revision])).toEqual([['t', 2]]);
  });
});
