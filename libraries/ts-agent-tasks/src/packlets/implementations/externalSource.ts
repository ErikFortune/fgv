/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import {
  DetailedFailure,
  Result,
  captureAsyncResult,
  captureResult,
  fail,
  failWithDetail,
  mapResults,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { createTaskCommandHandle } from '../converters';
import {
  ICommandRequest,
  ISourceBinding,
  ISourceProjection,
  ISourceReconcilePage,
  ISourceRevision,
  ITaskCommandDescriptor,
  ITaskCommandHandle,
  ITaskFailure,
  ITaskSource,
  RecoveryResult,
  SourceCommandLookup,
  SourceCommandResult,
  SourceHistoryContract,
  SourceRead,
  SourceReconcileCoverage,
  SourceRevisionOrder,
  TaskResult
} from '../types';

/**
 * A source projection whose details are the host's own type, before encoding.
 * @public
 */
export type ExternalProjection<TDetails> = Omit<ISourceProjection, 'details'> & {
  readonly details: TDetails;
};

/**
 * A typed read of one binding.
 * @public
 */
export type ExternalRead<TDetails> =
  | { readonly state: 'observed'; readonly value: ExternalProjection<TDetails> }
  | { readonly state: 'unavailable' | 'missing'; readonly reason: string };

/**
 * A typed page of a reconciliation listing or ordered feed. See `ISourceReconcilePage`.
 * @public
 */
export interface IExternalPage<TDetails> {
  readonly observations: ReadonlyArray<{
    readonly binding: ISourceBinding;
    readonly observation: ExternalRead<TDetails>;
  }>;
  readonly nextCursor?: string;
  readonly checkpoint?: string;
  readonly completeness: 'complete' | 'partial' | 'gap';
  readonly coverage: SourceReconcileCoverage;
  readonly issues: ReadonlyArray<string>;
}

/**
 * A typed recovery result.
 * @public
 */
export type ExternalRecovery<TDetails> =
  | { readonly state: 'reattached' | 'completed'; readonly value: ExternalProjection<TDetails> }
  | { readonly state: 'resumable'; readonly reference: JsonValue }
  | { readonly state: 'unrecoverable'; readonly reason: string; readonly value: ExternalProjection<TDetails> }
  | { readonly state: 'unavailable' | 'unresolved'; readonly reason: string };

/**
 * A typed command answer: `applied` carries a typed projection.
 * @public
 */
export type ExternalCommandResult<TDetails> =
  | Exclude<SourceCommandResult, { readonly state: 'applied' }>
  | { readonly state: 'applied'; readonly observation: ExternalProjection<TDetails> };

/**
 * One command a source executes, erased to `JsonValue` parameters by {@link ExternalTaskSource.command}.
 * @public
 */
export interface IExternalCommand<TDetails> {
  /** The erased handle to register on the task kind, so the broker validates with the same schema. */
  readonly handle: ITaskCommandHandle;
  apply(
    binding: ISourceBinding,
    request: ICommandRequest,
    expectedSourceRevision?: ISourceRevision
  ): Promise<Result<ExternalCommandResult<TDetails>>>;
}

/**
 * What a host supplies to build an {@link ITaskSource}.
 *
 * @remarks
 * Every callback is ordinary host code returning a `Result`; a failure or a throw is reported as an
 * unavailable source, never as a changed task. `feed` is the reconciliation listing — for a
 * `source-replay` source, the ordered durable feed. `commands` may be empty: an observation-only
 * source then refuses every command as `unsupported`, and supplies no command evidence.
 * @public
 */
export interface IExternalTaskSourceParams<TDetails> {
  /** {@inheritDoc ITaskSource.id} */
  readonly id: string;
  /** {@inheritDoc ITaskSource.history} */
  readonly history: SourceHistoryContract;
  /** Encodes the host's detail type to the JSON the task kind stores — its registered `encode`. */
  readonly encodeDetails: (details: TDetails) => Result<JsonValue>;
  readonly compare: (a: ISourceRevision, b: ISourceRevision) => Result<SourceRevisionOrder>;
  readonly read: (binding: ISourceBinding) => Promise<Result<ExternalRead<TDetails>>>;
  readonly feed: (cursor: string | undefined) => Promise<Result<IExternalPage<TDetails>>>;
  readonly recover: (binding: ISourceBinding) => Promise<Result<ExternalRecovery<TDetails>>>;
  readonly commands?: ReadonlyArray<IExternalCommand<TDetails>>;
  readonly lookupCommand?: (
    binding: ISourceBinding,
    request: ICommandRequest
  ) => Promise<Result<ExternalCommandResult<TDetails> | { readonly state: 'not-found' }>>;
}

/** Host code as a task result: a failure or a throw is an unavailable source. */
async function _host<T>(what: string, call: () => Promise<Result<T>>): Promise<TaskResult<T>> {
  const outcome = await captureAsyncResult(call);
  const inner: Result<T> = outcome.isSuccess() ? outcome.value : fail(`threw: ${outcome.message}`);
  return inner.isSuccess()
    ? succeedWithDetail<T, ITaskFailure>(inner.value)
    : failWithDetail<T, ITaskFailure>(`${what}: ${inner.message}`, {
        code: 'source-unavailable',
        retry: 'safe'
      });
}

/** Re-raises a task failure under another value type. */
function _relay<T>(failure: DetailedFailure<unknown, ITaskFailure>): TaskResult<T> {
  return failWithDetail<T, ITaskFailure>(failure.message, failure.detail);
}

function _lift<T>(what: string, result: Result<T>): TaskResult<T> {
  return result.isSuccess()
    ? succeedWithDetail<T, ITaskFailure>(result.value)
    : failWithDetail<T, ITaskFailure>(`${what}: ${result.message}`, {
        code: 'source-unavailable',
        retry: 'safe'
      });
}

/**
 * The external-task helper: wraps a host's typed callbacks as an {@link ITaskSource}.
 *
 * @remarks
 * There is no universal `external` detail kind. A host registers its own kind — detail converter,
 * encoder and the command handles this helper exposes — and wraps its source with the same encoder,
 * so a projection's details are what that kind stores. Commands are typed closures around an
 * `ITaskCommandDescriptor`: parameters are converted through the descriptor before the host's
 * callback sees them.
 *
 * The helper holds no state of its own. The source owns execution truth; the broker reconciles it.
 * @public
 */
export class ExternalTaskSource<TDetails> implements ITaskSource {
  /** {@inheritDoc ITaskSource.id} */
  public readonly id: string;
  /** {@inheritDoc ITaskSource.history} */
  public readonly history: SourceHistoryContract;
  /** {@inheritDoc ITaskSource.lookupCommand} */
  public readonly lookupCommand?: (
    binding: ISourceBinding,
    request: ICommandRequest
  ) => Promise<TaskResult<SourceCommandLookup>>;

  private readonly _params: IExternalTaskSourceParams<TDetails>;
  private readonly _commands: ReadonlyMap<string, IExternalCommand<TDetails>>;

  private constructor(
    params: IExternalTaskSourceParams<TDetails>,
    commands: ReadonlyMap<string, IExternalCommand<TDetails>>
  ) {
    this.id = params.id;
    this.history = params.history;
    this._params = params;
    this._commands = commands;
    // Without a lookup the member is absent, and the broker holds an uncertain command it cannot
    // deduplicate rather than ask.
    const lookup = params.lookupCommand;
    if (lookup !== undefined) {
      this.lookupCommand = async (
        b: ISourceBinding,
        r: ICommandRequest
      ): Promise<TaskResult<SourceCommandLookup>> => {
        const found = await _host(`${this.id} lookup`, () => lookup(b, r));
        if (found.isFailure()) {
          return _relay(found);
        }
        const value = found.value;
        return value.state === 'not-found'
          ? succeedWithDetail<SourceCommandLookup, ITaskFailure>(value)
          : _lift(`${this.id} lookup`, this._encodeAnswer(value));
      };
    }
  }

  /** Builds a source. Fails when two commands share a name. */
  public static create<TDetails>(
    params: IExternalTaskSourceParams<TDetails>
  ): Result<ExternalTaskSource<TDetails>> {
    const commands: Map<string, IExternalCommand<TDetails>> = new Map();
    for (const command of params.commands ?? []) {
      if (commands.has(command.handle.name)) {
        return fail(`${params.id}: two commands are named '${command.handle.name}'`);
      }
      commands.set(command.handle.name, command);
    }
    return captureResult(() => new ExternalTaskSource(params, commands));
  }

  /**
   * A typed command: `apply` receives the request's canonical parameters decoded by the
   * descriptor's schema — which the registered handle guarantees they satisfy — and its handle is
   * the one to register on the kind.
   */
  public static command<TDetails, P>(
    descriptor: ITaskCommandDescriptor<P>,
    apply: (
      binding: ISourceBinding,
      parameters: P,
      request: ICommandRequest,
      expectedSourceRevision?: ISourceRevision
    ) => Promise<Result<ExternalCommandResult<TDetails>>>
  ): IExternalCommand<TDetails> {
    return {
      handle: createTaskCommandHandle(descriptor),
      apply: async (binding, request, expectedSourceRevision) => {
        const parameters: Result<P> = captureResult(() =>
          descriptor.parameters.convert(request.parameters)
        ).onSuccess((converted) => converted);
        return parameters.isSuccess()
          ? apply(binding, parameters.value, request, expectedSourceRevision)
          : fail<ExternalCommandResult<TDetails>>(`command '${descriptor.name}': ${parameters.message}`);
      }
    };
  }

  /** The erased handles to register on the task kind. Empty for an observation-only source. */
  public get commandHandles(): ReadonlyArray<ITaskCommandHandle> {
    return Array.from(this._commands.values()).map((command) => command.handle);
  }

  /** {@inheritDoc ITaskSource.compare} */
  public compare(a: ISourceRevision, b: ISourceRevision): Result<SourceRevisionOrder> {
    return captureResult(() => this._params.compare(a, b)).onSuccess((order) => order);
  }

  /** {@inheritDoc ITaskSource.observe} */
  public async observe(binding: ISourceBinding): Promise<TaskResult<SourceRead>> {
    const read = await _host(`${this.id} read`, () => this._params.read(binding));
    return read.isSuccess() ? _lift(`${this.id} read`, this._encodeRead(read.value)) : _relay(read);
  }

  /** {@inheritDoc ITaskSource.reconcile} */
  public async reconcile(cursor?: string): Promise<TaskResult<ISourceReconcilePage>> {
    const page = await _host(`${this.id} feed`, () => this._params.feed(cursor));
    if (page.isFailure()) {
      return _relay(page);
    }
    return _lift(
      `${this.id} feed`,
      mapResults(
        page.value.observations.map((entry) =>
          this._encodeRead(entry.observation).onSuccess((observation) =>
            succeed({ binding: entry.binding, observation })
          )
        )
      ).onSuccess((observations) => succeed<ISourceReconcilePage>({ ...page.value, observations }))
    );
  }

  /** {@inheritDoc ITaskSource.dispatch} */
  public async dispatch(
    binding: ISourceBinding,
    request: ICommandRequest,
    expectedSourceRevision?: ISourceRevision
  ): Promise<TaskResult<SourceCommandResult>> {
    const command: IExternalCommand<TDetails> | undefined = this._commands.get(request.command);
    if (command === undefined) {
      // The rejecting dispatcher of an observation-only source, and of any undeclared command.
      return succeedWithDetail<SourceCommandResult, ITaskFailure>({
        state: 'rejected',
        reason: 'unsupported'
      });
    }
    const answer = await _host(`${this.id} ${request.command}`, () =>
      command.apply(binding, request, expectedSourceRevision)
    );
    return answer.isSuccess()
      ? _lift(`${this.id} ${request.command}`, this._encodeAnswer(answer.value))
      : _relay(answer);
  }

  /** {@inheritDoc ITaskSource.recover} */
  public async recover(binding: ISourceBinding): Promise<TaskResult<RecoveryResult>> {
    const recovered = await _host(`${this.id} recover`, () => this._params.recover(binding));
    if (recovered.isFailure()) {
      return _relay(recovered);
    }
    return _lift(`${this.id} recover`, this._encodeRecovery(recovered.value));
  }

  private _encodeRecovery(value: ExternalRecovery<TDetails>): Result<RecoveryResult> {
    switch (value.state) {
      case 'reattached':
      case 'completed':
        return this._encode(value.value).onSuccess((projection) =>
          succeed<RecoveryResult>({ state: value.state, value: projection })
        );
      case 'unrecoverable':
        return this._encode(value.value).onSuccess((projection) =>
          succeed<RecoveryResult>({ state: 'unrecoverable', reason: value.reason, value: projection })
        );
      default:
        return succeed<RecoveryResult>(value);
    }
  }

  private _encode(projection: ExternalProjection<TDetails>): Result<ISourceProjection> {
    return captureResult(() => this._params.encodeDetails(projection.details))
      .onSuccess((details) => details)
      .onSuccess((details) => succeed<ISourceProjection>({ ...projection, details }));
  }

  private _encodeRead(read: ExternalRead<TDetails>): Result<SourceRead> {
    return read.state === 'observed'
      ? this._encode(read.value).onSuccess((value) => succeed<SourceRead>({ state: 'observed', value }))
      : succeed<SourceRead>(read);
  }

  private _encodeAnswer(answer: ExternalCommandResult<TDetails>): Result<SourceCommandResult> {
    return answer.state === 'applied'
      ? this._encode(answer.observation).onSuccess((observation) =>
          succeed<SourceCommandResult>({ state: 'applied', observation })
        )
      : succeed<SourceCommandResult>(answer);
  }
}
