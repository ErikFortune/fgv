/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import {
  ITaskListDetails,
  TaskListCompletion,
  taskListDetailSchema,
  taskListDetailVersion,
  taskListDescriptor,
  taskListDetails,
  taskListKind,
  trackedTaskDetailSchema,
  trackedTaskDetailVersion,
  trackedTaskDescriptor,
  trackedTaskDetails,
  trackedTaskKind
} from '../../../index';

describe('fgv.tracked@1', () => {
  test('is named and versioned as the design says', () => {
    expect(trackedTaskKind).toBe('fgv.tracked');
    expect(trackedTaskDetailVersion).toBe(1);
  });

  test('details are an empty object', () => {
    expect(trackedTaskDetails.convert({})).toSucceedWith({});
  });

  test('details are strict — a tracked task has no second place to put envelope fields', () => {
    expect(trackedTaskDetails.convert({ title: 'smuggled' })).toFail();
    expect(trackedTaskDetails.convert({ stopPolicy: 'cascade-cancel' })).toFail();
  });

  test('its descriptor encodes to an empty object', () => {
    expect(trackedTaskDescriptor().encode({})).toSucceedWith({});
  });

  test('converter and wire schema agree on what they accept', () => {
    expect(trackedTaskDetailSchema.convert({})).toSucceed();
    expect(trackedTaskDetails.convert({})).toSucceed();
  });

  test('the wire schema emits JSON a model can be offered', () => {
    expect(trackedTaskDetailSchema.toJson()).toEqual(expect.objectContaining({ type: 'object' }));
  });
});

describe('fgv.task-list@1', () => {
  test('is named and versioned as the design says', () => {
    expect(taskListKind).toBe('fgv.task-list');
    expect(taskListDetailVersion).toBe(1);
  });

  test.each<TaskListCompletion>(['manual', 'all-children-succeeded'])(
    'accepts the %s completion policy',
    (completion: TaskListCompletion) => {
      expect(taskListDetails.convert({ completion })).toSucceedWith({ completion });
    }
  );

  test('rejects an unknown completion policy', () => {
    expect(taskListDetails.convert({ completion: 'any-child-succeeded' })).toFail();
  });

  test('requires a completion policy', () => {
    expect(taskListDetails.convert({})).toFail();
  });

  test('stop policy is envelope metadata, not list details', () => {
    expect(taskListDetails.convert({ completion: 'manual', stopPolicy: 'cascade-cancel' })).toFail();
  });

  test('its descriptor round-trips details through convert then encode', () => {
    const wire: JsonValue = { completion: 'all-children-succeeded' };
    expect(taskListDetails.convert(wire)).toSucceedAndSatisfy((typed: ITaskListDetails) => {
      expect(taskListDescriptor().encode(typed)).toSucceedWith(wire);
    });
  });

  test('converter and wire schema agree on valid and invalid details', () => {
    expect(taskListDetailSchema.convert({ completion: 'manual' })).toSucceed();
    expect(taskListDetails.convert({ completion: 'manual' })).toSucceed();
    expect(taskListDetailSchema.convert({ completion: 'whenever' })).toFail();
    expect(taskListDetails.convert({ completion: 'whenever' })).toFail();
    expect(taskListDetailSchema.convert({})).toFail();
    expect(taskListDetails.convert({})).toFail();
  });

  test('the wire schema names the completion property', () => {
    expect(JSON.stringify(taskListDetailSchema.toJson())).toMatch(/completion/);
  });
});
