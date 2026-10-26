/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters, Logging, Result, captureAsyncResult, captureResult } from '@fgv/ts-utils';
import {
  ITaskAccessRequest,
  ITaskAuthorization,
  ITaskCommitRecord,
  ITaskProjector,
  ITaskScope,
  ITaskSummary,
  IUnresolvedTaskReference,
  TaskAccessRole,
  TaskAction,
  TaskResult
} from '../types';
import { ok, taskFailure } from './failures';

/**
 * What an access request says about the task it concerns: its envelope summary, or the reference
 * of an unresolved registration.
 * @internal
 */
export type AccessSubject =
  | { readonly task: ITaskSummary; readonly reference?: undefined }
  | { readonly reference: IUnresolvedTaskReference; readonly task?: undefined };

/**
 * The access subject a committed record presents: never its details.
 * @internal
 */
export function subjectOf(record: ITaskCommitRecord): AccessSubject {
  return record.recordType === 'resolved'
    ? { task: { envelope: record.task.envelope } }
    : { reference: record.reference };
}

/** The scopes an access subject carries. */
function _scopesOf(subject: AccessSubject): ReadonlyArray<ITaskScope> {
  return subject.task !== undefined ? subject.task.envelope.scopes : subject.reference.scopes;
}

/** A collision-free key for a scope. */
export function scopeKey(scope: ITaskScope): string {
  return JSON.stringify([scope.namespace, scope.key]);
}

/**
 * One bound principal's standing: its identity, maximum selectors, policy and projector.
 *
 * @remarks
 * Every read and every mutation asks this object, at the point it has the record in hand. It is
 * constructed by the host through the broker and never from a request.
 * @internal
 */
export class AccessContext {
  public readonly view: number;
  public readonly principal: string;
  public readonly scopes: ReadonlyArray<ITaskScope>;
  public readonly creationScopes: ReadonlyArray<ITaskScope>;
  public readonly projector: ITaskProjector;
  private readonly _scopeKeys: ReadonlySet<string>;
  private readonly _authorization: ITaskAuthorization;
  private readonly _logger: Logging.ILogger;

  public constructor(params: {
    readonly view: number;
    readonly principal: string;
    readonly scopes: ReadonlyArray<ITaskScope>;
    readonly creationScopes: ReadonlyArray<ITaskScope>;
    readonly authorization: ITaskAuthorization;
    readonly projector: ITaskProjector;
    readonly logger: Logging.ILogger;
  }) {
    this.view = params.view;
    this.principal = params.principal;
    this.scopes = params.scopes;
    this.creationScopes = params.creationScopes;
    this.projector = params.projector;
    this._scopeKeys = new Set(params.scopes.map(scopeKey));
    this._authorization = params.authorization;
    this._logger = params.logger;
  }

  /** Whether a scope lies within this view's maximum selectors. */
  public selects(scope: ITaskScope): boolean {
    return this._scopeKeys.has(scopeKey(scope));
  }

  /**
   * The host's current policy epoch. A policy that throws or answers with something other than a
   * string cannot be compared, so the operation fails.
   */
  public epoch(): TaskResult<string> {
    const epoch: Result<string> = captureResult(() => this._authorization.policyEpoch()).onSuccess((value) =>
      Converters.string.convert(value)
    );
    return epoch.isSuccess()
      ? ok(epoch.value)
      : taskFailure(
          `authorization: policy epoch unavailable: ${epoch.message}`,
          'invalid',
          'after-host-action'
        );
  }

  /**
   * Whether the host's policy epoch is still the one an operation captured. Asked as the last
   * step before a durable write or a replayed receipt, after every await the writer section makes.
   */
  public epochIs(epoch: string): boolean {
    const now = this.epoch();
    return now.isSuccess() && now.value === epoch;
  }

  /**
   * Asks the host policy, with a copy of the request. Fails closed: a check that fails, throws,
   * rejects or answers anything but `true` is a denial. A failing policy is reported to the host
   * logger, never to the caller.
   */
  public async allows(request: ITaskAccessRequest): Promise<boolean> {
    // The policy is host code: it is handed a copy, so nothing it does to the request can reach
    // the broker's resident state.
    const answer: Result<boolean> = (
      await captureAsyncResult(() => this._authorization.check(structuredClone(request)))
    ).onSuccess((inner) => inner);
    if (answer.isFailure()) {
      this._logger.warn(
        `ts-agent-tasks: authorization check for '${request.action}' by ${this.principal} failed and was ` +
          `treated as a denial: ${answer.message}`
      );
      return false;
    }
    return answer.value === true;
  }

  /**
   * Whether this principal may see a task: one of its scopes is within the view's selectors,
   * **and** the policy allows `read`. Both, always — scopes are labels, not grants.
   */
  public async sees(subject: AccessSubject, role: TaskAccessRole = 'subject'): Promise<boolean> {
    if (!_scopesOf(subject).some((scope) => this.selects(scope))) {
      return false;
    }
    return this.allows({ action: 'read', role, ...subject });
  }

  /** Whether this principal may create a task with these scopes and this responsibility. */
  public async mayCreate(
    extra: Pick<ITaskAccessRequest, 'targetResponsibility' | 'scopes'>
  ): Promise<boolean> {
    return this.allows({ action: 'create', role: 'subject', ...extra });
  }

  /** Whether this principal may perform `action` on a task it can see. */
  public async may(
    action: TaskAction,
    subject: AccessSubject,
    role: TaskAccessRole = 'subject',
    extra?: Pick<ITaskAccessRequest, 'command' | 'targetResponsibility' | 'scopes'>
  ): Promise<boolean> {
    return this.allows({ action, role, ...subject, ...extra });
  }
}
