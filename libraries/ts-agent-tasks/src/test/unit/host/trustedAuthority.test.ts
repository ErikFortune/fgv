/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  ITaskAccessRequest,
  ITaskAuthorization,
  ITaskScope,
  ITaskSummary,
  IUnresolvedTaskReference,
  TaskAction,
  TaskBroker,
  trackedTaskKind,
  trustedKindAuthority
} from '../../../index';
import { alpha, beta, brokerHarness, op, rev, tid, track } from '../../helpers/brokerFixtures';

const wake: ITaskScope = { namespace: 'kind', key: 'wake' };
const room: ITaskScope = { namespace: 'conversation', key: 'c1' };

/** An envelope-only summary carrying just what the authority reads. */
function task(kind: string, scopes: ReadonlyArray<ITaskScope>): ITaskSummary {
  return { envelope: { kind, scopes } } as unknown as ITaskSummary;
}

function reference(kind: string, scopes: ReadonlyArray<ITaskScope>): IUnresolvedTaskReference {
  return { kind, scopes } as unknown as IUnresolvedTaskReference;
}

async function allows(authority: ITaskAuthorization, request: ITaskAccessRequest): Promise<boolean> {
  return (await authority.check(request)).orThrow();
}

const every: ReadonlyArray<TaskAction> = ['read', 'create', 'subscribe', 'change-scopes', 'archive'];

describe('trustedKindAuthority', () => {
  test('permits only the listed actions, and reports its constant epoch', async () => {
    const authority = trustedKindAuthority({ kinds: ['k'], scopes: [alpha], actions: ['read'], epoch: 'v1' });
    expect(await allows(authority, { action: 'read', role: 'subject', task: task('k', [alpha]) })).toBe(true);
    expect(await allows(authority, { action: 'archive', role: 'subject', task: task('k', [alpha]) })).toBe(false);
    expect(authority.policyEpoch()).toBe('v1');
    expect(authority.policyEpoch()).toBe('v1');
  });

  test('a named task needs its kind listed and some of its own scopes allowed', async () => {
    const authority = trustedKindAuthority({ kinds: ['k'], scopes: [alpha], actions: every, epoch: 'v1' });
    const read = (summary: ITaskSummary): ITaskAccessRequest => ({ action: 'read', role: 'subject', task: summary });
    expect(await allows(authority, read(task('k', [alpha, beta])))).toBe(true);
    expect(await allows(authority, read(task('other', [alpha])))).toBe(false);
    expect(await allows(authority, read(task('k', [beta])))).toBe(false);
    // Any role: a parent is a named task too.
    expect(await allows(authority, { action: 'create', role: 'parent', task: task('k', [beta]) })).toBe(false);
    // An unresolved registration is decided the same way, from its reference.
    expect(await allows(authority, { action: 'read', role: 'subject', reference: reference('k', [alpha]) })).toBe(
      true
    );
    expect(await allows(authority, { action: 'read', role: 'subject', reference: reference('x', [alpha]) })).toBe(
      false
    );
  });

  test('without kinds any kind is covered; without scopes any scope a task carries is', async () => {
    const anyKind = trustedKindAuthority({ scopes: [alpha], actions: every, epoch: 'v1' });
    expect(await allows(anyKind, { action: 'read', role: 'subject', task: task('whatever', [alpha]) })).toBe(true);
    const anyScope = trustedKindAuthority({ kinds: ['k'], actions: every, epoch: 'v1' });
    expect(await allows(anyScope, { action: 'read', role: 'subject', task: task('k', [beta]) })).toBe(true);
  });

  test("a creation or subscription needs every requested scope allowed under the default 'every'", async () => {
    const authority = trustedKindAuthority({ kinds: ['k'], scopes: [alpha, beta], actions: every, epoch: 'v1' });
    expect(await allows(authority, { action: 'create', role: 'subject', scopes: [alpha] })).toBe(true);
    expect(await allows(authority, { action: 'subscribe', role: 'subject', scopes: [alpha, beta] })).toBe(true);
    expect(await allows(authority, { action: 'create', role: 'subject', scopes: [alpha, room] })).toBe(false);
    // Asking for nothing is never inside anything.
    expect(await allows(authority, { action: 'create', role: 'subject', scopes: [] })).toBe(false);
    // Naming nothing and asking for nothing: nothing to decide by.
    expect(await allows(authority, { action: 'create', role: 'subject' })).toBe(false);
  });

  test("'some' admits a creation that carries a per-instance scope beside the allowed one", async () => {
    const authority = trustedKindAuthority({ scopes: [wake], scopeMatch: 'some', actions: every, epoch: 'v1' });
    expect(await allows(authority, { action: 'create', role: 'subject', scopes: [wake, room] })).toBe(true);
    expect(await allows(authority, { action: 'create', role: 'subject', scopes: [room] })).toBe(false);
    expect(await allows(authority, { action: 'create', role: 'subject', scopes: [] })).toBe(false);
  });

  test('without scopes, a request that names no task is refused', async () => {
    const authority = trustedKindAuthority({ kinds: ['k'], actions: every, epoch: 'v1' });
    expect(await allows(authority, { action: 'create', role: 'subject', scopes: [alpha] })).toBe(false);
    expect(await allows(authority, { action: 'subscribe', role: 'subject', scopes: [alpha] })).toBe(false);
  });

  test('a scope change must keep the task inside: the task by some, its targets by scopeMatch', async () => {
    const authority = trustedKindAuthority({ kinds: ['k'], scopes: [alpha], actions: every, epoch: 'v1' });
    const change = (scopes: ReadonlyArray<ITaskScope>): ITaskAccessRequest => ({
      action: 'change-scopes',
      role: 'subject',
      task: task('k', [alpha]),
      scopes
    });
    expect(await allows(authority, change([alpha]))).toBe(true);
    expect(await allows(authority, change([beta]))).toBe(false);
    expect(await allows(authority, change([]))).toBe(false);
    // With no scope boundary configured, a named task's targets are not constrained.
    const kindOnly = trustedKindAuthority({ kinds: ['k'], actions: every, epoch: 'v1' });
    expect(await allows(kindOnly, change([beta]))).toBe(true);
  });

  test('its parameters are copied: changing the arrays afterwards changes nothing', async () => {
    const kinds = ['k'];
    const scopes = [alpha];
    const actions: TaskAction[] = ['read'];
    const authority = trustedKindAuthority({ kinds, scopes, actions, epoch: 'v1' });
    kinds.push('other');
    scopes.push(beta);
    actions.push('archive');
    expect(await allows(authority, { action: 'read', role: 'subject', task: task('other', [alpha]) })).toBe(false);
    expect(await allows(authority, { action: 'read', role: 'subject', task: task('k', [beta]) })).toBe(false);
    expect(await allows(authority, { action: 'archive', role: 'subject', task: task('k', [alpha]) })).toBe(false);
  });

  test('the two copies it replaces, each reproduced', async () => {
    // The ingestion catalog's: one kind, and a subscription over its kind scope and nothing else.
    const ingestion = { namespace: 'kind', key: 'ingestion' };
    const catalog = trustedKindAuthority({
      kinds: ['ingestion'],
      scopes: [ingestion],
      actions: every,
      epoch: 'hub-ingestion-v1'
    });
    expect(await allows(catalog, { action: 'subscribe', role: 'subject', scopes: [ingestion] })).toBe(true);
    expect(await allows(catalog, { action: 'subscribe', role: 'subject', scopes: [ingestion, room] })).toBe(false);
    // The wake tasks': tracked tasks carrying the wake scope, created beside a room scope.
    const wakes = trustedKindAuthority({
      kinds: [trackedTaskKind],
      scopes: [wake],
      scopeMatch: 'some',
      actions: every,
      epoch: 'hub-wake-v1'
    });
    expect(await allows(wakes, { action: 'create', role: 'subject', scopes: [wake, room] })).toBe(true);
    expect(await allows(wakes, { action: 'read', role: 'subject', task: task(trackedTaskKind, [wake, room]) })).toBe(
      true
    );
    expect(await allows(wakes, { action: 'read', role: 'subject', task: task('ingestion', [wake]) })).toBe(false);
  });

  test('through a broker: a trusted writer creates, reads and archives its own kind and scope only', async () => {
    const h = await brokerHarness({ scopes: [alpha, beta] });
    const broker: TaskBroker = h.broker;
    await track(h.writer, 'foreign');
    const writer = broker
      .bind({
        principal: 'host',
        scopes: [alpha, beta],
        creationScopes: [alpha],
        authorization: trustedKindAuthority({
          kinds: [trackedTaskKind],
          scopes: [alpha],
          actions: ['read', 'create'],
          epoch: 'host-v1'
        })
      })
      .orThrow();
    expect(await writer.createTracked({ taskId: tid('mine'), operationId: op('create-mine'), title: 'mine' })).toSucceed();
    expect(await writer.inspect(tid('mine'))).toSucceed();
    // 'archive' was not listed.
    expect(
      await writer.archive({ taskId: tid('mine'), operationId: op('archive-mine'), expectedRevision: rev(1) })
    ).toFailWithDetail(/not permitted|not found/, expect.objectContaining({ code: 'not-found-or-denied' }));
    // A creation outside its scope is refused.
    const outside = broker
      .bind({
        principal: 'host',
        scopes: [alpha, beta],
        creationScopes: [beta],
        authorization: trustedKindAuthority({ scopes: [alpha], actions: ['create'], epoch: 'host-v1' })
      })
      .orThrow();
    expect(
      await outside.createTracked({ taskId: tid('wide'), operationId: op('create-wide'), title: 'wide' })
    ).toFailWithDetail(/not permitted/, expect.objectContaining({ code: 'not-found-or-denied' }));
  });
});
