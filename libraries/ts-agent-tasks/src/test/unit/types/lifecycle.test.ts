/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  TaskLifecycleStatus,
  allTaskStatuses,
  allUpdateCategories,
  isTerminalTaskStatus,
  openTaskStatuses,
  terminalTaskStatuses
} from '../../../index';

describe('lifecycle status sets', () => {
  test('there are seven statuses, four open and three terminal', () => {
    expect(allTaskStatuses).toHaveLength(7);
    expect(openTaskStatuses).toHaveLength(4);
    expect(terminalTaskStatuses).toHaveLength(3);
  });

  test('open and terminal partition the whole set', () => {
    expect([...openTaskStatuses, ...terminalTaskStatuses].sort()).toEqual([...allTaskStatuses].sort());
    for (const status of openTaskStatuses) {
      expect(terminalTaskStatuses).not.toContain(status);
    }
  });

  test('open is exactly pending, running, waiting and paused', () => {
    expect([...openTaskStatuses].sort()).toEqual(['paused', 'pending', 'running', 'waiting']);
  });

  test.each(terminalTaskStatuses)('%s is terminal', (status: TaskLifecycleStatus) => {
    expect(isTerminalTaskStatus(status)).toBe(true);
  });

  test.each(openTaskStatuses)('%s is not terminal', (status: TaskLifecycleStatus) => {
    expect(isTerminalTaskStatus(status)).toBe(false);
  });
});

describe('update categories', () => {
  test('there are seven, and the count is what closeout reserves against', () => {
    expect(allUpdateCategories).toHaveLength(7);
    expect(new Set(allUpdateCategories).size).toBe(7);
  });
});
