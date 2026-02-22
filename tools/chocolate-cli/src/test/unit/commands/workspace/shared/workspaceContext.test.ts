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

// Mock @fgv/ts-chocolate createNodeWorkspace
const mockCreateNodeWorkspace = jest.fn();
jest.mock('@fgv/ts-chocolate', () => {
  const actual = jest.requireActual('@fgv/ts-chocolate');
  return {
    ...actual,
    createNodeWorkspace: mockCreateNodeWorkspace
  };
});

// Mock @inquirer/prompts password
const mockPassword = jest.fn();
jest.mock('@inquirer/prompts', () => ({
  password: mockPassword
}));

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';
import { WorkspaceState, IWorkspace } from '@fgv/ts-chocolate';

import {
  loadWorkspace,
  unlockWorkspace,
  loadAndUnlockWorkspace,
  getCachedWorkspace,
  setCachedWorkspace,
  clearCachedWorkspace
} from '../../../../../commands/workspace/shared/workspaceContext';

/**
 * Creates a mock IWorkspace with the specified state.
 */
function createMockWorkspace(state: WorkspaceState): IWorkspace {
  return {
    state,
    isReady: state !== 'locked',
    data: {} as IWorkspace['data'],
    userData: {} as IWorkspace['userData'],
    keyStore: undefined,
    settings: undefined,
    unlock: jest.fn(),
    lock: jest.fn()
  };
}

describe('workspaceContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCachedWorkspace();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // loadWorkspace
  // ============================================================================

  describe('loadWorkspace', () => {
    test('loads a workspace with default options', async () => {
      const mockWs = createMockWorkspace('no-keystore');
      mockCreateNodeWorkspace.mockResolvedValue(succeed(mockWs));

      const result = await loadWorkspace({ workspacePath: '/test/workspace' });
      expect(result).toSucceedWith(mockWs);

      expect(mockCreateNodeWorkspace).toHaveBeenCalledWith({
        layout: { mode: 'single-root', rootPath: '/test/workspace' },
        builtin: true,
        preWarm: false,
        startupMode: 'fail-on-error'
      });
    });

    test('passes through custom options', async () => {
      const mockWs = createMockWorkspace('locked');
      mockCreateNodeWorkspace.mockResolvedValue(succeed(mockWs));

      await loadWorkspace({
        workspacePath: '/custom/path',
        builtin: false,
        preWarm: true,
        startupMode: 'ignore-errors'
      });

      expect(mockCreateNodeWorkspace).toHaveBeenCalledWith({
        layout: { mode: 'single-root', rootPath: '/custom/path' },
        builtin: false,
        preWarm: true,
        startupMode: 'ignore-errors'
      });
    });

    test('propagates failure from createNodeWorkspace', async () => {
      mockCreateNodeWorkspace.mockResolvedValue(fail('workspace load error'));

      const result = await loadWorkspace({ workspacePath: '/bad/path' });
      expect(result).toFailWith(/workspace load error/i);
    });
  });

  // ============================================================================
  // unlockWorkspace
  // ============================================================================

  describe('unlockWorkspace', () => {
    test('returns workspace directly for no-keystore state', async () => {
      const mockWs = createMockWorkspace('no-keystore');

      const result = await unlockWorkspace({ workspace: mockWs });
      expect(result).toSucceedWith(mockWs);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('no keystore'));
    });

    test('returns workspace directly for no-keystore state (quiet)', async () => {
      const mockWs = createMockWorkspace('no-keystore');

      const result = await unlockWorkspace({ workspace: mockWs, quiet: true });
      expect(result).toSucceedWith(mockWs);
      expect(console.log).not.toHaveBeenCalled();
    });

    test('returns workspace directly for already-unlocked state', async () => {
      const mockWs = createMockWorkspace('unlocked');

      const result = await unlockWorkspace({ workspace: mockWs });
      expect(result).toSucceedWith(mockWs);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('already unlocked'));
    });

    test('returns workspace directly for already-unlocked state (quiet)', async () => {
      const mockWs = createMockWorkspace('unlocked');

      const result = await unlockWorkspace({ workspace: mockWs, quiet: true });
      expect(result).toSucceedWith(mockWs);
      expect(console.log).not.toHaveBeenCalled();
    });

    test('unlocks locked workspace with provided password', async () => {
      const mockWs = createMockWorkspace('locked');
      const unlockedWs = createMockWorkspace('unlocked');
      (mockWs.unlock as jest.Mock).mockResolvedValue(succeed(unlockedWs));

      const result = await unlockWorkspace({ workspace: mockWs, password: 'secret123' });
      expect(result).toSucceedWith(unlockedWs);
      expect(mockWs.unlock).toHaveBeenCalledWith('secret123');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('unlocked successfully'));
    });

    test('unlocks locked workspace with provided password (quiet)', async () => {
      const mockWs = createMockWorkspace('locked');
      const unlockedWs = createMockWorkspace('unlocked');
      (mockWs.unlock as jest.Mock).mockResolvedValue(succeed(unlockedWs));

      const result = await unlockWorkspace({ workspace: mockWs, password: 'secret', quiet: true });
      expect(result).toSucceedWith(unlockedWs);
      expect(console.log).not.toHaveBeenCalled();
    });

    test('prompts for password when not provided', async () => {
      const mockWs = createMockWorkspace('locked');
      const unlockedWs = createMockWorkspace('unlocked');
      (mockWs.unlock as jest.Mock).mockResolvedValue(succeed(unlockedWs));
      mockPassword.mockResolvedValue('prompted-password');

      const result = await unlockWorkspace({ workspace: mockWs });
      expect(result).toSucceedWith(unlockedWs);
      expect(mockPassword).toHaveBeenCalledWith({ message: 'Enter workspace password:' });
      expect(mockWs.unlock).toHaveBeenCalledWith('prompted-password');
    });

    test('fails when unlock returns failure', async () => {
      const mockWs = createMockWorkspace('locked');
      (mockWs.unlock as jest.Mock).mockResolvedValue(fail('wrong password'));

      const result = await unlockWorkspace({ workspace: mockWs, password: 'bad' });
      expect(result).toFailWith(/failed to unlock workspace.*wrong password/i);
    });
  });

  // ============================================================================
  // loadAndUnlockWorkspace
  // ============================================================================

  describe('loadAndUnlockWorkspace', () => {
    test('loads and returns workspace when not locked', async () => {
      const mockWs = createMockWorkspace('no-keystore');
      mockCreateNodeWorkspace.mockResolvedValue(succeed(mockWs));

      const result = await loadAndUnlockWorkspace({ workspacePath: '/test/ws' });
      expect(result).toSucceedWith(mockWs);
    });

    test('loads and returns already-unlocked workspace without re-unlocking', async () => {
      const mockWs = createMockWorkspace('unlocked');
      mockCreateNodeWorkspace.mockResolvedValue(succeed(mockWs));

      const result = await loadAndUnlockWorkspace({ workspacePath: '/test/ws' });
      expect(result).toSucceedWith(mockWs);
      expect(mockWs.unlock).not.toHaveBeenCalled();
    });

    test('loads and unlocks locked workspace', async () => {
      const lockedWs = createMockWorkspace('locked');
      const unlockedWs = createMockWorkspace('unlocked');
      mockCreateNodeWorkspace.mockResolvedValue(succeed(lockedWs));
      (lockedWs.unlock as jest.Mock).mockResolvedValue(succeed(unlockedWs));

      const result = await loadAndUnlockWorkspace({
        workspacePath: '/test/ws',
        password: 'secret'
      });
      expect(result).toSucceedWith(unlockedWs);
    });

    test('propagates load failure', async () => {
      mockCreateNodeWorkspace.mockResolvedValue(fail('load failed'));

      const result = await loadAndUnlockWorkspace({ workspacePath: '/bad/path' });
      expect(result).toFailWith(/load failed/i);
    });

    test('propagates unlock failure', async () => {
      const lockedWs = createMockWorkspace('locked');
      mockCreateNodeWorkspace.mockResolvedValue(succeed(lockedWs));
      (lockedWs.unlock as jest.Mock).mockResolvedValue(fail('bad password'));

      const result = await loadAndUnlockWorkspace({
        workspacePath: '/test/ws',
        password: 'wrong'
      });
      expect(result).toFailWith(/failed to unlock/i);
    });
  });

  // ============================================================================
  // Workspace Cache
  // ============================================================================

  describe('workspace cache', () => {
    test('getCachedWorkspace returns undefined initially', () => {
      expect(getCachedWorkspace()).toBeUndefined();
    });

    test('setCachedWorkspace stores workspace', () => {
      const mockWs = createMockWorkspace('unlocked');
      setCachedWorkspace(mockWs);
      expect(getCachedWorkspace()).toBe(mockWs);
    });

    test('setCachedWorkspace can set to undefined', () => {
      const mockWs = createMockWorkspace('unlocked');
      setCachedWorkspace(mockWs);
      setCachedWorkspace(undefined);
      expect(getCachedWorkspace()).toBeUndefined();
    });

    test('clearCachedWorkspace clears stored workspace', () => {
      const mockWs = createMockWorkspace('unlocked');
      setCachedWorkspace(mockWs);
      clearCachedWorkspace();
      expect(getCachedWorkspace()).toBeUndefined();
    });
  });
});
