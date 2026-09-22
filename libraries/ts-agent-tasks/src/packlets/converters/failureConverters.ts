/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  CapacityDimension,
  ICapacityFailure,
  ITaskFailure,
  ITaskFieldBounds,
  TaskFailureCode,
  allCapacityDimensions,
  allTaskFailureCodes
} from '../types';
import { IIdentityConverters } from './identityConverters';
import { boundedSingleLine, nonNegativeSafeInteger } from './primitives';

/**
 * The classified-failure converters.
 * @public
 */
export interface IFailureConverters {
  readonly capacityDimension: Converter<CapacityDimension>;
  readonly capacityFailure: Converter<ICapacityFailure>;
  readonly failureCode: Converter<TaskFailureCode>;
  readonly failure: Converter<ITaskFailure>;
}

/**
 * Builds the {@link IFailureConverters}.
 * @public
 */
export function buildFailureConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters
): IFailureConverters {
  const capacityDimension: Converter<CapacityDimension> =
    Converters.enumeratedValue<CapacityDimension>(allCapacityDimensions);
  const failureCode: Converter<TaskFailureCode> =
    Converters.enumeratedValue<TaskFailureCode>(allTaskFailureCodes);

  const capacityFailure: Converter<ICapacityFailure> = Converters.strictObject<ICapacityFailure>({
    reason: Converters.literal('capacity-exhausted'),
    dimension: capacityDimension,
    recordId: boundedSingleLine(bounds.maxIdLength, 'record id').optional(),
    used: nonNegativeSafeInteger,
    reserved: nonNegativeSafeInteger,
    requested: nonNegativeSafeInteger,
    limit: nonNegativeSafeInteger,
    reclaimableByCleanup: Converters.boolean
  });

  const failure: Converter<ITaskFailure> = Converters.strictObject<ITaskFailure>({
    code: failureCode,
    operationId: ids.operationId.optional(),
    retry: Converters.enumeratedValue<ITaskFailure['retry']>([
      'safe',
      'reconcile-first',
      'after-host-action'
    ]),
    capacity: capacityFailure.optional()
  }).withConstraint((value: ITaskFailure): Result<ITaskFailure> => {
    if (value.code === 'backpressure' && value.capacity === undefined) {
      return fail(`${value.code}: requires structured capacity detail`);
    }
    if (value.code !== 'backpressure' && value.capacity !== undefined) {
      return fail(`${value.code}: capacity detail accompanies 'backpressure' only`);
    }
    return succeed(value);
  });

  return { capacityDimension, capacityFailure, failureCode, failure };
}
