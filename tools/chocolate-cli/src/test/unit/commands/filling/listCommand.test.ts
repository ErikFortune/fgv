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

const mockLoadFillingsLibrary = jest.fn();
jest.mock('../../../../commands/filling/shared', () => {
  const actual = jest.requireActual('../../../../commands/filling/shared');
  return {
    ...actual,
    loadFillingsLibrary: mockLoadFillingsLibrary
  };
});

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';

import { createListSubcommand } from '../../../../commands/filling/listCommand';

// ============================================================================
// Test Helpers
// ============================================================================

function createFilling(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    name: 'Dark Chocolate Ganache',
    category: 'ganache',
    description: 'Rich dark chocolate ganache filling',
    tags: [],
    goldenVariationSpec: 'default',
    variations: [
      {
        variationSpec: 'default'
      }
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

describe('filling listCommand', () => {
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

  test('lists all fillings with no filters', async () => {
    mockLoadFillingsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-ganache', createFilling()],
          ['coll.caramel', createFilling({ name: 'Salted Caramel', category: 'caramel' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Ganache');
    expect(output).toContain('Salted Caramel');
  });

  test('filters by collection', async () => {
    mockLoadFillingsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['alpha.dark-ganache', createFilling()],
          ['beta.caramel', createFilling({ name: 'Salted Caramel' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--collection', 'alpha'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Ganache');
    expect(output).not.toContain('Salted Caramel');
  });

  test('filters by name (case-insensitive)', async () => {
    mockLoadFillingsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-ganache', createFilling()],
          ['coll.caramel', createFilling({ name: 'Salted Caramel', category: 'caramel' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'GANACHE'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Ganache');
    expect(output).not.toContain('Salted Caramel');
  });

  test('filters by tags with AND logic', async () => {
    mockLoadFillingsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-ganache', createFilling({ tags: ['premium', 'organic'] })],
          ['coll.caramel', createFilling({ name: 'Salted Caramel', tags: ['premium'] })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--tag', 'premium', '--tag', 'organic'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Ganache');
    expect(output).not.toContain('Salted Caramel');
  });

  test('shows empty message when no fillings match', async () => {
    mockLoadFillingsLibrary.mockResolvedValue(
      succeed(createMockLibrary([['coll.dark-ganache', createFilling()]]))
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'nonexistent'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('No');
  });

  test('handles library load failure', async () => {
    mockLoadFillingsLibrary.mockResolvedValue(fail('Connection refused'));

    const cmd = createListSubcommand();
    try {
      await cmd.parseAsync([], { from: 'user' });
    } catch {
      // Expected - mocked process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading fillings'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
