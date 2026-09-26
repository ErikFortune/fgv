/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import {
  DetailedResult,
  Logging,
  Result,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import {
  CheckpointWriteVisibility,
  FileTreeTaskRepository,
  IBoundTaskDelivery,
  ITaskAuthorization,
  ITaskCapacityDimensionStatus,
  ITaskCapacityProfile,
  ITaskCheckpointStore,
  ITaskConsumerRecord,
  ITaskDeliveryDefaults,
  ITaskRepository,
  ITaskScope,
  ITaskSubscription,
  SubscriptionId,
  TaskBroker,
  TaskEnvironment,
  TaskRepositoryMode,
  UpdateCategory,
  allUpdateCategories
} from '../../index';
import { IBrokerHarness, TestPolicy, alpha, brokerRegistry } from './brokerFixtures';
import { at, memoryRoot } from './storageFixtures';

/** How an {@link InMemoryCheckpointStore} misbehaves, if it does. */
export type CheckpointFault =
  | 'none'
  /** Every call throws. */
  | 'throw'
  /** `write` answers success and stores nothing. */
  | 'neutered'
  /** `read` answers the record as it was before the last write. */
  | 'stale'
  /** `read` answers another subscription's record. */
  | 'foreign'
  /** `read` answers something that is not a record. */
  | 'garbage'
  /** `write` fails, saying nothing changed. */
  | 'fail-unchanged'
  /** `write` fails, saying it cannot tell. */
  | 'fail-unknown'
  /** `write` returns something that is not a result. */
  | 'not-a-result'
  /** `write` stores honestly, and every `read` after it fails. */
  | 'fail-read-back'
  /** `read` returns something that is not a result. */
  | 'read-not-a-result'
  /** `read` answers a value JSON cannot express. */
  | 'read-not-json';

/**
 * A host checkpoint store over a map, which persists across repository reopen when the same
 * instance is passed again — the test double every injected-store test uses.
 *
 * @remarks
 * Honest unless a fault is set. It really stores what it is given (a deep copy) and really answers
 * it back, so a test that relies on persistence goes red if `write` stops storing: that is checked
 * by setting `neutered` and watching the persistence tests fail.
 */
export class InMemoryCheckpointStore implements ITaskCheckpointStore {
  public readonly durability: 'session' | 'process-crash';
  public readonly records: Map<string, ITaskConsumerRecord> = new Map();
  private readonly _previous: Map<string, ITaskConsumerRecord> = new Map();
  public fault: CheckpointFault = 'none';
  private _wrote: boolean = false;
  public reads: number = 0;
  public writes: number = 0;

  public constructor(durability: 'session' | 'process-crash' = 'session') {
    this.durability = durability;
  }

  public read(subscriptionId: SubscriptionId): Result<unknown> {
    this.reads++;
    switch (this.fault) {
      case 'throw':
        throw new Error('checkpoint store exploded');
      case 'stale':
        return succeed(this._previous.get(subscriptionId) ?? this.records.get(subscriptionId));
      case 'foreign': {
        const other = Array.from(this.records.values()).find((r) => r.id !== subscriptionId);
        return succeed(other ?? this.records.get(subscriptionId));
      }
      case 'garbage':
        return succeed({ nonsense: true });
      case 'read-not-a-result':
        return { value: this.records.get(subscriptionId) } as unknown as Result<unknown>;
      case 'read-not-json':
        return succeed(() => this.records.get(subscriptionId));
      case 'fail-read-back':
        return this._wrote
          ? fail('checkpoint store read failed')
          : succeed(structuredClone(this.records.get(subscriptionId)));
      default:
        return succeed(structuredClone(this.records.get(subscriptionId)));
    }
  }

  public write(
    subscriptionId: SubscriptionId,
    expectedRecordRevision: number,
    record: ITaskConsumerRecord
  ): DetailedResult<true, CheckpointWriteVisibility> {
    this.writes++;
    switch (this.fault) {
      case 'throw':
        throw new Error('checkpoint store exploded');
      case 'neutered':
        return succeedWithDetail(true);
      case 'fail-unchanged':
        return failWithDetail('store refused', 'unchanged');
      case 'fail-unknown':
        return failWithDetail('store lost the connection', 'unknown');
      case 'not-a-result':
        return 'ok' as unknown as DetailedResult<true, CheckpointWriteVisibility>;
      default:
        break;
    }
    const current: ITaskConsumerRecord | undefined = this.records.get(subscriptionId);
    if ((current?.recordRevision ?? 0) !== expectedRecordRevision) {
      return failWithDetail(
        `expected revision ${expectedRecordRevision}, holding ${current?.recordRevision ?? 0}`,
        'unchanged'
      );
    }
    if (current !== undefined) {
      this._previous.set(subscriptionId, current);
    }
    this.records.set(subscriptionId, structuredClone(record));
    this._wrote = this.fault === 'fail-read-back';
    return succeedWithDetail(true);
  }
}

/** A clock a test can move. */
export class TestClock {
  public now: number = Date.parse(at);
  /** The id sequence of environments over this clock. */
  public ids: number = 0;

  public advance(ms: number): void {
    this.now += ms;
  }
}

/** A delivery test harness: a broker, its repository, `alice`'s policy and writer, a movable clock. */
export interface IDeliveryHarness extends IBrokerHarness {
  readonly clock: TestClock;
  readonly checkpoints?: InMemoryCheckpointStore;
  readonly defaults?: ITaskDeliveryDefaults;
}

/**
 * An environment over a movable clock and a sequential id factory. The sequence belongs to the clock,
 * so two harnesses built the same way mint the same ids — and so write records of the same size,
 * which is what lets a probe measure what a second repository will hold.
 */
export function clockedEnvironment(clock: TestClock): {
  env: TaskEnvironment;
  logger: Logging.InMemoryLogger;
} {
  const logger: Logging.InMemoryLogger = new Logging.InMemoryLogger('detail');
  const env: TaskEnvironment = TaskEnvironment.create({
    logger,
    clock: () => clock.now,
    newId: () => succeed(`d-${++clock.ids}`)
  }).orThrow();
  return { env, logger };
}

/** A fresh repository and broker for delivery tests. */
export async function deliveryHarness(options?: {
  readonly profile?: ITaskCapacityProfile;
  readonly checkpoints?: InMemoryCheckpointStore;
  readonly defaults?: ITaskDeliveryDefaults;
  readonly root?: FileTree.IFileTreeDirectoryItem;
  readonly mode?: TaskRepositoryMode;
  readonly clock?: TestClock;
}): Promise<IDeliveryHarness> {
  const clock: TestClock = options?.clock ?? new TestClock();
  const root: FileTree.IFileTreeDirectoryItem = options?.root ?? memoryRoot();
  const { env, logger } = clockedEnvironment(clock);
  const repository: ITaskRepository = (
    await FileTreeTaskRepository.initialize({
      root,
      mode: options?.mode ?? 'session',
      environment: env,
      registry: brokerRegistry(),
      ...(options?.profile !== undefined ? { profile: options.profile } : {}),
      ...(options?.checkpoints !== undefined ? { checkpoints: options.checkpoints } : {})
    })
  ).orThrow();
  return harnessFor(repository, env, logger, root, clock, options);
}

/** A harness over an open repository, with a fresh broker. */
export function harnessFor(
  repository: ITaskRepository,
  env: TaskEnvironment,
  logger: Logging.InMemoryLogger,
  root: FileTree.IFileTreeDirectoryItem,
  clock: TestClock,
  options?: { readonly checkpoints?: InMemoryCheckpointStore; readonly defaults?: ITaskDeliveryDefaults }
): IDeliveryHarness {
  const broker: TaskBroker = TaskBroker.create({
    repository,
    environment: env,
    ...(options?.defaults !== undefined ? { delivery: options.defaults } : {})
  }).orThrow();
  const policy: TestPolicy = new TestPolicy();
  const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
  return {
    root,
    repository,
    broker,
    policy,
    writer,
    env,
    logger,
    clock,
    ...(options?.checkpoints !== undefined ? { checkpoints: options.checkpoints } : {}),
    ...(options?.defaults !== undefined ? { defaults: options.defaults } : {})
  };
}

/** Reopens a harness's root (and its injected store, if any) as a fresh repository and broker. */
export async function reopen(
  h: IDeliveryHarness,
  defaults?: ITaskDeliveryDefaults
): Promise<IDeliveryHarness> {
  h.repository.close().orThrow();
  const { env, logger } = clockedEnvironment(h.clock);
  const opened = (
    await FileTreeTaskRepository.open({
      root: h.root,
      mode: h.repository.mode,
      environment: env,
      registry: brokerRegistry(),
      ...(h.checkpoints !== undefined ? { checkpoints: h.checkpoints } : {})
    })
  ).orThrow();
  if (opened.state !== 'ready') {
    throw new Error(`reopen: recovery required: ${JSON.stringify(opened.recovery.report.issues)}`);
  }
  return harnessFor(opened.repository, env, logger, h.root, h.clock, {
    ...(h.checkpoints !== undefined ? { checkpoints: h.checkpoints } : {}),
    ...(defaults !== undefined ? { defaults } : h.defaults !== undefined ? { defaults: h.defaults } : {})
  });
}

/** Every category, ascending. */
export const everyCategory: ReadonlyArray<UpdateCategory> = [...allUpdateCategories].sort();

/**
 * Subscribes on behalf of `alice` (her policy decides the baseline). Defaults: every category, all
 * lifecycle classes of `alpha`, from now.
 */
export async function subscribeAs(
  h: IDeliveryHarness,
  id: string,
  options?: {
    readonly consumer?: string;
    readonly start?: 'current' | 'from-now';
    readonly selection?: Record<string, unknown>;
    readonly scopes?: ReadonlyArray<ITaskScope>;
    readonly categories?: ReadonlyArray<UpdateCategory>;
    readonly policy?: Record<string, unknown>;
    readonly authorization?: ITaskAuthorization;
    readonly operationId?: string;
  }
): Promise<ReturnType<TaskBroker['subscribe']> extends Promise<infer R> ? R : never> {
  const scopes: ReadonlyArray<ITaskScope> = options?.scopes ?? [alpha];
  return h.broker.subscribe(
    { principal: 'alice', scopes, authorization: options?.authorization ?? h.policy },
    {
      subscriptionId: id,
      operationId: options?.operationId ?? `subscribe-${id}`,
      consumerId: options?.consumer ?? `consumer-${id}`,
      selection: { scopes, lifecycleClass: 'all', ...(options?.selection ?? {}) },
      start: options?.start ?? 'from-now',
      policy: {
        ...(options?.categories !== undefined
          ? { categories: options.categories }
          : { categories: everyCategory }),
        ...(options?.policy ?? {})
      }
    }
  );
}

/** Subscribes, throwing on failure. */
export async function subscribed(
  h: IDeliveryHarness,
  id: string,
  options?: Parameters<typeof subscribeAs>[2]
): Promise<ITaskSubscription> {
  return (await subscribeAs(h, id, options)).orThrow();
}

/** Binds `alice`'s delivery of a subscription. */
export function deliveryOf(
  h: IDeliveryHarness,
  id: string,
  options?: {
    readonly consumer?: string;
    readonly authorization?: ITaskAuthorization;
    readonly principal?: string;
  }
): IBoundTaskDelivery {
  return h.broker
    .bindDelivery({
      principal: options?.principal ?? 'alice',
      scopes: [alpha],
      authorization: options?.authorization ?? h.policy,
      subscriptionId: id as SubscriptionId,
      consumerId: (options?.consumer ?? `consumer-${id}`) as never
    })
    .orThrow();
}

/** The ids of what a delivery is owed and may see, in order. */
export async function pendingIds(delivery: IBoundTaskDelivery): Promise<string[]> {
  return (await delivery.pending({ limit: 200 })).orThrow().updates.map((u) => u.id);
}

/** One capacity dimension's status row. */
export function dimension(repository: ITaskRepository, name: string): ITaskCapacityDimensionStatus {
  return repository
    .capacityStatus()
    .orThrow()
    .dimensions.find((d) => d.dimension === name)!;
}

/** `used + reserved` for a dimension. */
export function committedIn(repository: ITaskRepository, name: string): number {
  const row: ITaskCapacityDimensionStatus = dimension(repository, name);
  return row.used + row.reserved;
}

/** The committed consumer record, read through the repository's writer. */
export async function consumerRecord(repository: ITaskRepository, id: string): Promise<ITaskConsumerRecord> {
  return (await repository.withWriter((w) => w.readSubscription(id as SubscriptionId))).orThrow()!;
}

/** A host policy that allows everything and never changes epoch. */
export const allowEverything: ITaskAuthorization = {
  check: async () => succeed(true),
  policyEpoch: () => 'fixed'
};
