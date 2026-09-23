/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree, JsonValue } from '@fgv/ts-json-base';
import { Result } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  ITaskCapacityProfile,
  ITaskCapacityStatus,
  ITaskCommitRecord,
  ITaskEnvironment,
  ITaskKindRegistry,
  ITaskRecordDraft,
  ITaskRecoveryReport,
  OperationId,
  TaskId,
  TaskRegistrationResult,
  TaskResult,
  TaskRevision
} from '../types';

/**
 * How durable a repository's commits are.
 *
 * @remarks
 * `'session'` is atomic visibility within the running process and nothing more. The durable
 * mode names the one guarantee this release can qualify — `'process-crash'` — and a root
 * that cannot honor it refuses construction rather than silently becoming a session
 * repository. There is no OS-crash or power-loss mode: a request for one fails before any
 * I/O (decision A1).
 * @public
 */
export type TaskRepositoryMode = 'session' | { readonly durable: 'process-crash' };

/**
 * Parameters shared by {@link FileTreeTaskRepository.initialize} and
 * {@link FileTreeTaskRepository.open}.
 * @public
 */
export interface ITaskRepositoryOpenParams {
  /**
   * The repository root: a directory the host provisioned and owns exclusively. Every record
   * lives directly in it. The storage packlet never sees a native path.
   */
  readonly root: FileTree.FileTreeItem;
  readonly mode: TaskRepositoryMode;
  readonly environment: ITaskEnvironment;
  /** The kind registry. Frozen by open, so a kind cannot appear under committed data. */
  readonly registry: ITaskKindRegistry;
  /** Converters to validate with. Defaults to the default field bounds. */
  readonly converters?: TaskConverters;
  /**
   * The capacity profile the host expects. On `open` it must equal the stored profile
   * exactly — a lower, higher or otherwise different configuration fails without touching
   * the stored one. Raising limits is the explicit {@link ITaskRepositoryWriter.raiseCapacityLimits}.
   * Omitted, the stored profile governs. On `initialize` it defaults to
   * `defaultTaskCapacityProfile`.
   */
  readonly profile?: ITaskCapacityProfile;
}

/**
 * The first write of a task: its identity, the operation that creates it and the canonical
 * creation request that operation carried.
 *
 * @remarks
 * `request` is what makes a retry recognizable. A retry with the same task ID, operation ID
 * and canonically equal request is the same registration — it resumes a pending one, or
 * replays a live one, with neither a second charge nor an early release. The same identity
 * with a different request is refused as a `conflict`.
 *
 * `record` must carry exactly one catalog operation with `operationId`, of type
 * `create-tracked`, `create-list` or `register-external` (the last for an unresolved record),
 * whose stored request equals `request`.
 * @public
 */
export interface ITaskRegistrationRequest {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly request: JsonValue;
  readonly record: ITaskRecordDraft;
}

/**
 * The common part of a replacement of one task record.
 * @public
 */
export interface ITaskCommitRequestBase {
  readonly taskId: TaskId;
  /** The task's current semantic revision (an unresolved record's reference revision). */
  readonly expectedRevision: TaskRevision;
  /** The record's current storage revision. */
  readonly expectedRecordRevision: number;
  readonly record: ITaskRecordDraft;
}

/**
 * A replacement of one task record, discriminated on what makes it an accepted mutation.
 *
 * @remarks
 * - `operation` — a command or catalog operation. `record` must add exactly the stored
 *   operation `operationId`. Replaying an operation already in the record returns the
 *   committed record without a second application.
 * - `observation` — a source projection. Its dedup evidence is `sourceRevision`, which must
 *   be present and differ from the record's current one. It adds no operation.
 * - `maintenance` — receipt evolution, observation telemetry or update pruning. It changes no
 *   semantic revision and adds no operation.
 *
 * Every replacement retains all existing operation evidence, advances the record revision by
 * exactly one, and is refused on a stale expected revision of either kind.
 * @public
 */
export type ITaskCommitRequest =
  | (ITaskCommitRequestBase & { readonly purpose: 'operation'; readonly operationId: OperationId })
  | (ITaskCommitRequestBase & { readonly purpose: 'observation' })
  | (ITaskCommitRequestBase & { readonly purpose: 'maintenance' });

/**
 * The exclusive, lifetime-bound writer a {@link ITaskRepository.withWriter} callback receives.
 *
 * @remarks
 * Every method commits through the FileTree atomic boundary before it succeeds. Nothing here
 * is a transaction: a replacement that succeeded stays committed if a later step fails. Using
 * a handle after its callback has returned fails.
 * @public
 */
export interface ITaskRepositoryWriter {
  /** Reads a task's committed record, including one whose kind is not registered. */
  readCommit(id: TaskId): Promise<TaskResult<ITaskCommitRecord | undefined>>;
  /** Registers a task through the ordered inventory protocol. */
  register(request: ITaskRegistrationRequest): Promise<TaskResult<ITaskCommitRecord>>;
  /** Atomically replaces one task record: state, owed updates and dedup evidence together. */
  commit(request: ITaskCommitRequest): Promise<TaskResult<ITaskCommitRecord>>;
  /**
   * Raises the stored capacity limits. Every limit and bound must be at least its stored
   * value — lowering in place is unsupported. The policy is replaced atomically; no record is
   * migrated and nothing is reinterpreted.
   */
  raiseCapacityLimits(profile: ITaskCapacityProfile): Promise<TaskResult<ITaskCapacityProfile>>;
}

/**
 * Health of a repository's committed view.
 *
 * @remarks
 * `unavailable` means the repository is fenced: a write's outcome is unknown, or a record no
 * longer agrees with what was committed. Every further operation fails until the host closes
 * it and reopens, which re-reads what is actually on disk. `generation` advances on every
 * committed change.
 * @public
 */
export interface ITaskRepositoryHealth {
  readonly state: 'ready' | 'unavailable' | 'closed';
  readonly generation: number;
  readonly issues: ReadonlyArray<string>;
}

/**
 * A writable repository over one root.
 * @public
 */
export interface ITaskRepository {
  readonly repositoryId: string;
  readonly mode: TaskRepositoryMode;
  /** The stored capacity profile governing admission. */
  readonly profile: ITaskCapacityProfile;
  /** What open found and did. */
  readonly report: ITaskRecoveryReport;
  /**
   * Reads a live task. `undefined` when the inventory does not name it as live — including a
   * registration still pending. Fails `unknown-kind-version` for a quarantined record.
   */
  read(id: TaskId): Promise<TaskResult<TaskRegistrationResult | undefined>>;
  /** Reads a live task's committed record. */
  readCommit(id: TaskId): Promise<TaskResult<ITaskCommitRecord | undefined>>;
  /**
   * Runs `action` with the exclusive writer. Fails without calling `action` when a writer is
   * already active — nesting is rejected, and a concurrent caller retries.
   */
  withWriter<T>(action: (writer: ITaskRepositoryWriter) => Promise<TaskResult<T>>): Promise<TaskResult<T>>;
  /** Trusted host capacity status. Never for a model-facing tool. */
  capacityStatus(): TaskResult<ITaskCapacityStatus>;
  health(): ITaskRepositoryHealth;
  /**
   * Releases the root. Every later call fails. Refused (`conflict`, `retry: 'safe'`) while a
   * `withWriter` callback is active: the root is not released under a writer.
   */
  close(): Result<boolean>;
}

/**
 * A read-only diagnostic handle for a repository that could not open healthily.
 *
 * @remarks
 * It holds the root exclusively (so nothing else writes while a host inspects) and never
 * writes: no record is repaired, rewritten or deleted. An administrator restores or
 * dispositions damaged data outside the broker path, then reopens.
 * @public
 */
export interface ITaskRecoveryHandle {
  readonly report: ITaskRecoveryReport;
  /** Reads one record's raw text, for inspection. */
  readRaw(name: string): Result<string>;
  close(): Result<boolean>;
}

/**
 * The outcome of opening a repository that exists.
 * @public
 */
export type TaskRepositoryOpenResult =
  | { readonly state: 'ready'; readonly repository: ITaskRepository }
  | { readonly state: 'recovery-required'; readonly recovery: ITaskRecoveryHandle };
