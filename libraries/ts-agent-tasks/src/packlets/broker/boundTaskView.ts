/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  IArchiveTask,
  IBoundTaskPage,
  IBoundTaskQuery,
  IBoundTaskView,
  IBoundTaskWriter,
  IChangeTaskScopes,
  ICommandReceipt,
  ICommandRequest,
  ICompleteTaskList,
  ICreateTaskList,
  ICreateTrackedTask,
  IListCompletionReport,
  IListCompletionRequest,
  IReassignTask,
  IReassignmentResult,
  IReparentTask,
  ITaskMutationResult,
  IUpdateTrackedTask,
  TaskId,
  TaskInspection,
  TaskResult
} from '../types';
import { AccessContext } from './access';
import { archive, changeScopes, completeList, reassign, reparent, updateTracked } from './catalogOperations';
import { execute } from './commands';
import { BrokerCore } from './core';
import { createNative } from './creation';
import { reconcileListCompletions } from './listCompletion';
import { inspectView, queryView } from './reads';

/**
 * A read-only view bound to one principal.
 * @remarks
 * This object has no mutation method at all: a component handed a view cannot write through it,
 * whatever it casts it to.
 * @internal
 */
export class BoundTaskView implements IBoundTaskView {
  protected readonly _core: BrokerCore;
  protected readonly _access: AccessContext;

  public constructor(core: BrokerCore, access: AccessContext) {
    this._core = core;
    this._access = access;
  }

  public get principal(): string {
    return this._access.principal;
  }

  public query(request: IBoundTaskQuery): Promise<TaskResult<IBoundTaskPage>> {
    return queryView(this._core, this._access, request);
  }

  public inspect(id: TaskId): Promise<TaskResult<TaskInspection>> {
    return inspectView(this._core, this._access, id);
  }
}

/**
 * A writer bound to one principal.
 * @internal
 */
export class BoundTaskWriter extends BoundTaskView implements IBoundTaskWriter {
  public execute(request: ICommandRequest): Promise<TaskResult<ICommandReceipt>> {
    return execute(this._core, this._access, request);
  }

  public createTracked(request: ICreateTrackedTask): Promise<TaskResult<ITaskMutationResult>> {
    return createNative(this._core, this._access, request, false);
  }

  public createTaskList(request: ICreateTaskList): Promise<TaskResult<ITaskMutationResult>> {
    return createNative(this._core, this._access, request, true);
  }

  public updateTracked(request: IUpdateTrackedTask): Promise<TaskResult<ITaskMutationResult>> {
    return updateTracked(this._core, this._access, request);
  }

  public reassign(request: IReassignTask): Promise<TaskResult<IReassignmentResult>> {
    return reassign(this._core, this._access, request);
  }

  public changeScopes(request: IChangeTaskScopes): Promise<TaskResult<ITaskMutationResult>> {
    return changeScopes(this._core, this._access, request);
  }

  public reparent(request: IReparentTask): Promise<TaskResult<ITaskMutationResult>> {
    return reparent(this._core, this._access, request);
  }

  public completeList(request: ICompleteTaskList): Promise<TaskResult<ITaskMutationResult>> {
    return completeList(this._core, this._access, request);
  }

  public archive(request: IArchiveTask): Promise<TaskResult<ITaskMutationResult>> {
    return archive(this._core, this._access, request);
  }

  public reconcileListCompletions(
    request: IListCompletionRequest
  ): Promise<TaskResult<IListCompletionReport>> {
    return reconcileListCompletions(this._core, this._access, request);
  }
}
