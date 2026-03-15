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

const mockLoadConfectionsLibrary = jest.fn();
jest.mock('../../../../commands/shared', () => {
  const actual = jest.requireActual('../../../../commands/shared');
  return {
    ...actual,
    loadConfectionsLibrary: mockLoadConfectionsLibrary
  };
});

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';

import { createListSubcommand } from '../../../../commands/confection/listCommand';

// ============================================================================
// Test Helpers
// ============================================================================

function createConfection(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    name: 'Dark Chocolate Truffle',
    confectionType: 'bar-truffle',
    description: 'Rich dark chocolate ganache',
    tags: [],
    goldenVariationSpec: 'default',
    variations: [
      {
        variationSpec: 'default',
        yield: { count: 24, unit: 'piece' }
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

describe('confection listCommand', () => {
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

  test('lists all confections with no filters', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-truffle', createConfection()],
          [
            'coll.caramel-bonbon',
            createConfection({ name: 'Salted Caramel Bon Bon', confectionType: 'molded-bonbon' })
          ]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Truffle');
    expect(output).toContain('Salted Caramel Bon Bon');
  });

  test('filters by collection', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['alpha.dark-truffle', createConfection()],
          ['beta.caramel-bonbon', createConfection({ name: 'Salted Caramel Bon Bon' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--collection', 'alpha'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Truffle');
    expect(output).not.toContain('Salted Caramel Bon Bon');
  });

  test('filters by name (case-insensitive)', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-truffle', createConfection()],
          ['coll.caramel-bonbon', createConfection({ name: 'Salted Caramel Bon Bon' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'TRUFFLE'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Truffle');
    expect(output).not.toContain('Salted Caramel Bon Bon');
  });

  test('filters by confection type', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-truffle', createConfection()],
          [
            'coll.caramel-bonbon',
            createConfection({ name: 'Salted Caramel Bon Bon', confectionType: 'molded-bonbon' })
          ]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--type', 'bar-truffle'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Truffle');
    expect(output).not.toContain('Salted Caramel Bon Bon');
  });

  test('filters by mold (only molded-bonbon passes)', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-truffle', createConfection()],
          [
            'coll.caramel-bonbon',
            createConfection({
              name: 'Salted Caramel Bon Bon',
              confectionType: 'molded-bonbon',
              shellChocolate: {
                options: [{ id: 'dark-chocolate' }]
              },
              variations: [
                {
                  variationSpec: 'default',
                  yield: { count: 24, unit: 'piece' },
                  molds: { options: [{ id: 'square-mold' }] }
                }
              ]
            })
          ]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--mold', 'square-mold'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).not.toContain('Dark Chocolate Truffle');
    expect(output).toContain('Salted Caramel Bon Bon');
  });

  test('filters by filling', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          [
            'coll.dark-truffle',
            createConfection({
              variations: [
                {
                  variationSpec: 'default',
                  yield: { count: 24, unit: 'piece' },
                  fillings: [
                    {
                      filling: { options: [{ id: 'ganache-filling' }] }
                    }
                  ]
                }
              ]
            })
          ],
          ['coll.caramel-bonbon', createConfection({ name: 'Salted Caramel Bon Bon' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--filling', 'ganache-filling'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Truffle');
    expect(output).not.toContain('Salted Caramel Bon Bon');
  });

  test('filters by tags with AND logic', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.dark-truffle', createConfection({ tags: ['premium', 'organic'] })],
          ['coll.caramel-bonbon', createConfection({ name: 'Salted Caramel Bon Bon', tags: ['premium'] })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--tag', 'premium', '--tag', 'organic'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Dark Chocolate Truffle');
    expect(output).not.toContain('Salted Caramel Bon Bon');
  });

  test('shows empty message when no confections match', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(
      succeed(createMockLibrary([['coll.dark-truffle', createConfection()]]))
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'nonexistent'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('No confection');
  });

  test('handles library load failure', async () => {
    mockLoadConfectionsLibrary.mockResolvedValue(fail('Connection refused'));

    const cmd = createListSubcommand();
    try {
      await cmd.parseAsync([], { from: 'user' });
    } catch {
      // Expected - mocked process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading confections'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
