// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Mock ESM-only module before imports
jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

import '@fgv/ts-utils-jest';
import { Entities, TaskId } from '@fgv/ts-chocolate';

import { formatTaskHuman } from '../../../../commands/task/showCommand';

// ============================================================================
// Test Data
// ============================================================================

function createTask(overrides?: Record<string, unknown>): Entities.Tasks.IRawTaskEntity {
  return {
    baseId: 'heat-cream',
    name: 'Heat Cream',
    template: 'Heat {{amount}}g of {{ingredient}} to {{temperature}}°C',
    ...overrides
  } as unknown as Entities.Tasks.IRawTaskEntity;
}

// ============================================================================
// Tests
// ============================================================================

describe('formatTaskHuman', () => {
  test('formats basic task', () => {
    const task = createTask();
    const output = formatTaskHuman(task, 'coll.heat-cream' as TaskId);
    expect(output).toContain('Task: Heat Cream');
    expect(output).toContain('ID: coll.heat-cream');
    expect(output).toContain('Template:');
    expect(output).toContain('Heat {{amount}}g of {{ingredient}} to {{temperature}}°C');
  });

  test('formats task with notes', () => {
    const task = createTask({ notes: 'Use a double boiler for best results' });
    const output = formatTaskHuman(task, 'coll.heat-cream' as TaskId);
    expect(output).toContain('Notes: Use a double boiler for best results');
  });

  test('formats task with tags', () => {
    const task = createTask({ tags: ['ganache', 'basic'] });
    const output = formatTaskHuman(task, 'coll.heat-cream' as TaskId);
    expect(output).toContain('Tags: ganache, basic');
  });

  test('shows required variables', () => {
    const task = createTask();
    const output = formatTaskHuman(task, 'coll.heat-cream' as TaskId);
    expect(output).toContain('Required Variables:');
    expect(output).toContain('{{amount}}');
    expect(output).toContain('{{ingredient}}');
    expect(output).toContain('{{temperature}}');
  });

  test('shows default values for variables', () => {
    const task = createTask({
      defaults: {
        amount: 200,
        temperature: 85
      }
    });
    const output = formatTaskHuman(task, 'coll.heat-cream' as TaskId);
    expect(output).toContain('(default: 200)');
    expect(output).toContain('(default: 85)');
  });

  test('formats default times', () => {
    const task = createTask({
      defaultActiveTime: 5,
      defaultWaitTime: 10,
      defaultHoldTime: 3,
      defaultTemperature: 85
    });
    const output = formatTaskHuman(task, 'coll.heat-cream' as TaskId);
    expect(output).toContain('Default Times:');
    expect(output).toContain('Active: 5 min');
    expect(output).toContain('Wait: 10 min');
    expect(output).toContain('Hold: 3 min');
    expect(output).toContain('Temperature: 85°C');
  });

  test('shows rendered description when provided', () => {
    const task = createTask();
    const output = formatTaskHuman(task, 'coll.heat-cream' as TaskId, 'Heat 200g of cream to 85°C');
    expect(output).toContain('Rendered Description:');
    expect(output).toContain('Heat 200g of cream to 85°C');
  });

  test('omits rendered description when not provided', () => {
    const task = createTask();
    const output = formatTaskHuman(task, 'coll.heat-cream' as TaskId);
    expect(output).not.toContain('Rendered Description:');
  });

  test('handles task with no variables', () => {
    const task = createTask({ template: 'Combine all ingredients' });
    const output = formatTaskHuman(task, 'coll.combine' as TaskId);
    expect(output).toContain('Combine all ingredients');
    expect(output).not.toContain('Required Variables:');
  });
});
