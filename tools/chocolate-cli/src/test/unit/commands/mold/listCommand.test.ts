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

const mockLoadMoldsLibrary = jest.fn();
jest.mock('../../../../commands/shared', () => {
  const actual = jest.requireActual('../../../../commands/shared');
  return {
    ...actual,
    loadMoldsLibrary: mockLoadMoldsLibrary
  };
});

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';

import { createListSubcommand } from '../../../../commands/mold/listCommand';

// ============================================================================
// Test Helpers
// ============================================================================

function createMold(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    name: 'Square Bon Bon Mold',
    manufacturer: 'Chocolat World',
    productNumber: 'CW-2000',
    format: 'series-2000',
    cavities: { kind: 'grid', rows: 3, columns: 4 },
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

describe('mold listCommand', () => {
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

  test('lists all molds with no filters', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.square-bonbon', createMold()],
          [
            'coll.round-truffle',
            createMold({ name: 'Round Truffle Mold', productNumber: 'CW-1500', format: 'series-1000' })
          ]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Square Bon Bon Mold');
    expect(output).toContain('Round Truffle Mold');
  });

  test('filters by collection', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['alpha.square-bonbon', createMold()],
          ['beta.round-truffle', createMold({ name: 'Round Truffle Mold' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--collection', 'alpha'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Square Bon Bon Mold');
    expect(output).not.toContain('Round Truffle Mold');
  });

  test('filters by name (searches name field, case-insensitive)', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.square-bonbon', createMold()],
          ['coll.round-truffle', createMold({ name: 'Round Truffle Mold' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'SQUARE'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Square Bon Bon Mold');
    expect(output).not.toContain('Round Truffle Mold');
  });

  test('filters by manufacturer (case-insensitive substring)', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.square-bonbon', createMold()],
          ['coll.round-truffle', createMold({ name: 'Round Truffle Mold', manufacturer: 'Martellato' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--manufacturer', 'chocolat'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Square Bon Bon Mold');
    expect(output).not.toContain('Round Truffle Mold');
  });

  test('filters by mold format', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.square-bonbon', createMold()],
          ['coll.round-truffle', createMold({ name: 'Round Truffle Mold', format: 'series-1000' })],
          ['coll.custom', createMold({ name: 'Custom Mold', format: 'other' })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--mold-format', 'series-2000'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Square Bon Bon Mold');
    expect(output).not.toContain('Round Truffle Mold');
    expect(output).not.toContain('Custom Mold');
  });

  test('filters by min cavities (grid mold: rows*columns)', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.square-bonbon', createMold()],
          [
            'coll.large-grid',
            createMold({ name: 'Large Grid Mold', cavities: { kind: 'grid', rows: 5, columns: 6 } })
          ],
          ['coll.small', createMold({ name: 'Small Mold', cavities: { kind: 'grid', rows: 2, columns: 3 } })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--min-cavities', '15'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).not.toContain('Square Bon Bon Mold');
    expect(output).toContain('Large Grid Mold');
    expect(output).not.toContain('Small Mold');
  });

  test('filters by max cavities (count mold)', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.square-bonbon', createMold()],
          ['coll.count-mold', createMold({ name: 'Count Mold', cavities: { kind: 'count', count: 24 } })],
          ['coll.small', createMold({ name: 'Small Mold', cavities: { kind: 'count', count: 6 } })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--max-cavities', '10'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).not.toContain('Square Bon Bon Mold');
    expect(output).not.toContain('Count Mold');
    expect(output).toContain('Small Mold');
  });

  test('filters by tags with AND logic', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.square-bonbon', createMold({ tags: ['polycarbonate', 'professional'] })],
          ['coll.round-truffle', createMold({ name: 'Round Truffle Mold', tags: ['polycarbonate'] })]
        ])
      )
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--tag', 'polycarbonate', '--tag', 'professional'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('Square Bon Bon Mold');
    expect(output).not.toContain('Round Truffle Mold');
  });

  test('shows empty message when no molds match', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(createMockLibrary([['coll.square-bonbon', createMold()]]))
    );

    const cmd = createListSubcommand();
    await cmd.parseAsync(['--name', 'nonexistent'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('No mold');
  });

  test('handles library load failure', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(fail('Connection refused'));

    const cmd = createListSubcommand();
    try {
      await cmd.parseAsync([], { from: 'user' });
    } catch {
      // Expected - mocked process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading molds'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('sorts results by ID', async () => {
    mockLoadMoldsLibrary.mockResolvedValue(
      succeed(
        createMockLibrary([
          ['coll.zzz-last', createMold({ name: 'Zzz Last' })],
          ['coll.aaa-first', createMold({ name: 'Aaa First' })]
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
