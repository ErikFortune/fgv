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
  select: jest.fn(),
  confirm: jest.fn(),
  input: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Separator: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn()
}));

jest.mock('os', () => ({
  hostname: jest.fn()
}));

const mockInitWorkspaceLib = jest.fn();
jest.mock('@fgv/ts-chocolate', () => {
  const actual = jest.requireActual('@fgv/ts-chocolate');
  return {
    ...actual,
    initializeWorkspace: mockInitWorkspaceLib
  };
});

const mockConfirmAction = jest.fn();
const mockPromptInput = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock('../../../../commands/workspace/shared', () => ({
  confirmAction: mockConfirmAction,
  promptInput: mockPromptInput,
  showSuccess: mockShowSuccess,
  showError: mockShowError
}));

import * as path from 'path';
import { succeed, fail } from '@fgv/ts-utils';
import { existsSync, readdirSync } from 'fs';
import { hostname } from 'os';

import { createInitCommand } from '../../../../commands/workspace/initCommand';

describe('initCommand', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as unknown as () => never);

    // Defaults: new directory, hostname available, library succeeds
    (existsSync as jest.Mock).mockReturnValue(false);
    (readdirSync as jest.Mock).mockReturnValue([]);
    (hostname as jest.Mock).mockReturnValue('test-machine');
    mockInitWorkspaceLib.mockReturnValue(succeed(undefined));
    mockConfirmAction.mockResolvedValue(true);
    mockPromptInput.mockResolvedValue('');
    mockShowSuccess.mockImplementation();
    mockShowError.mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockProcessExit.mockRestore();
  });

  test('initializes workspace in new directory', async () => {
    const cmd = createInitCommand();
    await cmd.parseAsync(['--workspace', '/test/workspace', '--yes'], { from: 'user' });

    expect(mockInitWorkspaceLib).toHaveBeenCalledWith(
      expect.objectContaining({
        workspacePath: path.resolve('/test/workspace'),
        deviceId: 'test-machine'
      })
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('initialized'));
  });

  test('uses provided device name option', async () => {
    const cmd = createInitCommand();
    await cmd.parseAsync(['--workspace', '/test/workspace', '--device-name', 'MyDevice'], { from: 'user' });

    expect(mockInitWorkspaceLib).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'mydevice'
      })
    );
  });

  test('skips prompts with --yes flag', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue(['file1.txt', 'file2.txt']);

    const cmd = createInitCommand();
    await cmd.parseAsync(['--workspace', '/test/workspace', '--yes'], { from: 'user' });

    expect(mockConfirmAction).not.toHaveBeenCalled();
    expect(mockPromptInput).not.toHaveBeenCalled();
    expect(mockInitWorkspaceLib).toHaveBeenCalled();
  });

  test('initializes empty existing directory without confirmation prompt', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue([]);

    const cmd = createInitCommand();
    await cmd.parseAsync(['--workspace', '/test/workspace', '--yes'], { from: 'user' });

    expect(mockConfirmAction).not.toHaveBeenCalled();
    expect(mockInitWorkspaceLib).toHaveBeenCalled();
  });

  test('prompts when non-empty directory exists and user confirms', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue(['file1.txt', 'file2.txt']);
    mockConfirmAction.mockResolvedValue(true);
    mockPromptInput.mockResolvedValue('');

    const cmd = createInitCommand();
    await cmd.parseAsync(['--workspace', '/test/workspace'], { from: 'user' });

    expect(mockConfirmAction).toHaveBeenCalledWith(expect.stringContaining('not empty'), false);
    expect(mockInitWorkspaceLib).toHaveBeenCalled();
  });

  test('exits with error when user cancels non-empty directory', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue(['file1.txt', 'file2.txt']);
    mockConfirmAction.mockResolvedValue(false);

    const cmd = createInitCommand();
    try {
      await cmd.parseAsync(['--workspace', '/test/workspace'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConfirmAction).toHaveBeenCalled();
    expect(mockInitWorkspaceLib).not.toHaveBeenCalled();
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('exits with error when library initializeWorkspace fails', async () => {
    mockInitWorkspaceLib.mockReturnValue(fail('Failed to create workspace configuration'));

    const cmd = createInitCommand();
    try {
      await cmd.parseAsync(['--workspace', '/test/workspace', '--yes'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to create'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('generates device ID from hostname when no device name given with --yes', async () => {
    (hostname as jest.Mock).mockReturnValue('test-machine.local');

    const cmd = createInitCommand();
    await cmd.parseAsync(['--workspace', '/test/workspace', '--yes'], { from: 'user' });

    expect(mockInitWorkspaceLib).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'test-machine-local'
      })
    );
  });

  test('uses promptInput result for device name when no --device-name or --yes', async () => {
    mockPromptInput.mockResolvedValue('my-custom-device');

    const cmd = createInitCommand();
    await cmd.parseAsync(['--workspace', '/test/workspace'], { from: 'user' });

    expect(mockPromptInput).toHaveBeenCalledWith(expect.stringContaining('device name'));
    expect(mockInitWorkspaceLib).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'my-custom-device'
      })
    );
  });

  test('normalizes device name to lowercase with hyphens', async () => {
    const cmd = createInitCommand();
    await cmd.parseAsync(['--workspace', '/test/workspace', '--device-name', 'My Device Name!'], {
      from: 'user'
    });

    expect(mockInitWorkspaceLib).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'my-device-name-'
      })
    );
  });
});
