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
