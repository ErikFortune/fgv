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

const mockLoadIngredientsLibrary = jest.fn();
jest.mock('../../../../commands/shared', () => {
  const actual = jest.requireActual('../../../../commands/shared');
  return {
    ...actual,
    loadIngredientsLibrary: mockLoadIngredientsLibrary
  };
});

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';

import { createListSubcommand } from '../../../../commands/ingredient/listCommand';

// ============================================================================
// Test Helpers
// ============================================================================

function createIngredient(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    manufacturer: 'Valrhona',
    chocolateType: 'dark',
    cacaoPercentage: 70,
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

describe('ingredient listCommand', () => {
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

  test('lists all ingredients with no filters', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-70', createIngredient()],
          [
            'coll.milk-40',
            createIngredient({ name: 'Milk Chocolate 40%', chocolateType: 'milk', cacaoPercentage: 40 })
          ]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate 70%');
    expect(output).toContain('Milk Chocolate 40%');
  });

  test('filters by collection', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['alpha.dark-70', createIngredient()],
          ['beta.milk-40', createIngredient({ name: 'Milk Chocolate 40%' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--collection', 'alpha'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate 70%');
    expect(output).not.toContain('Milk Chocolate 40%');
  });

  test('filters by name (case-insensitive substring)', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-70', createIngredient()],
          ['coll.sugar', createIngredient({ name: 'Granulated Sugar', category: 'sugar' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'dark'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate 70%');
    expect(output).not.toContain('Sugar');
  });

  test('filters by category', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-70', createIngredient()],
          ['coll.sugar', createIngredient({ name: 'Granulated Sugar', category: 'sugar' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--category', 'chocolate'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate 70%');
    expect(output).not.toContain('Sugar');
  });

  test('filters by manufacturer (case-insensitive substring)', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-70', createIngredient()],
          ['coll.milk-40', createIngredient({ name: 'Milk Chocolate 40%', manufacturer: 'Callebaut' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--manufacturer', 'valr'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate 70%');
    expect(output).not.toContain('Milk Chocolate');
  });

  test('filters by chocolate type', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-70', createIngredient()],
          ['coll.milk-40', createIngredient({ name: 'Milk Chocolate 40%', chocolateType: 'milk' })],
          ['coll.sugar', createIngredient({ name: 'Granulated Sugar', category: 'sugar' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--chocolate-type', 'dark'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate 70%');
    expect(output).not.toContain('Milk Chocolate');
    expect(output).not.toContain('Sugar');
  });

  test('filters by tags with AND logic', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-70', createIngredient({ tags: ['premium', 'organic'] })],
          ['coll.milk-40', createIngredient({ name: 'Milk Chocolate 40%', tags: ['premium'] })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--tag', 'premium', '--tag', 'organic'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate 70%');
    expect(output).not.toContain('Milk Chocolate');
  });

  test('shows empty message when no ingredients match', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(createMockLibrary([['coll.dark-70', createIngredient()]]))
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'nonexistent'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('No ingredient');
  });

  test('handles library load failure', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(fail('Connection refused'));

    const cmd = createListSubcommand();
    try {
      await cmd.parseAsync([], { from: 'user' });
    } catch {
      // Expected - mocked process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading ingredients'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('sorts results by ID', async () => {
    mockLoadIngredientsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.zzz-last', createIngredient({ name: 'Zzz Last' })],
          ['coll.aaa-first', createIngredient({ name: 'Aaa First' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync([], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    const firstIdx = output.indexOf('aaa-first');
    const lastIdx = output.indexOf('zzz-last');
    expect(firstIdx).toBeLessThan(lastIdx);
  });
});
