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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { CryptoUtils } from '@fgv/ts-extras';

import {
  NodePlatformInitializer,
  createNodePlatformInitializer,
  initializeNodePlatform
} from '../../../packlets/workspace';
import {
  DeviceId,
  ExternalLibraryRef,
  IBootstrapSettings,
  IPreferencesSettings,
  IExternalLibraryRefConfig,
  SETTINGS_SCHEMA_VERSION
} from '../../../packlets/settings';
import { CollectionId } from '../../../packlets/common';

describe('NodePlatformInitializer', () => {
  // ============================================================================
  // Test Helpers
  // ============================================================================

  let tmpDir: string;

  /**
   * Creates a temporary directory for each test.
   */
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'choco-test-'));
  });

  /**
   * Cleans up the temporary directory after each test.
   */
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /**
   * Writes a JSON file at the given path within the temp directory.
   */
  function writeJsonFile(relativePath: string, data: unknown): void {
    const fullPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(data, undefined, 2));
  }

  /**
   * Creates a subdirectory under the temp directory.
   */
  function mkDir(relativePath: string): string {
    const fullPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(fullPath, { recursive: true });
    return fullPath;
  }

  const testDeviceId = 'test-device' as unknown as DeviceId;

  const validBootstrapSettings: IBootstrapSettings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    includeBuiltIn: true,
    localStorage: { library: true, userData: true },
    externalLibraries: []
  };

  const validPreferencesSettings: IPreferencesSettings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    defaultTargets: {},
    tools: {
      scaling: { weightUnit: 'g' }
    }
  };

  const validKeystoreFile = {
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

  // ============================================================================
  // Singleton / Factory
  // ============================================================================

  describe('singleton', () => {
    test('instance returns a NodePlatformInitializer', () => {
      expect(NodePlatformInitializer.instance).toBeDefined();
    });

    test('instance is always the same object', () => {
      expect(NodePlatformInitializer.instance).toBe(NodePlatformInitializer.instance);
    });
  });

  describe('createNodePlatformInitializer', () => {
    test('returns the singleton instance', () => {
      const initializer = createNodePlatformInitializer();
      expect(initializer).toBe(NodePlatformInitializer.instance);
    });
  });

  // ============================================================================
  // initialize - with existing settings
  // ============================================================================

  describe('initialize', () => {
    test('succeeds with existing settings files', async () => {
      const userLibPath = mkDir('user-library');
      writeJsonFile('user-library/data/settings/bootstrap.json', validBootstrapSettings);
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.deviceId).toBe(testDeviceId);
        expect(init.bootstrapSettings).toBeDefined();
        expect(init.bootstrapSettings!.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
        expect(init.bootstrapSettings!.includeBuiltIn).toBe(true);
        expect(init.resolvedSettings).toBeDefined();
        expect(init.userLibraryTree).toBeDefined();
        expect(init.cryptoProvider).toBeDefined();
      });
    });

    test('returns default settings when no settings files exist', async () => {
      const userLibPath = mkDir('user-library');

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.deviceId).toBe(testDeviceId);
        expect(init.bootstrapSettings).toBeUndefined();
        expect(init.resolvedSettings).toBeDefined();
        expect(init.resolvedSettings.deviceId).toBe(testDeviceId);
      });
    });

    test('creates user library directory if it does not exist', async () => {
      const userLibPath = path.join(tmpDir, 'new-user-library');
      // Don't create it - the initializer should

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceed();
      expect(fs.existsSync(userLibPath)).toBe(true);
    });

    test('generates device ID from hostname when not provided', async () => {
      const userLibPath = mkDir('user-library');

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath
      });

      expect(result).toSucceedAndSatisfy((init) => {
        // Device ID should be derived from hostname
        const expectedHostname = os
          .hostname()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-');
        expect(init.deviceId).toBe(expectedHostname);
      });
    });

    test('loads keystore file when present', async () => {
      const userLibPath = mkDir('user-library');
      writeJsonFile('user-library/keystore.json', validKeystoreFile);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.keyStoreFile).toBeDefined();
        expect(init.keyStoreFile!.format).toBe(CryptoUtils.KeyStore.KEYSTORE_FORMAT);
      });
    });

    test('keyStoreFile is undefined when no keystore file exists', async () => {
      const userLibPath = mkDir('user-library');

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.keyStoreFile).toBeUndefined();
      });
    });

    test('loads keystore from custom path', async () => {
      const userLibPath = mkDir('user-library');
      const customKeystorePath = path.join(tmpDir, 'custom-keystore.json');
      fs.writeFileSync(customKeystorePath, JSON.stringify(validKeystoreFile));

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId,
        keyStorePath: customKeystorePath
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.keyStoreFile).toBeDefined();
      });
    });

    test('no external libraries when none configured', async () => {
      const userLibPath = mkDir('user-library');
      writeJsonFile('user-library/data/settings/bootstrap.json', {
        ...validBootstrapSettings,
        externalLibraries: []
      });
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.externalLibraries).toHaveLength(0);
      });
    });

    test('resolves external libraries from settings', async () => {
      // Create an external library directory with minimal structure
      const extLibPath = mkDir('ext-library');

      const userLibPath = mkDir('user-library');
      const bootstrapWithExtLib: IBootstrapSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        includeBuiltIn: true,
        localStorage: { library: true, userData: true },
        externalLibraries: [
          {
            name: 'Test External',
            ref: extLibPath as unknown as ExternalLibraryRef,
            load: false
          }
        ]
      };
      writeJsonFile('user-library/data/settings/bootstrap.json', bootstrapWithExtLib);
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.externalLibraries).toHaveLength(1);
        expect(init.externalLibraries[0].name).toBe('Test External');
        expect(init.externalLibraries[0].originalRef).toBe(extLibPath);
        expect(init.externalLibraries[0].load).toBe(false);
      });
    });

    test('resolves mutable external libraries', async () => {
      // Create an external library directory with minimal structure
      const extLibPath = mkDir('ext-library-mutable');

      const userLibPath = mkDir('user-library');
      const bootstrapWithExtLib: IBootstrapSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        includeBuiltIn: true,
        localStorage: { library: true, userData: true },
        externalLibraries: [
          {
            name: 'Mutable External',
            ref: extLibPath as unknown as ExternalLibraryRef,
            load: false,
            mutable: true
          }
        ]
      };
      writeJsonFile('user-library/data/settings/bootstrap.json', bootstrapWithExtLib);
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.externalLibraries).toHaveLength(1);
        expect(init.externalLibraries[0].mutable).toBe(true);
      });
    });

    test('fails when external library path does not exist', async () => {
      const userLibPath = mkDir('user-library');
      const bootstrapWithBadExtLib: IBootstrapSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        includeBuiltIn: true,
        localStorage: { library: true, userData: true },
        externalLibraries: [
          {
            name: 'Missing Lib',
            ref: '/nonexistent/path/to/lib' as unknown as ExternalLibraryRef,
            load: true
          }
        ]
      };
      writeJsonFile('user-library/data/settings/bootstrap.json', bootstrapWithBadExtLib);
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toFailWith(/external library/i);
    });

    test('fails when bootstrap settings file has invalid content', async () => {
      const userLibPath = mkDir('user-library');
      // Write invalid settings (wrong schemaVersion)
      writeJsonFile('user-library/data/settings/bootstrap.json', {
        schemaVersion: 999
      });
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toFailWith(/bootstrap/i);
    });

    test('resolved settings merge bootstrap and preferences', async () => {
      const userLibPath = mkDir('user-library');
      const preferencesWithTargets: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        defaultTargets: {
          fillings: 'user' as CollectionId
        },
        tools: {
          scaling: { weightUnit: 'g' }
        }
      };
      writeJsonFile('user-library/data/settings/bootstrap.json', validBootstrapSettings);
      writeJsonFile('user-library/data/settings/preferences.json', preferencesWithTargets);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.resolvedSettings.deviceId).toBe(testDeviceId);
        expect(init.resolvedSettings.defaultTargets.fillings).toBe('user');
      });
    });
  });

  // ============================================================================
  // initialize - bootstrap settings
  // ============================================================================

  describe('initialize with bootstrap', () => {
    test('loads bootstrap.json when present', async () => {
      const userLibPath = mkDir('user-library');
      writeJsonFile('user-library/data/settings/bootstrap.json', validBootstrapSettings);
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.bootstrapSettings).toBeDefined();
        expect(init.bootstrapSettings!.includeBuiltIn).toBe(true);
      });
    });

    test('bootstrapSettings is undefined when bootstrap.json does not exist', async () => {
      const userLibPath = mkDir('user-library');
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.bootstrapSettings).toBeUndefined();
      });
    });

    test('uses bootstrap externalLibraries for resolution', async () => {
      const extLibPath = mkDir('ext-library-bootstrap');
      const userLibPath = mkDir('user-library');

      const bootstrapWithExtLib: IBootstrapSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        includeBuiltIn: true,
        localStorage: { library: true, userData: true },
        externalLibraries: [
          {
            name: 'Bootstrap External',
            ref: extLibPath as never,
            load: false
          }
        ]
      };
      writeJsonFile('user-library/data/settings/bootstrap.json', bootstrapWithExtLib);
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        expect(init.externalLibraries).toHaveLength(1);
        expect(init.externalLibraries[0].name).toBe('Bootstrap External');
      });
    });

    test('no external libraries resolved when only common.json exists', async () => {
      const extLibPath = mkDir('ext-library-common');
      const userLibPath = mkDir('user-library');

      // Legacy common.json with externalLibraries
      const legacyCommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        externalLibraries: [
          {
            name: 'Common External',
            ref: extLibPath as never,
            load: false
          }
        ],
        defaultTargets: {},
        tools: {
          scaling: { weightUnit: 'g' }
        }
      };
      writeJsonFile('user-library/data/settings/common.json', legacyCommonSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceedAndSatisfy((init) => {
        // No bootstrap.json exists, so bootstrapSettings is undefined
        expect(init.bootstrapSettings).toBeUndefined();
        // External libraries come from bootstrap only, so none are resolved
        // (Migration happens in SettingsManager but doesn't affect external libraries at init time)
        expect(init.externalLibraries).toHaveLength(0);
      });
    });

    test('fails when bootstrap.json has invalid content', async () => {
      const userLibPath = mkDir('user-library');
      writeJsonFile('user-library/data/settings/bootstrap.json', { schemaVersion: 999 });
      writeJsonFile('user-library/data/settings/preferences.json', validPreferencesSettings);

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toFailWith(/bootstrap/i);
    });
  });

  // ============================================================================
  // resolveExternalLibrary
  // ============================================================================

  describe('resolveExternalLibrary', () => {
    test('resolves an existing directory', () => {
      const extLibPath = mkDir('ext-lib');
      const config: IExternalLibraryRefConfig = {
        name: 'Test Lib',
        ref: extLibPath as unknown as ExternalLibraryRef,
        load: true
      };

      const result = NodePlatformInitializer.instance.resolveExternalLibrary(config.ref, config);
      expect(result).toSucceed();
    });

    test('fails for non-existent path', () => {
      const config: IExternalLibraryRefConfig = {
        name: 'Missing',
        ref: '/nonexistent/path' as unknown as ExternalLibraryRef,
        load: true
      };

      expect(NodePlatformInitializer.instance.resolveExternalLibrary(config.ref, config)).toFailWith(
        /does not exist/i
      );
    });

    test('fails when path is a file, not directory', () => {
      const filePath = path.join(tmpDir, 'not-a-dir.txt');
      fs.writeFileSync(filePath, 'not a directory');

      const config: IExternalLibraryRefConfig = {
        name: 'NotADir',
        ref: filePath as unknown as ExternalLibraryRef,
        load: true
      };

      expect(NodePlatformInitializer.instance.resolveExternalLibrary(config.ref, config)).toFailWith(
        /not a directory/i
      );
    });
  });

  // ============================================================================
  // initializeNodePlatform (convenience function)
  // ============================================================================

  describe('initializeNodePlatform', () => {
    test('is equivalent to NodePlatformInitializer.instance.initialize', async () => {
      const userLibPath = mkDir('user-library');

      const result = await initializeNodePlatform({
        userLibraryPath: userLibPath,
        deviceId: testDeviceId
      });

      expect(result).toSucceed();
    });
  });
});
