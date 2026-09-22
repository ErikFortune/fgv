/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Normalizer, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  ITaskContextInput,
  ITaskEnvelope,
  ITaskFailure,
  ITaskUpdate,
  IUnresolvedTaskReference,
  ObservationHealth,
  TaskId,
  TaskResult,
  TaskRevision
} from '../types';

/**
 * One task revision to present, after duplicates collapsed and conflicts were refused.
 * @internal
 */
export interface IRevisionCandidate {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  /** The validated, merged envelope for this revision, not yet projected. */
  readonly envelope: ITaskEnvelope;
  /** True when this revision is the task's current state in `input.tasks`. */
  readonly current: boolean;
  /** The distinct updates at this revision, ordered by update ID. */
  readonly updates: ReadonlyArray<ITaskUpdate>;
}

/**
 * The input reduced to distinct, mutually consistent candidates.
 * @internal
 */
export interface INormalizedInput {
  /** Ordered by task ID, then revision. */
  readonly revisions: ReadonlyArray<IRevisionCandidate>;
  /** Ordered by task ID. */
  readonly unresolved: ReadonlyArray<IUnresolvedTaskReference>;
}

interface IRevisionGroup {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly updates: ITaskUpdate[];
}

const conflictDetail: ITaskFailure = { code: 'conflict', retry: 'after-host-action' };
const invalidDetail: ITaskFailure = { code: 'invalid', retry: 'after-host-action' };

function _conflict<T>(message: string): TaskResult<T> {
  return failWithDetail<T, ITaskFailure>(message, conflictDetail);
}

/**
 * Ordinal comparison of UTF-16 code units — never locale-sensitive, so ordering is the same
 * on every host.
 * @internal
 */
export function compareOrdinal(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Collects a list of task results: every value, or the first failure with its detail.
 *
 * @remarks
 * `mapResults` would aggregate messages but drop the classified detail, and a host acts
 * differently on `conflict` than on `invalid`.
 * @internal
 */
export function allTaskResults<T>(results: Iterable<TaskResult<T>>): TaskResult<T[]> {
  const values: T[] = [];
  for (const result of results) {
    if (result.isFailure()) {
      return failWithDetail(result.message, result.detail);
    }
    values.push(result.value);
  }
  return succeedWithDetail(values);
}

function _groupBy<T>(items: ReadonlyArray<T>, key: (item: T) => string): Map<string, T[]> {
  const groups: Map<string, T[]> = new Map<string, T[]>();
  for (const item of items) {
    const k: string = key(item);
    const group: T[] | undefined = groups.get(k);
    if (group) {
      group.push(item);
    } else {
      groups.set(k, [item]);
    }
  }
  return groups;
}

function _observedAt(observation: ObservationHealth): string {
  return observation.state === 'current' ? observation.observedAt : observation.checkedAt;
}

function _revisionKey(taskId: string, revision: number): string {
  return `${taskId}@${revision}`;
}

/**
 * Deduplicates and conflict-checks validated context input.
 *
 * @remarks
 * The rules, from design §9:
 * - `tasks` is current state, so two different revisions of one task there is a conflict —
 *   the renderer does not choose freshness without a declared source contract.
 * - Values describing the same revision must agree on everything but observation telemetry.
 *   The newest observation wins; nothing about the choice depends on input order.
 * - An update ID names one payload, and one `(task, revision, category)` has one update.
 * - An update cannot be newer than the task's current state.
 * - A task cannot be both unresolved and resolved.
 * @internal
 */
export class InputNormalizer {
  private readonly _normalizer: Normalizer = new Normalizer();

  public normalize(input: ITaskContextInput): TaskResult<INormalizedInput> {
    return allTaskResults(
      Array.from(_groupBy(input.tasks, (s) => s.envelope.id).values()).map((group) =>
        this._mergeCurrent(group.map((s) => s.envelope))
      )
    )
      .onSuccess((current) =>
        allTaskResults(
          Array.from(_groupBy(input.updates ?? [], (u) => u.id).values()).map((group) =>
            this._mergeUpdates(group)
          )
        ).onSuccess((updates) => this._revisions(current, updates))
      )
      .onSuccess((revisions) =>
        this._unresolved(input.unresolved ?? [], revisions).onSuccess((unresolved) =>
          succeedWithDetail<INormalizedInput, ITaskFailure>({ revisions, unresolved })
        )
      );
  }

  private _canonical(label: string, value: unknown): TaskResult<string> {
    return this._normalizer
      .canonicalize(value)
      .withErrorFormat((message: string) => `${label}: ${message}`)
      .withFailureDetail(invalidDetail);
  }

  /**
   * Merges envelopes that must describe one revision: every semantic field equal, the newest
   * observation kept. Ties on the observation instant break on canonical form, so the choice
   * never depends on input order. `envelopes` is never empty.
   */
  private _mergeSameRevision(
    label: string,
    envelopes: ReadonlyArray<ITaskEnvelope>
  ): TaskResult<ITaskEnvelope> {
    return allTaskResults(
      envelopes.map((envelope) => {
        const { observation, ...semantic } = envelope;
        return this._canonical(label, semantic).onSuccess((key) =>
          this._canonical(label, observation).onSuccess((observed) =>
            succeedWithDetail({ envelope, key, rank: `${_observedAt(observation)} ${observed}` })
          )
        );
      })
    ).onSuccess((keyed) => {
      if (keyed.some((k) => k.key !== keyed[0].key)) {
        return _conflict(`${label}: conflicting presentation data for the same revision`);
      }
      const newest = keyed.reduce((best, k) => (k.rank > best.rank ? k : best));
      return succeedWithDetail({ ...keyed[0].envelope, observation: newest.envelope.observation });
    });
  }

  private _mergeCurrent(envelopes: ReadonlyArray<ITaskEnvelope>): TaskResult<ITaskEnvelope> {
    const taskId: string = envelopes[0].id;
    const revisions: ReadonlyArray<number> = Array.from(new Set(envelopes.map((e) => e.revision))).sort(
      (a, b) => a - b
    );
    if (revisions.length > 1) {
      return _conflict(
        `task ${taskId}: current input carries revisions ${revisions.join(', ')}; ` +
          'current state must be one revision'
      );
    }
    return this._mergeSameRevision(`task ${_revisionKey(taskId, revisions[0])}`, envelopes);
  }

  /** Merges copies of one update ID: identical apart from observation telemetry and audience order. */
  private _mergeUpdates(group: ReadonlyArray<ITaskUpdate>): TaskResult<ITaskUpdate> {
    const label: string = `update ${group[0].id}`;
    return allTaskResults(
      group.map((update) => {
        return this._canonical(label, {
          id: update.id,
          taskId: update.taskId,
          revision: update.revision,
          category: update.category,
          required: update.required,
          audience: [...update.audience].sort(compareOrdinal)
        });
      })
    )
      .onSuccess((keys) =>
        keys.some((k) => k !== keys[0])
          ? _conflict<ITaskEnvelope>(`${label}: conflicting values for one update id`)
          : this._mergeSameRevision(
              label,
              group.map((u) => u.snapshot.envelope)
            )
      )
      .onSuccess((envelope) =>
        succeedWithDetail<ITaskUpdate, ITaskFailure>({
          ...group[0],
          audience: [...group[0].audience].sort(compareOrdinal),
          snapshot: { envelope }
        })
      );
  }

  private _revisions(
    current: ReadonlyArray<ITaskEnvelope>,
    updates: ReadonlyArray<ITaskUpdate>
  ): TaskResult<IRevisionCandidate[]> {
    const currentByTask: Map<string, ITaskEnvelope> = new Map(current.map((e) => [e.id, e]));
    const groups: Map<string, IRevisionGroup> = new Map<string, IRevisionGroup>();
    const groupFor = (taskId: TaskId, revision: TaskRevision): IRevisionGroup => {
      const key: string = _revisionKey(taskId, revision);
      const existing: IRevisionGroup | undefined = groups.get(key);
      if (existing) {
        return existing;
      }
      const created: IRevisionGroup = { taskId, revision, updates: [] };
      groups.set(key, created);
      return created;
    };
    for (const envelope of current) {
      groupFor(envelope.id, envelope.revision);
    }
    for (const update of updates) {
      groupFor(update.taskId, update.revision).updates.push(update);
    }
    return allTaskResults(
      Array.from(groups.values()).map((group) => this._candidate(group, currentByTask.get(group.taskId)))
    ).onSuccess((candidates) =>
      succeedWithDetail(
        candidates.sort((a, b) => compareOrdinal(a.taskId, b.taskId) || a.revision - b.revision)
      )
    );
  }

  private _candidate(
    group: IRevisionGroup,
    current: ITaskEnvelope | undefined
  ): TaskResult<IRevisionCandidate> {
    const label: string = `task ${_revisionKey(group.taskId, group.revision)}`;
    if (current !== undefined && group.revision > current.revision) {
      return _conflict(`${label}: an update is newer than the current revision ${current.revision}`);
    }
    const categories: Set<string> = new Set(group.updates.map((u) => u.category));
    if (categories.size !== group.updates.length) {
      return _conflict(`${label}: more than one update of a category for one revision`);
    }
    const atCurrent: ITaskEnvelope | undefined = current?.revision === group.revision ? current : undefined;
    const envelopes: ITaskEnvelope[] = group.updates.map((u) => u.snapshot.envelope);
    if (atCurrent) {
      envelopes.push(atCurrent);
    }
    return this._mergeSameRevision(label, envelopes).onSuccess((envelope) =>
      succeedWithDetail<IRevisionCandidate, ITaskFailure>({
        taskId: group.taskId,
        revision: group.revision,
        envelope,
        current: atCurrent !== undefined,
        updates: [...group.updates].sort((a, b) => compareOrdinal(a.id, b.id))
      })
    );
  }

  private _unresolved(
    references: ReadonlyArray<IUnresolvedTaskReference>,
    revisions: ReadonlyArray<IRevisionCandidate>
  ): TaskResult<IUnresolvedTaskReference[]> {
    const resolved: Set<string> = new Set<string>(revisions.map((r) => r.taskId));
    return allTaskResults(
      Array.from(_groupBy(references, (r) => r.id).values()).map((group) => {
        const label: string = `unresolved ${group[0].id}`;
        if (resolved.has(group[0].id)) {
          return _conflict<IUnresolvedTaskReference>(`${label}: also supplied as resolved state`);
        }
        return allTaskResults(group.map((reference) => this._canonical(label, reference))).onSuccess((keys) =>
          keys.some((k) => k !== keys[0])
            ? _conflict<IUnresolvedTaskReference>(`${label}: conflicting values for one task`)
            : succeedWithDetail<IUnresolvedTaskReference, ITaskFailure>(group[0])
        );
      })
    ).onSuccess((unresolved) => succeedWithDetail(unresolved.sort((a, b) => compareOrdinal(a.id, b.id))));
  }
}
