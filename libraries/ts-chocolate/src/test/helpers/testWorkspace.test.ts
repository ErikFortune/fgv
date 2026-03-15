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

import '@fgv/ts-utils-jest';

import { ConfectionId, FillingId, IngredientId } from '../../packlets/common';
import { DeviceId } from '../../packlets/settings';
import { createTestWorkspace, createInMemoryTree, createTestSettings, fixtures } from './testWorkspace';

describe('TestWorkspace helpers', () => {
  // ============================================================================
  // fixtures
  // ============================================================================

  describe('fixtures', () => {
    test('exports expected fixture data', () => {
      expect(fixtures.deviceId).toBeDefined();
      expect(fixtures.darkChocolate).toBeDefined();
      expect(fixtures.cream).toBeDefined();
      expect(fixtures.ganacheRecipe).toBeDefined();
      expect(fixtures.rolledTruffle).toBeDefined();
      expect(fixtures.darkChocolateChars).toBeDefined();
      expect(fixtures.creamChars).toBeDefined();
    });

    test('fixture entities have expected base IDs', () => {
      expect(fixtures.darkChocolate.baseId).toBe('dark-chocolate');
      expect(fixtures.cream.baseId).toBe('cream');
      expect(fixtures.ganacheRecipe.baseId).toBe('test-ganache');
      expect(fixtures.rolledTruffle.baseId).toBe('test-rolled-truffle');
    });
  });

  // ============================================================================
  // createInMemoryTree
  // ============================================================================

  describe('createInMemoryTree', () => {
    test('creates tree with default placeholder file', () => {
      const tree = createInMemoryTree();
      expect(tree).toBeDefined();
      expect(tree.type).toBe('directory');
    });

    test('creates tree with custom files', () => {
      const tree = createInMemoryTree([{ path: '/data/test.json', contents: { key: 'value' } }]);
      expect(tree).toBeDefined();
      const children = tree.getChildren().orThrow();
      expect(children.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // createTestSettings
  // ============================================================================

  describe('createTestSettings', () => {
    test('creates settings with default device ID', () => {
      const { fileTree, settings } = createTestSettings();
      expect(fileTree).toBeDefined();
      expect(settings).toBeDefined();
    });

    test('creates settings with custom device ID', () => {
      const customId = 'custom-device' as unknown as DeviceId;
      const { settings } = createTestSettings(customId);
      expect(settings).toBeDefined();
    });
  });

  // ============================================================================
  // createTestWorkspace
  // ============================================================================

  describe('createTestWorkspace', () => {
    test('creates minimal empty workspace with no options', () => {
      expect(createTestWorkspace()).toSucceedAndSatisfy((result) => {
        expect(result.workspace).toBeDefined();
        expect(result.workspace.state).toBe('no-keystore');
        expect(result.workspace.isReady).toBe(true);
        expect(result.settings).toBeUndefined();
        expect(result.ingredients).toBeUndefined();
        expect(result.fillings).toBeUndefined();
        expect(result.confections).toBeUndefined();
        expect(result.journals).toBeUndefined();
      });
    });

    test('creates workspace with fixture data', () => {
      expect(createTestWorkspace({ withFixtureData: true })).toSucceedAndSatisfy((result) => {
        expect(result.workspace).toBeDefined();
        expect(result.ingredients).toBeDefined();
        expect(result.fillings).toBeDefined();
        expect(result.confections).toBeDefined();

        // Verify fixture data is accessible through the workspace
        expect(result.workspace.data.ingredients.get('test.dark-chocolate' as IngredientId)).toSucceed();
        expect(result.workspace.data.ingredients.get('test.cream' as IngredientId)).toSucceed();
        expect(result.workspace.data.fillings.get('test.test-ganache' as FillingId)).toSucceed();
        expect(result.workspace.data.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceed();
      });
    });

    test('creates workspace with settings', () => {
      expect(createTestWorkspace({ withSettings: true })).toSucceedAndSatisfy((result) => {
        expect(result.workspace).toBeDefined();
        expect(result.settings).toBeDefined();
        expect(result.workspace.settings).toBe(result.settings);
      });
    });

    test('creates workspace with key store', () => {
      expect(createTestWorkspace({ withKeyStore: true })).toSucceedAndSatisfy((result) => {
        expect(result.workspace).toBeDefined();
        // New (uninitialized) keystore reports 'no-keystore' state
        expect(result.workspace.state).toBe('no-keystore');
        expect(result.workspace.keyStore).toBeDefined();
        expect(result.workspace.isReady).toBe(true);
      });
    });

    test('creates workspace with journals', () => {
      expect(createTestWorkspace({ withJournals: true })).toSucceedAndSatisfy((result) => {
        expect(result.workspace).toBeDefined();
        expect(result.journals).toBeDefined();
      });
    });

    test('creates workspace with all options', () => {
      expect(
        createTestWorkspace({
          withFixtureData: true,
          withSettings: true,
          withKeyStore: true,
          withJournals: true
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.workspace).toBeDefined();
        expect(result.settings).toBeDefined();
        expect(result.ingredients).toBeDefined();
        expect(result.fillings).toBeDefined();
        expect(result.confections).toBeDefined();
        expect(result.journals).toBeDefined();
        // New (uninitialized) keystore reports 'no-keystore' state
        expect(result.workspace.state).toBe('no-keystore');
        expect(result.workspace.settings).toBe(result.settings);
      });
    });

    test('creates workspace with custom device ID', () => {
      const customId = 'my-test-device' as unknown as DeviceId;
      expect(createTestWorkspace({ withSettings: true, deviceId: customId })).toSucceedAndSatisfy(
        (result) => {
          expect(result.workspace).toBeDefined();
          expect(result.settings).toBeDefined();
        }
      );
    });

    test('creates workspace with builtin data', () => {
      expect(createTestWorkspace({ builtin: true })).toSucceedAndSatisfy((result) => {
        expect(result.workspace).toBeDefined();
        expect(result.workspace.data).toBeDefined();
      });
    });

    test('creates workspace with fixture data and settings combined', () => {
      expect(createTestWorkspace({ withFixtureData: true, withSettings: true })).toSucceedAndSatisfy(
        (result) => {
          expect(result.workspace).toBeDefined();
          expect(result.settings).toBeDefined();
          expect(result.ingredients).toBeDefined();
          expect(result.workspace.data.ingredients.get('test.dark-chocolate' as IngredientId)).toSucceed();
        }
      );
    });
  });
});
