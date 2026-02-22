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

// Mocks before imports
jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

const mockLoadFillingsLibrary = jest.fn();
const mockLoadIngredientsLibrary = jest.fn();
jest.mock('../../../../commands/shared', () => {
  const actual = jest.requireActual('../../../../commands/shared');
  return {
    ...actual,
    loadFillingsLibrary: mockLoadFillingsLibrary,
    loadIngredientsLibrary: mockLoadIngredientsLibrary
  };
});

const mockCalculateGanache = jest.fn();
const mockFillingIdConvert = jest.fn();
const mockVariationSpecConvert = jest.fn();
jest.mock('@fgv/ts-chocolate', () => {
  const actual = jest.requireActual('@fgv/ts-chocolate');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Converters: {
      ...actual.Converters,
      fillingId: { convert: mockFillingIdConvert },
      fillingRecipeVariationSpec: { convert: mockVariationSpecConvert }
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    LibraryRuntime: {
      ...actual.LibraryRuntime,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Internal: {
        ...actual.LibraryRuntime?.Internal,
        calculateGanache: mockCalculateGanache
      }
    }
  };
});

import { succeed, fail } from '@fgv/ts-utils';

import { createAnalyzeSubcommand } from '../../../../commands/ganache/analyzeCommand';

// ============================================================================
// Test Data
// ============================================================================

const mockCalculation = {
  analysis: {
    totalWeight: 500,
    totalFat: 35.5,
    fatToWaterRatio: 2.5,
    sugarToWaterRatio: 1.8,
    characteristics: {
      cacaoFat: 15.0,
      milkFat: 5.0,
      otherFats: 3.0,
      sugar: 25.0,
      water: 14.0,
      solids: 38.0
    }
  },
  validation: {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  }
};

const mockFilling = {
  goldenVariationSpec: 'default',
  variations: [
    { variationSpec: 'default', name: 'Default' },
    { variationSpec: 'rich', name: 'Rich Variation' }
  ]
};

// ============================================================================
// Tests
// ============================================================================

describe('ganache analyzeCommand', () => {
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

    // Default: everything succeeds
    mockFillingIdConvert.mockImplementation((id: string) => succeed(id));
    mockVariationSpecConvert.mockImplementation((spec: string) => succeed(spec));
    mockLoadFillingsLibrary.mockResolvedValue(
      succeed({ get: jest.fn().mockReturnValue(succeed(mockFilling)) })
    );
    mockLoadIngredientsLibrary.mockResolvedValue(succeed({ get: jest.fn() }));
    mockCalculateGanache.mockReturnValue(succeed(mockCalculation));
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  test('displays human format output with composition and validation', async () => {
    const cmd = createAnalyzeSubcommand();
    await cmd.parseAsync(['common.dark-ganache'], { from: 'user' });

    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('common.dark-ganache');
    expect(output).toContain('Composition');
    expect(output).toContain('Cacao Fat');
    expect(output).toContain('15.0%');
    expect(output).toContain('Total Fat');
    expect(output).toContain('35.5%');
    expect(output).toContain('Fat:Water Ratio');
    expect(output).toContain('2.50');
    expect(output).toContain('PASS');
  });

  test('shows all guidelines message when valid with no warnings', async () => {
    const cmd = createAnalyzeSubcommand();
    await cmd.parseAsync(['common.dark-ganache'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('All ratios are within recommended guidelines');
  });

  test('displays validation errors when present', async () => {
    mockCalculateGanache.mockReturnValue(
      succeed({
        analysis: mockCalculation.analysis,
        validation: {
          isValid: false,
          errors: ['Fat to water ratio too low', 'Sugar content exceeds maximum'],
          warnings: []
        }
      })
    );

    const cmd = createAnalyzeSubcommand();
    await cmd.parseAsync(['common.dark-ganache'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('FAIL');
    expect(output).toContain('Fat to water ratio too low');
    expect(output).toContain('Sugar content exceeds maximum');
  });

  test('displays validation warnings when present', async () => {
    mockCalculateGanache.mockReturnValue(
      succeed({
        analysis: mockCalculation.analysis,
        validation: {
          isValid: true,
          errors: [],
          warnings: ['Consider adjusting fat content']
        }
      })
    );

    const cmd = createAnalyzeSubcommand();
    await cmd.parseAsync(['common.dark-ganache'], { from: 'user' });

    const output = mockConsoleLog.mock.calls[0][0] as string;
    expect(output).toContain('PASS');
    expect(output).toContain('Consider adjusting fat content');
  });

  test('analyzes specific variation when --variation provided', async () => {
    const cmd = createAnalyzeSubcommand();
    await cmd.parseAsync(['common.dark-ganache', '--variation', 'rich'], { from: 'user' });

    expect(mockVariationSpecConvert).toHaveBeenCalledWith('rich');
    expect(mockCalculateGanache).toHaveBeenCalledWith(mockFilling, expect.anything(), 'rich');
  });

  test('exits with error for invalid filling ID', async () => {
    mockFillingIdConvert.mockReturnValue(fail('Invalid filling ID'));

    const cmd = createAnalyzeSubcommand();
    try {
      await cmd.parseAsync(['bad..id'], { from: 'user' });
    } catch {
      // Expected
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Invalid filling ID'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('exits with error when fillings library fails to load', async () => {
    mockLoadFillingsLibrary.mockResolvedValue(fail('Library not found'));

    const cmd = createAnalyzeSubcommand();
    try {
      await cmd.parseAsync(['common.dark-ganache'], { from: 'user' });
    } catch {
      // Expected
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading fillings'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('exits with error when filling not found in library', async () => {
    mockLoadFillingsLibrary.mockResolvedValue(succeed({ get: jest.fn().mockReturnValue(fail('not found')) }));

    const cmd = createAnalyzeSubcommand();
    try {
      await cmd.parseAsync(['common.unknown'], { from: 'user' });
    } catch {
      // Expected
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Filling not found'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('exits with error when variation not found on filling', async () => {
    const cmd = createAnalyzeSubcommand();
    try {
      await cmd.parseAsync(['common.dark-ganache', '--variation', 'nonexistent'], { from: 'user' });
    } catch {
      // Expected
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Variation nonexistent not found'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('exits with error when ganache calculation fails', async () => {
    mockCalculateGanache.mockReturnValue(fail('Missing ingredient data'));

    const cmd = createAnalyzeSubcommand();
    try {
      await cmd.parseAsync(['common.dark-ganache'], { from: 'user' });
    } catch {
      // Expected
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error calculating ganache'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
