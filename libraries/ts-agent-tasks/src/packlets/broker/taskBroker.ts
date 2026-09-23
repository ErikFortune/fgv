/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import { TaskAudienceResolver, noAudience } from '../implementations';
import {
  IBoundTaskView,
  IBoundTaskViewParams,
  IBoundTaskWriter,
  ITaskEnvironment,
  ITaskScope,
  TaskRegistrationResult,
  TaskResult
} from '../types';
import { ITaskRepository } from '../storage';
import { AccessContext } from './access';
import { BoundTaskView, BoundTaskWriter } from './boundTaskView';
import { BrokerCore } from './core';
import { registerExternal } from './creation';
import { ok, taskFailure } from './failures';
import { defaultTaskProjector } from './projection';

/**
 * Parameters for {@link TaskBroker.create}.
 * @public
 */
export interface ITaskBrokerCreateParams {
  /** The repository the broker mediates. One broker per repository: it owns the write ordering. */
  readonly repository: ITaskRepository;
  readonly environment: ITaskEnvironment;
  /** Converters to validate requests with. Defaults to the default field bounds. */
  readonly converters?: TaskConverters;
}

/** The broker's private constructor, captured for {@link createTaskBroker}; never exported. */
let construct: (core: BrokerCore) => TaskBroker;

/**
 * The task broker: host-bound views and writers over one repository, plus the trusted host
 * operations that are not a principal's to perform.
 *
 * @remarks
 * Every operation a bound writer performs is authorized on its subject — and on each parent it
 * affects — against the host policy, then re-verified inside one serialized writer section before
 * it commits: a policy epoch that moved, or a record that changed, refuses the commit. A bound view
 * produces only projected data. Parentage, responsibility, scope labels and authority are
 * independent: none of them grants or implies another. The broker performs no I/O of its own
 * beyond the repository, starts no work and installs no timer.
 * @public
 */
export class TaskBroker {
  private readonly _core: BrokerCore;

  static {
    construct = (core: BrokerCore): TaskBroker => new TaskBroker(core);
  }

  private constructor(core: BrokerCore) {
    this._core = core;
  }

  /** Creates a broker over a repository. */
  public static create(params: ITaskBrokerCreateParams): Result<TaskBroker> {
    return createTaskBroker(params, noAudience);
  }

  /** Binds a read-only view to one principal. The returned object has no mutation method. */
  public bindView(params: IBoundTaskViewParams): TaskResult<IBoundTaskView> {
    return this._access(params).onSuccess((access) =>
      ok<IBoundTaskView>(new BoundTaskView(this._core, access))
    );
  }

  /** Binds a writer to one principal. */
  public bind(params: IBoundTaskViewParams): TaskResult<IBoundTaskWriter> {
    return this._access(params).onSuccess((access) =>
      ok<IBoundTaskWriter>(new BoundTaskWriter(this._core, access))
    );
  }

  /**
   * Registers an externally executed task — a trusted host operation with host-supplied scopes,
   * binding and recovery declaration, recorded under `principal`. See {@link IRegisterExternalTask}.
   */
  public registerExternal(principal: string, request: unknown): Promise<TaskResult<TaskRegistrationResult>> {
    return registerExternal(this._core, principal, request);
  }

  private _access(params: IBoundTaskViewParams): TaskResult<AccessContext> {
    const broker = this._core.converters.broker;
    const values = this._core.converters.values;
    const checked: Result<AccessContext> = broker.principalKey
      .convert(params.principal)
      .onSuccess((principal) =>
        values.scopes.convert(params.scopes).onSuccess((scopes) =>
          values.scopes.convert(params.creationScopes ?? scopes).onSuccess((creationScopes) => {
            const access: AccessContext = new AccessContext({
              view: this._core.nextView(),
              principal,
              scopes,
              creationScopes,
              authorization: params.authorization,
              projector: params.projector ?? defaultTaskProjector,
              logger: this._core.environment.logger
            });
            const outside: ITaskScope | undefined = creationScopes.find((scope) => !access.selects(scope));
            return outside === undefined
              ? succeed(access)
              : fail<AccessContext>(
                  `creation scope ${outside.namespace}/${outside.key} is outside the view's selectors`
                );
          })
        )
      );
    return checked.isSuccess()
      ? ok(checked.value)
      : taskFailure(`bind: ${checked.message}`, 'invalid', 'after-host-action');
  }
}

/**
 * Creates a broker with an update audience resolver. Not part of the package surface: the
 * resolver sees whole envelopes, bindings included, and is the seam subscriptions (T7) fill in.
 * Until then the public {@link TaskBroker.create} owes updates to no one.
 * @internal
 */
export function createTaskBroker(
  params: ITaskBrokerCreateParams,
  audience: TaskAudienceResolver
): Result<TaskBroker> {
  const converters: Result<TaskConverters> =
    params.converters !== undefined ? succeed(params.converters) : TaskConverters.create();
  return converters.onSuccess((c) =>
    captureResult(() =>
      construct(
        new BrokerCore({
          repository: params.repository,
          environment: params.environment,
          converters: c,
          audience
        })
      )
    )
  );
}
