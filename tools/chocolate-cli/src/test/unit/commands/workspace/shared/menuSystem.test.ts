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

jest.mock('@inquirer/prompts', () => ({
  select: jest.fn(),
  confirm: jest.fn(),
  input: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Separator: jest.fn().mockImplementation(() => ({ type: 'separator' }))
}));

jest.mock('chalk', () => ({
  blue: jest.fn((s: string) => s),
  green: jest.fn((s: string) => s),
  red: jest.fn((s: string) => s),
  yellow: jest.fn((s: string) => s)
}));

import { select, confirm, input, Separator } from '@inquirer/prompts';
import {
  showMenu,
  confirmAction,
  promptInput,
  MenuBreadcrumb,
  showInfo,
  showSuccess,
  showError,
  showWarning
} from '../../../../../commands/workspace/shared/menuSystem';

// ============================================================================
// MenuBreadcrumb Tests
// ============================================================================

describe('MenuBreadcrumb', () => {
  let breadcrumb: MenuBreadcrumb;

  beforeEach(() => {
    breadcrumb = new MenuBreadcrumb();
  });

  test('push adds items to path', () => {
    breadcrumb.push('Home');
    breadcrumb.push('Settings');
    expect(breadcrumb.path).toEqual(['Home', 'Settings']);
  });

  test('pop removes and returns last item', () => {
    breadcrumb.push('Home');
    breadcrumb.push('Settings');
    const item = breadcrumb.pop();
    expect(item).toBe('Settings');
    expect(breadcrumb.path).toEqual(['Home']);
  });

  test('pop on empty returns undefined', () => {
    expect(breadcrumb.pop()).toBeUndefined();
  });

  test('toString joins with > separator', () => {
    breadcrumb.push('Home');
    breadcrumb.push('Settings');
    breadcrumb.push('Profile');
    expect(breadcrumb.toString()).toBe('Home > Settings > Profile');
  });

  test('toString returns empty string for empty path', () => {
    expect(breadcrumb.toString()).toBe('');
  });

  test('clear empties the path', () => {
    breadcrumb.push('Home');
    breadcrumb.push('Settings');
    breadcrumb.clear();
    expect(breadcrumb.path).toEqual([]);
  });
});

// ============================================================================
// showMenu Tests
// ============================================================================

describe('showMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns value result when user selects an item', async () => {
    (select as jest.Mock).mockResolvedValue('option1');

    const result = await showMenu({
      message: 'Choose an option',
      choices: [
        { name: 'Option 1', value: 'option1' },
        { name: 'Option 2', value: 'option2' }
      ]
    });

    expect(result).toEqual({ action: 'value', value: 'option1' });
  });

  test('returns back action when user selects back', async () => {
    (select as jest.Mock).mockResolvedValue('back');

    const result = await showMenu({
      message: 'Choose an option',
      choices: [{ name: 'Option 1', value: 'option1' }],
      showBack: true
    });

    expect(result).toEqual({ action: 'back' });
  });

  test('returns exit action when user selects exit', async () => {
    (select as jest.Mock).mockResolvedValue('exit');

    const result = await showMenu({
      message: 'Choose an option',
      choices: [{ name: 'Option 1', value: 'option1' }]
    });

    expect(result).toEqual({ action: 'exit' });
  });

  test('includes back and exit options with separator', async () => {
    (select as jest.Mock).mockResolvedValue('option1');

    await showMenu({
      message: 'Choose an option',
      choices: [{ name: 'Option 1', value: 'option1' }],
      showBack: true,
      showExit: true
    });

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Choose an option',
        pageSize: 10
      })
    );
    // Verify Separator was constructed (called when showBack or showExit is true)
    expect(Separator as unknown as jest.Mock).toHaveBeenCalled();
  });

  test('does not include back option when showBack is false', async () => {
    (select as jest.Mock).mockResolvedValue('option1');

    await showMenu({
      message: 'Choose an option',
      choices: [{ name: 'Option 1', value: 'option1' }],
      showBack: false,
      showExit: false
    });

    // When both are false, Separator should not be constructed
    expect(Separator as unknown as jest.Mock).not.toHaveBeenCalled();
  });

  test('uses custom page size', async () => {
    (select as jest.Mock).mockResolvedValue('option1');

    await showMenu({
      message: 'Choose',
      choices: [{ name: 'Option 1', value: 'option1' }],
      pageSize: 20
    });

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 20
      })
    );
  });
});

// ============================================================================
// confirmAction Tests
// ============================================================================

describe('confirmAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns true when user confirms', async () => {
    (confirm as jest.Mock).mockResolvedValue(true);

    const result = await confirmAction('Are you sure?');

    expect(result).toBe(true);
    expect(confirm).toHaveBeenCalledWith({
      message: 'Are you sure?',
      default: true
    });
  });

  test('returns false when user declines', async () => {
    (confirm as jest.Mock).mockResolvedValue(false);
    expect(await confirmAction('Are you sure?')).toBe(false);
  });

  test('passes custom default value to confirm', async () => {
    (confirm as jest.Mock).mockResolvedValue(false);

    await confirmAction('Are you sure?', false);

    expect(confirm).toHaveBeenCalledWith({
      message: 'Are you sure?',
      default: false
    });
  });
});

// ============================================================================
// promptInput Tests
// ============================================================================

describe('promptInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns user input', async () => {
    (input as jest.Mock).mockResolvedValue('user response');

    const result = await promptInput('Enter your name:');

    expect(result).toBe('user response');
    expect(input).toHaveBeenCalledWith({
      message: 'Enter your name:',
      default: undefined
    });
  });

  test('passes default value to input', async () => {
    (input as jest.Mock).mockResolvedValue('default name');

    await promptInput('Enter your name:', 'default name');

    expect(input).toHaveBeenCalledWith({
      message: 'Enter your name:',
      default: 'default name'
    });
  });
});

// ============================================================================
// Message Function Tests
// ============================================================================

describe('Message functions', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('showInfo calls console.log', () => {
    showInfo('This is information');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), 'This is information');
  });

  test('showSuccess calls console.log', () => {
    showSuccess('Operation successful');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), 'Operation successful');
  });

  test('showError calls console.error', () => {
    showError('Something went wrong');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.anything(), 'Something went wrong');
  });

  test('showWarning calls console.warn', () => {
    showWarning('This is a warning');
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.anything(), 'This is a warning');
  });
});
