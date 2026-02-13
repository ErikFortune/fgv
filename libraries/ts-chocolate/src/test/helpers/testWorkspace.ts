/*
 * Copyright (c) 2026 Erik Fortune
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

/**
 * Test workspace factory for creating pre-configured workspaces in tests.
 *
 * Eliminates boilerplate for:
 * - In-memory FileTree creation with settings files
 * - SettingsManager setup
 * - Entity fixture data (ingredients, fillings, confections)
 * - Workspace assembly via Workspace.create / Workspace.createWithSettings
 */

import { Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';

import {
  BaseIngredientId,
  BaseFillingId,
  BaseConfectionId,
  CollectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  FillingId,
  FillingName,
  FillingRecipeVariationSpec,
  IngredientId,
  Measurement,
  Model as CommonModel,
  Percentage,
  SlotId
} from '../../packlets/common';
import {
  Confections,
  ConfectionsLibrary,
  FillingsLibrary,
  IChocolateIngredientEntity,
  IFillingRecipeEntity,
  IGanacheCharacteristics,
  IIngredientEntity,
  IngredientsLibrary,
  JournalLibrary
} from '../../packlets/entities';
import { IWorkspace, Workspace } from '../../packlets/workspace';
import {
  DeviceId,
  ICommonSettings,
  IDeviceSettings,
  ISettingsManager,
  SETTINGS_SCHEMA_VERSION,
  SettingsManager
} from '../../packlets/settings';

// ============================================================================
// Fixture Data
// ============================================================================

const TEST_DEVICE_ID: DeviceId = 'test-device' as unknown as DeviceId;

const darkChocolateChars: IGanacheCharacteristics = {
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

const darkChocolateEntity: IChocolateIngredientEntity = {
  baseId: 'dark-chocolate' as BaseIngredientId,
  name: 'Dark Chocolate 70%',
  category: 'chocolate',
  chocolateType: 'dark',
  cacaoPercentage: 70 as Percentage,
  ganacheCharacteristics: darkChocolateChars
};

const creamEntity: IIngredientEntity = {
  baseId: 'cream' as BaseIngredientId,
  name: 'Heavy Cream',
  category: 'dairy',
  ganacheCharacteristics: creamChars
};

const testGanacheRecipe: IFillingRecipeEntity = {
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

const testRolledTruffleEntity: Confections.RolledTruffleRecipeEntity = {
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

// ============================================================================
// Fixture Data Exports (for tests that need direct access)
// ============================================================================

/**
 * Pre-built fixture entity data for use in tests.
 * @public
 */
export const fixtures = {
  deviceId: TEST_DEVICE_ID,
  darkChocolate: darkChocolateEntity,
  cream: creamEntity,
  ganacheRecipe: testGanacheRecipe,
  rolledTruffle: testRolledTruffleEntity,
  darkChocolateChars,
  creamChars
} as const;

// ============================================================================
// Test Workspace Options
// ============================================================================

/**
 * Options for creating a test workspace.
 * @public
 */
export interface ITestWorkspaceOptions {
  /**
   * Whether to include built-in data.
   * @defaultValue false
   */
  readonly builtin?: boolean;

  /**
   * Whether to include fixture entity data (ingredients, fillings, confections).
   * @defaultValue false
   */
  readonly withFixtureData?: boolean;

  /**
   * Whether to include a SettingsManager (requires in-memory FileTree).
   * @defaultValue false
   */
  readonly withSettings?: boolean;

  /**
   * Whether to include a key store (crypto provider + optional saved file).
   * @defaultValue false
   */
  readonly withKeyStore?: boolean;

  /**
   * Whether to include an empty JournalLibrary.
   * @defaultValue false
   */
  readonly withJournals?: boolean;

  /**
   * Device ID to use for settings.
   * @defaultValue 'test-device'
   */
  readonly deviceId?: DeviceId;

  /**
   * Additional in-memory files to include in the FileTree.
   * Only used when withSettings is true.
   */
  readonly additionalFiles?: FileTree.IInMemoryFile[];
}

// ============================================================================
// Test Workspace Result
// ============================================================================

/**
 * Result of creating a test workspace, including the workspace and
 * any intermediate objects that tests might need to inspect.
 * @public
 */
export interface ITestWorkspaceResult {
  readonly workspace: IWorkspace;
  readonly settings?: ISettingsManager;
  readonly ingredients?: IngredientsLibrary;
  readonly fillings?: FillingsLibrary;
  readonly confections?: ConfectionsLibrary;
  readonly journals?: JournalLibrary;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates fixture entity libraries (ingredients, fillings, confections).
 * @returns Object with pre-built libraries
 * @internal
 */
function createFixtureLibraries(): {
  ingredients: IngredientsLibrary;
  fillings: FillingsLibrary;
  confections: ConfectionsLibrary;
} {
  const ingredients = IngredientsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: false,
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'dark-chocolate': darkChocolateEntity,
          cream: creamEntity
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      }
    ]
  }).orThrow();

  const fillings = FillingsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: false,
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'test-ganache': testGanacheRecipe
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      }
    ]
  }).orThrow();

  const confections = ConfectionsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: false,
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'test-rolled-truffle': testRolledTruffleEntity
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      }
    ]
  }).orThrow();

  return { ingredients, fillings, confections };
}

/**
 * Creates an in-memory FileTree with settings files.
 * @param deviceId - Device ID for settings
 * @param additionalFiles - Extra files to include
 * @returns FileTree directory item rooted at /library
 * @internal
 */
function createSettingsFileTree(
  deviceId: DeviceId,
  additionalFiles?: FileTree.IInMemoryFile[]
): FileTree.IFileTreeDirectoryItem {
  const commonSettings: ICommonSettings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION
  };
  const deviceSettings: IDeviceSettings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    deviceId
  };

  const files: FileTree.IInMemoryFile[] = [
    { path: '/library/data/settings/common.json', contents: commonSettings },
    { path: `/library/data/settings/device-${deviceId}.json`, contents: deviceSettings },
    ...(additionalFiles ?? [])
  ];

  const tree = FileTree.inMemory(files).orThrow();
  return tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
}

/**
 * Creates a test workspace with the specified configuration.
 *
 * @example
 * ```typescript
 * // Minimal empty workspace
 * const { workspace } = createTestWorkspace().orThrow();
 *
 * // Workspace with fixture data
 * const { workspace, ingredients } = createTestWorkspace({ withFixtureData: true }).orThrow();
 *
 * // Workspace with settings and key store
 * const { workspace, settings } = createTestWorkspace({
 *   withSettings: true,
 *   withKeyStore: true
 * }).orThrow();
 *
 * // Full workspace with everything
 * const result = createTestWorkspace({
 *   withFixtureData: true,
 *   withSettings: true,
 *   withKeyStore: true,
 *   withJournals: true
 * }).orThrow();
 * ```
 *
 * @param options - Configuration options
 * @returns Success with test workspace result, or Failure
 * @public
 */
export function createTestWorkspace(options?: ITestWorkspaceOptions): Result<ITestWorkspaceResult> {
  const opts = options ?? {};
  const deviceId = opts.deviceId ?? TEST_DEVICE_ID;
  const builtin = opts.builtin ?? false;

  // Build fixture libraries if requested
  const fixtureLibs = opts.withFixtureData ? createFixtureLibraries() : undefined;

  // Build journals if requested
  const journals = opts.withJournals ? JournalLibrary.create({ builtin: false }).orThrow() : undefined;

  // Build key store config if requested
  const keyStore = opts.withKeyStore ? { cryptoProvider: CryptoUtils.nodeCryptoProvider } : undefined;

  if (opts.withSettings) {
    // Use createWithSettings path
    const fileTree = createSettingsFileTree(deviceId, opts.additionalFiles);

    return SettingsManager.create({ fileTree, deviceId }).onSuccess((settings) => {
      return Workspace.createWithSettings({
        builtin,
        libraries: fixtureLibs,
        journals,
        keyStore,
        settings
      }).onSuccess((workspace) => {
        return succeed({
          workspace,
          settings,
          ...fixtureLibs,
          journals
        });
      });
    });
  }

  // Use simple create path
  return Workspace.create({
    builtin,
    libraries: fixtureLibs,
    journals,
    keyStore
  }).onSuccess((workspace) => {
    return succeed({
      workspace,
      ...fixtureLibs,
      journals
    });
  });
}

/**
 * Creates an in-memory FileTree directory item for use in tests.
 * Convenience wrapper around FileTree.inMemory.
 *
 * @param files - In-memory files to include. Defaults to a single placeholder.
 * @returns FileTree directory item rooted at /
 * @public
 */
export function createInMemoryTree(files?: FileTree.IInMemoryFile[]): FileTree.IFileTreeDirectoryItem {
  const inMemoryFiles = files ?? [{ path: '/placeholder.txt', contents: '' }];
  const tree = FileTree.inMemory(inMemoryFiles).orThrow();
  return tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;
}

/**
 * Creates a settings FileTree and SettingsManager for use in tests.
 *
 * @param deviceId - Device ID for settings. Defaults to 'test-device'.
 * @returns Object with fileTree and settings manager
 * @public
 */
export function createTestSettings(deviceId?: DeviceId): {
  fileTree: FileTree.IFileTreeDirectoryItem;
  settings: ISettingsManager;
} {
  const id = deviceId ?? TEST_DEVICE_ID;
  const fileTree = createSettingsFileTree(id);
  const settings = SettingsManager.create({ fileTree, deviceId: id }).orThrow();
  return { fileTree, settings };
}
