/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import { Hash, Result } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import { TaskAudienceResolver } from '../implementations';
import {
  IStoredTaskOperation,
  ITaskCommitRecord,
  ITaskEnvironment,
  Instant,
  OperationId,
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
 * The broker's shared state: one per repository.
 * @internal
 */
export class BrokerCore {
  public readonly repository: ITaskRepository;
  public readonly environment: ITaskEnvironment;
  public readonly converters: TaskConverters;
  public readonly audience: TaskAudienceResolver;
  public readonly cursors: ViewCursorTable = new ViewCursorTable();
  private readonly _queue: WriterQueue = new WriterQueue();
  private _views: number = 0;

  public constructor(params: {
    readonly repository: ITaskRepository;
    readonly environment: ITaskEnvironment;
    readonly converters: TaskConverters;
    readonly audience: TaskAudienceResolver;
  }) {
    this.repository = params.repository;
    this.environment = params.environment;
    this.converters = params.converters;
    this.audience = params.audience;
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
