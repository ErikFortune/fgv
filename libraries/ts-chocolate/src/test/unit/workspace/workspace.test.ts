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

import { CryptoUtils } from '@fgv/ts-extras';
import { FileTree } from '@fgv/ts-json-base';

import {
  BaseIngredientId,
  BaseFillingId,
  Measurement,
  IngredientId,
  FillingId,
  ConfectionId,
  Percentage,
  FillingName,
  FillingRecipeVariationSpec,
  CollectionId,
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  SlotId,
  Model as CommonModel
} from '../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary,
  IFillingRecipeEntity,
  FillingsLibrary,
  ConfectionsLibrary,
  Confections,
  JournalLibrary
} from '../../../packlets/entities';
import { Workspace } from '../../../packlets/workspace';
import {
  SettingsManager,
  DeviceId,
  SETTINGS_SCHEMA_VERSION,
  IBootstrapSettings,
  IPreferencesSettings
} from '../../../packlets/settings';

describe('Workspace', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testChars: IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const creamChars: IGanacheCharacteristics = {
    cacaoFat: 0 as Percentage,
    sugar: 3 as Percentage,
    milkFat: 38 as Percentage,
    water: 55 as Percentage,
    solids: 4 as Percentage,
    otherFats: 0 as Percentage
  };

  const darkChocolate: IChocolateIngredientEntity = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars
  };

  const testRecipe: IFillingRecipeEntity = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache recipe',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Original recipe' }] as CommonModel.ICategorizedNote[],
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  const rolledTruffleEntity: Confections.RolledTruffleRecipeEntity = {
    baseId: 'test-rolled-truffle' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Rolled Truffle' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 40, unit: 'pieces', weightPerPiece: 15 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ]
      }
    ]
  };

  let ingredients: IngredientsLibrary;
  let fillings: FillingsLibrary;
  let confections: ConfectionsLibrary;

  beforeEach(() => {
    ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-chocolate': darkChocolate,
            cream
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    fillings = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-ganache': testRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-rolled-truffle': rolledTruffleEntity
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();
  });

  // ============================================================================
  // Scenario: New/default workspace
  // ============================================================================

  describe('new/default workspace', () => {
    test('creates successfully with no params', () => {
      expect(Workspace.create()).toSucceed();
    });

    test('state is no-keystore', () => {
      expect(Workspace.create()).toSucceedAndSatisfy((ws) => {
        expect(ws.state).toBe('no-keystore');
      });
    });

    test('isReady is true', () => {
      expect(Workspace.create()).toSucceedAndSatisfy((ws) => {
        expect(ws.isReady).toBe(true);
      });
    });

    test('settings is undefined', () => {
      expect(Workspace.create()).toSucceedAndSatisfy((ws) => {
        expect(ws.settings).toBeUndefined();
      });
    });

    test('keyStore is undefined', () => {
      expect(Workspace.create()).toSucceedAndSatisfy((ws) => {
        expect(ws.keyStore).toBeUndefined();
      });
    });

    test('data accessor is available', () => {
      expect(Workspace.create()).toSucceedAndSatisfy((ws) => {
        expect(ws.data).toBeDefined();
      });
    });

    test('creates default logger when not provided', () => {
      expect(Workspace.create({ builtin: false })).toSucceedAndSatisfy((ws) => {
        expect(ws).toBeDefined();
      });
    });

    test('configName is undefined when not provided', () => {
      expect(Workspace.create()).toSucceedAndSatisfy((ws) => {
        expect(ws.configName).toBeUndefined();
      });
    });

    test('stores configName when provided', () => {
      expect(Workspace.create({ builtin: false, configName: 'debug' })).toSucceedAndSatisfy((ws) => {
        expect(ws.configName).toBe('debug');
      });
    });
  });

  // ============================================================================
  // Scenario: Empty library
  // ============================================================================

  describe('empty library', () => {
    test('creates successfully with builtin: false', () => {
      expect(Workspace.create({ builtin: false })).toSucceed();
    });

    test('data accessors are available', () => {
      expect(Workspace.create({ builtin: false })).toSucceedAndSatisfy((ws) => {
        expect(ws.data).toBeDefined();
        expect(ws.data.ingredients).toBeDefined();
        expect(ws.data.fillings).toBeDefined();
        expect(ws.data.confections).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Scenario: Library with data
  // ============================================================================

  describe('library with data', () => {
    test('creates successfully with pre-built libraries', () => {
      expect(
        Workspace.create({
          builtin: false,
          libraries: { ingredients, fillings, confections }
        })
      ).toSucceed();
    });

    test('can look up loaded ingredients', () => {
      expect(
        Workspace.create({
          builtin: false,
          libraries: { ingredients, fillings, confections }
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.data.ingredients.get('test.dark-chocolate' as IngredientId)).toSucceed();
        expect(ws.data.ingredients.get('test.cream' as IngredientId)).toSucceed();
      });
    });

    test('can look up loaded fillings', () => {
      expect(
        Workspace.create({
          builtin: false,
          libraries: { ingredients, fillings, confections }
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.data.fillings.get('test.test-ganache' as FillingId)).toSucceed();
      });
    });

    test('can look up loaded confections', () => {
      expect(
        Workspace.create({
          builtin: false,
          libraries: { ingredients, fillings, confections }
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.data.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceed();
      });
    });
  });

  // ============================================================================
  // Scenario: Library with user data (journals)
  // ============================================================================

  describe('library with user data', () => {
    test('creates successfully with journals', () => {
      const journals = JournalLibrary.create({ builtin: false }).orThrow();
      expect(
        Workspace.create({
          builtin: false,
          libraries: { ingredients, fillings, confections },
          journals
        })
      ).toSucceed();
    });

    test('userData accessor works (lazy creation)', () => {
      const journals = JournalLibrary.create({ builtin: false }).orThrow();
      expect(
        Workspace.create({
          builtin: false,
          libraries: { ingredients, fillings, confections },
          journals
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.userData).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Scenario: State management (no key store)
  // ============================================================================

  describe('state management (no key store)', () => {
    test('lock() fails with no key store configured', () => {
      const ws = Workspace.create({ builtin: false }).orThrow();
      expect(ws.lock()).toFailWith(/no key store configured/i);
    });

    test('unlock() fails with no key store configured', async () => {
      const ws = Workspace.create({ builtin: false }).orThrow();
      const result = await ws.unlock('password');
      expect(result).toFailWith(/no key store configured/i);
    });
  });

  // ============================================================================
  // Scenario: createWithSettings
  // ============================================================================

  describe('createWithSettings', () => {
    function createSettingsFileTree(): FileTree.IFileTreeDirectoryItem {
      const bootstrapSettings: IBootstrapSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        includeBuiltIn: true,
        localStorage: { library: true, userData: true },
        externalLibraries: []
      };
      const preferencesSettings: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/settings/bootstrap.json', contents: bootstrapSettings },
        { path: '/library/data/settings/preferences.json', contents: preferencesSettings }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      return tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
    }

    test('creates workspace with settings manager', () => {
      const fileTree = createSettingsFileTree();
      const testDeviceId = 'test-device' as unknown as DeviceId;
      const settings = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        Workspace.createWithSettings({
          builtin: false,
          settings
        })
      ).toSucceed();
    });

    test('settings accessor returns the provided settings manager', () => {
      const fileTree = createSettingsFileTree();
      const testDeviceId = 'test-device' as unknown as DeviceId;
      const settings = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        Workspace.createWithSettings({
          builtin: false,
          settings
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.settings).toBe(settings);
      });
    });

    test('workspace with settings still has no-keystore state', () => {
      const fileTree = createSettingsFileTree();
      const testDeviceId = 'test-device' as unknown as DeviceId;
      const settings = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        Workspace.createWithSettings({
          builtin: false,
          settings
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.state).toBe('no-keystore');
        expect(ws.isReady).toBe(true);
      });
    });

    test('workspace with settings and libraries', () => {
      const fileTree = createSettingsFileTree();
      const testDeviceId = 'test-device' as unknown as DeviceId;
      const settings = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        Workspace.createWithSettings({
          builtin: false,
          libraries: { ingredients, fillings, confections },
          settings
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.settings).toBe(settings);
        expect(ws.data.ingredients.get('test.dark-chocolate' as IngredientId)).toSucceed();
      });
    });

    test('createWithSettings with new keyStore', () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;
      const fileTree = createSettingsFileTree();
      const testDeviceId = 'test-device' as unknown as DeviceId;
      const settings = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        Workspace.createWithSettings({
          builtin: false,
          settings,
          keyStore: { cryptoProvider }
        })
      ).toSucceedAndSatisfy((ws) => {
        // New (uninitialized) keystore reports 'no-keystore' state
        expect(ws.state).toBe('no-keystore');
        expect(ws.settings).toBe(settings);
        expect(ws.keyStore).toBeDefined();
      });
    });

    test('createWithSettings creates default logger when not provided', () => {
      const fileTree = createSettingsFileTree();
      const testDeviceId = 'test-device' as unknown as DeviceId;
      const settings = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        Workspace.createWithSettings({
          builtin: false,
          settings
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Scenario: KeyStore creation and lock/unlock
  // ============================================================================

  describe('keyStore creation and lifecycle', () => {
    test('creates workspace with new keyStore', () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;
      expect(
        Workspace.create({
          builtin: false,
          keyStore: { cryptoProvider }
        })
      ).toSucceedAndSatisfy((ws) => {
        // New (uninitialized) keystore reports 'no-keystore' state
        expect(ws.state).toBe('no-keystore');
        expect(ws.keyStore).toBeDefined();
        expect(ws.isReady).toBe(true);
      });
    });

    test('lock when new keystore returns success', () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;
      const ws = Workspace.create({
        builtin: false,
        keyStore: { cryptoProvider }
      }).orThrow();

      // New keystore is not unlocked, so lock is a no-op success
      expect(ws.lock()).toSucceedAndSatisfy((locked) => {
        expect(locked.state).toBe('no-keystore');
      });
    });

    test('unlock with saved and reopened keyStore', async () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;

      // Create, initialize, and save a keyStore
      const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const savedFile = (await keyStore.save('test-password')).orThrow();

      // Create workspace with the saved file (opens locked keyStore)
      const ws = Workspace.create({
        builtin: false,
        keyStore: { cryptoProvider, file: savedFile }
      }).orThrow();

      expect(ws.state).toBe('locked');
      expect(ws.isReady).toBe(false);

      // Unlock - this tests the full unlock success path and _loadProtectedCollections
      const unlockResult = await ws.unlock('test-password');
      expect(unlockResult).toSucceedAndSatisfy((unlocked) => {
        expect(unlocked.state).toBe('unlocked');
        expect(unlocked.isReady).toBe(true);
      });
    });

    test('unlock when already unlocked returns success', async () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;

      // Create, initialize, and save a keyStore
      const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const savedFile = (await keyStore.save('test-password')).orThrow();

      // Create workspace with the saved file
      const ws = Workspace.create({
        builtin: false,
        keyStore: { cryptoProvider, file: savedFile }
      }).orThrow();

      // First unlock
      await ws.unlock('test-password');

      // Unlock again - should succeed (tests early return path)
      const unlockResult = await ws.unlock('test-password');
      expect(unlockResult).toSucceedAndSatisfy((unlocked) => {
        expect(unlocked.state).toBe('unlocked');
        expect(unlocked.isReady).toBe(true);
      });
    });

    test('lock when unlocked succeeds', async () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;

      // Create, initialize, and save a keyStore
      const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const savedFile = (await keyStore.save('test-password')).orThrow();

      // Create workspace with the saved file
      const ws = Workspace.create({
        builtin: false,
        keyStore: { cryptoProvider, file: savedFile }
      }).orThrow();

      // Unlock the workspace
      await ws.unlock('test-password');
      expect(ws.state).toBe('unlocked');

      // Lock the workspace (no need to save - we're using a saved file already)
      expect(ws.lock()).toSucceedAndSatisfy((locked) => {
        expect(locked.state).toBe('locked');
        expect(locked.isReady).toBe(false);
      });
    });

    test('unlock fails with wrong password', async () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;

      // Create, initialize, and save a keyStore
      const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const savedFile = (await keyStore.save('test-password')).orThrow();

      // Create workspace with the saved file
      const ws = Workspace.create({
        builtin: false,
        keyStore: { cryptoProvider, file: savedFile }
      }).orThrow();

      // Try to unlock with wrong password
      const unlockResult = await ws.unlock('wrong-password');
      expect(unlockResult).toFailWith(/failed to unlock key store/i);
      expect(ws.state).toBe('locked');
    });

    test('lock fails with unsaved changes', async () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;

      // Create, initialize, and save a keyStore
      const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const savedFile = (await keyStore.save('test-password')).orThrow();

      // Create workspace with the saved file
      const ws = Workspace.create({
        builtin: false,
        keyStore: { cryptoProvider, file: savedFile }
      }).orThrow();

      // Unlock the workspace
      await ws.unlock('test-password');

      // Add a secret (makes keyStore dirty)
      await ws.keyStore!.addSecret('test-secret');
      expect(ws.keyStore!.isDirty).toBe(true);

      // Try to lock without saving - should fail
      expect(ws.lock()).toFailWith(/failed to lock key store/i);
      expect(ws.state).toBe('unlocked');
    });

    test('creates workspace with existing keyStore file', async () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;

      // Create and save a keyStore first
      const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const savedFile = (await keyStore.save('test-password')).orThrow();

      // Create workspace with the saved file
      expect(
        Workspace.create({
          builtin: false,
          keyStore: { cryptoProvider, file: savedFile }
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.state).toBe('locked');
        expect(ws.keyStore).toBeDefined();
        expect(ws.isReady).toBe(false);
      });
    });

    test('fails to create workspace with invalid keyStore file', () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;
      const invalidFile = { format: 'invalid' };

      expect(
        Workspace.create({
          builtin: false,
          keyStore: { cryptoProvider, file: invalidFile as unknown as CryptoUtils.KeyStore.IKeyStoreFile }
        })
      ).toFailWith(/failed to open key store/i);
    });
  });

  // ============================================================================
  // Scenario: createWithSettings with keyStore file
  // ============================================================================

  describe('createWithSettings with keyStore', () => {
    function createSettingsFileTree(): FileTree.IFileTreeDirectoryItem {
      const bootstrapSettings: IBootstrapSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        includeBuiltIn: true,
        localStorage: { library: true, userData: true },
        externalLibraries: []
      };
      const preferencesSettings: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/settings/bootstrap.json', contents: bootstrapSettings },
        { path: '/library/data/settings/preferences.json', contents: preferencesSettings }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      return tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
    }

    test('creates workspace with settings and existing keyStore file', async () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;
      const fileTree = createSettingsFileTree();
      const testDeviceId = 'test-device' as unknown as DeviceId;
      const settings = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      // Create and save a keyStore
      const keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const savedFile = (await keyStore.save('test-password')).orThrow();

      expect(
        Workspace.createWithSettings({
          builtin: false,
          settings,
          keyStore: { cryptoProvider, file: savedFile }
        })
      ).toSucceedAndSatisfy((ws) => {
        expect(ws.state).toBe('locked');
        expect(ws.settings).toBe(settings);
        expect(ws.keyStore).toBeDefined();
      });
    });

    test('fails with invalid keyStore file', () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;
      const fileTree = createSettingsFileTree();
      const testDeviceId = 'test-device' as unknown as DeviceId;
      const settings = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      const invalidFile = { format: 'invalid' };

      expect(
        Workspace.createWithSettings({
          builtin: false,
          settings,
          keyStore: { cryptoProvider, file: invalidFile as unknown as CryptoUtils.KeyStore.IKeyStoreFile }
        })
      ).toFailWith(/failed to open key store/i);
    });
  });
});
