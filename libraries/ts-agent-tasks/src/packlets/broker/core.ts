/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonObject, JsonValue } from '@fgv/ts-json-base';
import { AsyncControl } from '@fgv/ts-extras';
import {
  Converter,
  Hash,
  Result,
  captureAsyncResult,
  captureResult,
  fail,
  failWithDetail
} from '@fgv/ts-utils';
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
  ITaskFailure,
  ITaskWriteGuard,
  Instant,
  OperationId,
  TaskId,
  TaskResult,
  TaskRevision
} from '../types';
import { ITaskRepository, ITaskRepositoryWriter } from '../storage';
import { IResolvedDeliveryDefaults } from './delivery';
import { ok, taskFailure } from './failures';
import { ViewCursorTable } from './viewCursors';
import { WriterQueue } from './writerQueue';

const normalizer: Hash.Crc32Normalizer = new Hash.Crc32Normalizer();

/** The default timer: `setTimeout`, cancelled by `clearTimeout`. */
const defaultSchedule: AsyncControl.ScheduleTimer = (fn, ms) => {
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
 *
 * @remarks
 * The section is wrapped so the broker knows whether the guard started it and how it settled:
 * - not started, and the guard refused with a valid task failure as its detail — that failure;
 * - not started, and the guard refused without one (a gate typed over plain `Result`) —
 *   `storage-unavailable`, retry `after-host-action`: nothing was written;
 * - not started, and the guard answered success or something that is not a `Result` — `invalid`:
 *   there is no section result to report;
 * - not started, and the guard threw — `invalid`: nothing was written;
 * - started and fulfilled, and the guard then returned the section's own result, or any success —
 *   the section's result;
 * - started, and then the guard failed, threw or answered something that is not a `Result`, or the
 *   section itself rejected — `storage-unavailable`, retry `reconcile-first`: the section may have
 *   committed, so its outcome is re-read before anything is retried;
 * - a second call to the section — refused without running it, `invalid`.
 *
 * A section the guard started and did not await is awaited before the turn ends, so the writer is
 * never still held when the next section runs, and its outcome is classified as above. A section
 * the guard tries to start **after the broker has observed its answer** is refused without running
 * (`invalid`): it would run outside the queue's turn. Observing lags the answer's settlement by a
 * few microtasks; a section started inside that window is awaited and classified as started.
 */
async function _guarded<T>(
  guard: ITaskWriteGuard,
  write: () => Promise<TaskResult<T>>,
  failure: Converter<ITaskFailure>
): Promise<TaskResult<T>> {
  const seen: {
    started: boolean;
    ran?: TaskResult<T>;
    running: Promise<unknown>;
    calls: number;
    closed: boolean;
  } = {
    started: false,
    // Replaced by the section's own promise once the guard starts it.
    running: Promise.resolve(),
    calls: 0,
    closed: false
  };
  const once = async (): Promise<TaskResult<T>> => {
    if (seen.closed) {
      return taskFailure<T>(
        `broker: the write guard started the section after the broker had observed its answer; it was not run`,
        'invalid',
        'after-host-action'
      );
    }
    seen.calls++;
    if (seen.calls > 1) {
      return taskFailure<T>(
        `broker: the write guard ran the section more than once`,
        'invalid',
        'after-host-action'
      );
    }
    // Marked before the section is called: a section that rejects may still have committed.
    seen.started = true;
    // Started inside an executor, so a repository whose `withWriter` throws synchronously becomes
    // this promise's rejection — and its message — rather than an escape from `once`.
    const running: Promise<TaskResult<T>> = new Promise<TaskResult<T>>((resolve) => resolve(write())).then(
      (result) => {
        seen.ran = result;
        return result;
      }
    );
    seen.running = running;
    return running;
  };
  // The guard answers any PromiseLike; awaiting it inside an async function adopts it.
  const outcome: Result<Result<T>> = await captureAsyncResult(async () => guard.guard(once));
  // From here on the turn is ending: a section started now would run outside it.
  seen.closed = true;
  // A section the guard started but did not wait for still holds the writer: wait for it here.
  const settled: Result<unknown> = await captureAsyncResult(() => seen.running);
  // Whether the guard's answer is a success; a failure here means it threw or is not a Result.
  const answered: Result<boolean> = outcome.onSuccess((value) => captureResult(() => value.isSuccess()));
  if (seen.started) {
    const written: TaskResult<T> | undefined = seen.ran;
    if (
      written !== undefined &&
      answered.isSuccess() &&
      (answered.value || outcome.orDefault() === written)
    ) {
      return written;
    }
    const guardDid: string = outcome.isFailure()
      ? `threw: ${outcome.message}`
      : answered.isFailure()
      ? `answered something that is not a Result`
      : answered.value
      ? `answered success`
      : `failed: ${outcome.value.message}`;
    const own: string =
      written === undefined
        ? `rejected: ${String(settled.message)}`
        : written.isSuccess()
        ? 'success'
        : written.message;
    return taskFailure<T>(
      `broker: the write guard ${guardDid} after the section ran (its own outcome: ${own}); ` +
        `re-read what it may have committed`,
      'storage-unavailable',
      'reconcile-first'
    );
  }
  if (outcome.isFailure()) {
    return taskFailure<T>(
      `broker: the write guard threw: ${outcome.message}`,
      'invalid',
      'after-host-action'
    );
  }
  if (answered.isFailure()) {
    return taskFailure<T>(
      `broker: the write guard answered something that is not a Result without running the section`,
      'invalid',
      'after-host-action'
    );
  }
  const result: Result<T> = outcome.value;
  if (result.isSuccess()) {
    return taskFailure<T>(
      `broker: the write guard answered success without running the section`,
      'invalid',
      'after-host-action'
    );
  }
  // The section was never started, so nothing was written. A refusal keeps its classification only
  // when it carries a valid task failure; a gate typed over plain Result refuses without one. The
  // check is structural and the converter validates the detail, so a failure built by another copy
  // of ts-utils is read the same way an `instanceof` check would miss.
  const classified: Result<ITaskFailure> =
    'detail' in result ? failure.convert(result.detail) : fail('no task detail');
  return classified.isSuccess()
    ? failWithDetail<T, ITaskFailure>(result.message, classified.value)
    : taskFailure<T>(
        `broker: the write guard refused: ${result.message}`,
        'storage-unavailable',
        'after-host-action'
      );
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
  private readonly _schedule: AsyncControl.ScheduleTimer;
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
    readonly schedule?: AsyncControl.ScheduleTimer;
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
    return this._queue.run(() =>
      guard === undefined ? write() : _guarded(guard, write, this.converters.failures.failure)
    );
  }

  /**
   * Resolves once no gated section is waiting or running, or fails after `timeoutMs`.
   *
   * @remarks
   * Observes the queue and never takes a turn in it, so it never takes the writer. Idle is a moment
   * between sections, not a hold and not the end of an operation: a section enqueued right after it
   * resolves runs as usual.
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
      // The host's cancel is host code: a throw from it never escapes into the writer queue.
      const cancelArmed = (): void => {
        if (cancel !== undefined) {
          captureResult(cancel);
        }
      };
      const settle = (outcome: TaskResult<true>): void => {
        if (!settled) {
          settled = true;
          withdraw?.();
          cancelArmed();
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
        settle(
          taskFailure<true>(`whenIdle: schedule failed: ${armed.message}`, 'invalid', 'after-host-action')
        );
        return;
      }
      cancel = armed.value;
      // A timer that fired synchronously from `schedule` has settled already: cancel it, register nothing.
      if (settled) {
        cancelArmed();
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
