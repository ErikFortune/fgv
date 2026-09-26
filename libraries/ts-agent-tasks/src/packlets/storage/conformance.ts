/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Result, captureAsyncResult, fail, failWithDetail, succeed } from '@fgv/ts-utils';
import {
  ConsumerId,
  DeliveryId,
  IResolvedTaskRecordDraft,
  ISourceBinding,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskPage,
  ITaskQuery,
  ITaskScope,
  ITaskSelection,
  ITaskUpdate,
  Instant,
  OperationId,
  PageCursor,
  SubscriptionId,
  TaskId,
  TaskLifecycle,
  TaskResult,
  TaskRevision,
  UpdateCategory,
  UpdateId,
  allUpdateCategories,
  taskListDetailVersion,
  taskListKind,
  taskUpdateId,
  trackedTaskDetailVersion,
  trackedTaskKind
} from '../types';
import { ITaskRegistrationRequest, ITaskRepository, ITaskRepositoryHealth } from './model';

/**
 * One behavioural check a repository passed or failed.
 * @public
 */
export interface ITaskRepositoryConformanceCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly message?: string;
}

/**
 * Every check the conformance suite ran.
 * @public
 */
export interface ITaskRepositoryConformanceReport {
  readonly checks: ReadonlyArray<ITaskRepositoryConformanceCheck>;
}

/**
 * Creates one empty, writable repository whose registry has `fgv.tracked@1` and `fgv.task-list@1`
 * registered. Called once per check, so no check depends on another's state.
 * @public
 */
export type TaskRepositoryFactory = () => Promise<TaskResult<ITaskRepository>>;

const at: Instant = '2026-01-01T00:00:00.000Z' as Instant;
const later = (minutes: number): Instant =>
  new Date(Date.parse(at) + minutes * 60000).toISOString() as Instant;
const A: ITaskScope = { namespace: 'conformance', key: 'a' };
const B: ITaskScope = { namespace: 'conformance', key: 'b' };

interface IShape {
  readonly scopes?: ReadonlyArray<ITaskScope>;
  readonly parentId?: string;
  /** Registers a `fgv.task-list@1` with this completion instead of a tracked task. */
  readonly list?: 'manual' | 'all-children-succeeded';
  readonly lifecycle?: TaskLifecycle;
  readonly binding?: ISourceBinding;
}

function _envelope(id: string, revision: number, shape: IShape): ITaskEnvelope {
  return {
    schemaVersion: 1,
    id: id as TaskId,
    kind: shape.list !== undefined ? taskListKind : trackedTaskKind,
    detailVersion: shape.list !== undefined ? taskListDetailVersion : trackedTaskDetailVersion,
    revision: revision as TaskRevision,
    title: `conformance ${id}`,
    ...(shape.parentId !== undefined ? { parentId: shape.parentId as TaskId } : {}),
    stopPolicy: 'none',
    scopes: shape.scopes ?? [A],
    lifecycle: shape.lifecycle ?? { status: 'pending' },
    attention: [],
    ...(shape.binding !== undefined ? { binding: shape.binding } : {}),
    recovery: 'not-recoverable',
    observation: { state: 'current', observedAt: at },
    createdAt: at,
    changedAt: at
  };
}

/** An update owed to exactly the audience the repository computes, as every commit's must be. */
function _update(
  repository: ITaskRepository,
  before: ITaskEnvelope | undefined,
  envelope: ITaskEnvelope,
  category: UpdateCategory
): ITaskUpdate {
  return {
    id: taskUpdateId(envelope.id, envelope.revision, category),
    taskId: envelope.id,
    revision: envelope.revision,
    category,
    required: true,
    snapshot: { envelope },
    audience: repository.audience(before, envelope, category)
  };
}

/** Subscribes `id` to everything in `scopes`, from now, through the writer. */
async function _subscribe(
  repository: ITaskRepository,
  id: string,
  scopes: ReadonlyArray<ITaskScope>
): Promise<Result<true>> {
  return (
    await repository.withWriter((writer) =>
      writer.registerSubscription({
        subscriptionId: id as SubscriptionId,
        operationId: `subscribe-${id}` as OperationId,
        principalKey: 'conformance',
        specification: {
          consumerId: `consumer-${id}` as ConsumerId,
          selection: { scopes, lifecycleClass: 'all' },
          start: 'from-now',
          policy: {
            schemaVersion: 1,
            durability: repository.mode === 'session' ? 'session' : 'process-crash',
            history: 'observed-state',
            categories: [...allUpdateCategories].sort(),
            coalesceProgress: false
          }
        },
        baseline: [],
        createdAt: at
      })
    )
  ).asResult.onSuccess(() => succeed(true));
}

function _registration(repository: ITaskRepository, id: string, shape: IShape): ITaskRegistrationRequest {
  const request: JsonValue = { taskId: id };
  const envelope: ITaskEnvelope = _envelope(id, 1, shape);
  return {
    taskId: id as TaskId,
    operationId: `create-${id}` as OperationId,
    request,
    record: {
      recordType: 'resolved',
      task: { envelope, details: shape.list !== undefined ? { completion: shape.list } : {} },
      operations: [
        {
          type: 'catalog',
          operationId: `create-${id}` as OperationId,
          operation: shape.list !== undefined ? 'create-list' : 'create-tracked',
          request,
          principalKey: 'conformance',
          receipt: null
        }
      ],
      updates: [_update(repository, undefined, envelope, 'lifecycle')],
      archived: false
    }
  };
}

async function _add(repository: ITaskRepository, id: string, shape: IShape = {}): Promise<Result<true>> {
  return (
    await repository.withWriter((writer) => writer.register(_registration(repository, id, shape)))
  ).asResult.onSuccess(() => succeed(true));
}

async function _change(
  repository: ITaskRepository,
  id: string,
  lifecycle: TaskLifecycle | undefined,
  archive: boolean = false
): Promise<Result<true>> {
  return (await _commitChange(repository, id, lifecycle, archive)).asResult.onSuccess(() => succeed(true));
}

async function _commitChange(
  repository: ITaskRepository,
  id: string,
  lifecycle: TaskLifecycle | undefined,
  archive: boolean
): Promise<TaskResult<unknown>> {
  const read: TaskResult<ITaskCommitRecord | undefined> = await repository.readCommit(id as TaskId);
  if (read.isFailure() || read.value === undefined || read.value.recordType !== 'resolved') {
    return failWithDetail(`${id}: no resolved record to change`, {
      code: 'not-found-or-denied',
      retry: 'after-host-action'
    });
  }
  const current = read.value;
  const revision: number = current.task.envelope.revision + 1;
  const envelope: ITaskEnvelope = {
    ...current.task.envelope,
    revision: revision as TaskRevision,
    ...(lifecycle !== undefined ? { lifecycle } : {})
  };
  const operationId: OperationId = `change-${id}-${revision}` as OperationId;
  const record: IResolvedTaskRecordDraft = {
    recordType: 'resolved',
    task: { envelope, details: current.task.details },
    operations: [
      ...current.operations,
      {
        type: 'catalog',
        operationId,
        operation: archive ? 'archive' : 'update-tracked',
        request: { revision },
        principalKey: 'conformance',
        receipt: null
      }
    ],
    updates: [...current.updates, _update(repository, current.task.envelope, envelope, 'lifecycle')],
    archived: archive
  };
  return repository.withWriter((writer) =>
    writer.commit({
      purpose: 'operation',
      operationId,
      taskId: id as TaskId,
      expectedRevision: current.task.envelope.revision,
      expectedRecordRevision: current.recordRevision,
      record
    })
  );
}

async function _ids(repository: ITaskRepository, query: ITaskQuery): Promise<Result<string[]>> {
  return (await repository.query(query)).asResult.onSuccess((page) =>
    succeed(page.items.map((i) => i.envelope.id))
  );
}

function _same(what: string, actual: ReadonlyArray<string>, expected: ReadonlyArray<string>): Result<true> {
  return actual.join(',') === expected.join(',')
    ? succeed(true)
    : fail(`${what}: expected [${expected.join(', ')}], got [${actual.join(', ')}]`);
}

function _code(what: string, result: TaskResult<unknown>, code: string): Result<true> {
  return result.isFailure() && result.detail?.code === code
    ? succeed(true)
    : fail(
        `${what}: expected a '${code}' failure, got ${result.isSuccess() ? 'success' : result.detail?.code}`
      );
}

async function _seq(steps: ReadonlyArray<() => Promise<Result<unknown>>>): Promise<Result<true>> {
  for (const step of steps) {
    const result: Result<unknown> = await step();
    if (result.isFailure()) {
      return fail(result.message);
    }
  }
  return succeed(true);
}

const all = (scopes: ReadonlyArray<ITaskScope>, extra: Partial<ITaskSelection> = {}): ITaskSelection => ({
  scopes,
  lifecycleClass: 'all',
  ...extra
});

const succeeded: TaskLifecycle = { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } };

/** The checks, each against its own fresh repository. */
const checks: ReadonlyArray<{
  readonly name: string;
  readonly run: (repository: ITaskRepository) => Promise<Result<true>>;
}> = [
  {
    name: 'scopes are a union, deduplicated and ordered by task id',
    run: async (r) =>
      _seq([
        () => _add(r, 't2', { scopes: [A, B] }),
        () => _add(r, 't1', { scopes: [A] }),
        () => _add(r, 't3', { scopes: [B] }),
        async () =>
          (await _ids(r, { selection: all([B, A, B]) })).onSuccess((ids) =>
            _same('union', ids, ['t1', 't2', 't3'])
          )
      ])
  },
  {
    name: 'an empty scope list matches nothing',
    run: async (r) =>
      _seq([
        () => _add(r, 't1'),
        async () => (await _ids(r, { selection: all([]) })).onSuccess((ids) => _same('empty scopes', ids, []))
      ])
  },
  {
    name: 'lifecycle classes partition, and an incompatible status is refused',
    run: async (r) =>
      _seq([
        () => _add(r, 'open1'),
        () => _add(r, 'done1', { lifecycle: succeeded }),
        async () =>
          (await _ids(r, { selection: all([A], { lifecycleClass: 'open' }) })).onSuccess((ids) =>
            _same('open', ids, ['open1'])
          ),
        async () =>
          (await _ids(r, { selection: all([A], { lifecycleClass: 'terminal' }) })).onSuccess((ids) =>
            _same('terminal', ids, ['done1'])
          ),
        async () =>
          _code(
            'open with succeeded',
            await r.query({ selection: all([A], { lifecycleClass: 'open', statuses: ['succeeded'] }) }),
            'invalid'
          )
      ])
  },
  {
    name: 'paging returns every task exactly once, in order, with no trailing empty page',
    run: async (r) => {
      const added: Result<true> = await _seq(['p1', 'p2', 'p3', 'p4', 'p5'].map((id) => () => _add(r, id)));
      if (added.isFailure()) {
        return added;
      }
      const seen: string[] = [];
      let cursor: PageCursor | undefined = undefined;
      for (let pages = 0; pages < 3; pages++) {
        const page: TaskResult<ITaskPage> = await r.query({
          selection: all([A]),
          limit: 2,
          ...(cursor !== undefined ? { cursor } : {})
        });
        if (page.isFailure()) {
          return fail(page.message);
        }
        seen.push(...page.value.items.map((i) => i.envelope.id));
        cursor = page.value.nextCursor;
      }
      return cursor === undefined
        ? _same('pages', seen, ['p1', 'p2', 'p3', 'p4', 'p5'])
        : fail('pages: a cursor after the last task');
    }
  },
  {
    name: 'a cursor is refused for a different query and goes stale on any change',
    run: async (r) =>
      _seq([
        () => _add(r, 'c1'),
        () => _add(r, 'c2'),
        async () => {
          const page: TaskResult<ITaskPage> = await r.query({ selection: all([A]), limit: 1 });
          if (page.isFailure()) {
            return fail(page.message);
          }
          const cursor: PageCursor | undefined = page.value.nextCursor;
          return _seq([
            async () =>
              _code(
                'different query',
                await r.query({ selection: all([A], { lifecycleClass: 'open' }), cursor }),
                'invalid'
              ),
            () => _add(r, 'c3', { scopes: [B] }),
            async () =>
              _code(
                'after a change',
                await r.query({ selection: all([A]), limit: 1, cursor }),
                'cursor-stale'
              )
          ]);
        }
      ])
  },
  {
    name: 'due: absent excluded, equal and before included, after excluded, ordered by time',
    run: async (r) =>
      _seq([
        () => _add(r, 'absent', { lifecycle: { status: 'waiting', reason: { code: 'w', summary: 'w' } } }),
        () =>
          _add(r, 'equal', {
            lifecycle: { status: 'waiting', reason: { code: 'w', summary: 'w', notBefore: later(60) } }
          }),
        () =>
          _add(r, 'before', {
            lifecycle: { status: 'waiting', reason: { code: 'w', summary: 'w', notBefore: later(5) } }
          }),
        () =>
          _add(r, 'after', {
            lifecycle: { status: 'waiting', reason: { code: 'w', summary: 'w', notBefore: later(61) } }
          }),
        async () =>
          (
            await r.queryDue({ selection: all([A], { lifecycleClass: 'open' }), cutoff: later(60) })
          ).asResult.onSuccess((page) =>
            _same(
              'due',
              page.items.map((i) => i.envelope.id),
              ['before', 'equal']
            )
          )
      ])
  },
  {
    name: 'owed updates stay listed after their task leaves open work, and hold its archive',
    run: async (r) =>
      _seq([
        () => _subscribe(r, 'sub', [B]),
        () => _add(r, 'o1', { scopes: [B] }),
        () => _add(r, 'other', { scopes: [A] }),
        () => _change(r, 'o1', succeeded),
        // A tombstone owes nothing: archive waits for acknowledgement or disposition.
        async () =>
          _code('archive while owed', await _commitChange(r, 'o1', undefined, true), 'retention-blocked'),
        async () =>
          (await r.listOwed({ subscription: 'sub' as SubscriptionId })).asResult.onSuccess((page) =>
            _same(
              'owed',
              page.updates.map((u) => u.id),
              [1, 2].map((n) => taskUpdateId('o1' as TaskId, n as TaskRevision, 'lifecycle'))
            )
          )
      ])
  },
  {
    name: 'an update may be owed only to the audience the repository computes',
    run: async (r) =>
      _seq([
        () => _subscribe(r, 'sub', [A]),
        async () => {
          const envelope: ITaskEnvelope = _envelope('forged', 1, {});
          const request: ITaskRegistrationRequest = _registration(r, 'forged', {});
          const forged: ITaskRegistrationRequest = {
            ...request,
            record: {
              ...(request.record as IResolvedTaskRecordDraft),
              updates: [{ ..._update(r, undefined, envelope, 'lifecycle'), audience: [] }]
            }
          };
          return _code('omitted audience', await r.withWriter((w) => w.register(forged)), 'invalid');
        }
      ])
  },
  {
    name: 'an acknowledged update is owed no more, by exact id, and a later commit does not revive it',
    run: async (r) => {
      const first: UpdateId = taskUpdateId('k' as TaskId, 1 as TaskRevision, 'lifecycle');
      const second: UpdateId = taskUpdateId('k' as TaskId, 2 as TaskRevision, 'lifecycle');
      return _seq([
        () => _subscribe(r, 'sub', [A]),
        () => _add(r, 'k'),
        async () =>
          (
            await r.withWriter((w) =>
              w.issueReceipt({
                subscriptionId: 'sub' as SubscriptionId,
                expectedRecordRevision: 1,
                receipt: {
                  version: 1,
                  deliveryId: 'd1' as DeliveryId,
                  included: [{ taskId: 'k' as TaskId, revision: 1 as TaskRevision, updateIds: [first] }]
                },
                issuedAt: at,
                expiresAt: later(60)
              })
            )
          ).asResult,
        async () =>
          (
            await r.withWriter((w) =>
              w.acknowledgeReceipt({
                subscriptionId: 'sub' as SubscriptionId,
                expectedRecordRevision: 2,
                deliveryId: 'd1' as DeliveryId,
                at
              })
            )
          ).asResult.onSuccess((ack) => _same('newly acknowledged', ack.newlyAcknowledged, [first])),
        () => _change(r, 'k', succeeded),
        async () =>
          (await r.listOwed({ subscription: 'sub' as SubscriptionId })).asResult.onSuccess((page) =>
            _same(
              'owed after acknowledgement',
              page.updates.map((u) => u.id),
              [second]
            )
          )
      ]);
    }
  },
  {
    name: 'archive removes the task from queries, never its identity or source binding',
    run: async (r) =>
      _seq([
        () =>
          _add(r, 'arch', {
            lifecycle: succeeded,
            binding: { sourceId: 'conf', referenceVersion: 1, reference: 'x' }
          }),
        () => _change(r, 'arch', undefined, true),
        async () =>
          (await _ids(r, { selection: all([A]) })).onSuccess((ids) => _same('after archive', ids, [])),
        async () =>
          (await r.read('arch' as TaskId)).asResult.onSuccess((read) =>
            read?.state === 'resolved' && read.archived
              ? succeed(true)
              : fail('archived task is not readable as archived')
          ),
        async () =>
          (
            await r.lookupSource({ sourceId: 'conf', referenceVersion: 1, reference: 'x' })
          ).asResult.onSuccess((id) => (id === 'arch' ? succeed(true) : fail(`source lookup found ${id}`))),
        async () =>
          _code(
            'a second task bound to the same reference',
            await r.withWriter((writer) =>
              writer.register(
                _registration(r, 'dup', {
                  binding: { sourceId: 'conf', referenceVersion: 1, reference: 'x' }
                })
              )
            ),
            'conflict'
          )
      ])
  },
  {
    name: 'childStates lists every retained child, archived included, with its final status',
    run: async (r) =>
      _seq([
        () => _add(r, 'p'),
        () => _add(r, 'c1', { parentId: 'p', lifecycle: succeeded }),
        () => _add(r, 'c2', { parentId: 'p' }),
        () => _change(r, 'c1', undefined, true),
        async () =>
          (await r.childStates('p' as TaskId)).asResult.onSuccess((children) =>
            _same(
              'children',
              children.map((c) => `${c.id}:${c.state}:${c.status}:${c.archived}`),
              ['c1:resolved:succeeded:true', 'c2:resolved:pending:false']
            )
          ),
        async () => _code('an unknown parent', await r.childStates('none' as TaskId), 'not-found-or-denied')
      ])
  },
  {
    name: 'list-completion candidates are automatic lists whose every child succeeded, kept current by commits',
    run: async (r) => {
      const candidates = async (expected: ReadonlyArray<string>): Promise<Result<true>> =>
        (await r.listCompletionCandidates({ limit: 10 })).asResult.onSuccess((ids) =>
          _same('candidates', ids, expected)
        );
      return _seq([
        () => _add(r, 'auto', { list: 'all-children-succeeded' }),
        () => _add(r, 'manual', { list: 'manual' }),
        () => _add(r, 'empty', { list: 'all-children-succeeded' }),
        () => _add(r, 'a1', { parentId: 'auto' }),
        () => _add(r, 'm1', { parentId: 'manual', lifecycle: succeeded }),
        () => candidates([]),
        () => _change(r, 'a1', succeeded),
        () => candidates(['auto']),
        () => _add(r, 'a2', { parentId: 'auto' }),
        () => candidates([])
      ]);
    }
  },
  {
    name: 'a rebuild answers exactly as before, at a newer generation',
    run: async (r) =>
      _seq([
        () => _add(r, 'r1'),
        () => _add(r, 'r2', { lifecycle: succeeded }),
        async () => {
          const before: Result<string[]> = await _ids(r, { selection: all([A]) });
          const generation: number = r.health().generation;
          const rebuilt: TaskResult<ITaskRepositoryHealth> = await r.rebuildIndexes();
          if (before.isFailure() || rebuilt.isFailure()) {
            return fail(`rebuild: ${before.isFailure() ? before.message : rebuilt.message}`);
          }
          if (rebuilt.value.state !== 'ready' || rebuilt.value.generation <= generation) {
            return fail(
              `rebuild: state ${rebuilt.value.state}, generation ${rebuilt.value.generation} after ${generation}`
            );
          }
          return (await _ids(r, { selection: all([A]) })).onSuccess((after) =>
            _same('rebuilt', after, before.value)
          );
        }
      ])
  }
];

/**
 * Runs the behavioural conformance suite against a repository implementation.
 *
 * @remarks
 * A custom `ITaskRepository` — a host's own storage — must answer queries with the same
 * semantics as `FileTreeTaskRepository`: scope unions deduplicated before paging, lifecycle
 * classes, exact pages without a trailing empty one, cursors that refuse a different query and
 * go stale on change, due boundaries, owed updates that outlive open work and archive, archive
 * that removes a task from queries but not its identity or source binding, the complete child set
 * archived children included, list-completion candidates kept current by every commit, and a
 * rebuild that answers exactly as before. Framework-free: it succeeds with the report when every check
 * passes, and fails naming the checks that did not, so any test runner can assert it.
 *
 * It checks behaviour, not data structures — the resident-index shape and work counters are the
 * built-in repository's own evidence, and no custom repository is held to them.
 * @public
 */
export async function runTaskRepositoryConformance(
  factory: TaskRepositoryFactory
): Promise<Result<ITaskRepositoryConformanceReport>> {
  const results: ITaskRepositoryConformanceCheck[] = [];
  for (const check of checks) {
    const created: TaskResult<ITaskRepository> = await factory();
    if (created.isFailure()) {
      results.push({ name: check.name, passed: false, message: `factory: ${created.message}` });
      continue;
    }
    const repository: ITaskRepository = created.value;
    const outcome: Result<true> = (await captureAsyncResult(() => check.run(repository))).onSuccess(
      (inner) => inner
    );
    // Close whatever the check's outcome, so a failed check never leaks the repository it made. A
    // repository that will not close has left something active: that fails a check that passed,
    // and never masks the reason a check failed.
    const closed: Result<boolean> = repository.close();
    const result: Result<true> = outcome.onSuccess(() =>
      closed
        .withErrorFormat((message) => `close after the check failed: ${message}`)
        .onSuccess(() => succeed<true>(true))
    );
    results.push(
      result.isSuccess()
        ? { name: check.name, passed: true }
        : { name: check.name, passed: false, message: result.message }
    );
  }
  const failed: ReadonlyArray<ITaskRepositoryConformanceCheck> = results.filter((c) => !c.passed);
  return failed.length === 0
    ? succeed({ checks: results })
    : fail(`task repository conformance: ${failed.map((c) => `${c.name}: ${c.message}`).join('; ')}`);
}
