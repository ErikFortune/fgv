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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import '@fgv/ts-utils-jest';

import {
  createWorkspaceDirectories,
  writeBootstrapSettings,
  writePreferencesSettings,
  initializeWorkspace,
  IWorkspaceInitParams
} from '../../../packlets/workspace';
import {
  createDefaultBootstrapSettings,
  createDefaultPreferencesSettings,
  DeviceId,
  IBootstrapSettings,
  IPreferencesSettings
} from '../../../packlets/settings';
import { LibraryPaths } from '../../../packlets/library-data';

describe('workspaceInit', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-init-test-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ============================================================================
  // createWorkspaceDirectories
  // ============================================================================

  describe('createWorkspaceDirectories', () => {
    test('creates all expected directories', () => {
      expect(createWorkspaceDirectories(tempDir)).toSucceed();

      // Verify all directories exist
      const expectedDirs = [
        LibraryPaths.settings,
        LibraryPaths.ingredients,
        LibraryPaths.fillings,
        LibraryPaths.confections,
        LibraryPaths.molds,
        LibraryPaths.procedures,
        LibraryPaths.tasks,
        LibraryPaths.sessions,
        LibraryPaths.journals
      ];

      for (const dir of expectedDirs) {
        const fullPath = path.join(tempDir, dir);
        expect(fs.existsSync(fullPath)).toBe(true);
        expect(fs.statSync(fullPath).isDirectory()).toBe(true);
      }
    });

    test('is idempotent - succeeds when called on existing directories', () => {
      // First call
      expect(createWorkspaceDirectories(tempDir)).toSucceed();

      // Second call should also succeed
      expect(createWorkspaceDirectories(tempDir)).toSucceed();

      // Directories should still exist
      expect(fs.existsSync(path.join(tempDir, LibraryPaths.settings))).toBe(true);
    });

    test('creates nested directories recursively', () => {
      expect(createWorkspaceDirectories(tempDir)).toSucceed();

      // Check that nested paths like 'data/settings' are created
      const settingsPath = path.join(tempDir, LibraryPaths.settings);
      expect(fs.existsSync(settingsPath)).toBe(true);

      // Verify parent directory also exists
      const dataPath = path.join(tempDir, 'data');
      expect(fs.existsSync(dataPath)).toBe(true);
    });

    test('fails when workspace path points to a file', () => {
      // Create a file where we want a directory
      const filePath = path.join(tempDir, 'not-a-directory');
      fs.writeFileSync(filePath, 'test content');

      expect(createWorkspaceDirectories(filePath)).toFailWith(/failed to create workspace directories/i);
    });

    test('fails with invalid path', () => {
      // Use /dev/null as a path that can't have subdirectories
      const invalidPath = path.join('/dev/null', 'invalid');
      expect(createWorkspaceDirectories(invalidPath)).toFailWith(/failed to create workspace directories/i);
    });
  });

  // ============================================================================
  // writeBootstrapSettings
  // ============================================================================

  describe('writeBootstrapSettings', () => {
    let bootstrapSettings: IBootstrapSettings;

    beforeEach(() => {
      createWorkspaceDirectories(tempDir).orThrow();
      bootstrapSettings = createDefaultBootstrapSettings();
    });

    test('writes valid bootstrap settings JSON to correct path', () => {
      expect(writeBootstrapSettings(tempDir, bootstrapSettings)).toSucceed();

      const settingsPath = path.join(tempDir, LibraryPaths.settings, LibraryPaths.settingsBootstrap);
      expect(fs.existsSync(settingsPath)).toBe(true);

      const content = fs.readFileSync(settingsPath, 'utf8');
      const parsed = JSON.parse(content) as IBootstrapSettings;
      expect(parsed.schemaVersion).toBe(bootstrapSettings.schemaVersion);
      expect(parsed.includeBuiltIn).toBe(true);
    });

    test('file contains properly formatted JSON with indentation', () => {
      expect(writeBootstrapSettings(tempDir, bootstrapSettings)).toSucceed();

      const settingsPath = path.join(tempDir, LibraryPaths.settings, LibraryPaths.settingsBootstrap);
      const content = fs.readFileSync(settingsPath, 'utf8');
      expect(content).toContain('\n  ');
    });

    test('fails when settings directory does not exist', () => {
      const newTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-dirs-test-'));
      try {
        expect(writeBootstrapSettings(newTempDir, bootstrapSettings)).toFailWith(
          /failed to write bootstrap settings/i
        );
      } finally {
        fs.rmSync(newTempDir, { recursive: true, force: true });
      }
    });
  });

  // ============================================================================
  // writePreferencesSettings
  // ============================================================================

  describe('writePreferencesSettings', () => {
    let preferencesSettings: IPreferencesSettings;

    beforeEach(() => {
      createWorkspaceDirectories(tempDir).orThrow();
      preferencesSettings = createDefaultPreferencesSettings();
    });

    test('writes valid preferences settings JSON to correct path', () => {
      expect(writePreferencesSettings(tempDir, preferencesSettings)).toSucceed();

      const settingsPath = path.join(tempDir, LibraryPaths.settings, LibraryPaths.settingsPreferences);
      expect(fs.existsSync(settingsPath)).toBe(true);

      const content = fs.readFileSync(settingsPath, 'utf8');
      const parsed = JSON.parse(content) as IPreferencesSettings;
      expect(parsed.schemaVersion).toBe(preferencesSettings.schemaVersion);
    });

    test('file contains properly formatted JSON with indentation', () => {
      expect(writePreferencesSettings(tempDir, preferencesSettings)).toSucceed();

      const settingsPath = path.join(tempDir, LibraryPaths.settings, LibraryPaths.settingsPreferences);
      const content = fs.readFileSync(settingsPath, 'utf8');
      expect(content).toContain('\n  ');
    });

    test('fails when settings directory does not exist', () => {
      const newTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-dirs-test-'));
      try {
        expect(writePreferencesSettings(newTempDir, preferencesSettings)).toFailWith(
          /failed to write preferences settings/i
        );
      } finally {
        fs.rmSync(newTempDir, { recursive: true, force: true });
      }
    });
  });

  // ============================================================================
  // initializeWorkspace
  // ============================================================================

  describe('initializeWorkspace', () => {
    const deviceId = 'test-workspace-device' as unknown as DeviceId;
    const deviceName = 'Test Workspace Device';

    test('creates full workspace with directories and settings files', () => {
      const params: IWorkspaceInitParams = {
        workspacePath: tempDir,
        deviceId,
        deviceName
      };

      expect(initializeWorkspace(params)).toSucceedAndSatisfy((result) => {
        // Verify result structure
        expect(result.workspacePath).toBe(tempDir);
        expect(result.bootstrapSettings).toBeDefined();
        expect(result.preferencesSettings).toBeDefined();
        expect(result.bootstrapSettings.schemaVersion).toBe(1);
        expect(result.preferencesSettings.schemaVersion).toBe(1);
        expect(result.bootstrapSettings.deviceName).toBe(deviceName);

        // Verify directories exist
        expect(fs.existsSync(path.join(tempDir, LibraryPaths.settings))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, LibraryPaths.ingredients))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, LibraryPaths.confections))).toBe(true);

        // Verify settings files exist
        const bootstrapPath = path.join(tempDir, LibraryPaths.settings, LibraryPaths.settingsBootstrap);
        const preferencesPath = path.join(tempDir, LibraryPaths.settings, LibraryPaths.settingsPreferences);
        expect(fs.existsSync(bootstrapPath)).toBe(true);
        expect(fs.existsSync(preferencesPath)).toBe(true);
      });
    });

    test('returns correct IWorkspaceInitResult with settings', () => {
      const params: IWorkspaceInitParams = {
        workspacePath: tempDir,
        deviceId,
        deviceName
      };

      expect(initializeWorkspace(params)).toSucceedAndSatisfy((result) => {
        // Verify bootstrap settings
        expect(result.bootstrapSettings.schemaVersion).toBe(1);
        expect(result.bootstrapSettings.includeBuiltIn).toBe(true);
        expect(result.bootstrapSettings.deviceName).toBe(deviceName);

        // Verify preferences settings
        expect(result.preferencesSettings.schemaVersion).toBe(1);
      });
    });

    test('settings files are correctly formatted JSON on disk', () => {
      const params: IWorkspaceInitParams = {
        workspacePath: tempDir,
        deviceId
      };

      expect(initializeWorkspace(params)).toSucceed();

      // Read and parse bootstrap settings
      const bootstrapPath = path.join(tempDir, LibraryPaths.settings, LibraryPaths.settingsBootstrap);
      const bootstrapContent = fs.readFileSync(bootstrapPath, 'utf8');
      const bootstrapParsed = JSON.parse(bootstrapContent) as IBootstrapSettings;
      expect(bootstrapParsed.schemaVersion).toBe(1);
      expect(bootstrapParsed.includeBuiltIn).toBe(true);

      // Read and parse preferences settings
      const preferencesPath = path.join(tempDir, LibraryPaths.settings, LibraryPaths.settingsPreferences);
      const preferencesContent = fs.readFileSync(preferencesPath, 'utf8');
      const preferencesParsed = JSON.parse(preferencesContent) as IPreferencesSettings;
      expect(preferencesParsed.schemaVersion).toBe(1);
    });

    test('works with minimal params (no device name)', () => {
      const params: IWorkspaceInitParams = {
        workspacePath: tempDir,
        deviceId
      };

      expect(initializeWorkspace(params)).toSucceedAndSatisfy((result) => {
        expect(result.bootstrapSettings.deviceName).toBeUndefined();
      });
    });

    test('creates workspace in nested path', () => {
      const nestedPath = path.join(tempDir, 'nested', 'workspace');
      const params: IWorkspaceInitParams = {
        workspacePath: nestedPath,
        deviceId
      };

      expect(initializeWorkspace(params)).toSucceedAndSatisfy((result) => {
        expect(result.workspacePath).toBe(nestedPath);
        expect(fs.existsSync(path.join(nestedPath, LibraryPaths.settings))).toBe(true);
      });
    });

    test('fails when directory creation fails', () => {
      // Try to create workspace under a file instead of directory
      const filePath = path.join(tempDir, 'not-a-directory');
      fs.writeFileSync(filePath, 'test');

      const params: IWorkspaceInitParams = {
        workspacePath: filePath,
        deviceId
      };

      expect(initializeWorkspace(params)).toFailWith(/failed to create workspace directories/i);
    });

    test('fails gracefully if bootstrap settings write fails', () => {
      // Create directories but make settings directory read-only
      createWorkspaceDirectories(tempDir).orThrow();
      const settingsDir = path.join(tempDir, LibraryPaths.settings);
      fs.chmodSync(settingsDir, 0o444); // Read-only

      const params: IWorkspaceInitParams = {
        workspacePath: tempDir,
        deviceId
      };

      try {
        // Bootstrap is the first settings file written, so it fails first
        expect(initializeWorkspace(params)).toFailWith(/failed to write bootstrap settings/i);
      } finally {
        fs.chmodSync(settingsDir, 0o755);
      }
    });

    test('is idempotent - can initialize same workspace multiple times', () => {
      const params: IWorkspaceInitParams = {
        workspacePath: tempDir,
        deviceId
      };

      // First initialization
      expect(initializeWorkspace(params)).toSucceed();

      // Second initialization should also succeed
      expect(initializeWorkspace(params)).toSucceed();
    });
  });
});
