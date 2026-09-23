/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter } from '@fgv/ts-utils';
import {
  CapacityClaimId,
  ConsumerId,
  DeliveryId,
  ITaskFieldBounds,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskKind,
  UpdateId,
  maxUpdateIdSuffixLength
} from '../types';
import { boundedIdentifier } from './primitives';

/**
 * The branded identity converters, all sharing one bounded safe syntax.
 *
 * @remarks
 * Every one of these is a bounded identifier rather than free text, because these
 * values reach record filenames and index keys. None of them may be a caller-supplied
 * path fragment.
 *
 * `PageCursor` deliberately has no converter here: a keyset cursor's encoding is
 * decided by the slice that issues one, and this slice cannot exercise that choice.
 * @public
 */
export interface IIdentityConverters {
  readonly identifier: Converter<string>;
  readonly taskId: Converter<TaskId>;
  readonly taskKind: Converter<TaskKind>;
  readonly operationId: Converter<OperationId>;
  readonly updateId: Converter<UpdateId>;
  readonly consumerId: Converter<ConsumerId>;
  readonly subscriptionId: Converter<SubscriptionId>;
  readonly deliveryId: Converter<DeliveryId>;
  readonly capacityClaimId: Converter<CapacityClaimId>;
  readonly sourceId: Converter<string>;
}

/**
 * Builds the {@link IIdentityConverters} for a set of field bounds.
 * @public
 */
export function buildIdentityConverters(bounds: ITaskFieldBounds): IIdentityConverters {
  const max: number = bounds.maxIdLength;
  return {
    identifier: boundedIdentifier(max, 'identifier'),
    taskId: boundedIdentifier(max, 'task id').withBrand('TaskId'),
    taskKind: boundedIdentifier(max, 'task kind').withBrand('TaskKind'),
    operationId: boundedIdentifier(max, 'operation id').withBrand('OperationId'),
    // An update id is the tuple encoding `<taskId>:<revision>:<ordinal>` (see
    // `taskUpdateId`), so it must be able to hold a maximum-length task id plus that suffix.
    updateId: boundedIdentifier(max + maxUpdateIdSuffixLength, 'update id').withBrand('UpdateId'),
    consumerId: boundedIdentifier(max, 'consumer id').withBrand('ConsumerId'),
    subscriptionId: boundedIdentifier(max, 'subscription id').withBrand('SubscriptionId'),
    deliveryId: boundedIdentifier(max, 'delivery id').withBrand('DeliveryId'),
    capacityClaimId: boundedIdentifier(max, 'capacity claim id').withBrand('CapacityClaimId'),
    sourceId: boundedIdentifier(max, 'source id')
  };
}
