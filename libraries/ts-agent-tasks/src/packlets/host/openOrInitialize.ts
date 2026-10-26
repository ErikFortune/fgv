/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { DetailedResult, Result, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskRecoveryHandle,
  ITaskRepository,
  ITaskRepositoryOpenParams,
  ITaskRepositoryRootProbe,
  TaskRepositoryMode,
  probeTaskRepositoryRoot
} from '../storage';
import { ITaskFailure, ITaskRecoveryReport, TaskRepositoryDurability, TaskResult } from '../types';

/**
 * What {@link openOrInitializeTaskRepository} does with a root that qualifies for no repository mode.
 *
 * @remarks
 * - `'refuse'` — fail (`unsupported`).
 * - `'in-memory'` — run on a fresh in-memory tree in `session` mode, labelled `in-memory` in the
 *   result and its report. Nothing it holds survives the process.
 * @public
 */
export type TaskRepositoryFallback = 'refuse' | 'in-memory';

/**
 * Where an opened repository lives: on the root the host gave, or on the in-memory fallback.
 * @public
 */
export type TaskRepositoryPlacement = 'root' | 'in-memory';

/**
 * Parameters for {@link openOrInitializeTaskRepository}: everything `FileTreeTaskRepository.open`
 * takes except the mode, which is decided from the root, and a fallback.
 * @public
 */
export interface IOpenOrInitializeTaskRepositoryParams extends Omit<ITaskRepositoryOpenParams, 'mode'> {
  readonly fallback: TaskRepositoryFallback;
}

/**
 * What {@link openOrInitializeTaskRepository} decided and found.
 * @public
 */
export interface ITaskRepositoryPlacementReport {
  readonly placement: TaskRepositoryPlacement;
  readonly durability: TaskRepositoryDurability;
  /** The mode the repository was opened or initialized in. */
  readonly mode: TaskRepositoryMode;
  /** The guarantees the given root qualifies for (see `probeTaskRepositoryRoot`). */
  readonly guarantees: ReadonlyArray<FileTree.AtomicWriteGuarantee>;
  /** Whether the repository was initialized by this call rather than opened. */
  readonly initialized: boolean;
  /** Why the in-memory fallback was used, when it was. */
  readonly fallbackReason?: string;
  /** What open found and did — the repository's, or the recovery handle's, report. */
  readonly recovery: ITaskRecoveryReport;
}

/**
 * The outcome of {@link openOrInitializeTaskRepository}.
 * @public
 */
export type OpenOrInitializeTaskRepositoryResult =
  | {
      readonly state: 'ready';
      readonly repository: ITaskRepository;
      readonly durability: TaskRepositoryDurability;
      readonly placement: TaskRepositoryPlacement;
      readonly report: ITaskRepositoryPlacementReport;
    }
  | {
      readonly state: 'recovery-required';
      readonly recovery: ITaskRecoveryHandle;
      readonly durability: TaskRepositoryDurability;
      readonly placement: TaskRepositoryPlacement;
      readonly report: ITaskRepositoryPlacementReport;
    };

/** Where and how durably the repository is placed, before it is opened. */
interface IPlacement {
  readonly root: FileTree.FileTreeItem;
  readonly mode: TaskRepositoryMode;
  readonly placement: TaskRepositoryPlacement;
  readonly guarantees: ReadonlyArray<FileTree.AtomicWriteGuarantee>;
  readonly fallbackReason?: string;
}

/**
 * Opens the task repository at a root, or initializes one there when the root is empty, in the
 * strongest mode the root qualifies for.
 *
 * @remarks
 * 1. **The mode** comes from `probeTaskRepositoryRoot` — the same inquiry the repository makes, so
 *    the two cannot disagree: `{ durable: 'process-crash' }` when the root qualifies for it, else
 *    `'session'`. A root that qualifies for neither is refused, or — with `fallback: 'in-memory'` —
 *    replaced by a fresh in-memory tree, and the result and its report say `placement: 'in-memory'`.
 * 2. **Open or initialize** is `FileTreeTaskRepository.openOrInitialize`'s decision, made under the
 *    repository's exclusive ownership by `initialize`'s own emptiness test: a root holding nothing but
 *    interrupted writes' working files is empty.
 * 3. **`recovery-required` is surfaced, never repaired.** The result carries the read-only handle
 *    and its report; nothing is rewritten.
 *
 * A repository initialized `process-crash` records that in its manifest, and opening it later as
 * `session` — because the root no longer qualifies — is refused unless `allowSessionOverDurable` is
 * passed. Every other failure is the repository's own, classified as it classifies it.
 *
 * Building the broker over the repository stays with the host.
 * @public
 */
export async function openOrInitializeTaskRepository(
  params: IOpenOrInitializeTaskRepositoryParams
): Promise<TaskResult<OpenOrInitializeTaskRepositoryResult>> {
  const placed: TaskResult<IPlacement> = _classified(
    probeTaskRepositoryRoot(params.root),
    'invalid'
  ).onSuccess((probe) => _place(params, probe));
  if (placed.isFailure()) {
    return failWithDetail(placed.message, placed.detail);
  }
  const placement: IPlacement = placed.value;
  const opened = await FileTreeTaskRepository.openOrInitialize({
    ...params,
    root: placement.root,
    mode: placement.mode
  });
  return opened.onSuccess((outcome) => {
    const durability: TaskRepositoryDurability = placement.mode === 'session' ? 'session' : 'process-crash';
    const report = (recovery: ITaskRecoveryReport, initialized: boolean): ITaskRepositoryPlacementReport => ({
      placement: placement.placement,
      durability,
      mode: placement.mode,
      guarantees: placement.guarantees,
      initialized,
      ...(placement.fallbackReason !== undefined ? { fallbackReason: placement.fallbackReason } : {}),
      recovery
    });
    return succeedWithDetail<OpenOrInitializeTaskRepositoryResult, ITaskFailure>(
      outcome.state === 'ready'
        ? {
            state: 'ready',
            repository: outcome.repository,
            durability,
            placement: placement.placement,
            report: report(outcome.repository.report, outcome.initialized)
          }
        : {
            state: 'recovery-required',
            recovery: outcome.recovery,
            durability,
            placement: placement.placement,
            report: report(outcome.recovery.report, false)
          }
    );
  });
}

/** The root and mode a probe allows, or the fallback when it allows none. */
function _place(
  params: IOpenOrInitializeTaskRepositoryParams,
  probe: ITaskRepositoryRootProbe
): TaskResult<IPlacement> {
  if (probe.mode !== undefined) {
    return succeedWithDetail({
      root: params.root,
      mode: probe.mode,
      placement: 'root',
      guarantees: probe.guarantees
    });
  }
  const reason: string = probe.reason!;
  if (params.fallback === 'refuse') {
    return failWithDetail(`openOrInitializeTaskRepository: ${reason}`, {
      code: 'unsupported',
      retry: 'after-host-action'
    });
  }
  return _classified(
    FileTree.InMemoryTreeAccessors.create([], { mutable: true }).onSuccess((accessors) =>
      FileTree.DirectoryItem.create('/', accessors)
    ),
    'storage-unavailable'
  ).onSuccess((memory) =>
    succeedWithDetail<IPlacement, ITaskFailure>({
      root: memory,
      mode: 'session',
      placement: 'in-memory',
      guarantees: probe.guarantees,
      fallbackReason: reason
    })
  );
}

/** A plain result as a task result, classified `code` and retried after host action on failure. */
function _classified<T>(result: Result<T>, code: ITaskFailure['code']): DetailedResult<T, ITaskFailure> {
  return result.isSuccess()
    ? succeedWithDetail<T, ITaskFailure>(result.value)
    : failWithDetail<T, ITaskFailure>(`openOrInitializeTaskRepository: ${result.message}`, {
        code,
        retry: 'after-host-action'
      });
}
