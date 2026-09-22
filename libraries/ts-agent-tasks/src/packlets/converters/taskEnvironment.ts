/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import {
  ITaskEnvironment,
  ITaskEnvironmentParams,
  Instant,
  OperationId,
  SubscriptionId,
  TaskId
} from '../types';
import { instant } from './primitives';
import { TaskConverters } from './taskConverters';

/**
 * Parameters for {@link TaskEnvironment.create}.
 * @public
 */
export interface ITaskEnvironmentCreateParams extends ITaskEnvironmentParams {
  /** Converter set used to validate minted identities. Defaults to the default bounds. */
  readonly converters?: TaskConverters;
}

/**
 * The host-injected clock, ID factory and logger, validated once and then used to mint
 * branded values through this library's own converters.
 *
 * @remarks
 * Nothing here constructs a logger, reads a clock at construction time, or opens
 * anything. A host that hands over an ID factory producing values outside the library's
 * bounded identifier syntax learns so at the first mint, as a `Result` failure, rather
 * than when a record filename is written.
 * @public
 */
export class TaskEnvironment implements ITaskEnvironment {
  /** {@inheritDoc ITaskEnvironmentParams.logger} */
  public readonly logger: ITaskEnvironmentParams['logger'];
  /** {@inheritDoc ITaskEnvironmentParams.clock} */
  public readonly clock: () => number;
  /** {@inheritDoc ITaskEnvironmentParams.newId} */
  public readonly newId: () => Result<string>;

  private readonly _converters: TaskConverters;

  private constructor(params: ITaskEnvironmentParams, converters: TaskConverters) {
    this.logger = params.logger;
    this.clock = params.clock;
    this.newId = params.newId;
    this._converters = converters;
  }

  /** Validates the injected capabilities and returns an environment. */
  public static create(params: ITaskEnvironmentCreateParams): Result<TaskEnvironment> {
    return (params.converters !== undefined ? succeed(params.converters) : TaskConverters.create())
      .onSuccess((converters) => captureResult(() => new TaskEnvironment(params, converters)))
      .withErrorFormat((message: string) => `TaskEnvironment.create: ${message}`);
  }

  /** {@inheritDoc ITaskEnvironment.now} */
  public now(): Result<Instant> {
    return captureResult(() => this.clock())
      .onSuccess((epochMs: number) => {
        if (!Number.isFinite(epochMs)) {
          return fail<string>(`clock returned ${epochMs}`);
        }
        return captureResult(() => new Date(epochMs).toISOString());
      })
      .onSuccess((iso: string) => instant.convert(iso))
      .withErrorFormat((message: string) => `now: ${message}`);
  }

  /** {@inheritDoc ITaskEnvironment.newTaskId} */
  public newTaskId(): Result<TaskId> {
    return this._mint(this._converters.ids.taskId, 'task id');
  }

  /** {@inheritDoc ITaskEnvironment.newOperationId} */
  public newOperationId(): Result<OperationId> {
    return this._mint(this._converters.ids.operationId, 'operation id');
  }

  /** {@inheritDoc ITaskEnvironment.newSubscriptionId} */
  public newSubscriptionId(): Result<SubscriptionId> {
    return this._mint(this._converters.ids.subscriptionId, 'subscription id');
  }

  private _mint<T>(converter: Converter<T>, description: string): Result<T> {
    return this.newId()
      .onSuccess((raw: string) => converter.convert(raw))
      .withErrorFormat((message: string) => `new ${description}: ${message}`);
  }
}
