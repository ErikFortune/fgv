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

const mockLoadProceduresLibrary = jest.fn();
jest.mock('../../../../commands/shared', () => {
  const actual = jest.requireActual('../../../../commands/shared');
  return {
    ...actual,
    loadProceduresLibrary: mockLoadProceduresLibrary
  };
});

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';

import { createListSubcommand } from '../../../../commands/procedure/listCommand';

// ============================================================================
// Test Helpers
// ============================================================================

function createProcedure(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    name: 'Temper Dark Chocolate',
    category: 'tempering',
    description: 'Standard method for tempering dark chocolate',
    tags: [],
    steps: [
      { instruction: 'Melt chocolate to 45°C' },
      { instruction: 'Cool to 27°C while stirring' },
      { instruction: 'Reheat to 31°C' }
    ],
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

describe('procedure listCommand', () => {
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

  test('lists all procedures with no filters', async () => {
    mockLoadProceduresLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.temper', createProcedure()],
          ['coll.ganache', createProcedure({ name: 'Make Ganache', category: 'filling' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Temper Dark Chocolate');
    expect(output).toContain('Make Ganache');
  });

  test('filters by collection', async () => {
    mockLoadProceduresLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['alpha.temper', createProcedure()],
          ['beta.ganache', createProcedure({ name: 'Make Ganache' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--collection', 'alpha'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Temper Dark Chocolate');
    expect(output).not.toContain('Make Ganache');
  });

  test('filters by name (case-insensitive)', async () => {
    mockLoadProceduresLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.temper', createProcedure()],
          ['coll.ganache', createProcedure({ name: 'Make Ganache', category: 'filling' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'TEMPER'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Temper Dark Chocolate');
    expect(output).not.toContain('Make Ganache');
  });

  test('filters by category', async () => {
    mockLoadProceduresLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.temper', createProcedure()],
          ['coll.ganache', createProcedure({ name: 'Make Ganache', category: 'filling' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--category', 'tempering'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Temper Dark Chocolate');
    expect(output).not.toContain('Make Ganache');
  });

  test('filters by tags with AND logic', async () => {
    mockLoadProceduresLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.temper', createProcedure({ tags: ['advanced', 'chocolate'] })],
          ['coll.ganache', createProcedure({ name: 'Make Ganache', tags: ['advanced'] })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--tag', 'advanced', '--tag', 'chocolate'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Temper Dark Chocolate');
    expect(output).not.toContain('Make Ganache');
  });

  test('shows empty message when no procedures match', async () => {
    mockLoadProceduresLibrary.mockResolvedValue(
      succeed(createMockLibrary([['coll.temper', createProcedure()]]))
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'nonexistent'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('No procedure');
  });

  test('handles library load failure', async () => {
    mockLoadProceduresLibrary.mockResolvedValue(fail('Connection refused'));

    const cmd = createListSubcommand();
    try {
      await cmd.parseAsync([], { from: 'user' });
    } catch {
      // Expected - mocked process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading procedures'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
