/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  IBoundTaskWriter,
  IProjectedTaskEnvelope,
  ITaskAuthorization,
  ITaskProjector,
  PageCursor,
  TaskBroker,
  TaskResult,
  defaultTaskProjector
} from '../../../index';
import {
  IBrokerHarness,
  TestPolicy,
  alpha,
  ada,
  beta,
  bindWriter,
  brokerHarness,
  gamma,
  op,
  registerVendor,
  rev,
  revisionOf,
  succeedTask,
  tid,
  track
} from '../../helpers/brokerFixtures';
import { environment, registry } from '../../helpers/storageFixtures';

/** The failure's code and its message with the id replaced, for comparing two refusals. */
function shape<T>(result: TaskResult<T>, id: string): { code: string | undefined; message: string } {
  expect(result).toFail();
  return {
    code: result.isFailure() ? result.detail?.code : undefined,
    message: result.isFailure() ? result.message.split(id).join('<id>') : ''
  };
}

describe('visibility: scopes and policy, both required', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness({ scopes: [alpha, beta] });
    await track(h.writer, 'visible');
    await track(h.writer, 'hidden');
    h.policy.hide('hidden');
  });

  test('a hidden task and a foreign id fail identically, on every entry point', async () => {
    const other = bindWriter(h, { scopes: [alpha], principal: 'alice' });
    const attempts: Array<(id: string) => Promise<TaskResult<unknown>>> = [
      (id) => other.inspect(tid(id)),
      (id) =>
        other.execute({
          taskId: tid(id),
          operationId: op(),
          expectedRevision: rev(1),
          command: 'start',
          parameters: {}
        }),
      (id) =>
        other.reassign({ taskId: tid(id), operationId: op(), expectedRevision: rev(1), responsibility: ada }),
      (id) =>
        other.updateTracked({
          taskId: tid(id),
          operationId: op(),
          expectedRevision: rev(1),
          patch: { title: 'x' }
        }),
      (id) =>
        other.changeScopes({ taskId: tid(id), operationId: op(), expectedRevision: rev(1), add: [alpha] }),
      (id) =>
        other.reparent({ taskId: tid(id), operationId: op(), expectedRevision: rev(1), parent: 'root' }),
      (id) => other.archive({ taskId: tid(id), operationId: op(), expectedRevision: rev(1) }),
      (id) =>
        other.completeList({
          taskId: tid(id),
          operationId: op(),
          expectedRevision: rev(1),
          outcome: { summary: 's', artifacts: [] }
        })
    ];
    for (const attempt of attempts) {
      const hidden = shape(await attempt('hidden'), 'hidden');
      const foreign = shape(await attempt('no-such-task'), 'no-such-task');
      expect(hidden).toEqual(foreign);
      expect(hidden.code).toBe('not-found-or-denied');
    }
  });

  test('a task outside the view is invisible even when the policy would allow it (gamma view)', async () => {
    const betaOnly = await h.writer.createTracked({ taskId: tid('b1'), operationId: op(), title: 'b' });
    expect(betaOnly).toSucceed();
    const alphaView = h.broker
      .bindView({ principal: 'carol', scopes: [gamma], authorization: h.policy })
      .orThrow();
    expect(await alphaView.inspect(tid('b1'))).toFailWith(/not found or not visible/);
    expect(await alphaView.query({})).toSucceedWith(
      expect.objectContaining({ items: [], completeness: 'complete', issues: [] })
    );
  });

  test('a query drops denied candidates before inclusion and reports no counts or generation', async () => {
    expect(await h.writer.query({})).toSucceedAndSatisfy((page) => {
      expect(page.items.map((i) => i.envelope.id)).toEqual(['visible']);
      expect(page.completeness).toBe('complete');
      expect(page.issues).toEqual([]);
      expect(Object.keys(page).sort()).toEqual([
        'completeness',
        'freshness',
        'issues',
        'items',
        'unresolved'
      ]);
    });
  });

  test('a page whose candidates are all denied is empty but keeps a cursor', async () => {
    await track(h.writer, 'hidden2');
    h.policy.hide('hidden2');
    // Ordered by id: hidden, hidden2, visible.
    expect(await h.writer.query({ limit: 2 })).toSucceedAndSatisfy((page) => {
      expect(page.items).toEqual([]);
      expect(page.nextCursor).toBeDefined();
    });
  });

  test('policy failures and throws are denials, reported to the host logger only', async () => {
    const throwing: ITaskAuthorization = {
      check: async () => {
        throw new Error('policy store down');
      },
      policyEpoch: () => 'e'
    };
    const failing: ITaskAuthorization = { check: async () => fail('no answer'), policyEpoch: () => 'e' };
    for (const authorization of [throwing, failing]) {
      const view = h.broker.bindView({ principal: 'dave', scopes: [alpha], authorization }).orThrow();
      expect(await view.inspect(tid('visible'))).toFailWith(/not found or not visible/);
      expect(await view.query({})).toSucceedWith(expect.objectContaining({ items: [] }));
    }
    expect(h.logger.logged.some((line) => /treated as a denial/.test(line))).toBe(true);
  });

  test('a policy epoch that cannot be read fails the operation', async () => {
    const broken: ITaskAuthorization = {
      check: async () => succeed(true),
      policyEpoch: () => {
        throw new Error('no epoch');
      }
    };
    const writer = bindWriter(h, { authorization: broken });
    expect(await writer.query({})).toFailWith(/policy epoch unavailable/);
    expect(
      await writer.reassign({
        taskId: tid('visible'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: ada
      })
    ).toFailWith(/policy epoch unavailable/);
  });

  test('the policy sees envelopes only, never details, and a role for every task it is asked about', async () => {
    h.policy.calls.splice(0);
    await h.writer.inspect(tid('visible'));
    expect(h.policy.calls.length).toBeGreaterThan(0);
    for (const call of h.policy.calls) {
      expect(Object.keys(call.task!).sort()).toEqual(['envelope']);
      expect(call.role).toBe('subject');
    }
  });
});

describe('fabricated principals and scope filters', () => {
  test('a request cannot name a principal; operations are recorded under the bound one', async () => {
    const h = await brokerHarness();
    const request = { taskId: tid('t1'), operationId: op(), title: 't', principal: 'root' };
    expect(await h.writer.createTracked(request as never)).toFailWith(/principal/);
    await track(h.writer, 't1');
    const record = (await h.repository.readCommit(tid('t1'))).orThrow()!;
    expect(record.operations[0].principalKey).toBe('alice');
    expect(
      await h.writer.reassign({
        taskId: tid('t1'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: ada,
        principal: 'root'
      } as never)
    ).toFailWith(/principal/);
  });

  test('a query cannot widen its scopes; the filter only narrows', async () => {
    const h = await brokerHarness({ scopes: [alpha] });
    expect(await h.writer.query({ filter: { scopes: [beta] } } as never)).toFailWith(/scopes/);
    expect(await h.writer.query({ scopes: [beta] } as never)).toFailWith(/scopes/);
    await track(h.writer, 'a', { responsibility: ada });
    await track(h.writer, 'b');
    expect(await h.writer.query({ filter: { responsibility: ada } })).toSucceedAndSatisfy((page) => {
      expect(page.items.map((i) => i.envelope.id)).toEqual(['a']);
    });
  });

  test('a view is bound to valid host parameters', async () => {
    const h = await brokerHarness();
    expect(h.broker.bind({ principal: '', scopes: [alpha], authorization: h.policy })).toFailWith(
      /principal/
    );
    expect(
      h.broker.bind({ principal: 'p', scopes: [alpha], creationScopes: [beta], authorization: h.policy })
    ).toFailWith(/outside the view/);
  });

  test('a view with no creation scopes cannot create', async () => {
    const h = await brokerHarness();
    const writer = bindWriter(h, { creationScopes: [] });
    expect(await writer.createTracked({ taskId: tid('x'), operationId: op(), title: 'x' })).toFailWith(
      /no creation scopes/
    );
  });

  test('a read-only view has no mutation method at all', async () => {
    const h = await brokerHarness();
    const view = h.broker
      .bindView({ principal: 'reader', scopes: [alpha], authorization: h.policy })
      .orThrow();
    for (const method of ['execute', 'createTracked', 'reassign', 'reparent', 'archive', 'completeList']) {
      expect(method in view).toBe(false);
    }
    expect(view.principal).toBe('reader');
  });
});

describe('projection: fail closed, never fall back', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    await registerVendor(h, 'v1', {
      lifecycle: {
        status: 'succeeded',
        outcome: { summary: 's', artifacts: [{ namespace: 'doc', key: 'secret' }] }
      }
    });
  });

  test('the default projection strips the binding and outcome artifacts, and shows no details', async () => {
    expect(await h.writer.inspect(tid('v1'))).toSucceedAndSatisfy((inspection) => {
      expect(inspection.state).toBe('resolved');
      if (inspection.state === 'resolved') {
        expect('binding' in inspection.envelope).toBe(false);
        expect(inspection.envelope.lifecycle).toEqual({
          status: 'succeeded',
          outcome: { summary: 's', artifacts: [] }
        });
        expect('details' in inspection).toBe(false);
        // An external task's commands are its source's (T6).
        expect(inspection.commands).toEqual([]);
      }
    });
    expect(await h.writer.query({})).toSucceedAndSatisfy((page) => {
      expect(page.items.every((i) => !('binding' in i.envelope))).toBe(true);
      expect(page.freshness).toBe('source-projection');
    });
  });

  const projectors: ReadonlyArray<[string, ITaskProjector]> = [
    ['fails', { envelope: () => fail('projector refused') }],
    [
      'throws',
      {
        envelope: () => {
          throw new Error('projector crashed');
        }
      }
    ],
    [
      'adds the binding back',
      {
        envelope: (e) =>
          succeed({
            ...e,
            binding: { sourceId: 'x', referenceVersion: 1, reference: {} }
          } as IProjectedTaskEnvelope)
      }
    ],
    [
      'describes another task',
      { envelope: (e) => defaultTaskProjector.envelope({ ...e, id: tid('other') }) }
    ],
    [
      'describes another revision',
      { envelope: (e) => defaultTaskProjector.envelope({ ...e, revision: rev(e.revision + 1) }) }
    ]
  ];

  test.each(projectors)(
    'a projector that %s fails the call, with nothing returned in its place',
    async (__name, projector) => {
      const writer = bindWriter(h, { projector });
      expect(await writer.inspect(tid('t1'))).toFailWith(/projection failed.*no unprojected data/);
      expect(await writer.query({})).toFailWith(/projection failed/);
    }
  );

  test('a details projection is the only way details appear, and its failure fails the call', async () => {
    const withDetails = bindWriter(h, {
      projector: {
        envelope: defaultTaskProjector.envelope,
        details: (s) => succeed({ shown: s.envelope.id })
      }
    });
    expect(await withDetails.inspect(tid('v1'))).toSucceedAndSatisfy((inspection) => {
      expect(inspection.state === 'resolved' && inspection.details).toEqual({ shown: 'v1' });
    });
    const failingDetails = bindWriter(h, {
      projector: { envelope: defaultTaskProjector.envelope, details: () => fail('no details for you') }
    });
    expect(await failingDetails.inspect(tid('v1'))).toFailWith(/details: projection failed/);
  });

  test('an unresolved registration is projected without its binding', async () => {
    await registerVendor(h, 'u1', { unresolved: true });
    expect(await h.writer.inspect(tid('u1'))).toSucceedAndSatisfy((inspection) => {
      expect(inspection.state).toBe('unresolved');
      expect(inspection.state === 'unresolved' && 'binding' in inspection.reference).toBe(false);
    });
    expect(await h.writer.query({})).toSucceedAndSatisfy((page) => {
      expect(page.unresolved.map((u) => u.id)).toEqual(['u1']);
      expect(page.completeness).toBe('partial');
    });
    h.policy.hide('u1');
    expect(await h.writer.query({})).toSucceedAndSatisfy((page) => {
      expect(page.unresolved).toEqual([]);
      expect(page.completeness).toBe('complete');
    });
  });

  test('a broker whose converters are stricter than the stored data fails projection rather than truncating', async () => {
    const long = 'x'.repeat(200);
    await h.writer.createTracked({ taskId: tid('long'), operationId: op(), title: long });
    await registerVendor(h, 'u2', { unresolved: true });
    const strict = (await import('../../../index')).TaskConverters.create({
      bounds: { maxTitleLength: 100 }
    }).orThrow();
    const broker = TaskBroker.create({
      repository: h.repository,
      environment: h.env,
      converters: strict
    }).orThrow();
    const view = broker.bindView({ principal: 'p', scopes: [alpha], authorization: h.policy }).orThrow();
    expect(await view.inspect(tid('long'))).toFailWith(/projection failed/);
    // A reference title of 'vendor u2' fits; one that does not also fails closed.
    await h.broker.registerExternal('host', {
      taskId: tid('u3'),
      operationId: op(),
      kind: 'acme.job',
      detailVersion: 1,
      title: long,
      scopes: [alpha],
      binding: { sourceId: 'acme', referenceVersion: 1, reference: { job: 'u3' } },
      recovery: 'reattach'
    });
    expect(await view.inspect(tid('u3'))).toFailWith(/projection failed/);
  });
});

describe('policy revocation between check and commit', () => {
  test('an epoch change after authorization refuses the commit and changes nothing', async () => {
    const h = await brokerHarness();
    const policy: TestPolicy = h.policy;
    await track(h.writer, 't1');
    policy.afterDecision = (request) => {
      if (request.action === 'reassign') {
        // The host revokes, and bumps its epoch, after answering this check but before commit.
        h.policy.epoch = 'epoch-2';
        h.policy.denyOn('reassign', 't1');
      }
    };
    const outcome = await h.writer.reassign({
      taskId: tid('t1'),
      operationId: op(),
      expectedRevision: rev(1),
      responsibility: ada
    });
    expect(outcome).toFailWith(/authorization policy changed after the operation was authorized/);
    expect(outcome.isFailure() && outcome.detail?.code).toBe('conflict');
    expect(await revisionOf(h.repository, 't1')).toBe(1);
    policy.afterDecision = undefined;
    // The retry re-authorizes under the new policy, which now denies it.
    expect(
      await h.writer.reassign({
        taskId: tid('t1'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: ada
      })
    ).toFailWith(/'reassign' is not permitted/);
  });

  test('the same holds for commands, creation and relationship changes', async () => {
    const h = await brokerHarness();
    await track(h.writer, 'p');
    await track(h.writer, 'c');
    const bumpOn = (action: string): void => {
      h.policy.afterDecision = (request) => {
        if (request.action === action) {
          h.policy.epoch = `${h.policy.epoch}+`;
        }
      };
    };
    bumpOn('command');
    const receipt = await h.writer.execute({
      taskId: tid('c'),
      operationId: op(),
      expectedRevision: rev(1),
      command: 'start',
      parameters: {}
    });
    expect(receipt).toFailWith(/changed after the operation was authorized/);
    bumpOn('create');
    expect(await h.writer.createTracked({ taskId: tid('n'), operationId: op(), title: 'n' })).toFailWith(
      /changed after/
    );
    bumpOn('reparent');
    expect(
      await h.writer.reparent({
        taskId: tid('c'),
        operationId: op(),
        expectedRevision: rev(1),
        parent: { taskId: tid('p') }
      })
    ).toFailWith(/changed after/);
    expect(await h.repository.readCommit(tid('n'))).toSucceedWith(undefined);
    expect(await revisionOf(h.repository, 'c')).toBe(1);
  });
});

describe('authority is decided before anything action-specific is disclosed', () => {
  test('a reader without the action learns only that it is not permitted', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    (await h.writer.archive({ taskId: tid('t'), operationId: op(), expectedRevision: rev(2) })).orThrow();
    await track(h.writer, 'open');
    await registerVendor(h, 'u', { unresolved: true });
    h.policy.deny.push((r) => r.action !== 'read');
    // Without the refusal order, each of these would disclose a fact about the task: archived,
    // not a list, unresolved, stale revision.
    expect(
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(3),
        responsibility: ada
      })
    ).toFailWith(/'reassign' is not permitted/);
    expect(
      await h.writer.completeList({
        taskId: tid('open'),
        operationId: op(),
        expectedRevision: rev(9),
        outcome: { summary: 's', artifacts: [] }
      })
    ).toFailWith(/'complete-list' is not permitted/);
    expect(
      await h.writer.reassign({
        taskId: tid('u'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: ada
      })
    ).toFailWith(/'reassign' is not permitted/);
    for (const id of ['t', 'u']) {
      expect(
        await h.writer.execute({
          taskId: tid(id),
          operationId: op(),
          expectedRevision: rev(1),
          command: 'start',
          parameters: {}
        })
      ).toSucceedWith(expect.objectContaining({ result: { state: 'rejected', reason: 'denied' } }));
    }
  });

  test('a policy change during a parent check refuses the creation it would have allowed', async () => {
    const h = await brokerHarness();
    await track(h.writer, 'p');
    const policy = h.policy;
    policy.afterDecision = (request) => {
      if (request.role === 'parent') {
        policy.afterDecision = undefined;
        policy.epoch = 'epoch-2';
      }
    };
    expect(
      await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c', parentId: tid('p') })
    ).toFailWith(/authorization policy changed after the operation was authorized/);
    expect(await h.repository.readCommit(tid('c'))).toSucceedWith(undefined);
  });

  test('a policy change during the visibility check refuses the mutation it would have allowed', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't');
    const policy = h.policy;
    policy.afterDecision = (request) => {
      if (request.action === 'read') {
        policy.afterDecision = undefined;
        policy.epoch = 'epoch-2';
      }
    };
    expect(
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: ada
      })
    ).toFailWith(/authorization policy changed/);
  });
});

describe('view cursors', () => {
  let h: IBrokerHarness;
  let cursor: PageCursor;
  beforeEach(async () => {
    h = await brokerHarness();
    for (const id of ['a', 'b', 'c']) {
      await track(h.writer, id);
    }
    cursor = (await h.writer.query({ limit: 1 })).orThrow().nextCursor!;
  });

  test('continue in the view that issued them', async () => {
    expect(await h.writer.query({ limit: 1, cursor })).toSucceedAndSatisfy((page) => {
      expect(page.items.map((i) => i.envelope.id)).toEqual(['b']);
    });
  });

  test('are stale in another view, even for the same principal and scopes', async () => {
    const twin: IBoundTaskWriter = bindWriter(h, {});
    expect(await twin.query({ limit: 1, cursor })).toFailWith(/not a live cursor of this view/);
  });

  test('are stale after the policy epoch changes', async () => {
    h.policy.epoch = 'epoch-2';
    const outcome = await h.writer.query({ limit: 1, cursor });
    expect(outcome.isFailure() && outcome.detail?.code).toBe('cursor-stale');
  });

  test('a policy change during a page fails the page rather than mixing two policies', async () => {
    h.policy.afterDecision = () => {
      h.policy.epoch = 'epoch-3';
    };
    expect(await h.writer.query({})).toFailWith(/changed after the operation was authorized/);
  });

  test('bounded: the oldest handle is evicted', async () => {
    for (let i = 0; i < 256; i++) {
      await h.writer.query({ limit: 1 });
    }
    expect(await h.writer.query({ limit: 1, cursor })).toFailWith(/not a live cursor/);
  });
});

describe('scopes are labels: change within the view only', () => {
  test('a view may add and remove only scopes it selects; scopes it cannot see are untouched', async () => {
    const h = await brokerHarness({ scopes: [alpha, beta] });
    const both = bindWriter(h, { scopes: [alpha, beta], creationScopes: [alpha, beta] });
    await both.createTracked({ taskId: tid('t'), operationId: op(), title: 't' });
    const alphaOnly = bindWriter(h, { scopes: [alpha] });
    expect(
      await alphaOnly.changeScopes({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        add: [gamma]
      })
    ).toFailWith(/outside this view/);
    expect(
      await alphaOnly.changeScopes({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        remove: [beta]
      })
    ).toFailWith(/outside this view/);
    expect(
      await alphaOnly.changeScopes({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        remove: [alpha]
      })
    ).toSucceedWith(expect.objectContaining({ disposition: 'changed', revision: 2 }));
    const record = (await h.repository.readCommit(tid('t'))).orThrow()!;
    expect(record.recordType === 'resolved' && record.task.envelope.scopes).toEqual([beta]);
    // alpha-only can no longer see it.
    expect(await alphaOnly.inspect(tid('t'))).toFailWith(/not found or not visible/);
    // Re-adding what is already there is no change, recorded.
    expect(
      await both.changeScopes({ taskId: tid('t'), operationId: op(), expectedRevision: rev(2), add: [beta] })
    ).toSucceedWith(expect.objectContaining({ disposition: 'unchanged', revision: 2 }));
  });

  test('a quarantined task in the view is reported as a generic issue, never by id', async () => {
    const h = await brokerHarness();
    await registerVendor(h, 'v1');
    await succeedTask(h, h.writer, (await track(h.writer, 't1')).taskId);
    h.repository.close().orThrow();
    const reopened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: environment().env,
        registry: registry({ withoutVendor: true })
      })
    ).orThrow();
    expect(reopened.state).toBe('ready');
    if (reopened.state !== 'ready') {
      return;
    }
    const broker = TaskBroker.create({ repository: reopened.repository, environment: h.env }).orThrow();
    const view = broker
      .bindView({ principal: 'p', scopes: [alpha], authorization: new TestPolicy() })
      .orThrow();
    expect(await view.query({})).toSucceedAndSatisfy((page) => {
      expect(page.completeness).toBe('partial');
      expect(page.issues).toHaveLength(1);
      expect(page.issues[0]).not.toMatch(/v1/);
    });
    // A visible quarantined task fails inspection rather than being presented as a typed task.
    expect(await view.inspect(tid('v1'))).toFailWith(/no registered task kind/);
  });
});
