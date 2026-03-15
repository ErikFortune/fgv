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

// Mocks must come before imports
jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

const mockLoadTasksLibrary = jest.fn();
jest.mock('../../../../commands/shared', () => {
  const actual = jest.requireActual('../../../../commands/shared');
  return {
    ...actual,
    loadTasksLibrary: mockLoadTasksLibrary
  };
});

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';

import { createListSubcommand } from '../../../../commands/task/listCommand';

// ============================================================================
// Test Helpers
// ============================================================================

function createTask(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    name: 'Heat Cream',
    template: 'Heat cream to {{temperature}}°C',
    defaults: { temperature: 85 },
    tags: [],
    ...overrides
  };
}

function createMockLibrary(entries: Array<[string, Record<string, unknown>]>): {
  entries: () => Array<[string, unknown]>;
} {
  return {
    entries: () => entries
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('task listCommand', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as unknown as () => never);
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  test('lists all tasks with no filters', async () => {
    mockLoadTasksLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.heat', createTask()],
          ['coll.stir', createTask({ name: 'Stir Mixture', template: 'Stir for {{duration}} minutes' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Heat Cream');
    expect(output).toContain('Stir Mixture');
  });

  test('filters by collection', async () => {
    mockLoadTasksLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['alpha.heat', createTask()],
          ['beta.stir', createTask({ name: 'Stir Mixture' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--collection', 'alpha'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Heat Cream');
    expect(output).not.toContain('Stir Mixture');
  });

  test('filters by name (case-insensitive)', async () => {
    mockLoadTasksLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.heat', createTask()],
          ['coll.stir', createTask({ name: 'Stir Mixture', template: 'Stir for {{duration}} minutes' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'HEAT'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Heat Cream');
    expect(output).not.toContain('Stir Mixture');
  });

  test('filters by tags with AND logic', async () => {
    mockLoadTasksLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.heat', createTask({ tags: ['heating', 'critical'] })],
          ['coll.stir', createTask({ name: 'Stir Mixture', tags: ['heating'] })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--tag', 'heating', '--tag', 'critical'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Heat Cream');
    expect(output).not.toContain('Stir Mixture');
  });

  test('shows empty message when no tasks match', async () => {
    mockLoadTasksLibrary.mockResolvedValue(succeed(createMockLibrary([['coll.heat', createTask()]])));

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'nonexistent'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('No task');
  });

  test('handles library load failure', async () => {
    mockLoadTasksLibrary.mockResolvedValue(fail('Connection refused'));

    const cmd = createListSubcommand();
    try {
      await cmd.parseAsync([], { from: 'user' });
    } catch {
      // Expected - mocked process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading tasks'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
