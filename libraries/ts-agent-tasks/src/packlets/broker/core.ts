/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonObject, JsonValue } from '@fgv/ts-json-base';
import { Hash, Result } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import { TaskAudienceResolver } from '../implementations';
import {
  IReassignmentResult,
  IStoredTaskOperation,
  ITaskMutationResult,
  ITaskSource,
  ITaskCommitRecord,
  ITaskEnvironment,
  Instant,
  OperationId,
  TaskId,
  TaskResult,
  TaskRevision
} from '../types';
import { ITaskRepository, ITaskRepositoryWriter } from '../storage';
import { ok, taskFailure } from './failures';
import { ViewCursorTable } from './viewCursors';
import { WriterQueue } from './writerQueue';

const normalizer: Hash.Crc32Normalizer = new Hash.Crc32Normalizer();

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
 * The broker's shared state: one per repository.
 * @internal
 */
export class BrokerCore {
  public readonly repository: ITaskRepository;
  public readonly environment: ITaskEnvironment;
  public readonly converters: TaskConverters;
  public readonly audience: TaskAudienceResolver;
  /** The attached sources, by id. A task whose source is not here is left exactly as it is. */
  public readonly sources: ReadonlyMap<string, ITaskSource>;
  public readonly cursors: ViewCursorTable = new ViewCursorTable();
  /** The pump's continuations: the candidate they resume after never leaves the broker. */
  public readonly pumpCursors: ViewCursorTable<TaskId> = new ViewCursorTable<TaskId>('pump');
  private readonly _queue: WriterQueue = new WriterQueue();
  /** One reconciliation pass per source at a time: the tail of each source's chain. */
  private readonly _sourcePasses: Map<string, Promise<unknown>> = new Map();
  private _views: number = 0;

  public constructor(params: {
    readonly repository: ITaskRepository;
    readonly environment: ITaskEnvironment;
    readonly converters: TaskConverters;
    readonly audience: TaskAudienceResolver;
    readonly sources?: ReadonlyMap<string, ITaskSource>;
  }) {
    this.repository = params.repository;
    this.environment = params.environment;
    this.converters = params.converters;
    this.audience = params.audience;
    this.sources = params.sources ?? new Map();
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
    return this._queue.run(() => this.repository.withWriter(section));
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
