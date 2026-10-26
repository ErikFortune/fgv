/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonObject, JsonValue } from '@fgv/ts-json-base';
import { Hash, Result, captureAsyncResult, captureResult } from '@fgv/ts-utils';
import { TaskContextRenderer } from '../context';
import { TaskConverters, instant } from '../converters';
import { TaskAudienceResolver } from '../implementations';
import {
  IReassignmentResult,
  IStoredTaskOperation,
  ITaskMutationResult,
  ITaskSource,
  ITaskCommitRecord,
  DeliveryId,
  ITaskEnvironment,
  ITaskWriteGuard,
  Instant,
  OperationId,
  TaskId,
  TaskResult,
  TaskRevision,
  TaskScheduleTimer
} from '../types';
import { ITaskRepository, ITaskRepositoryWriter } from '../storage';
import { IResolvedDeliveryDefaults } from './delivery';
import { ok, taskFailure } from './failures';
import { ViewCursorTable } from './viewCursors';
import { WriterQueue } from './writerQueue';

const normalizer: Hash.Crc32Normalizer = new Hash.Crc32Normalizer();

/** The default timer: `setTimeout`, cancelled by `clearTimeout`. */
const defaultSchedule: TaskScheduleTimer = (fn, ms) => {
  const handle = setTimeout(fn, ms);
  return () => clearTimeout(handle);
};

/**
 * Canonical equality of two converter-validated values; an uncomparable pair is unequal, which
 * every caller treats as the refusing answer.
 * @internal
 */
export function canonicallySame(a: unknown, b: unknown): boolean {
  const left: Result<string> = normalizer.canonicalize(a);
  const right: Result<string> = normalizer.canonicalize(b);
  return left.isSuccess() && right.isSuccess() && left.value === right.value;
}

/**
 * The canonical text of a JSON value — the same identity the repository keys bindings by, so two
 * spellings of one reference are one key.
 * @internal
 */
export function canonicalKey(value: unknown): Result<string> {
  return normalizer.canonicalize(value);
}

/**
 * The semantic revision of a record.
 * @internal
 */
export function revisionOf(record: ITaskCommitRecord): TaskRevision {
  return record.recordType === 'resolved' ? record.task.envelope.revision : record.reference.revision;
}

/**
 * The stored operation a record holds under an operation id, if any.
 * @internal
 */
export function storedOperation(
  record: ITaskCommitRecord,
  operationId: OperationId
): IStoredTaskOperation | undefined {
  return record.operations.find((op) => op.operationId === operationId);
}

/**
 * A mutation receipt as stored JSON, built field by field: a receipt the broker computed is
 * always representable, so this cannot fail.
 * @internal
 */
export function receiptJson(receipt: ITaskMutationResult | IReassignmentResult): JsonObject {
  const label = (value: { readonly namespace: string; readonly key: string }): JsonObject => ({
    namespace: value.namespace,
    key: value.key
  });
  return {
    taskId: receipt.taskId,
    revision: receipt.revision,
    operationId: receipt.operationId,
    disposition: receipt.disposition,
    updateIds: [...receipt.updateIds],
    ...('previous' in receipt && receipt.previous !== undefined ? { previous: label(receipt.previous) } : {}),
    ...('current' in receipt && receipt.current !== undefined ? { current: label(receipt.current) } : {})
  };
}

/**
 * Runs `write` through a host's write guard, keeping a classified result whatever the guard does.
 */
async function _guarded<T>(guard: ITaskWriteGuard, write: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> {
  const outcome: Result<TaskResult<T>> = await captureAsyncResult(() => guard.guard(write));
  if (outcome.isFailure()) {
    return taskFailure<T>(`broker: the write guard threw: ${outcome.message}`, 'invalid', 'after-host-action');
  }
  const result: TaskResult<T> = outcome.value;
  // A gate typed over plain Result refuses without task detail: nothing was written.
  return result.isFailure() && result.detail === undefined
    ? taskFailure<T>(`broker: the write guard refused: ${result.message}`, 'storage-unavailable', 'after-host-action')
    : result;
}

/**
 * The broker's shared state: one per repository.
 * @internal
 */
export class BrokerCore {
  public readonly repository: ITaskRepository;
  public readonly environment: ITaskEnvironment;
  public readonly converters: TaskConverters;
  /** Who is owed an update: the repository's own subscriptions, which its commits verify against. */
  public readonly audience: TaskAudienceResolver;
  /** Delivery defaults for new subscriptions and issued receipts. */
  public readonly delivery: IResolvedDeliveryDefaults;
  /** The pure renderer preparation wraps. Its projection is identity: input arrives projected. */
  public readonly renderer: TaskContextRenderer;
  /** The attached sources, by id. A task whose source is not here is left exactly as it is. */
  public readonly sources: ReadonlyMap<string, ITaskSource>;
  public readonly cursors: ViewCursorTable = new ViewCursorTable();
  /** The pump's continuations: the candidate they resume after never leaves the broker. */
  public readonly pumpCursors: ViewCursorTable<TaskId> = new ViewCursorTable<TaskId>('pump');
  /**
   * The stops whose external stable-stop evidence this broker instance has revalidated in a full pump
   * pass. Nothing persists it: after a reopen every such stop is presented unsatisfied until a pass
   * revalidates its evidence against the sources as they are now (design § 10 step 6).
   */
  public readonly revalidatedStops: Set<string> = new Set<string>();
  private readonly _queue: WriterQueue = new WriterQueue();
  private readonly _writeGuard: ITaskWriteGuard | undefined;
  private readonly _schedule: TaskScheduleTimer;
  /** One reconciliation pass per source at a time: the tail of each source's chain. */
  private readonly _sourcePasses: Map<string, Promise<unknown>> = new Map();
  private _views: number = 0;

  public constructor(params: {
    readonly repository: ITaskRepository;
    readonly environment: ITaskEnvironment;
    readonly converters: TaskConverters;
    readonly delivery: IResolvedDeliveryDefaults;
    readonly renderer: TaskContextRenderer;
    readonly sources?: ReadonlyMap<string, ITaskSource>;
    readonly writeGuard?: ITaskWriteGuard;
    readonly schedule?: TaskScheduleTimer;
  }) {
    const repository: ITaskRepository = params.repository;
    this.repository = repository;
    this.environment = params.environment;
    this.converters = params.converters;
    this.audience = (before, after, category) => repository.audience(before, after, category);
    this.delivery = params.delivery;
    this.renderer = params.renderer;
    this.sources = params.sources ?? new Map();
    this._writeGuard = params.writeGuard;
    this._schedule = params.schedule ?? defaultSchedule;
  }

  /** A fresh delivery id from the host's id factory. */
  public mintDeliveryId(): TaskResult<DeliveryId> {
    const minted: Result<DeliveryId> = captureResult(() => this.environment.newId())
      .onSuccess((raw) => raw)
      .onSuccess((raw) => this.converters.ids.deliveryId.convert(raw));
    return minted.isSuccess()
      ? ok(minted.value)
      : taskFailure(`delivery id: ${minted.message}`, 'storage-unavailable', 'safe');
  }

  /** A fresh operation id from the host's id factory: a stop attempt's command key. */
  public mintOperationId(): TaskResult<OperationId> {
    const minted: Result<OperationId> = captureResult(() => this.environment.newId())
      .onSuccess((raw) => raw)
      .onSuccess((raw) => this.converters.ids.operationId.convert(raw));
    return minted.isSuccess()
      ? ok(minted.value)
      : taskFailure(`operation id: ${minted.message}`, 'storage-unavailable', 'safe');
  }

  /** The canonical instant `ms` milliseconds after `from`. */
  public later(from: Instant, ms: number): Result<Instant> {
    return captureResult(() => new Date(Date.parse(from) + ms).toISOString()).onSuccess((text) =>
      instant.convert(text)
    );
  }

  /**
   * Runs a reconciliation pass after every earlier pass of the same source has finished, so two
   * passes never read the same cursor and race to commit past each other.
   */
  public serializedPass<T>(sourceId: string, pass: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> {
    const previous: Promise<unknown> = this._sourcePasses.get(sourceId) ?? Promise.resolve();
    const turn: Promise<TaskResult<T>> = previous.then(pass, pass);
    this._sourcePasses.set(sourceId, turn);
    return turn;
  }

  /** A fresh identity for a bound view, which its cursors are bound to. */
  public nextView(): number {
    return ++this._views;
  }

  /**
   * Runs a gated section: after every earlier one, holding the repository's single writer.
   * Everything a section commits is decided from what it reads through that writer.
   */
  public gated<T>(
    section: (writer: ITaskRepositoryWriter) => Promise<TaskResult<T>>
  ): Promise<TaskResult<T>> {
    const write = (): Promise<TaskResult<T>> => this.repository.withWriter(section);
    const guard: ITaskWriteGuard | undefined = this._writeGuard;
    // Inside the queue's turn and around the writer: every gated section, whatever it writes, passes
    // the host's gate, and a section the gate holds holds the queue behind it.
    return this._queue.run(() => (guard === undefined ? write() : _guarded(guard, write)));
  }

  /**
   * Resolves once no gated section is waiting or running, or fails after `timeoutMs`.
   *
   * @remarks
   * Observes the queue and never takes a turn in it, so it never takes the writer. Idle is a moment,
   * not a hold: a section enqueued right after it resolves runs as usual.
   */
  public whenIdle(timeoutMs: number): Promise<TaskResult<true>> {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 0) {
      return Promise.resolve(
        taskFailure<true>(
          `whenIdle: timeoutMs must be a non-negative safe integer`,
          'invalid',
          'after-host-action'
        )
      );
    }
    if (!this._queue.busy) {
      return Promise.resolve(ok<true>(true));
    }
    return new Promise<TaskResult<true>>((resolve) => {
      let settled: boolean = false;
      let withdraw: (() => void) | undefined = undefined;
      let cancel: (() => void) | undefined = undefined;
      const settle = (outcome: TaskResult<true>): void => {
        if (!settled) {
          settled = true;
          withdraw?.();
          cancel?.();
          resolve(outcome);
        }
      };
      const armed: Result<() => void> = captureResult(() =>
        this._schedule(
          () =>
            settle(
              taskFailure<true>(
                `whenIdle: the broker's writer queue was still busy after ${timeoutMs} ms`,
                'conflict',
                'safe'
              )
            ),
          timeoutMs
        )
      );
      if (armed.isFailure()) {
        settle(taskFailure<true>(`whenIdle: schedule failed: ${armed.message}`, 'invalid', 'after-host-action'));
        return;
      }
      cancel = armed.value;
      // A timer that fired synchronously from `schedule` has settled already: cancel it, register nothing.
      if (settled) {
        cancel();
        return;
      }
      withdraw = this._queue.onIdle(() => settle(ok<true>(true)));
    });
  }

  /** The current instant from the host clock. */
  public now(): TaskResult<Instant> {
    const now: Result<Instant> = this.environment.now();
    return now.isSuccess()
      ? ok(now.value)
      : taskFailure(`clock: ${now.message}`, 'storage-unavailable', 'safe');
  }

  /**
   * A validated value as stored JSON. Every value passed here has been converted already; the
   * conversion is the type-safe way to state that it is JSON.
   */
  public toJson(value: unknown): TaskResult<JsonValue> {
    const json: Result<JsonValue> = JsonConverters.jsonValue.convert(value);
    return json.isSuccess() ? ok(json.value) : taskFailure(json.message, 'invalid', 'after-host-action');
  }
}
