/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { TaskConverters } from '../converters';
import {
  IPendingInventoryEntry,
  ITaskEnvironment,
  ITaskKindRegistry,
  ITaskRecoveryReport,
  ITaskRepositoryManifest,
  TaskId
} from '../types';
import { CapacityLedger } from './ledger';
import { TaskRepositoryMode } from './model';
import { ITaskProjection } from './projection';
import { RecordStore } from './recordStore';
import { IRootOwnership } from './rootOwnership';

/**
 * Everything a scan of the root establishes, handed to the repository it opens.
 * @internal
 */
export interface IRepositoryState {
  readonly store: RecordStore;
  readonly ownership: IRootOwnership;
  readonly converters: TaskConverters;
  readonly registry: ITaskKindRegistry;
  readonly environment: ITaskEnvironment;
  readonly mode: TaskRepositoryMode;
  readonly manifest: ITaskRepositoryManifest;
  readonly manifestBytes: number;
  readonly tasks: Map<TaskId, ITaskProjection>;
  readonly pending: Map<string, IPendingInventoryEntry>;
  readonly ledger: CapacityLedger;
  readonly report: ITaskRecoveryReport;
}
