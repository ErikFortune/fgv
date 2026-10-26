/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { DetailedFailure, Hash, Result, fail, succeed } from '@fgv/ts-utils';
import { TaskBroker } from '../broker';
import { TaskConverters, instant } from '../converters';
import {
  IBoundTaskPage,
  IBoundTaskWriter,
  IProjectedTaskEnvelope,
  ITaskAuthorization,
  ITaskFailure,
  ITaskReason,
  ITaskReference,
  ITaskScope,
  IWaitingReason,
  Instant,
  OperationId,
  PageCursor,
  TaskId,
  TaskLifecycleStatus,
  TaskResult,
  TaskRevision,
  TrackedCommand,
  defaultTaskPerOwnerLimits,
  isTerminalTaskStatus,
  maxTaskPageLimit
} from '../types';
import { ITaskHostWriteGuard, guarded } from './hostWriteGuard';

/**
 * What identifies one deferred obligation: the change it is owed for, as the host names it, and
 * which of that change's recipients it is owed to.
 * @public
 */
export interface IDeferredObligationKey {
  /** The host's name for the change — an identifier (`[A-Za-z0-9._:-]`, starting alphanumeric). */
  readonly changeRef: string;
  /** One of the helper's declared roles. */
  readonly role: string;
}

/**
 * The lifecycle reason codes {@link DeferredObligations} writes.
 * @public
 */
export interface IDeferredObligationCodes {
  /** The code an obligation waits under. */
  readonly wait: string;
  /** The code an obligation is cancelled under when it is ended undelivered. */
  readonly cancelled: string;
  /** The code an obligation is cancelled under when its changes were merged into another. */
  readonly merged: string;
  /** The code a deferral interrupted between its create and its wait is cancelled under. */
  readonly abandoned: string;
}

/**
 * The default {@link IDeferredObligationCodes}.
 * @public
 */
export const defaultDeferredObligationCodes: IDeferredObligationCodes = {
  wait: 'deferred',
  cancelled: 'undelivered',
  merged: 'merged',
  abandoned: 'abandoned'
};

/**
 * The reference namespaces {@link DeferredObligations} writes into a reason's attention.
 * @public
 */
export interface IDeferredObligationNamespaces {
  /** Names one change an obligation owes. */
  readonly change: string;
  /** Names the obligation another was merged into. */
  readonly obligation: string;
}

/**
 * The default {@link IDeferredObligationNamespaces}.
 * @public
 */
export const defaultDeferredObligationNamespaces: IDeferredObligationNamespaces = {
  change: 'change',
  obligation: 'obligation'
};

/**
 * How a deferred obligation is retried, in milliseconds. See {@link DeferredObligations.retry}.
 * @public
 */
export interface IDeferralSchedule {
  /** The first backoff, and the least any retry waits. */
  readonly baseMs: number;
  /** The longest backoff. A retry at or past it is held by the host rather than written. */
  readonly capMs: number;
  /** How long after its creation an obligation may still be retried; past it, it expires. */
  readonly maxDeferralMs: number;
}

/**
 * The default {@link IDeferralSchedule}: thirty seconds, doubling to five minutes, for a day.
 * @public
 */
export const defaultDeferralSchedule: IDeferralSchedule = {
  baseMs: 30 * 1000,
  capMs: 5 * 60 * 1000,
  maxDeferralMs: 24 * 60 * 60 * 1000
};

/**
 * Parameters for {@link DeferredObligations.create}.
 * @public
 */
export interface IDeferredObligationsParams {
  readonly broker: TaskBroker;
  /** The principal every obligation write is recorded under. */
  readonly principal: string;
  /**
   * The policy every read and write is authorized against. For a trusted host principal acting on
   * its own obligations, `trustedKindAuthority` over {@link IDeferredObligationsParams.scope} is the
   * way to get one — with `scopeMatch: 'some'` when deferrals carry instance scopes beside it.
   */
  readonly authorization: ITaskAuthorization;
  /** The scope every obligation carries; every listing selects by it. */
  readonly scope: ITaskScope;
  /** The prefix of every obligation's task id: an identifier with no `:`. */
  readonly idPrefix: string;
  /** The recipient roles an obligation can be owed to — identifiers with no `:`, unique, at least one. */
  readonly roles: ReadonlyArray<string>;
  readonly codes?: Partial<IDeferredObligationCodes>;
  readonly namespaces?: Partial<IDeferredObligationNamespaces>;
  readonly schedule?: Partial<IDeferralSchedule>;
  /**
   * The repository's per-task operation limit (`profile.perOwner.maxOperationsPerTask`). Defaults
   * to `defaultTaskPerOwnerLimits`'; pass the repository's own when its profile differs.
   */
  readonly operationBudget?: number;
  /** The gate every obligation write passes through; see {@link ITaskHostWriteGuard}. */
  readonly guard?: ITaskHostWriteGuard;
  /** The converters whose bounds the repository uses. Defaults to the default bounds. */
  readonly converters?: TaskConverters;
}

/**
 * A waiting obligation, as read from its task.
 * @public
 */
export interface IDeferredObligation {
  readonly taskId: TaskId;
  /** What its id names: the change it was created for, and its role. */
  readonly key: IDeferredObligationKey;
  /** The task's revision — the precondition of its next write. */
  readonly revision: TaskRevision;
  /** The changes it owes, the one it was created for first. A merge adds others' changes. */
  readonly changes: ReadonlyArray<string>;
  /** The host's own references on its wait reason, without the change references. */
  readonly attention: ReadonlyArray<ITaskReference>;
  /** Its wait reason, as stored. */
  readonly reason: IWaitingReason;
  readonly notBefore?: Instant;
  readonly createdAt: Instant;
  readonly changedAt: Instant;
  /**
   * How many more waits it can be written before its per-task operation budget, less the closeout
   * slots the repository holds for its terminal command and archive, is spent. See
   * {@link DeferredObligations.wait}.
   */
  readonly waitsRemaining: number;
}

/**
 * What the repository holds for one obligation: none; one created and not yet waiting (a deferral
 * interrupted between its two writes); one waiting; or one settled — terminal or archived.
 * @public
 */
export type DeferredObligationState =
  | { readonly state: 'absent' }
  | { readonly state: 'pending'; readonly revision: TaskRevision; readonly createdAt: Instant }
  | { readonly state: 'waiting'; readonly obligation: IDeferredObligation }
  | { readonly state: 'settled'; readonly status: TaskLifecycleStatus; readonly archived: boolean };

/**
 * What {@link DeferredObligations.defer} records.
 * @public
 */
export interface IDeferral {
  readonly key: IDeferredObligationKey;
  /** The obligation task's title. Used only when the task is created. */
  readonly title: string;
  /** When it is first due, in epoch milliseconds. See {@link DeferredObligations.firstNotBefore}. */
  readonly notBefore: number;
  /**
   * Scopes the task carries beside the helper's own — a room, a document. Used only when the task
   * is created, and a replay after a crash must name the same ones.
   */
  readonly scopes?: ReadonlyArray<ITaskScope>;
  /** The host's references for the wait reason. None may use the change namespace. */
  readonly attention?: ReadonlyArray<ITaskReference>;
  /** The wait reason's summary. Defaults to a fixed sentence. */
  readonly summary?: string;
}

/**
 * What {@link DeferredObligations.wait} changes besides `notBefore`. Each member omitted keeps the
 * obligation's current value.
 * @public
 */
export interface IDeferredObligationWait {
  readonly changes?: ReadonlyArray<string>;
  readonly attention?: ReadonlyArray<ITaskReference>;
  readonly summary?: string;
}

/**
 * A listing of obligations: each one that reads as one, and an issue for each that does not.
 * @public
 */
export interface IDeferredObligationListing {
  readonly obligations: ReadonlyArray<IDeferredObligation>;
  readonly issues: ReadonlyArray<string>;
}

/**
 * What a sweep ended, and an issue for each candidate it could not.
 * @public
 */
export interface IDeferredObligationSweep<T> {
  readonly done: ReadonlyArray<T>;
  readonly issues: ReadonlyArray<string>;
}

/**
 * What {@link DeferredObligations.retry} advises for an obligation that came due and could not be
 * discharged.
 *
 * @remarks
 * - `expire` — it is older than `maxDeferralMs`; the host ends it (`cancel`) and records why.
 * - `wait` — write the next `notBefore` with {@link DeferredObligations.wait}.
 * - `hold` — keep the next attempt in memory until `notBefore`, writing nothing: the backoff is at
 *   its cap, or the obligation has no waits left. A restart forgets the hold, which costs one early
 *   retry and never an obligation.
 * @public
 */
export type DeferralDecision =
  | { readonly action: 'expire' }
  | { readonly action: 'wait' | 'hold'; readonly notBefore: number };

/** Room an obligation id leaves for the longest operation-id suffix the helper appends. */
const _operationSuffixRoom: number = 18;

/** How many times a listing the repository moves under is read again before it fails. */
const _maxListingAttempts: number = 3;

/** The closeout slots the repository holds on an open task: its terminal command and its archive. */
const _closeoutSlots: number = 2;

/** A task failure's classification, or none for one an injected component left unclassified. */
function _classified(failure: DetailedFailure<unknown, ITaskFailure>): Partial<ITaskFailure> {
  return failure.detail ?? {};
}

const _normalizer: Hash.Crc32Normalizer = new Hash.Crc32Normalizer();

/** Whether two validated values are canonically the same. */
function _same(a: unknown, b: unknown): boolean {
  const left: Result<string> = _normalizer.canonicalize(a);
  const right: Result<string> = _normalizer.canonicalize(b);
  return left.isSuccess() && right.isSuccess() && left.value === right.value;
}

/** Epoch milliseconds as a canonical UTC instant. */
function _instantOf(ms: number): Result<Instant> {
  return Number.isSafeInteger(ms) && ms >= 0
    ? instant.convert(new Date(ms).toISOString())
    : fail(`${ms} is not a non-negative safe integer of epoch milliseconds`);
}

/**
 * Deferred obligations: durable retry obligations kept as `fgv.tracked@1` tasks that wait with a
 * `notBefore`, for a host with a busy recipient — a completion owed to a room with a turn open,
 * commit work owed to a store mid-snapshot.
 *
 * @remarks
 * **One obligation per change and role, by id.** An obligation's task id is
 * `<idPrefix>:<role>:<changeRef>` — deterministic, so a deferral replayed after a crash finds the
 * task it already created, and injective, so two roles for one change never share a task. The role
 * is in the id, not only in the wait reason, because a task left `pending` has no wait reason yet.
 *
 * **A deferral is create, then wait.** A crash between the two leaves the task `pending`; a crash
 * inside the creation leaves a pending registration. {@link DeferredObligations.defer} replayed
 * finishes either: it resumes the registration from the request the repository stored, then sets
 * the task waiting. Every write carries an operation id derived from the task and the revision it
 * expects, so a write whose response was lost replays its stored receipt rather than applying twice.
 *
 * **No timers.** {@link DeferredObligations.due} answers what is due from the repository's due
 * index; the host's own passes drive retries. {@link DeferredObligations.retry} advises the next
 * step and writes nothing.
 *
 * **Authorization is never bypassed.** Every read is a bound view's and every write a bound
 * writer's, under the principal and policy the host supplies.
 *
 * Every write goes through the optional {@link ITaskHostWriteGuard}, one guarded unit per method
 * call; see it for how it composes with the broker's own `writeGuard`.
 * @public
 */
export class DeferredObligations {
  private readonly _broker: TaskBroker;
  private readonly _principal: string;
  private readonly _authorization: ITaskAuthorization;
  private readonly _scope: ITaskScope;
  private readonly _writer: IBoundTaskWriter;
  private readonly _idPrefix: string;
  private readonly _roles: ReadonlySet<string>;
  private readonly _codes: IDeferredObligationCodes;
  private readonly _namespaces: IDeferredObligationNamespaces;
  private readonly _schedule: IDeferralSchedule;
  private readonly _operationBudget: number;
  private readonly _guard: ITaskHostWriteGuard | undefined;
  private readonly _converters: TaskConverters;

  private constructor(params: {
    readonly base: IDeferredObligationsParams;
    readonly writer: IBoundTaskWriter;
    readonly codes: IDeferredObligationCodes;
    readonly namespaces: IDeferredObligationNamespaces;
    readonly schedule: IDeferralSchedule;
    readonly operationBudget: number;
    readonly converters: TaskConverters;
  }) {
    this._broker = params.base.broker;
    this._principal = params.base.principal;
    this._authorization = params.base.authorization;
    this._scope = { ...params.base.scope };
    this._writer = params.writer;
    this._idPrefix = params.base.idPrefix;
    this._roles = new Set(params.base.roles);
    this._codes = params.codes;
    this._namespaces = params.namespaces;
    this._schedule = params.schedule;
    this._operationBudget = params.operationBudget;
    this._guard = params.base.guard;
    this._converters = params.converters;
  }

  /**
   * Creates the helper. Fails when the prefix or a role is not an identifier without `:`, the roles
   * are empty or repeat, two codes or namespaces coincide, the schedule is not ordered
   * `0 < baseMs <= capMs <= maxDeferralMs`, the operation budget leaves no room for a wait, or the
   * broker refuses the binding.
   */
  public static create(params: IDeferredObligationsParams): Result<DeferredObligations> {
    const converters: Result<TaskConverters> =
      params.converters !== undefined ? succeed(params.converters) : TaskConverters.create();
    const codes: IDeferredObligationCodes = { ...defaultDeferredObligationCodes, ...params.codes };
    const namespaces: IDeferredObligationNamespaces = {
      ...defaultDeferredObligationNamespaces,
      ...params.namespaces
    };
    const schedule: IDeferralSchedule = { ...defaultDeferralSchedule, ...params.schedule };
    const operationBudget: number = params.operationBudget ?? defaultTaskPerOwnerLimits.maxOperationsPerTask;
    return converters
      .onSuccess((c) =>
        DeferredObligations._checkParams(c, params, codes, namespaces, schedule, operationBudget).onSuccess(
          () =>
            params.broker
              .bind({
                principal: params.principal,
                scopes: [params.scope],
                authorization: params.authorization
              })
              .asResult.onSuccess((writer) =>
                succeed(
                  new DeferredObligations({
                    base: params,
                    writer,
                    codes,
                    namespaces,
                    schedule,
                    operationBudget,
                    converters: c
                  })
                )
              )
        )
      )
      .withErrorFormat((message) => `DeferredObligations.create: ${message}`);
  }

  /** Validates everything {@link DeferredObligations.create} is given. */
  private static _checkParams(
    converters: TaskConverters,
    params: IDeferredObligationsParams,
    codes: IDeferredObligationCodes,
    namespaces: IDeferredObligationNamespaces,
    schedule: IDeferralSchedule,
    operationBudget: number
  ): Result<true> {
    const segment = (value: string, what: string): Result<string> =>
      value.includes(':')
        ? fail(`${what} '${value}' contains ':'`)
        : converters.ids.identifier.convert(value).withErrorFormat((message) => `${what}: ${message}`);
    const problems: string[] = [];
    const note = (result: Result<unknown>): void => {
      if (result.isFailure()) {
        problems.push(result.message);
      }
    };
    note(segment(params.idPrefix, 'idPrefix'));
    if (params.roles.length === 0) {
      problems.push('roles is empty');
    }
    if (new Set(params.roles).size !== params.roles.length) {
      problems.push('roles repeat');
    }
    params.roles.forEach((role) => note(segment(role, 'role')));
    if (new Set(Object.values(codes)).size !== Object.values(codes).length) {
      problems.push('two reason codes are the same');
    }
    if (namespaces.change === namespaces.obligation) {
      problems.push('the change and obligation namespaces are the same');
    }
    const ordered: boolean =
      [schedule.baseMs, schedule.capMs, schedule.maxDeferralMs].every((ms) => Number.isSafeInteger(ms)) &&
      schedule.baseMs > 0 &&
      schedule.baseMs <= schedule.capMs &&
      schedule.capMs <= schedule.maxDeferralMs;
    if (!ordered) {
      problems.push('schedule must satisfy 0 < baseMs <= capMs <= maxDeferralMs, in safe integers');
    }
    if (!Number.isSafeInteger(operationBudget) || operationBudget < _closeoutSlots + 2) {
      problems.push(`operationBudget must be a safe integer of at least ${_closeoutSlots + 2}`);
    }
    return problems.length === 0 ? succeed(true) : fail(problems.join('; '));
  }

  /**
   * The deterministic task id of the obligation `key` names: `<idPrefix>:<role>:<changeRef>`.
   * Fails for an undeclared role, or a change ref that does not make an id within bounds.
   */
  public taskIdFor(key: IDeferredObligationKey): Result<TaskId> {
    if (!this._roles.has(key.role)) {
      return fail(`deferred obligations: '${key.role}' is not a declared role`);
    }
    const id: string = `${this._idPrefix}:${key.role}:${key.changeRef}`;
    const room: number = this._converters.bounds.maxIdLength - _operationSuffixRoom;
    if (id.length > room) {
      return fail(`deferred obligations: '${id}' is longer than ${room} characters`);
    }
    return this._converters.ids.taskId
      .convert(id)
      .withErrorFormat((message) => `deferred obligations: change '${key.changeRef}': ${message}`);
  }

  /** The key a task id names — the inverse of {@link DeferredObligations.taskIdFor}. */
  public keyOf(taskId: TaskId): Result<IDeferredObligationKey> {
    const prefix: string = `${this._idPrefix}:`;
    const rest: string = taskId.slice(prefix.length);
    const colon: number = rest.indexOf(':');
    const role: string = rest.slice(0, colon);
    const changeRef: string = rest.slice(colon + 1);
    return taskId.startsWith(prefix) && colon > 0 && this._roles.has(role) && changeRef.length > 0
      ? succeed({ changeRef, role })
      : fail(`deferred obligations: '${taskId}' is not an obligation id`);
  }

  /** When an obligation deferred at `now` (epoch milliseconds) is first due: after the first backoff. */
  public firstNotBefore(now: number): number {
    return now + this._schedule.baseMs;
  }

  /**
   * Advises the next step for `obligation`, found undischarged at `now` (epoch milliseconds).
   *
   * @remarks
   * The backoff is the obligation's age, within `baseMs` and `capMs`: each retry waits as long as
   * the obligation has existed, which doubles the interval at every retry without counting
   * anything. Below the cap the next `notBefore` is written (`wait`); at the cap, or with no waits
   * left in the task's operation budget, it is held in memory (`hold`) — a busy recipient at a
   * five-minute cap would otherwise spend a task's whole operation budget in a few hours. Past
   * `maxDeferralMs` it is `expire`. Pure: it reads and writes nothing.
   */
  public retry(obligation: IDeferredObligation, now: number): DeferralDecision {
    const age: number = now - Date.parse(obligation.createdAt);
    if (age >= this._schedule.maxDeferralMs) {
      return { action: 'expire' };
    }
    const notBefore: number = now + Math.min(this._schedule.capMs, Math.max(this._schedule.baseMs, age));
    return age >= this._schedule.capMs || obligation.waitsRemaining < 1
      ? { action: 'hold', notBefore }
      : { action: 'wait', notBefore };
  }

  /** What the repository holds for the obligation `key` names. */
  public async stateOf(key: IDeferredObligationKey): Promise<Result<DeferredObligationState>> {
    return this.taskIdFor(key).thenOnSuccess(async (taskId) => this._stateOf(taskId));
  }

  /**
   * Records that `deferral.key`'s change is owed later: the obligation's task is created, then set
   * waiting until `deferral.notBefore`.
   *
   * @remarks
   * Idempotent per change and role. An obligation already waiting is answered as it is; one left
   * `pending`, or as a pending registration, by an interrupted deferral is finished now; one already
   * settled answers `'settled'` — it was discharged or ended through that task, and the host only
   * needs to finish whatever it was deferring for.
   */
  public defer(deferral: IDeferral): Promise<Result<IDeferredObligation | 'settled'>> {
    return guarded(this._guard, async () =>
      (
        await this.taskIdFor(deferral.key).thenOnSuccess(async (taskId) =>
          (
            await this._stateOf(taskId)
          ).thenOnSuccess(async (found): Promise<Result<IDeferredObligation | 'settled'>> => {
            switch (found.state) {
              case 'settled':
                return succeed('settled');
              case 'waiting':
                return succeed(found.obligation);
              case 'pending':
                return this._waitFresh(taskId, found.revision, deferral);
              default:
                return (await this._create(taskId, deferral)).thenOnSuccess(async (revision) =>
                  this._waitFresh(taskId, revision, deferral)
                );
            }
          })
        )
      ).withErrorFormat(
        (message) => `deferred obligations: deferring ${this._keyLabel(deferral.key)}: ${message}`
      )
    );
  }

  /**
   * Sets `obligation` waiting again until `notBefore` (epoch milliseconds) — the next backoff, or a
   * merge that gives it other obligations' changes.
   *
   * @remarks
   * Refused, writing nothing, when it has no waits left ({@link IDeferredObligation.waitsRemaining}):
   * the task's operation budget is spent but for its closeout, and the host holds the retry in
   * memory instead. A wait identical to the current one writes nothing and answers the obligation as
   * it is. A task that moved since it was read fails on its revision.
   */
  public wait(
    obligation: IDeferredObligation,
    notBefore: number,
    change?: IDeferredObligationWait
  ): Promise<Result<IDeferredObligation>> {
    return guarded(this._guard, async () => {
      if (obligation.waitsRemaining < 1) {
        return fail(
          `deferred obligations: ${obligation.taskId} has no waits left in its operation budget; hold the ` +
            `retry instead`
        );
      }
      return (
        await this._reason(
          change?.changes ?? obligation.changes,
          change?.attention ?? obligation.attention,
          change?.summary ?? obligation.reason.summary,
          notBefore
        ).thenOnSuccess(async (reason) =>
          _same(reason, obligation.reason)
            ? succeed(obligation)
            : this._waitWith(obligation.taskId, obligation.revision, reason)
        )
      ).withErrorFormat((message) => `deferred obligations: waiting ${obligation.taskId}: ${message}`);
    });
  }

  /** Settles `obligation` as discharged, saying how, then archives it. Answers its task id. */
  public succeed(obligation: IDeferredObligation, summary: string): Promise<Result<TaskId>> {
    return guarded(this._guard, async () =>
      (
        await this._command(obligation.taskId, obligation.revision, {
          command: 'succeed',
          parameters: { outcome: { summary, artifacts: this._changeReferences(obligation.changes) } }
        })
      ).thenOnSuccess(async (revision) => this._archive(obligation.taskId, revision))
    );
  }

  /** Ends `obligation` undelivered with `reason`, then archives it. Answers its task id. */
  public cancel(obligation: IDeferredObligation, reason: string): Promise<Result<TaskId>> {
    return guarded(this._guard, async () =>
      this._cancel(obligation.taskId, obligation.revision, {
        code: this._codes.cancelled,
        summary: reason,
        attention: this._changeReferences(obligation.changes)
      })
    );
  }

  /**
   * Ends `obligation` as merged into `into`, which already owes its changes, then archives it.
   * Nothing was discharged through `obligation`, so it is cancelled — under the `merged` code, with
   * a reference to `into` — rather than succeeded. Fails, writing nothing, when `into` does not owe
   * every change `obligation` does: merge the changes into `into` first, with
   * {@link DeferredObligations.wait}.
   */
  public merged(obligation: IDeferredObligation, into: IDeferredObligation): Promise<Result<TaskId>> {
    return guarded(this._guard, async () => {
      const missing: ReadonlyArray<string> = obligation.changes.filter((c) => !into.changes.includes(c));
      if (into.taskId === obligation.taskId || missing.length > 0) {
        return fail(
          `deferred obligations: ${obligation.taskId} cannot be merged into ${into.taskId}: ` +
            (missing.length > 0 ? `it does not owe ${missing.join(', ')}` : 'they are the same obligation')
        );
      }
      return this._cancel(obligation.taskId, obligation.revision, {
        code: this._codes.merged,
        summary: `its changes are owed by ${into.taskId}`,
        attention: [
          { namespace: this._namespaces.obligation, key: into.taskId },
          ...this._changeReferences(obligation.changes)
        ]
      });
    });
  }

  /**
   * Ends and archives every obligation still `pending` — a deferral interrupted between its create
   * and its wait — that was created before `before` (epoch milliseconds), and answers the key of
   * each, so the host can record why that change will not be delivered to that role.
   *
   * @remarks
   * Only tasks that are `pending` both when listed and when cancelled are touched: each cancel
   * carries the revision it was listed at, so one that a replayed deferral set waiting in between
   * is refused and reported as an issue, not ended. A pending obligation is finished only when its
   * change is deferred again, so one still pending long after its creation would otherwise hold its
   * reservation for good.
   */
  public abandonPending(before: number): Promise<Result<IDeferredObligationSweep<IDeferredObligationKey>>> {
    return guarded(this._guard, async () =>
      (
        await _instantOf(before).thenOnSuccess(async (cutoff) =>
          (
            await this._list((cursor) => this._query(['pending'], 'open', cursor))
          ).thenOnSuccess(async (envelopes) => {
            const done: IDeferredObligationKey[] = [];
            const issues: string[] = [];
            for (const envelope of envelopes.filter((e) => e.createdAt < cutoff)) {
              const ended: Result<IDeferredObligationKey> = await this.keyOf(envelope.id).thenOnSuccess(
                async (key) =>
                  (
                    await this._cancel(envelope.id, envelope.revision, {
                      code: this._codes.abandoned,
                      summary: 'its deferral was interrupted and never finished',
                      attention: this._changeReferences([key.changeRef])
                    })
                  ).onSuccess(() => succeed(key))
              );
              if (ended.isSuccess()) {
                done.push(ended.value);
              } else {
                issues.push(ended.message);
              }
            }
            return succeed<IDeferredObligationSweep<IDeferredObligationKey>>({ done, issues });
          })
        )
      ).withErrorFormat((message) => `deferred obligations: abandoning pending obligations: ${message}`)
    );
  }

  /**
   * The waiting obligations due at `now` (epoch milliseconds), oldest `notBefore` first — from the
   * repository's due index, never a scan.
   */
  public async due(now: number): Promise<Result<IDeferredObligationListing>> {
    return (
      await _instantOf(now).thenOnSuccess(async (cutoff) =>
        this._listing((cursor) =>
          this._writer.queryDue({
            cutoff,
            filter: { lifecycleClass: 'open', statuses: ['waiting'] },
            limit: maxTaskPageLimit,
            ...(cursor !== undefined ? { cursor } : {})
          })
        )
      )
    ).withErrorFormat((message) => `deferred obligations: listing due obligations: ${message}`);
  }

  /** Every waiting obligation, due or not. */
  public async waiting(): Promise<Result<IDeferredObligationListing>> {
    return (await this._listing((cursor) => this._query(['waiting'], 'open', cursor))).withErrorFormat(
      (message) => `deferred obligations: listing waiting obligations: ${message}`
    );
  }

  /**
   * Archives every obligation that is settled but not yet archived — one whose archive did not land
   * after it was settled — which releases what it reserves. Answers the ids archived, and an issue
   * for each it could not.
   */
  public archiveSettled(): Promise<Result<IDeferredObligationSweep<TaskId>>> {
    return guarded(this._guard, async () =>
      (
        await (
          await this._list((cursor) => this._query(undefined, 'terminal', cursor))
        ).thenOnSuccess(async (envelopes) => {
          const done: TaskId[] = [];
          const issues: string[] = [];
          // One at a time: the repository has one writer.
          for (const envelope of envelopes) {
            const archived: Result<TaskId> = await this._archive(envelope.id, envelope.revision);
            if (archived.isSuccess()) {
              done.push(archived.value);
            } else {
              issues.push(archived.message);
            }
          }
          return succeed<IDeferredObligationSweep<TaskId>>({ done, issues });
        })
      ).withErrorFormat((message) => `deferred obligations: archiving settled obligations: ${message}`)
    );
  }

  /** What the repository holds for `taskId`, read through the bound view. */
  private async _stateOf(taskId: TaskId): Promise<Result<DeferredObligationState>> {
    const inspected = await this._writer.inspect(taskId);
    if (inspected.isFailure()) {
      return _classified(inspected).code === 'not-found-or-denied'
        ? succeed({ state: 'absent' })
        : fail(`reading ${taskId}: ${inspected.message}`);
    }
    const found = inspected.value;
    if (found.state !== 'resolved') {
      return fail(`${taskId} is not a resolved task`);
    }
    const envelope: IProjectedTaskEnvelope = found.envelope;
    if (found.archived || isTerminalTaskStatus(envelope.lifecycle.status)) {
      return succeed({ state: 'settled', status: envelope.lifecycle.status, archived: found.archived });
    }
    if (envelope.lifecycle.status === 'pending') {
      return succeed({ state: 'pending', revision: envelope.revision, createdAt: envelope.createdAt });
    }
    return this._obligationOf(envelope).onSuccess((obligation) =>
      succeed<DeferredObligationState>({ state: 'waiting', obligation })
    );
  }

  /**
   * Creates the obligation's task, pending, carrying the helper's scope and the deferral's — or
   * finishes a creation a crash interrupted, from the request the repository stored.
   */
  private async _create(taskId: TaskId, deferral: IDeferral): Promise<Result<TaskRevision>> {
    const scopes: ReadonlyArray<ITaskScope> = [this._scope, ...(deferral.scopes ?? [])];
    return this._operationId(taskId, 'create')
      .onSuccess((operationId) =>
        this._broker
          .bind({ principal: this._principal, scopes, authorization: this._authorization })
          .asResult.onSuccess((writer) => succeed({ writer, operationId }))
      )
      .thenOnSuccess(async ({ writer, operationId }) => {
        const resumed = await writer.resumePendingRegistration(taskId);
        if (resumed.isSuccess() || _classified(resumed).code !== 'not-found-or-denied') {
          return resumed.asResult.onSuccess((receipt) => succeed(receipt.revision));
        }
        return (
          await writer.createTracked({ taskId, operationId, title: deferral.title })
        ).asResult.onSuccess((created) => succeed(created.revision));
      })
      .then((created) => created.withErrorFormat((message) => `creating ${taskId}: ${message}`));
  }

  /** Sets a freshly created (or pending) obligation waiting, naming the change it was created for. */
  private async _waitFresh(
    taskId: TaskId,
    revision: TaskRevision,
    deferral: IDeferral
  ): Promise<Result<IDeferredObligation>> {
    return this._reason(
      [deferral.key.changeRef],
      deferral.attention ?? [],
      deferral.summary ?? 'deferred until its recipient is available',
      deferral.notBefore
    ).thenOnSuccess(async (reason) => this._waitWith(taskId, revision, reason));
  }

  /** Writes a wait, then reads the obligation back. */
  private async _waitWith(
    taskId: TaskId,
    revision: TaskRevision,
    reason: IWaitingReason
  ): Promise<Result<IDeferredObligation>> {
    return (await this._command(taskId, revision, { command: 'wait', parameters: { reason } }))
      .thenOnSuccess(async () => this._stateOf(taskId))
      .onSuccess((state) =>
        state.state === 'waiting'
          ? succeed(state.obligation)
          : fail<IDeferredObligation>(`${taskId} is ${state.state} after its wait`)
      );
  }

  /** A validated wait reason naming `changes` and `attention`. */
  private _reason(
    changes: ReadonlyArray<string>,
    attention: ReadonlyArray<ITaskReference>,
    summary: string,
    notBefore: number
  ): Result<IWaitingReason> {
    if (changes.length === 0) {
      return fail(`an obligation owes at least one change`);
    }
    const foreign: ITaskReference | undefined = attention.find(
      (r) => r.namespace === this._namespaces.change
    );
    if (foreign !== undefined) {
      return fail(`attention may not use the change namespace '${this._namespaces.change}'`);
    }
    const references: ReadonlyArray<ITaskReference> = [...attention, ...this._changeReferences(changes)];
    if (references.length > this._converters.bounds.maxReferences) {
      return fail(
        `${changes.length} changes and ${attention.length} references exceed the bound of ` +
          `${this._converters.bounds.maxReferences}`
      );
    }
    return _instantOf(notBefore).onSuccess((at) =>
      this._converters.values.waitingReason.convert({
        code: this._codes.wait,
        summary,
        notBefore: at,
        attention: references
      })
    );
  }

  /** Cancels an obligation with `reason`, then archives it. */
  private async _cancel(
    taskId: TaskId,
    revision: TaskRevision,
    reason: ITaskReason
  ): Promise<Result<TaskId>> {
    return (
      await this._command(taskId, revision, { command: 'cancel', parameters: { reason } })
    ).thenOnSuccess(async (next) => this._archive(taskId, next));
  }

  /** Runs one tracked command, keyed by the task and the revision it expects; answers the revision it applied at. */
  private async _command(
    taskId: TaskId,
    expectedRevision: TaskRevision,
    command: TrackedCommand
  ): Promise<Result<TaskRevision>> {
    return this._operationId(taskId, `r${expectedRevision}`)
      .onSuccess((operationId) =>
        JsonConverters.jsonValue
          .convert(command.parameters)
          .onSuccess((parameters) => succeed({ operationId, parameters }))
      )
      .thenOnSuccess(
        async ({ operationId, parameters }) =>
          (
            await this._writer.execute({
              taskId,
              operationId,
              expectedRevision,
              command: command.command,
              parameters
            })
          ).asResult
      )
      .then((executed) =>
        executed
          .onSuccess((receipt) =>
            receipt.result.state === 'applied'
              ? succeed(receipt.result.appliedRevision)
              : fail<TaskRevision>(`it was not applied (${receipt.result.state})`)
          )
          .withErrorFormat((message) => `'${command.command}' on ${taskId}: ${message}`)
      );
  }

  /** Archives a settled obligation. */
  private async _archive(taskId: TaskId, expectedRevision: TaskRevision): Promise<Result<TaskId>> {
    return this._operationId(taskId, 'archive')
      .thenOnSuccess(
        async (operationId) =>
          (await this._writer.archive({ taskId, operationId, expectedRevision })).asResult
      )
      .then((archived) =>
        archived
          .onSuccess(() => succeed(taskId))
          .withErrorFormat((message) => `archiving ${taskId}: ${message}`)
      );
  }

  /** The operation id `<taskId>.<step>`. */
  private _operationId(taskId: TaskId, step: string): Result<OperationId> {
    return this._converters.ids.operationId.convert(`${taskId}.${step}`);
  }

  /** Each change as the reference an obligation's reason carries for it. */
  private _changeReferences(changes: ReadonlyArray<string>): ReadonlyArray<ITaskReference> {
    return changes.map((key) => ({ namespace: this._namespaces.change, key }));
  }

  /** A query page over the helper's scope. */
  private _query(
    statuses: ReadonlyArray<TaskLifecycleStatus> | undefined,
    lifecycleClass: 'open' | 'terminal',
    cursor: PageCursor | undefined
  ): Promise<TaskResult<IBoundTaskPage>> {
    return this._writer.query({
      filter: { lifecycleClass, ...(statuses !== undefined ? { statuses } : {}) },
      limit: maxTaskPageLimit,
      ...(cursor !== undefined ? { cursor } : {})
    });
  }

  /** Every obligation of one paged selection that reads as one. */
  private async _listing(
    page: (cursor?: PageCursor) => Promise<TaskResult<IBoundTaskPage>>
  ): Promise<Result<IDeferredObligationListing>> {
    return (await this._list(page)).onSuccess((envelopes) => {
      const obligations: IDeferredObligation[] = [];
      const issues: string[] = [];
      for (const envelope of envelopes) {
        const read: Result<IDeferredObligation> = this._obligationOf(envelope);
        if (read.isSuccess()) {
          obligations.push(read.value);
        } else {
          issues.push(read.message);
        }
      }
      return succeed({ obligations, issues });
    });
  }

  /**
   * Every envelope of one paged selection. A listing the repository moves under — a page refused as
   * changed since it was authorized, or a stale cursor — is read again from the start, a bounded
   * number of times.
   */
  private async _list(
    page: (cursor?: PageCursor) => Promise<TaskResult<IBoundTaskPage>>
  ): Promise<Result<ReadonlyArray<IProjectedTaskEnvelope>>> {
    let last: string = '';
    for (let attempt = 0; attempt < _maxListingAttempts; attempt++) {
      const envelopes: IProjectedTaskEnvelope[] = [];
      let cursor: PageCursor | undefined = undefined;
      let restart: boolean = false;
      do {
        const read: TaskResult<IBoundTaskPage> = await page(cursor);
        if (read.isFailure()) {
          if (_classified(read).retry !== 'safe') {
            return fail(read.message);
          }
          last = read.message;
          restart = true;
          break;
        }
        envelopes.push(...read.value.items.map((item) => item.envelope));
        cursor = read.value.nextCursor;
      } while (cursor !== undefined);
      if (!restart) {
        return succeed(envelopes);
      }
    }
    return fail(`the listing kept changing while it was read: ${last}`);
  }

  /** A waiting obligation's envelope, read. */
  private _obligationOf(envelope: IProjectedTaskEnvelope): Result<IDeferredObligation> {
    const lifecycle = envelope.lifecycle;
    if (lifecycle.status !== 'waiting' || lifecycle.reason.code !== this._codes.wait) {
      return fail(`${envelope.id} is not a waiting obligation (${lifecycle.status})`);
    }
    const reason: IWaitingReason = lifecycle.reason;
    const references: ReadonlyArray<ITaskReference> = reason.attention ?? [];
    const changes: ReadonlyArray<string> = references
      .filter((r) => r.namespace === this._namespaces.change)
      .map((r) => r.key);
    if (changes.length === 0) {
      return fail(`${envelope.id} names no change`);
    }
    return this.keyOf(envelope.id).onSuccess((key) =>
      succeed<IDeferredObligation>({
        taskId: envelope.id,
        key,
        revision: envelope.revision,
        changes,
        attention: references.filter((r) => r.namespace !== this._namespaces.change),
        reason,
        ...(reason.notBefore !== undefined ? { notBefore: reason.notBefore } : {}),
        createdAt: envelope.createdAt,
        changedAt: envelope.changedAt,
        waitsRemaining: Math.max(0, this._operationBudget - _closeoutSlots - envelope.revision)
      })
    );
  }

  private _keyLabel(key: IDeferredObligationKey): string {
    return `${key.role}:${key.changeRef}`;
  }
}
