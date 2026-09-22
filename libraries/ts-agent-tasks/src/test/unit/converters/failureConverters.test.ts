/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import {
  CapacityDimension,
  TaskFailureCode,
  allCapacityDimensions,
  allTaskFailureCodes
} from '../../../index';
import { converters } from '../../helpers/fixtures';

const capacityDetail: Record<string, JsonValue> = {
  reason: 'capacity-exhausted',
  dimension: 'retained-tasks',
  used: 9000,
  reserved: 1000,
  requested: 1,
  limit: 10000,
  reclaimableByCleanup: false
};

describe('failure codes', () => {
  test.each(allTaskFailureCodes.filter((c) => c !== 'backpressure'))(
    'converts the %s code with a retry disposition',
    (code: TaskFailureCode) => {
      expect(converters.failures.failure.convert({ code, retry: 'safe' })).toSucceedAndSatisfy((failure) => {
        expect(failure.code).toBe(code);
        expect(failure.capacity).toBeUndefined();
      });
    }
  );

  test('declares fourteen codes', () => {
    expect(allTaskFailureCodes).toHaveLength(14);
  });

  test('rejects an unknown code', () => {
    expect(converters.failures.failure.convert({ code: 'oops', retry: 'safe' })).toFail();
  });

  test.each([['safe'], ['reconcile-first'], ['after-host-action']])(
    'accepts the %s retry disposition',
    (retry: string) => {
      expect(converters.failures.failure.convert({ code: 'invalid', retry })).toSucceed();
    }
  );

  test('rejects an unknown retry disposition', () => {
    expect(converters.failures.failure.convert({ code: 'invalid', retry: 'eventually' })).toFail();
  });

  test('carries the operation id that resolves an indeterminate commit', () => {
    expect(
      converters.failures.failure.convert({
        code: 'commit-indeterminate',
        operationId: 'op-1',
        retry: 'reconcile-first'
      })
    ).toSucceedAndSatisfy((failure) => {
      expect(failure.operationId).toBe('op-1');
    });
  });
});

describe('capacity detail coupling', () => {
  test('backpressure requires structured capacity detail', () => {
    expect(
      converters.failures.failure.convert({ code: 'backpressure', retry: 'after-host-action' })
    ).toFailWith(/requires structured capacity detail/i);
  });

  test('backpressure with capacity detail converts', () => {
    expect(
      converters.failures.failure.convert({
        code: 'backpressure',
        retry: 'after-host-action',
        capacity: capacityDetail
      })
    ).toSucceedAndSatisfy((failure) => {
      expect(failure.capacity?.dimension).toBe('retained-tasks');
      expect(failure.capacity?.reclaimableByCleanup).toBe(false);
    });
  });

  test('any other code with capacity detail is rejected', () => {
    expect(
      converters.failures.failure.convert({ code: 'conflict', retry: 'safe', capacity: capacityDetail })
    ).toFailWith(/accompanies 'backpressure' only/i);
  });
});

describe('capacity failure detail', () => {
  test.each(allCapacityDimensions)('converts the %s dimension', (dimension: CapacityDimension) => {
    expect(converters.failures.capacityFailure.convert({ ...capacityDetail, dimension })).toSucceed();
  });

  test('declares eleven dimensions', () => {
    expect(allCapacityDimensions).toHaveLength(11);
  });

  test('rejects an unknown dimension', () => {
    expect(converters.failures.capacityFailure.convert({ ...capacityDetail, dimension: 'heap' })).toFail();
  });

  test('may name the limiting record', () => {
    expect(
      converters.failures.capacityFailure.convert({ ...capacityDetail, recordId: 'task-77' })
    ).toSucceedAndSatisfy((failure) => {
      expect(failure.recordId).toBe('task-77');
    });
  });

  test('rejects a negative or fractional count', () => {
    expect(converters.failures.capacityFailure.convert({ ...capacityDetail, used: -1 })).toFail();
    expect(converters.failures.capacityFailure.convert({ ...capacityDetail, reserved: 0.5 })).toFail();
  });

  test('rejects a reason other than capacity-exhausted', () => {
    expect(converters.failures.capacityFailure.convert({ ...capacityDetail, reason: 'too-big' })).toFail();
  });

  test('rejects an extra property', () => {
    expect(
      converters.failures.capacityFailure.convert({ ...capacityDetail, suggestion: 'delete things' })
    ).toFail();
  });
});
