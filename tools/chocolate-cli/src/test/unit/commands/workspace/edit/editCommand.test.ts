/*
 * MIT License
 *
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

jest.mock('@inquirer/prompts', () => ({
  search: jest.fn(),
  select: jest.fn(),
  confirm: jest.fn(),
  input: jest.fn(),
  password: jest.fn()
}));

const mockLoadWorkspace = jest.fn();
const mockShowError = jest.fn();
const mockShowInfo = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowWarning = jest.fn();
jest.mock('../../../../../commands/workspace/shared', () => ({
  loadWorkspace: mockLoadWorkspace,
  showError: mockShowError,
  showInfo: mockShowInfo,
  showSuccess: mockShowSuccess,
  showWarning: mockShowWarning
}));

const mockExecuteAdd = jest.fn();
const mockExecuteUpdate = jest.fn();
const mockExecuteInteractive = jest.fn();
jest.mock('../../../../../commands/workspace/edit/editOrchestrator', () => ({
  executeAdd: mockExecuteAdd,
  executeUpdate: mockExecuteUpdate,
  executeInteractive: mockExecuteInteractive
}));

import '@fgv/ts-utils-jest';
import { Command } from 'commander';
import { succeed, fail } from '@fgv/ts-utils';

const mockPassword = jest.requireMock('@inquirer/prompts').password;

import { createEditCommand } from '../../../../../commands/workspace/edit/editCommand';

interface MockWorkspace {
  state: string;
  unlock: jest.Mock;
  data: {
    entities: Record<string, unknown>;
  };
}

function createMockWorkspace(state: string = 'no-keystore'): MockWorkspace {
  return {
    state,
    unlock: jest.fn().mockResolvedValue(succeed(undefined)),
    data: { entities: {} }
  };
}

/**
 * Extracts a named subcommand from the edit command for direct testing.
 * Pre-sets the parent's required workspace option to prevent Commander's
 * mandatory option check from firing when we parse the subcommand directly.
 */
function getSubcommand(name: string): Command {
  const editCmd = createEditCommand();
  // Satisfy the parent's requiredOption('-w') so Commander's
  // _checkForMissingMandatoryOptions doesn't fire on the parent.
  editCmd.setOptionValue('workspace', '/dummy');
  const sub = editCmd.commands.find((c) => c.name() === name);
  if (!sub) {
    throw new Error(`Subcommand '${name}' not found`);
  }
  return sub;
}

describe('editCommand', () => {
  let mockProcessExit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as unknown as () => never);
  });

  afterEach(() => {
    mockProcessExit.mockRestore();
  });

  describe('createEditCommand', () => {
    test('should create command with add, update, and default action', () => {
      const cmd = createEditCommand();
      expect(cmd.name()).toBe('edit');
      expect(cmd.commands).toHaveLength(2);
      expect(cmd.commands[0].name()).toBe('add');
      expect(cmd.commands[1].name()).toBe('update');
    });
  });

  describe('add subcommand', () => {
    test('should successfully add entity', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Entity added'));

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' });

      expect(mockLoadWorkspace).toHaveBeenCalledWith({
        workspacePath: '/test/workspace'
      });
      expect(mockExecuteAdd).toHaveBeenCalledWith(workspace, 'ingredient', undefined, undefined);
      expect(mockShowSuccess).toHaveBeenCalledWith('Entity added');
    });

    test('should add entity with --from-file option', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Entity added from file'));

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient', '--from-file', 'entity.json'], {
        from: 'user'
      });

      expect(mockExecuteAdd).toHaveBeenCalledWith(workspace, 'ingredient', 'entity.json', undefined);
    });

    test('should add entity with --collection option', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Entity added to collection'));

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient', '-c', 'public'], { from: 'user' });

      expect(mockExecuteAdd).toHaveBeenCalledWith(workspace, 'ingredient', undefined, 'public');
    });

    test('should exit with error when workspace load fails', async () => {
      mockLoadWorkspace.mockResolvedValue(fail('Workspace not found'));

      const cmd = getSubcommand('add');
      await expect(
        cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' })
      ).rejects.toThrow('process.exit');

      expect(mockShowError).toHaveBeenCalledWith('Workspace not found');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('should exit with error when executeAdd returns failure', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(fail('Invalid entity data'));

      const cmd = getSubcommand('add');
      await expect(
        cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' })
      ).rejects.toThrow('process.exit');

      expect(mockShowError).toHaveBeenCalledWith('Invalid entity data');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('update subcommand', () => {
    test('should successfully update entity', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteUpdate.mockResolvedValue(succeed('Entity updated'));

      const cmd = getSubcommand('update');
      await cmd.parseAsync(['ingredient.dark-chocolate', '-w', '/test/workspace', '-t', 'ingredient'], {
        from: 'user'
      });

      expect(mockLoadWorkspace).toHaveBeenCalledWith({
        workspacePath: '/test/workspace'
      });
      expect(mockExecuteUpdate).toHaveBeenCalledWith(
        workspace,
        'ingredient',
        'ingredient.dark-chocolate',
        undefined,
        undefined
      );
      expect(mockShowSuccess).toHaveBeenCalledWith('Entity updated');
    });

    test('should update entity with --from-file and --collection options', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteUpdate.mockResolvedValue(succeed('Entity updated from file'));

      const cmd = getSubcommand('update');
      await cmd.parseAsync(
        [
          'ingredient.dark-chocolate',
          '-w',
          '/test/workspace',
          '-t',
          'ingredient',
          '--from-file',
          'entity.json',
          '-c',
          'private'
        ],
        { from: 'user' }
      );

      expect(mockExecuteUpdate).toHaveBeenCalledWith(
        workspace,
        'ingredient',
        'ingredient.dark-chocolate',
        'entity.json',
        'private'
      );
    });

    test('should exit with error when workspace load fails', async () => {
      mockLoadWorkspace.mockResolvedValue(fail('Workspace not found'));

      const cmd = getSubcommand('update');
      await expect(
        cmd.parseAsync(['ingredient.dark-chocolate', '-w', '/test/workspace', '-t', 'ingredient'], {
          from: 'user'
        })
      ).rejects.toThrow('process.exit');

      expect(mockShowError).toHaveBeenCalledWith('Workspace not found');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('should exit with error when executeUpdate returns failure', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteUpdate.mockResolvedValue(fail('Entity not found'));

      const cmd = getSubcommand('update');
      await expect(
        cmd.parseAsync(['ingredient.dark-chocolate', '-w', '/test/workspace', '-t', 'ingredient'], {
          from: 'user'
        })
      ).rejects.toThrow('process.exit');

      expect(mockShowError).toHaveBeenCalledWith('Entity not found');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('workspace unlock', () => {
    test('should skip unlock when workspace state is no-keystore', async () => {
      const workspace = createMockWorkspace('no-keystore');
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Success'));

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' });

      expect(workspace.unlock).not.toHaveBeenCalled();
      expect(mockPassword).not.toHaveBeenCalled();
    });

    test('should skip unlock when workspace state is unlocked', async () => {
      const workspace = createMockWorkspace('unlocked');
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Success'));

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' });

      expect(workspace.unlock).not.toHaveBeenCalled();
      expect(mockPassword).not.toHaveBeenCalled();
    });

    test('should prompt for password when workspace has keystore', async () => {
      const workspace = createMockWorkspace('locked');
      workspace.unlock.mockResolvedValue(succeed(undefined));
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Success'));
      mockPassword.mockResolvedValue('test-password');

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' });

      expect(mockPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('password')
        })
      );
      expect(workspace.unlock).toHaveBeenCalledWith('test-password');
      expect(mockShowInfo).toHaveBeenCalledWith('Workspace unlocked successfully');
    });

    test('should proceed with public collections when password is empty', async () => {
      const workspace = createMockWorkspace('locked');
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Success'));
      mockPassword.mockResolvedValue('');

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' });

      expect(workspace.unlock).not.toHaveBeenCalled();
      expect(mockShowInfo).toHaveBeenCalledWith(
        'Skipping keystore unlock - only public collections will be available'
      );
    });

    test('should proceed with public collections when unlock fails', async () => {
      const workspace = createMockWorkspace('locked');
      workspace.unlock.mockResolvedValue(fail('Invalid password'));
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Success'));
      mockPassword.mockResolvedValue('wrong-password');

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' });

      expect(mockShowError).toHaveBeenCalledWith('Failed to unlock workspace: Invalid password');
      expect(mockShowInfo).toHaveBeenCalledWith('Proceeding with public collections only');
      expect(mockExecuteAdd).toHaveBeenCalled();
    });

    test('should show success when unlock succeeds', async () => {
      const workspace = createMockWorkspace('locked');
      workspace.unlock.mockResolvedValue(succeed(undefined));
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteAdd.mockResolvedValue(succeed('Success'));
      mockPassword.mockResolvedValue('correct-password');

      const cmd = getSubcommand('add');
      await cmd.parseAsync(['-w', '/test/workspace', '-t', 'ingredient'], { from: 'user' });

      expect(mockShowInfo).toHaveBeenCalledWith('Workspace unlocked successfully');
    });
  });

  describe('default action (interactive)', () => {
    test('should execute interactive mode when no subcommand provided', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteInteractive.mockResolvedValue(succeed('Interactive completed'));

      const cmd = createEditCommand();
      await cmd.parseAsync(['-w', '/test/workspace'], { from: 'user' });

      expect(mockExecuteInteractive).toHaveBeenCalledWith(workspace, undefined);
      expect(mockShowSuccess).toHaveBeenCalledWith('Interactive completed');
    });

    test('should exit with error when interactive mode fails', async () => {
      const workspace = createMockWorkspace();
      mockLoadWorkspace.mockResolvedValue(succeed(workspace));
      mockExecuteInteractive.mockResolvedValue(fail('User cancelled'));

      const cmd = createEditCommand();
      await expect(cmd.parseAsync(['-w', '/test/workspace'], { from: 'user' })).rejects.toThrow(
        'process.exit'
      );

      expect(mockShowError).toHaveBeenCalledWith('User cancelled');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });
});
