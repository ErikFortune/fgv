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
import { CollectionId } from '../../../packlets/common';
import { SubLibraryId } from '../../../packlets/library-data';
import {
  IResolvedSettings,
  StorageRootId,
  DeviceId,
  ISettingsValidationContext,
  validateResolvedSettings
} from '../../../packlets/settings';

// ============================================================================
// Test Helpers
// ============================================================================

function makeRoot(id: string): StorageRootId {
  return id as StorageRootId;
}

function makeCollection(id: string): CollectionId {
  return id as CollectionId;
}

function makeDeviceId(id: string): DeviceId {
  return id as DeviceId;
}

function makeResolved(overrides?: Partial<IResolvedSettings>): IResolvedSettings {
  return {
    deviceId: makeDeviceId('test-device'),
    defaultTargets: {},
    tools: {
      scaling: {
        weightUnit: 'g',
        measurementUnit: 'g',
        batchMultiplier: 1,
        bufferPercentage: 0.1
      },
      workflow: {}
    },
    ...overrides
  };
}

function makeContext(
  roots: string[],
  collections?: Partial<Record<string, string[]>>
): ISettingsValidationContext {
  const availableRoots = new Set(roots.map(makeRoot));
  const availableCollections = collections
    ? (Object.fromEntries(
        Object.entries(collections).map(([k, v]) => [k, new Set((v ?? []).map(makeCollection))])
      ) as Partial<Record<SubLibraryId, ReadonlySet<CollectionId>>>)
    : undefined;
  return { availableRoots, availableCollections };
}

// ============================================================================
// Tests
// ============================================================================

describe('validateResolvedSettings', () => {
  // ============================================================================
  // No warnings
  // ============================================================================

  describe('returns no warnings', () => {
    test('when resolved settings have no storage targets or default targets', () => {
      const resolved = makeResolved();
      const context = makeContext([]);
      expect(validateResolvedSettings(resolved, context)).toEqual([]);
    });

    test('when globalDefault root is available', () => {
      const resolved = makeResolved({
        defaultStorageTargets: { globalDefault: makeRoot('localStorage') }
      });
      const context = makeContext(['localStorage']);
      expect(validateResolvedSettings(resolved, context)).toEqual([]);
    });

    test('when sublibrary override roots are all available', () => {
      const resolved = makeResolved({
        defaultStorageTargets: {
          sublibraryOverrides: {
            ingredients: makeRoot('external-lib'),
            fillings: makeRoot('localStorage')
          }
        }
      });
      const context = makeContext(['localStorage', 'external-lib']);
      expect(validateResolvedSettings(resolved, context)).toEqual([]);
    });

    test('when defaultTargets collections all exist', () => {
      const resolved = makeResolved({
        defaultTargets: {
          ingredients: makeCollection('my-ingredients') as never,
          fillings: makeCollection('my-fillings') as never
        }
      });
      const context = makeContext([], {
        ingredients: ['my-ingredients', 'other'],
        fillings: ['my-fillings']
      });
      expect(validateResolvedSettings(resolved, context)).toEqual([]);
    });

    test('skips collection check when availableCollections not provided', () => {
      const resolved = makeResolved({
        defaultTargets: {
          ingredients: makeCollection('nonexistent') as never
        }
      });
      const context = makeContext([]);
      expect(validateResolvedSettings(resolved, context)).toEqual([]);
    });

    test('skips collection check for sub-library not in availableCollections', () => {
      const resolved = makeResolved({
        defaultTargets: {
          ingredients: makeCollection('my-ingredients') as never
        }
      });
      // availableCollections provided but doesn't include 'ingredients'
      const context = makeContext([], { fillings: ['some-filling'] });
      expect(validateResolvedSettings(resolved, context)).toEqual([]);
    });
  });

  // ============================================================================
  // missing-root warnings
  // ============================================================================

  describe('missing-root warnings', () => {
    test('warns when globalDefault root is missing', () => {
      const resolved = makeResolved({
        defaultStorageTargets: { globalDefault: makeRoot('missing-root') }
      });
      const context = makeContext(['localStorage']);
      const warnings = validateResolvedSettings(resolved, context);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        kind: 'missing-root',
        rootId: 'missing-root',
        context: 'defaultStorageTargets.globalDefault'
      });
    });

    test('warns when sublibrary override root is missing', () => {
      const resolved = makeResolved({
        defaultStorageTargets: {
          sublibraryOverrides: {
            ingredients: makeRoot('gone-root')
          }
        }
      });
      const context = makeContext(['localStorage']);
      const warnings = validateResolvedSettings(resolved, context);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        kind: 'missing-root',
        rootId: 'gone-root',
        context: 'defaultStorageTargets.sublibraryOverrides.ingredients'
      });
    });

    test('warns for each missing sublibrary override root', () => {
      const resolved = makeResolved({
        defaultStorageTargets: {
          globalDefault: makeRoot('ok-root'),
          sublibraryOverrides: {
            ingredients: makeRoot('missing-1'),
            fillings: makeRoot('missing-2'),
            confections: makeRoot('ok-root')
          }
        }
      });
      const context = makeContext(['ok-root']);
      const warnings = validateResolvedSettings(resolved, context);
      expect(warnings).toHaveLength(2);
      expect(warnings.map((w) => w.kind)).toEqual(['missing-root', 'missing-root']);
      const rootIds = warnings.map((w) => (w as { rootId: string }).rootId);
      expect(rootIds).toContain('missing-1');
      expect(rootIds).toContain('missing-2');
    });

    test('warns for both globalDefault and sublibrary override when both missing', () => {
      const resolved = makeResolved({
        defaultStorageTargets: {
          globalDefault: makeRoot('missing-global'),
          sublibraryOverrides: {
            ingredients: makeRoot('missing-sub')
          }
        }
      });
      const context = makeContext([]);
      const warnings = validateResolvedSettings(resolved, context);
      expect(warnings).toHaveLength(2);
    });
  });

  // ============================================================================
  // missing-collection warnings
  // ============================================================================

  describe('missing-collection warnings', () => {
    test('warns when defaultTarget collection does not exist', () => {
      const resolved = makeResolved({
        defaultTargets: {
          ingredients: makeCollection('nonexistent-collection') as never
        }
      });
      const context = makeContext([], {
        ingredients: ['existing-collection']
      });
      const warnings = validateResolvedSettings(resolved, context);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        kind: 'missing-collection',
        subLibraryId: 'ingredients',
        collectionId: 'nonexistent-collection',
        context: 'defaultTargets.ingredients'
      });
    });

    test('warns for each missing collection across sub-libraries', () => {
      const resolved = makeResolved({
        defaultTargets: {
          ingredients: makeCollection('missing-ing') as never,
          fillings: makeCollection('missing-fill') as never,
          confections: makeCollection('ok-conf') as never
        }
      });
      const context = makeContext([], {
        ingredients: ['other-ing'],
        fillings: ['other-fill'],
        confections: ['ok-conf']
      });
      const warnings = validateResolvedSettings(resolved, context);
      expect(warnings).toHaveLength(2);
      expect(warnings.every((w) => w.kind === 'missing-collection')).toBe(true);
    });
  });

  // ============================================================================
  // Mixed warnings
  // ============================================================================

  describe('mixed warnings', () => {
    test('returns both missing-root and missing-collection warnings', () => {
      const resolved = makeResolved({
        defaultStorageTargets: { globalDefault: makeRoot('gone') },
        defaultTargets: {
          ingredients: makeCollection('gone-collection') as never
        }
      });
      const context = makeContext(['localStorage'], {
        ingredients: ['existing']
      });
      const warnings = validateResolvedSettings(resolved, context);
      expect(warnings).toHaveLength(2);
      const kinds = warnings.map((w) => w.kind);
      expect(kinds).toContain('missing-root');
      expect(kinds).toContain('missing-collection');
    });
  });
});
