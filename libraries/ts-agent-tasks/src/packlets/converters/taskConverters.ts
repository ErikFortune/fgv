/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureResult, fail, populateObject, succeed } from '@fgv/ts-utils';
import { ITaskFieldBounds, defaultTaskFieldBounds } from '../types';
import { IBrokerConverters, buildBrokerConverters } from './brokerConverters';
import { ISourceConverters, buildSourceConverters } from './sourceConverters';
import { ICapacityConverters, buildCapacityConverters } from './capacityConverters';
import { ICommandConverters, buildCommandConverters } from './commandConverters';
import { IContextConverters, buildContextConverters } from './contextConverters';
import { IEnvelopeConverters, buildEnvelopeConverters } from './envelopeConverters';
import { IFailureConverters, buildFailureConverters } from './failureConverters';
import { IIdentityConverters, buildIdentityConverters } from './identityConverters';
import { IStorageConverters, buildStorageConverters } from './storageConverters';
import { IQueryConverters, buildQueryConverters } from './queryConverters';
import { IValueConverters, buildValueConverters } from './valueConverters';

/**
 * Parameters for {@link TaskConverters.create}.
 * @public
 */
export interface ITaskConvertersCreateParams {
  /**
   * Field bounds to apply. Any bound omitted takes its default; any bound supplied
   * must be a positive safe integer no greater than the default, because construction
   * may *lower* the bounds and may not raise them.
   */
  readonly bounds?: Partial<ITaskFieldBounds>;
}

function _lower(name: keyof ITaskFieldBounds, overrides: Partial<ITaskFieldBounds>): Result<number> {
  const dflt: number = defaultTaskFieldBounds[name];
  const requested: number | undefined = overrides[name];
  if (requested === undefined) {
    return succeed(dflt);
  }
  if (!Number.isSafeInteger(requested) || requested < 1) {
    return fail(`${name}: bound must be a positive safe integer`);
  }
  if (requested > dflt) {
    return fail(`${name}: ${requested} exceeds the default bound of ${dflt}; bounds may only be lowered`);
  }
  return succeed(requested);
}

function _resolveBounds(overrides?: Partial<ITaskFieldBounds>): Result<ITaskFieldBounds> {
  const o: Partial<ITaskFieldBounds> = overrides ?? {};
  return populateObject<ITaskFieldBounds>({
    maxTitleLength: () => _lower('maxTitleLength', o),
    maxDescriptionLength: () => _lower('maxDescriptionLength', o),
    maxSummaryLength: () => _lower('maxSummaryLength', o),
    maxCodeLength: () => _lower('maxCodeLength', o),
    maxReferences: () => _lower('maxReferences', o),
    maxScopes: () => _lower('maxScopes', o),
    maxIdLength: () => _lower('maxIdLength', o)
  });
}

/**
 * Every converter this library publishes, built against one set of field bounds.
 *
 * @remarks
 * Constructing this is pure: no filesystem, no clock, no registration of global state.
 * Nothing here is shared between instances, so two hosts with different bounds in one
 * process cannot see each other's limits.
 * @public
 */
export class TaskConverters {
  /** The field bounds these converters enforce. */
  public readonly bounds: ITaskFieldBounds;
  /** Branded identity converters. */
  public readonly ids: IIdentityConverters;
  /** Shared value converters — scopes, reasons, lifecycle, source observation. */
  public readonly values: IValueConverters;
  /** The common envelope and snapshot converters. */
  public readonly envelopes: IEnvelopeConverters;
  /** Classified failure converters. */
  public readonly failures: IFailureConverters;
  /** Command request, state and receipt converters. */
  public readonly commands: ICommandConverters;
  /** A3 capacity profile, claim and status converters. */
  public readonly capacity: ICapacityConverters;
  /** Summary, update, context input, budget and inclusion-receipt converters. */
  public readonly context: IContextConverters;
  /** Storage record, inventory and manifest converters. */
  public readonly storage: IStorageConverters;
  /** Repository query, due-query, owed-update query and page-cursor converters. */
  public readonly queries: IQueryConverters;
  /** Broker request, receipt and projected-value converters. */
  public readonly broker: IBrokerConverters;
  /** Converters for what an external source returns. */
  public readonly sources: ISourceConverters;

  private constructor(bounds: ITaskFieldBounds) {
    this.bounds = bounds;
    this.ids = buildIdentityConverters(bounds);
    this.values = buildValueConverters(bounds, this.ids);
    this.envelopes = buildEnvelopeConverters(bounds, this.ids, this.values);
    this.failures = buildFailureConverters(bounds, this.ids);
    this.commands = buildCommandConverters(bounds, this.ids);
    this.capacity = buildCapacityConverters(bounds, this.ids, this.values, this.failures);
    this.context = buildContextConverters(bounds, this.ids, this.values, this.envelopes);
    this.storage = buildStorageConverters(
      bounds,
      this.ids,
      this.values,
      this.envelopes,
      this.commands,
      this.capacity,
      this.context
    );
    this.queries = buildQueryConverters(bounds, this.ids, this.values);
    this.broker = buildBrokerConverters(bounds, this.ids, this.values, this.queries);
    this.sources = buildSourceConverters(bounds, this.values);
  }

  /**
   * Builds a converter set. Fails when a supplied bound is not a positive safe integer
   * or would raise a default.
   */
  public static create(params?: ITaskConvertersCreateParams): Result<TaskConverters> {
    return _resolveBounds(params?.bounds)
      .onSuccess((bounds) => captureResult(() => new TaskConverters(bounds)))
      .withErrorFormat((message: string) => `TaskConverters.create: ${message}`);
  }
}
