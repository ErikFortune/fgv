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

import '@fgv/ts-utils-jest';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

import { CryptoUtils } from '@fgv/ts-extras';

import {
  createNodeWorkspace,
  createNodeWorkspaceLegacy,
  createWorkspaceDirectories,
  initializeWorkspace
} from '../../../packlets/workspace';
import { DeviceId } from '../../../packlets/settings';

describe('createNodeWorkspace', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-test-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('creates workspace with single-root layout (default builtin)', async () => {
    const deviceId = 'test-device' as DeviceId;
    initializeWorkspace({ workspacePath: tempDir, deviceId }).orThrow();

    const result = await createNodeWorkspace({ layout: { mode: 'single-root', rootPath: tempDir } });
    expect(result).toSucceedAndSatisfy((workspace) => {
      expect(workspace.state).toBe('no-keystore');
      expect(workspace.isReady).toBe(true);
    });
  });

  test('creates workspace with builtin: false (empty)', async () => {
    const deviceId = 'test-device' as DeviceId;
    initializeWorkspace({ workspacePath: tempDir, deviceId }).orThrow();

    const result = await createNodeWorkspace({
      layout: { mode: 'single-root', rootPath: tempDir },
      builtin: false
    });
    expect(result).toSucceedAndSatisfy((workspace) => {
      expect(workspace.state).toBe('no-keystore');
      expect(workspace.isReady).toBe(true);
    });
  });

  test('created workspace has settings from platform init', async () => {
    const deviceId = 'test-device' as DeviceId;
    initializeWorkspace({ workspacePath: tempDir, deviceId }).orThrow();

    const result = await createNodeWorkspace({ layout: { mode: 'single-root', rootPath: tempDir } });
    expect(result).toSucceedAndSatisfy((workspace) => {
      expect(workspace.settings).toBeDefined();
    });
  });

  test('created workspace has no key store by default', async () => {
    const deviceId = 'test-device' as DeviceId;
    initializeWorkspace({ workspacePath: tempDir, deviceId }).orThrow();

    const result = await createNodeWorkspace({ layout: { mode: 'single-root', rootPath: tempDir } });
    expect(result).toSucceedAndSatisfy((workspace) => {
      expect(workspace.keyStore).toBeUndefined();
    });
  });

  test('ignore-errors mode creates minimal workspace on platform failure', async () => {
    // Create a file to block directory creation
    const blockingFilePath = path.join(tempDir, 'blocking-file');
    fs.writeFileSync(blockingFilePath, 'test');

    const result = await createNodeWorkspace({
      layout: { mode: 'single-root', rootPath: blockingFilePath },
      startupMode: 'ignore-errors',
      builtin: true
    });

    expect(result).toSucceedAndSatisfy((workspace) => {
      // Workspace should be created successfully despite platform failure
      expect(workspace.state).toBe('no-keystore');
      expect(workspace.isReady).toBe(true);

      // Should have built-in data
      expect(workspace.data).toBeDefined();

      // Should not have settings (platform init failed)
      expect(workspace.settings).toBeUndefined();

      // Should not have key store (no platform init)
      expect(workspace.keyStore).toBeUndefined();
    });
  });

  test('fail-on-error mode rejects workspace on platform failure', async () => {
    // Create a file to block directory creation
    const blockingFilePath = path.join(tempDir, 'blocking-file-2');
    fs.writeFileSync(blockingFilePath, 'test');

    const result = await createNodeWorkspace({
      layout: { mode: 'single-root', rootPath: blockingFilePath },
      startupMode: 'fail-on-error'
    });

    expect(result).toFailWith(/platform initialization failed/i);
  });

  test('creates workspace with dual-root layout', async () => {
    const installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-install-'));
    const libDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-lib-'));
    try {
      const deviceId = 'test-device' as DeviceId;
      initializeWorkspace({ workspacePath: installDir, deviceId }).orThrow();
      createWorkspaceDirectories(libDir).orThrow();

      const result = await createNodeWorkspace({
        layout: {
          mode: 'dual-root',
          installationPath: installDir,
          libraryPath: libDir
        }
      });
      expect(result).toSucceedAndSatisfy((workspace) => {
        expect(workspace.state).toBe('no-keystore');
        expect(workspace.isReady).toBe(true);
        expect(workspace.settings).toBeDefined();
      });
    } finally {
      fs.rmSync(installDir, { recursive: true, force: true });
      fs.rmSync(libDir, { recursive: true, force: true });
    }
  });

  test('creates workspace with dual-root layout and read-only library', async () => {
    const installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-install-'));
    const libDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-lib-'));
    try {
      const deviceId = 'test-device' as DeviceId;
      initializeWorkspace({ workspacePath: installDir, deviceId }).orThrow();
      createWorkspaceDirectories(libDir).orThrow();

      const result = await createNodeWorkspace({
        layout: {
          mode: 'dual-root',
          installationPath: installDir,
          libraryPath: libDir,
          libraryReadOnly: true
        }
      });
      expect(result).toSucceedAndSatisfy((workspace) => {
        expect(workspace.state).toBe('no-keystore');
        expect(workspace.isReady).toBe(true);
        expect(workspace.settings).toBeDefined();
      });
    } finally {
      fs.rmSync(installDir, { recursive: true, force: true });
      fs.rmSync(libDir, { recursive: true, force: true });
    }
  });

  test('creates workspace with multi-root layout', async () => {
    const installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-install-'));
    const libDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-lib1-'));
    const libDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-lib2-'));
    try {
      const deviceId = 'test-device' as DeviceId;
      initializeWorkspace({ workspacePath: installDir, deviceId }).orThrow();
      createWorkspaceDirectories(libDir1).orThrow();
      createWorkspaceDirectories(libDir2).orThrow();

      const result = await createNodeWorkspace({
        layout: {
          mode: 'multi-root',
          installationPath: installDir,
          libraryPaths: [{ path: libDir1 }, { path: libDir2, readOnly: true }]
        }
      });
      expect(result).toSucceedAndSatisfy((workspace) => {
        expect(workspace.state).toBe('no-keystore');
        expect(workspace.isReady).toBe(true);
        expect(workspace.settings).toBeDefined();
      });
    } finally {
      fs.rmSync(installDir, { recursive: true, force: true });
      fs.rmSync(libDir1, { recursive: true, force: true });
      fs.rmSync(libDir2, { recursive: true, force: true });
    }
  });

  test('dual-root fails when library directory is empty (no data structure)', async () => {
    const installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-install-'));
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-empty-'));
    try {
      const deviceId = 'test-device' as DeviceId;
      initializeWorkspace({ workspacePath: installDir, deviceId }).orThrow();

      const result = await createNodeWorkspace({
        layout: {
          mode: 'dual-root',
          installationPath: installDir,
          libraryPath: emptyDir
        },
        startupMode: 'fail-on-error'
      });
      expect(result).toFailWith(/directory not found/i);
    } finally {
      fs.rmSync(installDir, { recursive: true, force: true });
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  test('multi-root fails when any library directory is empty', async () => {
    const installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-install-'));
    const libDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-lib-'));
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-empty-'));
    try {
      const deviceId = 'test-device' as DeviceId;
      initializeWorkspace({ workspacePath: installDir, deviceId }).orThrow();
      createWorkspaceDirectories(libDir).orThrow();

      const result = await createNodeWorkspace({
        layout: {
          mode: 'multi-root',
          installationPath: installDir,
          libraryPaths: [{ path: libDir }, { path: emptyDir }]
        },
        startupMode: 'fail-on-error'
      });
      expect(result).toFailWith(/directory not found/i);
    } finally {
      fs.rmSync(installDir, { recursive: true, force: true });
      fs.rmSync(libDir, { recursive: true, force: true });
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });
});

describe('createNodeWorkspaceLegacy', () => {
  test('creates workspace with no params (default builtin)', () => {
    expect(createNodeWorkspaceLegacy()).toSucceedAndSatisfy((workspace) => {
      expect(workspace.state).toBe('no-keystore');
      expect(workspace.isReady).toBe(true);
    });
  });

  test('creates workspace with builtin: false (empty)', () => {
    expect(createNodeWorkspaceLegacy({ builtin: false })).toSucceedAndSatisfy((workspace) => {
      expect(workspace.state).toBe('no-keystore');
      expect(workspace.isReady).toBe(true);
    });
  });

  test('created workspace has no settings', () => {
    expect(createNodeWorkspaceLegacy()).toSucceedAndSatisfy((workspace) => {
      expect(workspace.settings).toBeUndefined();
    });
  });

  test('created workspace has no key store', () => {
    expect(createNodeWorkspaceLegacy()).toSucceedAndSatisfy((workspace) => {
      expect(workspace.keyStore).toBeUndefined();
    });
  });

  test('creates workspace with keyStoreFile parameter', () => {
    const dummyKeyStoreFile: CryptoUtils.KeyStore.IKeyStoreFile = {
      format: CryptoUtils.KeyStore.KEYSTORE_FORMAT,
      algorithm: CryptoUtils.Constants.DEFAULT_ALGORITHM,
      iv: 'AAAAAAAAAAAAAAAA',
      authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
      encryptedData: 'SGVsbG8gV29ybGQ=',
      keyDerivation: {
        kdf: 'pbkdf2',
        salt: 'AAAAAAAAAAAAAAAAAAAAAA==',
        iterations: 600000
      }
    };

    expect(createNodeWorkspaceLegacy({ keyStoreFile: dummyKeyStoreFile })).toSucceedAndSatisfy(
      (workspace) => {
        expect(workspace.state).toBe('locked');
        expect(workspace.isReady).toBe(false);
      }
    );
  });
});
